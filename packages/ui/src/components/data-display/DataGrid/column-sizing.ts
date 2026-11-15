import type { DataGridColumn } from './types'

export const DEFAULT_COLUMN_WIDTH = 160
export const DEFAULT_MIN_WIDTH = 48
export const DEFAULT_MAX_WIDTH = 1000
export const SELECT_COLUMN_WIDTH = 44
export const RESIZE_STEP = 10
export const RESIZE_STEP_LARGE = 50

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function minWidthOf(column: Pick<DataGridColumn, 'minWidth'>): number {
  return finite(column.minWidth) && column.minWidth > 0 ? column.minWidth : DEFAULT_MIN_WIDTH
}

export function maxWidthOf(column: Pick<DataGridColumn, 'minWidth' | 'maxWidth'>): number {
  const min = minWidthOf(column)
  return finite(column.maxWidth) && column.maxWidth >= min ? column.maxWidth : Math.max(DEFAULT_MAX_WIDTH, min)
}

export function clampWidth(width: number, column: Pick<DataGridColumn, 'minWidth' | 'maxWidth'>): number {
  const min = minWidthOf(column)
  const max = maxWidthOf(column)
  const w = typeof width === 'number' && !Number.isNaN(width) ? width : DEFAULT_COLUMN_WIDTH
  return Math.round(Math.min(max, Math.max(min, w)))
}

/** Current width of a column: the user's resize when there is one, else the column's `width`, else the default. */
export function widthOf(column: DataGridColumn, overrides: Readonly<Record<string, number>>): number {
  const override = overrides[column.key]
  return clampWidth(finite(override) ? override : finite(column.width) ? column.width : DEFAULT_COLUMN_WIDTH, column)
}

/** Pinned-start columns first, pinned-end columns last, the rest in the given order. Never mutates its input. */
export function orderColumns<T>(columns: readonly DataGridColumn<T>[]): DataGridColumn<T>[] {
  const start = columns.filter((c) => c.pinned === 'start')
  const end = columns.filter((c) => c.pinned === 'end')
  const mid = columns.filter((c) => c.pinned !== 'start' && c.pinned !== 'end')
  return [...start, ...mid, ...end]
}

export interface StickyOffsets {
  /** Per column: inline-start offset in px when pinned to the start, else null. */
  start: (number | null)[]
  /** Per column: inline-end offset in px when pinned to the end, else null. */
  end: (number | null)[]
  /** Total width of the start-pinned columns (the scroll padding that keeps a focused cell clear of them). */
  startWidth: number
  endWidth: number
}

/** Sticky offsets for a list of widths. `pinned[i]` says where column i is pinned; the selection column passes 'start'. */
export function stickyOffsets(widths: readonly number[], pinned: readonly (('start' | 'end') | undefined)[]): StickyOffsets {
  const start: (number | null)[] = widths.map(() => null)
  const end: (number | null)[] = widths.map(() => null)
  let acc = 0
  for (let i = 0; i < widths.length; i++) {
    if (pinned[i] === 'start') {
      start[i] = acc
      acc += widths[i]
    }
  }
  const startWidth = acc
  acc = 0
  for (let i = widths.length - 1; i >= 0; i--) {
    if (pinned[i] === 'end') {
      end[i] = acc
      acc += widths[i]
    }
  }
  return { start, end, startWidth, endWidth: acc }
}

export const gridTemplate = (widths: readonly number[]): string => widths.map((w) => `${w}px`).join(' ')
export const sumWidths = (widths: readonly number[]): number => widths.reduce((a, b) => a + b, 0)

/** Width after dragging by `delta` px in the reading direction (the caller flips the sign in right-to-left). `±Infinity` jumps to the limit. */
export const resizeBy = (current: number, delta: number, column: Pick<DataGridColumn, 'minWidth' | 'maxWidth'>): number => clampWidth(current + (Number.isNaN(delta) ? 0 : delta), column)
