import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Switch',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'On/off toggle for settings that take effect immediately, with optional label and description, sizes, tones and on/off icons.',
  description:
    'Use `Switch` for binary settings that apply right away (notifications, dark mode, feature flags). Use `Checkbox` when the choice is submitted later with a form or when several can be selected from a list. Give it a name with the `label` prop (or slot), which renders a `<label>` beside the switch, or place it in a `Field` (`orientation="horizontal"` is the idiomatic row layout), or set `aria-label`. `description` adds helper text under the label, `labelPosition="start"` moves the label before the switch, `tone` recolours the on state and `showIcons` draws a check or cross on the thumb. Works controlled (`v-model`) and uncontrolled (`default-value`).',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'boolean | null', description: 'v-model value. Uncontrolled when omitted; `null` renders as off.' },
    { name: 'defaultValue', type: 'boolean', description: 'Initial state when uncontrolled.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Track and thumb size (28x16 / 36x20 / 44x24 px); the hit area is always at least 24px tall. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'primary' | 'success' | 'danger' | 'neutral' | 'info'", default: "'primary'", description: 'Colour of the on track. The off track is the same for every tone and the thumb always moves, so the state never rests on colour. Unknown values fall back to `primary`.' },
    { name: 'showIcons', type: 'boolean', default: 'false', description: 'Draws a check on the thumb when on and a cross when off. The glyphs are decorative (`aria-hidden`); the name and `aria-checked` carry the state for assistive technology.' },
    { name: 'onLabel', type: 'string', description: 'Short text inside the track while on (for example "On"). Decorative and `aria-hidden`: the accessible name stays the label and the state stays `aria-checked`. The track widens to hold it (56px at `md`, 64px at `lg`) and the off track becomes muted with an input border, so the text uses the tested tone-foreground and muted-foreground pairs. `sm` ignores it. About three characters fit; longer text is clipped.' },
    { name: 'offLabel', type: 'string', description: 'Short text inside the track while off (for example "Off"). Same rules as `onLabel`. Either one can be used alone; the track still widens.' },
    { name: 'label', type: 'string', description: 'Text rendered in a `<label for>` beside the switch. Use the `label` slot for rich content. Without a label the switch renders as the bare control, as before.' },
    { name: 'description', type: 'string', description: 'Helper text under the label, referenced from the switch through `aria-describedby` (merged with Field hint and error ids). Shown only together with a label. Use the `description` slot for rich content.' },
    { name: 'labelPosition', type: "'end' | 'start'", default: "'end'", description: 'Side of the label in reading order. `start` puts it before the switch and flips in right-to-left layouts. Only has an effect when a label is shown.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the switch. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required`. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"`. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; a hidden input is rendered when inside a `<form>`.' },
    { name: 'value', type: 'string', description: 'Value submitted with the form when on.' },
    { name: 'id', type: 'string', description: 'Control id. Falls back to the surrounding Field id, then (with a label) a generated one. The label `for` always matches.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the track (`data-slot="switch"`); wins over internal classes.' },
  ],
  slots: [
    { name: 'label', description: 'Rich label content; replaces the `label` prop text.' },
    { name: 'description', description: 'Rich helper text under the label; replaces the `description` prop. Needs a label to be shown.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: boolean]', description: 'Emitted when the user toggles the switch.' }],
  examples: [
    {
      title: 'Basic',
      script: 'const on = ref(true)',
      code: `<div class="flex items-center gap-3">
  <Switch v-model="on" aria-label="Notifications" />
  <span class="text-sm">Notifications are {{ on ? 'on' : 'off' }}</span>
</div>`,
      state: () => ({ on: ref(true) }),
    },
    {
      title: 'Tones',
      description: 'On state per tone. Click each one: the thumb moves and the track changes in every tone.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Switch tone="primary" default-value aria-label="Primary" />
  <Switch tone="success" default-value aria-label="Success" />
  <Switch tone="danger" default-value aria-label="Danger" />
  <Switch tone="neutral" default-value aria-label="Neutral" />
  <Switch tone="info" default-value aria-label="Info" />
</div>`,
    },
    {
      title: 'On and off icons',
      description: '`showIcons` draws a check when on and a cross when off, in every size and tone.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Switch show-icons size="sm" default-value aria-label="Small with icons" />
  <Switch show-icons default-value aria-label="Medium with icons" />
  <Switch show-icons size="lg" tone="success" default-value aria-label="Large success with icons" />
  <Switch show-icons tone="danger" aria-label="Danger with icons, off" />
  <Switch show-icons tone="neutral" default-value aria-label="Neutral with icons" />
</div>`,
    },
    {
      title: 'On and off text',
      description: '`onLabel` and `offLabel` print a short word inside the track (md and lg). They are decorative: the name is the label, the state is `aria-checked`.',
      code: `<div class="flex flex-col gap-3">
  <Switch label="Sample notifications" on-label="On" off-label="Off" default-value />
  <Switch size="lg" tone="success" label="Sample sync" on-label="On" off-label="Off" />
  <Switch label="Sample alerts" on-label="Yes" />
</div>`,
    },
    {
      title: 'Right to left',
      description: 'The thumb and the text follow the reading direction. Sample content.',
      code: `<div dir="rtl" lang="ar" class="flex flex-col gap-3">
  <Switch label="الإشعارات" on-label="نعم" off-label="لا" default-value />
  <Switch label="المزامنة" show-icons />
</div>`,
    },
    {
      title: 'Label, description and label position',
      description: 'The `label` prop renders a `<label for>`; `description` is announced with the switch. Use `label-position="start"` for settings lists that read label first.',
      code: `<div class="grid max-w-sm gap-4">
  <Switch label="Sample setting A" description="Sample description text under the label." default-value />
  <Switch label="Sample setting B" description="Sample description, with the label shown first." label-position="start" tone="info" show-icons />
</div>`,
    },
    {
      title: 'Settings rows in a Field',
      script: 'const email = ref(true)\nconst sms = ref(false)',
      code: `<div class="grid max-w-sm gap-4">
  <Field label="Email alerts" hint="Weekly digest to your inbox." orientation="horizontal">
    <Switch v-model="email" />
  </Field>
  <Field label="SMS alerts" hint="Standard rates apply." orientation="horizontal">
    <Switch v-model="sms" />
  </Field>
</div>`,
      state: () => ({ email: ref(true), sms: ref(false) }),
    },
    {
      title: 'Sizes and states',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Switch size="sm" default-value aria-label="Small" />
  <Switch default-value aria-label="Medium" />
  <Switch size="lg" default-value aria-label="Large" />
  <Switch disabled default-value aria-label="Disabled" />
  <Switch invalid aria-label="Invalid" />
</div>`,
    },
  ],
  a11y: [
    'Button with `role="switch"` and `aria-checked`; Space and Enter toggle it, Tab moves on.',
    'The switch itself has no text: name it with `label` (a `<label for>` beside it), a Field label (`for`/`id` wiring) or `aria-label`. The state is the on or off value, not colour: the thumb also moves, and `showIcons` adds a check or cross.',
    '`description` is a `<p>` whose id is added to `aria-describedby` after any Field hint and error ids and an explicit `aria-describedby`; it is rendered only with a label. `labelPosition` changes visual order only; the switch stays first in the DOM, so reading and tab order are unchanged.',
    '`onLabel` / `offLabel` text is `aria-hidden`, so it never changes the accessible name; the state is still `aria-checked` and the thumb position. In forced-colors mode the text takes the system text colour on the system track. The thumb and text mirror in right-to-left layouts (the checked thumb moves towards the end side).',
    'Tones change colour only. Role, name and keyboard are identical for every variation; in forced-colors mode the track, thumb, border and glyphs use system colours and the thumb still moves.',
    'Inside a Field it receives `aria-describedby`, `aria-invalid` and disabled state automatically.',
    'Hit area is at least 24px tall through an invisible ::after (about 44px on touch pointers). Forced-colors mode uses system colours for the track, thumb and border; motion is removed under `prefers-reduced-motion`.',
  ],
  related: ['Checkbox', 'RadioGroup', 'Field', 'Label'],
  requires: [
    'Throws a ContractError when the switch has no accessible name: no `label` (prop or slot), `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby`.',
  ],
  llmNotes: [
    'Always label a Switch: pass `label`, or wrap in `Field` (prefer `orientation="horizontal"`), or pass `aria-label`.',
    'Use `description` for helper text (it needs a label) and `label-position="start"` to put the label first.',
    'Use `tone` (primary, success, danger, neutral, info) for the on colour and `show-icons` when the state must not rely on position and colour alone; do not recolour with classes.',
    'Use `v-model` with a boolean. Use Switch for immediate effects, Checkbox for deferred form values.',
    'Do not put text inside the Switch; it renders only the track and thumb (and an optional icon).',
  ],
  replaces: ['shadcn-vue Switch', 'hand-rolled Switch markup in app code'],
}
export default doc
