import type { ComponentDoc, ExampleDoc } from '../../../docs-types'

const columns = () => [
  { title: 'Sample plan A', subtitle: 'Price goes here' },
  { title: 'Sample plan B', subtitle: 'Price goes here', highlighted: true, badge: 'Recommended' },
  { title: 'Sample plan C', subtitle: 'Price goes here' },
]
const rows = () => [
  { label: 'Projects', values: ['1', '10', 'Unlimited'] },
  { label: 'Custom domains', description: 'Bring your own domain', values: [false, true, true] },
  { group: 'Security' },
  { label: 'SSO', values: [false, false, true] },
  { label: 'Audit log', values: [false, true, true] },
  { group: 'Support' },
  { label: 'Support channel', values: ['Community', 'Email', 'Chat'] },
  { label: 'Phone support', values: [false, null, true] },
]

const optionExample = (title: string, description: string, attrs: string): ExampleDoc => ({
  title,
  description,
  code: `<ComparisonTable caption="${title}" ${attrs} :columns="columns" :rows="rows" />`,
  state: () => ({ columns: columns(), rows: rows() }),
})

const doc: ComponentDoc = {
  name: 'ComparisonTable',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'Generic feature matrix: a real table of columns x features with check, cross, text and empty cells, grouping, a highlighted column and sticky options.',
  description:
    'Use to compare plans, products or editions feature by feature. `columns` define the headers (one may be `highlighted`), `rows` are features (`{ label, description?, values[] }`) or `{ group }` headings that open a new section. Cell values: `true` = check, `false` = cross, text/number = shown as-is, `null`/`undefined`/missing/empty = dash. Every check and cross carries screen-reader text. The table scrolls horizontally inside a focusable region on small screens (`stickyFirstColumn` is on by default, so feature names stay visible; pass `false` to let the whole table scroll). `stickyHeader` keeps the header visible while the region scrolls vertically, so give the root a max height (`class="max-h-96"`). For plan headers with prices and CTAs use `PricingTable` (built on this component). For a handful of plans with long feature lists use `PricingGrid` instead.',
  status: 'stable',
  props: [
    { name: 'columns', type: 'ComparisonColumn[]', default: '[]', description: 'Headers: `{ key?, title, subtitle?, badge?, highlighted? }`. Malformed entries are skipped.' },
    { name: 'rows', type: 'ComparisonRow[]', default: '[]', description: 'Feature rows `{ label, description?, values: (boolean | string | number | null | undefined)[] }` and group headings `{ group: string }`. Malformed entries are skipped; `values` may be shorter than `columns`.' },
    { name: 'variant', type: "'default' | 'striped' | 'bordered' | 'minimal'", default: "'default'", description: '`default` framed, `striped` alternating row shading, `bordered` borders on every cell, `minimal` no outer frame. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell density. Unknown values fall back to `md`.' },
    { name: 'caption', type: 'string', description: 'Required (or `aria-label` / `aria-labelledby`). Accessible name: used for the sr-only `<caption>` and the `aria-label` of the scroll region. Give each table on a page a different caption: identical region names fail the landmark-unique rule.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pin the header row while the region scrolls vertically (needs a max height on the root).' },
    { name: 'stickyFirstColumn', type: 'boolean', default: 'true', description: 'Pin the feature-name column while the region scrolls horizontally. On by default so row labels never scroll out of view; pass `false` to let the whole table scroll.' },
    { name: 'cornerLabel', type: 'string', default: "'Features'", description: 'Text of the top-left header cell.' },
    { name: 'includedLabel', type: 'string', default: "'Included'", description: 'Screen-reader text for a check.' },
    { name: 'excludedLabel', type: 'string', default: "'Not included'", description: 'Screen-reader text for a cross.' },
    { name: 'unavailableLabel', type: 'string', default: "'Not available'", description: 'Screen-reader text for an empty cell.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the scroll region (root).' },
  ],
  slots: [
    { name: 'corner', description: 'Replaces the top-left header cell content.' },
    { name: 'column-header', description: 'Replaces the content of a column header.', props: '{ column: ComparisonColumn, index: number }' },
    { name: 'column-footer', description: 'Adds a footer row; one cell per column (e.g. CTA buttons).', props: '{ column: ComparisonColumn, index: number }' },
    { name: 'cell', description: 'Replaces the default check/cross/text rendering of a cell.', props: '{ value, row, column, rowIndex, columnIndex }' },
    { name: 'row-label', description: 'Replaces the feature name cell content.', props: '{ row: ComparisonFeature }' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<ComparisonTable caption="Minimal comparison" :columns="columns" :rows="rows" />`,
      script: `const columns = [{ title: 'Plan A' }, { title: 'Plan B', highlighted: true }]
const rows = [{ label: 'Projects', values: ['1', '10'] }, { label: 'SSO', values: [false, true] }]`,
      state: () => ({
        columns: [{ title: 'Plan A' }, { title: 'Plan B', highlighted: true }],
        rows: [{ label: 'Projects', values: ['1', '10'] }, { label: 'SSO', values: [false, true] }],
      }),
    },
    {
      title: 'Realistic: grouped features with a highlighted plan',
      code: `<ComparisonTable caption="Grouped feature comparison" :columns="columns" :rows="rows" />`,
      state: () => ({ columns: columns(), rows: rows() }),
    },
    optionExample('Variant: default', 'Framed with row separators.', 'variant="default"'),
    optionExample('Variant: striped', 'Alternating row shading across groups.', 'variant="striped"'),
    optionExample('Variant: bordered', 'Every cell bordered, for dense spec sheets.', 'variant="bordered"'),
    optionExample('Variant: minimal', 'No outer frame; sits directly on the page.', 'variant="minimal"'),
    optionExample('Size: sm', 'Compact rows.', 'size="sm"'),
    optionExample('Size: lg', 'Roomy rows for marketing pages.', 'size="lg"'),
    {
      title: 'Sticky header',
      description: 'The root has a max height so the table scrolls inside it and the header stays visible.',
      code: `<ComparisonTable caption="Comparison with sticky header" class="max-h-64" sticky-header :columns="columns" :rows="rows" />`,
      state: () => ({ columns: columns(), rows: rows() }),
    },
    {
      title: 'Sticky first column (default)',
      description: 'On narrow screens the table scrolls sideways while the feature names stay put. This is the default; pass `:sticky-first-column="false"` to opt out.',
      code: `<ComparisonTable caption="Comparison with sticky first column" class="max-w-sm" :columns="columns" :rows="rows" />`,
      state: () => ({ columns: columns(), rows: rows() }),
    },
    {
      title: 'Footer row (column-footer slot)',
      code: `<ComparisonTable caption="Comparison with footer actions" :columns="columns" :rows="rows">
  <template #column-footer="{ column }"><Button size="sm" variant="outline">Choose {{ column.title }}</Button></template>
</ComparisonTable>`,
      state: () => ({ columns: columns(), rows: rows().slice(0, 2) }),
    },
    {
      title: 'Custom cells (cell slot) and localised labels',
      code: `<ComparisonTable caption="Funktionsvergleich" included-label="Ja" excluded-label="Nein" unavailable-label="Keine Angabe" corner-label="Funktionen" :columns="columns" :rows="rows">
  <template #cell="{ value }"><Badge v-if="typeof value === 'string'" variant="secondary">{{ value }}</Badge><template v-else>{{ value === true ? 'Ja' : value === false ? 'Nein' : '-' }}</template></template>
</ComparisonTable>`,
      state: () => ({ columns: columns().slice(0, 2), rows: rows().slice(0, 2) }),
    },
  ],
  requires: [
    'Throws a ContractError when the table has no name: set `caption` (also the sr-only `<caption>`), `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when a column has an empty `title` and no `column-header` slot replaces the header (the first one is named by index).',
  ],
  a11y: [
    'A real `<table>` with `<caption>` (sr-only), `scope="col"` column headers, `scope="row"` feature headers and `scope="rowgroup"` group headings (each group is its own `<tbody>`).',
    'Checks, crosses and dashes are icons with screen-reader text ("Included", "Not included", "Not available"); localise with the label props.',
    'The scroll region has `role="region"`, an accessible name (`caption`, make it unique per page) and `tabindex="0"` so keyboard users can scroll it with the arrow keys; focus shows a ring (an outline in forced-colors mode).',
    'The highlighted column is marked with `data-highlighted` and an opaque tinted header; add a `badge` so the emphasis is not colour-only.',
    'Reflow: the table keeps a 36rem minimum width and scrolls horizontally inside its own region at 320px, so the page never scrolls sideways; `stickyFirstColumn` (on by default) keeps feature names visible. Alignment uses logical properties (`text-start`, `start-0`) so RTL works.',
  ],
  related: ['PricingTable', 'PricingGrid', 'StatGrid'],
  llmNotes: [
    'One value per column, in column order; use `true`/`false` for yes/no and strings for specifics ("10 GB").',
    'Mark at most one column `highlighted`, and give it a `badge`.',
    'Use `{ group: "..." }` rows to section long matrices instead of several tables.',
    'Use `stickyHeader` only with a max-height class on the root; `stickyFirstColumn` is on by default, turn it off only for two- or three-column tables with short labels.',
    'Pick `striped` for long tables, `bordered` for spec sheets, `minimal` on plain pages, `default` otherwise.',
    'For priced plans with CTAs use PricingTable; do not rebuild headers by hand.',
  ],
}
export default doc
