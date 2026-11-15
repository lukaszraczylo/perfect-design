import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'
import { faEnvelope, faPhone, faUser } from '../../../lib/icons'

const doc: ComponentDoc = {
  name: 'RadioCard',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Selectable card tile backed by a native radio input, used inside RadioCardGroup for single-choice options with tones, a stacked layout and roving arrow-key navigation.',
  description:
    'Use `RadioCard` + `RadioCardGroup` when exactly one option can be chosen and each option needs a title, description or icon: billing plans, shipping methods, deployment targets. The group owns `v-model` (a string); each card has a `value`. Native radios are visually hidden (sr-only) so form submission and screen readers behave natively, while the group adds roving keyboard navigation (arrows move focus AND selection, Home/End jump, disabled cards are skipped). A `RadioCard` rendered outside a group throws a ContractError and is inert and disabled. Use `RadioGroup` for compact radios, `SegmentedControl` for short inline switches, `CheckboxCard` for multiple selection. Extra attributes (`aria-label`, `id`, `data-*`) are forwarded to the native input; use `class` for the card root.',
  status: 'stable',
  parts: [
    {
      name: 'RadioCardGroup',
      description: 'Grid wrapper (`role="radiogroup"`) that owns the selected value, shares one native radio `name`, propagates state/variant/size/tone/layout to cards and implements roving keyboard navigation.',
      props: [
        { name: 'modelValue', type: 'string', description: 'Selected value (v-model). Omit for uncontrolled use.' },
        { name: 'defaultValue', type: 'string', description: 'Initial value when uncontrolled.' },
        { name: 'columns', type: '1 | 2 | 3 | 4', default: '1', description: 'Grid columns from the `sm` breakpoint up (2 on `sm`, 3-4 on `lg`). Invalid values fall back to 1.' },
        { name: 'variant', type: "'outline' | 'filled'", description: 'Default variant for cards.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Default size for cards.' },
        { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", description: 'Default tone for cards. A card with its own `tone` wins.' },
        { name: 'layout', type: "'default' | 'stacked'", description: 'Default layout for cards. A card with its own `layout` wins.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every card and blocks keyboard changes.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required` on the group and `required` on the radios.' },
        { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` on the group and a destructive border on every card.' },
        { name: 'name', type: 'string', description: 'Native radio name. Defaults to a generated unique name.' },
        { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap arrow-key focus from last to first and back.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last on the group root.' },
      ],
    },
  ],
  props: [
    { name: 'value', type: 'string', required: true, description: 'Value this card represents. Must be a non-empty string.' },
    { name: 'title', type: 'string', description: 'Title text. Use the `title` slot for rich content.' },
    { name: 'description', type: 'string', description: 'Description text. Use the `description` slot for rich content.' },
    { name: 'icon', type: 'IconDefinition', description: 'Icon shown before the text. Use the `icon` slot for anything else.' },
    { name: 'variant', type: "'outline' | 'filled'", default: "'outline'", description: 'Surface style. Inherits the group variant when unset.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size. Inherits the group size when unset.' },
    { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the selected state: border, tint, icon and indicator dot. `neutral` uses foreground on background. Inherits the group tone when unset; unknown values fall back to `primary`.' },
    { name: 'layout', type: "'default' | 'stacked'", default: "'default'", description: '`default` puts the icon, text and indicator in one row; `stacked` puts the icon above the text and the indicator in the top end corner. Inherits the group layout when unset.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables this card (skipped by arrow keys).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Marks this card invalid. Also inherited from the group.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root `<label data-slot="radio-card">`.' },
  ],
  slots: [
    { name: 'default', props: '{ checked: boolean }', description: 'Extra content below the description (e.g. a price).' },
    { name: 'title', props: '{ checked: boolean }', description: 'Rich title; replaces the `title` prop text.' },
    { name: 'description', props: '{ checked: boolean }', description: 'Rich description; replaces the `description` prop text.' },
    { name: 'icon', props: '{ checked: boolean }', description: 'Custom leading icon/illustration; replaces the `icon` prop.' },
  ],
  emits: [{ name: 'RadioCardGroup: update:modelValue', payload: '[value: string]', description: 'Emitted by the group when the user selects a different card (click or arrow keys).' }],
  examples: [
    {
      title: 'Basic',
      script: "const plan = ref('pro')",
      code: `<div class="grid max-w-sm gap-2">
  <RadioCardGroup v-model="plan" aria-label="Plan">
    <RadioCard value="free" title="Sample plan A" description="Short description of plan A." />
    <RadioCard value="pro" title="Sample plan B" description="Short description of plan B." />
    <RadioCard value="enterprise" title="Sample plan C" description="Short description of plan C." />
  </RadioCardGroup>
  <p class="text-sm text-muted-foreground">Plan: {{ plan }}</p>
</div>`,
      state: () => ({ plan: ref('pro') }),
    },
    {
      title: 'Columns with icons',
      script: `const contact = ref('phone')
const icons = { email: faEnvelope, phone: faPhone, chat: faUser }`,
      code: `<div class="max-w-2xl">
  <RadioCardGroup v-model="contact" :columns="3" aria-label="Contact method">
    <RadioCard value="email" title="Email" description="Written reply" :icon="icons.email" />
    <RadioCard value="phone" title="Phone" description="Spoken reply" :icon="icons.phone" />
    <RadioCard value="chat" title="Chat" description="Live reply" :icon="icons.chat" />
  </RadioCardGroup>
</div>`,
      state: () => ({ contact: ref('phone'), icons: { email: faEnvelope, phone: faPhone, chat: faUser } }),
    },
    {
      title: 'Variant: filled',
      script: "const size = ref('m')",
      code: `<div class="max-w-sm">
  <RadioCardGroup v-model="size" variant="filled" aria-label="Size">
    <RadioCard value="s" title="Small" />
    <RadioCard value="m" title="Medium" />
    <RadioCard value="l" title="Large" />
  </RadioCardGroup>
</div>`,
      state: () => ({ size: ref('m') }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-sm gap-4">
  <RadioCardGroup size="sm" default-value="a" aria-label="Small cards">
    <RadioCard value="a" title="Small A" description="Compact" />
    <RadioCard value="b" title="Small B" description="Compact" />
  </RadioCardGroup>
  <RadioCardGroup size="lg" default-value="a" aria-label="Large cards">
    <RadioCard value="a" title="Large A" description="Roomy" />
    <RadioCard value="b" title="Large B" description="Roomy" />
  </RadioCardGroup>
</div>`,
    },
    {
      title: 'Tones',
      description: 'The selected border, tint, icon and indicator dot follow the tone. Each group below is a separate radio group with its own selection.',
      code: `<div class="grid max-w-2xl gap-4 sm:grid-cols-2">
  <RadioCardGroup tone="success" default-value="a" aria-label="Success tone">
    <RadioCard value="a" title="Success" description="Sample confirmation choice." />
    <RadioCard value="b" title="Other" description="Not selected." />
  </RadioCardGroup>
  <RadioCardGroup tone="danger" default-value="a" aria-label="Danger tone">
    <RadioCard value="a" title="Danger" description="Sample destructive choice." />
    <RadioCard value="b" title="Other" description="Not selected." />
  </RadioCardGroup>
  <RadioCardGroup tone="neutral" default-value="a" aria-label="Neutral tone">
    <RadioCard value="a" title="Neutral" description="Foreground on background." />
    <RadioCard value="b" title="Other" description="Not selected." />
  </RadioCardGroup>
  <RadioCardGroup tone="info" default-value="a" aria-label="Info tone">
    <RadioCard value="a" title="Info" description="Sample informational choice." />
    <RadioCard value="b" title="Other" description="Not selected." />
  </RadioCardGroup>
</div>`,
    },
    {
      title: 'Stacked layout',
      description: 'The icon sits above the text and the indicator moves to the top end corner.',
      script: "const contact = ref('phone')\nconst icons = { email: faEnvelope, phone: faPhone, chat: faUser }",
      code: `<RadioCardGroup v-model="contact" layout="stacked" tone="info" :columns="3" aria-label="Stacked contact method" class="max-w-2xl">
  <RadioCard value="email" title="Email" description="Written reply" :icon="icons.email" />
  <RadioCard value="phone" title="Phone" description="Spoken reply" :icon="icons.phone" />
  <RadioCard value="chat" title="Chat" description="Live reply" :icon="icons.chat" />
</RadioCardGroup>`,
      state: () => ({ contact: ref('phone'), icons: { email: faEnvelope, phone: faPhone, chat: faUser } }),
    },
    {
      title: 'Disabled and invalid',
      code: `<div class="grid max-w-sm gap-4">
  <RadioCardGroup default-value="a" aria-label="With a disabled option">
    <RadioCard value="a" title="Available" />
    <RadioCard value="b" title="Sold out" description="Not selectable." disabled />
  </RadioCardGroup>
  <RadioCardGroup invalid aria-label="Invalid group">
    <RadioCard value="a" title="Pick one" description="Selection is required." />
    <RadioCard value="b" title="Or this one" />
  </RadioCardGroup>
</div>`,
    },
  ],
  a11y: [
    'The group has `role="radiogroup"`; name it with `aria-label` / `aria-labelledby`, or wrap it in a `Field`, whose label then names the group through `aria-labelledby`.',
    'Each card is a native `<input type="radio">` (visually hidden, focusable) inside a `<label>`; cards share one `name`, so browsers and form submission treat them as one group.',
    'ArrowDown/ArrowRight select and focus the next enabled card, ArrowUp/ArrowLeft the previous (looping unless `loop=false`); Home/End jump to the first/last enabled card; disabled cards are skipped.',
    'Tab enters the group at the checked card (native radio behaviour) and leaves it with the next Tab.',
    'Inputs are `aria-labelledby` the title and `aria-describedby` the description; `invalid` sets `aria-invalid` on the group and on each input.',
    'Tones and the stacked layout change only classes: the radios, names, roving keyboard behaviour and description wiring are identical. The filled dot in the indicator carries the state, the tone colour is an addition.',
    'Forced-colors mode: the focus ring becomes an outline, the checked card gets a system-colour border and the indicator a system-colour fill.',
    'Responsive: one column below `sm`, so cards never overflow at 320px.',
  ],
  related: ['CheckboxCard', 'RadioGroup', 'SegmentedControl', 'Field'],
  requires: [
    'Throws a ContractError when a `RadioCard` is not inside a `RadioCardGroup`.',
    'Throws a ContractError when a `RadioCard` has no accessible name: no title, description or slot text, `aria-label` or `aria-labelledby` (an icon alone does not count).',
    'Throws a ContractError when `RadioCardGroup` has no accessible name: no `Field` label, `Fieldset` legend, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when a `RadioCard` has a missing or empty `value`, or a `value` another card in the group already uses.',
  ],
  llmNotes: [
    'Always wrap RadioCard in RadioCardGroup; a bare RadioCard is inert and raises a ContractError.',
    'Bind v-model on the group (string), never on the cards; every card needs a unique non-empty `value`.',
    'Label the group with aria-label/aria-labelledby or wrap it in Field.',
    'Use `columns` (1-4) on the group for grids; use `variant` (outline|filled), `size` (sm|md|lg), `tone` (primary|success|danger|neutral|info) and `layout` (default|stacked) on the group so all cards match.',
    'Extra attrs (aria-*, id, data-*) land on the native input; use `class` for root styling.',
  ],
  replaces: ['custom radio tile / plan picker components'],
}

export default doc
