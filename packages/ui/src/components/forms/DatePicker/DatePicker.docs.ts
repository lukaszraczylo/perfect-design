import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'DatePicker',
  group: 'forms',
  subgroup: 'Date & time',
  summary: 'Input-like button that opens a dropdown Calendar to pick a single date, formatted with Intl.',
  description:
    'Use `DatePicker` for one date in a form (birthday, due date, start date) when a polished, localised calendar is wanted. Use `DateRangePicker` for a start/end pair, `Calendar` for an always-visible calendar, and `DateInput` for a plain native date field. ' +
    'v-model is `Date | null` (local midnight). The trigger shows the value formatted with `Intl.DateTimeFormat` (`locale` + `format`) or the placeholder. The dropdown is absolutely positioned under the trigger (no portal): it closes on outside pointer-down, Escape (focus returns to the trigger), focus leaving, and after a day is picked. Clearing is opt-in with `clearable`. ' +
    'Inside a `Field` the trigger receives the label id, description and invalid state automatically. `class` and extra attributes go to the trigger button.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'Date | null', description: 'v-model. Invalid dates and non-Date values count as empty. Uncontrolled when omitted.' },
    { name: 'placeholder', type: 'string', default: "'Pick a date'", description: 'Text shown while empty.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for calendar names and the displayed value. Unknown tags fall back to the runtime default.' },
    { name: 'format', type: 'Intl.DateTimeFormatOptions', default: "{ dateStyle: 'medium' }", description: 'How the value is displayed. Invalid option combinations fall back to a default format.' },
    { name: 'min', type: 'Date', description: 'Earliest selectable day.' },
    { name: 'max', type: 'Date', description: 'Latest selectable day.' },
    { name: 'isDateDisabled', type: '(date: Date) => boolean', description: 'Return true to disable a day.' },
    { name: 'weekStart', type: 'number', description: 'First weekday 0 (Sunday) - 6 (Saturday). Default from the locale.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear button while a value is set (hidden when disabled/readonly).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger. Also inherited from a surrounding Field. Closes an open dropdown.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the value; the dropdown cannot be opened and the value cannot be cleared.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Adds a visually hidden `requiredLabel` to the trigger description (`aria-required` is not allowed on a button). Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height (and calendar size): `xs` 28px, `sm` 32px, `md` 36px, `lg` 44px. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Trigger surface. `filled` fills with the muted token, `underline` keeps only a bottom border (thicker on focus), `ghost` hides the border until hover or focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Trigger corners. `underline` is always square. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour on the border plus an icon; `success` and `warning` add visually hidden text linked through `aria-describedby`, `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', description: 'Hidden text of the success and warning icons. Defaults to the English text (translate it).' },
    { name: 'open', type: 'boolean', description: 'v-model:open. Controls the dropdown; uncontrolled when omitted.' },
    { name: 'align', type: "'start' | 'end'", default: "'start'", description: 'Which trigger edge the dropdown aligns to. Use `end` for pickers near the right edge.' },
    { name: 'clearLabel', type: 'string', default: "'Clear date'", description: 'aria-label of the clear button.' },
    { name: 'requiredLabel', type: 'string', default: "'Required'", description: 'Visually hidden description announced with the trigger while `required` (translate it).' },
    { name: 'dialogLabel', type: 'string', default: "'Choose date'", description: 'aria-label of the dropdown dialog.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the trigger button with tailwind-merge.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: Date | null]', description: 'A different day was picked, or the value was cleared (null).' },
    { name: 'update:open', payload: '[open: boolean]', description: 'The dropdown asked to open or close.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: 'const date = ref(null)',
      code: `<div class="grid min-h-96 max-w-xs content-start gap-2">
  <DatePicker v-model="date" aria-label="Date" />
  <p class="text-sm text-muted-foreground">{{ date ? date.toDateString() : 'No date chosen' }}</p>
</div>`,
      state: () => ({ date: ref<Date | null>(null) }),
    },
    {
      title: 'In a Field, clearable, with limits',
      description: 'Only future dates, no weekends; invalid state comes from the Field error.',
      script: `const today = new Date()
const weekend = (d) => d.getDay() === 0 || d.getDay() === 6
const due = ref(null)`,
      code: `<Field class="min-h-96 max-w-xs content-start" label="Due date" hint="Weekdays only." :error="due ? '' : 'Choose a due date'" required>
  <DatePicker v-model="due" clearable :min="today" :is-date-disabled="weekend" />
</Field>`,
      state: () => ({
        today: new Date(),
        weekend: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
        due: ref<Date | null>(null),
      }),
    },
    {
      title: 'Format and locale',
      script: 'const date = ref(new Date(2024, 1, 29))',
      code: `<div class="grid max-w-xs gap-2">
  <DatePicker v-model="date" locale="de-DE" :format="{ dateStyle: 'full' }" :week-start="1" aria-label="Datum" />
  <DatePicker v-model="date" locale="en-US" :format="{ year: 'numeric', month: '2-digit', day: '2-digit' }" aria-label="Date" />
</div>`,
      state: () => ({ date: ref(new Date(2024, 1, 29)) }),
    },
    {
      title: 'Sizes and states',
      code: `<div class="grid max-w-xs gap-2">
  <DatePicker size="xs" aria-label="Extra small" />
  <DatePicker size="sm" aria-label="Small" />
  <DatePicker aria-label="Medium" />
  <DatePicker size="lg" aria-label="Large" />
  <DatePicker disabled aria-label="Disabled" :model-value="new Date(2024, 4, 1)" />
  <DatePicker readonly aria-label="Read only" :model-value="new Date(2024, 4, 1)" />
  <DatePicker invalid aria-label="Invalid" />
</div>`,
    },
    {
      title: 'Variants, shapes and status',
      description: 'The same variant, shape and status values every text field accepts. Status adds an icon, and success and warning add hidden text; colour is never the only signal.',
      code: `<div class="grid max-w-xs gap-2">
  <DatePicker variant="outline" aria-label="Outline" />
  <DatePicker variant="filled" aria-label="Filled" />
  <DatePicker variant="underline" aria-label="Underline" />
  <DatePicker variant="ghost" aria-label="Ghost" />
  <DatePicker shape="pill" aria-label="Pill" />
  <DatePicker shape="square" aria-label="Square" />
  <DatePicker status="success" aria-label="Success" :model-value="new Date(2024, 4, 1)" />
  <DatePicker status="warning" aria-label="Warning" :model-value="new Date(2024, 4, 1)" />
  <DatePicker status="error" aria-label="Error" clearable :model-value="new Date(2024, 4, 1)" />
</div>`,
    },
  ],
  a11y: [
    'The trigger is a button with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` (set while open). Its name is built with `aria-labelledby`: the label source (`Field` label, your `aria-label`, or your own `aria-labelledby`) followed by the visible value, so the visible text is always part of the accessible name.',
    'Always give the trigger a label through `Field`, `aria-label` or `aria-labelledby`.',
    '`required` is exposed as a visually hidden description (`requiredLabel`) because `aria-required` is not allowed on a button. `invalid` sets `aria-invalid`, and a `Field` error is linked through `aria-describedby`.',
    'Enter, Space or a click toggles the dropdown; ArrowDown opens it. Focus moves to the selected (or today) day. Escape closes and returns focus to the trigger; Tab out of the picker closes it; picking a day closes it and returns focus to the trigger.',
    'The dropdown is a `role="dialog"` containing the Calendar, so all Calendar keyboard behaviour (arrows, PageUp/PageDown, Home/End) and its month-change live region apply.',
    'The clear button is a real button named by `clearLabel`, 24px square, with the shared focus ring.',
    '`status` never relies on colour: an icon sits at the inline end, `success` and `warning` add visually hidden text referenced by `aria-describedby`, and `error` sets `aria-invalid`. `underline` and `ghost` keep a visible focus indicator (a thicker bottom border, or the border and ring) and draw a border in forced-colors mode.',
    'Responsive: the trigger text is 16px below `md` (no iOS zoom) and 14px from `md`, with a 44px minimum height on touch pointers. Below `sm` the dropdown is as wide as the trigger (at least 276px); from `sm` it is as wide as its content. Use `align="end"` near the right edge.',
  ],
  related: ['DateRangePicker', 'Calendar', 'DateInput', 'Field'],
  requires: [
    'Throws a ContractError when the trigger has no label source: no `Field` label, wrapping or `for` label, `aria-label`, or `aria-labelledby` pointing at text (the value or placeholder shown in the trigger does not count).',
    'Throws a ContractError when `dialogLabel` is blank, or `clearLabel` is blank while `clearable` is set.',
  ],
  llmNotes: [
    'Use `v-model` with `Date | null`; never mutate the Date in place.',
    'Wrap in `Field` with a label; add `clearable` for optional dates.',
    'Restrict dates with `min`/`max`/`isDateDisabled`, not by validating after the fact.',
    'Use `locale` and `format` for display; do not format the Date yourself for the trigger text.',
    'Use `DateRangePicker` for start/end pairs instead of two DatePickers.',
  ],
  replaces: [],
}
export default doc
