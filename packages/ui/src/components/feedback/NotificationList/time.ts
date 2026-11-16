import { DEFAULT_TIME_LOCALE } from '../../typography/RelativeTime/format'
export type NotificationTime = Date | string | number

export interface NotificationTimeResult {
  /** Text to render (relative time, or the provided string when it is not a date). Empty when invalid. */
  text: string
  /** ISO string for the `datetime` attribute; null when the input is not a valid date. */
  iso: string | null
  /** Absolute, localised date for the `title` tooltip; empty when not a date. */
  title: string
}

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}/
const EMPTY: NotificationTimeResult = { text: '', iso: null, title: '' }

/** Valid Date from a Date, finite epoch-ms number or ISO-like string; otherwise null. */
export function toNotificationDate(value: unknown): Date | null {
  let d: Date | null = null
  if (value instanceof Date) d = value
  else if (typeof value === 'number' && Number.isFinite(value)) d = new Date(value)
  else if (typeof value === 'string' && ISO_LIKE.test(value.trim())) d = new Date(value.trim())
  return d && !Number.isNaN(d.getTime()) ? d : null
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/**
 * Format a notification time. Dates / epoch numbers / ISO strings become relative text via
 * `Intl.RelativeTimeFormat`; any other string is returned as provided; invalid input yields empty text.
 * With `now` null there is no clock yet (server render, first client render): the text is the absolute UTC time.
 */
export function formatNotificationTime(value: unknown, now: number | null = Date.now(), locale?: string): NotificationTimeResult {
  const date = toNotificationDate(value)
  if (!date) return typeof value === 'string' && value.trim() && !ISO_LIKE.test(value.trim()) ? { text: value.trim(), iso: null, title: '' } : EMPTY
  const iso = date.toISOString()
  if (now === null) {
    let utc: string
    try {
      utc = date.toLocaleString(locale, { timeZone: 'UTC' })
    } catch {
      utc = date.toLocaleString(DEFAULT_TIME_LOCALE, { timeZone: 'UTC' })
    }
    return { text: utc, iso, title: utc }
  }
  const diff = (date.getTime() - (Number.isFinite(now) ? now : Date.now())) / 1000
  const abs = Math.abs(diff)
  let title = ''
  try {
    title = date.toLocaleString(locale)
  } catch {
    title = date.toLocaleString(DEFAULT_TIME_LOCALE)
  }
  if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat !== 'function') return { text: iso.slice(0, 10), iso, title }
  let rtf: Intl.RelativeTimeFormat
  try {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  } catch {
    rtf = new Intl.RelativeTimeFormat(DEFAULT_TIME_LOCALE, { numeric: 'auto' })
  }
  if (abs < 5) return { text: rtf.format(0, 'second'), iso, title }
  const [unit, size] = UNITS.find(([, s]) => abs >= s) ?? (['second', 1] as [Intl.RelativeTimeFormatUnit, number])
  return { text: rtf.format(Math.trunc(diff / size), unit), iso, title }
}
