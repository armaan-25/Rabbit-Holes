import { BACKEND_URL, WEB_URL, SUPABASE_URL, SUPABASE_ANON_KEY, FLUSH_AT, FLUSH_INTERVAL_MS, IGNORED_DOMAINS } from "./config.js";

/**
 * Rabbit Holes capture worker.
 *
 * Listens to the browser's navigation surface and emits a normalized event
 * stream — tab opens/closes, URL visits, search queries, and the navigation
 * chain (which page led to which). Events are buffered, persisted locally, and
 * flushed to the FastAPI backend, which clusters them into rabbit holes.
 */

let sessionId = crypto.randomUUID();
let captureState = "recording";
let buffer = [];

// Recording-time accounting. `startedAt` is when the current recording run
// began (null while paused/stopped); `elapsedMs` is time banked from earlier
// runs. Live elapsed = elapsedMs + (startedAt ? now - startedAt : 0).
let captureStartedAt = null;
let captureElapsedMs = 0;

// Remembers the last committed URL per tab so we can reconstruct chains and
// detect close events with the URL still attached.
const tabUrl = new Map();

// In-flight refresh so concurrent callers share one network request.
let refreshing = null;

async function refreshAccessToken() {
  const { refreshToken } = await chrome.storage.local.get("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access_token) return null;
    const next = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      tokenExpiresAt: data.expires_at ?? null,
    };
    if (data.user) next.user = { id: data.user.id ?? null, email: data.user.email ?? null };
    await chrome.storage.local.set(next);
    return data.access_token;
  } catch {
    return null;
  }
}

// Returns a non-expired access token, refreshing a minute early when needed.
async function getValidAccessToken() {
  const { accessToken, tokenExpiresAt } = await chrome.storage.local.get(["accessToken", "tokenExpiresAt"]);
  if (!accessToken) return null;
  const expSec = Number(tokenExpiresAt) || 0;
  if (expSec && Date.now() / 1000 > expSec - 60) {
    refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
    return (await refreshing) ?? null;
  }
  return accessToken;
}

async function authHeaders() {
  const token = await getValidAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function persistTimer() {
  return chrome.storage.local.set({ captureStartedAt, captureElapsedMs });
}

chrome.storage.local.get(["captureState", "sessionId", "captureStartedAt", "captureElapsedMs"]).then((stored) => {
  captureState = stored.captureState || "recording";
  sessionId = stored.sessionId || sessionId;
  captureElapsedMs = stored.captureElapsedMs || 0;
  captureStartedAt = stored.captureStartedAt ?? null;
  // Start the clock on first run (default state is "recording").
  if (captureState === "recording" && captureStartedAt == null) captureStartedAt = Date.now();
  chrome.storage.local.set({ captureState, sessionId, captureStartedAt, captureElapsedMs });
});

const SEARCH_ENGINES = [
  { host: "www.google.com", param: "q", name: "Google" },
  { host: "www.bing.com", param: "q", name: "Bing" },
  { host: "duckduckgo.com", param: "q", name: "DuckDuckGo" },
  { host: "www.perplexity.ai", param: "q", name: "Perplexity" },
];

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function isCapturable(url) {
  if (!url || !/^https?:/.test(url)) return false;
  if (url.startsWith(`${WEB_URL}/rabbit-auth`)) return false;
  const host = hostnameOf(url);
  return !IGNORED_DOMAINS.includes(host);
}

async function captureAuthFromUrl(url, tabId) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== WEB_URL || parsed.pathname !== "/rabbit-auth") return false;
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const accessToken = hash.get("accessToken");
    if (!accessToken) return false;

    await chrome.storage.local.set({
      accessToken,
      refreshToken: hash.get("refreshToken") || null,
      tokenExpiresAt: hash.get("expiresAt") || null,
      user: {
        id: hash.get("userId") || null,
        email: hash.get("email") || null,
      },
    });
    if (tabId >= 0) chrome.tabs.remove(tabId).catch(() => null);
    return true;
  } catch {
    return false;
  }
}

function detectSearch(url) {
  const host = hostnameOf(url);
  const engine = SEARCH_ENGINES.find((e) => e.host === host);
  if (!engine) return null;
  try {
    const q = new URL(url).searchParams.get(engine.param);
    return q ? { query: q, engine: engine.name } : null;
  } catch {
    return null;
  }
}

function enqueue(event) {
  if (captureState !== "recording") return;
  const enriched = { ...event, sessionId, at: new Date().toISOString() };
  buffer.push(enriched);
  persist(enriched);
  if (buffer.length >= FLUSH_AT) flush();
}

