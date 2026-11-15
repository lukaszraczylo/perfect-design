import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Field',
  group: 'forms',
  subgroup: 'Field wrappers',
  summary: 'Form-field wrapper: label, control, hint and error with automatic id, aria-describedby and aria-invalid wiring.',
  description:
    'Wrap one form control in `Field`. It generates an id (or uses `id`), renders a `Label` with `for`, a hint and an error message, and provides a context that `Input`, `Textarea`, `PasswordInput`, `SearchInput` and other form controls read to set `id`, `aria-describedby`, `aria-invalid`, `required` and `disabled`. Use `orientation="horizontal"` for checkbox/switch rows. Group several fields with `FieldGroup` / `Fieldset`. Custom controls can opt in with `useFieldControl()` exported from the package. When a control fails a native constraint (`required`, `pattern`, `minlength`) after the user has interacted with it, the browser message is shown as the error, so the message, `aria-invalid` and `aria-describedby` appear together.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', description: 'Label text. Use the `label` slot for rich content.' },
    { name: 'hint', type: 'string', description: 'Helper text under the control; referenced by aria-describedby.' },
    { name: 'error', type: 'string', description: 'Error message; marks the control invalid and is announced through a polite live region. Wins over the native validation message.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Mark invalid without a message.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Shows the required indicator and sets `required` on the control.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the control and dims the label.' },
    { name: 'id', type: 'string', description: 'Control id. Generated with `useId()` when omitted.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Label above the control, or beside it.' },
    { name: 'hintPlacement', type: "'below' | 'above'", default: "'below'", description: '`above` puts the hint between the label and the control. Ignored when horizontal. Both placements are linked by `aria-describedby`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of the label, hint and error (12px, 14px, 16px) and the gap between them. Pair it with the same `size` on the control. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [
    { name: 'default', description: 'The control.' },
    { name: 'label', description: 'Rich label content (overrides `label`).' },
    { name: 'hint', description: 'Rich hint content (overrides `hint`).' },
    { name: 'error', description: 'Rich error content (overrides `error`).' },
  ],
  examples: [
    {
      title: 'Label and hint',
      code: `<Field class="max-w-sm" label="Username" hint="Letters and numbers only.">
  <Input name="username" autocomplete="username" />
</Field>`,
    },
    {
      title: 'Error state with live validation',
      script: "const bio = ref('')",
      code: `<Field class="max-w-sm" label="Bio" required :error="bio.length < 10 ? 'At least 10 characters' : ''" hint="Tell us about yourself.">
  <Textarea v-model="bio" />
</Field>`,
      state: () => ({ bio: ref('Hi') }),
    },
    {
      title: 'Hint above the control',
      code: `<Field class="max-w-sm" label="Display name" hint="Shown next to your comments." hint-placement="above">
  <Input name="display-name" autocomplete="nickname" />
</Field>`,
    },
    {
      title: 'Native validation and submit handling',
      script: "const status = ref('')",
      code: `<form class="grid max-w-sm gap-4" @submit.prevent="status = 'Submitted without errors.'">
  <Field label="Email" hint="Format: name@example.com." required>
    <Input type="email" name="email" autocomplete="email" />
  </Field>
  <Button type="submit">Send</Button>
  <p role="status" class="text-sm text-muted-foreground">{{ status }}</p>
</form>`,
      state: () => ({ status: ref('') }),
    },
    {
      title: 'Sizes',
      description: 'The size changes the label, hint and error text and the gap; give the control the same size.',
      code: `<div class="grid max-w-sm gap-4">
  <Field size="sm" label="Small" hint="12px text."><Input size="sm" /></Field>
  <Field label="Medium" hint="14px text."><Input /></Field>
  <Field size="lg" label="Large" hint="16px text." error="Needs a value."><Input size="lg" /></Field>
</div>`,
    },
    {
      title: 'Horizontal (switch row)',
      script: 'const on = ref(true)',
      code: `<Field orientation="horizontal" label="Email notifications" hint="Weekly summary.">
  <Switch v-model="on" />
</Field>`,
      state: () => ({ on: ref(true) }),
    },
  ],
  a11y: [
    'The `<label for>` matches the control id. Group controls (RadioGroup, SegmentedControl, CheckboxCardGroup, RadioCardGroup) are named through `aria-labelledby` pointing at the label, because a `for` attribute cannot label a `div`.',
    'The hint and the error are referenced by `aria-describedby`; the error is referenced only while it exists. `aria-invalid="true"` is set only when the field is invalid; a required control that is valid reports `aria-invalid="false"` so Firefox and Safari do not announce it as invalid on page load.',
    'The error text sits in one polite live region that is always in the page. An error that appears or changes after the user leaves a field is announced; an error already present at load is not. After a failed submit, move focus to the first invalid field so its error is read through `aria-describedby`.',
    'Required is exposed by the native `required` attribute on the control plus a visible asterisk (decorative, `aria-hidden`).',
    'Browser constraint failures are surfaced only after interaction (`:user-invalid`), never while typing in a pristine field.',
    'Controls that ignore the context (third-party inputs) need `:id` bound manually. The error is never colour-only: it is text.',
  ],
  related: ['Label', 'Input', 'Textarea', 'FieldGroup', 'Fieldset'],
  requires: [
    'Throws a ContractError when the Field wraps a control that has no accessible name and the Field has no `label` (prop or slot) and no `aria-label` / `aria-labelledby`.',
    'Throws a ContractError when the Field has a label and wraps a native input, textarea or select whose `id` differs from the id the label points at (pass that id to `Field` instead of the control).',
  ],
  llmNotes: [
    'Wrap every form control in `Field`; one control per Field.',
    'Show errors through the `error` prop, not custom markup. Do not validate on every keystroke; validate on blur or submit.',
    'Native `required`, `pattern` and `minlength` messages are shown automatically after interaction; `error` overrides them.',
    'Use `orientation="horizontal"` for Checkbox/Switch rows.',
    'For several related controls (radio set, date range) use `Fieldset` with a legend instead.',
  ],
  replaces: ['hand-rolled Field markup in app code'],
}
export default doc
