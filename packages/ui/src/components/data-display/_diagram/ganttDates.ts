/**
 * Date math of the Gantt chart: own format-token parser (`YYYY`, `YY`, `MM`, `DD`, `HH`, `mm`), durations and
 * formatting. Everything is UTC through `Date.UTC`, so results never depend on the viewer's locale or time zone.
 */

export const MS_MINUTE = 60_000
export const MS_HOUR = 3_600_000
export const MS_DAY = 86_400_000
export const MS_WEEK = 7 * MS_DAY

export type DateToken = 'YYYY' | 'YY' | 'MM' | 'DD' | 'HH' | 'mm'

export interface DateFormat {
  /** Format as written, for messages. */
  source: string
  parts: ({ token: DateToken } | { literal: string })[]
  /** True when the format carries hours or minutes. */
  hasTime: boolean
}

const TOKEN = /^(YYYY|YY|MM|DD|HH|mm)/

/** Compile a Mermaid `dateFormat`. Returns the offending character index when a letter is not a supported token. */
export function compileDateFormat(source: string): DateFormat | number {
  const parts: DateFormat['parts'] = []
  let hasTime = false
  let i = 0
  let hasDay = false
  while (i < source.length) {
    const m = TOKEN.exec(source.slice(i))
    if (m) {
      const token = m[1] as DateToken
      parts.push({ token })
      if (token === 'HH' || token === 'mm') hasTime = true
      else hasDay = true
      i += token.length
      continue
    }
    const ch = source[i]!
    if (/[A-Za-z]/.test(ch)) return i
    parts.push({ literal: ch })
    i++
  }
  if (!hasDay && !hasTime) return 0
  return { source, parts, hasTime }
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0')

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Parse `text` with a compiled format; undefined when it does not match or is not a real date. */
export function parseDateText(text: string, fmt: DateFormat): number | undefined {
  let pos = 0
  let year = 1970
  let month = 1
  let day = 1
  let hour = 0
  let minute = 0
  for (const part of fmt.parts) {
    if ('literal' in part) {
      if (text[pos] !== part.literal) return undefined
      pos++
      continue
    }
    const width = part.token === 'YYYY' ? 4 : 2
    const chunk = text.slice(pos, pos + width)
    if (chunk.length !== width || !/^\d+$/.test(chunk)) return undefined
    pos += width
    const n = Number(chunk)
    if (part.token === 'YYYY') year = n
    else if (part.token === 'YY') year = 2000 + n
    else if (part.token === 'MM') month = n
    else if (part.token === 'DD') day = n
    else if (part.token === 'HH') hour = n
    else minute = n
  }
  if (pos !== text.length) return undefined
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month) || hour > 23 || minute > 59) return undefined
  const d = new Date(Date.UTC(2000, month - 1, day, hour, minute))
  d.setUTCFullYear(year)
  return d.getTime()
}

const UNIT_MS: Record<string, number> = { ms: 1, s: 1000, m: MS_MINUTE, h: MS_HOUR, d: MS_DAY, w: MS_WEEK }

/** `3d`, `2w`, `12h`, `30m`, `45s`, `500ms`, `1.5d` to milliseconds (calendar units `M` and `y` need a start: see `durationEnd`); undefined for anything else. */
export function parseDuration(text: string): number | undefined {
  const m = /^(\d+(?:\.\d+)?)([a-zA-Z]+)$/.exec(text.trim())
  if (!m) return undefined
  const unit = UNIT_MS[m[2]!]
  return unit === undefined ? undefined : Number(m[1]) * unit
}

/**
 * End time of a duration that starts at `start`, with Mermaid's units: ms s m h d w, plus calendar months `M` and years
 * `y` (whole numbers; the day of the month is kept, clamped to the length of the target month).
 */
export function durationEnd(start: number, text: string): number | undefined {
  const fixed = parseDuration(text)
  if (fixed !== undefined) return start + fixed
  const m = /^(\d+)([My])$/.exec(text.trim())
  if (!m) return undefined
  const d = new Date(start)
  const months = Number(m[1]) * (m[2] === 'y' ? 12 : 1)
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months
  const year = Math.floor(total / 12)
  const month = total % 12
  const day = Math.min(d.getUTCDate(), daysInMonth(year, month + 1))
  const out = new Date(Date.UTC(2000, month, day, d.getUTCHours(), d.getUTCMinutes()))
  out.setUTCFullYear(year)
  return out.getTime()
}

/** True when the text looks like a duration (digits plus letters), so the error can name the unit. */
export function looksLikeDuration(text: string): RegExpExecArray | null {
  return /^(\d+(?:\.\d+)?)([a-zA-Z]+)$/.exec(text.trim())
}

export function formatDay(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function formatDateTime(ms: number, withTime: boolean): string {
  if (!withTime) return formatDay(ms)
  const d = new Date(ms)
  return `${formatDay(ms)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function startOfMonth(ms: number): number {
  const d = new Date(ms)
  const r = new Date(Date.UTC(2000, d.getUTCMonth(), 1))
  r.setUTCFullYear(d.getUTCFullYear())
  return r.getTime()
}

export function addMonths(ms: number, n: number): number {
  const d = new Date(ms)
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + n
  const r = new Date(Date.UTC(2000, ((total % 12) + 12) % 12, 1))
  r.setUTCFullYear(Math.floor(total / 12))
  return r.getTime()
}

export function startOfDay(ms: number): number {
  return Math.floor(ms / MS_DAY) * MS_DAY
}

/** Monday on or before `ms` (1970-01-01 was a Thursday). */
export function startOfWeek(ms: number): number {
  const day = startOfDay(ms)
  const dow = (Math.floor(day / MS_DAY) + 3) % 7 // 0 = Monday
  return day - ((dow + 7) % 7) * MS_DAY
}

export interface Tick {
  at: number
  label: string
}

/** Readable ticks for a span: hours for short spans, days, weeks (Mondays) or months. */
export function makeTicks(from: number, to: number, withTime: boolean): Tick[] {
  const span = Math.max(to - from, 1)
  const ticks: Tick[] = []
  const label = (ms: number, mode: 'time' | 'day' | 'month'): string => {
    const d = new Date(ms)
    if (mode === 'time') return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
    if (mode === 'month') return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
  }
  if (span <= 2 * MS_DAY && withTime) {
    const step = span <= 8 * MS_HOUR ? MS_HOUR : span <= 24 * MS_HOUR ? 3 * MS_HOUR : 6 * MS_HOUR
    for (let t = Math.ceil(from / step) * step; t <= to && ticks.length < 200; t += step) ticks.push({ at: t, label: label(t, 'time') })
    return ticks
  }
  if (span <= 21 * MS_DAY) {
    for (let t = startOfDay(from); t <= to && ticks.length < 200; t += MS_DAY) if (t >= from) ticks.push({ at: t, label: label(t, 'day') })
    if (ticks.length === 0) ticks.push({ at: startOfDay(from), label: label(from, 'day') })
    return ticks
  }
  if (span <= 150 * MS_DAY) {
    for (let t = startOfWeek(from); t <= to && ticks.length < 200; t += MS_WEEK) if (t >= from) ticks.push({ at: t, label: label(t, 'day') })
    return ticks
  }
  for (let t = startOfMonth(from); t <= to && ticks.length < 400; t = addMonths(t, 1)) if (t >= from) ticks.push({ at: t, label: label(t, 'month') })
  return ticks
}
