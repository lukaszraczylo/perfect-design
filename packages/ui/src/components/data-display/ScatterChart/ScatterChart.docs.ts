import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const SAMPLE = `[
  { x: 12, y: 31, label: 'Alder' }, { x: 18, y: 38, label: 'Birch' }, { x: 25, y: 44, label: 'Cedar' },
  { x: 31, y: 41, label: 'Dogwood' }, { x: 39, y: 58, label: 'Elm' }, { x: 47, y: 61, label: 'Fir' },
  { x: 55, y: 70, label: 'Gum' }, { x: 63, y: 66, label: 'Hazel' },
]`

const doc: ComponentDoc = {
  name: 'ScatterChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG scatter, bubble and connected-scatter chart with several series, marker shapes per series, nice numeric axes, grid styles, axis titles and an optional linear trend line.',
  description:
    'Use `ScatterChart` to show how two numbers relate across many items (price against rating, load against latency). Pass `points` as `{ x, y, size?, label?, series? }`; points with the same `series` name form one series. `variant` picks the mark: `scatter` plots markers, `bubble` scales the area of each marker with `size`, `connected` also joins the points of a series in the order given (a path over time). Series differ by marker shape as well as colour (`markerShape="series"`, the default), so the chart never relies on colour alone. Both axes are numeric with nice ticks, negative values draw a zero line, and the plot never leaves the container: the chart fills its container (1 unit = 1 CSS px) and thins tick labels instead of overflowing at 320px. `trend` adds the least squares line of each series (dotted) and states its equation in the text summary. Points with a non-finite x or y are skipped and counted in the summary. Every point is available to assistive technology through the hidden data table (cut at 200 rows); each marker also has a native tooltip. Use `LineChart` when x is an ordered category, `Heatmap` for dense two-dimensional counts and `Sparkline` for a tiny inline trend.',
  status: 'stable',
  props: [
    { name: 'points', type: '{ x: number; y: number; size?: number; label?: string; series?: string }[]', required: true, description: 'The data. `series` groups points (points without one form the series `Points`), `label` names a point in the tooltip, the table and `showValues`, `size` is the bubble area. Non-finite coordinates are skipped; an empty array shows `emptyText`.' },
    { name: 'variant', type: "'scatter' | 'bubble' | 'connected'", default: "'scatter'", description: '`scatter` markers of one size, `bubble` markers whose area follows `size` (points without a size get the smallest), `connected` also draws a line per series in data order.' },
    { name: 'markerShape', type: "'circle' | 'square' | 'diamond' | 'triangle' | 'series'", default: "'series'", description: 'Marker shape. `series` gives each series its own shape (circle, square, diamond, triangle), which the legend repeats; a single series is drawn with circles. A fixed shape applies to every series.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Plot height 200 / 280 / 360 viewBox units, marker radius 3.5 / 4.5 / 6 (bubbles 3 to 12, 4 to 18, 5 to 24) and the spacing of the figure.' },
    { name: 'grid', type: "'none' | 'horizontal' | 'vertical' | 'full' | 'dashed'", default: "'full'", description: '`horizontal` a line at each y tick, `vertical` at each x tick, `full` both, `dashed` both dashed, `none` no lines.' },
    { name: 'xTitle', type: 'string', description: 'Title of the x axis, printed under the plot (cut to the plot width, the full text is in a tooltip).' },
    { name: 'yTitle', type: 'string', description: 'Title of the y axis, printed rotated at the start edge (cut to the plot height).' },
    { name: 'trend', type: 'boolean', default: 'false', description: 'Draw the least squares line of each series as a dotted line across its x range, cut where it leaves the plot. A series needs two points with different x. The equation and R squared are in the text summary and the tooltip.' },
    { name: 'showValues', type: 'boolean', default: 'false', description: 'Print the label of each point (or `x, y`) next to it. Labels that would overlap, or fall outside the chart, are left out; none are drawn beyond 60 points.' },
    { name: 'showAxis', type: 'boolean', default: 'true', description: 'Tick labels and the two axis lines.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of series with their marker shape; `auto` shows it for more than one series. A trend adds a "Linear trend" entry.' },
    { name: 'tones', type: `Record<string, ${TONE}>`, description: 'Tone per series name, e.g. `{ Errors: "danger" }`. Series without an entry cycle through chart-1..5.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats y ticks, sizes and tooltips (and x when `xFormatter` is not set).' },
    { name: 'xFormatter', type: '(n: number) => string', description: 'Formats x ticks, x values in tooltips and in the data table.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required unless `title`, `aria-label` or `aria-labelledby` names it; an auto-generated summary is only the fallback when strict mode is off.' },
    { name: 'title', type: 'string', description: 'Visible heading above the plot. It also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible description under the title. The image points to it with `aria-describedby`, next to the generated summary.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there is no valid point.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show a busy placeholder (`role="status"`, `aria-busy`) with `loadingText` instead of the chart.' },
    { name: 'loadingText', type: 'string', default: "'Loading chart'", description: 'Message of the loading placeholder.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size` (default height 280).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element (`<figure>`).' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data: eight items with a label each.',
      code: `<ScatterChart class="max-w-xl" label="Sample data: score against hours" x-title="Hours" y-title="Score" :points="${SAMPLE.replace(/\n/g, ' ')}" />`,
    },
    {
      title: 'Variant: scatter, bubble, connected',
      description: 'The same sample points as plain markers, as bubbles sized by `size` and joined in data order. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <ScatterChart variant="scatter" size="sm" label="Sample data: scatter" :points="[{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 8 }, { x: 7, y: 6 }]" />
  <ScatterChart variant="bubble" size="sm" label="Sample data: bubble" :points="[{ x: 1, y: 3, size: 4 }, { x: 2, y: 5, size: 9 }, { x: 4, y: 4, size: 2 }, { x: 5, y: 8, size: 16 }, { x: 7, y: 6, size: 6 }]" />
  <ScatterChart variant="connected" size="sm" label="Sample data: connected" :points="[{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 8 }, { x: 7, y: 6 }]" />
</div>`,
    },
    {
      title: 'Several series with a shape each',
      description: 'With `markerShape="series"` (the default) each series gets its own marker, repeated in the legend, so the series stay apart without colour. Sample data.',
      code: `<ScatterChart
  class="max-w-xl"
  label="Sample data: three groups"
  x-title="Weight"
  y-title="Range"
  :points="[
    { x: 2, y: 11, series: 'Light' }, { x: 3, y: 13, series: 'Light' }, { x: 4, y: 12, series: 'Light' },
    { x: 6, y: 8, series: 'Medium' }, { x: 7, y: 9, series: 'Medium' }, { x: 8, y: 7, series: 'Medium' },
    { x: 10, y: 4, series: 'Heavy' }, { x: 11, y: 5, series: 'Heavy' }, { x: 12, y: 3, series: 'Heavy' },
  ]"
/>`,
    },
    {
      title: 'Marker shape',
      description: 'One fixed shape for every series. Sample data.',
      code: `<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <ScatterChart v-for="shape in ['circle', 'square', 'diamond', 'triangle']" :key="shape" :marker-shape="shape" size="sm" :label="'Sample data: ' + shape" :points="[{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 3 }, { x: 4, y: 6 }]" />
</div>`,
    },
    {
      title: 'Trend line',
      description: 'The dotted line is the least squares fit of each series; the equation is in the text summary read by assistive technology. Sample data.',
      code: `<ScatterChart
  trend
  class="max-w-xl"
  label="Sample data: two series with trend lines"
  x-title="Load"
  y-title="Latency"
  :points="[
    { x: 10, y: 22, series: 'Node A' }, { x: 20, y: 31, series: 'Node A' }, { x: 30, y: 38, series: 'Node A' }, { x: 40, y: 52, series: 'Node A' }, { x: 50, y: 58, series: 'Node A' },
    { x: 10, y: 35, series: 'Node B' }, { x: 20, y: 33, series: 'Node B' }, { x: 30, y: 30, series: 'Node B' }, { x: 40, y: 26, series: 'Node B' }, { x: 50, y: 22, series: 'Node B' },
  ]"
/>`,
    },
    {
      title: 'Grid styles',
      description: 'All five styles on the same sample points.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <ScatterChart v-for="g in ['none', 'horizontal', 'vertical', 'full', 'dashed']" :key="g" :grid="g" size="sm" :label="'Sample data: grid ' + g" :points="[{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 4, y: 4 }, { x: 5, y: 8 }, { x: 7, y: 6 }]" />
</div>`,
    },
    {
      title: 'Values, axis titles and a formatter',
      description: 'Labels that would overlap are left out. Sample data.',
      code: `<ScatterChart
  show-values
  class="max-w-xl"
  label="Sample data: revenue against cost"
  x-title="Cost"
  y-title="Revenue"
  :value-formatter="(n) => '$' + n"
  :points="${SAMPLE.replace(/\n/g, ' ')}"
/>`,
    },
    {
      title: 'Size',
      description: 'Plot heights 200, 280 and 360 with matching markers and bubble ranges. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <ScatterChart v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s" variant="bubble" :label="'Sample data: size ' + s" :points="[{ x: 1, y: 3, size: 4 }, { x: 2, y: 5, size: 9 }, { x: 4, y: 4, size: 2 }, { x: 5, y: 8, size: 16 }]" />
</div>`,
    },
    {
      title: 'Negative values and custom tones',
      description: 'A zero line is drawn on each axis that crosses zero. `tones` picks the tone of a series by name. Sample data.',
      code: `<ScatterChart
  class="max-w-xl"
  label="Sample data: change against baseline"
  x-title="Change in input"
  y-title="Change in output"
  :tones="{ Gains: 'success', Losses: 'danger' }"
  :points="[
    { x: 4, y: 6, series: 'Gains' }, { x: 8, y: 9, series: 'Gains' }, { x: 2, y: 3, series: 'Gains' },
    { x: -3, y: -5, series: 'Losses' }, { x: -7, y: -8, series: 'Losses' }, { x: -5, y: -2, series: 'Losses' },
  ]"
