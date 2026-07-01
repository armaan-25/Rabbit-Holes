import { WEB_URL } from "./config.js";

let captureState = "recording";
let captureStartedAt = null;
let captureElapsedMs = 0;
let capturePending = false;
let providerReady = false;

function setClusterLabel(text) {
  document.getElementById("cluster").innerHTML = `<span>${text}</span>`;
}

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  const hh = h ? `${h}:` : "";
  return `${hh}${mm}:${ss}`;
}

function liveElapsedMs() {
  const running = captureState === "recording" && captureStartedAt != null;
  return captureElapsedMs + (running ? Date.now() - captureStartedAt : 0);
}

function renderTimer() {
  document.getElementById("capture-timer").textContent = formatElapsed(liveElapsedMs());
}

function formatHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function canonicalUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "fbclid" ||
        lower === "gclid" ||
        lower === "mc_cid" ||
        lower === "mc_eid" ||
        lower === "igshid" ||
        lower === "ref" ||
        lower === "source"
      ) {
        u.searchParams.delete(key);
      }
    }
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return String(url || "").split("#")[0];
  }
}

function isProviderConfigured(config) {
  if (!config || typeof config !== "object") return false;
  const type = config.type || "openrouter";
  const hasModel = Boolean(String(config.model || "").trim());
  const hasBaseUrl = Boolean(String(config.baseUrl || "").trim());
  const hasKey = Boolean(String(config.apiKey || "").trim() || config.hasApiKey);
  if (type === "ollama" || type === "lmstudio" || type === "compatible") return hasModel && hasBaseUrl;
  return hasModel && hasKey;
}

