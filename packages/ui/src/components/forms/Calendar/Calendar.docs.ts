import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Calendar',
  group: 'forms',
  subgroup: 'Date & time',
  summary: 'Accessible month grid with single, range or multiple day selection, min/max/disabled dates, locale names and full keyboard navigation.',
  description:
    'Use `Calendar` to show a month (or two) inline and let people pick days. It is the engine behind `DatePicker` and `DateRangePicker`; use those when the calendar should live in a dropdown attached to a field, and `DateInput` when a native date field is enough. ' +
    'The value depends on `mode`: `Date | null` for `single`, `{ start, end } | null` for `range` (a reversed range is normalised so `start <= end`), `Date[]` for `multiple` (sorted, de-duplicated). Emitted dates are at local midnight. Wrong shapes and invalid dates are treated as "nothing selected". ' +
    'In `range` mode the first click only sets an anchor (shown highlighted, with hover preview); `update:modelValue` fires when the second click completes the range. All date maths is native `Date`/`Intl` and DST/leap-year safe (it works on calendar days, never on 24h offsets).',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'Date | { start: Date; end: Date } | Date[] | null', description: 'v-model. Shape follows `mode`. Uncontrolled when omitted.' },
    { name: 'mode', type: "'single' | 'range' | 'multiple'", default: "'single'", description: 'Selection model. Unknown values behave as `single`.' },
    { name: 'month', type: 'Date', description: 'Visible (first) month; any day inside it. Pair with `@update:month` to control navigation. Invalid dates are ignored.' },
    { name: 'min', type: 'Date', description: 'Earliest selectable day (inclusive). Swapped with `max` if reversed.' },
    { name: 'max', type: 'Date', description: 'Latest selectable day (inclusive).' },
    { name: 'isDateDisabled', type: '(date: Date) => boolean', description: 'Predicate; return true to disable a day (weekends, holidays, booked days). Receives a Date at local midnight.' },
    { name: 'weekStart', type: 'number', description: 'First weekday, 0 = Sunday .. 6 = Saturday. Default comes from the locale (Intl.Locale week info), else Sunday. Invalid values use the default.' },
    { name: 'locale', type: 'string', description: 'BCP 47 tag used for month, weekday and day names/numerals. Unknown tags fall back to the runtime default.' },
    { name: 'numberOfMonths', type: '1 | 2 | 3', default: '1', description: 'Months shown at once (side by side, or stacked with `orientation="vertical"`). Any value other than 2 or 3 renders one month.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout of several months: `horizontal` wraps them side by side, `vertical` stacks them. Unknown values fall back to `horizontal`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner shape of the day buttons. Range ends keep a flat inner edge. Unknown values fall back to `rounded`.' },
    { name: 'weekNumbers', type: 'boolean', default: 'false', description: 'Adds a leading column with the ISO 8601 week number of each row (taken from the middle day of the row).' },
    { name: 'weekLabel', type: 'string', default: "'Week'", description: 'Accessible name of the week-number column header and, followed by the number, of each row header ("Week 9"). Translate it.' },
    { name: 'weekShort', type: 'string', default: "'Wk'", description: 'Visible text of the week-number column header. Translate it.' },
    { name: 'showHeading', type: 'boolean', default: 'true', description: 'Show the month/year title above each month (the grid keeps its aria-label either way).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every day and the month navigation.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Days stay focusable and emit `select` but never change the value; month navigation still works.' },
    { name: 'variant', type: "'default' | 'ghost' | 'outline'", default: "'default'", description: '`default` is a bordered card surface; `outline` keeps the border and padding on a transparent background; `ghost` has no border/background/padding (for use inside another surface). Unknown values fall back to `default`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell size and text size (sets `--calendar-cell`): `xs` 24px, `sm` 28px, `md` 36px, `lg` 44px (36px below the `sm` breakpoint). Unknown values fall back to `md`.' },
    { name: 'prevLabel', type: 'string', default: "'Previous month'", description: 'aria-label of the previous-month button (translate it).' },
    { name: 'nextLabel', type: 'string', default: "'Next month'", description: 'aria-label of the next-month button (translate it).' },
    { name: 'rangeStartMessage', type: 'string', default: "'Range start {date}. Choose the end date.'", description: 'Announced in a polite live region after the first click of a range. `{date}` is replaced with the full date (translate it).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: Date | { start: Date; end: Date } | Date[] | null]', description: 'The selection changed. In range mode only when the range is complete.' },
    { name: 'update:month', payload: '[value: Date]', description: 'The user moved the visible window (buttons, PageUp/PageDown, arrows across a month edge). Payload is the 1st of the first visible month.' },
    { name: 'select', payload: '[date: Date]', description: 'An enabled day was activated, even if the value did not change (re-click, readonly, first click of a range).' },
  ],
  examples: [
    {
      title: 'Single date',
      script: 'const date = ref(null)',
      code: `<div class="grid gap-2">
  <Calendar v-model="date" />
  <p class="text-sm text-muted-foreground">Selected: {{ date ? date.toDateString() : 'none' }}</p>
</div>`,
      state: () => ({ date: ref<Date | null>(null) }),
    },
    {
      title: 'Date range',
      description: 'First click anchors, hover previews, second click completes. Clicking an earlier day second swaps the ends.',
      script: 'const range = ref(null)',
      code: `<div class="grid gap-2">
  <Calendar v-model="range" mode="range" />
  <p class="text-sm text-muted-foreground">
    {{ range ? range.start.toDateString() + ' to ' + range.end.toDateString() : 'Pick a start and an end' }}
  </p>
</div>`,
      state: () => ({ range: ref<{ start: Date; end: Date } | null>(null) }),
    },
    {
      title: 'Multiple dates',
      script: 'const days = ref([])',
      code: `<div class="grid gap-2">
  <Calendar v-model="days" mode="multiple" />
  <p class="text-sm text-muted-foreground">{{ days.length }} day(s) selected</p>
</div>`,
      state: () => ({ days: ref<Date[]>([]) }),
    },
    {
      title: 'Two months',
      script: 'const range = ref(null)',
      code: `<Calendar v-model="range" mode="range" :number-of-months="2" />`,
      state: () => ({ range: ref<{ start: Date; end: Date } | null>(null) }),
    },
    {
      title: 'Months: three side by side and two stacked',
      description: '`numberOfMonths` is 1, 2 or 3. `orientation="vertical"` stacks them, which suits a narrow column.',
      code: `<div class="grid gap-4">
  <Calendar :number-of-months="3" size="sm" />
  <Calendar :number-of-months="2" orientation="vertical" size="sm" />
</div>`,
    },
    {
      title: 'Week numbers',
      description: 'A leading column with the ISO week of each row. Name it for your language with `weekLabel` and `weekShort`.',
      code: `<div class="flex flex-wrap items-start gap-4">
  <Calendar week-numbers size="sm" />
  <Calendar week-numbers :week-start="1" locale="de-DE" week-label="Woche" week-short="KW" size="sm" />
</div>`,
    },
    {
      title: 'Day shapes',
      description: 'Rounded (default), pill and square day buttons. A range keeps its flat inner edges in every shape.',
      script: `const range = ref(null)`,
      code: `<div class="flex flex-wrap items-start gap-4">
  <Calendar shape="rounded" size="sm" />
  <Calendar shape="pill" size="sm" />
  <Calendar shape="square" size="sm" />
  <Calendar v-model="range" mode="range" shape="pill" size="sm" />
</div>`,
      state: () => ({ range: ref<{ start: Date; end: Date } | null>(null) }),
    },
    {
      title: 'Limits and disabled days',
      description: 'Only the next 30 days, no weekends. Disabled days stay focusable but cannot be selected.',
      script: `const today = new Date()
const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
const weekend = (d) => d.getDay() === 0 || d.getDay() === 6
const date = ref(null)`,
      code: `<Calendar v-model="date" :min="today" :max="max" :is-date-disabled="weekend" />`,
      state: () => {
        const today = new Date()
        return {
          today,
          max: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30),
          weekend: (d: Date) => d.getDay() === 0 || d.getDay() === 6,
          date: ref<Date | null>(null),
        }
      },
    },
    {
      title: 'Locale and week start',
      code: `<div class="flex flex-wrap gap-4">
  <Calendar locale="de-DE" :week-start="1" size="sm" prev-label="Zurück" next-label="Weiter" />
  <Calendar locale="ja-JP" :week-start="0" size="sm" />
</div>`,
    },
    {
      title: 'Variants and sizes',
      code: `<div class="flex flex-wrap items-start gap-4">
  <Calendar size="xs" />
  <Calendar size="sm" />
  <Calendar variant="outline" size="sm" />
  <Calendar variant="ghost" />
  <Calendar size="lg" :show-heading="false" />
  <Calendar disabled />
  <Calendar readonly />
</div>`,
    },
  ],
  a11y: [
    'Each month is a `role="grid"` named by its visible month heading (`aria-labelledby`, or `aria-label` when `showHeading` is off). Weekday headers are `columnheader`s with the full weekday name as label. Days are buttons inside `gridcell`s that carry `aria-selected`; each day has a full-date `aria-label` (it contains the visible day number) and `aria-current="date"` marks today.',
    'Roving tabindex: exactly one day is tabbable (selected day, else today); Tab leaves the grid. Previous and next month buttons come first in the tab order.',
    'Keyboard: ArrowLeft/ArrowRight move one day (mirrored on a right-to-left page), ArrowUp/ArrowDown one week, Home/End the start/end of the week, PageUp/PageDown one month, Shift+PageUp/PageDown one year, Enter or Space select, Escape cancels an in-progress range. Moving past a month edge scrolls the view and keeps focus on the same day.',
    'One persistent visually hidden `role="status"` region announces the new month(s) after every navigation and the range start prompt after the first range click. The month heading is not a live region because it is re-created on navigation.',
    'Disabled days use `aria-disabled` (not `disabled`) so keyboard users can still move across them. `readonly` sets `aria-readonly` on the grid.',
    'Selected days, range ends and in-between days get a border in forced-colors mode; today is bold and underlined, so no state relies on colour alone. Cells are 24, 28, 36 or 44px (`size`), always at least 24px; `lg` drops to 36px below the `sm` breakpoint so one month fits 320px. Several months wrap onto separate rows when there is no room, or stack with `orientation="vertical"`. Week numbers are `rowheader` cells named "Week N" (translate `weekLabel`); they are not focusable and not part of the roving tabindex.',
    'Translate `prevLabel`, `nextLabel` and `rangeStartMessage`, and pass `locale` so names are localised.',
  ],
  related: ['DatePicker', 'DateRangePicker', 'DateInput', 'Popover'],
  requires: [
    'Throws a ContractError when the previous or next month button has no name, that is when `prevLabel` or `nextLabel` is blank.',
  ],
  llmNotes: [
    'Use `mode="range"` with `v-model="{start,end}|null"`; `mode="multiple"` with a `Date[]`; default `single` with `Date | null`.',
    'Never mutate the model in place; replace it (or use v-model).',
    'Use `min`/`max`/`isDateDisabled` for restrictions, not CSS.',
    'Put a Calendar in a dropdown with `DatePicker`/`DateRangePicker`, not by hand.',
    'Dates are local calendar days; do not compare with `===`, compare `toDateString()` or use the exported `calendarIsSameDay`.',
  ],
  replaces: [],
}
export default doc
