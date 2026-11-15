import type { BaseProps } from '../../../lib/types'
import type { TableDensity, TableLayout, TableSize, TableVariant } from '../Table/variants'

export type RowId = string | number

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface DataTableColumn<T = unknown> {
  /** Unique column id; also the default row property read and the `cell-<key>` / `header-<key>` slot suffix. */
  key: string
  /** Header text. */
  header: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  /** Numeric column: right-aligned (unless `align` is set) with tabular figures. `align: 'right'` implies the same figures. */
  numeric?: boolean
  /** Render this column's body cells as row headers (`<th scope="row">`); the row checkbox is named after it. */
  rowHeader?: boolean
  /** CSS width of the column, e.g. `'8rem'` or `'20%'`. */
  width?: string
  /** Read the cell value from a row. Defaults to `row[key]`. Also used for sorting. */
  accessor?: (row: T) => unknown
  /** Extra classes for this column's header and body cells. */
  class?: string
}

export interface DataTableCellSlotProps<T> {
  row: T
  value: unknown
  column: DataTableColumn<T>
  /** Index of the row in the source `rows` array (not the sorted/paged position). */
  index: number
}

export interface DataTableProps<R> extends BaseProps {
  columns: DataTableColumn<R>[]
  rows: R[]
  /** Row property name or function giving a unique id. Missing ids fall back to the row index. Default `'id'`. */
  rowKey?: keyof R | ((row: R, index: number) => RowId)
  /** Adds a leading checkbox column. */
  selectable?: boolean
  /** 1-based page size. Undefined / 0 / negative / NaN / Infinity disable pagination; fractions are floored. */
  pageSize?: number
  /** Show skeleton rows instead of data and set aria-busy. */
  loading?: boolean
  /** Number of skeleton rows. Defaults to the page size, else 5. */
  loadingRows?: number
  emptyText?: string
  /** Text for null / undefined cells. */
  nullText?: string
  /** Make rows clickable (emits `row-click`, keyboard accessible). */
  rowClickable?: boolean
  /** Cell padding scale: `compact`, `default` or `comfortable`. */
  density?: TableDensity
  /** Text size: `sm`, `md` (default) or `lg`. */
  size?: TableSize
  /** `default` (row dividers), `borderless` or `filled` (muted header band). */
  variant?: TableVariant
  /** Tint every second body row. */
  striped?: boolean
  /** Outer frame plus column rules. */
  bordered?: boolean
  /** `table` (default) or `cards`: below the `sm` breakpoint each row becomes a stacked card of label and value pairs. */
  layout?: TableLayout
  stickyHeader?: boolean
  /**
   * With `layout="cards"`, show a "Sort by" select plus direction button and a "Select all" checkbox above the cards below the
   * `sm` breakpoint (the header row is hidden there). They write the same `sort` and `selected` values as the header. Default
   * `true`; set `false` to supply your own.
   */
  cardControls?: boolean
  /** Visible label of the cards-layout sort select. Default `'Sort by'`. */
  sortByLabel?: string
  /** Name of the cards-layout direction button (its text is the current direction). Default `'Sort direction'`. */
  sortDirectionLabel?: string
  /** Cards-layout select option that clears the sort. Default `'Default order'`. */
  sortDefaultLabel?: string
  /** Default `'Ascending'`. */
  sortAscendingLabel?: string
  /** Default `'Descending'`. */
  sortDescendingLabel?: string
  /** Visible label of the cards-layout "Select all" checkbox. Default `'Select all'`. */
  selectAllLabel?: string
  /** Classes for the scroll container. */
  containerClass?: BaseProps['class']
  /** Class for the inner <table>. `class` goes on the root wrapper. */
  tableClass?: BaseProps['class']
  /** Visually hidden caption. Required unless `label` is set. */
  caption?: string
  /** aria-label for the table. Required unless `caption` is set. */
  label?: string
}
