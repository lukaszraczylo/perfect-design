import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const doc: ComponentDoc = {
  name: 'BarChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG bar chart: grouped or stacked, vertical or horizontal, rounded or square bars, optional value labels and grid styles, with axis, legend and per-bar tooltips.',
  description:
    'Use `BarChart` to compare values across categories. Pass `labels` (categories) and `series` (`{ name, data, tone? }`; `data[i]` belongs to `labels[i]`). The value domain always includes 0 and uses nice ticks; negative bars extend below (vertical) or left of (horizontal) the zero line. `variant="stacked"` (or the `stacked` boolean) stacks positives up and negatives down separately; `rounded`, `gap`, `size`, `showValues` and `grid` change the look without changing the data or the text alternatives. Non-finite values draw no bar and read "n/a" in the tooltip. Mismatched lengths are tolerated (category count = longest of labels and series; missing labels are empty). Crowded category labels are thinned and long ones truncated with the full text in a `<title>`; horizontal bars size their label gutter from an estimate of the rendered width of the widest label (per-glyph width classes, wide letters count more), so labels do not clip at the left edge. More than 5 series cycle through chart-1..5. For trends over time use `LineChart`; for parts of a whole use `DonutChart`. Size with `class` (`w-full`, `max-w-xl`); `width`/`height` only set the viewBox proportions.',
  status: 'stable',
  props: [
    { name: 'labels', type: 'string[]', required: true, description: 'Category labels, one per group of bars.' },
    { name: 'series', type: `{ name: string; data: number[]; tone?: ${TONE} }[]`, required: true, description: 'One entry per series. Unnamed series get "Series N".' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Bar direction. Horizontal charts list categories down the left.' },
    { name: 'variant', type: "'grouped' | 'stacked'", default: "'grouped'", description: 'Series side by side (`grouped`) or stacked per category (`stacked`). When omitted, the `stacked` boolean decides.' },
    { name: 'stacked', type: 'boolean', default: 'false', description: 'Stack series per category instead of grouping them side by side. Same as `variant="stacked"`; `variant` wins when both are set.' },
    { name: 'rounded', type: "'auto' | 'none' | 'sm' | 'md' | 'full'", default: "'auto'", description: 'Bar corner radius: `none` 0, `sm` 2px, `md` 4px, `full` a pill (half the shorter side). `auto` keeps the original look: 2px for grouped bars, square for stacked segments.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between categories: bars fill 85% (`sm`), 70% (`md`) or 50% (`lg`) of each category band.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chart height when `height` is not set: 160 / 240 / 320 viewBox units.' },
    { name: 'showValues', type: 'boolean', default: 'false', description: 'Print the value at the end of each bar (the category total when stacked), using the axis formatter. Labels that do not fit their bar are left out; the tooltip and the hidden data table still carry every value.' },
    { name: 'grid', type: "'none' | 'value' | 'dashed' | 'full'", description: 'Gridline style: `value` lines at each tick, `dashed` dashed value lines, `full` value lines plus a separator between categories, `none` no lines. When omitted, `showGrid` decides (`value` when on).' },
    { name: 'showGrid', type: 'boolean', default: 'true', description: 'Gridlines at each tick.' },
    { name: 'showAxis', type: 'boolean', default: 'true', description: 'Value ticks, category labels and the zero baseline.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of series swatches. `auto` shows it when there is more than one series.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats axis ticks and tooltips (default: compact on the axis, grouped numbers in tooltips).' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required (or pass `aria-label` / `aria-labelledby`); an auto-generated summary ("Bar chart: 3 categories, 2 series, values from 1 to 9") is only the fallback when strict mode is off.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there is nothing to plot.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px), so axis text keeps its real size at 320px.' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size` (default height 240).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<BarChart class="max-w-md" label="Sample data: bar chart" :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri']" :series="[{ name: 'Orders', data: [12, 19, 8, 24, 16] }]" />`,
    },
    {
      title: 'Stacked, multi-series',
      description: 'Legend appears automatically; negative values stack below the zero line. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <BarChart
    stacked
    label="Sample data: stacked bars"
    :labels="['Q1', 'Q2', 'Q3', 'Q4']"
    :series="[
      { name: 'Series A', data: [40, 52, 48, 61] },
      { name: 'Series B', data: [20, 25, 31, 28], tone: 'chart-2' },
      { name: 'Series C', data: [-5, -8, -4, -10], tone: 'danger' },
    ]"
    :value-formatter="(n) => n + ' units'"
  />
  <BarChart
    orientation="horizontal"
    label="Sample data: horizontal bars"
    :labels="['Category A', 'Category B', 'Category C', 'A category with a very long name']"
    :series="[{ name: 'Share', data: [62, 20, 8, 3] }]"
    :value-formatter="(n) => n + '%'"
  />
</div>`,
    },
    {
      title: 'Variant: grouped and stacked',
      description: 'The same sample data both ways. `variant` is the typed form of the `stacked` boolean.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <BarChart variant="grouped" size="sm" label="Sample data: grouped bars" :labels="['Q1', 'Q2', 'Q3']" :series="[{ name: 'Series A', data: [40, 52, 48] }, { name: 'Series B', data: [20, 25, 31], tone: 'chart-2' }]" />
  <BarChart variant="stacked" size="sm" label="Sample data: stacked bars" :labels="['Q1', 'Q2', 'Q3']" :series="[{ name: 'Series A', data: [40, 52, 48] }, { name: 'Series B', data: [20, 25, 31], tone: 'chart-2' }]" />
</div>`,
    },
    {
      title: 'Rounded: none, sm, md, full',
      description: 'Gallery of the four radii on the same sample data. Stacked segments round every corner, so keep them `none` unless the bars are separated by a larger `gap`.',
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <BarChart rounded="none" size="sm" label="Sample data: square bars" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [12, 19, 8, 15] }]" />
  <BarChart rounded="sm" size="sm" label="Sample data: slightly rounded bars" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [12, 19, 8, 15] }]" />
  <BarChart rounded="md" size="sm" label="Sample data: rounded bars" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [12, 19, 8, 15] }]" />
  <BarChart rounded="full" gap="lg" size="sm" label="Sample data: pill bars" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [12, 19, 8, 15] }]" />
