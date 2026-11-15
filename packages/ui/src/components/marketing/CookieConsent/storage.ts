/**
 * Optional persistence helper for CookieConsent. The component stores nothing itself: call `writeConsent` from your `change`
 * handler and `readConsent` before deciding whether to show the banner. Safe on the server and when storage is blocked, full
 * or holds corrupt data: nothing here throws.
 */

/** The part of `Storage` used here, so tests and apps can pass `sessionStorage` or a stub. */
export interface ConsentStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const VERSION = 1
const MAX_LENGTH = 10_000

function defaultStorage(): ConsentStorage | null {
  try {
    // Reading `localStorage` itself throws when storage is blocked.
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** The saved choice, or `null` when nothing valid is stored (missing, unreadable, too large, wrong shape). */
export function readConsent(key: string, storage?: ConsentStorage | null): Record<string, boolean> | null {
  const store = storage === undefined ? defaultStorage() : storage
  if (!store || typeof key !== 'string' || key === '') return null
  try {
    const raw = store.getItem(key)
    if (typeof raw !== 'string' || raw.length > MAX_LENGTH) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const { v, c } = parsed as { v?: unknown; c?: unknown }
    if (v !== VERSION || !c || typeof c !== 'object' || Array.isArray(c)) return null
    const entries = Object.entries(c as Record<string, unknown>)
    if (entries.some(([, value]) => typeof value !== 'boolean')) return null
    return Object.fromEntries(entries as [string, boolean][])
  } catch {
    return null
  }
}

/** Save a choice. Returns `false` when it could not be saved. */
export function writeConsent(key: string, categories: Record<string, boolean>, storage?: ConsentStorage | null): boolean {
  const store = storage === undefined ? defaultStorage() : storage
  if (!store || typeof key !== 'string' || key === '') return false
  try {
    store.setItem(key, JSON.stringify({ v: VERSION, c: categories }))
    return true
  } catch {
    return false
  }
}

/** Forget a saved choice (for a "change my cookie settings" link). Returns `false` when it could not be removed. */
export function clearConsent(key: string, storage?: ConsentStorage | null): boolean {
  const store = storage === undefined ? defaultStorage() : storage
  if (!store || typeof key !== 'string' || key === '') return false
  try {
    store.removeItem(key)
    return true
  } catch {
    return false
  }
}
