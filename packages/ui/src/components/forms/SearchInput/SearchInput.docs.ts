import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SearchInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Text field with a search icon, a clear button, Esc-to-clear and an optional debounced `search` event.',
  description:
    'Use `SearchInput` for filtering lists, tables and command-style lookups. `update:modelValue` fires on every keystroke; `search` fires with the current value after `debounce` ms (immediately when `0`), or at once on Enter. Esc and the clear button empty the field, emit `clear` and `search("")`. When `disabled` or `readonly` the clear button is hidden and Esc is ignored. `variant`, `size`, `shape` and `status` style the input; the search icon and clear button stay inside it, and `status` adds an icon left of the clear button (plus screen reader text for `success` and `warning`). `searchInputVariants` gives a plain `<input type="search">` the same look. Not for password or numeric entry.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'Current text (v-model). Uncontrolled when omitted.' },
    { name: 'debounce', type: 'number', default: '0', description: 'Milliseconds to wait after typing before emitting `search`. Negative/NaN behave as 0.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input and hides the clear button.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Prevents editing and clearing; Enter still emits `search`.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` and destructive styling. Also inherited from a surrounding Field.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`, the icon sits flush at the start), border on hover and fill on focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height: 28, 32, 36 and 44px. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded and moves the icon in; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon left of the clear button. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'clearLabel', type: 'string', default: "'Clear search'", description: 'Accessible name of the clear button.' },
    { name: 'landmark', type: 'boolean', default: 'false', description: 'Give the wrapper `role="search"`. Use once per page region.' },
    { name: 'landmarkLabel', type: 'string', default: "'Search'", description: 'Accessible name of the search landmark (with `landmark`). Make it unique when a page has several.' },
    { name: 'inputClass', type: 'string | object | array', description: 'Classes for the inner <input>.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the wrapper element (use for width/layout).' },
  ],
  slots: [],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Every input change, immediately.' },
    { name: 'search', payload: '[value: string]', description: 'Debounced value after typing, immediately on Enter, and `""` after a clear.' },
    { name: 'clear', description: 'Emitted when the field is cleared by button or Esc.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: `const query = ref('')`,
      code: `<SearchInput v-model="query" placeholder="Search" aria-label="Search" />
<p class="mt-2 text-sm text-muted-foreground">Query: {{ query || '(empty)' }}</p>`,
      state: () => ({ query: ref('') }),
    },
    {
      title: 'Debounced search inside a Field',
      script: `const query = ref('')\nconst searched = ref('')`,
      code: `<Field label="Find a customer" hint="Search runs 300 ms after you stop typing, or on Enter.">
  <SearchInput v-model="query" :debounce="300" placeholder="Name or email" @search="searched = $event" @clear="searched = ''" />
</Field>
<p class="mt-2 text-sm">Last search: <Badge variant="secondary">{{ searched || 'none' }}</Badge></p>`,
      state: () => ({ query: ref(''), searched: ref('') }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="grid max-w-sm gap-3">
  <SearchInput variant="outline" placeholder="Outline" aria-label="Outline search" />
  <SearchInput variant="filled" placeholder="Filled" aria-label="Filled search" />
  <SearchInput variant="underline" placeholder="Underline" aria-label="Underline search" />
  <SearchInput variant="ghost" placeholder="Ghost" aria-label="Ghost search" />
  <SearchInput shape="pill" placeholder="Pill" aria-label="Pill search" />
  <SearchInput shape="square" placeholder="Square" aria-label="Square search" />
  <SearchInput size="xs" placeholder="Extra small" aria-label="Extra small search" />
  <SearchInput size="lg" placeholder="Large" aria-label="Large search" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits left of the clear button; success and warning add screen reader text.',
      code: `<div class="grid max-w-sm gap-3">
  <SearchInput status="success" model-value="sample query" aria-label="Search with results" />
  <SearchInput status="warning" model-value="sample query" aria-label="Search with a warning" />
  <SearchInput status="error" model-value="sample query" aria-label="Search with an error" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`). The icon is not focusable and does not cover the clear button.',
    '`underline` and `ghost` keep a visible focus indicator on the input; forced-colors mode draws borders in system colours.',
    'Native `type="search"` input with `enterkeyhint="search"`; autocorrect, autocapitalize and spellcheck are off. The browser clear button is hidden in favour of the labelled one.',
    'Keyboard: Enter emits `search` at once; Esc clears and does not bubble, so enclosing dialogs stay open; Tab reaches the clear button after the input, and focus returns to the input after clearing.',
    'The clear button is `type="button"`, named by `clearLabel`, 24px (36px on touch pointers), and only exists while there is text and the field is editable.',
    'Give the input an accessible name: wrap in Field with a label, or pass `aria-label`.',
    '`landmark` adds `role="search"` with `aria-label` (`landmarkLabel`) for a real site or section search; use it once per region.',
    'Icon and button use logical offsets (`start`, `end`), so RTL works. 16px text below `md` avoids iOS focus zoom.',
  ],
  related: ['Input', 'Field', 'InputGroup', 'Combobox'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count).',
    'Throws a ContractError when `clearLabel` is blank, or `landmarkLabel` is blank while `landmark` is set.',
  ],
  llmNotes: [
    'Use `@search` (not `@update:modelValue`) for network/expensive filtering; set `debounce` for type-ahead.',
    'Attributes such as `placeholder`, `name`, `aria-label` go to the inner input; `class` styles the wrapper.',
    'Always provide an accessible name (Field label or aria-label).',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
  ],
  replaces: ['ad-hoc input + icon + clear button combos'],
}
export default doc
