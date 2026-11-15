import type { CodeBlockDiffKind } from './variants'

/** Classify a unified-diff style line by its first characters: `+` added, `-` removed, `@@` hunk header. */
export function diffKind(line: string): CodeBlockDiffKind {
  if (line.startsWith('@@')) return 'hunk'
  if (line.startsWith('+')) return 'add'
  if (line.startsWith('-')) return 'remove'
  return 'none'
}

/**
 * Parse 1-based highlight line input into a set. Accepts an array of numbers (`[1, 3]`) or a spec string
 * (`"1,3-5"`). Invalid tokens are ignored, reversed ranges are swapped and ranges are clamped to `total`.
 */
export function parseHighlightLines(input: unknown, total: number): Set<number> {
  const out = new Set<number>()
  const add = (from: number, to: number) => {
    const lo = Math.max(1, Math.min(from, to))
    const hi = Math.min(total, Math.max(from, to))
    for (let n = lo; n <= hi; n++) out.add(n)
  }
  const tokens: unknown[] = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : []
  for (const token of tokens) {
    if (typeof token === 'number') {
      if (Number.isInteger(token)) add(token, token)
      continue
    }
    if (typeof token !== 'string') continue
    const m = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(token)
    if (m) add(Number(m[1]), Number(m[2] ?? m[1]))
  }
  return out
}
