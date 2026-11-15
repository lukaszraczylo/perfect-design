import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const columnsScript = `const columns = [
  { key: 'item', label: 'Item', editable: true, sortable: true, width: 200 },
  { key: 'qty', label: 'Quantity', type: 'number', editable: true, sortable: true, width: 120 },
  { key: 'status', label: 'Status', type: 'select', editable: true, sortable: true, width: 140,
    options: [{ value: 'open', label: 'Open' }, { value: 'packed', label: 'Packed' }, { value: 'sent', label: 'Sent' }] },
  { key: 'note', label: 'Note', width: 200 },
]`

const columns = [
  { key: 'item', label: 'Item', editable: true, sortable: true, width: 200 },
  { key: 'qty', label: 'Quantity', type: 'number' as const, editable: true, sortable: true, width: 120 },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    editable: true,
    sortable: true,
    width: 140,
    options: [
      { value: 'open', label: 'Open' },
      { value: 'packed', label: 'Packed' },
      { value: 'sent', label: 'Sent' },
    ],
  },
  { key: 'note', label: 'Note', width: 200 },
]

const makeRows = () => [
  { id: 1, item: 'Sample crate A', qty: 12, status: 'open', note: 'Sample note' },
  { id: 2, item: 'Sample crate B', qty: 40, status: 'packed', note: '' },
  { id: 3, item: 'Sample crate C', qty: 3, status: 'sent', note: 'Fragile sample' },
  { id: 4, item: 'Sample crate D', qty: 18, status: 'open', note: '' },
]
const rowsScript = `const rows = ref([
  { id: 1, item: 'Sample crate A', qty: 12, status: 'open', note: 'Sample note' },
  { id: 2, item: 'Sample crate B', qty: 40, status: 'packed', note: '' },
  { id: 3, item: 'Sample crate C', qty: 3, status: 'sent', note: 'Fragile sample' },
  { id: 4, item: 'Sample crate D', qty: 18, status: 'open', note: '' },
])`

const bigScript = `const columns = [
  { key: 'id', label: 'Number', type: 'number', width: 110, sortable: true, pinned: 'start' },
  { key: 'item', label: 'Item', width: 220, sortable: true },
  { key: 'qty', label: 'Quantity', type: 'number', width: 120, sortable: true, editable: true },
  { key: 'site', label: 'Site', width: 180, sortable: true },
]
const rows = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1, item: 'Sample item ' + (i + 1), qty: (i * 7) % 100, site: 'Site ' + ((i % 12) + 1),
})))`
const bigColumns = [
  { key: 'id', label: 'Number', type: 'number' as const, width: 110, sortable: true, pinned: 'start' as const },
  { key: 'item', label: 'Item', width: 220, sortable: true },
  { key: 'qty', label: 'Quantity', type: 'number' as const, width: 120, sortable: true, editable: true },
  { key: 'site', label: 'Site', width: 180, sortable: true },
]
const makeBig = () => Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, item: `Sample item ${i + 1}`, qty: (i * 7) % 100, site: `Site ${(i % 12) + 1}` }))

