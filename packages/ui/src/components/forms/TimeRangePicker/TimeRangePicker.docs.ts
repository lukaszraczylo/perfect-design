import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'TimeRangePicker',
  group: 'forms',
  subgroup: 'Date & time',
  summary: 'Pick a time window from presets (last 15 minutes to 30 days, today, yesterday) or a custom from and to, as a popover, an inline panel or a segmented row, in an explicit time zone.',
  description:
    'Use `TimeRangePicker` where the question is "which window of time": dashboards, logs, audit trails, exports. Use `DateRangePicker` when only whole days matter, and `DatePicker` for one date. ' +
    'v-model is `{ from, to }` as ISO 8601 strings, always emitted in UTC (`2024-05-01T10:00:00.000Z`) with `from <= to`. Incoming strings may carry an offset (`+02:00`); one without an offset is read as UTC. An end that is not a valid date makes the whole value count as empty. ' +
    '**Presets resolve when you choose them.** `last-15-minutes` to `last-30-days` end at the current time and are exact elapsed lengths (a "day" is 24 hours). `today` runs from the start of the day in `timeZone` to now; `yesterday` is the whole previous day in `timeZone` (23 or 25 hours across a daylight saving change). The component emits concrete from and to strings, never a relative expression, so a saved value always means the same window. Pass `now` to fix the clock in tests, demos and server-rendered pages. ' +
    '**Time zones.** `timeZone` is an IANA name (`Europe/Warsaw`) and defaults to `UTC`. It decides which day "today" is, how the value is displayed (with a short zone name after the end), and how typed dates and times are read. It never changes the emitted value, which is always UTC. An unknown name shows UTC (and throws a ContractError in strict mode). Only `Intl` is used. A wall time that does not exist (a spring forward gap, or the skipped Samoa day of 2011-12-30) moves forward; a wall time that happens twice (fall back) is read as its first occurrence; the fields then show the time that was stored. ' +
    '**Custom range.** The `custom` preset shows a calendar plus a date and a time field for each end, a note naming the zone, and an Apply button. The range is only emitted when it is valid: Apply with a start after the end, a missing end, or a time outside `min` and `max` shows the reason as visible text with an icon and does not emit. Times have minute precision. ' +
    '`variant` picks the layout: `popover` (trigger and dropdown, the default), `inline` (a bordered panel that is always open) or `segmented` (a row of presets as one radio group with the custom fields below). `class` goes on the root; extra attributes go to the trigger (`popover`) or to the group root (`inline`, `segmented`).',
  status: 'stable',
  props: [
    { name: 'modelValue', type: '{ from: string; to: string } | null', description: 'v-model. ISO 8601 strings, emitted as UTC. Strings without an offset are UTC. Wrong shapes and invalid dates count as empty. Uncontrolled when omitted.' },
    { name: 'now', type: 'Date | string | number', description: 'The current time used to resolve relative presets and to bound them by `min`/`max`. A `Date`, milliseconds or an ISO string. Defaults to the clock at the moment of selection; an invalid value falls back to the clock.' },
    { name: 'timeZone', type: 'string', default: "'UTC'", description: 'IANA zone for display, typed times and the day boundaries of `today` and `yesterday`. Unknown names show UTC.' },
    { name: 'min', type: 'Date | string | number', description: 'Earliest allowed instant (inclusive). A preset or a custom range that starts earlier is disabled or rejected. Swapped with `max` when reversed.' },
    { name: 'max', type: 'Date | string | number', description: 'Latest allowed instant (inclusive).' },
    { name: 'presets', type: 'TimeRangePresetId[]', description: 'Ids to show, in order: `last-15-minutes`, `last-30-minutes`, `last-1-hour`, `last-6-hours`, `last-24-hours`, `last-7-days`, `last-30-days`, `today`, `yesterday`, `custom`. Default: all. Without `custom` there are no from/to fields. Unknown ids are ignored (and throw in strict mode).' },
    { name: 'presetLabels', type: 'Partial<Record<TimeRangePresetId, string>>', description: 'Visible text per preset id, to translate or reword. A blank text keeps the default.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for the displayed value and the calendar.' },
    { name: 'format', type: 'Intl.DateTimeFormatOptions', description: 'How each end is displayed (the zone is always `timeZone`). The default is the medium date with hours and minutes, and a short zone name after the end. Invalid combinations fall back to the default.' },
    { name: 'variant', type: "'popover' | 'inline' | 'segmented'", default: "'popover'", description: 'Layout. `popover` is a trigger with a dropdown, `inline` a bordered panel that is always open, `segmented` a row of presets with the custom fields below. Unknown values fall back to `popover`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the trigger and the fields: `xs` 28px, `sm` 32px, `md` 36px, `lg` 44px. The segmented row maps `xs` to `sm`. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the trigger and the fields. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour plus an icon. `success` and `warning` add hidden text, `error` sets `aria-invalid`. An invalid range sets `error` by itself and shows its message as visible text. In `inline` it colours the panel border. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', description: 'Hidden text of the success and warning icons. Defaults to the English text (translate it).' },
    { name: 'align', type: "'start' | 'end'", default: "'start'", description: 'Which trigger edge the dropdown aligns to (`popover`).' },
    { name: 'showCalendar', type: 'boolean', default: 'true', description: 'Show the range calendar beside the fields (`popover` and `inline`). The `segmented` variant never shows it.' },
    { name: 'hour12', type: 'boolean', default: 'false', description: 'Show the 12-hour clock with an AM/PM segment in the time fields. The value stays 24 hour.' },
    { name: 'messages', type: '{ incomplete?: string; order?: string; min?: string; max?: string }', description: 'Texts of the validation errors. `{min}` and `{max}` are replaced with the limit formatted in the zone. Blank or non-string entries keep the default.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear button while a range is set (`popover` only; hidden when disabled or readonly).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every control. Also inherited from a surrounding Field. Closes an open dropdown.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the range; nothing can be opened, chosen, typed or cleared.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Adds a visually hidden `requiredLabel` to the description (`aria-required` is not allowed on a button or a group). Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling regardless of the range. Also set by a Field with an error.' },
    { name: 'open', type: 'boolean', description: 'v-model:open. Controls the dropdown of the `popover` variant; uncontrolled when omitted.' },
    { name: 'placeholder', type: 'string', default: "'Pick a time range'", description: 'Text shown while no range is set.' },
    { name: 'presetsLabel', type: 'string', default: "'Presets'", description: 'Accessible name of the presets group. Translate it.' },
    { name: 'fromLabel', type: 'string', default: "'From'", description: 'Legend of the start fields and the first word of their names (`From date`, `From time`).' },
    { name: 'toLabel', type: 'string', default: "'To'", description: 'Legend of the end fields and the first word of their names.' },
    { name: 'dateLabel', type: 'string', default: "'date'", description: 'Last word of the name of each date input.' },
    { name: 'timeLabel', type: 'string', default: "'time'", description: 'Last word of the name of each time input.' },
    { name: 'applyLabel', type: 'string', default: "'Apply'", description: 'Text of the button that applies the custom range.' },
    { name: 'zoneLabel', type: 'string', default: "'Times are in {zone}'", description: 'Visible note above Apply naming the zone. `{zone}` is replaced with the resolved zone name.' },
    { name: 'clearLabel', type: 'string', default: "'Clear time range'", description: 'aria-label of the clear button.' },
    { name: 'requiredLabel', type: 'string', default: "'Required'", description: 'Visually hidden description announced while `required` (translate it).' },
    { name: 'dialogLabel', type: 'string', default: "'Choose time range'", description: 'aria-label of the dropdown dialog (`popover`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root with tailwind-merge.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: { from: string; to: string } | null]', description: 'A preset was chosen, a valid custom range was applied, or the value was cleared (null). Not emitted for an invalid draft.' },
    { name: 'update:open', payload: '[open: boolean]', description: 'The dropdown asked to open or close (`popover`).' },
    { name: 'select', payload: "[selection: { preset: TimeRangePresetId; value: { from: string; to: string } }]", description: 'Which preset (or `custom`) produced the value just emitted. Use it to remember that a window was relative.' },
    { name: 'validate', payload: '[result: { valid: boolean; reason: "incomplete" | "order" | "min" | "max" | null; message: string | null; from: string | null; to: string | null }]', description: 'The custom fields were edited or applied: whether the draft is valid and why not.' },
    { name: 'invalid', payload: '[result: { valid: boolean; reason: string | null; message: string | null; from: string | null; to: string | null }]', description: 'Only when the custom draft is not valid and its message is shown.' },
  ],
  examples: [
    {
      title: 'Basic',
      description: 'A trigger with every preset. Choosing one writes concrete UTC strings to the model.',
      script: 'const range = ref(null)',
      code: `<div class="grid max-w-sm content-start gap-2">
  <TimeRangePicker v-model="range" aria-label="Time window" />
  <p class="text-sm text-muted-foreground">{{ range ? range.from + ' to ' + range.to : 'No window chosen' }}</p>
</div>`,
      state: () => ({ range: ref<{ from: string; to: string } | null>(null) }),
    },
    {
      title: 'Fixed clock and time zone',
      description: '`now` makes relative presets deterministic. `timeZone` decides the day boundaries and the displayed times; the value stays UTC.',
      script: `const range = ref({ from: '2024-05-15T10:00:00.000Z', to: '2024-05-15T11:30:00.000Z' })`,
      code: `<div class="grid max-w-sm content-start gap-2">
  <TimeRangePicker v-model="range" now="2024-05-15T12:30:00Z" time-zone="Europe/Warsaw" locale="en-GB" aria-label="Window in Warsaw time" />
  <p class="text-sm text-muted-foreground">{{ range.from }} to {{ range.to }}</p>
</div>`,
      state: () => ({ range: ref({ from: '2024-05-15T10:00:00.000Z', to: '2024-05-15T11:30:00.000Z' }) }),
    },
    {
      title: 'Chosen presets and labels',
      description: 'Show only some presets, in your order, with your own words. Without `custom` there are no from/to fields.',
      script: `const range = ref(null)
const presets = ['last-1-hour', 'last-24-hours', 'today', 'yesterday']
const presetLabels = { 'last-1-hour': 'Past hour', 'last-24-hours': 'Past day' }`,
      code: `<TimeRangePicker class="max-w-sm" v-model="range" :presets="presets" :preset-labels="presetLabels" aria-label="Activity window" />`,
      state: () => ({
        range: ref(null),
        presets: ['last-1-hour', 'last-24-hours', 'today', 'yesterday'],
        presetLabels: { 'last-1-hour': 'Past hour', 'last-24-hours': 'Past day' },
      }),
    },
    {
      title: 'Inline panel',
      description: 'The presets and the custom range without a trigger, for a settings page or a side panel.',
      script: `const range = ref({ from: '2024-05-01T08:00:00.000Z', to: '2024-05-03T17:00:00.000Z' })`,
      code: `<TimeRangePicker class="max-w-2xl" v-model="range" variant="inline" now="2024-05-15T12:30:00Z" aria-label="Report window" />`,
      state: () => ({ range: ref({ from: '2024-05-01T08:00:00.000Z', to: '2024-05-03T17:00:00.000Z' }) }),
    },
    {
      title: 'Segmented row',
      description: 'A compact radio group of presets, with the date and time fields below when Custom range is chosen. Arrow keys move through the segments and choose them.',
      script: `const range = ref(null)
const presets = ['last-15-minutes', 'last-1-hour', 'last-24-hours', 'custom']`,
      code: `<TimeRangePicker class="max-w-xl" v-model="range" variant="segmented" :presets="presets" now="2024-05-15T12:30:00Z" aria-label="Window" />`,
      state: () => ({ range: ref(null), presets: ['last-15-minutes', 'last-1-hour', 'last-24-hours', 'custom'] }),
    },
    {
      title: 'Bounds and validation',
      description: 'The range is inside `min` and `max`. A start after the end, an end after `max` or a start before `min` shows its reason as visible text; here the model already breaks the order, so the message shows without opening anything.',
      script: `const range = ref({ from: '2024-05-02T12:00:00.000Z', to: '2024-05-02T09:00:00.000Z' })`,
      code: `<div class="grid max-w-sm content-start gap-2">
  <TimeRangePicker v-model="range" min="2024-05-01T00:00:00Z" max="2024-05-15T12:30:00Z" now="2024-05-15T12:30:00Z" aria-label="Export window" />
  <TimeRangePicker variant="inline" :model-value="{ from: '2024-04-20T00:00:00.000Z', to: '2024-05-02T00:00:00.000Z' }" min="2024-05-01T00:00:00Z" :messages="{ min: 'Data starts on {min}' }" aria-label="Export window, inline" />
</div>`,
      state: () => ({ range: ref({ from: '2024-05-02T12:00:00.000Z', to: '2024-05-02T09:00:00.000Z' }) }),
    },
    {
      title: 'In a Field, required and clearable',
      script: `const range = ref(null)`,
      code: `<Field class="max-w-sm content-start" label="Log window" hint="Times are shown in UTC." required>
  <TimeRangePicker v-model="range" clearable />
</Field>`,
      state: () => ({ range: ref<{ from: string; to: string } | null>(null) }),
    },
    {
      title: 'Sizes, shapes and states',
      code: `<div class="grid max-w-sm gap-2">
  <TimeRangePicker size="xs" aria-label="Extra small" />
  <TimeRangePicker size="sm" aria-label="Small" />
  <TimeRangePicker size="lg" aria-label="Large" />
  <TimeRangePicker shape="pill" aria-label="Pill" />
  <TimeRangePicker shape="square" aria-label="Square" />
  <TimeRangePicker status="success" aria-label="Success" />
  <TimeRangePicker status="warning" aria-label="Warning" />
  <TimeRangePicker status="error" aria-label="Error" />
  <TimeRangePicker disabled aria-label="Disabled" />
  <TimeRangePicker readonly aria-label="Read only" :model-value="{ from: '2024-05-01T10:00:00.000Z', to: '2024-05-01T11:00:00.000Z' }" />
</div>`,
    },
    {
      title: 'Right to left',
      description: 'Arabic digits, an Egyptian time zone and mirrored layout from the `dir` attribute.',
      script: `const range = ref({ from: '2024-05-01T10:00:00.000Z', to: '2024-05-01T11:00:00.000Z' })`,
      code: `<div dir="rtl" class="max-w-sm">
  <TimeRangePicker v-model="range" locale="ar-EG" time-zone="Africa/Cairo" now="2024-05-15T12:30:00Z" align="end" aria-label="الفترة الزمنية" />
</div>`,
      state: () => ({ range: ref({ from: '2024-05-01T10:00:00.000Z', to: '2024-05-01T11:00:00.000Z' }) }),
    },
  ],
  a11y: [
    '`popover`: the trigger is a button with `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls` (while open). Its name is the label source (`Field` label, `aria-label` or `aria-labelledby`) followed by the visible range, so the visible text is part of the name. Enter, Space or a click toggles the dropdown, ArrowDown opens it with focus on the chosen (or first enabled) preset, Escape closes it and returns focus to the trigger, and Tab out of it closes it.',
    '`inline` and `segmented` render a `role="group"` named by `aria-label`, `aria-labelledby` or the surrounding `Field` label. `segmented` presets are one `radiogroup`: arrow keys move focus and choose, as in any radio group.',
    'Presets are a `role="group"` named by `presetsLabel`; each is a real button (32px, 44px on touch) with `aria-pressed` for the chosen one and `disabled` when its range leaves `min` or `max`. The pressed state also has heavier text and a forced-colors border.',
    'Each end is a `fieldset` with a visible legend. The date input is named `From date`, the time input `From time` (same for the end), so the visible legend is contained in the name. Enter in a date or time field applies the range; Enter on a calendar day only selects the day. Calendar keys are documented on Calendar.',
    'Errors are visible text with an icon, in a polite `role="status"` region that exists before it has text. A range that fails also sets `aria-invalid` and the error status icon, and the trigger is described by the message. The reason is never conveyed by colour alone.',
    '`required` is a visually hidden description (`requiredLabel`) because `aria-required` is not allowed on a button or a group. `status` adds an icon, and `success` and `warning` add hidden text.',
    'Times are shown with a short zone name after the end, and the custom fields state the zone in text (`zoneLabel`). Relative presets are exact elapsed lengths, so a range that spans a daylight saving change is 23 or 25 wall-clock hours long for `yesterday` and the same elapsed time for `last-*`.',
    'Responsive: field text is 16px below `md`, controls reach 44px on touch pointers, the dropdown is as wide as the trigger below `sm` (the presets and the custom fields stack) and works at 320px. Logical properties only, so right to left mirrors it. Targets stay at least 24px in the dense style packs.',
  ],
  related: ['DateRangePicker', 'DatePicker', 'DateInput', 'TimeInput', 'Calendar', 'SegmentedControl', 'Field'],
  requires: [
    'Throws a ContractError when nothing names the control: no `Field` label, wrapping or `for` label, `aria-label`, or `aria-labelledby` pointing at text (the range or placeholder shown does not count).',
    'Throws a ContractError when `presetsLabel`, `fromLabel`, `toLabel` or `applyLabel` is blank, when `dialogLabel` is blank, or when `clearLabel` is blank while `clearable` is set.',
    'Throws a ContractError when `timeZone` is not a zone name that `Intl` accepts (it shows UTC until fixed).',
    'Throws a ContractError when an entry of `presets` is not one of the documented ids.',
  ],
  llmNotes: [
    'Use `v-model` with `{ from: string, to: string } | null`; both are UTC ISO strings and `from <= to`. Never put a relative expression such as "now-15m" in the model: presets resolve to concrete strings when chosen.',
    'Always set `timeZone` when the audience is not in UTC (it defaults to UTC); it changes display, typed times and the day of `today`/`yesterday`, never the emitted value.',
    'Pass `now` in tests, stories and server-rendered pages so presets are deterministic.',
    'Always label it: wrap in `Field` with a label, or set `aria-label`. Use `variant="inline"` or `"segmented"` when the choice should stay visible.',
    'Use `select` to learn which preset produced the value (store the preset id to refresh a relative window later); use `min`/`max` to bound it.',
    'Use `DateRangePicker` for whole days and `DatePicker` for one date.',
  ],
  replaces: ['hand-rolled quick range dropdown with a custom range form'],
}
export default doc