/>`,
    },
    {
      title: 'Empty, loading and bad values',
      description: 'No points, a loading placeholder, and a chart whose non-finite points are skipped (and counted in the summary).',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <ScatterChart label="Orders" :points="[]" empty-text="No orders yet" />
  <ScatterChart label="Orders" :points="[]" loading />
  <ScatterChart size="sm" label="Sample data: skipped points" :points="[{ x: 1, y: 2 }, { x: Number.NaN, y: 4 }, { x: 3, y: Number.POSITIVE_INFINITY }, { x: 4, y: 5 }]" />
</div>`,
    },
  ],
  a11y: [
    'The plot is one `<svg role="img">` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by the visible `description` and a generated text summary (point and series counts, x and y ranges, trend equations, skipped points).',
    'A visually hidden data table follows the chart with one row per point (label, x, y and size), so every value is readable as text; it is cut at 200 rows and says so in its caption.',
    'Series are told apart by marker shape (and by dash pattern when connected), not by colour alone; the HTML legend repeats the shapes. A trend line is dotted and listed in the legend.',
    'Each marker has a native `<title>` tooltip with the series, label, x, y and size. Individual points are not tab stops: the data table is the keyboard and screen reader alternative.',
    'Axis text is 12px with tabular figures and the SVG is sized to its container (1 unit = 1 CSS px), so labels keep their size and thin out instead of overflowing at 320px. Tick labels are kept inside the viewBox.',
    'In forced-colors mode markers, lines and trend lines use the system text colour; shapes and dash patterns carry the series. The loading placeholder is a polite `role="status"` region marked busy; it does not animate.',
  ],
  related: ['LineChart', 'BarChart', 'Heatmap', 'Sparkline', 'RadarChart'],
  requires: [
    'Throws a ContractError when there is no `label` (or `title`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `points` is not an array or an entry has a non-numeric `x` or `y`. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `points` as flat `{ x, y }` objects and group them with `series`, never as nested arrays per series.',
    'Always set `label` (or `title`) to say what the chart shows, and `xTitle` / `yTitle` with the units.',
    'Use `variant="bubble"` only when a third number matters and give every point a `size`; use `connected` only for points that have an order.',
    'Leave `markerShape` on `series` when there is more than one series, so series do not differ by colour alone.',
    'Use `trend` for a straight-line relation; it needs at least two different x values per series.',
    'Provide `valueFormatter` and `xFormatter` for units and currency. Size with `class` and `size`, not `width` / `height`.',
  ],
  replaces: ['Chart.js scatter and bubble charts', 'recharts ScatterChart usage in dashboards'],
}
export default doc
