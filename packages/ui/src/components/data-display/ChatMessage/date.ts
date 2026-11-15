/** Date helpers shared by ChatMessage (time) and ChatThread (day separators). Every function is safe for bad input and bad locale or time zone names. */

export type ChatDateInput = string | number | Date | null | undefined

/** A valid `Date` for the input, or `null`. */
export function toDate(value: ChatDateInput): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const cache = new Map<string, Intl.DateTimeFormat>()

/** An `Intl.DateTimeFormat` that never throws: a bad time zone or locale is dropped instead. Formatters are cached, a thread of 1000 messages would otherwise build 1000. */
function formatter(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const id = `${locale ?? ''}|${options.timeStyle ?? ''}|${options.dateStyle ?? ''}|${options.year ?? ''}|${options.timeZone ?? ''}`
  const hit = cache.get(id)
  if (hit) return hit
  const attempts: [string | undefined, Intl.DateTimeFormatOptions][] = [
    [locale, options],
    [locale, { ...options, timeZone: undefined }],
    [undefined, options],
  ]
  let made: Intl.DateTimeFormat | undefined
  for (const [l, o] of attempts) {
    try {
      made = new Intl.DateTimeFormat(l, o)
      break
    } catch {
      // try the next, more lenient combination
    }
  }
  made ??= new Intl.DateTimeFormat(undefined, { ...options, timeZone: undefined })
  if (cache.size > 64) cache.clear()
  cache.set(id, made)
  return made
}

/** Short clock time in the locale, e.g. `10:42 AM`. */
export function formatTime(date: Date, locale?: string, timeZone?: string): string {
  return formatter(locale, { timeStyle: 'short', timeZone }).format(date)
}

/** Calendar day as `YYYY-MM-DD` in the given time zone (local when omitted). Used to group messages and as the `datetime` value. */
export function dayKey(date: Date, timeZone?: string): string {
  const parts = formatter('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year').padStart(4, '0')}-${get('month')}-${get('day')}`
}

const upperFirst = (text: string, locale?: string): string => {
  try {
    return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
  } catch {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }
}

/** The key of the calendar day before `key`. */
function previousKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/**
 * Day label: "Today" and "Yesterday" in the locale when `now` is given, otherwise a medium date such as `Nov 15, 2026`.
 * Pass `now` only after mount: it depends on the visitor's clock.
 */
export function formatDay(date: Date, locale?: string, timeZone?: string, now?: Date | null): string {
  if (now) {
    const key = dayKey(date, timeZone)
    const today = dayKey(now, timeZone)
    const offset = key === today ? 0 : key === previousKey(today) ? -1 : null
    if (offset !== null) {
      try {
        return upperFirst(new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(offset, 'day'), locale)
      } catch {
        // fall through to the plain date
      }
    }
  }
  return formatter(locale, { dateStyle: 'medium', timeZone }).format(date)
}
