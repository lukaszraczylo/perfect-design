import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'DateInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Styled native date, time, datetime-local or month input with min/max validation messaging, variants, sizes, shapes and status.',
  description:
    'Wraps the browser-native picker (`type="date" | "time" | "datetime-local" | "month"`) in the shared field surface. `v-model` is the ISO string the native input produces (`2024-05-01`, `13:30`, `2024-05-01T13:30`, `2024-05`; empty string when cleared). When the value falls outside `min`/`max` (compared as ISO strings) the field gets `aria-invalid`, an inline message is shown and `invalid` / `validate` events fire. The value is still emitted, so the parent decides whether to block submission. Build a custom calendar popover if you need ranges or presets; use this for fast, accessible, mobile-friendly entry.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'ISO value matching `type`. Empty string / null = no value.' },
    { name: 'type', type: "'date' | 'time' | 'datetime-local' | 'month'", default: "'date'", description: 'Native input type; also determines the ISO format of value, min and max.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`), border on hover and fill on focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height: 28, 32, 36 and 44px. Text stays 16px below `md` and touch pointers get a 44px target. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon after the native picker button. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`. An out-of-range value is still invalid whatever the status.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'min', type: 'string', description: 'Lowest allowed ISO value. Forwarded natively and used for validation messaging.' },
    { name: 'max', type: 'string', description: 'Highest allowed ISO value.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input; changes are ignored.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the value but blocks changes.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required attribute.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Marks the field invalid regardless of min/max (no message is shown).' },
    { name: 'messages', type: '{ min?: string; max?: string }', default: "'Must be on or after {min}' / 'Must be on or before {max}'", description: 'Custom out-of-range messages; `{min}` and `{max}` are replaced with the limits.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the <input>; wins over internal classes. Other attributes (name, id, aria-*) go to the <input>.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Fires on every user change with the ISO string (even when outside min/max).' },
    { name: 'validate', payload: "[result: { valid: boolean; reason: 'min' | 'max' | null; message: string | null; value: string }]", description: 'Fires after every user change with the validation result. Empty values are valid.' },
    { name: 'invalid', payload: "[result: { valid: false; reason: 'min' | 'max'; message: string; value: string }]", description: 'Fires only when the value is outside min/max.' },
  ],
  examples: [
    {
      title: 'Date with range',
      script: `const date = ref('2024-06-15')`,
      code: `<Field label="Start date" class="w-56">
  <DateInput v-model="date" min="2024-01-01" max="2024-12-31" />
</Field>`,
      state: () => ({ date: ref('2024-06-15') }),
    },
    {
      title: 'Custom message and validation event',
      script: `const when = ref('2023-01-01')
const status = ref('')`,
      code: `<div class="flex w-56 flex-col gap-2">
  <DateInput
    v-model="when"
    min="2024-01-01"
    :messages="{ min: 'Pick a date from {min} onwards' }"
    aria-label="Event date"
    @validate="status = $event.valid ? 'valid' : $event.reason"
  />
  <p class="text-sm text-muted-foreground">Last validation: {{ status || 'n/a' }}</p>
</div>`,
      state: () => ({ when: ref('2023-01-01'), status: ref('') }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="flex w-56 flex-col gap-3">
  <DateInput model-value="2024-05-01" variant="outline" aria-label="Outline date" />
  <DateInput model-value="2024-05-01" variant="filled" aria-label="Filled date" />
  <DateInput model-value="2024-05-01" variant="underline" aria-label="Underline date" />
  <DateInput model-value="2024-05-01" variant="ghost" aria-label="Ghost date" />
  <DateInput model-value="2024-05-01" shape="pill" aria-label="Pill date" />
  <DateInput model-value="2024-05-01" shape="square" aria-label="Square date" />
  <DateInput model-value="2024-05-01" size="xs" aria-label="Extra small date" />
  <DateInput model-value="2024-05-01" size="lg" aria-label="Large date" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits after the native picker button; success and warning add screen reader text.',
      code: `<div class="flex w-56 flex-col gap-3">
  <DateInput model-value="2024-05-01" status="success" aria-label="Valid date" />
  <DateInput model-value="2024-12-31" status="warning" aria-label="Date near the end of the range" />
  <DateInput model-value="2024-05-01" status="error" aria-label="Unavailable date" />
</div>`,
    },
    {
      title: 'Time and month',
      script: `const time = ref('09:30')
const month = ref('2024-05')`,
      code: `<div class="flex w-56 flex-col gap-3">
  <DateInput v-model="time" type="time" min="08:00" max="18:00" aria-label="Meeting time" />
  <DateInput v-model="month" type="month" aria-label="Billing month" />
  <DateInput model-value="2024-01-01" readonly aria-label="Locked date" />
</div>`,
      state: () => ({ time: ref('09:30'), month: ref('2024-05') }),
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`). The icon is not focusable and does not cover the native picker button.',
    '`underline` and `ghost` keep a visible focus indicator (a thicker bottom border, or a border and ring); forced-colors mode draws borders in system colours.',
    'Native picker: keyboard entry (Arrow keys move between segments, typing fills them, Backspace clears one) and screen-reader semantics come from the browser. Give it a label through `Field` or `aria-label`.',
    'The out-of-range message lives in one persistent `role="status"` region that is empty and visually hidden while the value is valid, so the text is announced when it appears. While it has text, the input gets `aria-invalid="true"` and `aria-describedby` points at it, appended to any `Field` description or your own `aria-describedby`.',
    'Inside `Field` the field id, hint/error description and invalid/disabled state are applied.',
    'Responsive: text is 16px below `md` (no iOS zoom) and 14px from `md`, with a 44px minimum height on touch pointers. The input is `min-w-0` and fills its container, so it never overflows at 320px. The control follows the dark colour-scheme.',
  ],
  related: ['Input', 'Field', 'InputGroup', 'NativeSelect'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby`.',
  ],
  llmNotes: [
    'v-model is an ISO string matching `type`, never a Date object.',
    'min/max must use the same ISO format as `type` (e.g. `08:00` for time, `2024-05` for month).',
    'Out-of-range values are still emitted. Block submission yourself using @invalid or the `validate` event.',
    'Attributes (name, id, aria-label) land on the inner <input>.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`. The min/max message stays automatic.',
  ],
  replaces: ['<input type="date"> usages', 'ad-hoc date text inputs'],
}
export default doc
