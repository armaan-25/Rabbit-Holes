// Rabbit Holes extension configuration.
// Staging pivot: local-first capture is the core path. No hosted backend or
// Supabase session is required for normal use.
export const WEB_URL = "https://userabbitholes.com";

// Domains we never capture (auth pages, banking, etc.).
export const IGNORED_DOMAINS = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "app.1password.com",
  "my.1password.com",
  "www.icloud.com",
  "mail.google.com",
  "bankofamerica.com",
  "www.bankofamerica.com",
  "chase.com",
  "www.chase.com",
];
