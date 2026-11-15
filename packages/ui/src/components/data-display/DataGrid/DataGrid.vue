<script setup lang="ts" generic="T">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, toRaw, useAttrs, useId, watch, watchPostEffect, reactive } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { faCircleExclamation } from '../../../lib/icons'
import { useClipboard } from '../../../lib/use-helpers'
import Icon from '../../primitives/Icon/Icon.vue'
import { hasAriaName, hasText, useMountedCheck } from '../_shared/contract'
import { nextSort, sortRows } from '../DataTable/sort'
import DataGridCellEditor from './DataGridCellEditor.vue'
import DataGridHeaderCell from './DataGridHeaderCell.vue'
import { gridTemplate, orderColumns, SELECT_COLUMN_WIDTH, stickyOffsets, sumWidths, widthOf } from './column-sizing'
import { clampPos, inRange, isNavKey, navigate, rangeBetween, samePos, type GridPos } from './grid-navigation'
import { applyRange, headerState, setAll, toggleId } from './selection'
import { toTsv } from './tsv'
import type { DataGridCellEdit, DataGridColumn, DataGridOption, DataGridProps, DataGridRowId, SortState } from './types'
import { computeRange, renderedIndexes, scrollTopToReveal, totalHeight, visibleRowCount } from './virtual-window'
import { DATA_GRID_ROW_HEIGHTS, DATA_GRID_TOUCH_ROW_HEIGHT, DENSITY_PADDING, EDITOR_TEXT, dataGridVariants, normalizeDensity, normalizeSize, normalizeVariant } from './variants'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<DataGridProps<T>>(), {
  rowKey: 'id' as never,
  selectable: false,
  virtual: 'auto',
  overscan: 6,
  density: 'default',
  variant: 'bordered',
  size: 'md',
  loading: false,
  emptyText: 'No rows',
  nullText: '',
  dir: 'auto',
  neutralizeFormulas: true,
})

const rows = defineModel<T[]>('rows', { required: true })
const sort = defineModel<SortState | null>('sort', { default: null })
const selected = defineModel<DataGridRowId[]>('selected', { default: () => [] })

const emit = defineEmits<{
  /** A cell value was committed. */
  'cell-edit': [edit: DataGridCellEdit<T>]
  /** A column was resized (end of a drag, or each keyboard step). */
  'column-resize': [resize: { key: string; width: number }]
  /** Selected cells were copied. */
  copy: [copy: { text: string; cells: number }]
}>()

defineSlots<{
  [K: `cell-${string}`]: (props: { row: T; value: unknown; column: DataGridColumn<T>; rowIndex: number }) => unknown
  [K: `header-${string}`]: (props: { column: DataGridColumn<T> }) => unknown
  empty?: () => unknown
}>()

type Row = Record<string, unknown>
interface DisplayCol {
  kind: 'select' | 'data'
  key: string
  column: DataGridColumn<T>
}

const attrs = useAttrs()
const ARIA_FOR_GRID = ['aria-label', 'aria-labelledby', 'aria-describedby']
const gridAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => ARIA_FOR_GRID.includes(k))))
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !ARIA_FOR_GRID.includes(k) && k !== 'class')))

const uid = useId()
const errorId = `${uid}-error`
const rootEl = ref<HTMLElement | null>(null)
const viewportEl = ref<HTMLElement | null>(null)

// ---- data
const safeRows = computed<T[]>(() => (Array.isArray(rows.value) ? rows.value : []))
const safeColumns = computed(() => (Array.isArray(props.columns) ? props.columns.filter((c) => c && typeof c.key === 'string') : []))
const count = computed(() => safeRows.value.length)
const rowAt = (src: number) => safeRows.value[src] as Row

function rawRowId(row: T, index: number): unknown {
  const rk = props.rowKey
  if (typeof rk === 'function') return rk(row, index)
  return row !== null && typeof row === 'object' ? (row as Row)[String(rk)] : undefined
}
const rowIdOf = (src: number): DataGridRowId => {
  const raw = rawRowId(safeRows.value[src], src)
  return typeof raw === 'string' || typeof raw === 'number' ? raw : src
}

