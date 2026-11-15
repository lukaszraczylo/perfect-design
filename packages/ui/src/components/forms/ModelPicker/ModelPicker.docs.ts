import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const flat = [
  { id: 'draft', label: 'Draft - fast', description: 'Quick first pass for short texts.', badges: ['Fast'] },
  { id: 'review', label: 'Review - careful', description: 'Slower, checks each claim twice.', badges: ['Careful'] },
  { id: 'summary', label: 'Summary - compact', description: 'Keeps the output to a few lines.' },
  { id: 'archive', label: 'Archive - retired', description: 'Kept for old projects only.', badges: ['Retired'], disabled: true },
]

const grouped = [
  {
    label: 'Everyday',
    options: [
      { id: 'draft', label: 'Draft - fast', description: 'Quick first pass for short texts.', badges: ['Fast'] },
      { id: 'summary', label: 'Summary - compact', description: 'Keeps the output to a few lines.' },
    ],
  },
  {
    label: 'Thorough',
    options: [
      { id: 'review', label: 'Review - careful', description: 'Slower, checks each claim twice.', badges: ['Careful'] },
      { id: 'audit', label: 'Audit - exhaustive', description: 'Longest run, lists every finding.', badges: ['Slow', 'Preview'] },
    ],
  },
]

const keyed = [
  { id: 'draft', label: 'Draft - fast', group: 'Everyday', description: 'Quick first pass for short texts.' },
  { id: 'summary', label: 'Summary - compact', group: 'Everyday', description: 'Keeps the output to a few lines.' },
  { id: 'review', label: 'Review - careful', group: 'Thorough', description: 'Slower, checks each claim twice.' },
  { id: 'custom', label: 'Custom preset' },
]

