import { hasEscapes, stripAnsi } from './ansi'

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]
export const LOG_LEVEL_TEXT: Record<LogLevel, string> = { debug: 'DEBUG', info: 'INFO', warn: 'WARN', error: 'ERROR' }

export interface LogLine {
  /** Text shown as given, or a Date / epoch milliseconds formatted with Intl. */
  time?: string | number | Date
  /** debug, info, warn or error (also trace, notice, warning, err, fatal, critical; any case). Unknown values show no badge. */
  level?: string
  message: string
  source?: string
}

export interface LogRecord {
  /** Position in the (capped) input. */
  index: number
  level?: LogLevel
  time?: string
  datetime?: string
  source?: string
  /** Message with its escape sequences, for styled rendering. */
  raw: string
  /** Message without escapes: what the filter searches and the copy button copies. */
  text: string
  /** True when `raw` holds escapes that need parsing. */
  ansi: boolean
  /** The whole line as plain text, for copying. */
  copy: string
}

const ALIASES: Record<string, LogLevel> = {
  trace: 'debug', debug: 'debug', dbg: 'debug', info: 'info', notice: 'info', warn: 'warn', warning: 'warn', err: 'error', error: 'error', fatal: 'error', critical: 'error', crit: 'error', panic: 'error',
}
export function normaliseLevel(value: unknown): LogLevel | undefined {
  return typeof value === 'string' ? ALIASES[value.trim().toLowerCase()] : undefined
}

// A level word at the very start of a plain string line, optionally in brackets and preceded by colour codes.
const LEADING_LEVEL = /^((?:\u001b\[[0-9;]*m)*)\[?\s*(trace|debug|dbg|info|notice|warning|warn|error|err|fatal|critical|crit|panic)\s*\]?(?::|\b)(?:\u001b\[[0-9;]*m)*[ \t]*/i

export interface FormatOptions {
  locale?: string
  timeZone?: string
}

export function formatTime(time: unknown, options: FormatOptions = {}): { text: string; datetime?: string } {
  if (typeof time === 'string') {
    const text = time.trim()
    return { text, datetime: /^\d{4}-\d{2}-\d{2}T/.test(text) && !Number.isNaN(Date.parse(text)) ? text : undefined }
  }
  if (typeof time === 'number' || time instanceof Date) {
    const date = new Date(time)
    if (Number.isNaN(date.getTime())) return { text: '' }
    let text: string
    try {
      text = new Intl.DateTimeFormat(options.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23', timeZone: options.timeZone }).format(date)
    } catch {
      text = date.toISOString()
    }
    return { text, datetime: date.toISOString() }
  }
  return { text: '' }
}

function fromString(line: string, index: number): LogRecord {
  let raw = String(line)
  let level: LogLevel | undefined
  const m = LEADING_LEVEL.exec(raw)
  if (m) {
    level = normaliseLevel(m[2])
    raw = m[1] + raw.slice(m[0].length)
  }
  const ansi = hasEscapes(raw)
  const copy = hasEscapes(line) ? stripAnsi(line) : line
  return { index, level, raw, text: ansi ? stripAnsi(raw) : raw, ansi, copy }
}

function fromObject(line: LogLine, index: number, options: FormatOptions): LogRecord {
  const raw = typeof line.message === 'string' ? line.message : line.message == null ? '' : String(line.message)
  const level = normaliseLevel(line.level)
  const time = formatTime(line.time, options)
  const source = typeof line.source === 'string' && line.source.trim() ? line.source.trim() : undefined
  const ansi = hasEscapes(raw)
  const text = ansi ? stripAnsi(raw) : raw
  const copy = [time.text, level ? level.toUpperCase() : '', source ?? '', text].filter(Boolean).join(' ')
  return { index, level, time: time.text || undefined, datetime: time.datetime, source, raw, text, ansi, copy }
}

/** Normalise the input, keeping only the last `maxLines` entries. Returns the records and how many older lines were dropped. */
export function buildRecords(lines: readonly (string | LogLine)[] | null | undefined, maxLines?: number, options: FormatOptions = {}): { records: LogRecord[]; dropped: number } {
  const input = Array.isArray(lines) ? lines : []
  const cap = typeof maxLines === 'number' && Number.isFinite(maxLines) && maxLines > 0 ? Math.floor(maxLines) : Infinity
  const dropped = Math.max(0, input.length - cap)
  const records: LogRecord[] = new Array(input.length - dropped)
  for (let i = dropped; i < input.length; i++) {
    const line = input[i]
    records[i - dropped] =
      typeof line === 'string' ? fromString(line, i - dropped) : line && typeof line === 'object' ? fromObject(line, i - dropped, options) : fromString(line == null ? '' : String(line), i - dropped)
  }
  return { records, dropped }
}

/** Split text into pieces, flagging case-insensitive occurrences of `query`. */
export function splitMatches(text: string, query: string): { text: string; match: boolean }[] {
  if (!query) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (lower.length !== text.length) return [{ text, match: false }]
  const out: { text: string; match: boolean }[] = []
  let at = 0
  for (;;) {
    const hit = lower.indexOf(q, at)
    if (hit < 0) break
    if (hit > at) out.push({ text: text.slice(at, hit), match: false })
    out.push({ text: text.slice(hit, hit + q.length), match: true })
    at = hit + q.length
  }
  if (at < text.length) out.push({ text: text.slice(at), match: false })
  return out.length ? out : [{ text, match: false }]
}
