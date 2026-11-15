import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'PasswordInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Password field with an accessible show/hide toggle, variants, sizes, shapes and status.',
  description:
    'Use `PasswordInput` for every password entry. It defaults to `autocomplete="current-password"` (set `new-password` on sign-up and change-password forms) so password managers work. `variant`, `size`, `shape` and `status` style the input and the toggle stays inside it; `status` adds an icon left of the toggle (plus screen reader text for `success` and `warning`). `passwordInputVariants` gives a plain `<input>` the same look. The toggle button is disabled when the field is disabled and stays usable when readonly. `visible` is optional controlled state (`v-model:visible`). The toggle keeps one name and exposes its state with `aria-pressed`, and a screen-reader-only warning (`revealWarning`) says the password will be shown on screen.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'Current value (v-model). Uncontrolled when omitted.' },
    { name: 'visible', type: 'boolean', default: 'false', description: 'Show the password as text. Supports `v-model:visible`; uncontrolled when omitted.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input and the toggle.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Prevents editing; toggle still works.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` and destructive styling. Also inherited from a surrounding Field.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`), border on hover and fill on focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height: 28, 32, 36 and 44px. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon left of the toggle. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'autocomplete', type: 'string', default: "'current-password'", description: 'Native autocomplete token.' },
    { name: 'showLabel', type: 'string', default: "'Show password'", description: 'Accessible name of the toggle in both states (localise here); the state is `aria-pressed`.' },
    { name: 'hideLabel', type: 'string', default: "'Hide password'", description: 'Deprecated: kept so existing code compiles. The toggle name no longer changes with the state.' },
    { name: 'revealWarning', type: 'string', default: "'Shows the password as plain text on screen.'", description: 'Screen-reader description of the toggle.' },
    { name: 'inputClass', type: 'string | object | array', description: 'Classes for the inner <input>.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the wrapper element.' },
  ],
  slots: [],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted on every input.' },
    { name: 'update:visible', payload: '[value: boolean]', description: 'Emitted when the toggle is pressed.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: `const password = ref('')`,
      code: `<PasswordInput v-model="password" aria-label="Password" />`,
      state: () => ({ password: ref('') }),
    },
    {
      title: 'Sign-up field with validation',
      script: `const password = ref('short')\nconst visible = ref(true)`,
      code: `<Field label="New password" hint="At least 12 characters." :error="password.length < 12 ? 'Too short' : undefined" required>
  <PasswordInput v-model="password" v-model:visible="visible" autocomplete="new-password" />
</Field>`,
      state: () => ({ password: ref('short'), visible: ref(true) }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="grid max-w-sm gap-3">
  <PasswordInput variant="outline" placeholder="Outline" aria-label="Outline password" />
  <PasswordInput variant="filled" placeholder="Filled" aria-label="Filled password" />
  <PasswordInput variant="underline" placeholder="Underline" aria-label="Underline password" />
  <PasswordInput variant="ghost" placeholder="Ghost" aria-label="Ghost password" />
  <PasswordInput shape="pill" placeholder="Pill" aria-label="Pill password" />
  <PasswordInput shape="square" placeholder="Square" aria-label="Square password" />
  <PasswordInput size="xs" placeholder="Extra small" aria-label="Extra small password" />
  <PasswordInput size="lg" placeholder="Large" aria-label="Large password" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits left of the show/hide toggle; success and warning add screen reader text.',
      code: `<div class="grid max-w-sm gap-3">
  <PasswordInput status="success" model-value="sample-password" aria-label="Strong password" />
  <PasswordInput status="warning" model-value="sample" aria-label="Weak password" />
  <PasswordInput status="error" model-value="sample" aria-label="Rejected password" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`). The icon is not focusable and does not cover the toggle.',
    '`underline` and `ghost` keep a visible focus indicator on the input; forced-colors mode draws borders in system colours.',
    'Toggle is a real `<button type="button">`: Tab reaches it after the input, Enter or Space toggles it. It has a constant `aria-label` (`showLabel`), `aria-pressed` for the state, `aria-controls` pointing at the input and a described-by warning.',
    'Input turns off autocapitalize, autocorrect and spellcheck; `autocomplete` defaults to `current-password` (use `new-password` when creating one). Pasting is never blocked.',
    'Needs an accessible name: Field label or `aria-label`.',
    'The toggle is 24px (36px on touch pointers); the input reserves room for it with logical padding, so RTL works.',
  ],
  related: ['Input', 'Field', 'InputGroup'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when the show/hide toggle has no name, that is when `showLabel` is set to a blank string.',
  ],
  llmNotes: [
    'Use PasswordInput, never `<Input type="password">`, so users can reveal what they typed.',
    'Set `autocomplete="new-password"` on registration/change forms.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
    'Localise by overriding `showLabel` / `hideLabel`.',
  ],
  replaces: ['custom password inputs with eye icon toggles in login forms'],
}
export default doc