</div>`,
    },
    {
      title: 'Value labels',
      description: 'Vertical, horizontal and stacked (category totals). Negative values get their label below or left of the bar. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <BarChart show-values size="sm" label="Sample data: labelled bars" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [12, -6, 19, 8] }]" />
  <BarChart show-values orientation="horizontal" size="sm" label="Sample data: labelled horizontal bars" :labels="['A', 'B', 'C']" :series="[{ name: 'Series', data: [32, 18, 9] }]" />
  <BarChart show-values variant="stacked" size="sm" label="Sample data: stacked totals" :labels="['Q1', 'Q2', 'Q3']" :series="[{ name: 'Series A', data: [40, 52, 48] }, { name: 'Series B', data: [20, 25, 31], tone: 'chart-2' }]" />
</div>`,
    },
    {
      title: 'Grid: none, value, dashed, full',
      description: 'Gallery of the four grid styles. `full` adds a separator between categories.',
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <BarChart grid="none" size="sm" label="Sample data: no grid" :labels="['A', 'B', 'C']" :series="[{ name: 'Series', data: [4, 9, 6] }]" />
  <BarChart grid="value" size="sm" label="Sample data: value grid" :labels="['A', 'B', 'C']" :series="[{ name: 'Series', data: [4, 9, 6] }]" />
  <BarChart grid="dashed" size="sm" label="Sample data: dashed grid" :labels="['A', 'B', 'C']" :series="[{ name: 'Series', data: [4, 9, 6] }]" />
  <BarChart grid="full" size="sm" label="Sample data: full grid" :labels="['A', 'B', 'C']" :series="[{ name: 'Series', data: [4, 9, 6] }]" />
</div>`,
    },
    {
      title: 'Size and gap',
      description: 'Heights 160, 240 and 320, and the three bar spacings. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <BarChart size="sm" gap="sm" label="Sample data: small, tight" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [5, 8, 3, 7] }]" />
  <BarChart size="md" gap="md" label="Sample data: medium" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [5, 8, 3, 7] }]" />
  <BarChart size="lg" gap="lg" label="Sample data: large, airy" :labels="['A', 'B', 'C', 'D']" :series="[{ name: 'Series', data: [5, 8, 3, 7] }]" />
</div>`,
    },
    {
      title: 'Long and wide category labels',
      description: 'Horizontal bars size the label gutter from the estimated width of the widest label (wide letters such as W and M count more than i or l) plus a small safety margin, capped at 40% of the chart. A label that still does not fit is cut with an ellipsis and keeps its full text in a `<title>`. Sample data.',
      code: `<BarChart orientation="horizontal" show-values label="Sample data: long and wide labels" :labels="['Warehouse Maintenance', 'MMMMWWWW', 'Mmmm Wwww Mmmm Wwww Mmmm', 'Illinois', 'ok']" :series="[{ name: 'Series', data: [14, 9, 6, 11, 3] }]" />`,
    },
    {
      title: 'Empty and sparse data',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <BarChart label="Orders per day" :labels="[]" :series="[]" empty-text="No orders yet" />
  <BarChart label="Sample data: sparse bars" :labels="['a', 'b', 'c']" :series="[{ name: 'x', data: [3, Number.NaN, 5] }]" :show-grid="false" />
</div>`,
    },
  ],
  a11y: [
    'The chart is `<svg role="img">` with an automatic `aria-label` (category/series counts and value range); override with `label`.',
    'Every bar has a native `<title>` tooltip: "Category, Series: value" ("n/a" for missing values).',
    'A visually hidden data table (caption, category rows, one column per series) follows the chart, so every value is readable as text. It is cut at 200 rows.',
    'Axis text is 12px with tabular figures and the SVG is sized to its container, so labels stay legible at 320px; the horizontal label gutter grows with the widest label (up to 40% of the width, then labels are cut with an ellipsis), so wide letters such as W and M are not clipped. Series are distinguished by legend, position and the data table, not by colour alone.',
    'The empty state is a `role="img"` element labelled with `emptyText`.',
    'Colour is never the only carrier: the HTML legend names every series and tooltips give exact values.',
    'Variants change only the drawing: `variant`, `rounded`, `gap`, `size` and `grid` leave the image name, the tooltips and the hidden data table identical. `showValues` adds the values as text inside the image; gridlines are decoration inside the labelled image.',
  ],
  related: ['LineChart', 'DonutChart', 'Sparkline', 'Heatmap'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `labels` is not an array, `series` is not an array, or a series has no `data` array. Empty arrays are valid and show `emptyText`.',
  ],
  llmNotes: [
    'Use `labels` for categories and `series[].data` for values (same index); never pass objects per bar.',
    'Use `stacked` only when series are parts of a total; otherwise group them.',
    'Provide a `valueFormatter` for currency, percentages and units.',
    'Only chart-N / semantic tones are available; do not pass colours. Set a `label` describing the insight.',
    'Size with `class`, not `width`/`height` (viewBox units); pick the height with `size` (sm, md, lg).',
    'Prefer `variant="stacked"` over the `stacked` boolean in new code. Use `showValues` for few bars; labels that do not fit are dropped, so never rely on them as the only source of values.',
    '`rounded="full"` suits grouped bars; keep stacked segments `none` unless `gap="lg"` separates them.',
  ],
  replaces: ['Chart.js bar charts', 'recharts/vue-chartjs bar usage in dashboards'],
}
export default doc