// ---- columns
const dataColumns = computed(() => orderColumns(safeColumns.value))
const displayCols = computed<DisplayCol[]>(() => {
  const list: DisplayCol[] = dataColumns.value.map((column) => ({ kind: 'data', key: column.key, column }))
  if (props.selectable) list.unshift({ kind: 'select', key: '__select', column: undefined as never })
  return list
})
const colCount = computed(() => displayCols.value.length)
const widthOverrides = reactive<Record<string, number>>({})
const colWidths = computed(() => displayCols.value.map((c) => (c.kind === 'select' ? SELECT_COLUMN_WIDTH : widthOf(c.column as DataGridColumn, widthOverrides))))
const sticky = computed(() => stickyOffsets(colWidths.value, displayCols.value.map((c) => (c.kind === 'select' ? 'start' : c.column.pinned))))
const totalWidth = computed(() => sumWidths(colWidths.value))
const template = computed(() => gridTemplate(colWidths.value))
const hasEditable = computed(() => safeColumns.value.some((c) => c.editable))

const optionMap = computed(() => {
  const map: Record<string, DataGridOption[]> = {}
  for (const c of safeColumns.value) {
    if (c.type === 'select') map[c.key] = (c.options ?? []).map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }))
  }
  return map
})

// ---- look
const variant = computed(() => normalizeVariant(props.variant))
const size = computed(() => normalizeSize(props.size))
const density = computed(() => normalizeDensity(props.density))
const coarse = ref(false)
const rowH = computed(() => Math.max(DATA_GRID_ROW_HEIGHTS[density.value], coarse.value ? DATA_GRID_TOUCH_ROW_HEIGHT : 0))
const padding = computed(() => DENSITY_PADDING[density.value])
const rootClasses = computed(() => cn(dataGridVariants({ variant: variant.value, size: size.value, density: density.value }), props.class))

// ---- direction
const rtlDetected = ref(false)
const rtl = computed(() => (props.dir === 'rtl' ? true : props.dir === 'ltr' ? false : rtlDetected.value))
function detectDirection() {
  const el = rootEl.value
  if (!el || props.dir !== 'auto') return
  const computed = typeof getComputedStyle === 'function' ? getComputedStyle(el).direction : ''
  const attr = el.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.getAttribute('dir')
  rtlDetected.value = computed === 'rtl' || attr === 'rtl'
}
watch(() => props.dir, detectDirection)

// ---- order (sorting)
const order = shallowRef<number[] | null>(null)
let selfRows: unknown = null
function rebuildOrder() {
  const s = sort.value
  const column = s ? safeColumns.value.find((c) => c.key === s.key) : undefined
  if (!s || !column) {
    order.value = null
    return
  }
  const source = safeRows.value
  const idx = Array.from({ length: source.length }, (_, i) => i)
  order.value = sortRows(idx, s, (i) => (source[i] as Row | null)?.[s.key])
}
rebuildOrder()
watch([sort, safeColumns], rebuildOrder)
watch(safeRows, (next) => {
  // Our own edit keeps its row where it is until the next sort; any other new data is re-sorted.
  if (toRaw(next) === selfRows) return
  editing.value = null
  rebuildOrder()
})
const srcOf = (v: number) => (order.value ? order.value[v] : v)
const viewIds = computed<DataGridRowId[]>(() => Array.from({ length: count.value }, (_, v) => rowIdOf(srcOf(v))))
const selectedSet = computed(() => new Set(selected.value))
const allState = computed(() => headerState(selectedSet.value, viewIds.value))

// ---- virtual window
const VIRTUAL_THRESHOLD = 200
const FALLBACK_HEIGHT = 480
const virtualOn = computed(() => props.virtual === true || (props.virtual !== false && count.value > VIRTUAL_THRESHOLD))
const scrollTop = ref(0)
const measuredH = ref(0)
const measuredW = ref(0)
const viewportH = computed(() => (measuredH.value > 0 ? measuredH.value : typeof props.height === 'number' && props.height > 0 ? props.height : FALLBACK_HEIGHT))
const bodyH = computed(() => Math.max(0, viewportH.value - rowH.value))
const win = computed(() => (virtualOn.value ? computeRange({ scrollTop: scrollTop.value, viewport: bodyH.value, rowHeight: rowH.value, count: count.value, overscan: props.overscan }) : { start: 0, end: count.value }))

