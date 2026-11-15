import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'
import { faEnvelope, faPhone, faUser } from '../../../lib/icons'

const cardProps = [
  { name: 'modelValue', type: 'boolean', description: 'v-model checked state. Omit for uncontrolled use. Ignored when inside a `CheckboxCardGroup` and `value` is set.' },
  { name: 'defaultValue', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  { name: 'value', type: 'string', description: 'Value used by a surrounding `CheckboxCardGroup` (and submitted with the form). Required for group membership.' },
  { name: 'title', type: 'string', description: 'Title text. Use the `title` slot for rich content.' },
  { name: 'description', type: 'string', description: 'Description text. Use the `description` slot for rich content.' },
  { name: 'icon', type: 'IconDefinition', description: 'Icon shown before the text. Use the `icon` slot for anything else.' },
  { name: 'variant', type: "'outline' | 'filled'", default: "'outline'", description: 'Surface style. Inherits the group variant when unset; unknown values fall back to `outline`.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size. Inherits the group size when unset.' },
  { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the checked state: border, tint, icon and indicator. `neutral` uses foreground on background. Inherits the group tone when unset; unknown values fall back to `primary`.' },
  { name: 'layout', type: "'default' | 'stacked'", default: "'default'", description: '`default` puts the icon, text and indicator in one row; `stacked` puts the icon above the text and the indicator in the top end corner. Inherits the group layout when unset.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the native input and dims the card. Also inherited from a group or Field.' },
  { name: 'required', type: 'boolean', default: 'false', description: 'Sets `required` on the native input. Also inherited from a Field.' },
  { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and a destructive border. Also inherited from a group or Field error.' },
  { name: 'name', type: 'string', description: 'Form field name. Inherits the group name when unset.' },
  { name: 'class', type: 'string | object | array', description: 'Merged last on the root `<label data-slot="checkbox-card">`; wins over internal classes.' },
]

const doc: ComponentDoc = {
  name: 'CheckboxCard',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Selectable card tile backed by a native checkbox, with title, description, icon slots, variants, tones, a stacked layout and a group for multi-select lists.',
  description:
    'Use `CheckboxCard` when a boolean (or multi-select) choice deserves more room than a plain `Checkbox`: plan add-ons, notification channels, feature toggles with an explanation. Standalone it works with `v-model` (boolean). Wrap several in `CheckboxCardGroup` and give each a `value` to bind a `string[]`. The native `<input type="checkbox">` is visually hidden (sr-only) so keyboard, screen readers, form submission and `:focus-visible` rings all work natively; the whole card is the click target. Use `RadioCard` when exactly one option can be chosen, and `Checkbox` for compact lists. Any extra attribute (`aria-label`, `id`, `data-*`, listeners) is forwarded to the native input, not the label root.',
  status: 'stable',
  parts: [
    {
      name: 'CheckboxCardGroup',
      description:
        'Grid wrapper (`role="group"`) that owns a `string[]` v-model for its cards (match by `value`), propagates `disabled`, `invalid`, `variant`, `size`, `tone`, `layout`, `name` and lays cards out in 1-4 columns. Label it with `aria-label` / `aria-labelledby` or wrap it in a `Field`.',
      props: [
        { name: 'modelValue', type: 'string[]', description: 'Selected values. Omit for uncontrolled use. Non-arrays are treated as empty; duplicates and non-strings are dropped.' },
        { name: 'defaultValue', type: 'string[]', default: '[]', description: 'Initial selection when uncontrolled.' },
        { name: 'columns', type: '1 | 2 | 3 | 4', default: '1', description: 'Grid columns from the `sm` breakpoint up (2 on `sm`, 3-4 on `lg`). Invalid values fall back to 1.' },
        { name: 'variant', type: "'outline' | 'filled'", description: 'Default variant for cards.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Default size for cards.' },
        { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", description: 'Default tone for cards. A card with its own `tone` wins.' },
        { name: 'layout', type: "'default' | 'stacked'", description: 'Default layout for cards. A card with its own `layout` wins.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every card.' },
        { name: 'invalid', type: 'boolean', default: 'false', description: 'Marks the group and every card invalid.' },
        { name: 'name', type: 'string', description: 'Form field name shared by all cards.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last on the group root.' },
      ],
    },
  ],
  props: cardProps,
  slots: [
    { name: 'default', props: '{ checked: boolean }', description: 'Extra content below the description (e.g. a price).' },
    { name: 'title', props: '{ checked: boolean }', description: 'Rich title; replaces the `title` prop text.' },
    { name: 'description', props: '{ checked: boolean }', description: 'Rich description; replaces the `description` prop text.' },
    { name: 'icon', props: '{ checked: boolean }', description: 'Custom leading icon/illustration; replaces the `icon` prop.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: boolean]', description: 'Emitted when the user toggles the card (also inside a group, alongside the group update).' },
    { name: 'CheckboxCardGroup: update:modelValue', payload: '[value: string[]]', description: 'Emitted by the group with the new array of selected values.' },
  ],
  examples: [
    {
      title: 'Basic (boolean v-model)',
      script: 'const newsletter = ref(false)',
      code: `<div class="grid max-w-sm gap-2">
  <CheckboxCard v-model="newsletter" title="Newsletter" description="Product news, once a month." />
  <p class="text-sm text-muted-foreground">Subscribed: {{ newsletter }}</p>
</div>`,
      state: () => ({ newsletter: ref(false) }),
    },
    {
      title: 'Group with icons (string[] v-model)',
      script: `const channels = ref(['email'])
const icons = { email: faEnvelope, sms: faPhone, app: faUser }`,
      code: `<div class="grid max-w-2xl gap-2">
  <CheckboxCardGroup v-model="channels" :columns="3" aria-label="Notification channels">
    <CheckboxCard value="email" title="Email" description="Once a day" :icon="icons.email" />
    <CheckboxCard value="sms" title="SMS" description="Urgent only" :icon="icons.sms" />
    <CheckboxCard value="app" title="In-app" description="As it happens" :icon="icons.app" />
  </CheckboxCardGroup>
  <p class="text-sm text-muted-foreground">Selected: {{ channels.join(', ') || 'none' }}</p>
</div>`,
      state: () => ({ channels: ref(['email']), icons: { email: faEnvelope, sms: faPhone, app: faUser } }),
    },
    {
      title: 'Variant: filled',
      script: 'const on = ref(true)',
      code: `<div class="max-w-sm">
  <CheckboxCard v-model="on" variant="filled" title="Filled card" description="Muted surface instead of a bordered one." />
</div>`,
      state: () => ({ on: ref(true) }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-sm gap-3">
  <CheckboxCard size="sm" title="Small" description="Compact padding" />
  <CheckboxCard size="md" title="Medium" description="Default padding" />
  <CheckboxCard size="lg" title="Large" description="Roomy padding" />
</div>`,
    },
    {
      title: 'Tones',
      description: 'The checked border, tint, icon and indicator follow the tone. The indicator always shows a check mark as well, so the state does not depend on colour.',
      code: `<div class="grid max-w-2xl gap-3 sm:grid-cols-2">
  <CheckboxCard tone="primary" default-value title="Primary" description="The default tone." />
  <CheckboxCard tone="success" default-value title="Success" description="Sample confirmation choice." />
  <CheckboxCard tone="danger" default-value title="Danger" description="Sample destructive choice." />
  <CheckboxCard tone="neutral" default-value title="Neutral" description="Foreground on background." />
  <CheckboxCard tone="info" default-value title="Info" description="Sample informational choice." />
</div>`,
    },
    {
      title: 'Stacked layout',
      description: 'The icon sits above the text and the indicator moves to the top end corner. Set `layout` on the group to apply it to every card.',
      script: "const picked = ref(['email'])\nconst icons = { email: faEnvelope, sms: faPhone, app: faUser }",
      code: `<CheckboxCardGroup v-model="picked" layout="stacked" tone="info" :columns="3" aria-label="Stacked channels" class="max-w-2xl">
  <CheckboxCard value="email" title="Email" description="Once a day" :icon="icons.email" />
  <CheckboxCard value="sms" title="SMS" description="Urgent only" :icon="icons.sms" />
  <CheckboxCard value="app" title="In-app" description="As it happens" :icon="icons.app" />
</CheckboxCardGroup>`,
      state: () => ({ picked: ref(['email']), icons: { email: faEnvelope, sms: faPhone, app: faUser } }),
    },
    {
      title: 'Disabled and invalid',
      code: `<div class="grid max-w-sm gap-3">
  <CheckboxCard disabled default-value title="Disabled" description="Cannot be changed." />
  <CheckboxCard invalid title="Invalid" description="You must accept to continue." />
</div>`,
    },
    {
      title: 'Rich slots',
      code: `<div class="max-w-sm">
  <CheckboxCard value="pro">
    <template #title="{ checked }">Sample plan <span class="text-xs text-muted-foreground">{{ checked ? '(selected)' : '' }}</span></template>
    <template #description>Sample description text for this option.</template>
    <span class="text-sm font-semibold">Sample detail</span>
  </CheckboxCard>
</div>`,
    },
  ],
  a11y: [
    'The native `<input type="checkbox">` carries the semantics (role checkbox, checked state, form submission); it is visually hidden but focusable and the whole card is its label.',
    'Space toggles when focused; `:focus-visible` shows a ring on the card via `has-focus-visible`.',
    'The input is `aria-labelledby` the title and `aria-describedby` the description when present. With no title, pass `aria-label` (forwarded to the input).',
    '`CheckboxCardGroup` has `role="group"`: give it `aria-label` / `aria-labelledby`, or wrap it in a `Field`, whose label then names the group through `aria-labelledby` (hint and error go to `aria-describedby`). `aria-invalid` is not allowed on a group, so the invalid state is on each card input.',
    'Tones and the stacked layout change only classes: the native input, its name and description wiring and the keyboard behaviour are identical. The check mark in the indicator carries the state, the tone colour is an addition.',
    'Forced-colors mode: the focus ring becomes an outline, the checked card gets a system-colour border and the indicator a system-colour fill, and an invalid card a dashed border.',
    'The check indicator is `aria-hidden`; state is exposed through the native `checked` property and `data-state`.',
  ],
  related: ['RadioCard', 'Checkbox', 'Switch', 'Field'],
  requires: [
    'Throws a ContractError when a `CheckboxCard` has no accessible name: no title, description or slot text, `aria-label` or `aria-labelledby` (an icon alone does not count).',
    'Throws a ContractError when `CheckboxCardGroup` has no accessible name: no `Field` label, `Fieldset` legend, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when a `CheckboxCard` inside a `CheckboxCardGroup` has a missing or empty `value`, or a `value` another card in the group already uses.',
  ],
  llmNotes: [
    'Use CheckboxCard for rich multi-select options; use Checkbox for plain compact ones.',
    'Always set `value` on each card inside CheckboxCardGroup; bind a string[] to the group, not to the cards.',
    'Label the group with aria-label/aria-labelledby (or wrap in Field); pass aria-label on cards that have no title.',
    'Extra attrs (aria-*, id, data-*) land on the native input, not on the label root; use `class` for root styling.',
    'Use `variant` (outline|filled), `size` (sm|md|lg), `tone` (primary|success|danger|neutral|info) and `layout` (default|stacked); on the group they cascade to cards unless a card overrides.',
    'Use `tone="danger"` for choices with a cost or risk, not for validation errors: errors use `invalid`.',
  ],
  replaces: ['custom bordered checkbox tiles / plan pickers'],
}

export default doc
