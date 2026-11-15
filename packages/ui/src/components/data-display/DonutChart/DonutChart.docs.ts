import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const doc: ComponentDoc = {
  name: 'DonutChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG donut or half donut showing parts of a whole, with a centre total and a legend of values and percentages that sits beside or under the ring.',
  description:
    'Use `DonutChart` for a handful (2–6) of parts that add up to a meaningful total. Segments are proportional to their values; negative, NaN and Infinity values count as 0. One non-zero segment is a full ring; a zero total shows a muted ring and the centre reads "0" with the `emptyText` caption while the legend still lists every label at 0%. The centre shows the formatted total plus `centerText`; replace it with the scoped `center` slot. `variant="half"` draws a semicircle with the total in its hollow, which suits a single headline split (passed / failed) in less height; `layout` moves the legend (beside the ring, always beside, or always under it). Use `BarChart` for many categories or precise comparison.',
  status: 'stable',
  props: [
    { name: 'data', type: `{ label: string; value: number; tone?: ${TONE} }[]`, required: true, description: 'Segments in draw order (clockwise from 12 o\'clock). Tones cycle chart-1..5 when omitted.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Rendered width: 7rem / 10rem / 14rem (`size-28` / `size-40` / `size-56` for `full`).' },
    { name: 'variant', type: "'full' | 'half'", default: "'full'", description: '`full` is a ring, `half` a semicircle opening downwards at half the height (`h-14` / `h-20` / `h-28`), with the centre text at the bottom of its hollow.' },
    { name: 'layout', type: "'auto' | 'inline' | 'stacked'", default: "'auto'", description: 'Legend placement: `auto` beside the ring and wrapping below it when narrow, `inline` always beside it (long labels truncate), `stacked` always under it at full width. Use `showLegend` to remove the legend.' },
    { name: 'thickness', type: 'number', default: '14', description: 'Ring thickness in viewBox units (100×100 box), clamped to 2–40.' },
    { name: 'showLegend', type: 'boolean', default: 'true', description: 'List swatch, label, formatted value and percentage (max one decimal) per segment.' },
    { name: 'centerText', type: 'string', description: 'Small caption under the total in the centre.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats the total, legend values and tooltips.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required (or pass `aria-label` / `aria-labelledby`); an auto-generated summary ("Donut chart: 3 segments, total 100") is only the fallback when strict mode is off.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when `data` is empty (and as the centre caption when the total is 0).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  slots: [{ name: 'center', description: 'Replaces the default centre content (total + caption).', props: '{ total: number }' }],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<DonutChart
  center-text="items"
  label="Sample data: three segments"
  :data="[
    { label: 'Segment A', value: 420 },
    { label: 'Segment B', value: 310 },
    { label: 'Segment C', value: 130 },
  ]"
/>`,
    },
    {
      title: 'Custom centre and tones',
      description: 'Use the `center` slot for a headline figure; pick semantic tones for status data. Sample data.',
      code: `<DonutChart
  size="lg"
  label="Sample data: test results"
  :thickness="18"
  :data="[
    { label: 'Passed', value: 86, tone: 'success' },
    { label: 'Flaky', value: 9, tone: 'warning' },
    { label: 'Failed', value: 5, tone: 'danger' },
  ]"
  :value-formatter="(n) => n + ' tests'"
>
  <template #center="{ total }">
    <span class="text-2xl font-semibold tabular-nums">{{ total }}</span>
    <Badge variant="success">Passed</Badge>
  </template>
</DonutChart>`,
    },
    {
      title: 'Variant: full and half',
      description: 'The half donut keeps the same data, legend and text alternatives in half the height. Sample data.',
      code: `<div class="flex flex-wrap items-end gap-8">
  <DonutChart variant="full" size="sm" label="Sample data: full ring" center-text="items" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 30 }, { label: 'Segment C', value: 10 }]" />
  <DonutChart variant="half" size="sm" label="Sample data: half ring" center-text="items" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 30 }, { label: 'Segment C', value: 10 }]" />
</div>`,
    },
    {
      title: 'Layout: legend placement',
      description: 'Gallery of the three layouts. `stacked` puts the legend under the ring, `inline` keeps it beside the ring and truncates long labels, and `showLegend="false"` removes it. Sample data.',
      code: `<div class="grid gap-8 md:grid-cols-3">
  <DonutChart layout="auto" size="sm" label="Sample data: legend wraps when narrow" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 40 }]" />
  <DonutChart layout="inline" size="sm" label="Sample data: legend always beside" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B with a long name', value: 40 }]" />
  <DonutChart layout="stacked" size="sm" label="Sample data: legend below" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 40 }]" />
</div>`,
    },
    {
      title: 'Thickness',
      description: 'Ring thickness in viewBox units (2 to 40). Sample data.',
      code: `<div class="flex flex-wrap items-center gap-8">
  <DonutChart :thickness="6" size="sm" :show-legend="false" label="Sample data: thin ring" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 40 }]" />
  <DonutChart :thickness="14" size="sm" :show-legend="false" label="Sample data: default ring" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 40 }]" />
  <DonutChart :thickness="28" size="sm" :show-legend="false" label="Sample data: thick ring" :data="[{ label: 'Segment A', value: 60 }, { label: 'Segment B', value: 40 }]" />
</div>`,
    },
    {
      title: 'Empty and zero total',
      code: `<div class="flex flex-wrap gap-8">
  <DonutChart label="Budget split" :data="[]" empty-text="No budget set" />
  <DonutChart size="sm" label="Budget with nothing spent" :data="[{ label: 'Spent', value: 0 }, { label: 'Left', value: 0 }]" />
</div>`,
    },
  ],
  a11y: [
    'The ring is `<svg role="img">` with an automatic `aria-label` (segment count and total); override with `label`.',
    'Each segment has a native `<title>` tooltip "Label: value (pct%)"; the HTML legend repeats every value and percentage as real text.',
    'The empty state is a `role="img"` element labelled with `emptyText`.',
    '`variant` and `layout` change only the drawing and where the legend sits: the image name, the tooltips and the legend text are the same. The half ring is still one labelled image and the total stays real text in its hollow.',
    'The ring has a fixed size (`size-28`, `size-40` or `size-56`) and the legend wraps beside or under it, so it fits a 320px screen. Values and percentages use `tabular-nums`; the legend text is the non-colour alternative to the segment colours.',
  ],
  related: ['BarChart', 'LineChart', 'StatBar', 'Heatmap'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `data` is not an array, or a segment lacks a non-empty string `label` or a finite number `value`. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Use for 2–6 parts of a whole; prefer BarChart beyond that.',
    'Pass `{ label, value }` objects; tones auto-cycle chart-1..5 or set `tone` per segment.',
    'Put the headline in the `center` slot only when the default total is not what you want to say.',
    'Use `variant="half"` for a single split or a progress-like total; keep full rings for three or more parts.',
    'Use `layout="stacked"` in narrow cards and `layout="inline"` only with short labels.',
    'Keep the legend on (default) so values are available as text, not only as arcs.',
  ],
  replaces: ['Chart.js doughnut charts', 'custom CSS donut components'],
}
export default doc
