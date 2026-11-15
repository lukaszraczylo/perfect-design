import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"
const AXES = "['Speed', 'Range', 'Cost', 'Comfort', 'Safety']"

const doc: ComponentDoc = {
  name: 'RadarChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG radar (spider) chart with three or more axes, several series, line, area or dots variants, polygon or circular rings, 3 to 6 levels and a configurable scale.',
  description:
    'Use `RadarChart` to compare a few profiles over the same 3 to about 10 measures (a skills matrix, a product comparison). Pass `axes` (names, clockwise from the top) and `series` (`{ name, data, tone? }`, one value per axis). `variant` draws each series as an outline (`line`), an outline with a soft fill (`area`) or only markers (`dots`); every series has its own dash pattern and marker shape, so series differ by more than colour. `shape` sets the rings: straight segments (`polygon`) or circles; `levels` sets how many rings, 3 to 6. The scale starts at 0 (or the lowest value when negative) and ends at a round number that covers the data; set `min` and `max` to compare charts on the same scale. The radius is chosen so every axis label stays inside the chart, also at 320px; long names are shortened (the full name is in a tooltip). Missing or non-finite values sit at the centre and read "n/a" in the table. At most 40 axes are drawn. Use `BarChart` when there are fewer than 3 measures or when exact comparison matters: areas and angles are hard to read precisely.',
  status: 'stable',
  props: [
    { name: 'axes', type: 'string[]', required: true, description: 'Axis names, at least 3, clockwise from the top. An empty array shows `emptyText`; 1 or 2 names are an error (and show `emptyText` outside strict mode).' },
    { name: 'series', type: `{ name: string; data: number[]; tone?: ${TONE} }[]`, required: true, description: 'One shape per entry; `data` has one value per axis in the order of `axes`. More than 5 series cycle through chart-1..5, dash patterns and marker shapes.' },
    { name: 'variant', type: "'line' | 'area' | 'dots'", default: "'line'", description: '`line` outlines each series, `area` adds a soft fill under the outline, `dots` draws only the markers (a larger marker per axis).' },
    { name: 'shape', type: "'polygon' | 'circle'", default: "'polygon'", description: 'Shape of the rings: straight segments between the axes, or circles. The series outline is always a polygon.' },
    { name: 'levels', type: '3 | 4 | 5 | 6', default: '4', description: 'Number of rings. Other numbers are rounded and clamped to 3..6.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chart height 220 / 300 / 380 viewBox units (the radar is as large as the width and the axis labels allow) and the spacing of the figure.' },
    { name: 'min', type: 'number', description: 'Value at the centre. Defaults to 0, or the lowest value when that is negative. A `min` above `max` is swapped.' },
    { name: 'max', type: 'number', description: 'Value at the outer ring. Defaults to a round number (1, 2, 2.5, 5 times a power of ten per ring) that covers the data. Values above it sit on the rim.' },
    { name: 'showValues', type: 'boolean', default: 'false', description: 'Print the value of each point outside it. Values that would overlap or leave the chart are left out; none are drawn beyond 48 points.' },
    { name: 'showScale', type: 'boolean', default: 'true', description: 'Print the value of each ring along the first axis (thinned when the rings are close together).' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend with the dash pattern and marker of each series; `auto` shows it for more than one series.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats ring labels, values and tooltips. Defaults to compact (rings) / grouped (tooltip) numbers.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required unless `title`, `aria-label` or `aria-labelledby` names it.' },
    { name: 'title', type: 'string', description: 'Visible heading above the chart. It also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible description under the title. The image points to it with `aria-describedby`, next to the generated summary.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there is nothing to plot.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show a busy placeholder (`role="status"`, `aria-busy`) with `loadingText` instead of the chart.' },
    { name: 'loadingText', type: 'string', default: "'Loading chart'", description: 'Message of the loading placeholder.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size` (default height 300).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element (`<figure>`).' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data: one profile over five measures.',
      code: `<RadarChart class="max-w-md" label="Sample data: product profile" :axes="${AXES}" :series="[{ name: 'Model A', data: [7, 5, 8, 6, 9] }]" />`,
    },
    {
      title: 'Two series',
      description: 'Each series has its own dash pattern and marker shape; the legend repeats them. Sample data.',
      code: `<RadarChart
  class="max-w-md"
  label="Sample data: two models compared"
  :axes="${AXES}"
  :series="[
    { name: 'Model A', data: [7, 5, 8, 6, 9] },
    { name: 'Model B', data: [4, 8, 5, 9, 6], tone: 'chart-2' },
  ]"
/>`,
    },
    {
      title: 'Variant: line, area, dots',
      description: 'Outline, outline with fill, markers only. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <RadarChart v-for="v in ['line', 'area', 'dots']" :key="v" :variant="v" size="sm" :label="'Sample data: ' + v" :axes="${AXES}" :series="[{ name: 'Model A', data: [7, 5, 8, 6, 9] }, { name: 'Model B', data: [4, 8, 5, 9, 6] }]" />
</div>`,
    },
    {
      title: 'Shape: polygon and circle',
      description: 'The rings follow the axes, or are drawn as circles. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <RadarChart shape="polygon" size="sm" label="Sample data: polygon rings" :axes="${AXES}" :series="[{ name: 'Model A', data: [7, 5, 8, 6, 9] }]" />
  <RadarChart shape="circle" size="sm" label="Sample data: circular rings" :axes="${AXES}" :series="[{ name: 'Model A', data: [7, 5, 8, 6, 9] }]" />
</div>`,
    },
    {
      title: 'Levels',
      description: 'Three to six rings; ring values are round numbers. Sample data.',
      code: `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <RadarChart v-for="n in [3, 4, 5, 6]" :key="n" :levels="n" size="sm" :label="'Sample data: ' + n + ' levels'" :axes="['A', 'B', 'C', 'D', 'E', 'F']" :series="[{ name: 'Series', data: [7, 5, 8, 6, 9, 4] }]" />
</div>`,
    },
    {
      title: 'Size',
      description: 'Heights 220, 300 and 380. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <RadarChart v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s" :label="'Sample data: size ' + s" :axes="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 5, 9, 6] }]" />
</div>`,
    },
    {
      title: 'Fixed scale and values',
      description: 'A shared `min` and `max` makes charts comparable; `showValues` prints each value and `valueFormatter` adds the unit. Sample data.',
      code: `<RadarChart
  show-values
  class="max-w-md"
  variant="area"
  :min="0"
  :max="100"
  :levels="5"
  label="Sample data: scores out of 100"
  :value-formatter="(n) => n + '%'"
  :axes="['Plan', 'Build', 'Test', 'Ship', 'Run']"
  :series="[{ name: 'Team', data: [72, 55, 88, 64, 91] }]"
/>`,
    },
    {
      title: 'Long axis names and negative values',
      description: 'Long names are shortened to fit (the full name is a tooltip); the scale starts below zero. Sample data.',
      code: `<RadarChart
  class="max-w-sm"
  label="Sample data: change against last year"
  :axes="['Customer satisfaction', 'Delivery reliability', 'Warehouse capacity', 'Supplier lead time', 'Packaging waste']"
  :series="[{ name: 'Change', data: [4, -3, 6, -5, 2], tone: 'chart-3' }]"
/>`,
    },
    {
      title: 'Empty, loading and missing values',
      description: 'Nothing to plot, a loading placeholder, and a series with a missing value (it sits at the centre and reads "n/a" in the table).',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <RadarChart label="Skills" :axes="[]" :series="[]" empty-text="No skills recorded" />
  <RadarChart label="Skills" :axes="['A', 'B', 'C']" :series="[]" loading />
  <RadarChart size="sm" label="Sample data: one missing value" :axes="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [5, Number.NaN, 7, 4] }]" />
</div>`,
    },
  ],
  a11y: [
    'The chart is one `<svg role="img">` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by the visible `description` and a generated text summary (axis and series counts, value range and scale).',
    'A visually hidden data table (axes as rows, one column per series) follows the chart, so every value is readable as text; missing values read "n/a".',
    'Series are told apart by dash pattern and marker shape (and by the legend), not by colour alone; `dots` uses marker shapes only. Each marker has a native `<title>` tooltip with the axis, series and value.',
    'The radius is computed so that every axis label stays inside the viewBox. The SVG is sized to its container (1 unit = 1 CSS px), so text keeps its size and nothing overflows at 320px. Long names are shortened and keep their full text in a tooltip.',
    'In forced-colors mode lines and markers use the system text colour; dash patterns and marker shapes carry the series, and the area fill is dropped. The loading placeholder is a polite `role="status"` region marked busy; it does not animate.',
  ],
  related: ['BarChart', 'LineChart', 'DonutChart', 'Gauge', 'ScatterChart'],
  requires: [
    'Throws a ContractError when there is no `label` (or `title`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `axes` is not an array or has 1 or 2 names, `series` is not an array, or a series has no `data` array. Empty arrays are valid and show `emptyText`.',
  ],
  llmNotes: [
    'Use at least 3 axes and keep it to about 10; give each series one value per axis, in the order of `axes`.',
    'Set `label` (or `title`) to say what is compared. Name the unit in `valueFormatter` and set `min` / `max` when several charts must share a scale.',
    'Limit the chart to 2 or 3 series; with `variant="area"` the fills overlap.',
    'Use `shape="circle"` for a softer look and `levels` for the number of rings; neither changes the data.',
    'Do not use a radar chart to read exact values; show `showValues` or use `BarChart`.',
    'Size with `class` and `size`, not `width` / `height`.',
  ],
  replaces: ['Chart.js radar charts', 'recharts RadarChart usage in dashboards'],
}
export default doc
