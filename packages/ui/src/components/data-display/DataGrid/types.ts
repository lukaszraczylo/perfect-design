import type { BaseProps } from '../../../lib/types'
export type { SortState } from '../DataTable/types'
import type { SortState } from '../DataTable/types'


export type DataGridRowId = string | number
export type DataGridColumnType = 'text' | 'number' | 'select'
export type DataGridAlign = 'start' | 'center' | 'end'
export type DataGridPinned = 'start' | 'end'
export type DataGridDensity = 'compact' | 'default' | 'comfortable'
export type DataGridVariant = 'bordered' | 'striped' | 'borderless'
export type DataGridSize = 'sm' | 'md' | 'lg'

export interface DataGridOption {
  value: string | number
  label: string
}

export interface DataGridColumn<T = Record<string, unknown>> {
  /** Unique column id; also the row property read and the `cell-<key>` / `header-<key>` slot suffix. */
  key: string
  /** Header text. */
  label: string
  /** Cell type: decides the editor (`text` input, `number` input, `select`) and the default alignment. Default `text`. */
  type?: DataGridColumnType
  /** Cells of this column open an editor on Enter, F2 or double click. Default false. */
  editable?: boolean
  /** Initial width in px (default 160). */
  width?: number
  /** Smallest width a resize can reach, in px (default 48). */
  minWidth?: number
  /** Largest width a resize can reach, in px (default 1000). */
  maxWidth?: number
  /** Stick the column to the inline start or end edge while the grid scrolls sideways. */
  pinned?: DataGridPinned
  sortable?: boolean
  /** `false` removes the resize handle. */
  resizable?: boolean
  /** Logical alignment; numbers default to `end`. */
  align?: DataGridAlign
  /** Options of a `select` column: plain values or `{ value, label }`. */
  options?: (string | number | DataGridOption)[]
  /** Text shown (and copied) for a cell. Defaults to the value as a string. */
  formatter?: (value: unknown, row: T) => string
}

export interface DataGridValidateContext<T = Record<string, unknown>> {
  row: T
  rowKey: DataGridRowId
  rowIndex: number
  column: DataGridColumn<T>
  previousValue: unknown
}

export interface DataGridCellEdit<T = Record<string, unknown>> {
  row: T
  rowKey: DataGridRowId
  /** Index in the source `rows` array. */
  rowIndex: number
  column: DataGridColumn<T>
  value: unknown
  previousValue: unknown
}

/** Props besides the three v-models: `v-model:rows`, `v-model:sort` and `v-model:selected`. */
export interface DataGridProps<T = Record<string, unknown>> extends BaseProps {
  columns: DataGridColumn<T>[]
  /** Row property or function giving a unique string or number id. Default `'id'`; a missing id falls back to the index. */
  rowKey?: keyof T | ((row: T, index: number) => DataGridRowId)
  /** Accessible name of the grid. Required unless `aria-label` / `aria-labelledby` is set. */
  label?: string
  /** Adds a leading checkbox column and row selection. */
  selectable?: boolean
  /** Return an error text to reject a value; return nothing to accept it. */
  validate?: (value: unknown, context: DataGridValidateContext<T>) => string | null | undefined | void
  /** Height of the scroll area (px number or any CSS length). Virtual grids default to 480px. */
  height?: number | string
  /** Window the rows: `'auto'` (default) above 200 rows, `true` always, `false` never. */
  virtual?: boolean | 'auto'
  /** Rows rendered above and below the visible window. */
  overscan?: number
  density?: DataGridDensity
  variant?: DataGridVariant
  size?: DataGridSize
  loading?: boolean
  emptyText?: string
  nullText?: string
  /** Text direction. `auto` reads the nearest `dir` attribute. */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** Prefix copied text that a spreadsheet would run as a formula (default true). */
  neutralizeFormulas?: boolean
}
