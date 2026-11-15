import { computed, ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'
import { filtersToQuery, queryToFilters } from './query'
import type { FilterField, FilterItem } from './types'

const fields: FilterField[] = [
  { id: 'status', label: 'Status', type: 'select', options: [{ value: 'booked', label: 'Booked' }, { value: 'in-transit', label: 'In transit' }, { value: 'delivered', label: 'Delivered' }] },
  { id: 'reference', label: 'Reference', type: 'text', placeholder: 'KF-1042' },
  { id: 'weight', label: 'Weight (kg)', type: 'number', min: 0, step: 5 },
  { id: 'delivery', label: 'Delivery date', type: 'date' },
  { id: 'carrier', label: 'Carrier', type: 'multi-select', options: [{ value: 'kestrel', label: 'Kestrel Freight' }, { value: 'orchard', label: 'Orchard Mill Haulage' }, { value: 'brightwater', label: 'Brightwater Co' }] },
  { id: 'insured', label: 'Insured', type: 'boolean' },
]

const applied = (): FilterItem[] => [
  { id: 'f1', field: 'status', operator: 'eq', value: 'in-transit' },
  { id: 'f2', field: 'weight', operator: 'gt', value: 120 },
  { id: 'f3', field: 'carrier', operator: 'in', value: ['kestrel', 'brightwater'] },
]

const doc: ComponentDoc = {
  name: 'FilterBar',
  group: 'forms',
  subgroup: 'Filtering',
  summary: 'A row of applied filters as removable chips with an "Add filter" popover, "Clear all", a polite live region and URL-query helpers.',
  description:
    'Use `FilterBar` above a table, list or board when the user narrows results by several fields at once. `v-model` is an array of `{ id, field, operator?, value, label? }`; `fields` describes what can be filtered (`text`, `number`, `select`, `multi-select`, `date`, `boolean`) and drives the field, condition and value pickers in the popover. Each applied filter is a `FilterChip` ("Status is In transit") with its own remove button; "Clear all" removes everything. Additions, removals and clearing are announced in a polite live region, and focus moves to a neighbouring chip (or "Add filter") after a removal so the keyboard user never loses their place. `variant` (`default`, `compact`, `inline`) and `size` (`sm`, `md`, `lg`) change density and shape; the bar wraps instead of scrolling, down to 320px. `filtersToQuery` and `queryToFilters` turn the model into a plain object for the URL and back; they skip anything malformed, refuse keys like `__proto__` and never throw. The bar only edits the list: applying it to data is the app\'s job. Use `SearchInput` for one free-text box, `MultiSelect` for one field with many values, and `DataTable` column filters when each column already has its own control.',
  status: 'beta',
  props: [
    { name: 'modelValue', type: 'FilterItem[]', description: 'Applied filters (v-model). Entries without a string `id` and `field`, with no value, or with a repeated `id` are ignored. Omit for uncontrolled use.' },
    { name: 'defaultValue', type: 'FilterItem[]', default: '[]', description: 'Initial filters when uncontrolled.' },
    { name: 'fields', type: 'FilterField[]', default: '[]', description: 'What can be filtered: `{ id, label, type?, options?, operators?, placeholder?, min?, max?, step? }`. `type` defaults to `text`; `select` and `multi-select` need `options` (`{ value, label, disabled? }`); `operators` restricts the conditions to a subset of the known ids (`eq`, `neq`, `contains`, `not_contains`, `starts`, `ends`, `gt`, `gte`, `lt`, `lte`, `before`, `after`, `in`, `nin`). Fields with a blank or repeated `id` are ignored.' },
    { name: 'open', type: 'boolean', description: 'Open state of the "Add filter" popover (v-model:open). Omit for uncontrolled use.' },
    { name: 'variant', type: "'default' | 'compact' | 'inline'", default: "'default'", description: '`default` has 8px gaps and bordered chips with a muted fill; `compact` has 4px gaps, tighter padding and smaller corners; `inline` has flat chips with only a bottom rule and link-style buttons, for use inside a toolbar or a sentence. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of the chips (12 / 14 / 16px) and height of the buttons (24 / 32 / 36px; 44px on touch devices). Unknown values fall back to `md`.' },
    { name: 'clearable', type: 'boolean', default: 'true', description: 'Show "Clear all" while at least one filter is applied.' },
    { name: 'max', type: 'number', description: 'Most filters that can be applied. At the limit "Add filter" is disabled. Non-positive or non-numeric values mean unlimited; fractions are floored.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables adding, removing and clearing.' },
    { name: 'labels', type: 'Partial<FilterBarLabels>', description: 'Text overrides: `group`, `add`, `clear`, `field`, `operator`, `value`, `apply`, `cancel`, `remove` (uses `{filter}`), `yes`, `no`, `choose`, `valueRequired`, the live region sentences `added`, `removed` (use `{filter}`) and `cleared`, and `operators` (a map from operator id to wording). Blank or missing keys keep the English default.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root (`data-slot="filter-bar"`, `role="group"`).' },
  ],
  slots: [{ name: 'chip', props: '{ filter: FilterItem; label: string }', description: 'Content of a chip, replacing the generated text. The remove button keeps naming the chip after its generated text.' }],
  emits: [
    { name: 'update:modelValue', payload: '[filters: FilterItem[]]', description: 'The list changed: a filter was added, removed or cleared.' },
    { name: 'update:open', payload: '[open: boolean]', description: 'The "Add filter" popover opened or closed.' },
    { name: 'add', payload: '[filter: FilterItem]', description: 'A filter was added through the popover.' },
    { name: 'remove', payload: '[filter: FilterItem]', description: 'A filter was removed with its chip button.' },
    { name: 'clear', payload: '[filters: FilterItem[]]', description: '"Clear all" removed these filters.' },
  ],
  parts: [
    {
      name: 'FilterChip',
      description: 'One applied filter: text plus a remove button. Rendered by `FilterBar` as a list item, usable alone (for example in a summary line). Emits `remove`; Delete and Backspace on the remove button remove it too.',
      props: [
        { name: 'label', type: 'string', description: 'Chip text. Required (or default slot text): it also names the remove button, "Remove filter: <label>".' },
        { name: 'variant', type: "'default' | 'compact' | 'inline'", default: "'default'", description: 'Same looks as `FilterBar.variant`. Unknown values fall back to `default`.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size. Unknown values fall back to `md`.' },
        { name: 'removable', type: 'boolean', default: 'true', description: 'Show the remove button.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the remove button.' },
        { name: 'removeLabel', type: 'string', description: 'Full accessible name of the remove button, replacing "Remove filter: <label>".' },
        { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render. `FilterBar` uses `li`.' },
      ],
    },
  ],
  examples: [
    {
      title: 'Basic',
      description: 'Sample shipment filters. Open "Add filter", pick a field, a condition and a value; every type has its own editor.',
      script: `const fields = [{ id: 'status', label: 'Status', type: 'select', options: [...] }, { id: 'weight', label: 'Weight (kg)', type: 'number' }, { id: 'carrier', label: 'Carrier', type: 'multi-select', options: [...] }, ...]
const filters = ref([{ id: 'f1', field: 'status', operator: 'eq', value: 'in-transit' }, ...])`,
      code: `<FilterBar v-model="filters" :fields="fields" />`,
      state: () => ({ fields, filters: ref(applied()) }),
    },
    {
      title: 'Empty and uncontrolled',
      description: 'Without `v-model` the bar keeps its own list. "Clear all" only shows once a filter exists.',
      code: `<FilterBar :fields="fields" />`,
      state: () => ({ fields }),
    },
    {
      title: 'Variants',
      description: '`default`, `compact` and `inline` side by side.',
      code: `<div class="grid gap-6">
  <FilterBar variant="default" :default-value="filters" :fields="fields" />
  <FilterBar variant="compact" :default-value="filters" :fields="fields" />
  <FilterBar variant="inline" :default-value="filters" :fields="fields" />
</div>`,
      state: () => ({ fields, filters: applied() }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid gap-6">
  <FilterBar size="sm" :default-value="filters" :fields="fields" />
  <FilterBar size="md" :default-value="filters" :fields="fields" />
  <FilterBar size="lg" :default-value="filters" :fields="fields" />
</div>`,
      state: () => ({ fields, filters: applied() }),
    },
    {
      title: 'URL query round trip',
      description: '`filtersToQuery` returns a plain object (`{ filter: string[] }`) for `router.push({ query })` or `new URLSearchParams`; `queryToFilters` restores typed filters and skips anything that does not fit `fields`.',
      script: `import { filtersToQuery, queryToFilters } from '@perfect-design/ui'
const filters = ref(queryToFilters(route.query, { fields }))
const query = computed(() => filtersToQuery(filters.value))`,
      code: `<div class="grid gap-3">
  <FilterBar v-model="filters" :fields="fields" />
  <pre class="overflow-x-auto rounded-md bg-muted p-3 text-xs" tabindex="0" aria-label="Query object">{{ JSON.stringify(query, null, 2) }}</pre>
</div>`,
      state: () => {
        const filters = ref(queryToFilters({ filter: ['status:eq:delivered', 'reference:contains:KF%3A10', 'weight:gt:__proto__', 'unknown:eq:x'] }, { fields }))
        return { fields, filters, query: computed(() => filtersToQuery(filters.value)) }
      },
    },
    {
      title: 'Limit, disabled and custom wording',
      description: '`max` disables "Add filter" at the limit, `disabled` locks the bar, `labels` replaces the text (here shortened operator wording).',
      code: `<div class="grid gap-6">
  <FilterBar :default-value="filters" :fields="fields" :max="3" />
  <FilterBar :default-value="filters" :fields="fields" disabled />
  <FilterBar :default-value="filters" :fields="fields" :labels="labels" />
</div>`,
      state: () => ({ fields, filters: applied(), labels: { group: 'Active filters', add: 'New filter', clear: 'Reset', operators: { eq: '=', gt: '>' } } }),
    },
    {
      title: 'Narrow container and long values',
      description: 'Chips wrap their text and the bar wraps its rows instead of overflowing, here in a 16rem column.',
      code: `<div class="max-w-64">
  <FilterBar :default-value="filters" :fields="fields" />
</div>`,
      state: () => ({
        fields,
        filters: [
          { id: 'long1', field: 'reference', operator: 'contains', value: 'KF-1042-pallet-consolidation-northern-depot-holding-area' },
          { id: 'long2', field: 'carrier', operator: 'in', value: ['kestrel', 'orchard', 'brightwater'] },
        ] as FilterItem[],
      }),
    },
    {
      title: 'FilterChip on its own',
      description: 'The chip is exported for summary lines. It renders a span by default and always names its remove button.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <FilterChip label="Status is Booked" @remove="removed = 'Status'" />
  <FilterChip label="Insured is Yes" variant="compact" size="sm" />
  <FilterChip label="Read only" :removable="false" variant="inline" />
  <span class="text-sm text-muted-foreground" role="status">{{ removed ? removed + ' removed' : 'Nothing removed' }}</span>
</div>`,
      state: () => ({ removed: ref('') }),
    },
  ],
  a11y: [
    'The bar is `role="group"` named "Filters" (override with `labels.group` or `aria-label`). Applied filters are a `<ul>` of `<li>` chips; each chip has a real `<button>` named "Remove filter: Status is In transit".',
    'Keyboard: Tab reaches each remove button, then "Add filter", then "Clear all". Enter or Space activates a button; Delete and Backspace on a focused remove button remove that chip. "Add filter" opens a popover that moves focus inside, closes with Escape and returns focus to the button.',
    'After a removal focus moves to the remove button now at the same position (or the last one), and to "Add filter" when no chip is left; after "Clear all" it moves to "Add filter".',
    'The popover is a form: Field (`<select>`), Condition (`<select>`, hidden for `boolean` and for fields with one operator) and a value editor by type: text input, number input with steppers, date input, `<select>`, a group of checkboxes with a legend for `multi-select`. Enter submits from any single-line input. An empty or out-of-range value shows an error linked to the editor and returns focus to it; nothing is added.',
    'A visually hidden `role="status"` region (polite, atomic) says "Added filter: Status is Booked.", "Removed filter: ..." or "All filters cleared.". It is always in the DOM, so the first announcement is not lost.',
    'State is never colour alone: a filter is text plus an "x" button; the `inline` variant keeps a bottom rule (a border in forced-colors mode). Every control keeps the focus ring (an outline in forced-colors mode).',
    'Targets are at least 24px (the remove button is 24px, 32px on touch devices; buttons are 44px tall on touch devices). Popover form text is 16px on small screens. Chips wrap their text and the bar wraps its rows, so nothing scrolls sideways at 320px or at 200% zoom. Logical properties keep the layout correct in right-to-left text.',
  ],
  requires: [
    'Throws a ContractError when `fields` has no usable entry, when a field has no `id` or a repeated `id`, or when a field has no `label`.',
    'Throws a ContractError when a `select` or `multi-select` field has no `options`.',
    'Throws a ContractError when an applied filter has no `id` or a repeated `id`.',
    'Throws a ContractError when a `FilterChip` has no label text (the prop or the default slot).',
  ],
  llmNotes: [
    'Always pass `fields` with unique `id` and a `label`; give `select` and `multi-select` fields `options`.',
    'Bind `v-model` to an array of `{ id, field, operator?, value }`. `value` is a string, number, boolean or string[] matching the field type; keep `id` unique.',
    'The bar edits the list only. Apply the filters to your data yourself; do not build another filter UI beside it.',
    'Store filters in the URL with `filtersToQuery(filters)` and read them with `queryToFilters(route.query, { fields })`. Always pass `fields` when reading so unknown or malformed entries are dropped.',
    'Use `variant="compact"` in dense toolbars and `variant="inline"` inside a sentence. Do not restyle chips with colours to encode meaning.',
    'Pass `labels` to translate the bar; do not wrap it to rename buttons.',
    'Use `FilterChip` alone only for read-only summaries or custom lists; always give it a `label`.',
  ],
  related: ['SearchInput', 'MultiSelect', 'Popover', 'Chip', 'DataTable', 'NativeSelect'],
}

export default doc
