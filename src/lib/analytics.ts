import { recordEvent, type ProductEvent } from "@/lib/analytics.functions";

/**
 * Client-side analytics helper for LOW-RISK public/marketing events.
 *
 * Design rules:
 *  - Fire-and-forget. Never throws, never blocks UI, never awaited by callers.
 *  - Client-only guard: no-ops during SSR / non-browser contexts.
 *  - Does NOT send user_id/company_id — trusted identity is attached only by the
 *    server-side `recordServerEvent` helper. The browser supplies only an
 *    anonymous_id (per-browser) and session_id (per-tab) for funnel stitching.
 *  - No PII. We only send the canonical event name, the current pathname, the
 *    two anonymous ids, and a small metadata bag.
 */

const ANON_KEY = "hk_anon_id";
const SESSION_KEY = "hk_session_id";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Stable per-browser id (localStorage). Used for pre-login attribution. */
export function getAnonymousId(): string | null {
  if (!isBrowser()) return null;
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = newId();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Per-tab session id (sessionStorage). Reset when the tab closes. */
export function getSessionId(): string | null {
  if (!isBrowser()) return null;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = newId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget event tracker. Safe to call from anywhere in the client.
 * Returns void immediately; the network call resolves in the background and any
 * failure is swallowed so analytics can never break the page.
 */
export function track(event: ProductEvent, metadata?: Record<string, string | number | boolean>): void {
  if (!isBrowser()) return;
  try {
    void recordEvent({
      data: {
        event,
        route: window.location?.pathname ?? null,
        sessionId: getSessionId(),
        anonymousId: getAnonymousId(),
        source: "client",
        metadata,
      },
    }).catch(() => {
      /* analytics must never break the caller */
    });
  } catch {
    /* never throw from telemetry */
  }
}