function setProviderUI(ready) {
  providerReady = ready;
  const warning = document.getElementById("provider-warning");
  const cluster = document.getElementById("cluster");
  warning.classList.toggle("visible", !ready);
  cluster.classList.toggle("needs-key", !ready);
  if (!ready) setClusterLabel("Set API key in settings");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCapturedTabs(events) {
  const count = document.getElementById("captured-count");
  const list = document.getElementById("captured-list");
  const visits = [];
  const seen = new Set();

  for (const event of [...events].reverse()) {
    const key = canonicalUrl(event.url);
    if (event.type !== "visit" || !event.url || seen.has(key)) continue;
    seen.add(key);
    visits.push(event);
    if (visits.length >= 12) break;
  }

  count.textContent = String(visits.length);
  if (!visits.length) {
    list.innerHTML = `<div class="captured-empty">No tabs captured yet.</div>`;
    return;
  }

  list.innerHTML = visits.map((visit) => {
    const title = escapeHtml(visit.title || visit.url || "Untitled page");
    const host = escapeHtml(visit.domain || formatHost(visit.url) || "captured page");
    const url = escapeHtml(visit.url || "");
    return `
      <div class="captured-item" title="${title}">
        <div class="captured-copy">
          <div class="captured-title">${title}</div>
          <div class="captured-meta">${host}</div>
        </div>
        <button class="captured-remove" data-remove-url="${url}" title="Remove from capture" aria-label="Remove ${title}">×</button>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-remove-url]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      button.textContent = "…";
      button.disabled = true;
      await chrome.runtime.sendMessage({ type: "removeCapturedTab", url: button.dataset.removeUrl }).catch(() => null);
      await render();
    });
  });
}

function setCaptureUI(state) {
  captureState = state;
  const dot = document.getElementById("capture-dot");
  const label = document.getElementById("capture-label");
  const toggle = document.getElementById("record-toggle");
  const stop = document.getElementById("record-stop");

  dot.className = `dot ${state === "paused" ? "paused" : state === "stopped" ? "stopped" : ""}`;
  label.textContent =
    state === "recording"
      ? "Capturing"
      : state === "paused"
        ? "Paused"
        : "Stopped";

  const recording = state === "recording";
  const restartLabel = state === "stopped" ? "Start" : "Resume";
  toggle.textContent = capturePending ? "..." : recording ? "Pause" : restartLabel;
  toggle.title = recording ? "Pause recording" : state === "stopped" ? "Start recording" : "Resume recording";
  toggle.disabled = capturePending;
  toggle.classList.toggle("primary", !recording);
  stop.textContent = state === "stopped" ? "Ended" : "End";
  stop.disabled = capturePending || state === "stopped";
  renderTimer();
}

async function setCaptureState(state) {
  if (capturePending) return false;
  capturePending = true;
  setCaptureUI(captureState);
  try {
    const res = await chrome.runtime.sendMessage({ type: "setCaptureState", state });
    if (res?.ok) setCaptureUI(res.state);
    await render();
    return Boolean(res?.ok);
  } catch {
    setCaptureUI(state);
    return false;
  } finally {
    capturePending = false;
    setCaptureUI(captureState);
  }
}

// state: "in" (local capture panel), "out" (provider setup), "expired" (provider setup).
function setAuthView(state) {
  const signedOut = state !== "in";
  document.getElementById("auth-panel").classList.toggle("signed-out", signedOut);
  document.getElementById("app-panel").classList.toggle("signed-out", signedOut);
  document.getElementById("auth-msg").textContent =
    state === "expired"
      ? "Configure an AI provider to build rabbit holes."
      : state === "loading"
        ? "Loading capture..."
        : "Open settings to choose your AI provider.";
}

async function render() {
  setAuthView("in");
  document.getElementById("account-email").textContent = "AI provider";

  const {
    events = [],
    captureState: storedState = "recording",
    captureStartedAt: startedAt = null,
    captureElapsedMs: elapsedMs = 0,
    aiProvider = null,
  } = await chrome.storage.local.get(["events", "captureState", "captureStartedAt", "captureElapsedMs", "aiProvider"]);
  setProviderUI(isProviderConfigured(aiProvider));
  const visits = new Set(events.filter((e) => e.type === "visit").map((e) => e.url));
  const searches = events.filter((e) => e.type === "search").length;
  const opens = events.filter((e) => e.type === "tab_open").length;

  document.getElementById("visits").textContent = visits.size;
  document.getElementById("searches").textContent = searches;
  document.getElementById("tabs").textContent = opens;
  renderCapturedTabs(events);
  captureStartedAt = startedAt;
  captureElapsedMs = elapsedMs;
  setCaptureUI(storedState);
}

// Tick the clock once a second while a recording run is active.
setInterval(() => {
  if (captureState === "recording" && captureStartedAt != null) renderTimer();
}, 1000);

document.getElementById("open").addEventListener("click", () => {
  chrome.tabs.create({ url: `${WEB_URL}/dashboard` });
});

document.getElementById("brand-open").addEventListener("click", () => {
  chrome.tabs.create({ url: `${WEB_URL}/dashboard` });
});

document.getElementById("signin").addEventListener("click", () => {
  chrome.tabs.create({ url: `${WEB_URL}/settings` });
});

document.getElementById("signout").addEventListener("click", () => {
  chrome.tabs.create({ url: `${WEB_URL}/settings` });
});

document.getElementById("record-toggle").addEventListener("click", () => {
  const next = captureState === "recording" ? "paused" : "recording";
  const ok = window.confirm(
    next === "paused"
      ? "Pause Rabbit Holes capture? New pages and searches will not be recorded until you resume."
      : captureState === "stopped"
        ? "Start a fresh Rabbit Holes capture session?"
        : "Resume Rabbit Holes capture? New pages and searches will start recording again."
  );
  if (ok) void setCaptureState(next);
});
document.getElementById("record-stop").addEventListener("click", () => {
  if (captureState === "stopped") return;
  const ok = window.confirm("End this Rabbit Holes session? This clears the current captured trail and starts fresh when you resume.");
  if (ok) void setCaptureState("stopped");
});

document.getElementById("cluster").addEventListener("click", async (e) => {
  if (!providerReady) {
    chrome.tabs.create({ url: `${WEB_URL}/settings` });
    return;
  }
  if (captureState === "stopped") {
    setClusterLabel("Press play to start");
    window.setTimeout(() => setClusterLabel("Build rabbit holes"), 1300);
    return;
  }
  const btn = e.currentTarget;
  btn.disabled = true;
  setClusterLabel("Opening builder…");
  try {
    chrome.tabs.create({ url: `${WEB_URL}/dashboard?cluster=1` }, () => window.close());
  } catch {
    setClusterLabel("Could not open");
    window.setTimeout(() => setClusterLabel("Build rabbit holes"), 1600);
    btn.disabled = false;
  }
});

render();