// ---- focus model
const active = ref<GridPos>({ row: 0, col: 0 })
const navCtx = computed(() => ({ rowCount: count.value, colCount: colCount.value, pageRows: visibleRowCount(bodyH.value, rowH.value), rtl: rtl.value }))
const activePos = computed(() => clampPos(active.value, navCtx.value))
const rendered = computed(() => renderedIndexes(win.value, activePos.value.row > 0 ? activePos.value.row - 1 : null, count.value))
const anchor = ref<GridPos | null>(null)
const cellRange = computed(() => (anchor.value && !samePos(anchor.value, activePos.value) ? rangeBetween(anchor.value, activePos.value) : null))

let raf: number | undefined
function onScroll() {
  if (raf !== undefined) return
  const flush = () => {
    raf = undefined
    if (viewportEl.value) scrollTop.value = viewportEl.value.scrollTop
  }
  if (typeof requestAnimationFrame !== 'function') return flush()
  raf = requestAnimationFrame(flush)
}
function setScrollTop(value: number) {
  scrollTop.value = value
  if (viewportEl.value) viewportEl.value.scrollTop = value
}
function revealRow(index: number) {
  if (!virtualOn.value) return
  setScrollTop(scrollTopToReveal(index, rowH.value, scrollTop.value, bodyH.value, count.value))
}

async function focusCell(pos: GridPos) {
  const p = clampPos(pos, navCtx.value)
  active.value = p
  if (p.row > 0) revealRow(p.row - 1)
  await nextTick()
  const el = viewportEl.value?.querySelector<HTMLElement>(`[data-row="${p.row}"][data-col="${p.col}"]`)
  el?.focus()
}
function onFocusin(event: FocusEvent) {
  const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-row][data-col]')
  if (!cell || !viewportEl.value?.contains(cell)) return
  active.value = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
}

// ---- announcements (one polite region)
const message = ref('')
function announce(text: string) {
  message.value = message.value === text ? `${text} ` : text
}
watch(
  () => props.loading,
  (on) => announce(on ? 'Loading rows' : 'Rows loaded'),
)

