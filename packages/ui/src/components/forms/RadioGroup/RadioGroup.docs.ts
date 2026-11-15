import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'RadioGroup',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Single-choice group of radio items with roving keyboard focus, labels, descriptions, sizes, tones and Field wiring.',
  description:
    'Use `RadioGroup` with `RadioGroupItem` children when exactly one of a small set (2-6) of options must be chosen and all options should be visible. Use `Select`/`NativeSelect` for longer lists, `SegmentedControl` for compact view switches and `Checkbox` when several can be chosen. Each item takes a `value` (non-empty string) and either a `label` prop or default-slot content that is rendered in a `<label>` beside the radio. `size`, `tone` and `labelPosition` set on the group apply to every item (an item can override them); `description` on an item adds helper text under its label. The model is the selected item value as a string. Works controlled (`v-model`) and uncontrolled (`default-value`).',
  status: 'stable',
  parts: [
    {
      name: 'RadioGroupItem',
      description: 'One radio. Renders a button with `role="radio"`; with a label (prop or slot) it is wrapped with a `<label for>`.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Value this item represents. Must be a non-empty string.' },
        { name: 'label', type: 'string', description: 'Label text; use the default slot for rich content.' },
        { name: 'description', type: 'string', description: 'Helper text under the label, referenced from the radio through `aria-describedby`. Shown only together with a label. Use the `description` slot for rich content.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Radio size (14 / 16 / 20 px, hit area at least 24px) and label text size. Inherits the group `size`, then `md`. Unknown values fall back to `md`.' },
        { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", description: 'Colour of the checked border and dot. Inherits the group `tone`, then `primary`. The dot is always drawn, so state never rests on colour.' },
        { name: 'labelPosition', type: "'end' | 'start'", description: 'Side of the label in reading order. Inherits the group `labelPosition`, then `end`.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables this item only (the label dims too).' },
        { name: 'id', type: 'string', description: 'Item id; generated when omitted. The label `for` always matches.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last on the radio button; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'modelValue', type: 'string', description: 'v-model: the selected item value. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value when uncontrolled.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout and arrow-key axis. Unknown values fall back to vertical.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of every radio and its label text. An item `size` wins. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the checked border and dot of every item. An item `tone` wins. Unknown values fall back to `primary`.' },
    { name: 'labelPosition', type: "'end' | 'start'", default: "'end'", description: 'Side of the label in reading order for every item; `start` flips in right-to-left layouts. An item `labelPosition` wins.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every item. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required` on the group. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` on the group. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; hidden inputs are rendered when inside a `<form>`.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Arrow-key focus wraps from last to first item.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the group; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'RadioGroupItem children. Each item also has a `description` slot for rich helper text under its label.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'Emitted when the user selects an item.' }],
  examples: [
    {
      title: 'Basic',
      script: "const plan = ref('pro')",
      code: `<div class="grid gap-3">
  <RadioGroup v-model="plan" aria-label="Plan">
    <RadioGroupItem value="free" label="Sample plan A" />
    <RadioGroupItem value="pro" label="Sample plan B" />
    <RadioGroupItem value="team" label="Sample plan C" disabled />
  </RadioGroup>
  <p class="text-sm text-muted-foreground">Selected: {{ plan }}</p>
</div>`,
      state: () => ({ plan: ref('pro') }),
    },
    {
      title: 'Horizontal in a Field with an error',
      script: "const size = ref('')",
      code: `<Field label="T-shirt size" :error="size ? '' : 'Choose a size'" required>
  <RadioGroup v-model="size" orientation="horizontal">
    <RadioGroupItem value="s" label="S" />
    <RadioGroupItem value="m" label="M" />
    <RadioGroupItem value="l" label="L" />
  </RadioGroup>
</Field>`,
      state: () => ({ size: ref('') }),
    },
    {
      title: 'Tones',
      description: 'Checked colour per tone, set on the group. Each group is named with `aria-label`.',
      code: `<div class="grid gap-4">
  <RadioGroup default-value="a" tone="success" orientation="horizontal" aria-label="Success tone">
    <RadioGroupItem value="a" label="Success A" />
    <RadioGroupItem value="b" label="Success B" />
  </RadioGroup>
  <RadioGroup default-value="a" tone="danger" orientation="horizontal" aria-label="Danger tone">
    <RadioGroupItem value="a" label="Danger A" />
    <RadioGroupItem value="b" label="Danger B" />
  </RadioGroup>
  <RadioGroup default-value="a" tone="info" orientation="horizontal" aria-label="Info tone">
    <RadioGroupItem value="a" label="Info A" />
    <RadioGroupItem value="b" label="Info B" />
  </RadioGroup>
  <RadioGroup default-value="a" tone="neutral" orientation="horizontal" aria-label="Neutral tone">
    <RadioGroupItem value="a" label="Neutral A" />
    <RadioGroupItem value="b" label="Neutral B" />
  </RadioGroup>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Small, medium (default) and large radios with matching label text. The hit area is at least 24px in every size.',
      code: `<div class="grid gap-4">
  <RadioGroup default-value="a" size="sm" orientation="horizontal" aria-label="Small">
    <RadioGroupItem value="a" label="Small A" />
    <RadioGroupItem value="b" label="Small B" />
  </RadioGroup>
  <RadioGroup default-value="a" orientation="horizontal" aria-label="Medium">
    <RadioGroupItem value="a" label="Medium A" />
    <RadioGroupItem value="b" label="Medium B" />
  </RadioGroup>
  <RadioGroup default-value="a" size="lg" orientation="horizontal" aria-label="Large">
    <RadioGroupItem value="a" label="Large A" />
    <RadioGroupItem value="b" label="Large B" />
  </RadioGroup>
</div>`,
    },
    {
      title: 'Descriptions and label position',
      description: 'Each description is announced with its radio. `label-position="start"` on the group puts every label before its radio.',
      code: `<div class="grid max-w-md gap-6">
  <RadioGroup default-value="monthly" aria-label="Billing period">
    <RadioGroupItem value="monthly" label="Sample option A" description="Sample description for the first option." />
    <RadioGroupItem value="yearly" label="Sample option B" description="Sample description for the second option." />
  </RadioGroup>
  <RadioGroup default-value="email" label-position="start" tone="info" aria-label="Contact method">
    <RadioGroupItem value="email" label="Sample option C" description="Sample description for the third option." />
    <RadioGroupItem value="phone" label="Sample option D" description="Sample description for the fourth option." />
  </RadioGroup>
</div>`,
    },
    {
      title: 'Rich label content',
      code: `<RadioGroup default-value="a" aria-label="Billing">
  <RadioGroupItem value="a">
    <span>Monthly <Badge variant="secondary">Sample badge</Badge></span>
  </RadioGroupItem>
  <RadioGroupItem value="b">
    <span>Yearly <Badge>Sample badge</Badge></span>
  </RadioGroupItem>
</RadioGroup>`,
    },
  ],
  a11y: [
    'Group has `role="radiogroup"`, items are `role="radio"` with `aria-checked`. Name the group with `aria-label`, or put it in a Field: the Field label then names it through `aria-labelledby`.',
    'Keyboard: Tab enters the group once (roving tabindex, on the selected item or the first), Arrow keys move and select (wrapping when `loop`), Space selects the focused item, Shift+Tab leaves.',
    'A `description` is a `<p>` whose id is set as the radio `aria-describedby` (after an explicit one); it is rendered only with a label. `labelPosition` changes visual order only: the radio stays first in the DOM, so reading and tab order are unchanged.',
    'Size and tone change the look only. Roles, names and keyboard are identical for every variation, and the checked dot and dashed invalid border survive forced-colors mode for every tone.',
    'Clicking a label selects its radio. Inside a Field the group receives `aria-describedby`, `aria-invalid` and `aria-required`.',
    'Each radio has an at-least-24px hit area (about 40px on touch pointers) through an invisible ::after; forced-colors mode keeps the dot visible with a system colour.',
    'Responsive: the horizontal layout wraps, so it never overflows at 320px.',
  ],
  related: ['Checkbox', 'Select', 'SegmentedControl', 'Field'],
  requires: [
    'Throws a ContractError when `RadioGroup` has no accessible name: no `Field` label, `Fieldset` legend, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when a `RadioGroupItem` has a missing or empty `value`.',
    'Throws a ContractError when a `RadioGroupItem` has no accessible name: no `label` prop, default slot text, `aria-label` or `aria-labelledby`.',
  ],
  llmNotes: [
    'Always pair RadioGroup with a visible Field label or `aria-label`.',
    'Set `size`, `tone` and `label-position` once on the group; override on an item only when one option must differ. Use `description` on an item for helper text (needs a label).',
    'Item `value` must be a non-empty string; put the label on the item (`label` prop), not outside it.',
    'Use `v-model` on the group, never on items. 2-6 options only; otherwise use Select.',
  ],
  replaces: ['shadcn-vue RadioGroup', 'hand-rolled native radio inputs'],
}
export default doc
