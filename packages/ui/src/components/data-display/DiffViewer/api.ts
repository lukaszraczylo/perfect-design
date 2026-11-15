import { diffLines, splitLines } from './diff'

/** Number of added and removed lines between two texts (uses the same engine as the viewer). */
export function diffCount(oldText: string, newText: string): { added: number; removed: number; approximate: boolean } {
  const a = splitLines(String(oldText ?? ''))
  const b = splitLines(String(newText ?? ''))
  const { ops, approximate } = diffLines(a, b)
  let added = 0
  let removed = 0
  for (const op of ops) {
    if (op === 1) added++
    else if (op === -1) removed++
  }
  return { added, removed, approximate }
}
