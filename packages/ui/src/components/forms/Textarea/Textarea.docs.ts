import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Textarea',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Multi-line text field with v-model, variants, sizes, shapes, status, optional autosize and character counter.',
  description:
    'Use for free-form text longer than one line. `autosize` grows the field with its content (optionally capped by `maxRows`). `maxlength` + `showCount` renders a `n / max` counter (counts UTF-16 code units, the unit `maxlength` enforces, so an emoji is 2); the counter is linked by `aria-describedby` and a polite status announces only when the limit is reached. Inside a `Field` it receives id, aria-describedby and aria-invalid automatically. `variant`, `size`, `shape` and `status` change the look; a `pill` shape is `rounded-xl` because a full pill would clip several lines, and `status` adds an icon at the top end (plus screen reader text for `success` and `warning`). `textareaVariants` gives a plain `<textarea>` the same look. Attributes (`placeholder`, `name`, `aria-*`) go to the `<textarea>`; `class` is merged onto it.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'v-model value. Uncontrolled when omitted.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`), border on hover and fill on focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Minimum height (48, 56, 64, 80px), text size and padding. Text stays 16px below `md`. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is `rounded-xl`; `square` has no radius; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'rows', type: 'number', default: '3', description: 'Visible rows when not autosizing.' },
    { name: 'autosize', type: 'boolean', default: 'false', description: 'Grow with content; disables manual resizing.' },
    { name: 'maxRows', type: 'number', description: 'Cap for autosize; further content scrolls.' },
    { name: 'maxlength', type: 'number', description: 'Native maxlength; drives the counter.' },
    { name: 'showCount', type: 'boolean', default: 'false', description: 'Show `count / maxlength` (needs maxlength).' },
    { name: 'limitLabel', type: 'string', default: "'Character limit reached'", description: 'Message announced once when the limit is reached (localise here, or with `textarea.limit` in a ConfigProvider; the counter text is `textarea.count`, `{count} / {max}`).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the field (also from Field).' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Prevents editing.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required (also from Field).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid and destructive styling (also from Field error).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the <textarea>.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'Emitted on every input event.' }],
  examples: [
    {
      title: 'Basic',
      script: "const text = ref('')",
      code: `<Textarea v-model="text" class="max-w-md" placeholder="Write something" aria-label="Message" />`,
      state: () => ({ text: ref('') }),
    },
    {
      title: 'Autosize with counter',
      script: "const note = ref('Grows as you type.')",
      code: `<Textarea v-model="note" class="max-w-md" autosize :max-rows="6" :maxlength="140" show-count aria-label="Note" />`,
      state: () => ({ note: ref('Grows as you type.') }),
    },
    {
      title: 'Variants and shapes',
      description: 'Outline (default), filled, underline and ghost, then the pill and square shapes.',
      code: `<div class="grid max-w-md gap-3">
  <Textarea variant="outline" placeholder="Outline" aria-label="Outline" />
  <Textarea variant="filled" placeholder="Filled" aria-label="Filled" />
  <Textarea variant="underline" placeholder="Underline" aria-label="Underline" />
  <Textarea variant="ghost" placeholder="Ghost" aria-label="Ghost" />
  <Textarea shape="pill" placeholder="Pill" aria-label="Pill" />
  <Textarea shape="square" placeholder="Square" aria-label="Square" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-md gap-3">
  <Textarea size="xs" :rows="1" placeholder="Extra small" aria-label="Extra small" />
  <Textarea size="sm" :rows="1" placeholder="Small" aria-label="Small" />
  <Textarea size="md" :rows="1" placeholder="Medium" aria-label="Medium" />
  <Textarea size="lg" :rows="1" placeholder="Large" aria-label="Large" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Each status shows an icon; success and warning add screen reader text, error sets aria-invalid.',
      code: `<div class="grid max-w-md gap-3">
  <Textarea status="success" model-value="Looks good." aria-label="Success" />
  <Textarea status="warning" model-value="This is close to the limit." aria-label="Warning" />
  <Textarea status="error" model-value="Too short." aria-label="Error" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`).',
    '`underline` and `ghost` keep a visible focus indicator (a thicker bottom border, or a border and ring); forced-colors mode draws borders in system colours.',
    'Native `<textarea>`; Tab focuses it. It needs a label (Field) or `aria-label`.',
    'The counter is not a live region (that would announce every keystroke). It is part of `aria-describedby` and is read when the field gets focus; a separate `role="status"` announces only when the limit is reached.',
    'Inside a Field: described by hint and error, `aria-invalid` on error. A consumer `id` or `aria-describedby` is kept and merged.',
    'Resizable vertically (`resize-y`) unless `autosize`. 16px text below `md` prevents iOS focus zoom; the counter uses `tabular-nums`.',
  ],
  related: ['Input', 'Field', 'InputGroup'],
  requires: [
    'Throws a ContractError when the textarea has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count).',
  ],
  llmNotes: ['Use `Textarea` for multi-line only; use `Input` otherwise.', 'Set `maxlength` together with `show-count`.', 'Pass `class` for width/height; it lands on the textarea.', 'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.', 'Use `shape="pill"` sparingly on a textarea: it is `rounded-xl`, not a full pill.'],
  replaces: ['hand-rolled Textarea markup in app code'],
}
export default doc
