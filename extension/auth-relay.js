// Content script on the web /rabbit-auth page. The web app hands off the
// Supabase session by putting tokens in the URL fragment (so they never reach
// any server). webNavigation in the background worker can't read the fragment,
// but a content script runs in the page and can — so this is the reliable
// handoff: read the hash, relay it to the background worker, which persists it.
(() => {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("accessToken");
  if (!accessToken) return;

  chrome.runtime.sendMessage({
    type: "rabbitHolesAuth",
    accessToken,
    refreshToken: hash.get("refreshToken") || null,
    expiresAt: hash.get("expiresAt") || null,
    user: { id: hash.get("userId") || null, email: hash.get("email") || null },
  });
})();
