import { selectUnit, type RelativeUnit } from './units'

/** Anything `RelativeTime` accepts as a moment: a Date, epoch milliseconds or an ISO 8601 string. */
export type MomentInput = Date | number | string | null | undefined

export type RelativeNumeric = 'auto' | 'always'
export type RelativeUnitStyle = 'long' | 'short' | 'narrow'
export type DateStyle = 'full' | 'long' | 'medium' | 'short'
export type TimeStyle = 'full' | 'long' | 'medium' | 'short' | 'none'

export const relativeNumerics = ['auto', 'always'] as const
export const relativeUnitStyles = ['long', 'short', 'narrow'] as const
export const dateStyles = ['full', 'long', 'medium', 'short'] as const
export const timeStyles = ['full', 'long', 'medium', 'short', 'none'] as const

export const DEFAULT_TIME_LOCALE = 'en'
/** Largest absolute epoch value a Date can hold (ECMAScript time value limit). */
export const MAX_TIME = 8.64e15

const ISO_LIKE = /^[+-]?\d{4,6}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/i

/**
 * A valid Date from a Date, a finite epoch-ms number within the Date range, or an ISO 8601 string
 * (`2025-01-31`, `2025-01-31T10:00:00Z`, `2025-01-31T10:00:00+02:00`). Everything else, including other date string
 * formats, NaN, Infinity and out-of-range values, is `null`.
 */
export function parseDateTime(input: unknown): Date | null {
  let ms: number
  if (input instanceof Date) ms = input.getTime()
  else if (typeof input === 'number') ms = input
  else if (typeof input === 'string') {
    const s = input.trim()
    if (!ISO_LIKE.test(s)) return null
    ms = Date.parse(s.replace(' ', 'T').replace(',', '.'))
  } else return null
  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_TIME) return null
  return new Date(ms)
}

/** Epoch milliseconds of a valid input, else `null`. */
export function toMillis(input: unknown): number | null {
  return parseDateTime(input)?.getTime() ?? null
}

/** The canonical form of `locale` when it is a well formed tag, else `en`. */
export function resolveLocale(locale: unknown): string {
  if (typeof locale !== 'string' || !locale.trim()) return DEFAULT_TIME_LOCALE
  try {
    return Intl.getCanonicalLocales(locale.trim())[0] ?? DEFAULT_TIME_LOCALE
  } catch {
    return DEFAULT_TIME_LOCALE
  }
}

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T): T => (list.includes(value as T) ? (value as T) : fallback)

export interface RelativeFormatOptions {
  locale?: string
  numeric?: RelativeNumeric
  unitStyle?: RelativeUnitStyle
  minUnit?: RelativeUnit
  maxUnit?: RelativeUnit
}

const rtfCache = new Map<string, Intl.RelativeTimeFormat>()

/**
 * "3 minutes ago" / "in 2 days" for the gap between `datetime` and `now`. Returns `null` when either is invalid.
 * Never throws; an unsupported locale or missing Intl falls back to English / the ISO date.
 */
export function formatRelative(datetime: unknown, now: unknown, options: RelativeFormatOptions = {}): string | null {
  const target = toMillis(datetime)
  const base = toMillis(now)
  if (target === null || base === null) return null
  const { value, unit } = selectUnit(target - base, options)
  const locale = resolveLocale(options.locale)
  const numeric = pick(relativeNumerics, options.numeric, 'auto')
  const style = pick(relativeUnitStyles, options.unitStyle, 'long')
  const key = `${locale}|${numeric}|${style}`
  let rtf = rtfCache.get(key)
  if (!rtf) {
    try {
      rtf = new Intl.RelativeTimeFormat(locale, { numeric, style })
    } catch {
      rtf = new Intl.RelativeTimeFormat('en', { numeric, style })
    }
    rtfCache.set(key, rtf)
  }
  return rtf.format(value, unit)
}

export interface AbsoluteFormatOptions {
  locale?: string
  dateStyle?: DateStyle
  timeStyle?: TimeStyle
  /** IANA zone such as `UTC` or `Europe/Warsaw`. Unknown zones are ignored (the runtime zone is used). */
  timeZone?: string
}

/** Localised absolute date, e.g. "Jan 31, 2025, 10:00 AM". Returns `''` for an invalid input. Never throws. */
export function formatAbsolute(datetime: unknown, options: AbsoluteFormatOptions = {}): string {
  const date = parseDateTime(datetime)
  if (!date) return ''
  const locale = resolveLocale(options.locale)
  const dateStyle = pick(dateStyles, options.dateStyle, 'medium')
  const timeStyle = pick(timeStyles, options.timeStyle, 'short')
  const base: Intl.DateTimeFormatOptions = { dateStyle, ...(timeStyle === 'none' ? {} : { timeStyle }) }
  const attempts: Intl.DateTimeFormatOptions[] = options.timeZone ? [{ ...base, timeZone: options.timeZone }, base] : [base]
  for (const opts of attempts) {
    try {
      return new Intl.DateTimeFormat(locale, opts).format(date)
    } catch {
      /* try the next option set */
    }
  }
  return date.toISOString()
}
