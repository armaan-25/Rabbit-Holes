// Production endpoints for the unpacked Chrome extension.
// Keep these in sync with Railway service domains.
export const WEB_URL = "https://web-production-bde52.up.railway.app";
export const BACKEND_URL = "https://rabbit-holes-production.up.railway.app";

// How many events to batch before flushing to the backend.
export const FLUSH_AT = 1;

// Max time (ms) an event sits in the buffer before we flush anyway.
export const FLUSH_INTERVAL_MS = 15_000;

// Domains we never capture (auth pages, banking, etc.).
export const IGNORED_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "mail.google.com",
];
