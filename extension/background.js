import { WEB_URL, IGNORED_DOMAINS } from "./config.js";

/**
 * Rabbit Holes local-first capture worker.
 *
 * The extension is the product. It records browser navigation metadata into
 * chrome.storage.local. The web app reads that local buffer through
 * stats-bridge.js and builds investigations without Rabbit Hole servers.
 */

let sessionId = crypto.randomUUID();
let captureState = "recording";
let buffer = [];
let captureStartedAt = null;
let captureElapsedMs = 0;

const tabUrl = new Map();
const recentSearches = new Map();
const SEARCH_DEDUPE_MS = 90_000;
const incognitoTabs = new Set();
const pendingVisits = new Map();
const GLANCE_DWELL_MS = 6000;

const SETTINGS_DEFAULTS = {
  auto_cluster: true,
  ignore_glances: true,
  pause_idle: false,
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

const AI_PROVIDER_OPTIONS = {
  anthropic: { baseUrl: "", defaultModel: "claude-sonnet-4-20250514", needsKey: true },
  openai: { baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4.1-mini", needsKey: true },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", defaultModel: "anthropic/claude-sonnet-4", needsKey: true },
  gemini: { baseUrl: "", defaultModel: "gemini-2.5-flash", needsKey: true },
  ollama: { baseUrl: "http://localhost:11434", defaultModel: "llama3.1", needsKey: false },
  lmstudio: { baseUrl: "http://localhost:1234/v1", defaultModel: "local-model", needsKey: false },
  compatible: { baseUrl: "", defaultModel: "model-name", needsKey: false },
};

function providerOption(type) {
  return AI_PROVIDER_OPTIONS[type] || AI_PROVIDER_OPTIONS.openrouter;
}

function providerReady(config) {
  if (!config?.type || !config?.model?.trim()) return false;
  const option = providerOption(config.type);
  if (option.needsKey && !config.apiKey?.trim()) return false;
  if (["compatible", "lmstudio", "ollama"].includes(config.type) && !config.baseUrl?.trim()) return false;
  return true;
}

function openAiBase(config) {
  if (config.type === "openai") return "https://api.openai.com/v1";
  return (config.baseUrl || providerOption(config.type).baseUrl || "").replace(/\/$/, "");
}

async function generateOpenAiCompatible(config, prompt, options = {}) {
  const baseUrl = openAiBase(config);
  if (!baseUrl) throw new Error("Missing provider base URL");
  const headers = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  if (config.type === "openrouter") {
    headers["HTTP-Referer"] = WEB_URL;
    headers["X-Title"] = "Rabbit Holes";
  }
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 900,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

async function generateAnthropic(config, prompt, options = {}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 900,
      temperature: options.temperature ?? 0.2,
      ...(options.system ? { system: options.system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.content?.map((part) => part.text || "").join("\n") || "").trim();
}

async function generateGemini(config, prompt, options = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey || "")}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: options.system ? `${options.system}\n\n${prompt}` : prompt }] }],
      generationConfig: { temperature: options.temperature ?? 0.2, maxOutputTokens: options.maxTokens ?? 900 },
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "").trim();
}

async function generateOllama(config, prompt, options = {}) {
  const baseUrl = (config.baseUrl || providerOption(config.type).baseUrl || "http://localhost:11434").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: prompt },
      ],
      options: { temperature: options.temperature ?? 0.2, num_predict: options.maxTokens ?? 900 },
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.message?.content || json?.response || "").trim();
}

async function generateWithProvider(prompt, options = {}) {
  const { aiProvider = null } = await chrome.storage.local.get("aiProvider");
  if (!providerReady(aiProvider)) return { ok: false, error: "provider-not-configured" };
  if (["openai", "openrouter", "lmstudio", "compatible"].includes(aiProvider.type)) return { ok: true, text: await generateOpenAiCompatible(aiProvider, prompt, options) };
  if (aiProvider.type === "anthropic") return { ok: true, text: await generateAnthropic(aiProvider, prompt, options) };
  if (aiProvider.type === "gemini") return { ok: true, text: await generateGemini(aiProvider, prompt, options) };
  if (aiProvider.type === "ollama") return { ok: true, text: await generateOllama(aiProvider, prompt, options) };
  return { ok: false, error: "provider-not-supported" };
}

async function loadSettings() {
  const { settings: stored } = await chrome.storage.local.get("settings");
  if (stored) settings = { ...SETTINGS_DEFAULTS, ...stored };
}

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

function canonicalUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || ["fbclid", "gclid", "mc_cid", "mc_eid", "igshid", "ref", "source"].includes(lower)) {
        u.searchParams.delete(key);
      }
    }
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return String(url || "").split("#")[0];
  }
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function sourceAllowed(host) {
  const h = host.replace(/^www\./, "");
  if (h === "github.com" || h.endsWith(".github.com")) return settings.src_github;
  if (h === "arxiv.org" || h.endsWith(".arxiv.org")) return settings.src_papers;
  if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com")) return settings.src_video;
  if (h === "reddit.com" || h.endsWith(".reddit.com") || h === "x.com" || h === "twitter.com") return settings.src_social;
  return true;
}

function captureActive() {
  return captureState === "recording";
}

function isCapturedTabEvent(event) {
  return event?.type === "visit" || event?.type === "title" || event?.type === "tab_open";
}

function matchesCapturedUrl(event, key) {
  return Boolean(event?.url && canonicalUrl(event.url) === key);
}

