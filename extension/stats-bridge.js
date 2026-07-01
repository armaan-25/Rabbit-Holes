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

  function publicProvider(provider) {
    if (!provider || typeof provider !== "object") return null;
    const { apiKey, ...rest } = provider;
    return { ...rest, hasApiKey: Boolean(provider.hasApiKey || apiKey) };
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

    if (event.data?.type === "rabbit-holes:get-events") {
      try {
        const { events = [] } = await chrome.storage.local.get(["events"]);
        window.postMessage({ type: "rabbit-holes:events", requestId, events }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:events", requestId, events: [] }, window.location.origin);
      }
      return;
    }

    if (event.data?.type === "rabbit-holes:get-config") {
      try {
        const { settings = null, aiProvider = null } = await chrome.storage.local.get(["settings", "aiProvider"]);
        window.postMessage({ type: "rabbit-holes:config", requestId, settings, aiProvider: publicProvider(aiProvider) }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:config", requestId, settings: null, aiProvider: null }, window.location.origin);
      }
      return;
    }

    if (event.data?.type === "rabbit-holes:set-config") {
      try {
        const patch = {};
        if (event.data.settings && typeof event.data.settings === "object") patch.settings = event.data.settings;
        if (event.data.aiProvider && typeof event.data.aiProvider === "object") {
          const { aiProvider: currentProvider = null } = await chrome.storage.local.get(["aiProvider"]);
          patch.aiProvider = { ...(currentProvider || {}), ...event.data.aiProvider };
          if (!("apiKey" in event.data.aiProvider) && currentProvider?.apiKey) patch.aiProvider.apiKey = currentProvider.apiKey;
          if (event.data.aiProvider.apiKey === "") delete patch.aiProvider.apiKey;
        }
        await chrome.storage.local.set(patch);
        window.postMessage({ type: "rabbit-holes:config-updated", requestId, ok: true }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:config-updated", requestId, ok: false }, window.location.origin);
      }
      return;
    }

    if (event.data?.type === "rabbit-holes:generate-text") {
      try {
        const res = await chrome.runtime.sendMessage({ type: "generateText", prompt: event.data.prompt, options: event.data.options || {} });
        window.postMessage({ type: "rabbit-holes:provider-result", requestId, ok: Boolean(res?.ok), text: res?.text || null }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:provider-result", requestId, ok: false, text: null }, window.location.origin);
      }
      return;
    }

    if (event.data?.type === "rabbit-holes:clear-local-data") {
      try {
        await chrome.storage.local.remove(["events", "lastCapture", "aiProvider"]);
        window.postMessage({ type: "rabbit-holes:local-data-cleared", requestId, ok: true }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:local-data-cleared", requestId, ok: false }, window.location.origin);
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

    if (event.data?.type === "rabbit-holes:remove-tab") {
      try {
        const res = await chrome.runtime.sendMessage({ type: "removeCapturedTab", url: event.data.url });
        window.postMessage({ type: "rabbit-holes:tab-removed", requestId, ok: Boolean(res?.ok), removed: res?.removed ?? 0 }, window.location.origin);
      } catch {
        window.postMessage({ type: "rabbit-holes:tab-removed", requestId, ok: false, removed: 0 }, window.location.origin);
      }
    }

    if (event.data?.type === "rabbit-holes:flush") {
      window.postMessage({ type: "rabbit-holes:flush-complete", requestId, ok: true, local: true }, window.location.origin);
    }
  });
})();
