"use client";

const DEFAULT_SITE_URL = "https://userabbitholes.com";

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") return window.location.origin;
  return DEFAULT_SITE_URL;
}

export function authCallbackUrl(next = "/dashboard") {
  return `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function isExtensionAuthNext(next: string) {
  if (next.startsWith("/extension-auth") || next.startsWith("/rabbit-auth")) return true;
  try {
    const url = new URL(next);
    return url.pathname.startsWith("/extension-auth") || url.pathname.startsWith("/rabbit-auth");
  } catch {
    return false;
  }
}
