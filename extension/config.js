// Where captured browsing events get shipped. Point this at your FastAPI backend.
export const BACKEND_URL = "http://localhost:8000";

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
