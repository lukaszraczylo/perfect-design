/** Time helpers for ActivityFeed: Intl only, and every function tolerates bad input (a bad value is shown as given text). */

/** Parse a Date, epoch milliseconds or date string. Returns null for anything that is not a real date. */
export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null
  const d = value instanceof Date ? new Date(value.getTime()) : typeof value === 'number' || typeof value === 'string' ? new Date(value) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

export interface Formatters {
  /** "Mar 3, 2026, 9:12 AM" style text. */
  absolute: Intl.DateTimeFormat
  /** Full date used for day group headings. */
  day: Intl.DateTimeFormat
  relative: Intl.RelativeTimeFormat
}

/** Build the three formatters; an unknown locale or time zone falls back to the runtime default instead of throwing. */
export function makeFormatters(locale?: string, timeZone?: string): Formatters {
  const attempt = <T>(make: (l?: string, tz?: string) => T): T => {
    try {
      return make(locale || undefined, timeZone || undefined)
    } catch {
      try {
        return make(locale || undefined, undefined)
      } catch {
        return make(undefined, undefined)
      }
    }
  }
  return {
    absolute: attempt((l, tz) => new Intl.DateTimeFormat(l, { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })),
    day: attempt((l, tz) => new Intl.DateTimeFormat(l, { dateStyle: 'full', timeZone: tz })),
    relative: attempt((l) => new Intl.RelativeTimeFormat(l, { numeric: 'auto' })),
  }
}

const MIN = 60
const HOUR = 3600
const DAY = 86400

/** "2 hours ago", "in 3 minutes", "now", "yesterday" up to 7 days away; null beyond that (show the absolute text instead). */
export function formatRelative(date: Date, now: Date, rf: Intl.RelativeTimeFormat): string | null {
  const sec = (date.getTime() - now.getTime()) / 1000
  const abs = Math.abs(sec)
  if (abs < MIN) return rf.format(0, 'second')
  if (abs < HOUR) return rf.format(Math.trunc(sec / MIN), 'minute')
  if (abs < DAY) return rf.format(Math.trunc(sec / HOUR), 'hour')
  if (abs < 7 * DAY) return rf.format(Math.trunc(sec / DAY), 'day')
  return null
}