async function removeCapturedTab(url) {
  const key = canonicalUrl(url);
  if (!key) return { ok: false, removed: 0, buffered: buffer.length };

  const beforeBuffer = buffer.length;
  buffer = buffer.filter((event) => !(isCapturedTabEvent(event) && matchesCapturedUrl(event, key)));

  const { events = [] } = await chrome.storage.local.get("events");
  const nextEvents = events.filter((event) => !(isCapturedTabEvent(event) && matchesCapturedUrl(event, key)));
  await chrome.storage.local.set({ events: nextEvents });

  return {
    ok: true,
    removed: events.length - nextEvents.length,
    bufferedRemoved: beforeBuffer - buffer.length,
    buffered: buffer.length,
  };
}

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
  if (captureState === "recording" && captureStartedAt == null) captureStartedAt = Date.now();
  chrome.storage.local.set({ captureState, sessionId, captureStartedAt, captureElapsedMs });
});

loadSettings();

const SEARCH_ENGINES = [
  { host: "www.google.com", param: "q", name: "Google" },
  { host: "www.bing.com", param: "q", name: "Bing" },
  { host: "duckduckgo.com", param: "q", name: "DuckDuckGo" },
  { host: "www.perplexity.ai", param: "q", name: "Perplexity" },
];

function isCapturable(url) {
  if (!url || !/^https?:/.test(url)) return false;
  const host = hostnameOf(url);
  return !IGNORED_DOMAINS.includes(host);
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

function searchKey(search) {
  return `${search.engine}:${search.query.trim().toLowerCase()}`;
}

function shouldCaptureSearch(search) {
  const key = searchKey(search);
  const now = Date.now();
  const last = recentSearches.get(key) || 0;
  recentSearches.set(key, now);
  for (const [storedKey, at] of recentSearches.entries()) {
    if (now - at > SEARCH_DEDUPE_MS) recentSearches.delete(storedKey);
  }
  return now - last > SEARCH_DEDUPE_MS;
}

function enqueue(event) {
  if (!captureActive()) return;
  const enriched = { ...event, sessionId, at: new Date().toISOString() };
  buffer.push(enriched);
  persist(enriched);
  if (buffer.length > 50) buffer = buffer.slice(-25);
}

async function persist(event) {
  const { events = [] } = await chrome.storage.local.get("events");
  events.push(event);
  await chrome.storage.local.set({ events: events.slice(-1000), lastCapture: event.at });
}

async function flush() {
  buffer = [];
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "getAuthState") {
    sendResponse({ ok: true, signedIn: false, user: null, localFirst: true });
    return false;
  }

  if (message?.type === "getValidToken" || message?.type === "refreshToken") {
    sendResponse({ ok: true, token: null, localFirst: true });
    return false;
  }

  if (message?.type === "signOut") {
    chrome.storage.local.remove(["accessToken", "refreshToken", "tokenExpiresAt", "user"]).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "removeCapturedTab") {
    removeCapturedTab(message.url)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: String(error), buffered: buffer.length }));
    return true;
  }

  if (message?.type === "generateText") {
    generateWithProvider(String(message.prompt || ""), message.options || {})
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
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
      chrome.storage.local.set({ captureState, sessionId, events: [], lastCapture: null, captureStartedAt, captureElapsedMs })
        .then(() => sendResponse({ ok: true, state: captureState, buffered: 0 }));
      return true;
    }

    if (next === "recording") captureStartedAt = Date.now();
    chrome.storage.local.set({ captureState, sessionId, captureStartedAt, captureElapsedMs }).then(() => {
      sendResponse({ ok: true, state: captureState, buffered: buffer.length });
    });
    return true;
  }

  if (message?.type === "flush") {
    flush().then(() => sendResponse({ ok: true, buffered: buffer.length, localFirst: true }));
    return true;
  }

  return false;
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!isCapturable(details.url)) return;
  if (incognitoTabs.has(details.tabId) && !settings.capture_private) return;

  const previous = tabUrl.get(details.tabId);
  tabUrl.set(details.tabId, details.url);

  const host = hostnameOf(details.url);
  const search = detectSearch(details.url);
  if (search) {
    if (!shouldCaptureSearch(search)) return;
    enqueue({ type: "search", tabId: details.tabId, query: search.query, engine: search.engine, url: details.url });
    return;
  }

  if (!sourceAllowed(host)) return;

  scheduleVisit(details.tabId, {
    type: "visit",
    tabId: details.tabId,
    url: cleanUrl(details.url),
    domain: host,
    transition: details.transitionType,
    referrer: previous ? cleanUrl(previous) : null,
  });
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0 || !isCapturable(details.url)) return;
  try {
    const tab = await chrome.tabs.get(details.tabId);
    if (tab?.title) enqueue({ type: "title", tabId: details.tabId, url: details.url, title: tab.title });
  } catch {
    /* tab gone */
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.incognito && tab.id != null) incognitoTabs.add(tab.id);
  if (tab.incognito && !settings.capture_private) return;
  enqueue({ type: "tab_open", tabId: tab.id, url: tab.pendingUrl || tab.url || null });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const pending = pendingVisits.get(tabId);
  if (pending) {
    clearTimeout(pending);
    pendingVisits.delete(tabId);
  }
  enqueue({ type: "tab_close", tabId, url: tabUrl.get(tabId) ?? null });
  tabUrl.delete(tabId);
  incognitoTabs.delete(tabId);
});

chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(() => {});

chrome.alarms.create("settings", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "settings") loadSettings();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.settings?.newValue) return;
  settings = { ...SETTINGS_DEFAULTS, ...changes.settings.newValue };
});
