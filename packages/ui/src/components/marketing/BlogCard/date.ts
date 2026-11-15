const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/

/** True for ISO 8601 dates (`2024-03-01`, `2024-03-01T10:00:00Z`) that exist on the calendar and parse. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = ISO_RE.exec(value.trim())
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const probe = new Date(Date.UTC(y, mo - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return false
  return !Number.isNaN(Date.parse(value.trim().replace(' ', 'T')))
}

/**
 * Human readable date. Formatted in UTC so server and client render the same text (no hydration drift);
 * an unsupported locale falls back to `en-US`.
 */
export function formatIsoDate(value: string, locale = 'en-US'): string {
  const date = new Date(value.trim().replace(' ', 'T'))
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
  try {
    return new Intl.DateTimeFormat(locale, options).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }
}
