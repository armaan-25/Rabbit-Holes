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
    if (event.source !== window || event.data?.type !== "rabbit-holes:get-stats") return;
    const requestId = event.data.requestId;
    try {
      window.postMessage({ type: "rabbit-holes:stats", requestId, stats: await readStats() }, window.location.origin);
    } catch {
      window.postMessage({ type: "rabbit-holes:stats", requestId, stats: null }, window.location.origin);
    }
  });
})();
