import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const doc: ComponentDoc = {
  name: 'LineChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG line chart with multiple series, nice y ticks, linear, smooth or step curves, optional area fill and markers, grid styles, gaps for missing values and tooltips on dots.',
  description:
    'Use `LineChart` for trends over an ordered axis (time, steps). Pass `labels` (x categories) and `series` (`{ name, data, tone? }`). The y domain is the nice-tick extent of the data. NaN / Infinity values break the line into separate segments; a point with no neighbours is drawn as a dot even when `showDots` is false. `curve` joins points with straight segments, a smooth curve that never overshoots the data, or steps that hold each value until the next point. Dots are on automatically up to 60 points (`showDots="auto"`); each dot has a native `<title>` tooltip. Crowded x labels are thinned. Renders 10,000 points quickly (dots stay off by default). Use `Sparkline` for tiny inline trends and `BarChart` for category comparison. Size with `class`; `width`/`height` set the viewBox proportions.',
  status: 'stable',
  props: [
    { name: 'labels', type: 'string[]', required: true, description: 'X-axis labels, one per point.' },
    { name: 'series', type: `{ name: string; data: number[]; tone?: ${TONE} }[]`, required: true, description: 'One line per entry. More than 5 series cycle through chart-1..5.' },
    { name: 'variant', type: "'line' | 'area'", default: "'line'", description: 'Lines only, or lines with a soft fill under each. When omitted, the `area` boolean decides.' },
    { name: 'area', type: 'boolean', default: 'false', description: 'Soft fill under each line. Same as `variant="area"`; `variant` wins when both are set.' },
    { name: 'curve', type: "'linear' | 'smooth' | 'step'", default: "'linear'", description: 'How points are joined. `smooth` is a monotone curve (it never dips below the lowest or above the highest neighbour); `step` holds each value until the next point. Gaps still break the line. The area follows the curve.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chart height when `height` is not set: 160 / 240 / 320 viewBox units.' },
    { name: 'showDots', type: "boolean | 'auto'", default: "'auto'", description: '`auto` draws dots when there are at most 60 points.' },
    { name: 'markerShape', type: "'circle' | 'square' | 'diamond' | 'triangle' | 'series'", default: "'circle'", description: 'Shape of the point markers. `series` gives each series its own shape (circle, square, diamond, triangle), which the legend repeats, so series differ by shape and dash pattern as well as colour. Markers still follow `showDots`.' },
    { name: 'grid', type: "'none' | 'horizontal' | 'dashed' | 'full'", description: 'Gridline style: `horizontal` solid lines at each y tick, `dashed` dashed ones, `full` horizontal lines plus a vertical line at each labelled x position, `none` no lines. When omitted, `showGrid` decides (`horizontal` when on).' },
    { name: 'showGrid', type: 'boolean', default: 'true', description: 'Horizontal gridlines at each y tick.' },
    { name: 'showAxis', type: 'boolean', default: 'true', description: 'Y tick labels and x labels.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of series swatches; `auto` shows it for more than one series.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats y ticks and tooltips.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required (or pass `aria-label` / `aria-labelledby`); an auto-generated summary ("Line chart: 12 points per series, 2 series, values from 1 to 9") is only the fallback when strict mode is off.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there is nothing to plot.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px), so axis text keeps its real size at 320px.' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size` (default height 240).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<LineChart class="max-w-md" label="Sample data: line chart" :labels="['Jan', 'Feb', 'Mar', 'Apr', 'May']" :series="[{ name: 'Series A', data: [120, 180, 150, 240, 310] }]" />`,
    },
    {
      title: 'Multi-series with area and gaps',
      description: 'A missing value (NaN) breaks the line; the legend is added automatically and each series gets its own dash pattern. Sample data.',
      code: `<LineChart
  area
  label="Sample data: two series"
  :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']"
  :series="[
    { name: 'Requests', data: [320, 410, 380, 520, 470, 300, 280] },
    { name: 'Errors', data: [12, 18, Number.NaN, 30, 22, 9, 7], tone: 'danger' },
  ]"
  :value-formatter="(n) => n.toLocaleString()"
/>`,
    },
    {
      title: 'Curve: linear, smooth, step',
      description: 'Same sample data joined three ways. Use `step` for values that hold until the next reading (a setting, a price), `smooth` for a continuous measurement.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <LineChart curve="linear" size="sm" label="Sample data: straight segments" :labels="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 4, 9, 5] }]" />
  <LineChart curve="smooth" size="sm" label="Sample data: smooth curve" :labels="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 4, 9, 5] }]" />
  <LineChart curve="step" size="sm" label="Sample data: steps" :labels="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 4, 9, 5] }]" />
</div>`,
    },
    {
      title: 'Variant: line and area',
      description: 'Area fill follows the chosen curve. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <LineChart variant="line" size="sm" label="Sample data: line" :labels="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 4, 9, 5] }]" />
  <LineChart variant="area" curve="smooth" size="sm" label="Sample data: smooth area" :labels="['A', 'B', 'C', 'D', 'E']" :series="[{ name: 'Series', data: [3, 8, 4, 9, 5] }]" />
</div>`,
    },
    {
      title: 'Marker shape',
      description: 'One shape for all series, or `series` so each line has its own shape. The legend repeats the shapes. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <LineChart marker-shape="diamond" size="sm" label="Sample data: diamond markers" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart marker-shape="series" size="sm" label="Sample data: a shape per series" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series A', data: [3, 8, 4, 9] }, { name: 'Series B', data: [6, 5, 7, 2] }, { name: 'Series C', data: [1, 3, 2, 4] }]" />
</div>`,
    },
    {
      title: 'Grid: none, horizontal, dashed, full',
      description: 'Gallery of the grid styles. `full` adds a vertical line at each labelled x position.',
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <LineChart grid="none" size="sm" label="Sample data: no grid" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart grid="horizontal" size="sm" label="Sample data: horizontal grid" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart grid="dashed" size="sm" label="Sample data: dashed grid" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart grid="full" size="sm" label="Sample data: full grid" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
</div>`,
    },
    {
      title: 'Size',
      description: 'Heights 160, 240 and 320. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <LineChart size="sm" label="Sample data: small" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart size="md" label="Sample data: medium" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
  <LineChart size="lg" label="Sample data: large" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [3, 8, 4, 9] }]" />
