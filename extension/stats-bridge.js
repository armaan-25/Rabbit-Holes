(() => {
  function liveElapsedMs(captureState, captureStartedAt, captureElapsedMs) {
    const running = captureState === "recording" && captureStartedAt != null;
    return (captureElapsedMs || 0) + (running ? Date.now() - captureStartedAt : 0);
  }

  async function readStats() {
    const {
      events = [],
      captureState = "recording",
      captureStartedAt = null,
      captureElapsedMs = 0,
    } = await chrome.storage.local.get(["events", "captureState", "captureStartedAt", "captureElapsedMs"]);

    const visits = new Set(events.filter((e) => e.type === "visit").map((e) => e.url).filter(Boolean));
    return {
      pages: visits.size,
      searches: events.filter((e) => e.type === "search").length,
      tabs: events.filter((e) => e.type === "tab_open").length,
      captureState,
      elapsedMs: liveElapsedMs(captureState, captureStartedAt, captureElapsedMs),
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
        const res = await chrome.runtime.sendMessage({ type: "snapshotBrowserState" });
        window.postMessage({ type: "rabbit-holes:flush-complete", requestId, ok: Boolean(res?.ok), buffered: res?.buffered ?? null, stats: res ?? null }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:flush-complete", requestId, ok: false }, window.location.origin);
      }
    }
  });
})();
