"use client";

import { createClient, type Session, type User } from "@supabase/supabase-js";
import { clearRabbitSession, writeRabbitSession, type RabbitAuthProvider } from "@/lib/local-auth";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  "https://xlxjzxnlcplqmdoedhqm.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_jdSlL8lF0b38mvIMiRHDWw_IvtYCw4x";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

let client: ReturnType<typeof createClient> | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase auth is not configured.");
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
        storageKey: "rabbit-holes-supabase-auth",
      },
    });
  }

  return client;
}

function providerFromUser(user: User): RabbitAuthProvider {
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("google") ? "google" : "email";
}

export function writeSupabaseUserSession(user: User) {
  return writeRabbitSession(user.email || "", {
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Signed in",
    provider: providerFromUser(user),
  });
}

export async function syncSupabaseSessionToLocal(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error || !data.session?.user) return null;

  writeSupabaseUserSession(data.session.user);
  return data.session;
}

export async function signOutSupabase() {
  if (isSupabaseConfigured()) {
    await getSupabaseClient().auth.signOut().catch(() => null);
  }
  clearRabbitSession();
}

export function safeNextPath(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function getAuthCallbackUrl(next: string) {
  const safeNext = safeNextPath(next);
  const base =
    typeof window !== "undefined" ? window.location.origin : SITE_URL || "https://userabbitholes.com";
  return `${base.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
