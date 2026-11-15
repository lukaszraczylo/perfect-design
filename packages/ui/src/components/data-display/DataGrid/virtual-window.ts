/** Pure windowing maths for fixed-height rows. Row `i` of the body occupies `[i * rowHeight, (i + 1) * rowHeight)`. */

export interface WindowInput {
  scrollTop: number
  /** Height of the visible body area (the scroll area minus the sticky header). */
  viewport: number
  rowHeight: number
  count: number
  overscan: number
}

export interface WindowRange {
  /** First rendered row (inclusive). */
  start: number
  /** Last rendered row (exclusive). */
  end: number
}

const num = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback)

export function safeRowHeight(rowHeight: number): number {
  return Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : 36
}

export function totalHeight(count: number, rowHeight: number): number {
  return Math.max(0, Math.floor(num(count, 0))) * safeRowHeight(rowHeight)
}

export function rowOffset(index: number, rowHeight: number): number {
  return index * safeRowHeight(rowHeight)
}

/** The rows to render for a scroll position: the visible rows plus `overscan` on each side, clamped to `[0, count]`. */
export function computeRange({ scrollTop, viewport, rowHeight, count, overscan }: WindowInput): WindowRange {
  const h = safeRowHeight(rowHeight)
  const n = Math.max(0, Math.floor(num(count, 0)))
  const over = overscan > 0 && Number.isFinite(overscan) ? Math.floor(overscan) : 0
  const top = Math.max(0, num(scrollTop, 0))
  const first = Math.floor(top / h)
  const last = Math.ceil((top + Math.max(0, num(viewport, 0))) / h)
  const start = Math.min(n, Math.max(0, first - over))
  const end = Math.min(n, Math.max(start, last + over))
  return { start, end }
}

/** How many rows fit in the visible body area (at least 1): the step of PageUp and PageDown. */
export function visibleRowCount(viewport: number, rowHeight: number): number {
  return Math.max(1, Math.floor(Math.max(0, num(viewport, 0)) / safeRowHeight(rowHeight)))
}

/** The smallest scroll change that brings row `index` fully into view; the current position when it already is. */
export function scrollTopToReveal(index: number, rowHeight: number, scrollTop: number, viewport: number, count: number): number {
  const h = safeRowHeight(rowHeight)
  const vh = Math.max(0, num(viewport, 0))
  const i = Math.min(Math.max(0, Math.floor(num(count, 0)) - 1), Math.max(0, Math.floor(num(index, 0))))
  const top = i * h
  const bottom = top + h
  const max = Math.max(0, totalHeight(count, h) - vh)
  let target = num(scrollTop, 0)
  if (top < target) target = top
  else if (bottom > target + vh) target = bottom - vh
  return Math.min(max, Math.max(0, target))
}

/** The indexes to mount: the window plus one extra row (the focused one) when it lies outside it, in ascending order. */
export function renderedIndexes(range: WindowRange, extra: number | null, count: number): number[] {
  const out: number[] = []
  const hasExtra = extra !== null && extra >= 0 && extra < count && (extra < range.start || extra >= range.end)
  if (hasExtra && (extra as number) < range.start) out.push(extra as number)
  for (let i = range.start; i < range.end; i++) out.push(i)
  if (hasExtra && (extra as number) >= range.end) out.push(extra as number)
  return out
}
