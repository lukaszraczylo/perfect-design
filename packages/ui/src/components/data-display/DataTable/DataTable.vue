<script setup lang="ts" generic="T">
import { computed, getCurrentInstance, nextTick, onBeforeUpdate, provide, ref, useSlots, watch, watchPostEffect } from 'vue'
import { useDateLocale } from '../_shared/dateLocale'
import { requireOneOf, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Table from '../Table/Table.vue'
import TableBody from '../Table/TableBody.vue'
import TableCaption from '../Table/TableCaption.vue'
import TableCell from '../Table/TableCell.vue'
import TableEmpty from '../Table/TableEmpty.vue'
import TableFooter from '../Table/TableFooter.vue'
import TableHead from '../Table/TableHead.vue'
import TableHeader from '../Table/TableHeader.vue'
import TableRow from '../Table/TableRow.vue'
import { tableNamedByOwnerKey } from '../Table/context'
import type { TableDensity } from '../Table/variants'
import { hasText, useMountedCheck } from '../_shared/contract'
import SortHeaderButton from './SortHeaderButton.vue'
import TableCardControls from './TableCardControls.vue'
import { tableCheckboxClasses } from './selectStyles'
import { isMissing, nextSort, sortRows } from './sort'
import type { DataTableCellSlotProps, DataTableColumn, DataTableProps, RowId, SortState } from './types'

const props = withDefaults(defineProps<DataTableProps<T>>(), {
  selectable: false,
  loading: false,
  emptyText: 'No results',
  nullText: '–',
  rowClickable: false,
  density: 'default',
  size: 'md',
  variant: 'default',
  striped: false,
  bordered: false,
  layout: 'table',
  stickyHeader: false,
  cardControls: true,
  cardSortControl: 'select',
  sortByLabel: 'Sort by',
  sortDirectionLabel: 'Sort direction',
  sortDefaultLabel: 'Default order',
  sortAscendingLabel: 'Ascending',
  sortDescendingLabel: 'Descending',
  selectAllLabel: 'Select all',
})

const emit = defineEmits<{ 'row-click': [row: T, event: MouseEvent | KeyboardEvent]; 'row-activate': [row: T, key: RowId] }>()

const sort = defineModel<SortState | null>('sort', { default: null })
const selected = defineModel<RowId[]>('selected', { default: () => [] })
const page = defineModel<number>('page', { default: 1 })
const activeKey = defineModel<RowId | null>('activeKey')

defineSlots<{
  [K: `cell-${string}`]: (props: DataTableCellSlotProps<T>) => unknown
  [K: `header-${string}`]: (props: { column: DataTableColumn<T> }) => unknown
  cell?: (props: DataTableCellSlotProps<T>) => unknown
  empty?: () => unknown
  footer?: () => unknown
}>()

interface Entry {
  row: T
  index: number
  id: RowId
  renderKey: string
  cells: { column: DataTableColumn<T>; value: unknown }[]
}

const INTERACTIVE = 'a,button,input,select,textarea,label,[data-no-row-click]'
const KEY_IGNORED = 'a,button,input,select,textarea,[contenteditable]:not([contenteditable=false]),[role=button],[role=textbox],[tabindex]'
const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End']

function readValue(row: T, column: DataTableColumn<T> | undefined, key: string): unknown {
  if (column?.accessor) return column.accessor(row)
  return row === null || row === undefined ? undefined : (row as Record<string, unknown>)[key]
}

function rawRowId(row: T, index: number): unknown {
  const rk = props.rowKey ?? 'id'
  return typeof rk === 'function' ? rk(row, index) : readValue(row, undefined, String(rk))
}
function rowId(row: T, index: number): RowId {
  const raw = rawRowId(row, index)
  return typeof raw === 'string' || typeof raw === 'number' ? raw : index
}

// ---- contract: the table is named, has columns with unique keys, and (when selectable) rows with unique ids
const slots = useSlots()
// The inner Table would report the same missing name; this component reports it with its own props.
provide(tableNamedByOwnerKey, true)
function checkContract() {
  requireOneOf('DataTable', { caption: props.caption, label: props.label }, 'Name the table so assistive technology can announce it, e.g. `label="Open invoices"`.')
  const columns = props.columns
  if (!Array.isArray(columns) || columns.length === 0) {
    violation('DataTable', 'requires-columns', 'requires a non-empty `columns` array. Pass `{ key, header }` for each column.')
  } else {
    const keys = new Set<string>()
    for (const column of columns) {
      if (!hasText(column?.key)) {
        violation('DataTable', 'requires-column-key', 'every column needs a non-empty string `key`.')
        continue
      }
      if (keys.has(column.key)) violation('DataTable', 'unique-column-keys', `column keys must be unique, but "${column.key}" appears more than once. Rename one of them.`)
      keys.add(column.key)
      if (!hasText(column.header) && !slots[`header-${column.key}`]) {
        violation('DataTable', 'requires-column-header', `column "${column.key}" needs a \`header\` text (or a \`header-${column.key}\` slot) so its cells have a name.`)
      }
    }
  }
  const rk = props.rowKey
  if (rk !== undefined && typeof rk !== 'function' && !hasText(rk) && typeof rk !== 'number') {
    violation('DataTable', 'invalid-rowKey', 'needs `rowKey` to be a property name of the rows or a function returning a string or number.')
  }
  // Selection stores row ids, so a missing or repeated id would select the wrong rows without any sign of it.
  if (!props.selectable || !Array.isArray(props.rows)) return
  const seen = new Set<unknown>()
  props.rows.forEach((row, index) => {
    const raw = rawRowId(row, index)
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      violation('DataTable', 'requires-row-id', `with \`selectable\`, row ${index + 1} has no string or number id. Give rows an \`id\` or pass \`rowKey\` (a property name or a function).`)
    }
    if (seen.has(raw)) violation('DataTable', 'unique-row-ids', `with \`selectable\`, row ids must be unique, but "${String(raw)}" appears more than once: those rows would be selected together. Fix \`rowKey\`.`)
    seen.add(raw)
  })
}
useMountedCheck(checkContract, [() => props.rows, () => props.rows?.length, () => props.columns, () => props.selectable, () => props.rowKey])

