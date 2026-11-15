import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'PinInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Segmented one-character-per-cell input for verification codes and PINs.',
  description:
    'Use `PinInput` for OTP / verification codes and short PINs. **`v-model` is a single string** (`"123"` while typing a 6-digit code), unlike reka-ui which uses an array; the component converts internally. `complete` fires with the full joined string once every cell is filled. Submit there. Focus advances automatically, Backspace/Delete/arrow keys work per cell and pasting a whole code fills all cells. Gaps are preserved visually but collapse in the string (`"1_3"` becomes `"13"`), so rely on `complete` for validity. Use `Input` for variable-length codes.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'The code as one string. Characters beyond `length` are dropped; in `number` mode non-digits are dropped.' },
    { name: 'length', type: 'number', default: '6', description: 'Number of cells (minimum 1).' },
    { name: 'type', type: "'text' | 'number'", default: "'text'", description: '`number` restricts to digits and opens a numeric keypad.' },
    { name: 'mask', type: 'boolean', default: 'false', description: 'Hide entered characters (password-style cells).' },
    { name: 'otp', type: 'boolean', default: 'false', description: 'One-time-code mode: the first cell gets autocomplete="one-time-code" (SMS autofill) and cells must be filled in order.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every cell.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Marks the hidden form input as required.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid on every cell and destructive styling.' },
    { name: 'placeholder', type: 'string', description: 'Placeholder for each empty cell, e.g. "○".' },
    { name: 'name', type: 'string', description: 'Form field name; a hidden input carries the joined code.' },
    { name: 'cellLabel', type: 'string', description: 'Accessible-name prefix of each cell ("Digit 1 of 6"). Defaults to "Digit" in number mode, "Character" otherwise.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell size: 32, 36, 40 or 48 px square (44px on coarse pointers below `lg`). Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of every cell. `outline` is the bordered default, `filled` uses a muted fill, `underline` keeps only a bottom rule per cell (it thickens on focus), `ghost` shows the border on hover and focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of every cell. `pill` makes each cell a circle. `underline` cells are always square-cornered. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status of the whole code. Colours every cell border and adds ONE icon after the last cell; `success` and `warning` also add hidden text that the group\'s `aria-describedby` points at. `error` also sets `aria-invalid="true"` on every cell. Unknown values fall back to `default`.' },
    { name: 'cellClass', type: 'string | object | array', description: 'Extra classes for every cell, merged last (e.g. `size-14 text-2xl`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root group; wins over internal classes. Other attributes go to the root.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Fires on every change with the joined string (may be shorter than `length`).' },
    { name: 'complete', payload: '[value: string]', description: 'Fires with the joined code when all cells are filled.' },
  ],
  examples: [
    {
      title: 'Verification code',
      script: `const code = ref('')
const verified = ref('')`,
      code: `<div class="flex flex-col gap-3">
  <PinInput v-model="code" type="number" otp aria-label="Verification code" @complete="verified = $event" />
  <p class="text-sm text-muted-foreground tabular-nums">Entered: {{ code || 'nothing yet' }}. Completed: {{ verified || 'not yet' }}.</p>
</div>`,
      state: () => ({ code: ref(''), verified: ref('') }),
    },
    {
      title: 'In a Field with an error',
      script: `const pin = ref('1234')`,
      code: `<Field label="Enter your PIN" error="Incorrect PIN, try again">
  <PinInput v-model="pin" :length="4" type="number" mask />
</Field>`,
      state: () => ({ pin: ref('1234') }),
    },
    {
      title: 'Variants',
      description: 'Outline (default), filled, underline and ghost cells.',
      code: `<div class="grid gap-3">
  <PinInput :length="4" model-value="1234" aria-label="Outline cells" />
  <PinInput :length="4" model-value="1234" variant="filled" aria-label="Filled cells" />
  <PinInput :length="4" model-value="1234" variant="underline" aria-label="Underline cells" />
  <PinInput :length="4" model-value="1234" variant="ghost" aria-label="Ghost cells" />
</div>`,
    },
    {
      title: 'Sizes and shapes',
      description: 'Four cell sizes, then circular (pill) and square cells.',
      code: `<div class="grid gap-3">
  <PinInput :length="4" size="xs" aria-label="Extra small cells" />
  <PinInput :length="4" size="sm" aria-label="Small cells" />
  <PinInput :length="4" aria-label="Medium cells" />
  <PinInput :length="4" size="lg" aria-label="Large cells" />
  <PinInput :length="4" shape="pill" aria-label="Circular cells" />
  <PinInput :length="4" shape="square" aria-label="Square cells" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Success, warning and error colour every cell and add one icon after the last cell. Pair them with a visible message in a Field.',
      code: `<div class="grid gap-4">
  <Field label="Backup code" hint="Sample message: code accepted."><PinInput :length="4" model-value="1234" status="success" /></Field>
  <Field label="Recovery code" hint="Sample message: this code expires soon."><PinInput :length="4" model-value="5678" status="warning" /></Field>
  <Field label="Access code" error="Sample message: the code does not match."><PinInput :length="4" model-value="0000" status="error" /></Field>
</div>`,
    },
    {
      title: 'Disabled',
      code: `<PinInput :length="4" model-value="ABCD" disabled aria-label="Locked code" />`,
    },
  ],
  a11y: [
    'The root has role="group". Name it with `aria-label`, or put it in a `Field` with a label: the Field label then names the group through `aria-labelledby` (the Field `label for` points at a hidden input, which cannot name a group).',
    'Each cell is a text input named "Digit n of N" (or "Character n of N", or your `cellLabel`), with `autocapitalize="none"`.',
    '`type="number"` sets `inputmode="numeric"` and `pattern="[0-9]*"` on every cell so touch devices show a numeric keypad.',
    'Keyboard: typing advances focus, ArrowLeft/ArrowRight/Home/End move between cells, Backspace clears and steps back, Delete clears the cell. Pasting a code into any cell distributes it across the cells. With `otp`, focus cannot skip an empty cell.',
    '`otp` sets autocomplete="one-time-code" on the first cell, so mobile keyboards offer the SMS code there; the other cells use autocomplete="off".',
    'Inside `Field`, aria-describedby (hint and error) is set on the group and aria-invalid on every cell.',
    '`status` is never colour alone: success, warning and error draw one icon after the last cell, and success and warning add visually hidden text ("Valid", "Warning") that the group references from `aria-describedby`. Error sets `aria-invalid` on every cell.',
    'Every `variant` keeps a visible edge or fill per cell and the focus ring (a thicker bottom border for `underline`); forced-colors mode draws the border of `underline` and `ghost` cells in system colours.',
    'Targets and reflow: cells are 40px by default (`size` sets 32 to 48px), 44px on coarse pointers below `lg`, use 16px text or larger (no iOS zoom on focus) and shrink with `min-w-0` when the row is wider than the screen, so the code never overflows at 320px.',
  ],
  related: ['Input', 'Field', 'PasswordInput'],
  requires: [
    'Throws a ContractError when the group has no accessible name: no `Field` label, `aria-label` or `aria-labelledby` (the named cells do not name the group).',
    'Throws a ContractError when `cellLabel` is set to a blank string.',
  ],
  llmNotes: [
    'v-model is ONE string, not an array. Do not pass arrays.',
    'Submit on `@complete`, not on every update.',
    'Use `type="number"` for numeric codes and `otp` for SMS codes.',
    'Always provide `aria-label` or a Field label for the group.',
    'Look props apply per cell: `variant`, `shape`, `size`; `status` colours all cells and adds one icon. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
  ],
  replaces: ['ad-hoc OTP inputs', 'shadcn-vue PinInput'],
}
export default doc
