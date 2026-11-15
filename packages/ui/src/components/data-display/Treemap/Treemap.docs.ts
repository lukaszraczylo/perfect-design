import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const stock = `[
  { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }, { label: 'Patch leads', value: 8 }] },
  { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
  { label: 'Tools', value: 10 },
  { label: 'Spares', value: 6 }
]`

const doc: ComponentDoc = {
  name: 'Treemap',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Hierarchical tile chart: area follows value, tiles are squarified, groups can be shown as nested containers, and every tile is keyboard reachable.',
  description:
    'Use `Treemap` to show how a total splits into parts and parts of parts (disk use by folder, stock by category, spend by team), when the share matters more than the exact value. Tile area is proportional to the value; the layout is squarified so tiles stay close to square, and it is deterministic (same data, same picture). A node with `children` takes the sum of them as its value, a node without children needs a positive number. `variant` chooses flat tinted tiles, nested containers with a header per group, or soft outlined tiles. `colorBy="depth"` paints everything in one `tone` and makes deeper levels denser; `colorBy="series"` gives every top-level group its own chart colour (with a legend). Labels are written only into tiles that are big enough (`labels="auto"`); every tile keeps its full name in `aria-label` and a native tooltip. Do not use it for exact comparison of many values (use `BarChart`), for time series, or for more than a few hundred visible tiles; tiles smaller than 2px are skipped and counted in a message. No drill-down: it is a static picture with a text alternative.',
  status: 'stable',
  props: [
    { name: 'data', type: 'TreemapDatum[]', required: true, description: '`{ label, value?, children? }` nodes. A node with children takes the sum of them; a leaf needs a number above zero. Other entries are left out and counted in a message. An empty array shows `emptyText`.' },
    { name: 'variant', type: "'flat' | 'nested' | 'outline'", default: "'flat'", description: '`flat` tinted tiles with a seam, `nested` draws every group as a container with a header and puts its tiles inside, `outline` soft tiles with a tone coloured edge.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the drawing: 200, 300 or 420 (an explicit `height` wins).' },
    { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between tiles: 0, 1, 2 or 4 px.' },
    { name: 'tone', type: TONE, default: "'chart-1'", description: 'Colour token of the tiles with `colorBy="depth"`. Tiles are a 15 to 45 percent tint so the label keeps its contrast.' },
    { name: 'colorBy', type: "'depth' | 'series'", default: "'depth'", description: '`depth` uses `tone` for everything and makes deeper levels denser; `series` gives each top-level group its own chart colour (cycling chart-1 to chart-5, in input order).' },
    { name: 'labels', type: "'auto' | 'none'", default: "'auto'", description: '`auto` writes the label into every tile that is wide and tall enough (long labels are cut with an ellipsis); `none` leaves tiles unlabelled. Names and tooltips are always there.' },
    { name: 'showValues', type: 'boolean', default: 'true', description: 'Print the value under the label when the tile is tall enough and the value fits.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of the top-level groups. `auto` shows it with `colorBy="series"` and two or more groups.' },
    { name: 'maxDepth', type: 'number', default: '4', description: 'Levels that are drawn, 1 to 8. Deeper nodes are folded into the node at this level, so totals stay right.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats values in labels, names, tooltips and the table. Default: grouped number with up to two decimals.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart. Required unless `title`, `aria-label` or `aria-labelledby` is set.' },
    { name: 'title', type: 'string', description: 'Visible heading above the chart; also the name when there is no `label`.' },
    { name: 'description', type: 'string', description: 'Visible sentence under the title.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when there is nothing to draw.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width until the container is measured. The chart then fills its container (1 unit = 1 CSS pixel).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample stock counts for a fictional warehouse. Hover or focus a tile to read its full name below the chart.',
      code: `<Treemap
  label="Sample stock by category"
  :data="[
    { label: 'Cables', value: 68 },
    { label: 'Racks', value: 30 },
    { label: 'Tools', value: 10 },
    { label: 'Spares', value: 6 }
  ]"
/>`,
    },
    {
      title: 'Variant: flat, nested and outline',
      description: 'The same sample data three ways. Nested shows each group as a container with a header; outline uses a soft fill and a coloured edge.',
      script: `const stock = ${stock}`,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Treemap variant="flat" size="sm" label="Sample stock, flat" :data="stock" />
  <Treemap variant="nested" size="sm" label="Sample stock, nested" :data="stock" />
  <Treemap variant="outline" size="sm" label="Sample stock, outline" :data="stock" />
</div>`,
      state: () => ({
        stock: [
          { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }, { label: 'Patch leads', value: 8 }] },
          { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
          { label: 'Tools', value: 10 },
          { label: 'Spares', value: 6 },
        ],
      }),
    },
    {
      title: 'Size',
      description: 'Drawing height 200, 300 and 420. An explicit `height` overrides the preset.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Treemap size="sm" label="Sample, small" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
  <Treemap size="md" label="Sample, medium" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
  <Treemap size="lg" label="Sample, large" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
</div>`,
    },
    {
      title: 'Gap',
      description: 'No space, 1px, 2px (default) and 4px between tiles.',
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <Treemap gap="none" size="sm" label="Sample, no gap" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
  <Treemap gap="sm" size="sm" label="Sample, small gap" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
  <Treemap gap="md" size="sm" label="Sample, medium gap" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
  <Treemap gap="lg" size="sm" label="Sample, large gap" :data="[{ label: 'A', value: 5 }, { label: 'B', value: 3 }, { label: 'C', value: 2 }]" />
</div>`,
    },
    {
      title: 'Tone and colour by depth',
      description: 'One tone for the whole chart; deeper levels are denser. Pick the tone that matches the meaning (success, warning, danger) or leave chart-1.',
      script: `const stock = ${stock}`,
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <Treemap tone="chart-2" variant="nested" size="sm" label="Sample stock, chart-2" :data="stock" />
  <Treemap tone="success" variant="nested" size="sm" label="Sample stock, success" :data="stock" />
  <Treemap tone="warning" variant="outline" size="sm" label="Sample stock, warning" :data="stock" />
  <Treemap tone="danger" variant="outline" size="sm" label="Sample stock, danger" :data="stock" />
</div>`,
      state: () => ({
        stock: [
          { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }, { label: 'Patch leads', value: 8 }] },
          { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
          { label: 'Tools', value: 10 },
          { label: 'Spares', value: 6 },
        ],
      }),
    },
    {
      title: 'Colour by series',
      description: 'Each top-level group gets its own chart colour and a legend entry. Every tile still carries its group in its name, so colour is not the only signal.',
      script: `const stock = ${stock}`,
      code: `<Treemap
  color-by="series"
  variant="nested"
  size="lg"
  title="Sample stock by category"
  description="Sample data for a fictional warehouse."
  :data="stock"
/>`,
      state: () => ({
        stock: [
          { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }, { label: 'Patch leads', value: 8 }] },
          { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
          { label: 'Tools', value: 10 },
          { label: 'Spares', value: 6 },
        ],
      }),
    },
    {
      title: 'Labels, values and small tiles',
      description: 'Auto labels only appear in tiles that are big enough; `showValues="false"` keeps just the label; `labels="none"` leaves tiles blank and relies on tooltips, the readout under the chart and the table.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Treemap size="sm" label="Sample, labels and values" :data="[{ label: 'Large item', value: 60 }, { label: 'Medium', value: 25 }, { label: 'Small', value: 8 }, { label: 'Tiny', value: 2 }]" />
  <Treemap size="sm" label="Sample, labels only" :show-values="false" :data="[{ label: 'Large item', value: 60 }, { label: 'Medium', value: 25 }, { label: 'Small', value: 8 }, { label: 'Tiny', value: 2 }]" />
  <Treemap size="sm" label="Sample, no labels" labels="none" :data="[{ label: 'Large item', value: 60 }, { label: 'Medium', value: 25 }, { label: 'Small', value: 8 }, { label: 'Tiny', value: 2 }]" />
</div>`,
    },
    {
      title: 'Value formatter',
      description: 'Values in labels, names and the table use the formatter.',
      code: `<Treemap
  label="Sample disk use"
  variant="nested"
  :value-formatter="(n) => n + ' GB'"
  :data="[
    { label: 'Logs', children: [{ label: 'Archive', value: 120 }, { label: 'Current', value: 45 }] },
    { label: 'Backups', value: 210 },
    { label: 'Media', value: 80 }
  ]"
/>`,
    },
    {
      title: 'Deep nesting and maxDepth',
      description: 'Levels below `maxDepth` are folded into the node at that level; totals stay the same. Left: all four levels, right: two.',
      script: `const deep = [{ label: 'Site', children: [{ label: 'Hall A', children: [{ label: 'Row 1', children: [{ label: 'Rack 1', value: 6 }, { label: 'Rack 2', value: 4 }] }, { label: 'Row 2', value: 5 }] }, { label: 'Hall B', value: 9 }] }]`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <Treemap variant="nested" :max-depth="4" size="sm" label="Sample site, four levels" :data="deep" />
  <Treemap variant="nested" :max-depth="2" size="sm" label="Sample site, two levels" :data="deep" />
</div>`,
      state: () => ({
        deep: [{ label: 'Site', children: [{ label: 'Hall A', children: [{ label: 'Row 1', children: [{ label: 'Rack 1', value: 6 }, { label: 'Rack 2', value: 4 }] }, { label: 'Row 2', value: 5 }] }, { label: 'Hall B', value: 9 }] }],
      }),
    },
    {
      title: 'Empty and invalid data',
      description: 'No data shows `emptyText`. Entries with a zero, negative or non-numeric value are left out and counted in a message.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <Treemap label="Sample, no data" :data="[]" empty-text="No stock recorded" />
  <Treemap size="sm" label="Sample, some invalid values" :data="[{ label: 'Valid', value: 5 }, { label: 'Zero', value: 0 }, { label: 'Negative', value: -3 }, { label: 'Other valid', value: 2 }]" />
</div>`,
    },
    {
      title: 'Narrow container',
      description: 'The chart measures its container, so it reflows to a 320px column without scrolling; small tiles lose their labels first.',
      script: `const stock = ${stock}`,
      code: `<div class="w-80 max-w-full">
  <Treemap variant="nested" size="sm" label="Sample stock in a narrow column" :data="stock" />
</div>`,
      state: () => ({
        stock: [
          { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }, { label: 'Patch leads', value: 8 }] },
          { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
          { label: 'Tools', value: 10 },
          { label: 'Spares', value: 6 },
        ],
      }),
    },
    {
      title: 'Many tiles',
      description: 'Three hundred generated sample items. Tiles too small to draw are skipped and counted; the text alternative still lists the first 200 rows.',
      script: `const many = Array.from({ length: 300 }, (_, i) => ({ label: 'Item ' + (i + 1), value: ((i * 37) % 101) + 1 }))`,
      code: `<Treemap size="lg" gap="sm" color-by="depth" tone="chart-2" label="Sample: 300 generated items" :data="many" />`,
      state: () => ({ many: Array.from({ length: 300 }, (_, i) => ({ label: 'Item ' + (i + 1), value: ((i * 37) % 101) + 1 })) }),
    },
  ],
  a11y: [
    'The drawing is an SVG `role="group"` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by an automatic summary (item count, top-level groups, total). It is a group, not an image, because its tiles are focusable.',
    'Every tile is `role="img"` with an `aria-label` of its full path, value and share of the total ("Cables / Fibre: 20 (20% of total)"), even when its text label is hidden or cut.',
    'Keyboard: one tile is in the tab order (roving tabindex). Arrow Right/Down move to the next tile, Arrow Left/Up to the previous, Home and End to the first and last, in layout order (largest first). Focus shows a thick ring in the `ring` token, also in forced-colors mode.',
    'The full name of the focused or hovered tile is written below the chart (hidden from assistive technology, which reads the tile name itself). Tiles also carry a native tooltip.',
    'A visually hidden data table lists every group and leaf with its value (first 200 rows). It is the text alternative for the whole chart.',
    'Colour is never the only signal: tiles are labelled, groups have header text, and the table names every item. Tints stay at 45 percent or less so the foreground label keeps its contrast in light and dark.',
    'There is no motion. The SVG scales to its container (1 unit = 1 CSS pixel) so labels keep their real size and nothing overflows at 320px.',
  ],
  related: ['BarChart', 'DonutChart', 'Heatmap', 'Tree'],
  requires: [
    'Throws a ContractError when there is no `label`, `title`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `data` is not an array of nodes. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `data` as `{ label, value?, children? }`; give leaves a positive number, never give a group a `value` (it is the sum of its children).',
    'Always set `label` or `title`; label values and units with `valueFormatter`.',
    'Use `variant="nested"` when groups matter, `flat` for a plain share picture, `outline` on dense pages. Use `colorBy="series"` only when the top-level groups are the story; otherwise keep one tone.',
    'Use `maxDepth` to cut deep trees. Tiny tiles are skipped automatically; do not pre-filter just to keep the picture clean, tell readers where the rest is.',
    'Do not use a treemap for exact comparison, negative values or time series. Use BarChart, LineChart or DonutChart.',
  ],
  replaces: ['d3-hierarchy treemap wrappers', 'hand-rolled div treemaps'],
}
export default doc