const safeRows = computed<T[]>(() => (Array.isArray(props.rows) ? props.rows : []))
const safeColumns = computed(() => (Array.isArray(props.columns) ? props.columns : []))

const sortedRows = computed(() => {
  const s = sort.value
  const col = s ? safeColumns.value.find((c) => c.key === s.key) : undefined
  const indexed = safeRows.value.map((row, index) => ({ row, index }))
  return sortRows(indexed, s, (e, key) => readValue(e.row, col, key))
})

const pageSizeN = computed(() => {
  const n = Math.floor(Number(props.pageSize))
  return Number.isFinite(n) && n > 0 ? n : 0
})
const total = computed(() => safeRows.value.length)
const paginated = computed(() => pageSizeN.value > 0)
const pageCount = computed(() => (paginated.value ? Math.max(1, Math.ceil(total.value / pageSizeN.value)) : 1))
const currentPage = computed(() => {
  const p = Math.floor(Number(page.value))
  return Math.min(pageCount.value, Math.max(1, Number.isFinite(p) ? p : 1))
})

watch(
  [() => paginated.value, pageCount, page],
  () => {
    if (paginated.value && page.value !== currentPage.value) page.value = currentPage.value
  },
  { immediate: true },
)

const range = computed(() => {
  if (!paginated.value) return { start: 0, end: total.value }
  const start = (currentPage.value - 1) * pageSizeN.value
  return { start, end: Math.min(total.value, start + pageSizeN.value) }
})

const pageEntries = computed<Entry[]>(() => {
  const used = new Set<string>()
  const cols = safeColumns.value
  return sortedRows.value.slice(range.value.start, range.value.end).map(({ row, index }) => {
    const id = rowId(row, index)
    let renderKey = `${typeof id}:${id}`
    for (let n = 1; used.has(renderKey); n++) renderKey = `${typeof id}:${id}#${n}`
    used.add(renderKey)
    return { row, index, id, renderKey, cells: cols.map((column) => ({ column, value: readValue(row, column, column.key) })) }
  })
})

const colCount = computed(() => safeColumns.value.length + (props.selectable ? 1 : 0))
const skeletonRows = computed(() => {
  const n = Math.floor(Number(props.loadingRows ?? (pageSizeN.value || 5)))
  return Array.from({ length: Number.isFinite(n) && n > 0 ? n : 5 }, (_, i) => i)
})
const showEmpty = computed(() => !props.loading && total.value === 0)

// ---- sorting
function direction(column: DataTableColumn<T>): 'asc' | 'desc' | null {
  return sort.value && sort.value.key === column.key ? sort.value.direction : null
}
function ariaSort(column: DataTableColumn<T>) {
  const d = direction(column)
  // Only the sorted column carries aria-sort; `aria-sort="none"` on the others is noise.
  return d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : undefined
}
const sortAnnouncement = computed(() => {
  const s = sort.value
  const col = s ? safeColumns.value.find((c) => c.key === s.key) : undefined
  return s && col ? `Sorted by ${col.header}, ${s.direction === 'asc' ? 'ascending' : 'descending'}` : ''
})
function toggleSort(column: DataTableColumn<T>) {
  sort.value = nextSort(sort.value, column.key)
}

