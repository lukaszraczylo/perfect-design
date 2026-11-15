/**
 * Unit selection for relative times. Pure: no Intl, no clock, no DOM.
 *
 * Boundaries use average calendar lengths (month 30.4375 days, year 365.25 days), so a value never needs a calendar.
 * The magnitude is truncated toward zero, so "59.9 minutes" reads "59 minutes" and never rounds up to the next unit early.
 */
export const relativeUnits = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'] as const
export type RelativeUnit = (typeof relativeUnits)[number]

/** Milliseconds per unit. */
export const UNIT_MS: Readonly<Record<RelativeUnit, number>> = {
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_629_800_000,
  year: 31_557_600_000,
}

export interface SelectUnitOptions {
  /** Smallest unit to use. Closer times read as 0 of this unit. Default `second`. */
  minUnit?: RelativeUnit
  /** Largest unit to use. Larger gaps read as a bigger count of this unit. Default `year`. */
  maxUnit?: RelativeUnit
}

export interface RelativeValue {
  /** Signed, truncated count: negative is the past, positive the future. Never `-0`. */
  value: number
  unit: RelativeUnit
}

const indexOf = (u: unknown, fallback: number): number => {
  const i = relativeUnits.indexOf(u as RelativeUnit)
  return i < 0 ? fallback : i
}

/**
 * Pick the unit and signed count for a gap of `diffMs` milliseconds (target minus now). Anything that is not a finite
 * number reads as 0 of the smallest unit. `maxUnit` below `minUnit` is raised to `minUnit`.
 */
export function selectUnit(diffMs: number, options: SelectUnitOptions = {}): RelativeValue {
  const lo = indexOf(options.minUnit, 0)
  const hi = Math.max(lo, indexOf(options.maxUnit, relativeUnits.length - 1))
  const diff = Number.isFinite(diffMs) ? diffMs : 0
  const abs = Math.abs(diff)
  let i = lo
  for (let k = hi; k > lo; k--) {
    if (abs >= UNIT_MS[relativeUnits[k]]) {
      i = k
      break
    }
  }
  const unit = relativeUnits[i]
  const value = Math.trunc(diff / UNIT_MS[unit])
  return { value: value === 0 ? 0 : value, unit }
}
