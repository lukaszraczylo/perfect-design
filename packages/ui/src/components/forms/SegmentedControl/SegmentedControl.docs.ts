import { ref } from 'vue'
import { faList, faTableCells } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SegmentedControl',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Compact single choice (view switcher, range picker) built on a radiogroup, in pill, underline, outline or filled looks, horizontal or vertical.',
  description:
    'Use `SegmentedControl` to switch between 2-5 mutually exclusive, short options that change how content is shown (List / Grid, Day / Week / Month). It looks like tabs but is a form control: it holds a value and does not own panels. Use `Tabs` for content navigation, `RadioGroup` for form answers that need descriptions, `Select` for long lists. Options come from the `options` array; override item content with the `option` slot. Works controlled (`v-model`) and uncontrolled (`default-value`).',
  status: 'stable',
  props: [
    { name: 'options', type: 'Array<{ value: string; label: string; disabled?: boolean; icon?: IconDefinition }>', default: '[]', description: 'Segments. `value` must be a non-empty string; `icon` is a FontAwesome IconDefinition shown before the label.' },
    { name: 'modelValue', type: 'string', description: 'v-model: the selected option value. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value when uncontrolled.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Segment height. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'pill' | 'underline' | 'outline' | 'filled'", default: "'pill'", description: '`pill`: muted tray with a raised selected chip. `underline`: a rule with a marker under (or, vertical, beside) the selected segment. `outline`: bordered tray with a bordered selection. `filled`: muted tray with a solid selection. Unknown values fall back to `pill`.' },
    { name: 'tone', type: "'default' | 'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'default'", description: 'Colour of the selected segment. `default` keeps the neutral look of the variant (raised chip, or foreground ink). In `pill` and `filled` a tone fills the selected segment with that colour; in `underline` and `outline` it colours the marker or border. `neutral` is foreground on background. Unknown values fall back to `default`.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: '`vertical` stacks the segments in a column, left-aligned, and switches the arrow keys to Up and Down. Sets `aria-orientation`. Unknown values fall back to horizontal.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch to the container width. Horizontal segments share the width equally; vertical segments keep their height.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every segment. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` on the group. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; hidden inputs are rendered when inside a `<form>`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  slots: [{ name: 'option', props: '{ option: SegmentedControlOption }', description: 'Replaces the content (icon + label) of each segment.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'Emitted when the user selects a segment.' }],
  examples: [
    {
      title: 'Basic',
      script: "const range = ref('week')\nconst options = [{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]",
      code: `<div class="grid gap-2">
  <SegmentedControl v-model="range" :options="options" aria-label="Range" />
  <p class="text-sm text-muted-foreground">Showing: {{ range }}</p>
</div>`,
      state: () => ({
        range: ref('week'),
        options: [
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ],
      }),
    },
    {
      title: 'With icons, full width and a disabled option',
      script: "const view = ref('list')\nconst views = [{ value: 'list', label: 'List', icon: faList }, { value: 'grid', label: 'Grid', icon: faTableCells }, { value: 'map', label: 'Map', disabled: true }]",
      code: `<SegmentedControl v-model="view" :options="views" full-width aria-label="View" class="max-w-md" />`,
      state: () => ({
        view: ref('list'),
        views: [
          { value: 'list', label: 'List', icon: faList },
          { value: 'grid', label: 'Grid', icon: faTableCells },
          { value: 'map', label: 'Map', disabled: true },
        ],
      }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid justify-items-start gap-3">
  <SegmentedControl size="sm" default-value="a" aria-label="Small" :options="[{ value: 'a', label: 'One' }, { value: 'b', label: 'Two' }]" />
  <SegmentedControl default-value="a" aria-label="Medium" :options="[{ value: 'a', label: 'One' }, { value: 'b', label: 'Two' }]" />
  <SegmentedControl size="lg" default-value="a" aria-label="Large" :options="[{ value: 'a', label: 'One' }, { value: 'b', label: 'Two' }]" />
</div>`,
    },
    {
      title: 'Variants',
      description: 'The same options in each look. The selected segment is marked by fill, border or underline plus text weight and colour, never colour alone.',
      code: `<div class="grid justify-items-start gap-3">
  <SegmentedControl variant="pill" default-value="week" aria-label="Pill range" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
  <SegmentedControl variant="underline" default-value="week" aria-label="Underline range" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
  <SegmentedControl variant="outline" default-value="week" aria-label="Outline range" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
  <SegmentedControl variant="filled" default-value="week" aria-label="Filled range" :options="[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]" />
</div>`,
    },
    {
      title: 'Tones',
      description: 'The tone colours the selected segment: a solid chip in `pill` and `filled`, the marker or border in `underline` and `outline`.',
      code: `<div class="grid justify-items-start gap-3">
  <SegmentedControl tone="primary" default-value="b" aria-label="Primary tone" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
  <SegmentedControl tone="success" default-value="b" aria-label="Success tone" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
  <SegmentedControl tone="danger" default-value="b" aria-label="Danger tone" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
  <SegmentedControl tone="neutral" default-value="b" aria-label="Neutral tone" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
  <SegmentedControl tone="info" default-value="b" aria-label="Info tone" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
  <SegmentedControl variant="underline" tone="success" default-value="b" aria-label="Underline success" :options="[{ value: 'a', label: 'Off' }, { value: 'b', label: 'On' }]" />
</div>`,
    },
    {
      title: 'Vertical orientation',
      description: 'Segments stack in a column. Use Up and Down to move. Combine with `full-width` to fill a sidebar column.',
      script: "const section = ref('profile')\nconst sections = [{ value: 'profile', label: 'Profile' }, { value: 'billing', label: 'Billing' }, { value: 'team', label: 'Team' }]",
      code: `<div class="flex flex-wrap items-start gap-6">
  <SegmentedControl v-model="section" orientation="vertical" :options="sections" aria-label="Settings section" />
  <SegmentedControl v-model="section" orientation="vertical" variant="underline" :options="sections" aria-label="Settings section, underline" />
  <SegmentedControl v-model="section" orientation="vertical" variant="outline" full-width :options="sections" aria-label="Settings section, full width" class="w-48" />
</div>`,
      state: () => ({
        section: ref('profile'),
        sections: [
          { value: 'profile', label: 'Profile' },
          { value: 'billing', label: 'Billing' },
          { value: 'team', label: 'Team' },
        ],
      }),
    },
  ],
  a11y: [
    'Root is `role="radiogroup"` with `role="radio"` segments and `aria-checked`. Name it with `aria-label`, or put it in a Field: the Field label then names it through `aria-labelledby`.',
    'Keyboard: roving tabindex, so Tab enters once; the arrow keys of the control axis move focus and select (Left and Right when horizontal, Up and Down when `orientation="vertical"`, which is also announced as `aria-orientation`); Home and End move focus to the ends; disabled segments are skipped.',
    'Icon-only segments still need a `label` (it is the accessible name); icons are decorative (`aria-hidden`).',
    'The selected segment is also marked in forced-colors mode (system colours); invalid draws a dashed border. Segments are 24px or taller (36px on touch pointers).',
    'Roles, names and keyboard behaviour are the same in every `variant` and `tone`: the selected segment carries `aria-checked` and `data-state="checked"`, and each variant marks it with a fill, border or underline, not colour alone. In forced-colors mode every variant uses the system highlight for the selected segment.',
    'Responsive: the control wraps onto more rows instead of overflowing at 320px.',
  ],
  related: ['RadioGroup', 'Tabs', 'Select', 'Field'],
  requires: [
    'Throws a ContractError when the control has no accessible name: no `Field` label, `Fieldset` legend, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when an option has no text `label` (an icon alone does not count; with the `option` slot the slot must supply text).',
    'Throws a ContractError when an option `value` is missing, empty or used twice.',
  ],
  llmNotes: [
    'Use for 2-5 short options that change presentation; use Tabs when each option owns a content panel.',
    'Always label the control (`aria-label` or Field). Every option needs a text `label`.',
    'Pass `options` as data and bind with `v-model`; never nest your own radio markup.',
    'Pick `variant` for the look (pill, underline, outline, filled), `tone` for the selected colour (default is neutral) and `orientation="vertical"` for a column; use `segmentedControlVariants` / `segmentedControlItemVariants` to style custom elements the same way.',
  ],
  replaces: ['shadcn-vue ToggleGroup (type single) used as a segmented switch', 'hand-rolled pill button groups'],
}
export default doc
