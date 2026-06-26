(() => {
  function liveElapsedMs(captureState, captureStartedAt, captureElapsedMs) {
    const running = captureState === "recording" && captureStartedAt != null;
    return (captureElapsedMs || 0) + (running ? Date.now() - captureStartedAt : 0);
  }

  function hostOf(url) {
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

  function capturedTabs(events) {
    const seen = new Set();
    const tabs = [];
    for (const event of [...events].reverse()) {
      if (event.type !== "visit" || !event.url) continue;
      const key = canonicalUrl(event.url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      tabs.push({
        title: event.title || event.url || "Untitled page",
        url: event.url,
        domain: event.domain || hostOf(event.url) || "captured page",
        at: event.at || null,
      });
      if (tabs.length >= 12) break;
    }
    return tabs;
  }

  async function readStats() {
    const {
      events = [],
      captureState = "recording",
      captureStartedAt = null,
      captureElapsedMs = 0,
    } = await chrome.storage.local.get(["events", "captureState", "captureStartedAt", "captureElapsedMs"]);

    const visits = new Set(events.filter((e) => e.type === "visit").map((e) => canonicalUrl(e.url)).filter(Boolean));
    return {
      pages: visits.size,
      searches: events.filter((e) => e.type === "search").length,
      tabs: events.filter((e) => e.type === "tab_open").length,
      captureState,
      elapsedMs: liveElapsedMs(captureState, captureStartedAt, captureElapsedMs),
      capturedTabs: capturedTabs(events),
      source: "extension",
    };
  }

  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    const requestId = event.data?.requestId;

    if (event.data?.type === "rabbit-holes:get-stats") {
      try {
        window.postMessage({ type: "rabbit-holes:stats", requestId, stats: await readStats() }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:stats", requestId, stats: null }, window.location.origin);
      }
      return;
    }

    if (event.data?.type === "rabbit-holes:set-capture") {
      try {
        const res = await chrome.runtime.sendMessage({ type: "setCaptureState", state: event.data.state });
        window.postMessage({ type: "rabbit-holes:capture-updated", requestId, ok: Boolean(res?.ok), state: res?.state ?? null }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:capture-updated", requestId, ok: false }, window.location.origin);
      }
    }

    if (event.data?.type === "rabbit-holes:flush") {
      try {
        const res = await chrome.runtime.sendMessage({ type: "flush" });
        window.postMessage({ type: "rabbit-holes:flush-complete", requestId, ok: Boolean(res?.ok), buffered: res?.buffered ?? null }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:flush-complete", requestId, ok: false }, window.location.origin);
      }
    }
  });
})();