const wideScript = `const columns = [
  { key: 'item', label: 'Item', width: 180, pinned: 'start' },
  { key: 'site', label: 'Site', width: 160 },
  { key: 'owner', label: 'Owner', width: 160 },
  { key: 'qty', label: 'Quantity', type: 'number', width: 140 },
  { key: 'status', label: 'Status', width: 140 },
  { key: 'note', label: 'Note', width: 260 },
  { key: 'total', label: 'Total', type: 'number', width: 120, pinned: 'end' },
]
const rows = [
  { id: 1, item: 'Sample crate A', site: 'Site 1', owner: 'Owner A', qty: 12, status: 'Open', note: 'Sample note', total: 120 },
  { id: 2, item: 'Sample crate B', site: 'Site 2', owner: 'Owner B', qty: 40, status: 'Packed', note: 'Another sample note', total: 400 },
  { id: 3, item: 'Sample crate C', site: 'Site 3', owner: 'Owner C', qty: 3, status: 'Sent', note: 'Fragile sample', total: 30 },
]`
const wideColumns = [
  { key: 'item', label: 'Item', width: 180, pinned: 'start' as const },
  { key: 'site', label: 'Site', width: 160 },
  { key: 'owner', label: 'Owner', width: 160 },
  { key: 'qty', label: 'Quantity', type: 'number' as const, width: 140 },
  { key: 'status', label: 'Status', width: 140 },
  { key: 'note', label: 'Note', width: 260 },
  { key: 'total', label: 'Total', type: 'number' as const, width: 120, pinned: 'end' as const },
]
const wideRows = [
  { id: 1, item: 'Sample crate A', site: 'Site 1', owner: 'Owner A', qty: 12, status: 'Open', note: 'Sample note', total: 120 },
  { id: 2, item: 'Sample crate B', site: 'Site 2', owner: 'Owner B', qty: 40, status: 'Packed', note: 'Another sample note', total: 400 },
  { id: 3, item: 'Sample crate C', site: 'Site 3', owner: 'Owner C', qty: 3, status: 'Sent', note: 'Fragile sample', total: 30 },
]