// ---- selection
const selectedSet = computed(() => new Set(selected.value))
const pageIds = computed(() => pageEntries.value.map((e) => e.id))
const pageSelectedCount = computed(() => pageIds.value.filter((id) => selectedSet.value.has(id)).length)
const allOnPage = computed(() => pageIds.value.length > 0 && pageSelectedCount.value === pageIds.value.length)
const someOnPage = computed(() => pageSelectedCount.value > 0 && !allOnPage.value)

const headerCheckbox = ref<HTMLInputElement | null>(null)
watchPostEffect(() => {
  if (headerCheckbox.value) headerCheckbox.value.indeterminate = someOnPage.value
})

async function resync(el: HTMLInputElement, checked: () => boolean) {
  await nextTick()
  el.checked = checked()
}

function toggleAll(event: Event) {
  const el = event.target as HTMLInputElement
  const ids = new Set(pageIds.value)
  const current = selected.value
  selected.value = allOnPage.value
    ? current.filter((id) => !ids.has(id))
    : [...current, ...pageIds.value.filter((id) => !selectedSet.value.has(id))]
  void resync(el, () => allOnPage.value)
}

function toggleRow(entry: Entry, event: Event) {
  const el = event.target as HTMLInputElement
  selected.value = selectedSet.value.has(entry.id)
    ? selected.value.filter((id) => id !== entry.id)
    : [...selected.value, entry.id]
  void resync(el, () => selectedSet.value.has(entry.id))
}

// ---- pager
function goTo(p: number) {
  page.value = Math.min(pageCount.value, Math.max(1, p))
}

// ---- row interaction
// Unbound `activeKey` leaves the table exactly as before; a bound one (even `null`) turns on the active row and its keyboard model.
const instance = getCurrentInstance()
const isBound = () => {
  const vp = instance?.vnode.props
  return !!vp && ('activeKey' in vp || 'active-key' in vp || 'onUpdate:activeKey' in vp)
}
const navigable = ref(isBound())
onBeforeUpdate(() => {
  navigable.value = isBound()
})
const activeIndex = computed(() => (navigable.value ? pageEntries.value.findIndex((e) => e.id === activeKey.value) : -1))
const tabStopIndex = computed(() => (activeIndex.value >= 0 ? activeIndex.value : 0))

function activate(entry: Entry) {
  activeKey.value = entry.id
  emit('row-activate', entry.row, entry.id)
}
function onRowClick(entry: Entry, event: MouseEvent) {
  if (!props.rowClickable && !navigable.value) return
  const target = event.target as Element | null
  const hit = target?.closest?.(INTERACTIVE)
  if (hit && (event.currentTarget as Element).contains(hit)) return
  if (navigable.value) activate(entry)
  if (props.rowClickable) emit('row-click', entry.row, event)
}
async function moveActive(entries: Entry[], to: number, body: Element | null) {
  activeKey.value = entries[to]!.id
  await nextTick()
  const row = body?.querySelector<HTMLElement>('[data-active]')
  row?.focus()
}
function onNavKeydown(entry: Entry, position: number, event: KeyboardEvent): boolean {
  const target = event.target as Element
  const inner = target.closest(KEY_IGNORED)
  if (inner && inner !== event.currentTarget) return false
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  const entries = pageEntries.value
  if (event.key === 'Enter') {
    event.preventDefault()
    activate(entry)
    return true
  }
  if (!NAV_KEYS.includes(event.key)) return false
  event.preventDefault()
  const last = entries.length - 1
  const from = activeIndex.value >= 0 ? activeIndex.value : position
  const to = event.key === 'Home' ? 0 : event.key === 'End' ? last : Math.min(last, Math.max(0, from + (event.key === 'ArrowDown' ? 1 : -1)))
  void moveActive(entries, to, (event.currentTarget as Element).parentElement)
  return true
}
function onRowKeydown(entry: Entry, position: number, event: KeyboardEvent) {
  if (navigable.value && onNavKeydown(entry, position, event)) {
    if (event.key === 'Enter' && props.rowClickable && event.target === event.currentTarget) emit('row-click', entry.row, event)
    return
  }
  if (!props.rowClickable || event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('row-click', entry.row, event)
  }
}
const rootEl = ref<HTMLElement | null>(null)
// Scroll a row that became active by click, model update or sorting into view.
watch(activeKey, async () => {
  await nextTick()
  if (activeIndex.value >= 0) rootEl.value?.querySelector<HTMLElement>('[data-active]')?.scrollIntoView?.({ block: 'nearest' })
})
const dateLocale = useDateLocale(props)
function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString(dateLocale.locale.value, { timeZone: dateLocale.timeZone.value })
  } catch {
    return date.toISOString().slice(0, 10)
  }
}
const OBJECT_TEXT_MAX = 80
// Plain objects and arrays are shown as JSON, never "[object Object]". Use the `cell` slot for a real rendering.
function formatObject(value: object): string {
  let text: string | undefined
  try {
    text = JSON.stringify(value)
  } catch {
    text = undefined
  }
  if (text === undefined) return props.nullText
  return text.length > OBJECT_TEXT_MAX ? `${text.slice(0, OBJECT_TEXT_MAX - 1)}…` : text
}

