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
    if (!res.ok) {
      await chrome.storage.local.remove(["accessToken", "refreshToken", "tokenExpiresAt", "user"]);
      return null;
    }
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
  const { accessToken, refreshToken, tokenExpiresAt } = await chrome.storage.local.get(["accessToken", "refreshToken", "tokenExpiresAt"]);
  if (!accessToken) return null;
  const expSec = Number(tokenExpiresAt) || 0;
  if (!expSec) {
    if (!refreshToken) return null;
    refreshing ??= refreshAccessToken().finally(() => { refreshing = null; });
    return (await refreshing) ?? null;
  }
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

// ---- Account settings (synced from the web app's user_metadata) -----------

const SETTINGS_DEFAULTS = {
  auto_cluster: true,
  ignore_glances: true,
  pause_idle: true,
  capture_private: false,
  local_first: true,
  strip_ids: true,
  anon_insights: false,
  src_papers: true,
  src_github: true,
  src_video: true,
  src_social: true,
};
let settings = { ...SETTINGS_DEFAULTS };

// Runtime capture gates.
let idlePaused = false;
const incognitoTabs = new Set();
const pendingVisits = new Map(); // tabId -> timeout id (ignore-glances dwell gate)
const GLANCE_DWELL_MS = 6000;

async function loadSettings() {
  const { settings: stored } = await chrome.storage.local.get("settings");
  if (stored) settings = { ...SETTINGS_DEFAULTS, ...stored };
}

// Pull the latest settings the user saved on the web app.
async function fetchSettings() {
  const token = await getValidAccessToken();
  if (!token) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const user = await res.json();
    const remote = user?.user_metadata?.settings;
    if (remote && typeof remote === "object") {
      settings = { ...SETTINGS_DEFAULTS, ...remote };
      await chrome.storage.local.set({ settings });
    }
  } catch {
    /* offline — keep cached settings */
  }
}

// Strip query/hash from a captured URL when the privacy toggle is on.
function cleanUrl(url) {
  if (!settings.strip_ids) return url;
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

// Honor the per-source toggles. Unmapped domains are always allowed.
function sourceAllowed(host) {
  const h = host.replace(/^www\./, "");
  if (h === "github.com" || h.endsWith(".github.com")) return settings.src_github;
  if (h === "arxiv.org" || h.endsWith(".arxiv.org")) return settings.src_papers;
  if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com")) return settings.src_video;
  if (h === "reddit.com" || h.endsWith(".reddit.com") || h === "x.com" || h === "twitter.com") return settings.src_social;
  return true;
}

function captureActive() {
  return captureState === "recording" && !idlePaused;
}

// Hold a visit briefly so quick glances (left within the dwell window) drop out
// when "Ignore quick glances" is on.
function scheduleVisit(tabId, event) {
  if (!settings.ignore_glances) {
    enqueue(event);
    return;
  }
  const prev = pendingVisits.get(tabId);
  if (prev) clearTimeout(prev);
  const timer = setTimeout(() => {
    pendingVisits.delete(tabId);
    enqueue(event);
  }, GLANCE_DWELL_MS);
  pendingVisits.set(tabId, timer);
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

// Load cached settings immediately, then refresh from the account.
loadSettings().then(fetchSettings);

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
    void fetchSettings();
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
  if (!captureActive()) return;
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
    const res = await fetch(`${BACKEND_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ sessionId, events: batch }),
    });
    if (!res.ok) throw new Error(`events failed: ${res.status}`);
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
        void fetchSettings();
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
    .then(() => {
      void fetchSettings();
      sendResponse({ ok: true });
    });

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
  // Incognito stays incognito unless the user opted in.
  if (incognitoTabs.has(details.tabId) && !settings.capture_private) return;

  const previous = tabUrl.get(details.tabId);
  tabUrl.set(details.tabId, details.url);

  const host = hostnameOf(details.url);
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

  // Respect the per-source toggles.
  if (!sourceAllowed(host)) return;

  scheduleVisit(details.tabId, {
    type: "visit",
    tabId: details.tabId,
    url: cleanUrl(details.url),
    domain: host,
    // transitionType tells us link-click vs typed vs reload — the chain signal.
    transition: details.transitionType,
    referrer: previous ? cleanUrl(previous) : null,
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
  if (tab.incognito && tab.id != null) incognitoTabs.add(tab.id);
  if (tab.incognito && !settings.capture_private) return;
  enqueue({ type: "tab_open", tabId: tab.id, url: tab.pendingUrl || tab.url || null });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  // A still-pending visit means the tab was closed within the glance window — drop it.
  const pending = pendingVisits.get(tabId);
  if (pending) {
    clearTimeout(pending);
    pendingVisits.delete(tabId);
  }
  enqueue({ type: "tab_close", tabId, url: tabUrl.get(tabId) ?? null });
  tabUrl.delete(tabId);
  incognitoTabs.delete(tabId);
});

// ---- Idle: pause capture when the user steps away -------------------------

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  idlePaused = settings.pause_idle && state !== "active";
});

// ---- Periodic flush + settings sync ---------------------------------------

chrome.alarms.create("flush", { periodInMinutes: FLUSH_INTERVAL_MS / 60000 });
chrome.alarms.create("settings", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "flush") flush();
  if (a.name === "settings") fetchSettings();
});
