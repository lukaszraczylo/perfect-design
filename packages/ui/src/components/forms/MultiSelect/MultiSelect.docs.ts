import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'elder', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
]

const doc: ComponentDoc = {
  name: 'MultiSelect',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'Dropdown checkbox list with chips summary, search filter, select all / clear, max selections and full keyboard support.',
  description:
    'Use `MultiSelect` when the user picks several values from a known list of 5-10 000 options and the selection should stay visible as compact chips (first `maxVisible` chips, then "+N more"). It is dependency-free: the panel is rendered inline below the trigger (absolute, `z-(--z-dropdown)`), so avoid placing it inside an `overflow-hidden` ancestor that would clip it. The model is `string[]` of option values; options are `{ value, label, disabled? }`. Use `Select` for a single value, `Combobox` for async/free-text lookups, `TagsInput` for free-form tags, `CheckboxCard` for a few rich options. Works controlled (`v-model`) and uncontrolled (`default-value`); the open state can be controlled with `v-model:open`. Extra attributes (`aria-label`, `aria-labelledby`, `data-*`) go to the trigger button; an `aria-label` is rendered as a hidden name and combined with the visible chips, so the accessible name always contains the visible text. `class` goes to the root.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string[]', description: 'Selected option values (v-model). Omit for uncontrolled use. Non-arrays are treated as empty; duplicates and non-strings are dropped.' },
    { name: 'defaultValue', type: 'string[]', default: '[]', description: 'Initial selection when uncontrolled.' },
    { name: 'open', type: 'boolean', description: 'Open state (v-model:open). Omit for uncontrolled use. Never open while disabled.' },
    { name: 'options', type: '{ value: string; label: string; disabled?: boolean }[]', default: '[]', description: 'Available options. Entries without a string `value` are ignored. Disabled options cannot be toggled (a selected disabled option stays selected, also on Clear).' },
    { name: 'placeholder', type: 'string', default: "'Select...'", description: 'Trigger text when nothing is selected.' },
    { name: 'searchable', type: 'boolean', default: 'true', description: 'Show the search box (case-insensitive label filter). When false the listbox takes focus and typing jumps to the first option starting with the typed text.' },
    { name: 'searchPlaceholder', type: 'string', default: "'Search...'", description: 'Placeholder and accessible name of the search input.' },
    { name: 'emptyText', type: 'string', default: "'No results found'", description: 'Shown when no option matches or there are no options. Overridable with the `empty` slot.' },
    { name: 'max', type: 'number', description: 'Maximum number of selected values. Remaining options become `aria-disabled`, a "n / max selected" counter replaces "Select all". Non-positive, NaN or non-numeric values mean unlimited; fractions are floored.' },
    { name: 'maxVisible', type: 'number', default: '3', description: 'Chips shown in the trigger before the rest collapse into "+N more". 0 shows only the count; invalid values fall back to 3.' },
    { name: 'actions', type: 'boolean', default: 'true', description: 'Show the "Select all" (enabled, filtered options) and "Clear" actions row.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Show a clear (x) button (24px, 32px on touch devices) in the trigger while something is selected.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger min height (28 / 32 / 36 / 40 px). Text is 16px on small screens and 14px from the `md` breakpoint (`lg` stays 16px); on touch devices the trigger is at least 44px tall.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of the trigger. `outline` is the bordered default, `filled` uses a muted fill, `underline` keeps a bottom rule that thickens on focus, `ghost` shows its border on hover and focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the trigger. `underline` is always square-cornered. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status. Colours the border and adds an icon before the chevron; `success` and `warning` also add hidden text that `aria-describedby` points at. `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger and blocks all changes. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required` on the trigger. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and a destructive border. Also set by a Field with an error.' },
    { name: 'name', type: 'string', description: 'Form field name; one hidden input per selected value is rendered.' },
    { name: 'id', type: 'string', description: 'Trigger id. Falls back to the surrounding Field id, then a generated one.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root (`data-slot="multi-select"`); use it to set the width.' },
  ],
  slots: [
    { name: 'chip', props: '{ value: string; label: string }', description: 'Content of each chip in the trigger.' },
    { name: 'option', props: '{ option: MultiSelectOption; selected: boolean }', description: 'Content of each option row (next to the checkbox).' },
    { name: 'empty', description: 'Content of the empty state.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string[]]', description: 'Emitted with the new selection whenever the user changes it (toggle, select all, clear).' },
    { name: 'update:open', payload: '[open: boolean]', description: 'Emitted when the panel opens or closes.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: `const picked = ref(['apple', 'cherry'])
const fruit = [{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }, { value: 'date', label: 'Date', disabled: true }, { value: 'elder', label: 'Elderberry' }, { value: 'fig', label: 'Fig' }]`,
      code: `<div class="grid max-w-sm gap-2">
  <MultiSelect v-model="picked" :options="fruit" placeholder="Pick fruit" aria-label="Fruit" />
  <p class="text-sm text-muted-foreground">Selected: {{ picked.join(', ') || 'none' }}</p>
</div>`,
      state: () => ({ picked: ref(['apple', 'cherry']), fruit }),
    },
    {
      title: 'Chips overflow (+N more)',
      script: `const picked = ref(['apple', 'banana', 'cherry', 'elder', 'fig'])`,
      code: `<div class="max-w-sm">
  <MultiSelect v-model="picked" :options="fruit" :max-visible="2" aria-label="Many fruit" />
</div>`,
      state: () => ({ picked: ref(['apple', 'banana', 'cherry', 'elder', 'fig']), fruit }),
    },
    {
      title: 'Maximum selections',
      script: `const picked = ref(['apple'])`,
      code: `<div class="max-w-sm">
  <MultiSelect v-model="picked" :options="fruit" :max="2" clearable aria-label="Up to two fruit" placeholder="Choose up to 2" />
</div>`,
      state: () => ({ picked: ref(['apple']), fruit }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-sm gap-3">
  <MultiSelect :options="fruit" size="xs" placeholder="Extra small" aria-label="Extra small" />
  <MultiSelect :options="fruit" size="sm" placeholder="Small" aria-label="Small" />
  <MultiSelect :options="fruit" size="md" placeholder="Medium" aria-label="Medium" />
  <MultiSelect :options="fruit" size="lg" placeholder="Large" aria-label="Large" />
</div>`,
      state: () => ({ fruit }),
    },
    {
      title: 'Variants and shapes',
      description: 'Outline (default), filled, underline and ghost, then pill and square corners.',
      code: `<div class="grid max-w-sm gap-3">
  <MultiSelect :options="fruit" placeholder="Outline" aria-label="Outline" />
  <MultiSelect :options="fruit" variant="filled" placeholder="Filled" aria-label="Filled" />
  <MultiSelect :options="fruit" variant="underline" placeholder="Underline" aria-label="Underline" />
  <MultiSelect :options="fruit" variant="ghost" placeholder="Ghost" aria-label="Ghost" />
  <MultiSelect :options="fruit" shape="pill" :default-value="['apple', 'fig']" placeholder="Pill" aria-label="Pill" />
  <MultiSelect :options="fruit" shape="square" placeholder="Square" aria-label="Square" />
</div>`,
      state: () => ({ fruit }),
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon before the chevron. Pair them with a visible message in a Field.',
      code: `<div class="grid max-w-sm gap-4">
  <Field label="Fruit for the box" hint="Sample message: all of these are in stock."><MultiSelect :options="fruit" status="success" :default-value="['apple']" /></Field>
  <Field label="Fruit for the stall" hint="Sample message: one of these is almost sold out."><MultiSelect :options="fruit" status="warning" :default-value="['fig']" clearable /></Field>
  <Field label="Fruit for the pie" error="Sample message: choose at least one fruit."><MultiSelect :options="fruit" status="error" placeholder="Choose fruit" /></Field>
</div>`,
      state: () => ({ fruit }),
    },
    {
      title: 'Without search, without actions',
      code: `<div class="max-w-sm">
  <MultiSelect :options="fruit" :searchable="false" :actions="false" placeholder="Type to jump" aria-label="Plain list" />
</div>`,
      state: () => ({ fruit }),
    },
    {
      title: 'In a Field: invalid and disabled',
      code: `<div class="grid max-w-sm gap-4">
  <Field label="Fruit" error="Choose at least one fruit.">
    <MultiSelect :options="fruit" invalid placeholder="Choose fruit" />
  </Field>
  <MultiSelect :options="fruit" disabled :default-value="['fig']" aria-label="Disabled" />
</div>`,
      state: () => ({ fruit }),
    },
  ],
  a11y: [
    'The trigger is a `<button aria-haspopup="listbox" aria-expanded aria-controls>`; label it with a `Field` label, `aria-label` or `aria-labelledby` (attrs go to the trigger). An author name is combined with the visible chips or placeholder through `aria-labelledby` (WCAG 2.5.3 label in name), so the trigger never has an `aria-label` that hides its visible text.',
    'The panel contains a search input (focused on open) and a `role="listbox" aria-multiselectable` of `role="option" aria-selected` rows. The active option is announced via `aria-activedescendant` while DOM focus stays on the input (or on the listbox when `searchable=false`). The check box in each row is decorative and drawn only for selected rows, so it also shows in forced-colors mode.',
    '`status` is never colour alone: success, warning and error draw an icon before the chevron. Success and warning also add visually hidden text ("Valid", "Warning") that the trigger references from `aria-describedby`; error sets `aria-invalid` and relies on the Field error message.',
    'Every `variant` keeps a visible edge or fill and the focus indicator (a ring, or a thicker bottom border for `underline`); forced-colors mode draws the border of `underline` and `ghost` in system colours.',
    'Trigger: ArrowDown / ArrowUp / Enter / Space open the panel; typing a character opens it and seeds the search.',
    'In the panel: ArrowDown/ArrowUp move the active option (skipping disabled, wrapping); Enter toggles it; Space toggles it while the search is empty (otherwise it is a normal character); Ctrl/Cmd+A selects all enabled options (unless text is typed in the search box); Escape closes and returns focus to the trigger; Tab closes. With `searchable=false`, Home/End jump and typing performs a type-ahead jump. The "Select all" and "Clear" buttons are for pointer use (`tabindex=-1`); Ctrl/Cmd+A is the keyboard equivalent of "Select all".',
    'A visually hidden `role="status"` region announces the filtered option count ("3 options available") and the empty message while searching. Disabled and limit-blocked options are `aria-disabled`; the "n / max selected" counter is `aria-live="polite"` and uses tabular numbers.',
    'Target sizes: the clear button is 24px (32px on touch devices), action buttons are at least 24px, options and the search input are 44px tall on touch devices. The trigger and search input use 16px text on small screens so iOS does not zoom.',
    'Focus and the active option keep an outline in forced-colors mode; chips get a border. The trigger text wraps and the panel is at least 12rem wide, so nothing overflows at 320px. Layout uses logical properties (RTL safe). Animations respect `prefers-reduced-motion`.',
    'Clicking outside or moving focus outside closes the panel.',
  ],
  related: ['Select', 'Combobox', 'TagsInput', 'CheckboxCard', 'Field'],
  requires: [
    'Throws a ContractError when the trigger has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (the chips and the placeholder do not count).',
    'Throws a ContractError when an option `value` is missing, not a string, empty or used twice.',
  ],
  llmNotes: [
    'Bind a string[] with v-model; options are { value, label, disabled? } with unique string values.',
    'Always give the trigger an accessible name: wrap in Field, or pass aria-label (it lands on the trigger button). The chips and placeholder do not count; without a name it raises a ContractError.',
    'Use `max` to cap selections (it hides Select all); use `max-visible` to control chip overflow.',
    'Set width with `class` on the root (e.g. class="w-72"); the panel matches the trigger width (min 12rem).',
    'The panel is inline (not portalled): do not place it inside overflow-hidden containers.',
    'Look props are `variant`, `shape`, `status` and `size`. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
    'Use Select for a single value; use name="field" to submit one hidden input per selected value.',
  ],
  replaces: ['multi-select dropdowns built from Popover + Checkbox lists'],
}

export default doc