function format(value: unknown): string {
  if (value === null || value === undefined) return props.nullText
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? props.nullText : formatDate(value)
  if (typeof value === 'function') return props.nullText
  if (typeof value === 'object') return formatObject(value as object)
  return String(value)
}

/** Name used by the row checkbox: the row-header cell when a column has `rowHeader`, else the row position. */
function rowLabel(entry: Entry, position: number): string {
  const header = entry.cells.find((c) => c.column.rowHeader)
  const text = header ? format(header.value) : ''
  return text && text !== props.nullText ? text : `row ${range.value.start + position + 1}`
}
const isNumeric = (column: DataTableColumn<T>) => !!column.numeric || column.align === 'right'
const alignOf = (column: DataTableColumn<T>) => column.align ?? (column.numeric ? 'right' : undefined)

// Row header cells (`th scope=row`) keep their own padding; comfortable density and the cards layout adjust it.
const rowHeaderClasses = computed(() =>
  cn(
    // The compact density rules on the table group outrank plain utilities, so the row header restates its own height.
    'h-auto group-data-[density=compact]/table:h-auto p-3 font-medium whitespace-normal text-foreground',
    props.density === 'comfortable' && 'p-4',
    props.layout === 'cards' && 'max-sm:p-0 max-sm:pb-2 max-sm:text-base max-sm:group-data-[density=compact]/table:px-0',
  ),
)
// A column flagged `actions` has no "Header:" label in a card; its controls close the card.
const ACTIONS_CARD_CLASSES = 'max-sm:justify-end max-sm:border-t max-sm:border-border max-sm:mt-1.5 max-sm:pt-2.5'
const cellLabel = (column: DataTableColumn<T>) => (column.actions && props.layout === 'cards' ? undefined : column.header)
const cellExtra = (column: DataTableColumn<T>) => (column.actions && props.layout === 'cards' ? ACTIONS_CARD_CLASSES : undefined)
const selectCellClasses = computed(() => cn('w-10', props.layout === 'cards' && 'max-sm:w-auto'))
// ---- cards layout: below `sm` the header row is hidden, so the same sort and select-all state is offered as visible controls
const cardSortOptions = computed(() => safeColumns.value.filter((c) => c.sortable && hasText(c.header)).map((c) => ({ key: c.key, label: c.header })))
const showCardControls = computed(() => props.layout === 'cards' && props.cardControls && (cardSortOptions.value.length > 0 || props.selectable))
const rootClasses = computed(() => cn('w-full space-y-3', props.class))
const checkboxClasses = tableCheckboxClasses
const rowClasses = computed(() =>
  props.rowClickable || navigable.value
    ? 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring data-active:inset-ring-2 data-active:inset-ring-primary forced-colors:data-active:outline-2 forced-colors:data-active:-outline-offset-2'
    : undefined,
)
</script>

