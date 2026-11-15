import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CopyField',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Read-only value (API key, URL, token) with a joined copy-to-clipboard button, copied feedback, variants, sizes, shapes and status.',
  description:
    'Use `CopyField` to show a value the user should copy rather than type: API keys, share links, connection strings. The input selects its whole text on focus; the button copies using the async Clipboard API with an `execCommand` fallback (so it also works on plain-http origins), shows a check and "Copied" for `copiedDuring` ms and announces it through a polite live region; a failed copy shows and announces "Copy failed" the same way. `mask` hides the value but still copies the real one. Not for editable fields.',
  status: 'stable',
  props: [
    { name: 'value', type: 'string | null', description: 'Text shown and copied.' },
    { name: 'modelValue', type: 'string | null', description: 'Alias of `value` (wins when both are set) so the field works with `v-model`. Never emits.' },
    { name: 'label', type: 'string', default: "'Copy'", description: 'Copy button text.' },
    { name: 'copiedLabel', type: 'string', default: "'Copied'", description: 'Button text and live-region message in the copied state.' },
    { name: 'failedLabel', type: 'string', default: "'Copy failed'", description: 'Button text and live-region message when copying fails.' },
    { name: 'copiedDuring', type: 'number', default: '2000', description: 'Milliseconds the copied state lasts. Read once when the component is created.' },
    { name: 'mask', type: 'boolean', default: 'false', description: 'Render the value as password dots (the real value is still copied).' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Visually hide the button text (kept for assistive tech).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables input and button.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid`. Also inherited from a surrounding Field.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of the input and the joined button: muted fill (`filled`), a line with a text button (`underline`), borderless until hover with a text button (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the input and the button: 28, 32, 36 and 44px. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the whole control. `pill` rounds the start of the input and the end of the button; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour on the input and the button, with an icon at the end of the input. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'inputClass', type: 'string | object | array', description: 'Classes for the inner <input>.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the wrapper element.' },
  ],
  slots: [],
  emits: [
    { name: 'copy', payload: '[value: string]', description: 'The value was copied.' },
    { name: 'copy-error', payload: '[error: unknown]', description: 'Copying threw (e.g. no clipboard access at all).' },
  ],
  examples: [
    {
      title: 'API key',
      code: `<CopyField value="sample-api-key-0000" aria-label="Sample API key" />`,
    },
    {
      title: 'In a Field, masked, with feedback',
      script: `const copies = ref(0)`,
      code: `<Field label="Secret token" hint="Shown once. Store it somewhere safe.">
  <CopyField value="sample-token-0000" mask icon-only label="Copy token" @copy="copies++" />
</Field>
<p class="mt-2 text-sm text-muted-foreground">Copied {{ copies }} time(s)</p>`,
      state: () => ({ copies: ref(0) }),
    },
    {
      title: 'Variants, shapes and sizes',
      description: 'The joined copy button follows the variant, shape and size of the input.',
      code: `<div class="grid max-w-md gap-3">
  <CopyField value="sample-value-0000" variant="outline" aria-label="Outline value" />
  <CopyField value="sample-value-0000" variant="filled" aria-label="Filled value" />
  <CopyField value="sample-value-0000" variant="underline" aria-label="Underline value" />
  <CopyField value="sample-value-0000" variant="ghost" aria-label="Ghost value" />
  <CopyField value="sample-value-0000" shape="pill" aria-label="Pill value" />
  <CopyField value="sample-value-0000" shape="square" aria-label="Square value" />
  <CopyField value="sample-value-0000" size="xs" aria-label="Extra small value" />
  <CopyField value="sample-value-0000" size="lg" aria-label="Large value" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits at the end of the input, left of the button; success and warning add screen reader text.',
      code: `<div class="grid max-w-md gap-3">
  <CopyField value="sample-value-0000" status="success" aria-label="Verified value" />
  <CopyField value="sample-value-0000" status="warning" aria-label="Value that expires soon" />
  <CopyField value="sample-value-0000" status="error" aria-label="Revoked value" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`). The icon is not focusable and does not cover the button.',
    '`underline` and `ghost` keep a visible focus indicator on the input and the button (a thicker bottom border, or a border and ring); forced-colors mode draws borders in system colours. The button text and its copied and failed states are the same in every variant.',
    'Input is `readonly` (focusable and selectable) and selects all text on focus. `autocomplete="off"` and no spellcheck.',
    'Copy button is `type="button"` with visible text (or screen-reader-only text with `iconOnly`) that changes to the copied or failed label; icons are decorative. It is not disabled while feedback shows, so keyboard focus is kept and a failed copy can be retried.',
    'A `role="status"` region outside the button announces "Copied" or "Copy failed" and is cleared after `copiedDuring` ms, so no stale message stays in browse mode.',
    'Button is disabled only when the value is empty or the field is disabled. It is 36px tall (44px on touch pointers); text is 16px below `md`.',
    'Use a descriptive `label` (for example "Copy token") when several copy buttons share a page.',
  ],
  related: ['Input', 'Field', 'InputGroup', 'Button'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, `for` label, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when the copy button has no text, that is when `label` is blank.',
  ],
  llmNotes: [
    'Use CopyField for read-only copyable values; use Input for editable ones.',
    'Always label it (Field label or `aria-label`); with `icon-only` also pass a descriptive `label`.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`. The copy button follows `variant`, `shape` and `size`.',
    'Handle failures with `@copy-error`; `@copy` fires only after a successful copy.',
  ],
  replaces: ['ad-hoc readonly input + copy button combos'],
}
export default doc
