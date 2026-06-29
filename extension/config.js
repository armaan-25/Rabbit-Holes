// Web/docs endpoint for the unpacked Chrome extension.
// The staging product direction is local-first; BACKEND_URL remains only for the current prototype clustering path.
export const WEB_URL = "https://userabbitholes.com";
export const BACKEND_URL = "https://backend-production-4e5a6.up.railway.app";

// Legacy Supabase project for the old account flow. Kept during the transition only;
// the extension popup no longer requires sign-in.
export const SUPABASE_URL = "https://xlxjzxnlcplqmdoedhqm.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_jdSlL8lF0b38mvIMiRHDWw_IvtYCw4x";

// Prototype backend flushing. Local-first clustering should replace this path.
export const FLUSH_AT = 1;

// Max time (ms) an event sits in the buffer before we flush anyway.
export const FLUSH_INTERVAL_MS = 15_000;

// Domains we never capture (auth pages, banking, etc.).
export const IGNORED_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "mail.google.com",
];
