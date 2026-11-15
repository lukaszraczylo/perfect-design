import { computed, ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const cls = { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' }

const doc: ComponentDoc = {
  name: 'Table',
  group: 'data-display',
  subgroup: 'Tables',
  summary: 'Styled, responsive native <table> with compound parts for hand-written tabular markup.',
  description:
    'Use `Table` + parts when you write the rows yourself (static data, custom layouts, footers with totals). The wrapper scrolls horizontally on small screens. For data arrays with sorting, selection or pagination use `DataTable`. Do not use tables for layout. Variations (all props on `Table`, combinable): `density` (`compact`, `default`, `comfortable`) for padding; `size` (`sm`, `md`, `lg`) for the type scale; `variant` (`default`, `borderless`, `filled`) for the row rules and header band; `layout="cards"` to turn rows into stacked cards on narrow screens (the header row is hidden there; place `TableCardControls` above the table to give touch users a visible "Sort by" select, direction button and "Select all" checkbox that drive your own sort and selection state; `DataTable` does this for you); `stickyHeader` for long scrolling tables; `striped` zebra rows to track long rows across wide tables; `bordered` outer frame + column rules for spreadsheet-like data; `:hoverable="false"` for read-only/report tables where rows are not interactive; `selectedTone="accent"` for a stronger selected-row look (primary tint + leading bar) next to `TableRow selected`. `density`, `size`, `variant`, `layout` and `stickyHeader` reach cells through `group/table` data attributes and provide/inject; `striped`, `hoverable` and `selectedTone` reach `TableRow` the same way, so rows and cells must be inside a `Table`. On cells, `valign` sets the vertical alignment and `label` names the cell in the cards layout.',
  status: 'stable',
  props: [
    { name: 'density', type: "'default' | 'compact' | 'comfortable'", default: "'default'", description: 'Cell padding scale: `compact` (8px cells, 32px header), `default` (12px, 40px) or `comfortable` (16px, 48px). Unknown values fall back to default.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of header and body cells: `sm` 12px, `md` 14px, `lg` 16px. Independent of `density`. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'default' | 'borderless' | 'filled'", default: "'default'", description: '`default` has a rule under every row; `borderless` drops the body row rules (the header keeps its rule; forced-colors mode still draws them); `filled` gives the header row a muted band. Combines with `striped` and `bordered`. Unknown values fall back to `default`.' },
    { name: 'layout', type: "'table' | 'cards'", default: "'table'", description: '`cards`: below the `sm` breakpoint (640px) each body row becomes a bordered card of label and value pairs and the header row is hidden visually. Add `label` to every `TableCell`. Unknown values fall back to `table`.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pin header cells to the top of the scroll container. The container needs a bounded height, e.g. `containerClass="max-h-96"`.' },
    { name: 'striped', type: 'boolean', default: 'false', description: 'Tint every second body row (zebra). Header/footer rows are not striped; hover and selected styling still win.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Rounded outer border on the scroll container plus vertical rules between columns.' },
    { name: 'hoverable', type: 'boolean', default: 'true', description: 'Tint rows on hover. `false` removes the hover tint (selected styling is kept).' },
    { name: 'selectedTone', type: "'muted' | 'accent'", default: "'muted'", description: 'Emphasis for selected rows: neutral `muted` background or `accent` (primary tint). Unknown values fall back to `muted`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the scroll region (`role="region"`, focusable). Defaults to the table `aria-label`, else the `TableCaption` text. The table needs one of these names (`label`, `aria-label`, `aria-labelledby` or a `TableCaption`).' },
    { name: 'containerClass', type: 'string | object | array', description: 'Classes for the scroll wrapper div (`data-slot="table-container"`).' },
    { ...cls, description: 'Applied to the inner <table>, merged last. Other attributes (id, aria-*, data-*) also go to the <table>.' },
  ],
  slots: [{ name: 'default', description: 'TableCaption, TableHeader, TableBody, TableFooter.' }],
  parts: [
    { name: 'TableHeader', description: '<thead>.', props: [cls] },
    { name: 'TableBody', description: '<tbody>; last row has no bottom border.', props: [cls] },
    { name: 'TableFooter', description: '<tfoot> with muted background.', props: [cls] },
    {
      name: 'TableRow',
      description: '<tr> with hover, stripe (from `Table striped`) and selected styling.',
      props: [
        { name: 'selected', type: 'boolean', default: 'false', description: 'Sets data-state="selected" and the selected background. Does not add aria-selected: pass it yourself for grid/treegrid tables.' },
        { name: 'selectedTone', type: "'muted' | 'accent'", description: 'Selected emphasis for this row; defaults to the Table `selectedTone`.' },
        cls,
      ],
    },
    {
      name: 'TableHead',
      description: '<th>. Defaults to scope="col"; pass aria-sort for sortable headers.',
      props: [
        { name: 'align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Text alignment (logical: `left` is the start edge, `right` the end edge, so RTL mirrors).' },
        { name: 'scope', type: "'col' | 'row' | 'colgroup' | 'rowgroup'", default: "'col'", description: 'Header scope.' },
        cls,
      ],
    },
    {
      name: 'TableCell',
      description: '<td>.',
      props: [
        { name: 'align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Text alignment.' },
        { name: 'numeric', type: 'boolean', default: 'false', description: 'Right-aligns (unless align is set) and uses tabular numerals.' },
        { name: 'valign', type: "'top' | 'middle' | 'bottom'", default: "'middle'", description: 'Vertical alignment inside the row. Use `top` when neighbouring cells wrap onto several lines.' },
        { name: 'label', type: 'string', description: 'Column name shown before the value when the Table uses `layout="cards"` below `sm`. Visual only (`aria-hidden`): the column header already names the cell for assistive tech. Ignored in the default layout.' },
        cls,
      ],
    },
    {
      name: 'TableCaption',
      description: '<caption>.',
      props: [{ name: 'hidden', type: 'boolean', default: 'false', description: 'Visually hide but keep for assistive tech (sr-only).' }, cls],
    },
    {
      name: 'TableEmpty',
      description: 'A <tr> with one <td> spanning the table; centred muted message. Default text "No results".',
      props: [{ name: 'colspan', type: 'number', default: '1', description: 'Columns to span. Invalid values fall back to 1.' }, cls],
    },
  ],
  examples: [
    {
      title: 'Basic',
      description: 'Sample data.',
      code: `<Table>
  <TableCaption>Sample data: members and seats</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead align="right">Seats</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableHead scope="row" class="h-auto p-3 font-medium text-foreground">Member A</TableHead>
      <TableCell><Badge variant="secondary">Admin</Badge></TableCell>
      <TableCell numeric>12</TableCell>
    </TableRow>
    <TableRow selected>
      <TableHead scope="row" class="h-auto p-3 font-medium text-foreground">Member B</TableHead>
      <TableCell>Member</TableCell>
      <TableCell numeric>3</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colspan="2">Total</TableCell>
      <TableCell numeric>15</TableCell>
    </TableRow>
  </TableFooter>
</Table>`,
    },
    {
      title: 'Compact with sticky header and empty state',
      description: 'Sticky headers need a height-bounded container. Sample data.',
      code: `<Table density="compact" sticky-header container-class="max-h-40 rounded-md border border-border" aria-label="Sample data: events">
  <TableHeader>
    <TableRow><TableHead>Event</TableHead><TableHead align="right">Count</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow v-for="n in 12" :key="n"><TableCell>Event {{ n }}</TableCell><TableCell numeric>{{ n * 7 }}</TableCell></TableRow>
  </TableBody>
</Table>
<Table class="mt-4" aria-label="Empty table">
  <TableBody><TableEmpty :colspan="2">Nothing to show yet</TableEmpty></TableBody>
</Table>`,
    },
    {
      title: 'Striped',
      description: 'Zebra rows help follow a row across many columns. Hover and selected tints still show on striped rows. Sample data.',
      code: `<Table striped aria-label="Sample data: invoices">
  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Status</TableHead><TableHead align="right">Amount</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow><TableCell>Sample 001</TableCell><TableCell>Paid</TableCell><TableCell numeric>120.00</TableCell></TableRow>
    <TableRow><TableCell>Sample 002</TableCell><TableCell>Due</TableCell><TableCell numeric>80.00</TableCell></TableRow>
    <TableRow><TableCell>Sample 003</TableCell><TableCell>Paid</TableCell><TableCell numeric>45.50</TableCell></TableRow>
    <TableRow><TableCell>Sample 004</TableCell><TableCell>Overdue</TableCell><TableCell numeric>310.00</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Bordered',
      description: 'Outer frame and column rules for spreadsheet-like data. Sample data.',
      code: `<Table bordered aria-label="Sample data: totals by period">
  <TableHeader><TableRow><TableHead>Period</TableHead><TableHead align="right">Income</TableHead><TableHead align="right">Costs</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow><TableCell>Period 1</TableCell><TableCell numeric>1,200</TableCell><TableCell numeric>800</TableCell></TableRow>
    <TableRow><TableCell>Period 2</TableCell><TableCell numeric>1,450</TableCell><TableCell numeric>900</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Compact',
      description: '`density="compact"` tightens cell padding for dense admin views.',
      code: `<Table density="compact" aria-label="Open ports">
  <TableHeader><TableRow><TableHead>Port</TableHead><TableHead>Service</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow><TableCell>22</TableCell><TableCell>ssh</TableCell></TableRow>
    <TableRow><TableCell>443</TableCell><TableCell>https</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Sticky header',
      description: 'Needs a height-bounded container; the header stays pinned while the body scrolls. Sample data.',
      code: `<Table sticky-header container-class="max-h-40" aria-label="Sample data: sticky header">
  <TableHeader><TableRow><TableHead>Event</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow v-for="n in 12" :key="n"><TableCell>Event {{ n }}</TableCell><TableCell numeric>{{ n * 3 }}</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Non-hoverable (read-only)',
      description: '`:hoverable="false"` removes the row hover tint when rows are not interactive. Sample data.',
      code: `<Table :hoverable="false" aria-label="Sample data: read-only report">
  <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow><TableCell>Success rate</TableCell><TableCell numeric>99.98%</TableCell></TableRow>
    <TableRow><TableCell>Latency p95</TableCell><TableCell numeric>182 ms</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Row selection',
      description: 'Reactive selection with a checkbox per row; `selectedTone="accent"` tints selected rows with the primary colour. The checkbox, not the tint, exposes the state. Sample data.',
      script: `const picked = ref(['b'])
const rows = [{ id: 'a', name: 'Item A' }, { id: 'b', name: 'Item B' }, { id: 'c', name: 'Item C' }]
function toggle(id) {
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]
}`,
      code: `<div class="flex flex-col gap-3">
  <Table selected-tone="accent" aria-label="Sample data: selectable items">
    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead align="right">Selected</TableHead></TableRow></TableHeader>
    <TableBody>
      <TableRow v-for="r in rows" :key="r.id" :selected="picked.includes(r.id)">
        <TableCell>{{ r.name }}</TableCell>
        <TableCell align="right"><input type="checkbox" class="relative inline-grid size-5 shrink-0 cursor-pointer appearance-none place-content-center rounded border border-input bg-background align-middle checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50 after:hidden after:content-[''] after:h-2.5 after:w-1.5 after:rotate-45 after:border-b-2 after:border-e-2 after:border-primary-foreground checked:after:block indeterminate:after:block indeterminate:after:h-0 indeterminate:after:w-2.5 indeterminate:after:rotate-0 indeterminate:after:border-e-0" :aria-label="'Select ' + r.name" :checked="picked.includes(r.id)" @change="toggle(r.id)" /></TableCell>
      </TableRow>
    </TableBody>
  </Table>
  <p class="text-sm text-muted-foreground tabular-nums">{{ picked.length }} selected</p>
</div>`,
      state: () => {
        const picked = ref(['b'])
        return {
          picked,
          rows: [{ id: 'a', name: 'Item A' }, { id: 'b', name: 'Item B' }, { id: 'c', name: 'Item C' }],
          toggle: (id: string) => {
            picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]
          },
        }
      },
    },
    {
      title: 'Combined: striped, bordered, compact',
      code: `<Table striped bordered density="compact" aria-label="Combined">
  <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow><TableCell>a</TableCell><TableCell>1</TableCell></TableRow>
    <TableRow><TableCell>b</TableCell><TableCell>2</TableCell></TableRow>
    <TableRow><TableCell>c</TableCell><TableCell>3</TableCell></TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Density gallery: compact, default, comfortable',
      description: 'The three padding steps side by side. Sample data.',
      code: `<div class="flex flex-col gap-4">
  <Table density="compact" aria-label="Compact density"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>compact</TableCell><TableCell numeric>1</TableCell></TableRow><TableRow><TableCell>rows</TableCell><TableCell numeric>2</TableCell></TableRow></TableBody></Table>
  <Table density="default" aria-label="Default density"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>default</TableCell><TableCell numeric>1</TableCell></TableRow><TableRow><TableCell>rows</TableCell><TableCell numeric>2</TableCell></TableRow></TableBody></Table>
  <Table density="comfortable" aria-label="Comfortable density"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>comfortable</TableCell><TableCell numeric>1</TableCell></TableRow><TableRow><TableCell>rows</TableCell><TableCell numeric>2</TableCell></TableRow></TableBody></Table>
</div>`,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: '`size` changes the type scale only; padding follows `density`. Sample data.',
      code: `<div class="flex flex-col gap-4">
  <Table size="sm" aria-label="Small text"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>sm</TableCell><TableCell numeric>12</TableCell></TableRow></TableBody></Table>
  <Table size="md" aria-label="Medium text"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>md</TableCell><TableCell numeric>14</TableCell></TableRow></TableBody></Table>
  <Table size="lg" aria-label="Large text"><TableHeader><TableRow><TableHead>Key</TableHead><TableHead align="right">Value</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>lg</TableCell><TableCell numeric>16</TableCell></TableRow></TableBody></Table>
</div>`,
    },
    {
      title: 'Variant gallery: default, borderless, filled',
      description: '`borderless` removes the body row rules (pair it with `striped` to keep rows apart); `filled` puts a muted band behind the header, also when the header is sticky. Sample data.',
      code: `<div class="flex flex-col gap-4">
  <Table variant="default" aria-label="Default variant"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Item A</TableCell><TableCell numeric>3</TableCell></TableRow><TableRow><TableCell>Item B</TableCell><TableCell numeric>5</TableCell></TableRow></TableBody></Table>
  <Table variant="borderless" aria-label="Borderless variant"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Item A</TableCell><TableCell numeric>3</TableCell></TableRow><TableRow><TableCell>Item B</TableCell><TableCell numeric>5</TableCell></TableRow></TableBody></Table>
  <Table variant="filled" aria-label="Filled variant"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Item A</TableCell><TableCell numeric>3</TableCell></TableRow><TableRow><TableCell>Item B</TableCell><TableCell numeric>5</TableCell></TableRow></TableBody></Table>
  <Table variant="borderless" striped aria-label="Borderless and striped"><TableHeader><TableRow><TableHead>Item</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Item A</TableCell><TableCell numeric>3</TableCell></TableRow><TableRow><TableCell>Item B</TableCell><TableCell numeric>5</TableCell></TableRow></TableBody></Table>
</div>`,
    },
    {
      title: 'Vertical alignment of cells',
      description: '`valign="top"` keeps single-line cells level with the first line of a wrapping neighbour. Sample data.',
      code: `<Table aria-label="Sample data: notes">
  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Note</TableHead><TableHead align="right">Count</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow>
      <TableCell valign="top">Item A</TableCell>
      <TableCell valign="top" class="max-w-48 whitespace-normal">A note long enough to wrap onto a second and a third line in a narrow column.</TableCell>
      <TableCell valign="top" numeric>3</TableCell>
    </TableRow>
    <TableRow>
      <TableCell valign="bottom">Item B</TableCell>
      <TableCell valign="bottom" class="max-w-48 whitespace-normal">A second note that also wraps over several lines here.</TableCell>
      <TableCell valign="bottom" numeric>5</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Cards layout on narrow screens',
      description: 'Below 640px each row is a card of label and value pairs; from 640px it is a normal table. Narrow the window to see it. Sample data.',
      code: `<Table layout="cards" aria-label="Sample data: cards layout">
  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Plan</TableHead><TableHead align="right">Seats</TableHead></TableRow></TableHeader>
  <TableBody>
    <TableRow>
      <TableHead scope="row" class="h-auto p-3 font-medium text-foreground max-sm:p-0 max-sm:pb-1">Item A</TableHead>
      <TableCell label="Plan">Plan 1</TableCell>
      <TableCell label="Seats" numeric>12</TableCell>
    </TableRow>
    <TableRow>
      <TableHead scope="row" class="h-auto p-3 font-medium text-foreground max-sm:p-0 max-sm:pb-1">Item B</TableHead>
      <TableCell label="Plan">Plan 2</TableCell>
      <TableCell label="Seats" numeric>40</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    },
    {
      title: 'Cards layout with sort and select-all controls',
      description: '`TableCardControls` is visible only below 640px, where the header row is hidden. You own the state: it writes `v-model:sort` and emits `select-all`, and the same values drive the rows and `aria-sort`. Narrow the window to see it. Sample data.',
      script: `const sort = ref(null)
const picked = ref([])
const data = [{ id: 'a', name: 'Item A', seats: 12 }, { id: 'b', name: 'Item B', seats: 40 }, { id: 'c', name: 'Item C', seats: 3 }]
const options = [{ key: 'name', label: 'Item' }, { key: 'seats', label: 'Seats' }]
const rows = computed(() => {
  const s = sort.value
  if (!s) return data
  return [...data].sort((x, y) => (x[s.key] > y[s.key] ? 1 : -1) * (s.direction === 'asc' ? 1 : -1))
})
const ariaSort = (key) => (sort.value?.key === key ? (sort.value.direction === 'asc' ? 'ascending' : 'descending') : undefined)
function toggleAll() {
  picked.value = picked.value.length === data.length ? [] : data.map((r) => r.id)
}
function toggle(id) {
  picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]
}`,
      code: `<div class="space-y-3">
  <TableCardControls v-model:sort="sort" :options="options" selectable :all-selected="picked.length === data.length" :some-selected="picked.length > 0 && picked.length < data.length" @select-all="toggleAll" />
  <Table layout="cards" aria-label="Sample data: cards layout with controls">
    <TableHeader>
      <TableRow>
        <TableHead>Select</TableHead>
        <TableHead :aria-sort="ariaSort('name')">Item</TableHead>
        <TableHead align="right" :aria-sort="ariaSort('seats')">Seats</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="r in rows" :key="r.id" :selected="picked.includes(r.id)">
        <TableCell label="Select"><input type="checkbox" class="size-5 accent-primary" :aria-label="'Select ' + r.name" :checked="picked.includes(r.id)" @change="toggle(r.id)" /></TableCell>
        <TableCell label="Item">{{ r.name }}</TableCell>
        <TableCell label="Seats" numeric>{{ r.seats }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>`,
      state: () => {
        const sort = ref<{ key: string; direction: 'asc' | 'desc' } | null>(null)
        const picked = ref<string[]>([])
        const data = [{ id: 'a', name: 'Item A', seats: 12 }, { id: 'b', name: 'Item B', seats: 40 }, { id: 'c', name: 'Item C', seats: 3 }]
        const rows = computed(() => {
          const s = sort.value
          if (!s) return data
          return [...data].sort((x, y) => ((x as any)[s.key] > (y as any)[s.key] ? 1 : -1) * (s.direction === 'asc' ? 1 : -1))
        })
        return {
          sort, picked, data, rows,
          options: [{ key: 'name', label: 'Item' }, { key: 'seats', label: 'Seats' }],
          ariaSort: (key: string) => (sort.value?.key === key ? (sort.value.direction === 'asc' ? 'ascending' : 'descending') : undefined),
          toggleAll: () => { picked.value = picked.value.length === data.length ? [] : data.map((r) => r.id) },
          toggle: (id: string) => { picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id] },
        }
      },
    },
  ],
  a11y: [
    'Native table semantics (caption, thead/tbody/tfoot, th scope). Use `<TableHead scope="row">` for the cell that names a row.',
    'The scroll container is `tabindex="0"` so keyboard users can scroll a wide table with the arrow keys, and is a `role="region"` named by `label`, the table `aria-label` or the caption when one exists. It shows the shared focus ring.',
    'Stripes, borders and selection tint are visual only: selection must also be exposed non-visually (a checkbox or aria-selected on grid rows).',
    'Give every table a caption (use `hidden` for sr-only) or an aria-label.',
    'Put aria-sort on the sortable TableHead that is currently sorted; do not set `aria-sort="none"` on the others.',
    'Numeric cells use `tabular-nums` and align to the end edge. `left` and `right` alignment are logical, so RTL mirrors them.',
    '`layout="cards"` keeps real table markup: below `sm` the table, row groups, rows and cells get explicit `table`, `rowgroup`, `row`, `columnheader`, `rowheader` and `cell` roles so screen readers still announce a table after `display` changes. The cell `label` is `aria-hidden` (the column header already names the cell). The header row is hidden visually below `sm` (it stays in the accessibility tree and appears when a keyboard user tabs into it), so touch users cannot reach sort buttons or a select-all checkbox in it: render `TableCardControls` (visible only below `sm`) above the table, bind its `v-model:sort`, and apply the same state to your rows and your `aria-sort`, so the bar and the header stay one source of truth. It is a labelled native select, a direction button with text and an icon, and a "Select all" checkbox, with 44px targets on coarse pointers.',
    '`variant="borderless"` keeps row rules in forced-colors mode (they are transparent borders); `filled` is a header band, not a state.',
    'Responsive: the table keeps its natural width and scrolls inside its region instead of widening the page; `stickyHeader` keeps the header visible inside a height-bounded container.',
  ],
  related: ['DataTable', 'DescriptionList', 'List', 'NativeSelect'],
  requires: [
    'Throws a ContractError when the table has no accessible name: add a `TableCaption`, or set `label`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when a `TableHead` is not inside a `TableRow`, or when a `scope="col"` (or `colgroup`) `TableHead` is not inside `TableHeader`. Row headers use `scope="row"` and may sit in `TableBody`.',
    'Throws a ContractError when a `TableRow` is rendered outside a `Table`.',
  ],
  llmNotes: [
    'Use Table parts for static markup; use DataTable for arrays of rows.',
    'Always render TableHead cells inside TableHeader > TableRow.',
    'Use `numeric` on TableCell for numbers so columns align.',
    'Use `density` for padding, `size` for text, `variant` for rules and header band; do not set `class` to change them. Use `layout="cards"` with a `label` on every TableCell when the table must work on phones, and add `TableCardControls` above it when phones need sorting or select-all.',
    'Choose Table props by need: `striped` for wide tables, `bordered` for spreadsheet-like data, `density="compact"` for dense views, `:hoverable="false"` for read-only tables.',
    'Use `selected` on TableRow for selected rows and `selectedTone="accent"` on Table for a stronger look; add aria-selected yourself only for grid tables.',
    'TableRow striping, hover and selection tone only apply inside a Table (provide/inject).',
    'Sticky header requires a bounded container height (containerClass="max-h-96").',
    'Do not use tables for layout.',
  ],
  replaces: ['shadcn-vue ui'],
}
export default doc