async function persist(event) {
  const { events = [] } = await chrome.storage.local.get("events");
  events.push(event);
  // Keep local history bounded.
  const trimmed = events.slice(-500);
  await chrome.storage.local.set({ events: trimmed, lastCapture: event.at });
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  try {
    const auth = await authHeaders();
    await fetch(`${BACKEND_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ sessionId, events: batch }),
    });
  } catch {
    // Backend offline — keep the batch so we don't lose it.
    buffer = batch.concat(buffer);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "rabbitHolesAuth") {
    chrome.storage.local
      .set({
        accessToken: message.accessToken,
        refreshToken: message.refreshToken,
        tokenExpiresAt: message.expiresAt,
        user: message.user ?? null,
      })
      .then(() => {
        if (_sender.tab?.id != null) chrome.tabs.remove(_sender.tab.id).catch(() => null);
        sendResponse({ ok: true });
      });
    return true;
  }

  if (message?.type === "getAuthState") {
    chrome.storage.local.get(["accessToken", "user"]).then(({ accessToken, user }) => {
      sendResponse({ ok: true, signedIn: Boolean(accessToken), user: user ?? null });
    });
    return true;
  }

  if (message?.type === "getValidToken") {
    getValidAccessToken().then((token) => sendResponse({ ok: true, token: token ?? null }));
    return true;
  }

  if (message?.type === "refreshToken") {
    refreshAccessToken().then((token) => sendResponse({ ok: true, token: token ?? null }));
    return true;
  }

  if (message?.type === "signOut") {
    chrome.storage.local.remove(["accessToken", "refreshToken", "tokenExpiresAt", "user"]).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message?.type === "getCaptureState") {
    sendResponse({ ok: true, state: captureState, buffered: buffer.length });
    return false;
  }

  if (message?.type === "setCaptureState") {
    const next = message.state;
    if (!["recording", "paused", "stopped"].includes(next)) {
      sendResponse({ ok: false, error: "invalid capture state" });
      return false;
    }

    // Bank the running time before switching away from "recording".
    if (captureState === "recording" && captureStartedAt != null) {
      captureElapsedMs += Date.now() - captureStartedAt;
      captureStartedAt = null;
    }

    captureState = next;
    if (next === "stopped") {
      buffer = [];
      tabUrl.clear();
      sessionId = crypto.randomUUID();
      captureStartedAt = null;
      captureElapsedMs = 0;
      Promise.all([
        chrome.storage.local.set({ captureState, sessionId, events: [], lastCapture: null, captureStartedAt, captureElapsedMs }),
        authHeaders().then((auth) => fetch(`${BACKEND_URL}/clear`, { method: "POST", headers: auth }).catch(() => null)),
      ]).then(() => sendResponse({ ok: true, state: captureState, buffered: 0 }));
      return true;
    }

    if (next === "recording") captureStartedAt = Date.now();

    chrome.storage.local.set({ captureState, sessionId, captureStartedAt, captureElapsedMs }).then(() => {
      sendResponse({ ok: true, state: captureState, buffered: buffer.length });
    });
    return true;
  }

  if (message?.type !== "flush") return false;

  flush()
    .then(() => sendResponse({ ok: true, buffered: buffer.length }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});

chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "rabbitHolesAuth") return false;

  chrome.storage.local
    .set({
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
      tokenExpiresAt: message.expiresAt,
      user: message.user ?? null,
    })
    .then(() => sendResponse({ ok: true }));

  return true;
});

// ---- Navigation: URL visits + chains -------------------------------------

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // top frame only
  if (details.url.startsWith(`${WEB_URL}/rabbit-auth`)) {
    void captureAuthFromUrl(details.url, details.tabId);
    return;
  }
  if (!isCapturable(details.url)) return;

  const previous = tabUrl.get(details.tabId);
  tabUrl.set(details.tabId, details.url);

  const search = detectSearch(details.url);
  if (search) {
    enqueue({
      type: "search",
      tabId: details.tabId,
      query: search.query,
      engine: search.engine,
      url: details.url,
    });
    return;
  }

  enqueue({
    type: "visit",
    tabId: details.tabId,
    url: details.url,
    domain: hostnameOf(details.url),
    // transitionType tells us link-click vs typed vs reload — the chain signal.
    transition: details.transitionType,
    referrer: previous ?? null,
  });
});

// Pull the page title once it resolves.
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0 || !isCapturable(details.url)) return;
  try {
    const tab = await chrome.tabs.get(details.tabId);
    if (tab?.title) {
      enqueue({ type: "title", tabId: details.tabId, url: details.url, title: tab.title });
    }
  } catch {
    /* tab gone */
  }
});

// ---- Tab lifecycle --------------------------------------------------------

chrome.tabs.onCreated.addListener((tab) => {
  enqueue({ type: "tab_open", tabId: tab.id, url: tab.pendingUrl || tab.url || null });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  enqueue({ type: "tab_close", tabId, url: tabUrl.get(tabId) ?? null });
  tabUrl.delete(tabId);
});

// ---- Periodic flush -------------------------------------------------------

chrome.alarms.create("flush", { periodInMinutes: FLUSH_INTERVAL_MS / 60000 });
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "flush") flush();
});
