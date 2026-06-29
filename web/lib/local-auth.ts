export const RABBIT_SESSION_KEY = "rabbit-hole-session";

export type RabbitSession = {
  email: string;
  createdAt: string;
};

export function readRabbitSession(): RabbitSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RABBIT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as RabbitSession) : null;
  } catch {
    return null;
  }
}

export function writeRabbitSession(email: string): RabbitSession {
  const session = { email: email.trim(), createdAt: new Date().toISOString() };
  window.localStorage.setItem(RABBIT_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("rabbit-hole-session-changed"));
  return session;
}

export function clearRabbitSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RABBIT_SESSION_KEY);
  window.dispatchEvent(new Event("rabbit-hole-session-changed"));
}
