import { BACKEND_URL, WEB_URL } from "./config.js";

let captureState = "recording";
let captureStartedAt = null;
let captureElapsedMs = 0;
let signedIn = false;

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
  toggle.textContent = recording ? "Ⅱ" : "▶";
  toggle.title = recording ? "Pause recording" : "Resume recording";
  toggle.classList.toggle("active", !recording && state !== "stopped");
  stop.classList.toggle("active", state === "stopped");
  renderTimer();
}

async function setCaptureState(state) {
  try {
    const res = await chrome.runtime.sendMessage({ type: "setCaptureState", state });
    if (res?.ok) setCaptureUI(res.state);
    await render();
  } catch {
    setCaptureUI(state);
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
  chrome.tabs.create({ url: `${WEB_URL}/extension-auth` });
});

document.getElementById("signout").addEventListener("click", async () => {
  document.getElementById("account-email").textContent = "Signing out...";
  await chrome.runtime.sendMessage({ type: "signOut" }).catch(() => {});
  signedIn = false;
  setAuthView("out");
});

document.getElementById("record-toggle").addEventListener("click", () => {
  setCaptureState(captureState === "recording" ? "paused" : "recording");
});
document.getElementById("record-stop").addEventListener("click", () => setCaptureState("stopped"));

document.getElementById("cluster").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (captureState === "stopped") {
    setClusterLabel("Press play to start");
    window.setTimeout(() => setClusterLabel("Build rabbit holes"), 1300);
    return;
  }
  setClusterLabel("Thinking…");
  try {
    try {
      await chrome.runtime.sendMessage({ type: "flush" });
    } catch {
      // Older loaded copies of the extension may not have the flush listener yet.
      // Continue anyway so Build still tests the backend instead of failing early.
    }
    const valid = await chrome.runtime.sendMessage({ type: "getValidToken" }).catch(() => null);
    let token = valid?.token;
    if (!token) {
      setClusterLabel("Sign in first");
      setAuthView("expired");
      window.setTimeout(() => setClusterLabel("Build rabbit holes"), 1600);
      return;
    }
    let res = await fetch(`${BACKEND_URL}/cluster`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      // Token rejected — force one refresh and retry before giving up.
      const refreshed = await chrome.runtime.sendMessage({ type: "refreshToken" }).catch(() => null);
      token = refreshed?.token;
      if (token) {
        res = await fetch(`${BACKEND_URL}/cluster`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
    if (res.status === 401) {
      setClusterLabel("Session expired — sign in");
      setAuthView("expired");
      window.setTimeout(() => setClusterLabel("Build rabbit holes"), 1600);
      return;
    }
    if (!res.ok) throw new Error(`cluster failed: ${res.status}`);
    const payload = await res.json();
    const holeCount = Array.isArray(payload?.holes) ? payload.holes.length : 0;
    setClusterLabel(`${holeCount} rabbit hole${holeCount === 1 ? "" : "s"} found`);
    chrome.tabs.create({ url: `${WEB_URL}/dashboard?cluster=1` });
  } catch {
    setClusterLabel("Backend offline");
  }
});

render();