</div>`,
    },
    {
      title: 'Empty state',
      code: `<LineChart label="Collected metrics" :labels="[]" :series="[]" empty-text="No metrics collected" class="max-w-md" />`,
    },
  ],
  a11y: [
    'The chart is `<svg role="img">` with an automatic `aria-label` (points, series, value range); override with `label`.',
    'Dots carry native `<title>` tooltips: "Label, Series: value". Isolated points are always drawn so no data is invisible.',
    'A visually hidden data table (caption, one row per point, one column per series) follows the chart, so every value is readable as text. It is cut at 200 rows.',
    'Series differ by dash pattern as well as colour (solid, dashed, dotted, dash-dot); the legend draws the same line sample. Axis text is 12px with tabular figures and the SVG is sized to its container, so labels stay legible at 320px.',
    'The empty state is a `role="img"` element labelled with `emptyText`.',
    'The HTML legend names every series so colour is not the only identifier.',
    'Variants change only the drawing: `curve`, `variant`, `grid` and `size` leave the image name, the tooltips and the hidden data table identical. `markerShape="series"` adds a third cue (shape) next to colour and dash pattern, and the legend repeats it.',
  ],
  related: ['Sparkline', 'BarChart', 'DonutChart', 'Heatmap'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `labels` is not an array, `series` is not an array, or a series has no `data` array. Empty arrays are valid and show `emptyText`.',
  ],
  llmNotes: [
    'Use `labels` for the x axis and `series[].data` for y values (same index).',
    'Use NaN (or a non-finite number) for missing points: the line breaks instead of interpolating.',
    'Provide `valueFormatter` for units and a `label` that states the takeaway.',
    'Large series: leave `showDots` on `auto` (off above 60 points).',
    'Use Sparkline, not LineChart, for tiny inline trends.',
    'Use `curve="step"` for values that hold between readings and `curve="smooth"` only for continuous measurements; never smooth counts that jump.',
    'Prefer `variant="area"` over the `area` boolean in new code. Use `markerShape="series"` when several series share a chart and must be told apart without colour.',
  ],
  replaces: ['Chart.js line charts', 'recharts/vue-chartjs line usage in dashboards'],
}
export default doc
