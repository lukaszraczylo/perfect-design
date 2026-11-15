import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'DateRangePicker',
  group: 'forms',
  subgroup: 'Date & time',
  summary: 'Input-like button that opens a dropdown Calendar to pick a start and end date, with an optional two-month view.',
  description:
    'Use `DateRangePicker` for a start/end pair (stay dates, report period, booking window). Use `DatePicker` for a single date and `Calendar mode="range"` for an inline calendar. ' +
    'v-model is `{ start, end } | null` with `start <= end`: the first click anchors the range, hovering previews it, and the second click completes it, emits `update:modelValue` and closes the dropdown. Clicking an earlier day second swaps the ends; a reversed incoming value is normalised for display. A one-day range displays as a single date. ' +
    'Behaviour matches `DatePicker`: absolutely positioned dropdown (no portal) that closes on outside pointer-down, Escape (the first Escape cancels a half-made range, the next closes and returns focus to the trigger) and focus leaving. `class` and extra attributes go to the trigger button.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: '{ start: Date; end: Date } | null', description: 'v-model. Wrong shapes and invalid dates count as empty. Uncontrolled when omitted.' },
    { name: 'placeholder', type: 'string', default: "'Pick a date range'", description: 'Text shown while empty.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for calendar names and the displayed value.' },
    { name: 'format', type: 'Intl.DateTimeFormatOptions', default: "{ dateStyle: 'medium' }", description: 'How each end is displayed. Invalid option combinations fall back to a default format.' },
    { name: 'min', type: 'Date', description: 'Earliest selectable day.' },
    { name: 'max', type: 'Date', description: 'Latest selectable day.' },
    { name: 'isDateDisabled', type: '(date: Date) => boolean', description: 'Return true to disable a day.' },
    { name: 'weekStart', type: 'number', description: 'First weekday 0 (Sunday) - 6 (Saturday). Default from the locale.' },
    { name: 'numberOfMonths', type: '1 | 2 | 3', default: '1', description: 'Months shown side by side in the dropdown (they wrap on narrow screens).' },
    { name: 'presets', type: '{ label: string; range: { start: Date; end: Date } }[]', description: 'Shortcut ranges shown as a button list beside the calendar (above it on narrow screens). Choosing one sets the range and closes the dropdown. A preset outside `min`/`max` is disabled; the one that matches the value has `aria-pressed="true"`.' },
    { name: 'presetsLabel', type: 'string', default: "'Presets'", description: 'Accessible name of the presets group (translate it).' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear button while a range is set (hidden when disabled/readonly).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger. Also inherited from a surrounding Field. Closes an open dropdown.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the range; the dropdown cannot be opened and the value cannot be cleared.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Adds a visually hidden `requiredLabel` to the trigger description (`aria-required` is not allowed on a button). Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height (and calendar size): `xs` 28px, `sm` 32px, `md` 36px, `lg` 44px. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Trigger surface. `filled` fills with the muted token, `underline` keeps only a bottom border (thicker on focus), `ghost` hides the border until hover or focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Trigger corners. `underline` is always square. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour on the border plus an icon; `success` and `warning` add visually hidden text linked through `aria-describedby`, `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', description: 'Hidden text of the success and warning icons. Defaults to the English text (translate it).' },
    { name: 'open', type: 'boolean', description: 'v-model:open. Controls the dropdown; uncontrolled when omitted.' },
    { name: 'align', type: "'start' | 'end'", default: "'start'", description: 'Which trigger edge the dropdown aligns to.' },
    { name: 'clearLabel', type: 'string', default: "'Clear date range'", description: 'aria-label of the clear button.' },
    { name: 'requiredLabel', type: 'string', default: "'Required'", description: 'Visually hidden description announced with the trigger while `required` (translate it).' },
    { name: 'dialogLabel', type: 'string', default: "'Choose date range'", description: 'aria-label of the dropdown dialog.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the trigger button with tailwind-merge.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: { start: Date; end: Date } | null]', description: 'A complete, normalised range was picked, or the value was cleared (null). Not emitted after only the first click.' },
    { name: 'update:open', payload: '[open: boolean]', description: 'The dropdown asked to open or close.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: 'const range = ref(null)',
      code: `<div class="grid min-h-96 max-w-sm content-start gap-2">
  <DateRangePicker v-model="range" aria-label="Date range" />
  <p class="text-sm text-muted-foreground">
    {{ range ? range.start.toDateString() + ' to ' + range.end.toDateString() : 'No range chosen' }}
  </p>
</div>`,
      state: () => ({ range: ref<{ start: Date; end: Date } | null>(null) }),
    },
    {
      title: 'Two months, clearable, in a Field',
      script: `const today = new Date()
const stay = ref(null)`,
      code: `<Field class="min-h-96 max-w-sm content-start" label="Stay" hint="Check-in to check-out." :error="stay ? '' : 'Choose your dates'" required>
  <DateRangePicker v-model="stay" :number-of-months="2" clearable :min="today" />
</Field>`,
      state: () => ({ today: new Date(), stay: ref<{ start: Date; end: Date } | null>(null) }),
    },
    {
      title: 'Preselected, localised',
      script: 'const range = ref({ start: new Date(2024, 1, 26), end: new Date(2024, 2, 3) })',
      code: `<DateRangePicker class="max-w-sm" v-model="range" locale="de-DE" :format="{ dateStyle: 'long' }" :week-start="1" aria-label="Zeitraum" />`,
      state: () => ({ range: ref({ start: new Date(2024, 1, 26), end: new Date(2024, 2, 3) }) }),
    },
    {
      title: 'Sizes and states',
      code: `<div class="grid max-w-sm gap-2">
  <DateRangePicker size="xs" aria-label="Extra small" />
  <DateRangePicker size="sm" aria-label="Small" />
  <DateRangePicker aria-label="Medium" />
  <DateRangePicker size="lg" aria-label="Large" />
  <DateRangePicker disabled aria-label="Disabled" />
  <DateRangePicker readonly aria-label="Read only" :model-value="{ start: new Date(2024, 4, 1), end: new Date(2024, 4, 7) }" />
  <DateRangePicker invalid aria-label="Invalid" />
</div>`,
    },
    {
      title: 'Presets',
      description: 'Shortcut ranges beside the calendar. The one that matches the current value is marked pressed.',
      script: `const day = (n) => new Date(2024, 1, n)
const range = ref({ start: day(5), end: day(11) })
const presets = [
  { label: 'First week of February', range: { start: day(1), end: day(7) } },
  { label: 'Second week of February', range: { start: day(5), end: day(11) } },
  { label: 'All of February', range: { start: day(1), end: day(29) } },
]`,
      code: `<div class="min-h-96 max-w-sm">
  <DateRangePicker v-model="range" :presets="presets" :number-of-months="2" locale="en-US" aria-label="Report period" />
</div>`,
      state: () => {
        const day = (n: number) => new Date(2024, 1, n)
        return {
          day,
          range: ref({ start: day(5), end: day(11) }),
          presets: [
            { label: 'First week of February', range: { start: day(1), end: day(7) } },
            { label: 'Second week of February', range: { start: day(5), end: day(11) } },
            { label: 'All of February', range: { start: day(1), end: day(29) } },
          ],
        }
      },
    },
    {
      title: 'Variants, shapes and status',
      description: 'The same variant, shape and status values every text field accepts. Status adds an icon, and success and warning add hidden text; colour is never the only signal.',
      code: `<div class="grid max-w-sm gap-2">
  <DateRangePicker variant="filled" aria-label="Filled" />
  <DateRangePicker variant="underline" aria-label="Underline" />
  <DateRangePicker variant="ghost" aria-label="Ghost" />
  <DateRangePicker shape="pill" aria-label="Pill" />
  <DateRangePicker shape="square" aria-label="Square" />
  <DateRangePicker status="success" aria-label="Success" />
  <DateRangePicker status="warning" aria-label="Warning" />
  <DateRangePicker status="error" aria-label="Error" />
</div>`,
    },
  ],
  a11y: [
    'The trigger is a button with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` (set while open). Its name is built with `aria-labelledby`: the label source (`Field` label, your `aria-label`, or your own `aria-labelledby`) followed by the visible range text, so the visible text is always part of the accessible name.',
    'Always give the trigger a label through `Field`, `aria-label` or `aria-labelledby`.',
    '`required` is exposed as a visually hidden description (`requiredLabel`) because `aria-required` is not allowed on a button. `invalid` sets `aria-invalid`, and a `Field` error is linked through `aria-describedby`.',
    'Enter, Space or a click toggles the dropdown; ArrowDown opens it with focus on the first selected (or today) day. The first Escape cancels a half-made range, the next closes and returns focus to the trigger; Tab out closes it. Completing the range closes the dropdown and returns focus to the trigger.',
    'The dropdown is a `role="dialog"` hosting the Calendar grid(s): arrows, PageUp/PageDown, Home/End and Enter/Space work as documented on Calendar. A polite live region announces the new month and the range start prompt. Range ends and in-between days are exposed via `data-range-start`, `data-range-end` and `data-in-range`, and get a border in forced-colors mode.',
    'The clear button is a real button named by `clearLabel`, 24px square, with the shared focus ring.',
    'Presets form a `role="group"` named by `presetsLabel`; each is a real button (at least 32px, 44px on touch) with `aria-pressed` for the current range and `disabled` when it lies outside `min`/`max`. Pressed also gets heavier text and a forced-colors border, so it is not colour only.',
    '`status` never relies on colour: an icon sits at the inline end, `success` and `warning` add visually hidden text referenced by `aria-describedby`, and `error` sets `aria-invalid`.',
    'Responsive: the trigger text is 16px below `md` and 14px from `md`, with a 44px minimum height on touch pointers. Below `sm` the dropdown is as wide as the trigger (at least 276px) and two months wrap onto separate rows; from `sm` it is as wide as its content.',
  ],
  related: ['DatePicker', 'Calendar', 'DateInput', 'Field'],
  requires: [
    'Throws a ContractError when the trigger has no label source: no `Field` label, wrapping or `for` label, `aria-label`, or `aria-labelledby` pointing at text (the range or placeholder shown in the trigger does not count).',
    'Throws a ContractError when `dialogLabel` is blank, or `clearLabel` is blank while `clearable` is set.',
    'Throws a ContractError when an entry of `presets` has a blank `label` or a `range` without two valid dates.',
  ],
  llmNotes: [
    'Use `v-model` with `{ start: Date, end: Date } | null`; the emitted range is always normalised (start <= end).',
    'Wrap in `Field` with a label; add `clearable` for optional ranges and `:number-of-months="2"` on wide layouts.',
    'The model only changes when both ends are picked; do not expect events after the first click.',
    'Restrict with `min`/`max`/`isDateDisabled`.',
    'Use `DatePicker` for a single date.',
  ],
  replaces: [],
}
export default doc
