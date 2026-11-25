import { computed, ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const rowsScript = `const columns = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'plan', header: 'Plan', sortable: true },
  { key: 'seats', header: 'Seats', sortable: true, numeric: true },
]
const rows = [
  { id: 1, name: 'Item A', plan: 'Plan 1', seats: 12 },
  { id: 2, name: 'Item B', plan: 'Plan 2', seats: 40 },
  { id: 3, name: 'Item C', plan: 'Plan 3', seats: 3 },
  { id: 4, name: 'Item D', plan: 'Plan 1', seats: null },
]`

const columns = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'plan', header: 'Plan', sortable: true },
  { key: 'seats', header: 'Seats', sortable: true, numeric: true },
]
const makeRows = () => [
  { id: 1, name: 'Item A', plan: 'Plan 1', seats: 12 },
  { id: 2, name: 'Item B', plan: 'Plan 2', seats: 40 },
  { id: 3, name: 'Item C', plan: 'Plan 3', seats: 3 },
  { id: 4, name: 'Item D', plan: 'Plan 1', seats: null },
]

const doc: ComponentDoc = {
  name: 'DataTable',
  group: 'data-display',
  subgroup: 'Tables',
  summary: 'Data-array table with client-side sorting, row selection, pagination, loading and empty states.',
  description:
    'Give `columns` and `rows`; the table renders them with `Table` parts. Sorting cycles none → asc → desc → none (stable; null/NaN/Invalid Date always last), selection is per page (header checkbox selects the visible page and keeps other pages), pagination is a built-in simple pager. `v-model:sort`, `v-model:selected` and `v-model:page` work controlled or uncontrolled. All work is client-side: for server-side paging/sorting use `Table` parts or pass pre-sorted rows without `sortable`. Without `selectable`, duplicate or missing row keys are tolerated (rendering uses a unique internal key). With `selectable`, selection stores the id from `rowKey`, so every row needs a unique string or number id: a missing or repeated one throws a ContractError, because those rows would be selected together. Name the table with `caption` or `label`. Look props (all combinable): `density`, `size`, `variant`, `striped`, `bordered`, `stickyHeader`; `layout="cards"` turns rows into cards on narrow screens. The header row is hidden visually there, so below 640px a visible control bar appears above the cards: a "Sort by" select with a direction button for the sortable columns, and a "Select all" checkbox when `selectable` is set. It writes the same `v-model:sort` and `v-model:selected` values as the header (one source of truth). Relabel it with `sortByLabel`, `sortDirectionLabel`, `sortDefaultLabel`, `sortAscendingLabel`, `sortDescendingLabel` and `selectAllLabel`, or hide it with `:card-controls="false"`.',
  status: 'stable',
  props: [
    { name: 'columns', type: 'DataTableColumn<T>[]', required: true, description: '`{ key, header, sortable?, align?, numeric?, rowHeader?, actions?, width?, accessor?, class? }`. `accessor(row)` defaults to `row[key]`; `width` is an inline CSS width; `numeric` right-aligns with tabular figures; `rowHeader` renders the column as `<th scope="row">` and names the row checkbox; `actions` marks a row-actions column, which in `layout="cards"` has no "Actions:" label and closes the card at the end with a rule.' },
    { name: 'rows', type: 'T[]', required: true, description: 'Source rows (never mutated).' },
    { name: 'rowKey', type: "keyof T | ((row: T, index: number) => string | number)", default: "'id'", description: 'Row property name or function giving a unique string or number id, used for selection. Required to resolve for every row when `selectable` is set; otherwise missing ids fall back to the row index.' },
    { name: 'sort', type: '{ key: string; direction: "asc" | "desc" } | null', default: 'null', description: 'v-model:sort. Controlled or uncontrolled.' },
    { name: 'activeKey', type: 'string | number | null', description: 'v-model:activeKey: the id (from `rowKey`) of the active row, the one shown in a side panel. Binding it (even to `null`) turns on the active-row model: roving tabindex, arrow-key navigation, and `aria-current="true"` plus `data-active` on the active row. Detected from the binding itself (`activeKey`, `active-key`, `onUpdate:activeKey` or `onUpdate:active-key`), so a ref that starts `undefined` works. Unbound, the table behaves as before. A wrapper component that always forwards the binding turns navigation on for every use of the wrapper, even when its own prop is unset. The table scrolls the active row into view after a click or key press, or when a parent changes it while focus is inside the table; a parent-driven change with focus elsewhere never scrolls the page.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Adds a leading checkbox column.' },
    { name: 'selected', type: '(string | number)[]', default: '[]', description: 'v-model:selected: selected row ids. Controlled or uncontrolled.' },
    { name: 'page', type: 'number', default: '1', description: 'v-model:page (1-based). Out-of-range values are clamped and `update:page` is emitted with the clamped value.' },
    { name: 'pageSize', type: 'number', description: 'Rows per page. Undefined, 0, negative, NaN or Infinity disable pagination; fractions are floored.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows skeleton rows, sets aria-busy and hides data rows and the pager.' },
    { name: 'loadingRows', type: 'number', description: 'Number of skeleton rows. Defaults to the page size, else 5.' },
    { name: 'emptyText', type: 'string', default: "'No results'", description: 'Message when there are no rows (use the `empty` slot for rich content).' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for Date cells. Falls back to `ConfigProvider`, then `en`, never the browser locale, so server and client agree.' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone for Date cells. Falls back to `ConfigProvider`, then `UTC`.' },
    { name: 'nullText', type: 'string', default: "'–'", description: 'Shown for null/undefined (and Invalid Date, function and unserialisable) cells. Plain objects and arrays render as JSON truncated to 80 characters; use the `cell` slot for anything richer.' },
    { name: 'rowClickable', type: 'boolean', default: 'false', description: 'Rows get tabindex=0, a pointer cursor and emit `row-click` on click / Enter / Space. Clicks from links, buttons, inputs, selects, textareas, labels and `[data-no-row-click]` are ignored.' },
    { name: 'density', type: "'default' | 'compact' | 'comfortable'", default: "'default'", description: 'Cell padding scale: `compact` (8px cells), `default` (12px) or `comfortable` (16px). Unknown values fall back to default.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of headers and cells: `sm` 12px, `md` 14px, `lg` 16px. Independent of `density`.' },
    { name: 'variant', type: "'default' | 'borderless' | 'filled'", default: "'default'", description: '`default` has a rule under every row; `borderless` drops the body row rules; `filled` gives the header a muted band. Combines with `striped` and `bordered`. Unknown values fall back to default.' },
    { name: 'striped', type: 'boolean', default: 'false', description: 'Tint every second body row. Hover and selected styling still win.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Outer frame plus column rules.' },
    { name: 'layout', type: "'table' | 'cards'", default: "'table'", description: '`cards`: below the `sm` breakpoint (640px) each row becomes a stacked card of label and value pairs (the labels are the column headers) and the header row is hidden visually. Sorting, selection, paging, loading and empty states keep working.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pin the header; set a height on `containerClass` (e.g. `max-h-96`).' },
    { name: 'cardControls', type: 'boolean', default: 'true', description: 'With `layout="cards"`, show the sort select, direction button and "Select all" checkbox below 640px (where the header row is hidden). It appears only when a column is `sortable` or `selectable` is set. Set `false` to hide it and offer your own.' },
    { name: 'cardSortControl', type: "'select' | 'combobox'", default: "'select'", description: 'Cards-layout sort control. `combobox` swaps the native select for a filterable Combobox (type to narrow the sortable columns, clear to restore the default order). Same label, direction button and `v-model:sort` value. Unknown values use the select.' },
    { name: 'sortByLabel', type: 'string', default: "'Sort by'", description: 'Visible label of the cards-layout sort select.' },
    { name: 'sortDirectionLabel', type: 'string', default: "'Sort direction'", description: 'Start of the accessible name of the direction button ("Sort direction: Ascending"); its visible text is the current direction.' },
    { name: 'sortDefaultLabel', type: 'string', default: "'Default order'", description: 'Select option that clears the sort.' },
    { name: 'sortAscendingLabel', type: 'string', default: "'Ascending'", description: 'Text for the ascending direction.' },
    { name: 'sortDescendingLabel', type: 'string', default: "'Descending'", description: 'Text for the descending direction.' },
    { name: 'selectAllLabel', type: 'string', default: "'Select all'", description: 'Visible label of the cards-layout "Select all" checkbox.' },
    { name: 'containerClass', type: 'string | object | array', description: 'Classes for the scroll container.' },
    { name: 'tableClass', type: 'string | object | array', description: 'Classes for the inner <table>.' },
    { name: 'caption', type: 'string', description: 'Visually hidden <caption> for assistive tech. Set `caption` or `label`: one of them is required.' },
    { name: 'label', type: 'string', description: 'aria-label for the <table>; also names the scroll region. Set `caption` or `label`: one of them is required.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root wrapper (`data-slot="data-table"`). Other attributes also fall through to it.' },
  ],
  slots: [
    { name: 'cell-<key>', props: '{ row: T, value: unknown, column: DataTableColumn<T>, index: number }', description: 'Custom cell content for the column with that key. `index` is the position in the source `rows`.' },
    { name: 'cell', props: '{ row, value, column, index }', description: 'Fallback custom cell content for every column without a `cell-<key>` slot.' },
    { name: 'header-<key>', props: '{ column: DataTableColumn<T> }', description: 'Custom header label (rendered inside the sort button for sortable columns).' },
    { name: 'empty', description: 'Replaces the empty-state message.' },
    { name: 'footer', description: 'Content of <tfoot>; provide your own <tr><td colspan>…</td></tr>.' },
  ],
  emits: [
    { name: 'update:sort', payload: '[value: SortState | null]', description: 'Sort changed by a header click or by the cards-layout sort select or direction button.' },
    { name: 'update:selected', payload: '[value: (string | number)[]]', description: 'Selection changed (row checkbox, header checkbox or the cards-layout "Select all").' },
    { name: 'update:page', payload: '[value: number]', description: 'Page changed by the pager or clamped into range.' },
    { name: 'update:activeKey', payload: '[value: string | number | null]', description: 'The active row changed by a click or by the arrow, Home or End keys.' },
    { name: 'row-activate', payload: '[row: T, key: string | number]', description: 'A row was activated by a click, Enter or Space while `activeKey` is bound. Open the detail panel here.' },
    { name: 'row-click', payload: '[row: T, event: MouseEvent | KeyboardEvent]', description: 'A clickable row was activated.' },
  ],
  parts: [
    {
      name: 'SortHeaderButton',
      description: 'Button for a sortable <th>: label slot + decorative sort icon. Reusable in custom tables built from Table parts.',
      props: [
        { name: 'direction', type: "'asc' | 'desc' | null", default: 'null', description: 'Current direction; changes the icon.' },
        { name: 'align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Aligns label + icon in the header cell.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'TableCardControls',
      description: 'The control bar `DataTable` shows above a `layout="cards"` table below 640px (`sm:hidden`): a labelled native select of the sortable columns, a direction button and a "Select all" checkbox, with 44px targets on coarse pointers. Reusable with a hand-written `Table` that uses `layout="cards"`: bind `v-model:sort`, pass the sortable columns as `options`, and handle `select-all` yourself.',
      props: [
        { name: 'options', type: '{ key: string; label: string }[]', default: '[]', description: 'Sortable columns in header order. With none, the sort select and button are not rendered.' },
        { name: 'sort', type: '{ key: string; direction: "asc" | "desc" } | null', default: 'null', description: 'v-model:sort, the same value as `DataTable`.' },
        { name: 'selectable', type: 'boolean', default: 'false', description: 'Show the "Select all" checkbox.' },
        { name: 'allSelected', type: 'boolean', default: 'false', description: 'Checks the box (every row of the page is selected).' },
        { name: 'someSelected', type: 'boolean', default: 'false', description: 'Indeterminate box (some, not all, rows are selected).' },
        { name: 'selectDisabled', type: 'boolean', default: 'false', description: 'Disables the checkbox (no rows).' },
        { name: 'sortControl', type: "'select' | 'combobox'", default: "'select'", description: '`combobox` renders a filterable Combobox (clearable, placeholder = `sortDefaultLabel`) instead of the native select. Unknown values use the select.' },
        { name: 'sortByLabel', type: 'string', default: "'Sort by'", description: 'Visible label of the select.' },
        { name: 'sortDirectionLabel', type: 'string', default: "'Sort direction'", description: 'Accessible name prefix of the direction button.' },
        { name: 'sortDefaultLabel', type: 'string', default: "'Default order'", description: 'Option that clears the sort.' },
        { name: 'sortAscendingLabel', type: 'string', default: "'Ascending'", description: 'Ascending text.' },
        { name: 'sortDescendingLabel', type: 'string', default: "'Descending'", description: 'Descending text.' },
        { name: 'selectAllLabel', type: 'string', default: "'Select all'", description: 'Visible label of the checkbox.' },
        { name: 'announce', type: 'boolean', default: 'true', description: 'Render a polite live region that says "Sort by Name, Ascending". `DataTable` turns it off because it has its own.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last on the bar.' },
      ],
    },
  ],
  examples: [
    {
      title: 'Basic sortable',
      script: rowsScript,
      description: 'Sample data.',
      code: `<DataTable :columns="columns" :rows="rows" caption="Sample data: items and plans" />`,
      state: () => ({ columns, rows: makeRows() }),
    },
    {
      title: 'Selection and pagination',
      description: 'The header checkbox selects the visible page only; selections on other pages are kept. Sample data.',
      script: `${rowsScript}
const selected = ref([])
const page = ref(1)`,
      code: `<div class="space-y-3">
  <DataTable v-model:selected="selected" v-model:page="page" :columns="columns" :rows="rows" selectable :page-size="2" label="Sample data: selectable items" />
  <Badge variant="secondary" class="tabular-nums">{{ selected.length }} selected, page {{ page }}</Badge>
</div>`,
      state: () => ({ columns, rows: makeRows(), selected: ref<(string | number)[]>([]), page: ref(1) }),
    },
    {
      title: 'Loading, empty and custom cells',
      script: `const loading = ref(true)
const columns = [{ key: 'name', header: 'Name' }, { key: 'plan', header: 'Plan' }]`,
      code: `<div class="space-y-4">
  <DataTable :columns="columns" :rows="[]" :loading="loading" :loading-rows="3" label="Loading example" />
  <DataTable :columns="columns" :rows="[]" empty-text="No items yet" label="Empty example" />
  <DataTable :columns="columns" :rows="[{ id: 1, name: 'Item A', plan: 'Plan 1' }]" row-clickable label="Clickable row example">
    <template #cell-plan="{ value }"><Badge variant="secondary">{{ value }}</Badge></template>
  </DataTable>
</div>`,
      state: () => ({ loading: ref(true), columns: columns.slice(0, 2).map(({ key, header }) => ({ key, header })) }),
    },
    {
      title: 'Directory with side panel',
      description: 'The active row opens a `Sheet`. `v-model:activeKey` holds the key, `row-activate` opens the panel on click, Enter or Space. Sample data.',
      script: `const columns = [
  { key: 'name', header: 'Name', sortable: true, rowHeader: true },
  { key: 'plan', header: 'Plan', sortable: true },
  { key: 'seats', header: 'Seats', sortable: true, numeric: true },
]
const rows = [
  { id: 1, name: 'Item A', plan: 'Plan 1', seats: 12 },
  { id: 2, name: 'Item B', plan: 'Plan 2', seats: 40 },
  { id: 3, name: 'Item C', plan: 'Plan 3', seats: 3 },
]
const activeKey = ref(null)
const open = ref(false)
const current = computed(() => rows.find((r) => r.id === activeKey.value))`,
      code: `<div>
  <DataTable v-model:active-key="activeKey" :columns="columns" :rows="rows" label="Sample directory" @row-activate="open = true" />
  <Sheet v-model:open="open">
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{{ current?.name }}</SheetTitle>
        <SheetDescription>{{ current?.plan }}, {{ current?.seats }} seats</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</div>`,
      state: () => {
        const rows = makeRows().slice(0, 3)
        const activeKey = ref<number | null>(null)
        return { columns, rows, activeKey, open: ref(false), current: computed(() => rows.find((r) => r.id === activeKey.value)) }
      },
    },
    {
      title: 'Keyboard navigation',
      description: 'Tab once to enter the rows, then move with the keys. Sample data.',
      script: `${rowsScript}
const activeKey = ref(2)`,
      code: `<div class="space-y-3">
  <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
    <li><Kbd>ArrowDown</Kbd> <Kbd>ArrowUp</Kbd> move</li>
    <li><Kbd>Home</Kbd> <Kbd>End</Kbd> first and last</li>
    <li><Kbd>Enter</Kbd> or <Kbd>Space</Kbd> open</li>
  </ul>
  <DataTable v-model:active-key="activeKey" :columns="columns" :rows="rows" label="Sample data: keyboard navigation" />
</div>`,
      state: () => ({ columns, rows: makeRows(), activeKey: ref<number | null>(2) }),
    },
    {
      title: 'Numeric columns with share bar cell',
      description: 'Numbers align to the end with tabular figures and the share bar sits in its own column, so values line up for comparison. Compact density. Sample data.',
      script: `const columns = [
  { key: 'name', header: 'Name', rowHeader: true },
  { key: 'requests', header: 'Requests', numeric: true },
  { key: 'share', header: 'Share', width: '10rem', accessor: (r) => r.requests },
  { key: 'errors', header: 'Errors', numeric: true },
]
const rows = [
  { id: 1, name: 'Item A', requests: 1200, errors: 4 },
  { id: 2, name: 'Item B', requests: 800, errors: 12 },
  { id: 3, name: 'Item C', requests: 300, errors: 0 },
]
const activeKey = ref(1)`,
      code: `<DataTable v-model:active-key="activeKey" :columns="columns" :rows="rows" density="compact" label="Sample data: requests by item">
  <template #cell-share="{ value }"><StatBar label="Share of requests" hide-label :value="value" :max="2300" size="sm" :value-text="Math.round(value / 23) + '%'" /></template>
</DataTable>`,
      state: () => ({
        columns: [
          { key: 'name', header: 'Name', rowHeader: true },
          { key: 'requests', header: 'Requests', numeric: true },
          { key: 'share', header: 'Share', width: '10rem', accessor: (r: { requests: number }) => r.requests },
          { key: 'errors', header: 'Errors', numeric: true },
        ],
        rows: [
          { id: 1, name: 'Item A', requests: 1200, errors: 4 },
          { id: 2, name: 'Item B', requests: 800, errors: 12 },
          { id: 3, name: 'Item C', requests: 300, errors: 0 },
        ],
        activeKey: ref<number | null>(1),
      }),
    },
    {
      title: 'Active row: dense and comfortable',
      description: 'The active ring shows at every density; checked rows keep the muted background. Sample data.',
      script: `${rowsScript}
const a = ref(1)
const b = ref(2)`,
      code: `<div class="space-y-4">
  <DataTable v-model:active-key="a" :columns="columns" :rows="rows" density="compact" size="sm" label="Dense directory" />
  <DataTable v-model:active-key="b" :columns="columns" :rows="rows" density="comfortable" label="Comfortable directory" />
</div>`,
      state: () => ({ columns, rows: makeRows(), a: ref<number | null>(1), b: ref<number | null>(2) }),
    },
    {
      title: 'Active row in dark mode',
      description: 'The active ring uses the `primary` token, so it adapts to the `dark` class. Sample data.',
      script: `${rowsScript}
const activeKey = ref(1)
const selected = ref([1, 2])`,
      code: `<div class="dark rounded-lg bg-background p-4 text-foreground">
  <DataTable v-model:active-key="activeKey" v-model:selected="selected" selectable :columns="columns" :rows="rows" label="Sample data: dark mode, active and checked rows" />
</div>`,
      state: () => ({ columns, rows: makeRows(), activeKey: ref<number | null>(1), selected: ref<(string | number)[]>([1, 2]) }),
    },
    {
      title: 'Active row: empty and loading',
      description: 'No row is active while loading or empty, and the table keeps its native roles. Sample data.',
      script: `const columns = [{ key: 'name', header: 'Name' }, { key: 'plan', header: 'Plan' }]
const activeKey = ref(null)`,
      code: `<div class="space-y-4">
  <DataTable v-model:active-key="activeKey" :columns="columns" :rows="[]" loading :loading-rows="3" label="Loading directory" />
  <DataTable v-model:active-key="activeKey" :columns="columns" :rows="[]" empty-text="No items yet" label="Empty directory" />
</div>`,
      state: () => ({ columns: columns.slice(0, 2).map(({ key, header }) => ({ key, header })), activeKey: ref<number | null>(null) }),
    },
    {
      title: 'Density and size gallery',
      description: 'Compact, default and comfortable padding, and the three text sizes. Sample data.',
      script: rowsScript,
      code: `<div class="space-y-4">
  <DataTable :columns="columns" :rows="rows.slice(0, 2)" density="compact" size="sm" label="Compact, small text" />
  <DataTable :columns="columns" :rows="rows.slice(0, 2)" density="default" size="md" label="Default density, medium text" />
  <DataTable :columns="columns" :rows="rows.slice(0, 2)" density="comfortable" size="lg" label="Comfortable, large text" />
</div>`,
      state: () => ({ columns, rows: makeRows() }),
    },
    {
      title: 'Variant gallery: default, borderless, filled, striped, bordered',
      description: 'Row rules and header band. `striped` and `bordered` combine with each variant. Sample data.',
      script: rowsScript,
      code: `<div class="space-y-4">
  <DataTable :columns="columns" :rows="rows.slice(0, 3)" variant="default" label="Default variant" />
  <DataTable :columns="columns" :rows="rows.slice(0, 3)" variant="borderless" label="Borderless variant" />
  <DataTable :columns="columns" :rows="rows.slice(0, 3)" variant="filled" label="Filled variant" />
  <DataTable :columns="columns" :rows="rows.slice(0, 3)" variant="borderless" striped label="Borderless and striped" />
  <DataTable :columns="columns" :rows="rows.slice(0, 3)" bordered label="Bordered" />
</div>`,
      state: () => ({ columns, rows: makeRows() }),
    },
    {
      title: 'Cards layout on narrow screens',
      description: 'Below 640px every row is a card of label and value pairs and a control bar appears above them: a "Sort by" select with a direction button, and a "Select all" checkbox. It drives the same sort and selection as the header (hidden on phones). From 640px it is a table. Narrow the window to see it. Sample data.',
      script: `${rowsScript}
const sort = ref(null)
const selected = ref([])`,
      code: `<div class="space-y-3">
  <DataTable v-model:sort="sort" v-model:selected="selected" :columns="columns" :rows="rows" layout="cards" selectable label="Sample data: cards layout" />
  <Badge variant="secondary" class="tabular-nums">{{ sort ? sort.key + ' ' + sort.direction : 'default order' }}, {{ selected.length }} selected</Badge>
</div>`,
      state: () => ({ columns, rows: makeRows(), sort: ref<{ key: string; direction: 'asc' | 'desc' } | null>(null), selected: ref<(string | number)[]>([]) }),
    },
    {
      title: 'Cards layout: filterable sort',
      description: '`card-sort-control="combobox"` replaces the native sort select with a Combobox: type to filter the sortable columns, clear to return to the default order. Narrow the window to see it. Sample data.',
      script: `${rowsScript}
const sort = ref(null)`,
      code: `<DataTable v-model:sort="sort" :columns="columns" :rows="rows" layout="cards" card-sort-control="combobox" label="Sample data: filterable card sort" />`,
      state: () => ({ columns, rows: makeRows(), sort: ref<{ key: string; direction: 'asc' | 'desc' } | null>(null) }),
    },
    {
      title: 'Cards layout: actions column',
      description: 'A column with `actions: true` shows no label in a card and sits at the end of it; in the table layout it is an ordinary column. Narrow the window to see it. Sample data.',
      script: `${rowsScript}
const actionColumns = [...columns, { key: 'actions', header: 'Actions', actions: true, accessor: () => null }]`,
      code: `<DataTable :columns="actionColumns" :rows="rows" layout="cards" label="Sample data: row actions in cards">
  <template #cell-actions="{ row }"><Button size="sm" variant="outline">Rename</Button></template>
</DataTable>`,
      state: () => ({ columns, rows: makeRows(), actionColumns: [...columns, { key: 'actions', header: 'Actions', actions: true, accessor: () => null }] }),
    },
    {
      title: 'Cards layout: relabelled controls',
      description: 'The six strings of the control bar are props, so it can be translated or reworded. Sample data.',
      script: rowsScript,
      code: `<DataTable
  :columns="columns" :rows="rows" layout="cards" selectable label="Beispieldaten: Kartenansicht"
  sort-by-label="Sortieren nach" sort-direction-label="Sortierrichtung" sort-default-label="Standardreihenfolge"
  sort-ascending-label="Aufsteigend" sort-descending-label="Absteigend" select-all-label="Alle auswählen"
/>`,
      state: () => ({ columns, rows: makeRows() }),
    },
    {
      title: 'Cards layout: controls hidden',
      description: '`:card-controls="false"` removes the bar, for tables that offer their own sort control or are not sortable on phones. The header row stays reachable by keyboard. Sample data.',
      script: rowsScript,
      code: `<DataTable :columns="columns" :rows="rows" layout="cards" :card-controls="false" label="Sample data: cards layout without controls" />`,
      state: () => ({ columns, rows: makeRows() }),
    },
    {
      title: 'Cards layout: edge cases',
      description: 'No sortable column and no selection (no bar at all), selection only, a single sortable column, and long column names. Sample data.',
      script: `const rows = [{ id: 1, name: 'Item A', plan: 'Plan 1' }, { id: 2, name: 'Item B', plan: 'Plan 2' }]
const plain = [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'plan', header: 'Plan' }]
const one = [{ key: 'name', header: 'Name', sortable: true, rowHeader: true }, { key: 'plan', header: 'Plan' }]
const long = [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'plan', header: 'Quarterly maintenance schedule for the regional warehouse network', sortable: true }]`,
      code: `<div class="space-y-6">
  <DataTable :columns="plain" :rows="rows" layout="cards" label="Sample data: nothing to sort or select" />
  <DataTable :columns="plain" :rows="rows" layout="cards" selectable label="Sample data: selection only" />
  <DataTable :columns="one" :rows="rows" layout="cards" label="Sample data: one sortable column" />
  <DataTable :columns="long" :rows="rows" layout="cards" selectable label="Sample data: long column name" />
</div>`,
      state: () => {
        const rows = [{ id: 1, name: 'Item A', plan: 'Plan 1' }, { id: 2, name: 'Item B', plan: 'Plan 2' }]
        return {
          rows,
          plain: [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'plan', header: 'Plan' }],
          one: [{ key: 'name', header: 'Name', sortable: true, rowHeader: true }, { key: 'plan', header: 'Plan' }],
          long: [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'plan', header: 'Quarterly maintenance schedule for the regional warehouse network', sortable: true }],
        }
      },
    },
    {
      title: 'Cards layout: right-to-left',
      description: 'The control bar uses logical properties, so it mirrors in right-to-left pages. Sample data.',
      script: rowsScript,
      code: `<div dir="rtl">
  <DataTable :columns="columns" :rows="rows" layout="cards" selectable label="Sample data: right-to-left cards" />
</div>`,
      state: () => ({ columns, rows: makeRows() }),
    },
  ],
  a11y: [
    'Native table semantics; sortable headers are buttons inside <th scope="col">. Only the sorted column carries `aria-sort` (ascending or descending); unsorted columns have no `aria-sort`. Focus stays on the header button after a sort, and a visually hidden `role="status"` announces "Sorted by Name, ascending".',
    'Mark the identifying column `rowHeader: true` so its cells are `<th scope="row">`.',
    'Loading sets aria-busy on the table.',
    'Selection checkboxes are labelled "Select all rows" (header, indeterminate when partially selected) and "Select <row header text>" (or "Select row n" without a row header column). They are 20px targets with 12px cell padding around them.',
    'The scroll container is a focusable `role="region"` named by `label` or `caption`, so a wide table scrolls with the arrow keys; `stickyHeader` pins the header inside a height-bounded container.',
    'The pager is a <nav aria-label="Pagination">; Previous/Next are disabled at the ends and the "Page n of m" text is a polite live region with tabular figures.',
    'Clickable rows are focusable (tabindex=0) and activate on Enter/Space.',
    'With `activeKey` bound the table keeps its native table roles; the active row carries `aria-current="true"` and `data-active` and is drawn with an inset primary ring (the focus outline uses `foreground`, not `ring`, because `--ring` equals `--primary`), distinct from the background of checked rows (a row can be both), and the rows use a roving tabindex: the active row (else the first) is the single tab stop, the others are `tabindex=-1`. ArrowDown and ArrowUp move the active row and focus, without wrapping; Home and End jump to the first and last row of the page; Enter and Space activate. Arrow keys move from the focused row. Focus is a 2px `foreground` outline drawn 4px inside the row edge, inside the 2px primary active ring, so a row that is both focused and active shows both; forced-colors mode keeps the two outline offsets apart. Keys pressed inside a link, button, input, select, textarea or contenteditable cell content are left to that control.',
    '`layout="cards"` keeps the table markup: below `sm` the elements get explicit `table`, `rowgroup`, `row`, `columnheader`, `rowheader` and `cell` roles so `display` changes do not drop table semantics, and the visual column labels are `aria-hidden` (the column header names each cell). The header row is hidden visually below `sm`; its sort buttons and select-all checkbox stay in the accessibility tree and appear when a keyboard user focuses them.',
    'Cards layout control bar (`data-slot="table-card-controls"`, visible only below `sm`, so touch users can sort and select all without the header row): the sort select is a native `<select>` wrapped in a visible "Sort by" `<label>` (16px text, 44px high on coarse pointers); the direction button shows the current direction as text plus an arrow icon (never colour alone), is named "Sort direction: Ascending", and is disabled while no column is sorted; "Select all" is a native checkbox inside its label (a 44px target on coarse pointers) with the same indeterminate state as the header box. Everything is keyboard operable (Tab, arrow keys on the select, Space on the checkbox, Enter or Space on the button). The bar writes the same `sort` and `selected` values as the header, so `aria-sort` on the sorted `<th>` and the polite "Sorted by Name, ascending" announcement are identical whichever control sorted. Without sortable columns and without `selectable` the bar is not rendered; `:card-controls="false"` removes it.',
    'Numeric and right-aligned columns use `tabular-nums`. Pass `caption` or `label` so the table has an accessible name.',
  ],
  related: ['Table', 'Pagination', 'EmptyState', 'Checkbox', 'NativeSelect'],
  requires: [
    'Throws a ContractError when neither `caption` nor `label` names the table.',
    'Throws a ContractError when `columns` is empty, when a column has no non-empty `key`, when two columns share a `key`, or when a column has neither a `header` text nor a `header-<key>` slot.',
    'Throws a ContractError when `rowKey` is neither a property name nor a function.',
    'Throws a ContractError when `selectable` is set and a row has no string or number id, or two rows have the same id (they would be selected together). Without `selectable`, duplicate or missing ids are tolerated.',
  ],
  llmNotes: [
    'Give `columns` stable unique `key`s and rows a unique `id` (or pass rowKey) when using selectable.',
    'Use v-model:sort / v-model:selected / v-model:page; do not mutate props.',
    'Use `cell-<key>` slots for badges/actions; put buttons inside cells (clicks on them do not trigger row-click).',
    'Always set `caption` or `label`.',
    'Look props: `density` padding, `size` text, `variant` rules and header band, `striped`, `bordered`; `layout="cards"` for phones: below 640px it shows its own "Sort by" select, direction button and "Select all" checkbox (same `v-model:sort` / `v-model:selected` state as the header; relabel with `sortByLabel`, `sortDirectionLabel`, `sortDefaultLabel`, `sortAscendingLabel`, `sortDescendingLabel`, `selectAllLabel`; hide with `:card-controls="false"`).',
    'Bind `v-model:activeKey` and listen to `row-activate` for a directory-and-detail layout; give the panel (a `Sheet`) the row found by the key. Keep `rowKey` stable so the active row survives sorting.',
    'Sorting and paging are client-side only; for server data, handle sorting yourself and omit `sortable`.',
  ],
  replaces: ['hand-rolled DataTable markup in app code'],
}
export default doc
