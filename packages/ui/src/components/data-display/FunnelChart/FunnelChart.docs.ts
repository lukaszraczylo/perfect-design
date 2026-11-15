import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"
const STAGES = "[{ label: 'Visited', value: 12400 }, { label: 'Signed up', value: 5200 }, { label: 'Activated', value: 2900 }, { label: 'Subscribed', value: 840 }]"

const doc: ComponentDoc = {
  name: 'FunnelChart',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free SVG funnel chart with funnel, pyramid, bars and steps variants, vertical or horizontal layout, conversion rates, labels inside or beside the shapes and non-monotone data.',
  description:
    'Use `FunnelChart` for a sequence of stages where each one is (usually) a subset of the one before: a sales pipeline, a sign-up flow, an order process. Pass `stages` as `{ label, value, tone? }`. `variant` picks the shape: `funnel` joins the stages into one tapering shape (the edge facing the next stage has the next value), `pyramid` is the same shape stacked the other way round (the first stage is the base), `steps` centres a rectangle per stage and `bars` aligns the rectangles to the start like a bar chart. `orientation` runs the stages top to bottom or start to end. `showConversion` prints the share of the previous stage next to each value (the first stage has none; a previous value of 0 or a missing value reads "n/a"). Text sits `beside` the shapes (a label column, or underneath when horizontal) or `inside` them; text that does not fit inside moves beside its stage. The data does not have to fall: a stage larger than the one before is drawn as it is (and its conversion is above 100%). Negative values draw no shape; missing values read "n/a". At most 50 stages are drawn; the hidden table lists up to 200. Use `BarChart` to compare unrelated categories and `Gauge` or `StatBar` for one value against a target.',
  status: 'stable',
  props: [
    { name: 'stages', type: `{ label: string; value: number; tone?: ${TONE} }[]`, required: true, description: 'Stages in order. `value` sizes the shape (negative or non-finite values draw nothing and non-finite ones read "n/a"); `tone` overrides the chart `tone` for one stage. An empty array shows `emptyText`.' },
    { name: 'variant', type: "'funnel' | 'pyramid' | 'bars' | 'steps'", default: "'funnel'", description: '`funnel` tapering shape, `pyramid` the same shape upside down (first stage at the base), `bars` rectangles aligned to the start (left, or bottom when horizontal), `steps` rectangles centred on the axis.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: '`vertical` stacks the stages top to bottom with a label column; `horizontal` runs them from start to end with text underneath each stage.' },
    { name: 'labelPlacement', type: "'inside' | 'beside'", default: "'beside'", description: '`beside` prints label, value and conversion next to the shapes; `inside` prints them on a small plate inside each shape when it fits (the label moves beside the stage when it does not; when horizontal only the value and conversion go inside).' },
    { name: 'showConversion', type: 'boolean', default: 'false', description: 'Show the percent of the previous stage next to each value. The first stage has none. A previous value of 0 or a missing value reads "n/a".' },
    { name: 'showValues', type: 'boolean', default: 'true', description: 'Show the value of each stage. With it off only the label (and the conversion, if on) is printed; the values stay in the table and tooltips.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of one stage when vertical (32 / 44 / 56), height of the shapes when horizontal (96 / 144 / 200), and the spacing of the figure.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between neighbouring stages: 2, 4 or 8 viewBox units.' },
    { name: 'tone', type: TONE, default: "'chart-1'", description: 'Tone of the stages that set none.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats values and tooltips. Defaults to compact (labels) / grouped (tooltip) numbers.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart image. Required unless `title`, `aria-label` or `aria-labelledby` names it.' },
    { name: 'title', type: 'string', description: 'Visible heading above the chart. It also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible description under the title. The image points to it with `aria-describedby`, next to the generated summary.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there are no stages.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show a busy placeholder (`role="status"`, `aria-busy`) with `loadingText` instead of the chart.' },
    { name: 'loadingText', type: 'string', default: "'Loading chart'", description: 'Message of the loading placeholder.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The chart then fills its container (1 unit = 1 CSS px).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides the height derived from `size` and the number of stages.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element (`<figure>`).' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data: four stages of a sign-up flow.',
      code: `<FunnelChart class="max-w-xl" label="Sample data: sign-up flow" :stages="${STAGES}" />`,
    },
    {
      title: 'Variant: funnel, pyramid, bars, steps',
      description: 'The same four stages in each shape. The pyramid puts the first stage at the base. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <FunnelChart v-for="v in ['funnel', 'pyramid', 'bars', 'steps']" :key="v" :variant="v" size="sm" :label="'Sample data: ' + v" :stages="${STAGES}" />
</div>`,
    },
    {
      title: 'Orientation: vertical and horizontal',
      description: 'Stages top to bottom with a label column, or from start to end with the text underneath. Sample data.',
      code: `<div class="grid gap-6 lg:grid-cols-2">
  <FunnelChart orientation="vertical" label="Sample data: vertical" :stages="${STAGES}" />
  <FunnelChart orientation="horizontal" label="Sample data: horizontal" :stages="${STAGES}" />
</div>`,
    },
    {
      title: 'Conversion between stages',
      description: 'The percent of the previous stage sits next to each value; a stage of 0 makes the next conversion "n/a". Sample data.',
      code: `<FunnelChart
  show-conversion
  class="max-w-xl"
  label="Sample data: pipeline with conversion"
  :stages="[{ label: 'Leads', value: 960 }, { label: 'Contacted', value: 610 }, { label: 'Qualified', value: 240 }, { label: 'Proposal', value: 0 }, { label: 'Won', value: 0 }]"
/>`,
    },
    {
      title: 'Labels inside or beside',
      description: 'Inside, the text sits on a plate in the shape and moves beside the stage when it does not fit. Sample data.',
      code: `<div class="grid gap-6 lg:grid-cols-2">
  <FunnelChart label-placement="beside" show-conversion label="Sample data: labels beside" :stages="${STAGES}" />
  <FunnelChart label-placement="inside" show-conversion label="Sample data: labels inside" :stages="${STAGES}" />
</div>`,
    },
    {
      title: 'Size and gap',
      description: 'Stage heights 32, 44 and 56 with spacing 2, 4 and 8. Sample data.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <FunnelChart size="sm" gap="sm" label="Sample data: small, tight" :stages="${STAGES}" />
  <FunnelChart size="md" gap="md" label="Sample data: medium" :stages="${STAGES}" />
  <FunnelChart size="lg" gap="lg" label="Sample data: large, airy" :stages="${STAGES}" />
</div>`,
    },
    {
      title: 'Data that is not monotone',
      description: 'A stage can be larger than the one before (here a repeat step); the shape follows the data and the conversion exceeds 100%. Sample data.',
      code: `<FunnelChart
  show-conversion
  class="max-w-xl"
  label="Sample data: stages that grow again"
  :stages="[{ label: 'Quoted', value: 500 }, { label: 'Reviewed', value: 320 }, { label: 'Revised', value: 410 }, { label: 'Accepted', value: 150 }]"
/>`,
    },
    {
      title: 'Tone per stage and a formatter',
      description: 'The stage that is lost is marked with the `danger` tone and its label says so. Sample data.',
      code: `<FunnelChart
  class="max-w-xl"
  tone="primary"
  label="Sample data: orders and returns"
  :value-formatter="(n) => n + ' orders'"
  :stages="[{ label: 'Placed', value: 800 }, { label: 'Shipped', value: 760 }, { label: 'Delivered', value: 740 }, { label: 'Returned', value: 60, tone: 'danger' }]"
/>`,
    },
    {
      title: 'Empty, loading and bad values',
      description: 'No stages, a loading placeholder, and stages with a missing and a negative value (they draw no shape and read "n/a" or their number).',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <FunnelChart label="Pipeline" :stages="[]" empty-text="No stages yet" />
  <FunnelChart label="Pipeline" :stages="[]" loading />
  <FunnelChart size="sm" variant="bars" label="Sample data: bad values" :stages="[{ label: 'First', value: 40 }, { label: 'Missing', value: Number.NaN }, { label: 'Negative', value: -5 }, { label: 'Last', value: 10 }]" />
</div>`,
    },
  ],
  a11y: [
    'The chart is one `<svg role="img">` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by the visible `description` and a generated text summary (stage count, first and last stage).',
    'A visually hidden data table (stages as rows) lists the value, the percent of the previous stage and the percent of the first stage of every stage, so no number depends on the picture; missing rates read "n/a".',
    'Meaning never rests on colour: every stage carries its label, and its value and conversion are text (on a plate in the page background when drawn inside a shape, so the text keeps the normal text contrast). Each shape has a native `<title>` tooltip.',
    'The SVG is sized to its container (1 unit = 1 CSS px): text keeps its size, labels are shortened (full text in a tooltip) and horizontal labels are thinned when columns get narrow, so nothing overflows at 320px.',
    'In forced-colors mode the shapes use the system text colour and the plates keep their border. The loading placeholder is a polite `role="status"` region marked busy; it does not animate.',
  ],
  related: ['BarChart', 'DonutChart', 'WaterfallChart', 'StatBar', 'Gauge'],
  requires: [
    'Throws a ContractError when there is no `label` (or `title`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when `stages` is not an array or a stage has no `label` or no numeric `value`. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `stages` in the order of the process, each as `{ label, value }`; do not pre-compute percentages, use `showConversion`.',
    'Set `label` (or `title`) to say what the funnel measures and use `valueFormatter` for units.',
    'Use `variant="pyramid"` only when the first stage is the broadest and should sit at the base; for a normal funnel use `funnel`.',
    'Use `orientation="horizontal"` for few stages (up to about 6) in wide containers; vertical for long lists and narrow screens.',
    'Use `labelPlacement="inside"` for wide shapes; narrow stages move their text beside them automatically.',
    'Size with `class`, `size` and `gap`, not `width` / `height`. At most 50 stages are drawn.',
  ],
  replaces: ['Chart.js and ECharts funnel charts', 'hand-built CSS funnel diagrams'],
}
export default doc