const doc: ComponentDoc = {
  name: 'DataGrid',
  group: 'data-display',
  subgroup: 'Tables',
  summary: 'Spreadsheet-like data grid: keyboard navigation over cells, inline editing with validation, sorting, resizable and pinned columns, row selection, copy as TSV and a windowed render for 10,000 rows.',
  description:
    'Use `DataGrid` when people work in the cells: move with the arrow keys, press Enter or F2 to edit, copy a block into a spreadsheet. Use `DataTable` for read-only tables with paging and `Table` for static markup. The grid follows the ARIA grid pattern: `role="grid"` with one tab stop (roving tabindex), so Tab enters and leaves it. Give `columns` (`{ key, label, type, editable, width, pinned, sortable, align }`) and `rows`; bind `v-model:rows` to receive edits (the grid never mutates the array it was given, it emits a new array with a new row object). `v-model:sort` and `v-model:selected` work controlled or uncontrolled.\n\nRows have a fixed height (set by `density`), cell text is truncated with an ellipsis, and above 200 rows (or with `virtual`) only the visible window is mounted, so 10,000 rows cost about 30 rows of DOM. The row with the focus stays mounted when it scrolls out of view. Cell values are always rendered as text, never as HTML.\n\nKnown limits: no merged cells, no column reorder or grouping, no row grouping or tree rows, no fill handle, no undo or redo, no paste, no type-to-edit (press Enter or F2 first), no mouse drag selection of cells (use Shift+Arrow or Shift+click), no horizontal virtualization (every column is rendered), no variable row height, no server paging (use the `rows` you have). After you edit a sorted column the row keeps its place until the next sort. Column widths are in pixels and the grid does not stretch to fill a wider container. Change the data by replacing `rows` with a new array; mutating a row in place is not detected. Text direction is read when the grid mounts and when `dir` changes.',
  status: 'beta',
  props: [
    { name: 'columns', type: 'DataGridColumn<T>[]', required: true, description: '`{ key, label, type?, editable?, width?, minWidth?, maxWidth?, pinned?, sortable?, resizable?, align?, options?, formatter? }`. `type` is `text` (default), `number` or `select` and picks the editor. `pinned` is `start` or `end`: pinned columns stick to that edge while the grid scrolls sideways and are moved to the edges in the order given. `width` is in px (default 160, resize limits 48 to 1000). `align` is `start`, `center` or `end` (numbers default to `end`). `options` are values or `{ value, label }` for a `select` column. `formatter(value, row)` returns the text shown and copied.' },
    { name: 'rows', type: 'T[]', required: true, description: 'v-model:rows. Plain objects. An edit emits a new array holding a new object for the edited row; the input is never mutated. Replace the array to change the data.' },
    { name: 'rowKey', type: 'keyof T | ((row: T, index: number) => string | number)', default: "'id'", description: 'Row property or function giving a unique id, used for selection. A row without a string or number id falls back to its index; with `selectable` a missing or repeated id throws a ContractError.' },
    { name: 'label', type: 'string', description: 'Accessible name of the grid. Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'sort', type: '{ key: string; direction: "asc" | "desc" } | null', default: 'null', description: 'v-model:sort. Header click, Enter or Space cycles ascending, descending, none. Stable; numbers compare as numbers, text naturally; empty values go last in both directions.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Adds a pinned checkbox column, `aria-selected` on rows and Space (Shift+Space for a range) on any cell to toggle the row.' },
    { name: 'selected', type: '(string | number)[]', default: '[]', description: 'v-model:selected: ids of the selected rows. Controlled or uncontrolled.' },
    { name: 'validate', type: '(value: unknown, context: DataGridValidateContext<T>) => string | null | undefined | void', description: 'Called before an edit is applied with the parsed value (a number for `number`, the option value for `select`). Return error text to reject it: the editor stays open with `aria-invalid`, the text is shown next to the cell, linked with `aria-describedby`, and announced. Escape cancels.' },
    { name: 'height', type: 'number | string', description: 'Height of the scroll area: px number or any CSS length. Virtual grids default to 480px; other grids grow with their rows unless you set it (the header and pinned columns stay in view only inside a bounded height).' },
    { name: 'virtual', type: "boolean | 'auto'", default: "'auto'", description: '`auto` windows the rows above 200; `true` always, `false` never.' },
    { name: 'overscan', type: 'number', default: '6', description: 'Rows mounted above and below the visible window.' },
    { name: 'density', type: "'compact' | 'default' | 'comfortable'", default: "'default'", description: 'Row height (28px, 36px, 48px) and cell padding. Touch devices get at least 44px rows. Unknown values fall back to default.' },
    { name: 'variant', type: "'bordered' | 'striped' | 'borderless'", default: "'bordered'", description: '`bordered` frames the grid and rules the columns; `striped` frames it and tints every second row; `borderless` drops the frame and column rules. Unknown values fall back to bordered.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px, 16px. Editors are 16px below the `md` breakpoint so phones do not zoom.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows placeholder rows, sets `aria-busy` and announces the change once.' },
    { name: 'emptyText', type: 'string', default: "'No rows'", description: 'Message when there are no rows (use the `empty` slot for rich content).' },
    { name: 'nullText', type: 'string', default: "''", description: 'Shown for null and undefined cells (copied as empty).' },
    { name: 'dir', type: "'ltr' | 'rtl' | 'auto'", default: "'auto'", description: 'Text direction. `auto` reads the nearest `dir` attribute or the computed direction when the grid mounts. Arrow keys, sticky edges, resize and alignment follow it.' },
    { name: 'neutralizeFormulas', type: 'boolean', default: 'true', description: 'In copied text, prefix text cells that start with `=`, `+`, `-`, `@`, tab or carriage return with an apostrophe so a spreadsheet shows them as text instead of running them. Numbers are left alone. Turn off only when the clipboard must hold the exact text.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root (`data-slot="data-grid"`). `aria-label`, `aria-labelledby` and `aria-describedby` go to the grid element; every other attribute goes to the root.' },
  ],
  slots: [
    { name: 'cell-<key>', props: '{ row: T, value: unknown, column: DataGridColumn<T>, rowIndex: number }', description: 'Custom (display) content for the cells of that column; `rowIndex` is the index in the source `rows`. The editor still opens on Enter. Keep the content short: rows have a fixed height.' },
    { name: 'header-<key>', props: '{ column: DataGridColumn<T> }', description: 'Custom header label for that column. The visible text must still contain the column label.' },
    { name: 'empty', description: 'Replaces the empty-state message.' },
  ],
  emits: [
    { name: 'update:rows', payload: '[rows: T[]]', description: 'A new array after a committed edit.' },
    { name: 'update:sort', payload: '[sort: SortState | null]', description: 'Sort changed from a header.' },
    { name: 'update:selected', payload: '[ids: (string | number)[]]', description: 'Row selection changed.' },
    { name: 'cell-edit', payload: '[edit: { row, rowKey, rowIndex, column, value, previousValue }]', description: 'A value was committed and changed. `rowIndex` is the index in the source rows.' },
    { name: 'column-resize', payload: '[resize: { key: string; width: number }]', description: 'A drag ended, or one keyboard step was applied.' },
    { name: 'copy', payload: '[copy: { text: string; cells: number }]', description: 'Cells were copied with Ctrl or Cmd+C (the text is the TSV that was written).' },
  ],
  examples: [
    {
      title: 'Editable cells with validation',
      description: 'Focus a cell and press Enter or F2 (or double click) to edit. Enter saves, Escape cancels, Tab saves and moves on. Quantity must be a number and under 100; sample data.',
      script: `${columnsScript}
${rowsScript}
const lastEdit = ref('No edits yet')
function validate(value, { column }) {
  if (column.key === 'qty' && value !== null && value >= 100) return 'Quantity must be under 100'
}
function onEdit(edit) { lastEdit.value = edit.column.label + ' of row ' + edit.rowKey + ' is now ' + edit.value }`,
      code: `<div class="space-y-3">
  <DataGrid v-model:rows="rows" :columns="columns" label="Sample crates, editable" :validate="validate" @cell-edit="onEdit" />
  <p class="text-sm text-muted-foreground" role="status">{{ lastEdit }}</p>
</div>`,
      state: () => ({
        columns,
        rows: ref(makeRows()),
        lastEdit: ref('No edits yet'),
        validate: (value: unknown, { column }: { column: { key: string } }) => (column.key === 'qty' && typeof value === 'number' && value >= 100 ? 'Quantity must be under 100' : undefined),
        onEdit: () => {},
      }),
    },
    {
      title: 'Sorting and resizing columns',
      description: 'Header click (or Enter or Space on a focused header) sorts: ascending, descending, none. Drag the handle at the end of a header to resize, or Tab from a header cell to its handle and use the arrow keys (Shift for bigger steps, Home and End for the limits). Sample data.',
      script: `${columnsScript}
${rowsScript}
const sort = ref({ key: 'qty', direction: 'desc' })`,
      code: `<div class="space-y-3">
  <DataGrid v-model:rows="rows" v-model:sort="sort" :columns="columns" label="Sample crates, sortable" />
  <p class="text-sm text-muted-foreground">Sorted by {{ sort ? sort.key + ' (' + sort.direction + ')' : 'nothing' }}</p>
</div>`,
      state: () => ({ columns, rows: ref(makeRows()), sort: ref<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'qty', direction: 'desc' }) }),
    },
    {
      title: 'Pinned columns in a wide grid',
      description: 'The first and the last column stay in place while the middle scrolls. Scroll sideways inside the grid or move with the arrow keys; the focused cell scrolls clear of the pinned columns. Sample data.',
      script: wideScript,
      code: `<DataGrid :rows="rows" :columns="columns" label="Sample crates, wide" class="max-w-full" :height="260" />`,
      state: () => ({ columns: wideColumns, rows: wideRows }),
    },
    {
      title: '10,000 rows, windowed',
      description: 'Only the visible rows are mounted. Ctrl+End jumps to the last row, PageDown and PageUp move by a screen, and the focused row stays in the DOM while you scroll. Sample data, generated.',
      script: bigScript,
      code: `<DataGrid v-model:rows="rows" :columns="columns" label="Sample items, 10,000 rows" :height="320" density="compact" />`,
      state: () => ({ columns: bigColumns, rows: ref(makeBig()) }),
    },
    {
      title: 'Row selection and copy as TSV',
      description: 'The checkbox column selects rows; Shift+click or Shift+Space selects a range. Ctrl or Cmd+C copies the selected rows, or a block made with Shift+Arrow, or the focused cell, as tab-separated text that spreadsheets paste into cells. Sample data.',
      script: `${columnsScript}
${rowsScript}
const selected = ref([2])`,
      code: `<div class="space-y-3">
  <DataGrid v-model:rows="rows" v-model:selected="selected" :columns="columns" selectable label="Sample crates, selectable" />
  <p class="text-sm text-muted-foreground">{{ selected.length }} selected</p>
</div>`,
      state: () => ({ columns, rows: ref(makeRows()), selected: ref<number[]>([2]) }),
    },
    {
      title: 'Variant gallery: bordered, striped, borderless',
      description: '`bordered` frames the grid and rules the columns, `striped` tints every second row, `borderless` keeps only the row rules. Sample data.',
      script: `${columnsScript}
const rows = [{ id: 1, item: 'Sample crate A', qty: 12, status: 'open', note: '' }, { id: 2, item: 'Sample crate B', qty: 40, status: 'packed', note: '' }, { id: 3, item: 'Sample crate C', qty: 3, status: 'sent', note: '' }]`,
      code: `<div class="space-y-4">
  <DataGrid :rows="rows" :columns="columns" variant="bordered" label="Bordered variant" />
  <DataGrid :rows="rows" :columns="columns" variant="striped" label="Striped variant" />
  <DataGrid :rows="rows" :columns="columns" variant="borderless" label="Borderless variant" />
</div>`,
      state: () => ({ columns, rows: makeRows().slice(0, 3) }),
    },
    {
      title: 'Density and size gallery',
      description: 'Compact, default and comfortable rows (28, 36 and 48px) with the three text sizes. Sample data.',
      script: `${columnsScript}
const rows = [{ id: 1, item: 'Sample crate A', qty: 12, status: 'open', note: '' }, { id: 2, item: 'Sample crate B', qty: 40, status: 'packed', note: '' }]`,
      code: `<div class="space-y-4">
  <DataGrid :rows="rows" :columns="columns" density="compact" size="sm" label="Compact rows, small text" />
  <DataGrid :rows="rows" :columns="columns" density="default" size="md" label="Default rows, medium text" />
  <DataGrid :rows="rows" :columns="columns" density="comfortable" size="lg" label="Comfortable rows, large text" />
</div>`,
      state: () => ({ columns, rows: makeRows().slice(0, 2) }),
    },
    {
      title: 'Empty and loading states',
      description: 'An empty grid keeps its header and shows a status message (or your `empty` slot); `loading` shows placeholder rows and sets `aria-busy`.',
      script: `const columns = [{ key: 'item', label: 'Item' }, { key: 'qty', label: 'Quantity', type: 'number' }]`,
      code: `<div class="space-y-4">
  <DataGrid :rows="[]" :columns="columns" label="Empty grid" empty-text="No crates yet" />
  <DataGrid :rows="[]" :columns="columns" label="Loading grid" loading />
</div>`,
      state: () => ({ columns: [{ key: 'item', label: 'Item' }, { key: 'qty', label: 'Quantity', type: 'number' as const }] }),
    },
    {
      title: 'Right-to-left',
      description: 'With `dir="rtl"` the columns run from the right, pinned columns stick to the right edge and the arrow keys follow the reading direction. Sample data.',
      script: `const columns = [
  { key: 'item', label: 'Item', width: 180, pinned: 'start' },
  { key: 'qty', label: 'Quantity', type: 'number', width: 120, editable: true },
  { key: 'note', label: 'Note', width: 200 },
]
const rows = ref([{ id: 1, item: 'Sample crate A', qty: 12, note: 'Sample note' }, { id: 2, item: 'Sample crate B', qty: 40, note: '' }])`,
      code: `<DataGrid v-model:rows="rows" :columns="columns" dir="rtl" label="Sample crates, right to left" />`,
      state: () => ({
        columns: [
          { key: 'item', label: 'Item', width: 180, pinned: 'start' as const },
          { key: 'qty', label: 'Quantity', type: 'number' as const, width: 120, editable: true },
          { key: 'note', label: 'Note', width: 200 },
        ],
        rows: ref([
          { id: 1, item: 'Sample crate A', qty: 12, note: 'Sample note' },
          { id: 2, item: 'Sample crate B', qty: 40, note: '' },
        ]),
      }),
    },
  ],
  a11y: [
    'ARIA grid pattern: `role="grid"` with rowgroups, rows, `columnheader` and `gridcell`, `aria-rowcount` and `aria-colcount` for the whole data set and `aria-rowindex` on every mounted row, so a windowed grid still reports the true position (the header is row 1).',
    'One tab stop (roving tabindex): Tab enters the grid on its current cell and the next Tab leaves it. Arrow keys move one cell (they swap in right-to-left), Home and End go to the first and last column, Ctrl or Cmd+Home and +End to the first and last cell, PageUp and PageDown move by the visible rows. The header is row 0 of the navigation.',
    'Editing: Enter or F2 (or double click) opens the editor, Enter saves and returns focus to the cell, Escape cancels, Tab saves and continues to the next tab stop. Enter and Escape are ignored while an IME composition is open. A rejected value keeps the editor open with `aria-invalid="true"`, the error text visible next to the cell and referenced by `aria-describedby`, and announced in the status region.',
    'Sorting: the sorted header carries `aria-sort`; Enter or Space on a header cell, or a click on its button, cycles the direction. The change is announced ("Sorted by Name, ascending").',
    'Resizing: each header has a visible 24px `role="separator"` handle with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. Drag it, or Tab from the header cell onto it: ArrowRight and ArrowLeft change the width by 10px (Shift: 50px, reversed in right-to-left), Home and End jump to the limits, Escape returns to the header cell. The handle is a tab stop only while its header cell is the current cell.',
    'Selection: rows carry `aria-selected`, the header checkbox is named "Select all rows" and is indeterminate for a partial selection, each row checkbox is "Select row n". Space toggles the row from any cell, Shift+Space or Shift+click selects a range. Cells in a Shift+Arrow block carry `aria-selected="true"`.',
    'One polite `role="status"` region announces sorting, edits, validation errors, resizing, loading and copying. It is never used for every keystroke or scroll.',
    'Focus is a visible 2px outline inside the cell (kept in forced-colors mode). Rows are at least 28px (44px on touch devices) and the resize handle is 24px wide. State is never colour only: errors have an icon and text, sorting has an arrow icon plus `aria-sort`, selection has a checkbox.',
    'Cell values are text only. Hostile or very long text is truncated inside its fixed-height cell; the full value is in the editor and the copied text.',
  ],
  related: ['DataTable', 'Table', 'VirtualList', 'Checkbox', 'Pagination'],
  requires: [
    'Throws a ContractError when the grid has no accessible name (`label`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `columns` is empty, when a column has no non-empty `key`, when two columns share a `key`, or when a column has no `label`.',
    'Throws a ContractError when a `select` column has no `options`.',
    'Throws a ContractError when `selectable` is set and a row has no string or number id, or two rows have the same id (they would be selected together).',
  ],
  llmNotes: [
    'Always set `label` and give every column a unique `key` and a `label`.',
    'Bind `v-model:rows`; the grid never mutates the rows you pass, it emits a new array. React to `cell-edit` for saving, and use `validate` (return error text) instead of validating in the event.',
    'Mark columns `editable: true` to edit them (default is read-only); use `type: "number"` or `type: "select"` with `options` for typed editors.',
    'For many rows set a `height` and leave `virtual` on auto; rows have a fixed height and text is truncated, so do not put tall content in cells.',
    'With `selectable`, every row needs a unique string or number `id` (or pass `rowKey`).',
    'Cell values render as text; format with `formatter` or a `cell-<key>` slot, never with HTML strings.',
    'Do not use it for read-only report tables: use `DataTable` (paging, cards on phones) or `Table`.',
  ],
  replaces: ['hand-rolled spreadsheet-like grid with inline editing'],
}
export default doc
