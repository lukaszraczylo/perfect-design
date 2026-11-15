/** Helpers shared by marketing components. Pure functions, safe in SSR (no window access at import time). */

/** True when the user asked the OS/browser for reduced motion. Safe when matchMedia is missing. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Clamp to [min, max]; non-finite input (NaN, Infinity, undefined, strings) returns `fallback`. */
export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Pick a supported column count, else the fallback. */
export function pickColumns<T extends number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/** Attributes for an outbound link: new tab + safe rel when `external`. */
export function linkAttrs(external?: boolean): { target?: string; rel?: string } {
  return external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

/** Initials from a display name, Unicode-safe (uses code points, not UTF-16 units). Max 2 characters. */
export function initialsOf(name: string | undefined | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = Array.from(words[0])[0] ?? ''
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : ''
  return (first + last).toUpperCase()
}
