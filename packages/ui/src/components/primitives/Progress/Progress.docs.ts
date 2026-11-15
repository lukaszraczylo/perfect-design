import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Progress',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Horizontal progress bar with determinate and indeterminate modes, tones, sizes, a pulse animation, inside/top labels and segments.',
  description:
    'Use `Progress` to show how far a known task has come (`modelValue` 0..`max`) or that something is working with no known end (omit `modelValue` or pass `null`). Values are clamped: NaN and negatives become 0, values above `max` become `max`, an invalid `max` falls back to 100. Unknown `size`/`tone`/`valuePosition` values fall back to the defaults.\n\n' +
    'Variations: **size** `xs` (2px) to `xl` (20px); **tone** for meaning (primary, success, warning, danger, info, neutral); **animated** pulses the filled bar (a busy but determinate task; static under prefers-reduced-motion). `striped` is deprecated and draws nothing, because stripes need a gradient and the design system uses none; **valuePosition** `end` (percentage beside the bar, default), `inside` (percentage inside the filled bar, needs size `lg`/`xl`, clipped when the value is very small) or `top` (header row with the visible `label` on the left and the percentage on the right); **segments** splits the bar into N steps for wizards, password strength or quotas (each segment fills proportionally). For a circular meter use `ProgressRing`; for tiny inline waits use `Spinner`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'number | null', description: 'Current value. null/undefined renders the indeterminate animation.' },
    { name: 'max', type: 'number', default: '100', description: 'Upper bound. Non-finite or <= 0 falls back to 100.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Colour of the filled bar. Unknown values fall back to primary.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Track height: 2px, 4px, 8px, 12px, 20px. Unknown values fall back to md.' },
    { name: 'label', type: 'string', description: 'Accessible name (aria-label). Required unless `aria-label` or `aria-labelledby` is set. Also rendered as visible text when `valuePosition="top"`.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Show the rounded percentage as text (determinate only). Placement set by `valuePosition`.' },
    { name: 'valuePosition', type: "'end' | 'inside' | 'top'", default: "'end'", description: 'end = beside the bar; inside = in the filled bar (use size lg/xl; segmented bars fall back to end); top = header row above the bar with label + percentage.' },
    { name: 'striped', type: 'boolean', default: 'false', description: 'Diagonal stripes on the filled bar (static).' },
    { name: 'animated', type: 'boolean', default: 'false', description: 'Moving stripes; implies `striped`. Static under prefers-reduced-motion and ignored while indeterminate.' },
    { name: 'segments', type: 'number', default: '0', description: 'Split the bar into N segments (2..50, floored). Values below 2 or non-finite render a normal bar. Each segment fills proportionally to the value.' },
    { name: 'as', type: 'string | Component', description: 'Root element (default div).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the root wrapper (set width here, e.g. `w-64`).' },
  ],
  slots: [],
  examples: [
    {
      title: 'Determinate and indeterminate',
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="45" label="Sample upload" />
  <Progress :model-value="80" tone="success" size="lg" show-value label="Sample disk" />
  <Progress label="Loading" />
</div>`,
    },
    {
      title: 'Interactive with tones',
      script: `const value = ref(30)`,
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="value" show-value label="Sample quota" :tone="value > 85 ? 'danger' : value > 60 ? 'warning' : 'primary'" />
  <div class="flex gap-2">
    <Button size="sm" variant="outline" @click="value = Math.max(0, value - 10)">-10</Button>
    <Button size="sm" @click="value = Math.min(100, value + 10)">+10</Button>
  </div>
</div>`,
      state: () => ({ value: ref(30) }),
    },
    {
      title: 'Sizes',
      description: 'xs, sm, md (default), lg and xl track heights.',
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="60" size="xs" label="xs" />
  <Progress :model-value="60" size="sm" label="sm" />
  <Progress :model-value="60" size="md" label="md" />
  <Progress :model-value="60" size="lg" label="lg" />
  <Progress :model-value="60" size="xl" label="xl" />
</div>`,
    },
    {
      title: 'Tones',
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="50" tone="neutral" label="Neutral" />
  <Progress :model-value="50" tone="primary" label="Primary" />
  <Progress :model-value="50" tone="success" label="Success" />
  <Progress :model-value="50" tone="warning" label="Warning" />
  <Progress :model-value="50" tone="danger" label="Danger" />
  <Progress :model-value="50" tone="info" label="Info" />
</div>`,
    },
    {
      title: 'Animated',
      description: 'A pulsing fill for a determinate task that is actively running. Static under prefers-reduced-motion.',
      code: `<div class="w-full max-w-72">
  <Progress :model-value="40" animated size="lg" tone="info" label="Sample task" />
</div>`,
    },
    {
      title: 'Label inside the bar',
      description: 'valuePosition="inside" renders the percentage inside the filled bar; use size lg or xl.',
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="72" size="xl" show-value value-position="inside" label="Sample storage" />
  <Progress :model-value="38" size="xl" tone="warning" show-value value-position="inside" label="Sample quota" />
</div>`,
    },
    {
      title: 'Label and value on top',
      description: 'valuePosition="top" shows the label on the left and the percentage on the right above the bar.',
      code: `<div class="w-full max-w-72 space-y-4">
  <Progress :model-value="72" label="Sample usage" show-value value-position="top" />
  <Progress :model-value="91" label="Sample limit" show-value value-position="top" tone="danger" />
</div>`,
    },
    {
      title: 'Segmented',
      description: 'N segments, each filling proportionally. Good for steps and strength meters.',
      script: `const step = ref(3)`,
      code: `<div class="w-full max-w-72 space-y-3">
  <Progress :model-value="step * 20" :segments="5" label="Sample steps" show-value value-position="top" />
  <Progress :model-value="60" :segments="10" size="sm" tone="success" label="Sample strength" />
  <div class="flex gap-2">
    <Button size="sm" variant="outline" @click="step = Math.max(0, step - 1)">Back</Button>
    <Button size="sm" @click="step = Math.min(5, step + 1)">Next</Button>
  </div>
</div>`,
      state: () => ({ step: ref(3) }),
    },
  ],
  a11y: [
    'role="progressbar" with aria-valuemin/max/now (reka-ui); indeterminate omits aria-valuenow. Segmented bars keep a single progressbar on the root; segments are plain presentation.',
    'Pass `label` (aria-label) describing what is progressing; a bar without a name throws a ContractError (the rendered fallback is "Progress"). Use `aria-labelledby` to point at visible text instead.',
    'The percentage text uses `tabular-nums`, so the digits do not jitter while the value changes. Progress updates are not announced as a live region; use a separate `role="status"` message for milestones.',
    'The indeterminate animation is replaced by a static half-opacity bar and the pulse stops under prefers-reduced-motion. In forced-colors mode (where background colours are replaced by system colours) the track gets a 1px border and the fill a 2px border, so the filled length stays readable.',
    'Responsive: the bar is `w-full` and shrinks with its container; give it a `max-w-*` parent rather than a fixed width.',
  ],
  related: ['ProgressRing', 'Spinner', 'Skeleton'],
  requires: [
    'Throws a ContractError when a Progress has none of `label`, `aria-label` and `aria-labelledby`.',
  ],
  llmNotes: [
    'Omit modelValue (or pass null) for unknown duration; never fake a percentage.',
    'Always set `label` when more than one progress bar is on the page.',
    'Control width with the parent (e.g. `max-w-72`); the bar fills its container by default.',
    'Use tone="danger"/"warning" for thresholds instead of custom colours.',
    'Use value-position="inside" only with size lg/xl; use value-position="top" when the label should be visible.',
    'Use `segments` for discrete steps; use `animated` only while work is actually running. Do not use `striped`.',
  ],
  replaces: ['shadcn-vue Progress', 'hand-rolled `<div class="h-2 bg-muted"><div style="width: x%">` bars', 'Bootstrap animated progress', 'step/strength segmented bars'],
}
export default doc
