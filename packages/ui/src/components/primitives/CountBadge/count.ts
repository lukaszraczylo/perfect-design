/** Largest cap accepted for `max`; anything above it is clamped so the label never prints exponent notation. */
export const COUNT_BADGE_MAX_CAP = Number.MAX_SAFE_INTEGER
export const COUNT_BADGE_DEFAULT_MAX = 99

export interface FormattedCount {
  /** The sanitised whole number (0 for invalid input, never negative). */
  value: number
  /** Text to show: the number, or `max` followed by `+` when the number is above `max`. */
  text: string
  /** True when `value` is above the cap. */
  overflow: boolean
}

/** A usable cap: a whole number from 1 up. Anything else (NaN, Infinity, 0, negative, text) falls back to 99. */
export function resolveCountBadgeMax(max: unknown): number {
  if (typeof max !== 'number' || !Number.isFinite(max)) return COUNT_BADGE_DEFAULT_MAX
  const whole = Math.trunc(max)
  return whole < 1 ? COUNT_BADGE_DEFAULT_MAX : Math.min(whole, COUNT_BADGE_MAX_CAP)
}

/**
 * Turns whatever was passed as `count` into text. Not a number or NaN: 0. Negative: 0. Fraction: truncated.
 * +Infinity and anything above the cap: `${max}+`. -Infinity: 0.
 */
export function formatCountBadge(count: unknown, max: unknown): FormattedCount {
  const cap = resolveCountBadgeMax(max)
  if (typeof count !== 'number' || Number.isNaN(count)) return { value: 0, text: '0', overflow: false }
  const value = Math.max(0, Math.trunc(count))
  if (value > cap) return { value, text: `${cap}+`, overflow: true }
  return { value, text: String(value), overflow: false }
}
