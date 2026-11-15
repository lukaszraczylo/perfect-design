/** Coerce an arbitrary prop value to an integer in [min, max]; non-finite values fall back. */
export function clampCount(value: unknown, fallback: number, max = 50, min = 1): number {
  const n = typeof value === 'number' ? Math.floor(value) : Number.NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