// ---- text
function cellText(column: DataGridColumn<T>, row: Row, forCopy = false): string {
  const value = row?.[column.key]
  if (column.formatter) return String(column.formatter(value, row as T) ?? '')
  if (value === null || value === undefined) return forCopy ? '' : props.nullText
  if (column.type === 'select') {
    const option = optionMap.value[column.key]?.find((o) => String(o.value) === String(value))
    if (option) return option.label
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? (forCopy ? '' : props.nullText) : value.toISOString()
  return String(value)
}

// ---- sorting
const directionOf = (key: string) => (sort.value && sort.value.key === key ? sort.value.direction : null)
function toggleSort(column: DataGridColumn<T>) {
  if (!column.sortable) return
  const next = nextSort(sort.value, column.key)
  sort.value = next
  announce(next ? `Sorted by ${column.label}, ${next.direction === 'asc' ? 'ascending' : 'descending'}` : `Sort cleared for ${column.label}`)
}

// ---- resizing
function onResize(column: DataGridColumn<T>, width: number) {
  widthOverrides[column.key] = width
}
function onResizeEnd(column: DataGridColumn<T>, width: number) {
  widthOverrides[column.key] = width
  emit('column-resize', { key: column.key, width })
  announce(`${column.label} column ${width} pixels wide`)
}

// ---- selection
let selAnchor: number | null = null
function toggleRow(v: number, shift: boolean) {
  const id = viewIds.value[v]
  const was = selectedSet.value.has(id)
  if (shift && selAnchor !== null) selected.value = applyRange(selected.value, viewIds.value, selAnchor, v, !was)
  else selected.value = toggleId(selected.value, id, !was)
  selAnchor = v
}
function toggleAll() {
  selected.value = setAll(selected.value, viewIds.value, allState.value !== 'all')
}
const headerCheckbox = shallowRef<HTMLInputElement | null>(null)
const setHeaderCheckbox = (el: unknown) => {
  headerCheckbox.value = el instanceof HTMLInputElement ? el : null
}
watchPostEffect(() => {
  if (headerCheckbox.value) headerCheckbox.value.indeterminate = allState.value === 'some'
})

// ---- editing
interface EditState {
  row: number
  col: number
  draft: string
  error: string | null
}
const editing = ref<EditState | null>(null)
const colAt = (ci: number) => displayCols.value[ci]
const isEditing = (v: number, ci: number) => !!editing.value && editing.value.row === v && editing.value.col === ci

function startEdit(v: number, ci: number) {
  const dc = colAt(ci)
  if (!dc || dc.kind !== 'data' || !dc.column.editable || v < 0 || v >= count.value) return
  const value = rowAt(srcOf(v))?.[dc.column.key]
  editing.value = { row: v, col: ci, draft: value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : String(value), error: null }
  active.value = { row: v + 1, col: ci }
}
function parseDraft(column: DataGridColumn<T>, draft: string): { value: unknown; error: string | null } {
  if (column.type === 'number') {
    const t = draft.trim()
    if (t === '') return { value: null, error: null }
    const n = Number(t)
    return Number.isFinite(n) ? { value: n, error: null } : { value: null, error: 'Enter a number' }
  }
  if (column.type === 'select') {
    const option = optionMap.value[column.key]?.find((o) => String(o.value) === draft)
    return option ? { value: option.value, error: null } : { value: null, error: 'Choose one of the options' }
  }
  return { value: draft, error: null }
}
/** Returns true when the edit was applied (or nothing changed) and the editor closed. */
function commitEdit(event?: Event): boolean {
  const e = editing.value
  if (!e) return true
  const dc = colAt(e.col)
  const src = srcOf(e.row)
  const row = rowAt(src)
  if (!dc || dc.kind !== 'data' || !row) {
    editing.value = null
    return true
  }
  const column = dc.column
  const parsed = parseDraft(column, e.draft)
  let error = parsed.error
  const previousValue = row[column.key]
  if (!error && props.validate) {
    const result = props.validate(parsed.value, { row: row as T, rowKey: rowIdOf(src), rowIndex: src, column, previousValue })
    error = typeof result === 'string' && result.trim() !== '' ? result : null
  }
  if (error) {
    e.error = error
    announce(`${column.label}: ${error}`)
    event?.preventDefault()
    return false
  }
  editing.value = null
  if (!Object.is(previousValue, parsed.value)) {
    const next = safeRows.value.slice()
    next[src] = { ...row, [column.key]: parsed.value } as T
    selfRows = toRaw(next)
    rows.value = next
    emit('cell-edit', { row: next[src], rowKey: rowIdOf(src), rowIndex: src, column, value: parsed.value, previousValue })
    announce(`${column.label} changed`)
  }
  return true
}
function cancelEdit() {
  if (!editing.value) return
  editing.value = null
  focusCell(active.value)
}
function onEditorCommit(event: KeyboardEvent | FocusEvent) {
  if (!editing.value) return
  const isEnter = event instanceof KeyboardEvent && event.key === 'Enter'
  if (commitEdit(event) && isEnter) focusCell(active.value)
}
function onDraft(value: string) {
  if (!editing.value) return
  editing.value.draft = value
  editing.value.error = null
}

// ---- copy
const { copy } = useClipboard({ legacy: true })
function copyCells() {
  const cells: (string | number | null)[][] = []
  const dataCols = (from: number, to: number) => displayCols.value.slice(from, to + 1).filter((c) => c.kind === 'data')
  const rowCells = (v: number, cols: DisplayCol[]) =>
    cols.map((c) => {
      const row = rowAt(srcOf(v))
      const value = row?.[c.column.key]
      return typeof value === 'number' && !c.column.formatter ? value : cellText(c.column, row, true)
    })
  const range = cellRange.value
  const a = activePos.value
  if (range) {
    const cols = dataCols(range.colStart, range.colEnd)
    for (let r = Math.max(1, range.rowStart); r <= range.rowEnd; r++) cells.push(rowCells(r - 1, cols))
  } else if (props.selectable && selected.value.length > 0) {
    const cols = dataCols(0, colCount.value - 1)
    for (let v = 0; v < count.value; v++) if (selectedSet.value.has(viewIds.value[v])) cells.push(rowCells(v, cols))
  } else if (a.row > 0 && colAt(a.col)?.kind === 'data') {
    cells.push(rowCells(a.row - 1, [colAt(a.col)]))
  } else {
    return
  }
  const n = cells.reduce((sum, r) => sum + r.length, 0)
  if (n === 0) return
  const text = toTsv(cells, props.neutralizeFormulas)
  void copy(text).then((ok) => announce(ok ? `Copied ${n} ${n === 1 ? 'cell' : 'cells'}` : 'Copy failed'))
  emit('copy', { text, cells: n })
}

// ---- keyboard
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return
  const target = event.target as HTMLElement
  if (target.closest('[data-slot=data-grid-resize-handle]') || target.closest('[data-slot=data-grid-editor]')) return
  const cell = target.closest<HTMLElement>('[data-row][data-col]')
  if (!cell || editing.value) return
  const pos = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
  const mod = event.ctrlKey || event.metaKey
  const key = event.key
  if (isNavKey(key)) {
    event.preventDefault()
    const next = navigate(pos, key, mod, navCtx.value)
    if (event.shiftKey && !mod && pos.row > 0) {
      if (!anchor.value) anchor.value = pos
      next.row = Math.max(1, next.row)
    } else anchor.value = null
    void focusCell(next)
    return
  }
  if (mod && !event.altKey && key.toLowerCase() === 'c') {
    event.preventDefault()
    copyCells()
    return
  }
  const dc = colAt(pos.col)
  if (pos.row === 0) {
    if ((key === 'Enter' || key === ' ') && dc) {
      event.preventDefault()
      if (dc.kind === 'select') toggleAll()
      else toggleSort(dc.column)
    }
    return
  }
  const v = pos.row - 1
  if (key === 'Enter' || key === 'F2') {
    if (dc?.kind === 'data' && dc.column.editable) {
      event.preventDefault()
      startEdit(v, pos.col)
    }
  } else if (key === ' ' && props.selectable) {
    event.preventDefault()
    toggleRow(v, event.shiftKey)
  } else if (key === 'Escape') {
    anchor.value = null
  }
}
function onCellMousedown(v: number, ci: number, event: MouseEvent) {
  if (event.shiftKey && !editing.value) {
    event.preventDefault()
    const from = activePos.value
    if (from.row > 0 && colAt(ci)?.kind === 'data') {
      if (!anchor.value) anchor.value = from
      void focusCell({ row: v + 1, col: ci })
    }
  } else if (!isEditing(v, ci)) anchor.value = null
}

