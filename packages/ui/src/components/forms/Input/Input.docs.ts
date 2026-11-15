import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Input',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Single-line text field with v-model, variants (outline, filled, underline, ghost), sizes, shapes, status, prefix and suffix slots and automatic Field wiring.',
  description:
    'Use `Input` for short free text (name, email, URL, number). Wrap it in `Field` to get a label, hint and error message wired through `id`, `aria-describedby` and `aria-invalid`. Use `Textarea` for multi-line, `PasswordInput` / `SearchInput` / `NumberInput` / `DateInput` for specialised inputs. Standard attributes (`placeholder`, `name`, `autocomplete`, `aria-*`, `data-*`) fall through to the `<input>`. With `type="number"` the model is a `number` (or `""` when cleared); prefer `NumberInput` when you need clamping or steppers. `email`, `url` and `tel` inputs turn off autocorrect, autocapitalise and spellcheck. Set `autocomplete` and `inputmode` for the data you collect. `variant`, `size`, `shape` and `status` change the look; `status` adds an icon (and screen reader text for `success` and `warning`), so state is never colour alone. The `prefix` and `suffix` slots hold an inset icon or one or two characters; use `InputGroup` for longer content or buttons. `inputVariants` gives a plain `<input>` the same look. Text is 16px below `md` (iOS Safari does not zoom on focus) and 44px tall on touch pointers.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | number | null', description: 'v-model value. `null`/`undefined` render as empty. Uncontrolled when omitted.' },
    { name: 'type', type: 'string', default: "'text'", description: 'Native input type (`text`, `email`, `url`, `tel`, `number`, ...).' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface. `filled` uses a muted fill (the card colour in dark mode, at least 1.15:1 away from the outline fill there, 1.25:1 measured in Chrome on the page background), `underline` keeps only a bottom border (thicker on focus), `ghost` shows the border on hover and fills on focus. Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height: 28, 32, 36 and 44px. Text stays 16px below `md` and touch pointers get a 44px target (except `lg`, already 44px). Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded, `square` has no radius. `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon at the end. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Anything but `default` wraps the input in a `span`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input. Also inherited from a surrounding Field.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Prevents editing but keeps the value focusable and submittable.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'prefix', description: 'Inset icon or one or two characters at the start (a currency symbol, `@`). Decorative (`aria-hidden`) and not clickable: say what it means in the label. Wraps the input in a `span`. Use `InputGroup` for text or buttons.' },
    { name: 'suffix', description: 'Inset icon or one or two characters at the end (a unit, `%`). Decorative and not clickable. The status icon moves left of it.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string | number]', description: 'Emitted on every input event.' }],
  examples: [
    {
      title: 'Basic',
      script: "const name = ref('')",
      code: `<div class="grid max-w-sm gap-2">
  <Input v-model="name" placeholder="Your name" aria-label="Name" autocomplete="name" />
  <p class="text-sm text-muted-foreground">Hello, {{ name || 'stranger' }}</p>
</div>`,
      state: () => ({ name: ref('') }),
    },
    {
      title: 'In a Field with validation',
      script: "const email = ref('nope')",
      code: `<Field class="max-w-sm" label="Email" hint="We never share it." :error="email.includes('@') ? '' : 'Enter a valid email'" required>
  <Input v-model="email" type="email" autocomplete="email" />
</Field>`,
      state: () => ({ email: ref('nope') }),
    },
    {
      title: 'Variants',
      description: 'Outline (default), filled, underline and ghost side by side.',
      code: `<div class="grid max-w-sm gap-3">
  <Input variant="outline" placeholder="Outline" aria-label="Outline" />
  <Input variant="filled" placeholder="Filled" aria-label="Filled" />
  <Input variant="underline" placeholder="Underline" aria-label="Underline" />
  <Input variant="ghost" placeholder="Ghost" aria-label="Ghost" />
</div>`,
    },
    {
      title: 'Shapes and extra small',
      code: `<div class="grid max-w-sm gap-3">
  <Input shape="rounded" placeholder="Rounded" aria-label="Rounded" />
  <Input shape="pill" placeholder="Pill" aria-label="Pill" />
  <Input shape="square" placeholder="Square" aria-label="Square" />
  <Input size="xs" placeholder="Extra small" aria-label="Extra small" />
  <Input variant="filled" shape="pill" size="lg" placeholder="Filled pill, large" aria-label="Filled pill, large" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Each status shows an icon; success and warning add screen reader text, error sets aria-invalid.',
      code: `<div class="grid max-w-sm gap-3">
  <Input status="success" model-value="ada@example.com" aria-label="Valid email" />
  <Input status="warning" model-value="ada@example" aria-label="Email with a warning" />
  <Input status="error" model-value="ada" aria-label="Invalid email" />
  <Input status="success" variant="underline" model-value="Underline" aria-label="Success underline" />
  <Input status="error" shape="pill" model-value="Pill" aria-label="Error pill" />
</div>`,
    },
    {
      title: 'Prefix and suffix',
      description: 'Inset icon or one or two characters. The label carries the meaning.',
      code: `<div class="grid max-w-sm gap-3">
  <Input aria-label="Price in dollars" placeholder="0.00" inputmode="decimal"><template #prefix>$</template></Input>
  <Input aria-label="Weight in kilograms" placeholder="0" inputmode="decimal"><template #suffix>kg</template></Input>
  <Input aria-label="Handle" placeholder="handle"><template #prefix>@</template></Input>
  <Input aria-label="Discount in percent" status="success" model-value="15"><template #suffix>%</template></Input>
</div>`,
    },
    {
      title: 'Sizes and states',
      code: `<div class="grid max-w-sm gap-2">
  <Input size="sm" placeholder="Small" aria-label="Small" />
  <Input placeholder="Medium" aria-label="Medium" />
  <Input size="lg" placeholder="Large" aria-label="Large" />
  <Input disabled model-value="Disabled" aria-label="Disabled" />
  <Input readonly model-value="Read only" aria-label="Read only" />
  <Input invalid model-value="Invalid" aria-label="Invalid" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`).',
    '`underline` and `ghost` keep a visible focus indicator (a thicker bottom border, or a border and ring); forced-colors mode draws borders in system colours for every variant.',
    '`prefix` and `suffix` are decorative: the field name must come from the label, not from the slot content.',
    'Native `<input>`: Tab focuses it, there are no custom key bindings. Always provide a visible label (via Field) or `aria-label`; a placeholder is not a label.',
    'Inside a Field the input receives the label `for` and `id`, `aria-describedby` (hint and error) and `aria-invalid` automatically.',
    '`invalid` sets `aria-invalid="true"`; visual and assistive state never diverge. A required, valid input reports `aria-invalid="false"`.',
    '`readonly` stays focusable and submittable; `disabled` leaves the tab order.',
    'Invalid state is not colour-only: the text error is linked, and forced-colors mode draws a dashed border.',
    'Responsive: `w-full min-w-0`, so it never overflows at 320px. 16px text below `md` prevents iOS focus zoom; `pointer-coarse:min-h-11` gives a 44px target on touch.',
  ],
  related: ['Field', 'InputGroup', 'Textarea', 'PasswordInput', 'SearchInput', 'NumberInput', 'DateInput'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count; `type="hidden"` is exempt).',
  ],
  llmNotes: [
    'Wrap every Input in `Field` with a label; never use placeholder as the only label.',
    'Use `v-model`, never mutate the prop. Use `invalid` or `Field error` for error state, not custom red classes.',
    'Pass `type`, `autocomplete`, `inputmode`, `name` as plain attributes.',
    'Pick one `variant` per form and keep it. Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
    'Use the `prefix` and `suffix` slots only for an icon or one or two characters; use `InputGroup` for text addons or buttons. Never rely on the slot to name the field.',
    'Import `inputVariants` to give a plain `<input>` the same look.',
  ],
  replaces: ['hand-rolled Input markup in app code'],
}
export default doc
