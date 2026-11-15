import { computed, ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Checkbox',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Boolean (or indeterminate) checkbox with optional label and description, sizes, tones, shapes, invalid state and Field wiring.',
  description:
    'Use `Checkbox` for an independent yes/no choice, for selecting several items from a list, or as a "select all" control (bind the indeterminate state when only some children are checked). Pass `label` (or the `label` slot) to render a clickable `<label>` beside the box; without it ALWAYS provide `aria-label`. Add `description` for a line of helper text under the label, `labelPosition="start"` to put the label before the box, `tone` to recolour the checked state and `shape` for a square or circular box. For a bordered or filled tile around the choice use `CheckboxCard`; `Checkbox` has no `variant` because the card components already cover that look. Use `Switch` for settings that apply immediately, `RadioGroup` when exactly one option can be chosen. The model is `true | false | \'indeterminate\'`; clicking an indeterminate box turns it on. Works controlled (`v-model`) and uncontrolled (`default-value`).',
  status: 'stable',
  props: [
    { name: 'modelValue', type: "boolean | 'indeterminate' | null", description: 'v-model value. Uncontrolled when omitted; `null` renders as unchecked.' },
    { name: 'defaultValue', type: "boolean | 'indeterminate'", description: 'Initial state when uncontrolled.' },
    { name: 'label', type: 'string', description: 'Text rendered in a `<label for>` beside the box. Use the `label` slot for rich content.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Box size (14 / 16 / 20 px); the hit area is always at least 24px. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the checked and indeterminate surface. `neutral` uses the foreground colour with background-coloured glyph. The check or minus glyph is always drawn, so state never rests on colour. Unknown values fall back to `primary`.' },
    { name: 'shape', type: "'rounded' | 'square' | 'circle'", default: "'rounded'", description: 'Corner shape of the box: slightly rounded, sharp, or fully round. Unknown values fall back to `rounded`.' },
    { name: 'labelPosition', type: "'end' | 'start'", default: "'end'", description: 'Side of the label in reading order. `start` puts it before the box and flips in right-to-left layouts. Only has an effect when a label is shown.' },
    { name: 'description', type: 'string', description: 'Helper text under the label, referenced from the box through `aria-describedby` (merged with Field hint and error ids). Shown only together with a label. Use the `description` slot for rich content.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the checkbox and dims the label. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required`. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; a hidden input is rendered when inside a `<form>`.' },
    { name: 'value', type: 'string', description: 'Value submitted with the form when checked.' },
    { name: 'id', type: 'string', description: 'Control id. Falls back to the Field id, then a generated one. The label `for` always matches.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the box (`data-slot="checkbox"`); wins over internal classes.' },
  ],
  slots: [
    { name: 'label', description: 'Rich label content; replaces the `label` prop text.' },
    { name: 'description', description: 'Rich helper text under the label; replaces the `description` prop. Needs a label to be shown.' },
  ],
  emits: [{ name: 'update:modelValue', payload: "[value: boolean | 'indeterminate']", description: 'Emitted when the user toggles the checkbox.' }],
  examples: [
    {
      title: 'Basic',
      script: 'const accepted = ref(false)',
      code: `<div class="grid gap-2">
  <Checkbox v-model="accepted" label="I accept the terms" />
  <p class="text-sm text-muted-foreground">Accepted: {{ accepted }}</p>
</div>`,
      state: () => ({ accepted: ref(false) }),
    },
    {
      title: 'Tones',
      description: 'Checked state per tone. The check glyph is drawn in every tone, so the state does not depend on colour.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Checkbox tone="primary" label="Primary" default-value />
  <Checkbox tone="success" label="Success" default-value />
  <Checkbox tone="danger" label="Danger" default-value />
  <Checkbox tone="neutral" label="Neutral" default-value />
  <Checkbox tone="info" label="Info" default-value />
</div>`,
    },
    {
      title: 'Shapes',
      description: 'Square, rounded (default) and circle boxes, each checked and indeterminate.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Checkbox shape="square" label="Square" default-value />
  <Checkbox shape="rounded" label="Rounded" default-value />
  <Checkbox shape="circle" label="Circle" default-value />
  <Checkbox shape="circle" tone="success" label="Circle, indeterminate" default-value="indeterminate" />
</div>`,
    },
    {
      title: 'Description and label position',
      description: 'The description sits under the label and is announced with the checkbox. `labelPosition="start"` puts the label before the box.',
      code: `<div class="grid max-w-sm gap-4">
  <Checkbox label="Sample option A" description="Sample description text under the label." default-value />
  <Checkbox label="Sample option B" description="Sample description, with the label shown first." label-position="start" tone="info" />
</div>`,
    },
    {
      title: 'Select all with indeterminate state',
      script: `const items = ref([{ id: 1, label: 'Email', on: true }, { id: 2, label: 'SMS', on: false }, { id: 3, label: 'Push', on: false }])
const all = computed(() => {
  const n = items.value.filter((i) => i.on).length
  return n === 0 ? false : n === items.value.length ? true : 'indeterminate'
})
function toggleAll(v) { items.value.forEach((i) => (i.on = v === true)) }`,
      code: `<div class="grid gap-2">
  <Checkbox :model-value="all" label="All channels" @update:model-value="toggleAll" />
  <div class="grid gap-2 pl-6">
    <Checkbox v-for="i in items" :key="i.id" v-model="i.on" :label="i.label" size="sm" />
  </div>
</div>`,
      state: () => {
        const items = ref([
          { id: 1, label: 'Email', on: true },
          { id: 2, label: 'SMS', on: false },
          { id: 3, label: 'Push', on: false },
        ])
        const all = computed(() => {
          const n = items.value.filter((i) => i.on).length
          return n === 0 ? false : n === items.value.length ? true : 'indeterminate'
        })
        return {
          items,
          all,
          toggleAll: (v: boolean | 'indeterminate') => items.value.forEach((i) => (i.on = v === true)),
        }
      },
    },
    {
      title: 'In a Field with validation',
      script: 'const agreed = ref(false)',
      code: `<Field label="Consent" hint="Required to continue." :error="agreed ? '' : 'You must accept'" orientation="horizontal">
  <Checkbox v-model="agreed" />
</Field>`,
      state: () => ({ agreed: ref(false) }),
    },
    {
      title: 'Sizes and states',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Checkbox size="sm" label="Small" default-value />
  <Checkbox label="Medium" default-value />
  <Checkbox size="lg" label="Large" default-value />
  <Checkbox label="Disabled" disabled default-value />
  <Checkbox label="Invalid" invalid />
</div>`,
    },
  ],
  a11y: [
    'Button with `role="checkbox"` and `aria-checked` (`true`, `false` or `mixed` for indeterminate); Space toggles it, Tab moves on.',
    'Clicking the `<label for>` toggles the box. Without a label always set `aria-label`. A required checkbox with a label shows a visible asterisk.',
    'Inside a Field it receives `id`, `aria-describedby` (hint and error), `aria-invalid`, `aria-required` and disabled state.',
    '`invalid` sets `aria-invalid="true"`; the destructive ring never appears without it. Forced-colors mode draws a dashed border for invalid and keeps the check or dash glyph for state.',
    '`description` is a `<p>` whose id is added to the box `aria-describedby`, after any Field hint and error ids and an explicit `aria-describedby`; it is rendered only with a label. `labelPosition` changes visual order only: the box stays first in the DOM, so reading and tab order are unchanged.',
    'Tones and shapes change colour and corner radius only. Role, name, keyboard and the check or minus glyph are identical, and forced-colors mode keeps the glyph and a dashed invalid border for every tone.',
    'Hit area is at least 24px even for the 14px box (and about 40px on touch pointers) through an invisible ::after; a multi-line label aligns to the first line.',
    'A group of checkboxes needs a name: wrap them in `Fieldset` with a legend, or give the container `role="group"` with `aria-labelledby`.',
  ],
  related: ['Switch', 'RadioGroup', 'CheckboxCard', 'Field', 'Label'],
  requires: [
    'Throws a ContractError when the checkbox has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby`, or `label` (prop or slot).',
  ],
  llmNotes: [
    'Always give a Checkbox either `label`/`label` slot or `aria-label`.',
    'Use `v-model` (boolean | "indeterminate"); drive "select all" with a computed that returns "indeterminate".',
    'Use `description` for helper text instead of a sibling paragraph: it is wired to the box with aria-describedby. It needs a label.',
    'Use `tone` (primary, success, danger, neutral, info) for the checked colour and `shape` (rounded, square, circle) for the box; do not recolour with classes.',
    'Use `label-position="start"` to put the label first; never reorder with left/right classes.',
    'Use CheckboxCard, not a Checkbox variant, when the whole option needs a bordered tile.',
    'Use Switch for immediate on/off settings, Checkbox for form choices submitted later.',
    'Put layout classes (`mt-1`) on the Checkbox via `class`; it targets the box, not the label wrapper.',
  ],
  replaces: ['shadcn-vue Checkbox', 'hand-rolled Checkbox markup in app code'],
}
export default doc
