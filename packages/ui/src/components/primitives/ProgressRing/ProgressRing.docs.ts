import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ProgressRing',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Circular SVG meter that fills clockwise from the top, with a centre label.',
  description:
    'Use `ProgressRing` for scores, quotas and completion where a compact circular readout fits (dashboards, cards). It is pure and stateless: the arc animates with a CSS transition when `value` changes (disabled for reduced motion). Values are sanitised: NaN and negatives become 0, values above `max` become `max`, an invalid `max` falls back to 100. For linear bars use `Progress`.\n\nVariations:\n\n- `size`: a number of px (default 64) or a preset: `xs` 40, `sm` 48, `md` 64, `lg` 96, `xl` 128. A preset also sets a matching thickness (4, 5, 6, 8, 10px) unless you pass `strokeWidth`.\n- `variant`: `default` draws the muted track under the arc; `bare` draws the arc alone, for rings on tinted or busy surfaces.\n- `shape`: the line cap of the arc, `round` (default) or `butt` (flat ends, so the arc length is exact).\n- `tone`: colour of the arc.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', description: 'Accessible name of the ring. Required: `label`, `aria-label` or `aria-labelledby` must say what is measured.' },
    { name: 'valueText', type: 'string', description: 'Text for `aria-valuetext`, e.g. `42 of 100 GB`. Defaults to the rounded percent.' },
    { name: 'value', type: 'number', default: '0', description: 'Current value, clamped to 0..max.' },
    { name: 'max', type: 'number', default: '100', description: 'Upper bound. Non-finite or <= 0 falls back to 100.' },
    { name: 'size', type: "number | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: '64', description: 'Outer diameter in px, or a preset: xs 40, sm 48, md 64, lg 96, xl 128. Invalid numbers and unknown presets fall back to 64.' },
    { name: 'strokeWidth', type: 'number', default: '6', description: 'Ring thickness in px (capped at size / 2). Without it a size preset uses its own thickness (4, 5, 6, 8, 10px) and a numeric size uses 6.' },
    { name: 'variant', type: "'default' | 'bare'", default: "'default'", description: '`default` draws the muted track under the arc; `bare` draws the arc alone. Unknown values fall back to default.' },
    { name: 'shape', type: "'round' | 'butt'", default: "'round'", description: 'Line cap of the arc (`stroke-linecap`): rounded or flat ends. Unknown values fall back to round.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Colour of the value arc (track is always muted).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the root; wins over internal classes.' },
  ],
  slots: [{ name: 'label', description: 'Centre content. Defaults to the rounded percentage.', props: '{ value: number; percent: number }' }],
  examples: [
    {
      title: 'Tones',
      code: `<div class="flex items-center gap-4">
  <ProgressRing :value="25" tone="danger" label="Sample metric A" />
  <ProgressRing :value="60" tone="warning" label="Sample metric B" />
  <ProgressRing :value="92" tone="success" label="Sample metric C" />
</div>`,
    },
    {
      title: 'Custom size and label slot',
      code: `<div class="flex items-center gap-4">
  <ProgressRing :value="7" :max="10" :size="96" :stroke-width="8" label="Sample score">
    <template #label="{ value }">
      <span class="text-lg font-semibold">{{ value }}<span class="text-xs text-muted-foreground">/10</span></span>
    </template>
  </ProgressRing>
  <ProgressRing :value="40" :size="40" :stroke-width="4" tone="info" label="Sample progress" />
</div>`,
    },
    {
      title: 'Size presets',
      description: 'The presets scale the diameter and the thickness together. A number still sets px directly.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <ProgressRing :value="64" size="xs" label="Sample metric xs" />
  <ProgressRing :value="64" size="sm" label="Sample metric sm" />
  <ProgressRing :value="64" size="md" label="Sample metric md" />
  <ProgressRing :value="64" size="lg" label="Sample metric lg" />
  <ProgressRing :value="64" size="xl" label="Sample metric xl" />
</div>`,
    },
    {
      title: 'Variants and line caps',
      description: '`bare` drops the track; `butt` ends the arc flat instead of round.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <ProgressRing :value="45" label="Sample, track and round cap" />
  <ProgressRing :value="45" variant="bare" label="Sample, bare" />
  <ProgressRing :value="45" shape="butt" label="Sample, butt cap" />
  <ProgressRing :value="45" variant="bare" shape="butt" tone="success" label="Sample, bare and butt" />
</div>`,
    },
  ],
  a11y: [
    'role="meter" with aria-valuenow/min/max and aria-valuetext ("42%"); the SVG itself is aria-hidden.',
    'The rendered fallback name is "Progress", but a ring without `label` (or `aria-label` / `aria-labelledby`) throws a ContractError: pass `label` (or `aria-label` / `aria-labelledby`) with the real subject.',
    'The centre text is `tabular-nums`; forced-colors mode keeps the track and arc visible because both are drawn with token strokes.',
    'Arc transition is removed with motion-reduce.',
    'Size presets, `variant` and `shape` change only the drawing: role, value, aria-valuetext and the centre percentage are the same. With `variant="bare"` keep the centre percentage (or your `label` slot): without the track the arc alone does not show where the scale ends.',
  ],
  related: ['Progress', 'Spinner'],
  requires: [
    'Throws a ContractError when a ProgressRing has none of `label`, `aria-label` and `aria-labelledby`.',
  ],
  llmNotes: [
    'Always pass `label` describing the metric.',
    'Use `size` (px or a preset such as `lg`) and `strokeWidth` props for dimensions, not CSS width/height.',
    'Put custom centre content in the `label` slot; it receives { value, percent }.',
    'Stateless: do not expect count-up animation; drive `value` from state.',
  ],
  replaces: ['hand-rolled ProgressRing markup in app code'],
}
export default doc
