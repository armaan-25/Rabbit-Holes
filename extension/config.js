// Production endpoints for the unpacked Chrome extension.
// Keep these in sync with Railway service domains.
export const WEB_URL = "https://userabbitholes.com";
export const BACKEND_URL = "https://backend-production-4e5a6.up.railway.app";

// Supabase project (publishable anon key — same one shipped in the web bundle,
// safe to embed). Used to silently refresh an expired access token.
export const SUPABASE_URL = "https://xlxjzxnlcplqmdoedhqm.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_jdSlL8lF0b38mvIMiRHDWw_IvtYCw4x";

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
