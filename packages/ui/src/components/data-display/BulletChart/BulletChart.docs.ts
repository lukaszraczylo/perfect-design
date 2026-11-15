import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const SAMPLE = `[
    { label: 'Orders shipped', value: 78, target: 85, ranges: [50, 75, 100], unit: 'k' },
    { label: 'Returns handled', value: 42, target: 60, ranges: [40, 70, 100], unit: 'k' },
    { label: 'Dock utilisation', value: 91, target: 80, ranges: [60, 85, 100], unit: '%' },
  ]`

const doc: ComponentDoc = {
  name: 'BulletChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Bullet chart: one thin measure bar against a target marker and qualitative range bands, for one or several stacked measures.',
  description:
    'Use `BulletChart` to compare a measure with its goal and with bands such as poor, fair and good, in the space of a single row. It replaces a gauge or a set of progress bars when several measures share one scale. Each entry of `bullets` is `{ label, value, target?, ranges?, max?, tone?, unit? }`. `ranges` are ascending upper bounds (`[50, 75, 100]`); unsorted, duplicate and non-finite bounds are cleaned up. The bands are tonal steps of the muted colour (the lowest is the darkest) and the two darkest also carry a diagonal hatch, so the bands never rely on shade alone; `showRangeLabels` prints the bounds. The target is a tick with a diamond cap: a shape, not a colour. `variant` lays the measures out as rows (`horizontal`) or columns (`vertical`); `size` sets the band thickness. With `sharedScale` (default) every measure uses one axis, so lengths compare; turn it off when the measures have different units, and each measure then fills its own scale (no common axis is drawn). A value beyond the end of the scale is clamped and marked with an arrow head; a value that is not a number is listed as "n/a" and drawn without a bar. Not for time series (use `LineChart`) or part-to-whole data (use `DonutChart`). At most 60 measures are drawn.',
  status: 'stable',
  props: [
    { name: 'bullets', type: 'BulletInput[]', required: true, description: 'Measures: `{ label, value, target?, ranges?, max?, tone?, unit? }`. `ranges` are ascending upper bounds of the bands (up to 5); `max` is the upper end of that measure\'s scale; `unit` is appended to its value. An empty array shows `emptyText`.' },
    { name: 'variant', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Rows (`horizontal`) or side-by-side columns (`vertical`). A vertical chart with many measures scrolls inside a focusable, named region.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Band thickness and spacing: 16, 24 or 32 px bands (vertical: 18, 26 or 35 px wide, 120, 180 or 240 px tall).' },
    { name: 'tone', type: TONE, default: "'chart-1'", description: 'Colour token of the measure bar for bullets without their own `tone`.' },
    { name: 'showTarget', type: 'boolean', default: 'true', description: 'Draw the target marker: a tick with a diamond cap. The table alternative always lists the target.' },
    { name: 'showValues', type: 'boolean', default: 'true', description: 'Print each value (with its `unit`) beside the measure.' },
    { name: 'showAxis', type: 'boolean', default: 'true', description: 'Draw the scale (ticks and grid lines). Only with `sharedScale`.' },
    { name: 'showRangeLabels', type: 'boolean', default: 'false', description: 'Print the upper bound of every range band. Adds spacing so the labels do not collide with the next measure.' },
    { name: 'showLegend', type: 'boolean', default: 'false', description: 'Legend for the measure, the target marker and the ranges.' },
    { name: 'sharedScale', type: 'boolean', default: 'true', description: 'One scale for all measures (comparable lengths, one axis). Off: each measure fills its own scale and no axis is drawn.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats axis ticks, values, targets and range bounds. Defaults to compact numbers on the axis and grouped numbers for values.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart. Required unless `title`, `aria-label` or `aria-labelledby` is set.' },
    { name: 'title', type: 'string', description: 'Visible heading text above the chart. Also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible supporting text under the title.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when there are no measures.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px).' },
    { name: 'height', type: 'number', description: 'Total viewBox height. Overrides the height that follows `size` and the number of measures: bands thicken (up to twice the size) and rows spread to fill it.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'One measure with a target and three ranges. Sample data.',
      code: `<BulletChart label="Sample data: orders shipped" :bullets="[{ label: 'Orders shipped', value: 78, target: 85, ranges: [50, 75, 100] }]" />`,
    },
    {
      title: 'Several measures on one scale',
      description: 'Stacked bullets share one axis, so the lengths compare. Title and description are plain text above the chart. Sample data.',
      script: `const bullets = ${SAMPLE}`,
      code: `<BulletChart
  title="Warehouse measures"
  description="Sample data, thousands of units and percent"
  :bullets="bullets"
  :value-formatter="(n) => String(n)"
/>`,
      state: () => ({
        bullets: [
          { label: 'Orders shipped', value: 78, target: 85, ranges: [50, 75, 100], unit: 'k' },
          { label: 'Returns handled', value: 42, target: 60, ranges: [40, 70, 100], unit: 'k' },
          { label: 'Dock utilisation', value: 91, target: 80, ranges: [60, 85, 100], unit: '%' },
        ],
      }),
    },
    {
      title: 'Variant: horizontal and vertical',
      description: 'Rows or columns. Both draw the same bands, bar and target. Sample data.',
      code: `<div class="flex flex-col gap-6">
  <BulletChart variant="horizontal" label="Sample data: rows" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }, { label: 'Returns', value: 42, target: 60, ranges: [50, 75, 100] }]" />
  <BulletChart variant="vertical" label="Sample data: columns" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }, { label: 'Returns', value: 42, target: 60, ranges: [50, 75, 100] }, { label: 'Dock', value: 91, target: 80, ranges: [50, 75, 100] }]" />
</div>`,
    },
    {
      title: 'Size: sm, md and lg',
      description: 'Band thickness and spacing. Sample data.',
      code: `<div class="flex flex-col gap-6">
  <BulletChart size="sm" label="Sample data: small" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }]" />
  <BulletChart size="md" label="Sample data: medium" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }]" />
  <BulletChart size="lg" label="Sample data: large" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }]" />
</div>`,
    },
    {
      title: 'Tone',
      description: 'The `tone` prop colours the measure bar; a bullet can set its own `tone`. Sample data.',
      code: `<div class="flex flex-col gap-6">
  <BulletChart tone="success" label="Sample data: success tone" :bullets="[{ label: 'On time', value: 88, target: 90, ranges: [60, 80, 100] }]" />
  <BulletChart tone="danger" label="Sample data: danger tone" :bullets="[{ label: 'Errors', value: 35, target: 20, ranges: [20, 40, 100] }]" />
  <BulletChart label="Sample data: one tone per measure" :bullets="[
    { label: 'Primary', value: 70, ranges: [40, 80, 100], tone: 'primary' },
    { label: 'Info', value: 55, ranges: [40, 80, 100], tone: 'info' },
    { label: 'Warning', value: 30, ranges: [40, 80, 100], tone: 'warning' },
    { label: 'Muted', value: 45, ranges: [40, 80, 100], tone: 'muted' },
    { label: 'Chart 3', value: 62, ranges: [40, 80, 100], tone: 'chart-3' },
  ]" />
</div>`,
    },
    {
      title: 'Target marker and values',
      description: 'The target is a tick with a diamond cap. `showTarget` and `showValues` switch the marker and the printed values off. Sample data.',
      code: `<div class="flex flex-col gap-6">
  <BulletChart label="Sample data: target shown" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }]" />
  <BulletChart :show-target="false" :show-values="false" label="Sample data: target and values hidden" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }]" />
</div>`,
    },
    {
      title: 'Range labels and legend',
      description: '`showRangeLabels` prints the band bounds; `showLegend` explains the bar, the marker and the bands. Sample data.',
      code: `<BulletChart show-range-labels show-legend label="Sample data: labelled ranges" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }, { label: 'Returns', value: 42, target: 60, ranges: [40, 70, 100] }]" />
<BulletChart show-range-labels show-legend variant="vertical" class="mt-6" label="Sample data: labelled ranges in columns" :bullets="[{ label: 'Orders', value: 78, target: 85, ranges: [50, 75, 100] }, { label: 'Returns', value: 42, target: 60, ranges: [40, 70, 100] }]" />`,
    },
    {
      title: 'Separate scales',
      description: 'With `sharedScale` off each measure has its own scale (here different units), so no common axis is drawn. Sample data.',
      code: `<BulletChart :shared-scale="false" label="Sample data: separate scales" :bullets="[
  { label: 'Latency', value: 180, target: 150, ranges: [100, 200, 300], unit: 'ms' },
  { label: 'Uptime', value: 99.2, target: 99.9, max: 100, ranges: [95, 99, 100], unit: '%' },
  { label: 'Queue', value: 8, target: 5, ranges: [4, 8, 12] },
]" />`,
    },
    {
      title: 'Value beyond the scale, missing value and formatter',
      description: 'A value beyond an explicit `max` is clamped and marked with an arrow head. A value that is not a number is "n/a". `valueFormatter` shapes every number. Sample data.',
      code: `<BulletChart
  label="Sample data: edge cases"
  :value-formatter="(n) => n + ' pts'"
  :bullets="[
    { label: 'Over the end', value: 140, target: 90, max: 100, ranges: [50, 80, 100] },
    { label: 'No value yet', value: Number.NaN, target: 70, max: 100, ranges: [50, 80, 100] },
    { label: 'No ranges', value: 35, max: 100 },
  ]"
/>`,
    },
    {
      title: 'Empty',
      code: `<BulletChart label="Sample data: no measures" :bullets="[]" empty-text="No measures yet" />`,
    },
  ],
  a11y: [
    'The chart is one `role="img"` SVG named by `label`, `title`, `aria-label` or `aria-labelledby`; an automatic summary ("Bullet chart: 3 measures") is only the fallback when strict mode is off.',
    'A visually hidden table lists every measure with its value, target and range bounds, so no number depends on seeing the picture.',
    'The target marker is a tick with a diamond cap (a shape). The range bands are tonal steps of the muted colour, the two darkest are hatched, and `showRangeLabels` prints their bounds: no meaning rests on colour alone. Shapes keep an outline in forced-colors mode.',
    'Each band, bar and marker has a native tooltip (`<title>`); values and labels are 12px text with tabular figures.',
    'The SVG fills its container (1 unit is 1 CSS px) and never widens the page; a vertical chart with many columns scrolls horizontally inside a focusable `role="region"` named like the chart.',
    'No animation. Empty and invalid data show an inline message; NaN and Infinity never reach the SVG.',
  ],
  related: ['Gauge', 'BarChart', 'StatBar', 'KpiTile'],
  requires: [
    'Throws a ContractError when there is no `label`, `title`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `bullets` is not an array. An empty array is valid and shows `emptyText`.',
    'Throws a ContractError when a measure has no `label` text.',
  ],
  llmNotes: [
    'Give every BulletChart a `label` or a `title`; give every measure a `label`.',
    'Pass `ranges` as ascending upper bounds (`[50, 75, 100]`); the lowest band is drawn darkest.',
    'Use the same unit for all measures when `sharedScale` is on; set `sharedScale` to false for mixed units.',
    'Use `variant="vertical"` for a few measures side by side, `horizontal` for a list.',
    'Use `max` on a measure to fix its scale end; a larger value is clamped and marked.',
    'Do not use a BulletChart for a time series (LineChart) or a share of a whole (DonutChart).',
  ],
  replaces: ['hand-rolled progress bars with target lines', 'custom SVG bullet graphs'],
}
export default doc
