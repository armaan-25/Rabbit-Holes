export const RABBIT_SESSION_KEY = "rabbit-hole-session";

export type RabbitAuthProvider = "email" | "google" | "local";

export type RabbitSession = {
  email?: string;
  displayName?: string;
  provider?: RabbitAuthProvider;
  createdAt: string;
};

const FAKE_EMAIL_DOMAINS = ["rabbitholes.local", "rabbit-holes.local"];
const FAKE_EMAILS = ["local@rabbitholes.app", "google-user@rabbitholes.local"];

function isFakeEmail(email?: string): boolean {
  const value = (email || "").trim().toLowerCase();
  if (!value) return false;
  return FAKE_EMAILS.includes(value) || FAKE_EMAIL_DOMAINS.some((domain) => value.endsWith(`@${domain}`));
}

function normalizeSession(session: RabbitSession): RabbitSession {
  const email = session.email?.trim();
  if (!email || isFakeEmail(email)) {
    return {
      createdAt: session.createdAt || new Date().toISOString(),
      displayName: session.displayName || (session.provider === "google" ? "Google profile" : "Local profile"),
      provider: session.provider || "local",
    };
  }

  return {
    createdAt: session.createdAt || new Date().toISOString(),
    displayName: session.displayName,
    email,
    provider: session.provider || "email",
  };
}

export function displayRabbitSession(session: RabbitSession | null): string {
  if (!session) return "Not signed in";
  const normalized = normalizeSession(session);
  return normalized.email || normalized.displayName || "Local profile";
}

export function readRabbitSession(): RabbitSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RABBIT_SESSION_KEY);
    return raw ? normalizeSession(JSON.parse(raw) as RabbitSession) : null;
  } catch {
    return null;
  }
}

export function writeRabbitSession(
  email: string,
  options: { provider?: RabbitAuthProvider; displayName?: string } = {},
): RabbitSession {
  const session = normalizeSession({
    email: email.trim() || undefined,
    createdAt: new Date().toISOString(),
    displayName: options.displayName,
    provider: options.provider,
  });
  window.localStorage.setItem(RABBIT_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("rabbit-hole-session-changed"));
  return session;
}

export function clearRabbitSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RABBIT_SESSION_KEY);
  window.dispatchEvent(new Event("rabbit-hole-session-changed"));
}
