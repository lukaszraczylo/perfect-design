/** Pure helpers for TimeInput. Times are 24h `HH:mm` strings; minutes-of-day are integers 0..1439. */

export interface TimeInputParts {
  hour: number
  minute: number
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

/** Parse `H:mm` / `HH:mm` (24h). Returns null for anything else (including `24:00`, `12:60`, non-strings). */
export function parseTimeInput(value: unknown): TimeInputParts | null {
  if (typeof value !== 'string') return null
  const m = TIME_RE.exec(value.trim())
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : null
}

export const padTime = (n: number): string => String(n).padStart(2, '0')

export function formatTimeInput(hour: number, minute: number): string {
  return `${padTime(hour)}:${padTime(minute)}`
}

/** Minutes since midnight of a valid time string, or null. */
export function timeToMinutes(value: unknown): number | null {
  const p = parseTimeInput(value)
  return p ? p.hour * 60 + p.minute : null
}

/** Valid multiples of `step` inside an hour (`step` is floored, clamped to 1..60; non-numbers become 1). */
export function minuteOptions(step: unknown): number[] {
  const s = Math.min(60, Math.max(1, Math.floor(Number(step)) || 1))
  const out: number[] = []
  for (let m = 0; m < 60; m += s) out.push(m)
  return out
}
