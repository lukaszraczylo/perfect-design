export type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end'

/** Coerce to a finite integer within [min, max]; anything non-numeric becomes `fallback`. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n)) return Math.min(Math.max(fallback, min), max)
  return Math.min(Math.max(Math.trunc(n), min), max)
}

/**
 * Page numbers to render: first and last page are always present, `siblings` pages stay on each side of
 * the current page and gaps collapse to an ellipsis (a gap of exactly one page shows that page instead).
 * The output length is constant (`2 * siblings + 5`) once there are enough pages, so the control never jumps.
 */
export function getPaginationRange(page: number, totalPages: number, siblings = 1): PaginationItem[] {
  const total = clampInt(totalPages, 1, Number.MAX_SAFE_INTEGER, 1)
  const current = clampInt(page, 1, total, 1)
  const sib = clampInt(siblings, 0, 10, 1)
  const slots = 2 * sib + 5
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1)

  const left = Math.max(current - sib, 1)
  const right = Math.min(current + sib, total)
  const showStartEllipsis = left > 3
  const showEndEllipsis = right < total - 2
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

  if (!showStartEllipsis && showEndEllipsis) return [...range(1, 3 + 2 * sib), 'ellipsis-end', total]
  if (showStartEllipsis && !showEndEllipsis) return [1, 'ellipsis-start', ...range(total - (2 + 2 * sib), total)]
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', total]
}
