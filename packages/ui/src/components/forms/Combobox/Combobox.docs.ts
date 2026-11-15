import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Combobox',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Type-to-filter single select over an options array with clear button, empty state and Field wiring.',
  description:
    'Use `Combobox` when the user picks one value from a long list (countries, users, tags) and benefits from typing to filter. It opens on focus or click, filters options case-insensitively on their label, supports arrow-key navigation, Enter to select and Escape to close, and shows `emptyText` (or the `empty` slot) when nothing matches or `options` is empty. Use `Select` for short lists or rich items, `NativeSelect` for the platform picker. The model is the selected option `value` (string); clearing sets `""`. A model value that matches no option shows an empty input. Server-side search is not built in: filter `options` yourself. `class` is applied to the root (use it for width); other attributes go to the `<input>`.',
  status: 'stable',
  props: [
    { name: 'options', type: 'Array<{ value: string; label: string; disabled?: boolean }>', default: '[]', description: 'Selectable options. `label` is displayed and filtered.' },
    { name: 'modelValue', type: 'string | null', description: 'v-model: the selected option value. `""`/`null` mean nothing selected. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value when uncontrolled.' },
    { name: 'placeholder', type: 'string', description: 'Input placeholder.' },
    { name: 'emptyText', type: 'string', default: "'No results'", description: 'Message when no option matches. Use the `empty` slot for rich content.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Shows a clear button while a value is selected; clearing emits `""`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Input height: 28px, 32px, 36px or 44px. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of the input. `outline` is the bordered default, `filled` uses a muted fill, `underline` keeps a bottom rule that thickens on focus, `ghost` shows its border on hover and focus. Unknown values fall back to `outline`.' },
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
    { name: 'option', props: '{ option: ComboboxOption }', description: 'Custom content for each option (default: its label).' },
    { name: 'empty', description: 'Content shown when no option matches (default: `emptyText`).' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted when an option is selected (or `""` when cleared).' },
    { name: 'update:open', payload: '[value: boolean]', description: 'Emitted when the list opens or closes.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: "const lang = ref('')\nconst languages = [{ value: 'ts', label: 'TypeScript' }, { value: 'go', label: 'Go' }, { value: 'rs', label: 'Rust' }, { value: 'py', label: 'Python', disabled: true }]",
      code: `<div class="grid max-w-xs gap-2">
  <Combobox v-model="lang" :options="languages" placeholder="Search language" aria-label="Language" clearable />
  <p class="text-sm text-muted-foreground">Selected: {{ lang || 'nothing' }}</p>
</div>`,
      state: () => ({
        lang: ref(''),
        languages: [
          { value: 'ts', label: 'TypeScript' },
          { value: 'go', label: 'Go' },
          { value: 'rs', label: 'Rust' },
          { value: 'py', label: 'Python', disabled: true },
        ],
      }),
    },
    {
      title: 'In a Field with custom empty text',
      script: "const country = ref('')\nconst countries = [{ value: 'pl', label: 'Poland' }, { value: 'de', label: 'Germany' }, { value: 'fr', label: 'France' }]",
      code: `<Field class="max-w-xs" label="Country" hint="Start typing to filter." :error="country ? '' : 'Pick a country'" required>
  <Combobox v-model="country" :options="countries" placeholder="Country" empty-text="No such country" />
</Field>`,
      state: () => ({
        country: ref(''),
        countries: [
          { value: 'pl', label: 'Poland' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France' },
        ],
      }),
    },
    {
      title: 'Variants',
      description: 'Outline (default), filled, underline and ghost side by side.',
      code: `<div class="grid max-w-xs gap-2">
  <Combobox aria-label="Outline" placeholder="Outline" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox variant="filled" aria-label="Filled" placeholder="Filled" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox variant="underline" aria-label="Underline" placeholder="Underline" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox variant="ghost" aria-label="Ghost" placeholder="Ghost" :options="[{ value: 'a', label: 'Option A' }]" />
</div>`,
    },
    {
      title: 'Sizes and shapes',
      description: 'Four sizes, then pill and square corners. A `clearable` combobox keeps the toggle and clear buttons clear of the text.',
      code: `<div class="grid max-w-xs gap-2">
  <Combobox size="xs" aria-label="Extra small" placeholder="xs" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox size="sm" aria-label="Small" placeholder="sm" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox size="lg" aria-label="Large" placeholder="lg" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox shape="pill" aria-label="Pill" placeholder="pill" clearable default-value="a" :options="[{ value: 'a', label: 'Option A' }]" />
  <Combobox shape="square" aria-label="Square" placeholder="square" :options="[{ value: 'a', label: 'Option A' }]" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon left of the toggle button. Pair them with a visible message in a Field.',
      code: `<div class="grid max-w-xs gap-3">
  <Field label="Country" hint="Sample message: shipping is available."><Combobox status="success" default-value="a" :options="[{ value: 'a', label: 'Poland' }]" /></Field>
  <Field label="Language" hint="Sample message: translation is incomplete."><Combobox status="warning" default-value="a" clearable :options="[{ value: 'a', label: 'German' }]" /></Field>
  <Field label="Timezone" error="Sample message: pick a timezone."><Combobox status="error" placeholder="Search timezone" :options="[{ value: 'a', label: 'Europe/Warsaw' }]" /></Field>
</div>`,
    },
    {
      title: 'Custom option and empty slots',
      script: "const user = ref('u1')",
      code: `<Combobox v-model="user" class="max-w-xs" aria-label="Assignee" :options="[{ value: 'u1', label: 'Sample user A' }, { value: 'u2', label: 'Sample user B' }]">
  <template #option="{ option }"><span>{{ option.label }}</span> <Badge variant="secondary">user</Badge></template>
  <template #empty>Nobody found. <Button variant="link" size="xs">Invite</Button></template>
</Combobox>`,
      state: () => ({ user: ref('u1') }),
    },
  ],
  a11y: [
    'Input has `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `autocomplete="off"` and `aria-activedescendant`; the list is a `role="listbox"` of `role="option"` items. DOM focus stays on the input.',
    'Keyboard: focus or click opens the list, type to filter, Arrow Up/Down move the highlight, Enter selects, Escape closes; blur restores the selected label. Clear the value by emptying the input (Ctrl/Cmd+A, Backspace).',
    'The toggle and clear buttons are pointer shortcuts: they are removed from the tab order (`tabindex=-1`), named ("Toggle options", "Clear selection") and 24px (36px on touch devices) with a focus ring. Clear is only rendered while a value exists.',
    'The empty message is a polite `role="status"` region, so "No results" is announced when typing filters everything out. The disabled state is read from the native `disabled` attribute.',
    'Inside a Field the input receives `id` (label `for`), `aria-describedby`, `aria-invalid` (only when invalid), `required`; otherwise set `aria-label`.',
    '`status` is never colour alone: success, warning and error draw an icon left of the buttons. Success and warning also add visually hidden text ("Valid", "Warning") that the input references from `aria-describedby`; error sets `aria-invalid` and relies on the Field error message.',
    'Every `variant` keeps a visible edge or fill and the focus indicator (a ring, or a thicker bottom border for `underline`); forced-colors mode draws the border of `underline` and `ghost` in system colours. The input keeps end padding so text never runs under the icon or the buttons.',
    'The input is 16px on small screens (no iOS zoom) and 14px from `md`, at least 44px tall on touch devices; the list is capped to the available width and scrolls inside. Highlighted options keep an outline in forced-colors mode. Layout uses logical properties (RTL safe).',
  ],
  related: ['Select', 'NativeSelect', 'Field', 'SearchInput'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count).',
    'Throws a ContractError when an option `value` is missing, empty or used twice.',
  ],
  llmNotes: [
    'Pass `options` as data ({ value, label }); do not nest item components.',
    'Bind `v-model` to a string; treat `""` as empty. Use `clearable` for optional fields.',
    'Wrap in Field with a label or pass `aria-label`; width goes in `class`, other attributes reach the input.',
    'Look props are `variant`, `shape`, `status` and `size`. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
    'For async search, filter and replace `options` yourself; the built-in filter only matches labels.',
  ],
  replaces: ['shadcn-vue Combobox (Command + Popover pattern)'],
}
export default doc