// ---- styles
const containerStyle = computed(() => {
  const h = props.height
  const height = typeof h === 'number' ? (h > 0 ? `${h}px` : undefined) : typeof h === 'string' && h.trim() !== '' ? h : virtualOn.value ? `${FALLBACK_HEIGHT}px` : undefined
  return { height, scrollPaddingTop: `${rowH.value}px`, scrollPaddingInlineStart: `${sticky.value.startWidth}px`, scrollPaddingInlineEnd: `${sticky.value.endWidth}px` }
})
const bodyHeight = computed(() => (props.loading ? LOADING_ROWS * rowH.value : count.value === 0 ? EMPTY_ROWS * rowH.value : totalHeight(count.value, rowH.value)))
const LOADING_ROWS = 5
const EMPTY_ROWS = 3
const stickyStyle = (ci: number): Record<string, string> | undefined => {
  const s = sticky.value.start[ci]
  const e = sticky.value.end[ci]
  if (s !== null) return { insetInlineStart: `${s}px` }
  if (e !== null) return { insetInlineEnd: `${e}px` }
  return undefined
}
const isPinned = (ci: number) => sticky.value.start[ci] !== null || sticky.value.end[ci] !== null
// The pinned column nearest the scrolling columns gets a rule so the edge stays visible in every variant.
const lastStartCol = computed(() => sticky.value.start.reduce<number>((acc, s, i) => (s !== null ? i : acc), -1))
const firstEndCol = computed(() => sticky.value.end.findIndex((e) => e !== null))
const ALIGN = { start: 'justify-start text-start', center: 'justify-center text-center', end: 'justify-end text-end' } as const
const odd = (v: number) => variant.value === 'striped' && v % 2 === 1