const doc: ComponentDoc = {
  name: 'ModelPicker',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Searchable, grouped single choice over plain option data with a description and text badges per option.',
  description:
    'Use `ModelPicker` when people choose one entry from a list of engines, presets, modes or plans and each entry needs a sentence of explanation. It is a `Combobox` with richer rows: type to filter on the label and the description, move with the arrow keys, Enter picks, Escape closes. The options are plain data, so the same component works for any list. `v-model` is the option `id` (a string); `""` means nothing selected, and a model value that matches no option shows an empty input. Groups: pass entries of `{ label, options }`, or give flat options a `group` key and they are gathered under one heading in order of first appearance; the two forms can be mixed, and options without a group stay ungrouped. Badges are short words ("Fast", "Preview") rendered as text, so they do not rely on colour; they are not searched. A disabled option is shown dimmed, skipped by the keyboard and cannot be chosen. Use `Select` for a short list without search, `Combobox` when options need only a label. Server-side search is not built in: filter `options` yourself. `class` goes on the root; other attributes go to the `<input>`.',
  status: 'stable',
  props: [
    { name: 'options', type: 'Array<ModelPickerOption | ModelPickerGroup>', default: '[]', description: 'Plain data. `ModelPickerOption` is `{ id: string; label: string; description?: string; badges?: string[]; disabled?: boolean; group?: string }`, `ModelPickerGroup` is `{ label: string; options: ModelPickerOption[] }`. Ids are unique across all groups.' },
    { name: 'modelValue', type: 'string | null', description: 'v-model: the selected option `id`. `""`/`null` mean nothing selected. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial id when uncontrolled.' },
    { name: 'placeholder', type: 'string', description: 'Input placeholder.' },
    { name: 'emptyText', type: 'string', default: "'No matching options'", description: 'Message when nothing matches the search. Use the `empty` slot for rich content.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Shows a clear button while an option is selected; clearing emits `""`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Input height: 28px, 32px, 36px or 44px. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of the input. `outline` is bordered, `filled` uses a muted fill, `underline` keeps a bottom rule that thickens on focus, `ghost` shows its border on hover and focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the input. `underline` is always square-cornered. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status. Colours the border and adds an icon left of the buttons; `success` and `warning` also add hidden text that `aria-describedby` points at. `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables input, toggle and clear. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required on the input. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; a hidden input is rendered when inside a `<form>`.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (`v-model:open`).' },
    { name: 'id', type: 'string', description: 'Input id. Falls back to the surrounding Field id.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root element (width/layout); wins over internal classes.' },
  ],
  slots: [
    { name: 'option', props: '{ option: ModelPickerOption }', description: 'Replaces the content of each row (default: label, badges and description).' },
    { name: 'empty', description: 'Content shown when nothing matches (default: `emptyText`).' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[id: string]', description: 'Emitted when an option is chosen (or `""` when cleared).' },
    { name: 'update:open', payload: '[value: boolean]', description: 'Emitted when the list opens or closes.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: "const preset = ref('')\nconst presets = [{ id: 'draft', label: 'Draft - fast', description: 'Quick first pass for short texts.', badges: ['Fast'] }, ...]",
      code: `<div class="grid max-w-sm gap-2">
  <ModelPicker v-model="preset" :options="presets" aria-label="Preset" placeholder="Choose a preset" clearable />
  <p class="text-sm text-muted-foreground">Selected: {{ preset || 'nothing' }}</p>
</div>`,
      state: () => ({ preset: ref(''), presets: flat }),
    },
    {
      title: 'Groups as data',
      description: 'Entries of `{ label, options }` become labelled groups. Typing filters across all groups and hides a group when none of its options match.',
      script: "const preset = ref('review')",
      code: `<ModelPicker v-model="preset" class="max-w-sm" :options="groups" aria-label="Preset" />`,
      state: () => ({ preset: ref('review'), groups: grouped }),
    },
    {
      title: 'Groups with a group key',
      description: 'A flat list where each option names its `group`. Options without one stay ungrouped.',
      script: "const preset = ref('')",
      code: `<ModelPicker v-model="preset" class="max-w-sm" :options="items" aria-label="Preset" placeholder="Choose a preset" />`,
      state: () => ({ preset: ref(''), items: keyed }),
    },
    {
      title: 'Uncontrolled with a default',
      code: `<ModelPicker class="max-w-sm" :options="options" default-value="summary" aria-label="Preset" />`,
      state: () => ({ options: flat }),
    },
    {
      title: 'In a Field with an empty state',
      description: 'Type something that matches nothing to see `emptyText`.',
      script: "const preset = ref('')",
      code: `<Field class="max-w-sm" label="Preset" hint="Search by name or description." required>
  <ModelPicker v-model="preset" :options="options" placeholder="Search presets" empty-text="No preset matches that search" />
</Field>`,
      state: () => ({ preset: ref(''), options: flat }),
    },
    {
      title: 'Variants',
      description: 'Outline (default), filled, underline and ghost.',
      code: `<div class="grid max-w-sm gap-2">
  <ModelPicker aria-label="Outline" placeholder="Outline" :options="options" />
  <ModelPicker variant="filled" aria-label="Filled" placeholder="Filled" :options="options" />
  <ModelPicker variant="underline" aria-label="Underline" placeholder="Underline" :options="options" />
  <ModelPicker variant="ghost" aria-label="Ghost" placeholder="Ghost" :options="options" />
</div>`,
      state: () => ({ options: flat }),
    },
    {
      title: 'Sizes and shapes',
      code: `<div class="grid max-w-sm gap-2">
  <ModelPicker size="xs" aria-label="Extra small" placeholder="xs" :options="options" />
  <ModelPicker size="sm" aria-label="Small" placeholder="sm" :options="options" />
  <ModelPicker size="lg" aria-label="Large" placeholder="lg" :options="options" />
  <ModelPicker shape="pill" aria-label="Pill" placeholder="pill" clearable default-value="draft" :options="options" />
  <ModelPicker shape="square" aria-label="Square" placeholder="square" :options="options" />
</div>`,
      state: () => ({ options: flat }),
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon left of the toggle button. Pair them with a visible message in a Field.',
      code: `<div class="grid max-w-sm gap-3">
  <Field label="Reviewer" hint="Sample message: this preset is available."><ModelPicker status="success" default-value="review" :options="options" /></Field>
  <Field label="Drafter" hint="Sample message: this preset is slow today."><ModelPicker status="warning" default-value="draft" :options="options" /></Field>
  <Field label="Summariser" error="Sample message: choose a preset."><ModelPicker status="error" placeholder="Choose a preset" :options="options" /></Field>
</div>`,
      state: () => ({ options: flat }),
    },
    {
      title: 'Custom row',
      description: 'The `option` slot replaces the row content. Keep the label as visible text.',
      script: "const preset = ref('draft')",
      code: `<ModelPicker v-model="preset" class="max-w-sm" aria-label="Preset" :options="options">
  <template #option="{ option }"><span>{{ option.label }}</span></template>
</ModelPicker>`,
      state: () => ({ preset: ref('draft'), options: flat }),
    },
  ],
  a11y: [
    'The input has `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`; the list is a `role="listbox"` of `role="option"` rows, with `role="group"` and a heading for each labelled group. DOM focus stays on the input.',
    'Keyboard: focus or click opens the list, type to filter by label and description, Arrow Up/Down move the highlight across groups, Enter chooses, Escape closes; blur restores the selected label. Disabled options are skipped. Empty the input (Ctrl/Cmd+A, Backspace) to clear.',
    'The toggle and clear buttons are pointer shortcuts removed from the tab order, named ("Toggle options", "Clear selection") and 24px (36px on touch devices) with a focus ring.',
    'Each row reads as one option: label, badges, then description. Badges are words, never a colour only. The chosen row shows a check mark, and a disabled row is dimmed and marked `aria-disabled`.',
    'The empty message is a polite `role="status"` region, so "No matching options" is announced when typing filters everything out.',
    'Inside a Field the input receives `id` (label `for`), `aria-describedby`, `aria-invalid` and `required`; otherwise set `aria-label`. `status` adds an icon, and success and warning add hidden text; `error` sets `aria-invalid`.',
    'The input is 16px on small screens (no iOS zoom) and at least 44px tall on touch devices. Rows wrap long text instead of overflowing, the list is capped to the available width and scrolls inside, highlighted rows keep an outline in forced-colors mode, and layout uses logical properties (RTL safe).',
  ],
  related: ['Combobox', 'Select', 'MultiSelect', 'Field', 'PromptInput'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count).',
    'Throws a ContractError when an option `id` is missing, empty or used twice.',
    'Throws a ContractError when an option has no `label`.',
    'Throws a ContractError when a `{ label, options }` group has no `label`.',
  ],
  llmNotes: [
    'Pass `options` as data: `{ id, label, description?, badges?, disabled?, group? }`, or `{ label, options }` groups. Do not nest item components.',
    'Bind `v-model` to a string id; treat `""` as empty. Use `clearable` for optional fields.',
    'Wrap in Field with a label or pass `aria-label`; width goes in `class`, other attributes reach the input.',
    'Every option needs a unique non-empty `id` and a `label`; every group needs a `label`.',
    'Badges are short words, not icons or colours. Search matches the label and the description only.',
    'Look props are `variant`, `shape`, `status` and `size`. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
  ],
  replaces: ['hand-rolled model or preset dropdown markup', 'shadcn-vue Select with groups and descriptions'],
}
export default doc