<template>
  <div ref="rootEl" data-slot="data-table" :class="rootClasses">
    <TableCardControls
      v-if="showCardControls"
      v-model:sort="sort"
      :options="cardSortOptions"
      :selectable="selectable"
      :all-selected="allOnPage"
      :some-selected="someOnPage"
      :select-disabled="pageIds.length === 0"
      :sort-control="cardSortControl"
      :sort-by-label="sortByLabel"
      :sort-direction-label="sortDirectionLabel"
      :sort-default-label="sortDefaultLabel"
      :sort-ascending-label="sortAscendingLabel"
      :sort-descending-label="sortDescendingLabel"
      :select-all-label="selectAllLabel"
      :announce="false"
      @select-all="toggleAll"
    />
    <Table
      :density="density"
      :size="size"
      :variant="variant"
      :layout="layout"
      :striped="striped"
      :bordered="bordered"
      :sticky-header="stickyHeader"
      :container-class="containerClass"
      :class="tableClass"
      :aria-busy="loading ? 'true' : undefined"
      :aria-label="label"
      :label="label"
    >
      <TableCaption v-if="caption" hidden>{{ caption }}</TableCaption>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead v-if="selectable" class="w-10">
            <input
              ref="headerCheckbox"
              type="checkbox"
              data-slot="data-table-select-all"
              aria-label="Select all rows"
              :class="checkboxClasses"
              :checked="allOnPage"
              :disabled="pageIds.length === 0"
              @change="toggleAll"
            />
          </TableHead>
          <TableHead
            v-for="column in safeColumns"
            :key="column.key"
            :align="alignOf(column)"
            :class="column.class"
            :style="column.width ? { width: column.width } : undefined"
            :aria-sort="column.sortable ? ariaSort(column) : undefined"
          >
            <SortHeaderButton
              v-if="column.sortable"
              :direction="direction(column)"
              :align="alignOf(column)"
              @click="toggleSort(column)"
            >
              <slot :name="`header-${column.key}`" :column="column">{{ column.header }}</slot>
            </SortHeaderButton>
            <slot v-else :name="`header-${column.key}`" :column="column">{{ column.header }}</slot>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="loading">
          <TableRow v-for="n in skeletonRows" :key="`skeleton-${n}`" data-slot="data-table-skeleton-row">
            <TableCell v-if="selectable" label="Select" :class="selectCellClasses"><div class="h-4 w-4 rounded bg-muted motion-safe:animate-pulse" /></TableCell>
            <TableCell v-for="column in safeColumns" :key="column.key" :label="cellLabel(column)" :class="cn(column.class, cellExtra(column))">
              <div data-slot="data-table-skeleton" class="h-4 rounded bg-muted motion-safe:animate-pulse" />
            </TableCell>
          </TableRow>
        </template>
        <TableEmpty v-else-if="showEmpty" :colspan="colCount">
          <slot name="empty">{{ emptyText }}</slot>
        </TableEmpty>
        <template v-else>
          <TableRow
            v-for="(entry, position) in pageEntries"
            :key="entry.renderKey"
            data-slot="data-table-row"
            :selected="selectedSet.has(entry.id)"
            :class="rowClasses"
            :tabindex="navigable ? (position === tabStopIndex ? 0 : -1) : rowClickable ? 0 : undefined"
            :aria-current="position === activeIndex ? 'true' : undefined"
            :data-active="position === activeIndex ? '' : undefined"
            @click="onRowClick(entry, $event)"
            @keydown="onRowKeydown(entry, position, $event)"
          >
            <TableCell v-if="selectable" label="Select" :class="selectCellClasses">
              <input
                type="checkbox"
                data-slot="data-table-select-row"
                :aria-label="`Select ${rowLabel(entry, position)}`"
                :class="checkboxClasses"
                :checked="selectedSet.has(entry.id)"
                @change="toggleRow(entry, $event)"
              />
            </TableCell>
            <template v-for="cell in entry.cells" :key="cell.column.key">
              <component
                :is="cell.column.rowHeader ? TableHead : TableCell"
                v-bind="cell.column.rowHeader ? { scope: 'row' } : { numeric: isNumeric(cell.column), label: cellLabel(cell.column) }"
                :align="alignOf(cell.column)"
                :class="cn(cell.column.rowHeader && rowHeaderClasses, cell.column.class, cellExtra(cell.column))"
              >
                <slot
                  :name="`cell-${cell.column.key}`"
                  :row="entry.row"
                  :value="cell.value"
                  :column="cell.column"
                  :index="entry.index"
                >
                  <slot name="cell" :row="entry.row" :value="cell.value" :column="cell.column" :index="entry.index">{{
                    format(cell.value)
                  }}</slot>
                </slot>
              </component>
            </template>
          </TableRow>
        </template>
      </TableBody>
      <TableFooter v-if="$slots.footer">
        <slot name="footer" />
      </TableFooter>
    </Table>

    <nav
      v-if="paginated && total > 0 && !loading"
      data-slot="data-table-pager"
      aria-label="Pagination"
      class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
    >
      <p class="tabular-nums">Showing {{ range.start + 1 }}–{{ range.end }} of {{ total }}</p>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="currentPage <= 1" @click="goTo(currentPage - 1)">Previous</Button>
        <span class="tabular-nums" aria-live="polite">Page {{ currentPage }} of {{ pageCount }}</span>
        <Button variant="outline" size="sm" :disabled="currentPage >= pageCount" @click="goTo(currentPage + 1)">Next</Button>
      </div>
    </nav>
    <p data-slot="data-table-sort-status" role="status" class="sr-only">{{ sortAnnouncement }}</p>
  </div>
</template>
