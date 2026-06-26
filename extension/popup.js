import { WEB_URL } from "./config.js";

let captureState = "recording";
let captureStartedAt = null;
let captureElapsedMs = 0;
let signedIn = false;
let capturePending = false;

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
    if (event.type !== "visit" || !event.url || seen.has(event.url)) continue;
    seen.add(event.url);
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
    return `
      <div class="captured-item" title="${title}">
        <div class="captured-title">${title}</div>
        <div class="captured-meta">${host}</div>
      </div>
    `;
  }).join("");
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

// state: "in" (app panel), "out" (sign in), "expired" (sign in again).
function setAuthView(state) {
  const signedOut = state !== "in";
  document.getElementById("auth-panel").classList.toggle("signed-out", signedOut);
  document.getElementById("app-panel").classList.toggle("signed-out", signedOut);
  document.getElementById("auth-msg").textContent =
    state === "expired"
      ? "Your session expired. Sign in again to keep capturing."
      : state === "loading"
        ? "Checking session..."
        : "Sign in to save sessions to your Rabbit Holes account.";
}

async function render() {
  const auth = await chrome.runtime.sendMessage({ type: "getAuthState" }).catch(() => ({ signedIn: false }));
  signedIn = Boolean(auth?.signedIn);
  if (!signedIn) {
    setAuthView("out");
    return;
  }

  // Validate (and silently refresh) the token; if it can't be revived the session is dead.
  const valid = await chrome.runtime.sendMessage({ type: "getValidToken" }).catch(() => null);
  if (!valid?.token) {
    signedIn = false;
    setAuthView("expired");
    return;
  }

  setAuthView("in");
  document.getElementById("account-email").textContent = auth.user?.email || "Signed in";

  const {
    events = [],
    captureState: storedState = "recording",
    captureStartedAt: startedAt = null,
    captureElapsedMs: elapsedMs = 0,
  } = await chrome.storage.local.get(["events", "captureState", "captureStartedAt", "captureElapsedMs"]);
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

document.getElementById("signin").addEventListener("click", async () => {
  document.getElementById("auth-msg").textContent = "Opening sign in...";
  await chrome.runtime.sendMessage({ type: "signOut" }).catch(() => {});
  chrome.tabs.create({ url: `${WEB_URL}/login?next=${encodeURIComponent(`${WEB_URL}/extension-auth`)}` });
});

document.getElementById("signout").addEventListener("click", async () => {
  document.getElementById("account-email").textContent = "Signing out...";
  await chrome.runtime.sendMessage({ type: "signOut" }).catch(() => {});
  signedIn = false;
  setAuthView("out");
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
