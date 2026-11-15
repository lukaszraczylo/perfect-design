import type { InjectionKey } from 'vue'
import type { TableDensity, TableLayout, TableSelectedTone, TableSize, TableVariant } from './variants'

/** Internal: Table shares row-level options with its TableRow descendants (keeps default row output unchanged). */
export interface TableContext {
  striped: () => boolean
  hoverable: () => boolean
  selectedTone: () => TableSelectedTone
  density: () => TableDensity
  size: () => TableSize
  variant: () => TableVariant
  layout: () => TableLayout
  /** TableCaption registers its id so the scroll region can be named by it. */
  setCaptionId: (id: string | undefined) => void
}
export const tableContextKey: InjectionKey<TableContext> = Symbol('table')

/** Internal: a wrapper (DataTable) that names the table itself provides this so `Table` does not report the same gap twice. */
export const tableNamedByOwnerKey: InjectionKey<boolean> = Symbol('table-named-by-owner')
