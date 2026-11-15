/** Pure keyboard model of the grid. Row 0 is the header row; rows 1..rowCount are data rows. */

export interface GridPos {
  row: number
  col: number
}

export interface NavContext {
  /** Number of data rows (the header row is extra). */
  rowCount: number
  /** Number of columns, the selection column included. */
  colCount: number
  /** Rows moved by PageUp and PageDown. */
  pageRows: number
  rtl: boolean
}

export const NAV_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'] as const
export type NavKey = (typeof NAV_KEYS)[number]
export const isNavKey = (key: string): key is NavKey => (NAV_KEYS as readonly string[]).includes(key)

export function clampPos(pos: GridPos, ctx: NavContext): GridPos {
  const lastRow = Math.max(0, ctx.rowCount)
  const lastCol = Math.max(0, ctx.colCount - 1)
  const row = Number.isFinite(pos.row) ? pos.row : 0
  const col = Number.isFinite(pos.col) ? pos.col : 0
  return { row: Math.min(lastRow, Math.max(0, Math.floor(row))), col: Math.min(lastCol, Math.max(0, Math.floor(col))) }
}

/**
 * The position after a navigation key. Arrow keys follow the reading direction (they swap in right-to-left), Home and End
 * go to the first and last column, with Ctrl (or Cmd) to the first and last cell of the grid, PageUp and PageDown move by
 * `pageRows`. The result is always inside the grid.
 */
export function navigate(pos: GridPos, key: NavKey, ctrl: boolean, ctx: NavContext): GridPos {
  const p = clampPos(pos, ctx)
  const lastRow = Math.max(0, ctx.rowCount)
  const lastCol = Math.max(0, ctx.colCount - 1)
  const step = Math.max(1, Math.floor(ctx.pageRows) || 1)
  const forward = ctx.rtl ? -1 : 1
  switch (key) {
    case 'ArrowRight':
      return clampPos({ row: p.row, col: p.col + forward }, ctx)
    case 'ArrowLeft':
      return clampPos({ row: p.row, col: p.col - forward }, ctx)
    case 'ArrowDown':
      return { row: Math.min(lastRow, p.row + 1), col: p.col }
    case 'ArrowUp':
      return { row: Math.max(0, p.row - 1), col: p.col }
    case 'Home':
      return ctrl ? { row: 0, col: 0 } : { row: p.row, col: 0 }
    case 'End':
      return ctrl ? { row: lastRow, col: lastCol } : { row: p.row, col: lastCol }
    case 'PageDown':
      return { row: Math.min(lastRow, p.row + step), col: p.col }
    case 'PageUp':
      return { row: Math.max(0, p.row - step), col: p.col }
  }
}

export const samePos = (a: GridPos | null, b: GridPos | null): boolean => !!a && !!b && a.row === b.row && a.col === b.col

export interface CellRange {
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
}

/** The rectangle between two cells, both ends inclusive. */
export function rangeBetween(a: GridPos, b: GridPos): CellRange {
  return { rowStart: Math.min(a.row, b.row), rowEnd: Math.max(a.row, b.row), colStart: Math.min(a.col, b.col), colEnd: Math.max(a.col, b.col) }
}

export const inRange = (range: CellRange | null, row: number, col: number): boolean =>
  !!range && row >= range.rowStart && row <= range.rowEnd && col >= range.colStart && col <= range.colEnd