function rowClasses(v: number) {
  return cn('absolute start-0 grid border-b border-border', selectedSet.value.has(viewIds.value[v]) ? 'bg-muted' : odd(v) ? 'bg-muted/30' : '')
}
function cellClasses(v: number, ci: number) {
  const dc = displayCols.value[ci]
  const pinned = isPinned(ci)
  const isSelRow = props.selectable && selectedSet.value.has(viewIds.value[v])
  const inSel = !!cellRange.value && inRange(cellRange.value, v + 1, ci)
  const align = dc.kind === 'select' ? 'center' : (dc.column.align ?? (dc.column.type === 'number' ? 'end' : 'start'))
  return cn(
    pinned ? 'sticky z-10' : 'relative',
    'flex h-full min-w-0 items-center outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
    padding.value,
    ALIGN[align],
    dc.kind === 'data' && dc.column.type === 'number' && 'tabular-nums',
    variant.value === 'bordered' && ci < colCount.value - 1 && 'border-e border-border',
    ci === lastStartCol.value && variant.value !== 'bordered' && 'border-e border-border',
    ci === firstEndCol.value && 'border-s border-border',
    pinned && (isSelRow ? 'bg-muted' : 'bg-background'),
    pinned && !isSelRow && odd(v) && "after:pointer-events-none after:absolute after:inset-0 after:bg-muted/30 after:content-['']",
    inSel && 'bg-accent text-accent-foreground',
    isEditing(v, ci) && 'z-20 overflow-visible p-0',
  )
}
const checkboxClasses =
  "relative inline-grid size-5 shrink-0 cursor-pointer appearance-none place-content-center rounded border border-input bg-background align-middle checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary after:hidden after:content-[''] after:h-2.5 after:w-1.5 after:rotate-45 after:border-b-2 after:border-e-2 after:border-primary-foreground checked:after:block indeterminate:after:block indeterminate:after:h-0 indeterminate:after:w-2.5 indeterminate:after:rotate-0 indeterminate:after:border-e-0 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"

