import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'TimeInput',
  group: 'forms',
  subgroup: 'Date & time',
  summary: 'Segmented HH:mm time field with arrow-key stepping, digit typing, optional 12h AM/PM, min/max, minute step, variants, shapes and status.',
  description:
    'Use `TimeInput` to pick a time of day without a popover. The model is always a 24h `HH:mm` string (or `null` when empty), even in `hour12` mode. Each segment (hours, minutes, AM/PM) is a spinbutton: ArrowUp/ArrowDown step it (minutes move by `step`), digits type directly and auto-advance, Backspace clears, ArrowLeft/ArrowRight move between segments. `null` is emitted whenever a segment is empty; the value is re-emitted once complete. `min`/`max` clamp the result. For dates use `DateInput`; for durations or plain numbers use `NumberInput`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: '24h `HH:mm` (e.g. `"09:05"`). `null` or an invalid string shows empty segments. Uncontrolled when omitted.' },
    { name: 'hour12', type: 'boolean', default: 'false', description: 'Show hours 1-12 plus an AM/PM segment. The model stays 24h.' },
    { name: 'step', type: 'number', default: '1', description: 'Minutes moved by ArrowUp/ArrowDown on the minute segment (floored, clamped to 1..60). Typed minutes are not snapped.' },
    { name: 'min', type: 'string', description: 'Earliest `HH:mm`. Ignored when invalid or greater than `max`.' },
    { name: 'max', type: 'string', description: 'Latest `HH:mm`. Ignored when invalid or less than `min`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks interaction and removes segments from the tab order. Also inherited from a Field.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Segments stay focusable (arrow-left/right navigation) but cannot be edited.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required` on the segments. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` and the destructive ring. Also set by a Field with an error.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`), border on hover and fill while a segment has focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Field height: 28, 32, 36 and 44px. Text is 16px below the `md` breakpoint (no iOS focus zoom) and smaller from `md` up. On coarse pointers the field is at least 44px high (except `lg`, already 44px). Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon at the end. `success` and `warning` add visually hidden text referenced by the group `aria-describedby`; `error` also sets `aria-invalid="true"` on every segment. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'name', type: 'string', description: 'Renders a hidden input with the 24h value (empty while incomplete).' },
    { name: 'hourLabel', type: 'string', default: "'Hours'", description: 'Accessible name of the hour segment.' },
    { name: 'minuteLabel', type: 'string', default: "'Minutes'", description: 'Accessible name of the minute segment.' },
    { name: 'periodLabel', type: 'string', default: "'AM/PM'", description: 'Accessible name of the AM/PM segment.' },
    { name: 'adjustedLabel', type: 'string', default: "'Adjusted to'", description: 'Spoken through the polite live region when `min`/`max` moves the entered time (`Adjusted to 09:00`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string | null]', description: '24h `HH:mm` when both segments are filled (after min/max clamping); `null` when a segment is cleared. Duplicate values are not re-emitted.' }],
  examples: [
    {
      title: 'Basic (24h)',
      script: "const time = ref('09:30')",
      code: `<div class="grid gap-2">
  <TimeInput v-model="time" aria-label="Start time" />
  <p class="text-sm text-muted-foreground">Value: {{ time ?? 'empty' }}</p>
</div>`,
      state: () => ({ time: ref('09:30') }),
    },
    {
      title: '12-hour with AM/PM',
      description: 'Press A or P on the AM/PM segment, or use the arrow keys.',
      script: "const time = ref('15:45')",
      code: `<div class="grid gap-2">
  <TimeInput v-model="time" hour12 aria-label="Meeting time" />
  <p class="text-sm text-muted-foreground">Model stays 24h: {{ time }}</p>
</div>`,
      state: () => ({ time: ref('15:45') }),
    },
    {
      title: 'Step and range',
      description: 'Minutes move by 15 and the result is clamped to office hours.',
      script: "const time = ref('10:00')",
      code: `<TimeInput v-model="time" :step="15" min="09:00" max="17:30" aria-label="Appointment" />`,
      state: () => ({ time: ref('10:00') }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid justify-start gap-2">
  <TimeInput size="sm" model-value="08:00" aria-label="Small" />
  <TimeInput size="md" model-value="12:00" aria-label="Medium" />
  <TimeInput size="lg" model-value="18:30" aria-label="Large" />
</div>`,
    },
    {
      title: 'Disabled, readonly and invalid',
      code: `<div class="grid justify-start gap-2">
  <TimeInput disabled model-value="08:00" aria-label="Disabled" />
  <TimeInput readonly model-value="12:00" aria-label="Read only" />
  <TimeInput invalid model-value="23:59" aria-label="Invalid" />
</div>`,
    },
    {
      title: 'In a Field with validation',
      script: 'const time = ref(null)',
      code: `<Field label="Reminder" hint="Hours and minutes." :error="time ? '' : 'Pick a time'" required>
  <TimeInput v-model="time" />
</Field>`,
      state: () => ({ time: ref(null) }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="grid justify-items-start gap-3">
  <TimeInput model-value="09:30" variant="outline" aria-label="Outline time" />
  <TimeInput model-value="09:30" variant="filled" aria-label="Filled time" />
  <TimeInput model-value="09:30" variant="underline" aria-label="Underline time" />
  <TimeInput model-value="09:30" variant="ghost" aria-label="Ghost time" />
  <TimeInput model-value="09:30" shape="pill" aria-label="Pill time" />
  <TimeInput model-value="09:30" shape="square" aria-label="Square time" />
  <TimeInput model-value="09:30" size="xs" aria-label="Extra small time" />
  <TimeInput model-value="09:30" size="lg" aria-label="Large time" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Each status shows an icon; success and warning add screen reader text, error sets aria-invalid on the segments.',
      code: `<div class="grid justify-items-start gap-3">
  <TimeInput model-value="09:30" status="success" aria-label="Valid time" />
  <TimeInput model-value="23:30" status="warning" aria-label="Late time" />
  <TimeInput model-value="03:15" status="error" aria-label="Time outside opening hours" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by the group `aria-describedby`, and `error` sets `aria-invalid="true"` on every segment (pair it with a visible message in `Field`).',
    'Because the surface is a wrapper, the variants react to `focus-within`: `underline` thickens its bottom border and `ghost` fills while a segment has focus, and forced-colors mode keeps the outline.',
    'Root is `role="group"`; each segment is a `role="spinbutton"` with `aria-label`, `aria-valuemin/max/now` and `aria-valuetext` ("Empty" when unset). Segments are at least 24px square and each is a tab stop.',
    'Keyboard: ArrowUp/ArrowDown step, digits type, A/P set AM/PM, Backspace/Delete clear, Home/End jump to bounds, ArrowLeft/ArrowRight move between segments.',
    'A time moved by `min`/`max` is announced through a polite `role="status"` region ("Adjusted to 09:00"). The focused segment shows a filled highlight plus a forced-colors outline.',
    'Segments are not text inputs, so touch users get no on-screen keyboard: pair the field with presets or a native `type="time"` input where touch entry matters.',
    'Name the group with `aria-label` or `aria-labelledby` (fall through to the root). Inside `Field` the group is named from the Field label through `aria-labelledby` (a native label cannot name a span). `invalid`, `required`, `disabled` and `readonly` are mirrored on every segment.',
  ],
  related: ['DateInput', 'NumberInput', 'Field', 'InputGroup', 'PinInput'],
  requires: [
    'Throws a ContractError when the group has no accessible name: no `Field` label, `aria-label` or `aria-labelledby` (the named segments do not name the group).',
    'Throws a ContractError when `hourLabel` or `minuteLabel` is blank, or `periodLabel` is blank with `hour12`.',
  ],
  llmNotes: [
    'The model is always 24h "HH:mm" or null, even with `hour12`.',
    'Pass `min`/`max` as "HH:mm"; reversed or invalid bounds are ignored.',
    'Always add `aria-label` or wrap in Field with a label.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
    'Do not validate by regex yourself: `null` means incomplete.',
  ],
  replaces: ['native input type=time wrappers'],
}
export default doc
