/**
 * Parse a highlight spec into a set of line numbers within `[min, max]`.
 * Accepts numbers (`[2, 5]`) or a string (`"1,3-5"`). Invalid tokens are ignored, reversed ranges (`"5-3"`) are swapped,
 * ranges are clamped to the visible lines so a huge range costs nothing.
 */
export function parseLineSpec(input: unknown, min: number, max: number): Set<number> {
  const out = new Set<number>()
  const add = (a: number, b: number) => {
    const lo = Math.max(min, Math.min(a, b))
    const hi = Math.min(max, Math.max(a, b))
    for (let n = lo; n <= hi; n++) out.add(n)
  }
  const tokens: unknown[] = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : typeof input === 'number' ? [input] : []
  for (const token of tokens) {
    if (typeof token === 'number') {
      if (Number.isSafeInteger(token)) add(token, token)
      continue
    }
    if (typeof token !== 'string') continue
    const m = /^\s*(\d{1,15})\s*(?:-\s*(\d{1,15})\s*)?$/.exec(token)
    if (m) add(Number(m[1]), Number(m[2] ?? m[1]))
  }
  return out
}

/** First line number: a finite number is truncated; anything below 1 or invalid becomes 1. */
export function normaliseStartLine(value: unknown): number {
  const n = typeof value === 'number' ? Math.trunc(value) : NaN
  return Number.isFinite(n) && n >= 1 ? n : 1
}