// ---- lifecycle
let resizeObserver: ResizeObserver | undefined
function measure() {
  if (!viewportEl.value) return
  measuredH.value = viewportEl.value.clientHeight
  measuredW.value = viewportEl.value.clientWidth
}
onMounted(() => {
  detectDirection()
  coarse.value = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  measure()
  if (viewportEl.value) scrollTop.value = viewportEl.value.scrollTop
  if (typeof ResizeObserver !== 'undefined' && viewportEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(viewportEl.value)
  }
})
onBeforeUnmount(() => {
  if (raf !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
  raf = undefined
  resizeObserver?.disconnect()
  resizeObserver = undefined
})

// ---- contract
function checkContract() {
  if (!hasText(props.label) && !hasAriaName(attrs)) violation('DataGrid', 'requires-accessible-name', 'needs an accessible name. Set `label`, `aria-label` or `aria-labelledby`.')
  const columns = props.columns
  if (!Array.isArray(columns) || columns.length === 0) {
    violation('DataGrid', 'requires-columns', 'requires a non-empty `columns` array. Pass `{ key, label }` for each column.')
    return
  }
  const keys = new Set<string>()
  for (const column of columns) {
    if (!hasText(column?.key)) {
      violation('DataGrid', 'requires-column-key', 'every column needs a non-empty string `key`.')
      continue
    }
    if (keys.has(column.key)) violation('DataGrid', 'unique-column-keys', `column keys must be unique, but "${column.key}" appears more than once.`)
    keys.add(column.key)
    if (!hasText(column.label)) violation('DataGrid', 'requires-column-label', `column "${column.key}" needs a \`label\`, it names the header cell and its resize handle.`)
    if (column.type === 'select' && (!Array.isArray(column.options) || column.options.length === 0)) violation('DataGrid', 'requires-select-options', `column "${column.key}" has \`type: 'select'\` and needs a non-empty \`options\` list.`)
  }
  if (!props.selectable || !Array.isArray(rows.value)) return
  const seen = new Set<unknown>()
  rows.value.forEach((row, index) => {
    const raw = rawRowId(row, index)
    if (typeof raw !== 'string' && typeof raw !== 'number') violation('DataGrid', 'requires-row-id', `with \`selectable\`, row ${index + 1} has no string or number id. Give rows an \`id\` or pass \`rowKey\`.`)
    if (seen.has(raw)) violation('DataGrid', 'unique-row-ids', `with \`selectable\`, row ids must be unique, but "${String(raw)}" appears more than once: those rows would be selected together. Fix \`rowKey\`.`)
    seen.add(raw)
  })
}
useMountedCheck(checkContract, [() => props.columns, () => rows.value, () => props.selectable, () => props.label])

defineExpose({
  /** Scroll a data row (0-based, in the sorted view) into view. */
  scrollToRow: (index: number) => revealRow(Math.min(Math.max(0, Math.floor(index) || 0), Math.max(0, count.value - 1))),
  /** Move focus to a cell: row 0 is the header row, data rows start at 1. */
  focusCell: (row: number, col: number) => focusCell({ row, col }),
})
</script>

<template>
  <div
    ref="rootEl"
    v-bind="rootAttrs"
    data-slot="data-grid"
    :dir="dir === 'auto' ? undefined : dir"
    :data-variant="variant"
    :data-density="density"
    :data-size="size"
    :data-virtual="virtualOn ? 'true' : undefined"
    :class="rootClasses"
  >
    <div
      ref="viewportEl"
      role="grid"
      data-slot="data-grid-viewport"
      v-bind="gridAttrs"
      :aria-label="typeof gridAttrs['aria-label'] === 'string' ? gridAttrs['aria-label'] : label"
      :aria-rowcount="count + 1"
      :aria-colcount="colCount"
      :aria-busy="loading ? 'true' : undefined"
      :aria-multiselectable="selectable ? 'true' : undefined"
      :aria-readonly="hasEditable ? undefined : 'true'"
      :style="containerStyle"
      class="relative min-w-0 flex-1 overflow-auto overscroll-contain"
      @keydown="onKeydown"
      @focusin="onFocusin"
      @scroll.passive="onScroll"
    >
      <div role="rowgroup" data-slot="data-grid-header" class="sticky top-0 z-30" :style="{ width: `${totalWidth}px` }">
        <div role="row" aria-rowindex="1" data-slot="data-grid-header-row" class="grid border-b border-border bg-muted" :style="{ gridTemplateColumns: template, height: `${rowH}px` }">
          <template v-for="(dc, ci) in displayCols" :key="dc.key">
            <div
              v-if="dc.kind === 'select'"
              role="columnheader"
              data-slot="data-grid-header-cell"
              data-row="0"
              :data-col="ci"
              :aria-colindex="ci + 1"
              :tabindex="activePos.row === 0 && activePos.col === ci ? 0 : -1"
              :style="stickyStyle(ci)"
              :class="cn('sticky z-10 flex h-full items-center justify-center bg-muted outline-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring', variant === 'bordered' && 'border-e border-border')"
            >
              <input :ref="setHeaderCheckbox" type="checkbox" tabindex="-1" aria-label="Select all rows" data-slot="data-grid-select-all" :class="checkboxClasses" :checked="allState === 'all'" :disabled="count === 0" @click.stop="toggleAll" />
            </div>
            <DataGridHeaderCell
              v-else
              :column="dc.column as never"
              :col-index="ci + 1"
              :pos="ci"
              :width="colWidths[ci]"
              :direction="directionOf(dc.key)"
              :tabbable="activePos.row === 0 && activePos.col === ci"
              :pinned="isPinned(ci)"
              :rtl="rtl"
              :label="dc.column.label"
              :padding-class="padding"
              :style="stickyStyle(ci)"
              :class="cn(variant === 'bordered' && ci < colCount - 1 && 'border-e border-border', ci === lastStartCol && variant !== 'bordered' && 'border-e border-border', ci === firstEndCol && 'border-s border-border')"
              @sort="toggleSort(dc.column)"
              @resize="onResize(dc.column, $event)"
              @resize-end="onResizeEnd(dc.column, $event)"
              @handle-escape="focusCell({ row: 0, col: ci })"
            >
              <slot :name="`header-${dc.key}`" :column="dc.column" />
            </DataGridHeaderCell>
          </template>
        </div>
      </div>

      <div role="rowgroup" data-slot="data-grid-body" class="relative" :style="{ width: `${totalWidth}px`, height: `${bodyHeight}px` }">
        <template v-if="loading">
          <div v-for="n in LOADING_ROWS" :key="`loading-${n}`" role="row" :aria-rowindex="n + 1" data-slot="data-grid-loading-row" class="absolute start-0 grid border-b border-border" :style="{ top: `${(n - 1) * rowH}px`, height: `${rowH}px`, gridTemplateColumns: template, width: `${totalWidth}px` }">
            <div v-for="(dc, ci) in displayCols" :key="dc.key" role="gridcell" :class="cn('flex h-full items-center', padding)">
              <span aria-hidden="true" class="block h-3 w-3/4 rounded-sm bg-muted motion-safe:animate-pulse" />
            </div>
          </div>
        </template>
        <div v-else-if="count === 0" role="row" aria-rowindex="2" data-slot="data-grid-empty-row" class="absolute start-0 top-0" :style="{ width: `${totalWidth}px` }">
          <div
            role="gridcell"
            :aria-colspan="colCount"
            data-slot="data-grid-empty"
            class="sticky start-0 flex items-center justify-center p-6 text-center text-muted-foreground"
            :style="{ width: measuredW > 0 ? `${measuredW}px` : undefined, height: `${EMPTY_ROWS * rowH}px` }"
          >
            <span role="status"><slot name="empty">{{ emptyText }}</slot></span>
          </div>
        </div>
        <template v-else>
          <div
            v-for="v in rendered"
            :key="srcOf(v)"
            role="row"
            data-slot="data-grid-row"
            :aria-rowindex="v + 2"
            :aria-selected="selectable ? (selectedSet.has(viewIds[v]) ? 'true' : 'false') : undefined"
            :data-state="selectable && selectedSet.has(viewIds[v]) ? 'selected' : undefined"
            :data-index="v"
            :class="rowClasses(v)"
            :style="{ top: `${v * rowH}px`, height: `${rowH}px`, gridTemplateColumns: template, width: `${totalWidth}px` }"
          >
            <div
              v-for="(dc, ci) in displayCols"
              :key="dc.key"
              role="gridcell"
              data-slot="data-grid-cell"
              :data-row="v + 1"
              :data-col="ci"
              :aria-selected="cellRange && inRange(cellRange, v + 1, ci) ? 'true' : undefined"
              :aria-invalid="isEditing(v, ci) && editing?.error ? 'true' : undefined"
              :tabindex="!isEditing(v, ci) && activePos.row === v + 1 && activePos.col === ci ? 0 : -1"
              :style="stickyStyle(ci)"
              :class="cellClasses(v, ci)"
              @mousedown="onCellMousedown(v, ci, $event)"
              @dblclick="startEdit(v, ci)"
            >
              <input v-if="dc.kind === 'select'" type="checkbox" tabindex="-1" data-slot="data-grid-select-row" :aria-label="`Select row ${v + 1}`" :class="checkboxClasses" :checked="selectedSet.has(viewIds[v])" @click.stop="toggleRow(v, $event.shiftKey)" />
              <template v-else-if="isEditing(v, ci) && editing">
                <DataGridCellEditor
                  :type="dc.column.type ?? 'text'"
                  :model-value="editing.draft"
                  :options="optionMap[dc.key]"
                  :label="`Edit ${dc.column.label}`"
                  :error="editing.error"
                  :error-id="errorId"
                  :text-class="EDITOR_TEXT[size]"
                  @update:model-value="onDraft"
                  @commit="onEditorCommit"
                  @cancel="cancelEdit"
                />
                <div v-if="editing.error" :id="errorId" data-slot="data-grid-error" class="absolute start-0 top-full z-30 mt-0.5 flex w-max max-w-xs items-start gap-1.5 rounded-sm border border-destructive bg-card px-2 py-1 text-start text-xs whitespace-normal text-destructive">
                  <Icon :icon="faCircleExclamation" size="xs" class="mt-0.5 shrink-0" />
                  <span>{{ editing.error }}</span>
                </div>
              </template>
              <slot v-else :name="`cell-${dc.key}`" :row="rowAt(srcOf(v)) as T" :value="rowAt(srcOf(v))?.[dc.key]" :column="dc.column" :row-index="srcOf(v)">
                <span class="min-w-0 truncate">{{ cellText(dc.column, rowAt(srcOf(v))) }}</span>
              </slot>
            </div>
          </div>
        </template>
      </div>
    </div>
    <p role="status" data-slot="data-grid-status" class="sr-only">{{ message }}</p>
  </div>
</template>
