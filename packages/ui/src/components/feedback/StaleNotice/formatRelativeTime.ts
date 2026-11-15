export type RelativeTimeInput = Date | number | string | null | undefined

/** Below this distance (ms) a timestamp is reported as "just now". */
export const JUST_NOW_MS = 5_000

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** Convert a Date / epoch ms / date string to epoch ms. Returns NaN for anything invalid. */
export function toTimestamp(input: RelativeTimeInput): number {
  if (input instanceof Date) return input.getTime()
  if (typeof input === 'number') return Number.isFinite(input) ? input : Number.NaN
  if (typeof input === 'string' && input.trim() !== '') return Date.parse(input)
  return Number.NaN
}

const formatters = new Map<string, Intl.RelativeTimeFormat>()
function formatter(locale: string): Intl.RelativeTimeFormat {
  let f = formatters.get(locale)
  if (!f) {
    try {
      f = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    } catch {
      f = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    }
    formatters.set(locale, f)
  }
  return f
}

/**
 * Pure relative-time formatter: "just now", "30 seconds ago", "5 minutes ago", "yesterday", "in 2 hours"...
 * Units are floored so a value never rounds up to the next unit early (59.9 s is "59 seconds ago").
 * Anything within 5 s of `now` (either direction) is "just now". Invalid input returns an empty string.
 */
export function formatRelativeTime(input: RelativeTimeInput, now: RelativeTimeInput = Date.now(), locale = 'en'): string {
  const ts = toTimestamp(input)
  const base = toTimestamp(now)
  if (Number.isNaN(ts) || Number.isNaN(base)) return ''
  const diff = ts - base
  const abs = Math.abs(diff)
  if (abs < JUST_NOW_MS) return 'just now'
  const sign = diff < 0 ? -1 : 1
  const rtf = formatter(locale)
  if (abs < MINUTE) return rtf.format(sign * Math.floor(abs / 1000), 'second')
  if (abs < HOUR) return rtf.format(sign * Math.floor(abs / MINUTE), 'minute')
  if (abs < DAY) return rtf.format(sign * Math.floor(abs / HOUR), 'hour')
  if (abs < MONTH) return rtf.format(sign * Math.floor(abs / DAY), 'day')
  if (abs < YEAR) return rtf.format(sign * Math.floor(abs / MONTH), 'month')
  return rtf.format(sign * Math.floor(abs / YEAR), 'year')
}
