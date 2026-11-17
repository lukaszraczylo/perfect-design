import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"
const ITEMS = "[{ label: 'Opening', value: 120 }, { label: 'Sales', value: 80 }, { label: 'Refunds', value: -25 }, { label: 'Hosting', value: -40 }, { label: 'Services', value: 35 }, { label: 'Closing', type: 'total' }]"

const doc: ComponentDoc = {
  name: 'WaterfallChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG waterfall chart: a start value, increases and decreases, subtotals and a total, as bars, steps or lollipops, vertical or horizontal, with connectors and a pattern or marker for decreases.',
  description:
    'Use `WaterfallChart` to show how a value gets from one total to another through a series of changes (a budget, a revenue bridge, a stock movement). Pass `items` as `{ label, value?, type? }`: the first item is the `start` by default, the others are `delta`s, and `subtotal` / `total` items show the running total at that point (their `value` is not used). `variant` picks the drawing: `bars` floats a bar between the old and the new level, `steps` draws a staircase of the running total, `lollipop` a stem with a head at the new level. Increases and decreases never differ by colour alone: decreases are hatched (`bars`), dashed (`steps`) or hollow (`lollipop`), values carry a sign (`+30`, `−12` with a real minus sign) and the data table names each bar. `connectors` draws a thin line from the end of one bar to the start of the next at the running total. A running total below zero is drawn below the baseline. Items without a finite value read "n/a" and change nothing. Use `BarChart` for independent categories and `LineChart` for a trend over time.',
  status: 'stable',
  props: [
    { name: 'items', type: "{ label: string; value?: number | null; type?: 'start' | 'delta' | 'subtotal' | 'total' }[]", required: true, description: 'Bars in order. `start` sets the running total (default for the first item), `delta` changes it (default for the others), `subtotal` and `total` show it (their `value` is ignored). A start or delta without a finite value reads "n/a". An empty array shows `emptyText`.' },
    { name: 'variant', type: "'bars' | 'steps' | 'lollipop'", default: "'bars'", description: '`bars` floating bars (decreases hatched), `steps` a staircase of treads and risers (decreases dashed), `lollipop` stems with a head at the new level (increase filled, decrease hollow, total square).' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: '`vertical` puts the bars side by side along the x axis; `horizontal` stacks them as rows with the labels at the start.' },
    { name: 'connectors', type: 'boolean', default: 'true', description: 'Thin dotted lines from the end of each bar to the start of the next, at the running total.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chart height 160 / 240 / 320 when vertical, height of a row 24 / 32 / 40 when horizontal (at most 960 in total).' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between neighbouring bars: `sm` is wide bars, `lg` is narrow bars.' },
    { name: 'showValues', type: 'boolean', default: 'false', description: 'Print the change (`+80`, `−25`) or the total at the end of each bar. Labels that do not fit are left out; they are also in the table.' },
    { name: 'showGrid', type: 'boolean', default: 'true', description: 'Gridlines at each tick of the value axis.' },
    { name: 'showAxis', type: 'boolean', default: 'true', description: 'Tick labels, category labels and the zero line.' },
    { name: 'integerTicks', type: "boolean | 'auto'", default: "'auto'", description: 'Value axis ticks on whole numbers only. `auto` does this when every value is an integer (counts, so no 0.5 tick); `true` forces it; `false` always allows fractional ticks.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of increase, decrease and total with the marking of the variant; `auto` shows it when more than one kind of bar is present.' },
    { name: 'positiveTone', type: TONE, default: "'success'", description: 'Tone of increases.' },
    { name: 'negativeTone', type: TONE, default: "'danger'", description: 'Tone of decreases.' },
    { name: 'totalTone', type: TONE, default: "'primary'", description: 'Tone of the start, subtotal and total bars.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats axis ticks, values and tooltips. Defaults to compact (axis) / grouped (tooltip) numbers.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required unless `title`, `aria-label` or `aria-labelledby` names it.' },
    { name: 'title', type: 'string', description: 'Visible heading above the chart. It also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible description under the title. The image points to it with `aria-describedby`, next to the generated summary.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there are no items.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show a busy placeholder (`role="status"`, `aria-busy`) with `loadingText` instead of the chart.' },
    { name: 'loadingText', type: 'string', default: "'Loading chart'", description: 'Message of the loading placeholder.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element (`<figure>`).' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data: an opening balance, four changes and the closing total.',
      code: `<WaterfallChart class="max-w-xl" label="Sample data: balance bridge" :items="${ITEMS}" />`,
    },
    {
      title: 'Variant: bars, steps, lollipop',
      description: 'The same items three ways. Decreases are hatched, dashed or hollow. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <WaterfallChart v-for="v in ['bars', 'steps', 'lollipop']" :key="v" :variant="v" size="sm" :label="'Sample data: ' + v" :items="${ITEMS}" />
</div>`,
    },
    {
      title: 'Orientation: vertical and horizontal',
      description: 'Bars side by side, or as rows with the labels at the start. Sample data.',
      code: `<div class="grid gap-6 lg:grid-cols-2">
  <WaterfallChart orientation="vertical" label="Sample data: vertical" :items="${ITEMS}" />
  <WaterfallChart orientation="horizontal" label="Sample data: horizontal" :items="${ITEMS}" />
</div>`,
    },
    {
      title: 'Connectors on and off',
      description: 'Connectors follow the running total from bar to bar. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <WaterfallChart :connectors="true" size="sm" label="Sample data: with connectors" :items="${ITEMS}" />
  <WaterfallChart :connectors="false" size="sm" label="Sample data: without connectors" :items="${ITEMS}" />
</div>`,
    },
    {
      title: 'Values with signs',
      description: 'Changes carry a sign, totals do not. Sample data.',
      code: `<WaterfallChart
  show-values
  class="max-w-xl"
  label="Sample data: bridge with values"
  :value-formatter="(n) => '$' + n"
  :items="${ITEMS}"
/>`,
    },
    {
      title: 'Subtotals',
      description: 'A `subtotal` shows the running total in the middle of the bridge and a `total` closes it. Sample data.',
      code: `<WaterfallChart
  show-values
  class="max-w-xl"
  label="Sample data: quarters with subtotals"
  :items="[
    { label: 'Start', value: 200 },
    { label: 'Q1 gain', value: 60 },
    { label: 'Q1 loss', value: -30 },
    { label: 'Half year', type: 'subtotal' },
    { label: 'Q3 gain', value: 45 },
    { label: 'Q4 loss', value: -80 },
    { label: 'Year', type: 'total' },
  ]"
/>`,
    },
    {
      title: 'Size and gap',
      description: 'Heights 160, 240 and 320 with wide, normal and narrow bars. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <WaterfallChart size="sm" gap="sm" label="Sample data: small, wide bars" :items="${ITEMS}" />
  <WaterfallChart size="md" gap="md" label="Sample data: medium" :items="${ITEMS}" />
  <WaterfallChart size="lg" gap="lg" label="Sample data: large, narrow bars" :items="${ITEMS}" />
</div>`,
    },
    {
      title: 'Negative running total and tones',
      description: 'The total falls below zero and the bars continue under the baseline. Tones are set per kind. Sample data.',
      code: `<WaterfallChart
  show-values
  class="max-w-xl"
  positive-tone="info"
  negative-tone="warning"
  total-tone="chart-5"
  label="Sample data: balance that goes negative"
  :items="[{ label: 'Opening', value: 40 }, { label: 'Fees', value: -70 }, { label: 'Credit', value: 25 }, { label: 'Charges', value: -30 }, { label: 'Closing', type: 'total' }]"
/>`,
    },
    {
      title: 'Empty, loading and missing values',
      description: 'No items, a loading placeholder, and an item without a value (it reads "n/a" and changes nothing).',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <WaterfallChart label="Budget" :items="[]" empty-text="No budget lines yet" />
  <WaterfallChart label="Budget" :items="[]" loading />
  <WaterfallChart size="sm" label="Sample data: missing value" :items="[{ label: 'Start', value: 50 }, { label: 'Unknown', value: Number.NaN }, { label: 'Gain', value: 20 }, { label: 'End', type: 'total' }]" />
</div>`,
    },
  ],
  a11y: [
    'The chart is one `<svg role="img">` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by the visible `description` and a generated text summary (bar count, start and end level, number of increases and decreases).',
    'A visually hidden data table lists every bar as a row named with its kind ("Refunds (decrease)") with the signed change and the running total, so no number depends on the picture.',
    'Increase and decrease are never told apart by colour alone: decreases are hatched (bars), dashed (steps) or hollow (lollipop), values carry a plus or minus sign, and the legend repeats the markings. Each mark has a native `<title>` tooltip.',
    'The SVG is sized to its container (1 unit = 1 CSS px): category labels are shortened (full text in a tooltip) and thinned when crowded, value labels that do not fit are left out, so nothing overflows at 320px.',
    'In forced-colors mode marks and the hatch use the system text colour; the hatch, dashes and shapes carry the meaning. The loading placeholder is a polite `role="status"` region marked busy; it does not animate.',
  ],
  related: ['BarChart', 'LineChart', 'DonutChart', 'FunnelChart', 'StatBar'],
  requires: [
    'Throws a ContractError when there is no `label` (or `title`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `items` is not an array, an item has no `label`, an unknown `type`, or a `start` / `delta` has no numeric `value`. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `items` in order: the opening value first, then the changes (negative numbers for decreases), then `{ label, type: "total" }`; do not compute running totals yourself.',
    'Use `type: "subtotal"` for an intermediate sum and `type: "total"` for the closing bar; their `value` is ignored.',
    'Set `label` (or `title`) to say what the bridge shows and use `valueFormatter` for currency or units; `showValues` prints signed changes.',
    'Use `variant="steps"` or `"lollipop"` for many items, `orientation="horizontal"` for long labels.',
    'Keep the default tones (increase `success`, decrease `danger`, total `primary`) unless the data has a different meaning; the hatch, dash and hollow head carry the sign regardless of tone.',
    'Size with `class`, `size` and `gap`, not `width` / `height`.',
  ],
  replaces: ['Chart.js and ECharts waterfall charts', 'spreadsheet bridge charts rebuilt by hand'],
}
export default doc
