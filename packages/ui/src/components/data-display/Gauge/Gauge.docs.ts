import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Gauge',
  group: 'data-display',
  subgroup: 'Statistics',
  summary: 'SVG gauge (semicircle, three-quarter arc or linear bar) for a value within a range, with threshold tones, a label and role=meter semantics.',
  description:
    'Use `Gauge` to show one measurement against a known range (CPU load, disk usage, score). `thresholds` map value bands to tones (`success`, `warning`, `danger`, ...): the highest threshold whose `value` is <= the current value wins. Values are clamped to the range, reversed `min` / `max` are swapped and `null` / `NaN` render an empty gauge reading `–`. The arc sweeps in on mount and on change unless the user prefers reduced motion. `variant` picks the shape: `semicircle` (default half-dial), `arc` (three-quarter dial with the value inside) or `linear` (a horizontal bar with caption and value on one line); all three keep the same meter semantics, name and value text. Use `StatBar` for linear usage bars and `Progress` for task completion; a gauge is for a live reading, not progress.',
  status: 'stable',
  props: [
    { name: 'value', type: 'number | null', description: 'Current value. null / NaN / Infinity mean "no data".' },
    { name: 'min', type: 'number', default: '0', description: 'Range start. Non-finite values fall back to 0.' },
    { name: 'max', type: 'number', default: '100', description: 'Range end. Non-finite values fall back to 100.' },
    { name: 'thresholds', type: 'GaugeThreshold[]', description: 'Tone bands: `{ value, tone }`, applied when the value is >= `value`.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Tone below all thresholds (or when there are none).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Rendered width (w-24, w-40, w-56) and text size.' },
    { name: 'variant', type: "'semicircle' | 'arc' | 'linear'", default: "'semicircle'", description: '`semicircle` half-dial with the value at its foot, `arc` a three-quarter dial with the value centred, `linear` a horizontal bar (caption left, value right, same width as the dial). Same `role="meter"`, name and `aria-valuetext` in all three.' },
    { name: 'label', type: 'string', description: 'Caption under the value; also the accessible name. Required (or pass `aria-label` / `aria-labelledby`).' },
    { name: 'valueText', type: 'string', description: 'Replaces the formatted value inside the gauge and `aria-valuetext` (e.g. "3.2 of 4 GB").' },
    { name: 'animated', type: 'boolean', default: 'true', description: 'Animate the arc; always off under prefers-reduced-motion.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; use it to set the size (`w-64`).' },
  ],
  slots: [
    { name: 'default', props: '{ value: number; percent: number; tone: GaugeTone; text: string }', description: 'Replace the centre value (e.g. add a unit).' },
    { name: 'label', description: 'Replace the caption under the value.' },
  ],
  examples: [
    {
      title: 'Basic gauge',
      code: `<div class="flex flex-wrap items-end gap-6">
  <Gauge :value="42" label="CPU" size="sm" />
  <Gauge :value="68" label="Memory" />
  <Gauge :value="91" label="Disk" size="lg" />
</div>`,
    },
    {
      title: 'Variant: semicircle, arc, linear',
      description: 'The same reading in the three shapes. The linear gauge is a `role="meter"` just like the dials. Sample data.',
      code: `<div class="flex flex-wrap items-end gap-8">
  <Gauge variant="semicircle" :value="68" label="Memory" />
  <Gauge variant="arc" :value="68" label="Memory" />
  <Gauge variant="linear" :value="68" label="Memory" tone="info" />
</div>`,
    },
    {
      title: 'Linear sizes and thresholds',
      description: 'Linear gauges at each size with threshold tones; the value text states the band as well as the colour. Sample data.',
      code: `<div class="grid max-w-md gap-4">
  <Gauge variant="linear" size="sm" :value="35" label="Queue" value-text="35% normal" :thresholds="[{ value: 0, tone: 'success' }, { value: 70, tone: 'warning' }, { value: 90, tone: 'danger' }]" class="w-full" />
  <Gauge variant="linear" size="md" :value="78" label="Queue" value-text="78% raised" :thresholds="[{ value: 0, tone: 'success' }, { value: 70, tone: 'warning' }, { value: 90, tone: 'danger' }]" class="w-full" />
  <Gauge variant="linear" size="lg" :value="96" label="Queue" value-text="96% high" :thresholds="[{ value: 0, tone: 'success' }, { value: 70, tone: 'warning' }, { value: 90, tone: 'danger' }]" class="w-full" />
</div>`,
    },
    {
      title: 'Threshold tones',
      description: 'Green below 70, amber from 70, red from 90. The value text also states the band, so colour is not the only signal. Sample data.',
      code: `<div class="flex flex-wrap items-end gap-6">
  <Gauge v-for="v in [35, 78, 96]" :key="v" :value="v" :label="'Load ' + v" :value-text="v + '% ' + (v >= 90 ? 'high' : v >= 70 ? 'raised' : 'normal')" :thresholds="thresholds" />
</div>`,
      script: `const thresholds = [
  { value: 0, tone: 'success' },
  { value: 70, tone: 'warning' },
  { value: 90, tone: 'danger' },
]`,
      state: () => ({
        thresholds: [
          { value: 0, tone: 'success' },
          { value: 70, tone: 'warning' },
          { value: 90, tone: 'danger' },
        ],
      }),
    },
    {
      title: 'Custom range and slot',
      code: `<Gauge :value="3.2" :min="0" :max="4" label="Storage" value-text="3.2 of 4 GB" tone="info" />
<Gauge :value="72" label="Battery" :animated="false">
  <template #default="{ value }">{{ value }}%</template>
</Gauge>`,
    },
    {
      title: 'No data',
      code: `<div class="flex flex-wrap items-end gap-8">
  <Gauge :value="null" label="Throughput" />
  <Gauge variant="arc" :value="null" label="Throughput" />
  <Gauge variant="linear" :value="null" label="Throughput" />
</div>`,
    },
  ],
  a11y: [
    'Root has `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`; the label becomes `aria-label` (falls back to "Gauge"; pass `aria-label` / `aria-labelledby` when there is no visible label).',
    'With no data the root switches to `role="img"` with the label "<label>: No data", because `role="meter"` requires `aria-valuenow`. Min, max and valuetext are omitted then.',
    '`variant` does not change the semantics: every shape is `role="meter"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` and the same name; without data all three are `role="img"` labelled "<label>: No data". The arc, the bar and their track are `aria-hidden`; the value and caption stay real text.',
    'The value uses `tabular-nums`; the caption is 12px text. The width follows `size` or `class` and never exceeds the container needs at 320px (`w-56` is the widest).',
    'The arc animation is disabled under prefers-reduced-motion; the SVG itself is aria-hidden.',
    'Tone is also exposed as `data-tone`; do not rely on colour alone: add `valueText` such as "Critical: 96%" when the state matters.',
  ],
  related: ['StatBar', 'Progress', 'KpiTile', 'Sparkline'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
  ],
  llmNotes: [
    'Always give a Gauge a `label` or aria-label.',
    'List thresholds ascending, starting at the range minimum, so the tone below the first band is explicit.',
    'Use `variant="linear"` where a row or card needs a gauge to line up with text (give it `class="w-full"`); use `arc` when the value is the focus and `semicircle` for the compact dial.',
    'Use `valueText` for units; the default text is just the rounded number.',
    'Use the tone `danger` (not `destructive`) for the red state.',
  ],
}
export default doc
