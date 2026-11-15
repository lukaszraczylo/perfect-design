import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'TagsInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Free-form list of short strings entered as removable chips.',
  description:
    'Type text and press Enter or the delimiter (comma by default) to turn it into a tag; remove tags with their delete button, or Backspace/Delete once the caret is at the start. Tags are trimmed, empty tags are ignored, duplicates (case-sensitive) are rejected and `max` limits the count. Additions, removals and rejections are spoken through a polite live region, and rejections also surface through the `duplicate` and `reject` events so you can show a visible message. `v-model` is a `string[]`. Use `Combobox` when tags must come from a fixed list, `Input` for a single value.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string[] | null', description: 'Controlled tags.' },
    { name: 'defaultValue', type: 'string[]', default: '[]', description: 'Initial tags when uncontrolled.' },
    { name: 'placeholder', type: 'string', description: 'Shown only while there are no tags.' },
    { name: 'max', type: 'number', description: 'Maximum number of tags; extra additions are rejected with reason `max`. Unlimited when omitted or 0.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables typing and removal.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Marks the hidden form input as required.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid on the text input and destructive styling on the field.' },
    { name: 'delimiter', type: 'string | RegExp', default: "','", description: 'Typing this character commits the text as a tag. Enter always commits. Also splits pasted text with `addOnPaste`.' },
    { name: 'addOnBlur', type: 'boolean', default: 'false', description: 'Add the pending text when the input loses focus.' },
    { name: 'addOnPaste', type: 'boolean', default: 'false', description: 'Split pasted text on the delimiter and add every part.' },
    { name: 'name', type: 'string', description: 'Form field name; inside a native form hidden inputs `name[0]`, `name[1]`... are rendered.' },
    { name: 'ariaLabel', type: 'string', description: 'Accessible name of the text input when there is no Field label.' },
    { name: 'removeLabel', type: 'string', default: "'Remove'", description: 'Prefix of each remove button name, e.g. "Remove react".' },
    { name: 'addedLabel', type: 'string', default: "'Added'", description: 'Spoken after a tag is added through the polite live region (`Added react`).' },
    { name: 'removedLabel', type: 'string', default: "'Removed'", description: 'Spoken after a tag is removed (`Removed react`).' },
    { name: 'duplicateLabel', type: 'string', default: "'Already added'", description: 'Spoken when the text matches an existing tag (`Already added: react`).' },
    { name: 'maxLabel', type: 'string', default: "'Tag limit reached'", description: 'Spoken when `max` blocks an addition (`Tag limit reached: react`).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Minimum height of the field (28 / 32 / 36 / 44 px) and text size of the typing input. Tags wrap and grow the field. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface. `outline` is the bordered default, `filled` uses a muted fill, `underline` keeps a bottom rule that thickens while focus is inside, `ghost` shows its border on hover and focus. Unknown values fall back to `outline`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is a large radius box (not a full pill) so wrapped tags are never clipped. `underline` is always square-cornered. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status. Colours the border and adds an icon in the first row; `success` and `warning` also add hidden text that the text input\'s `aria-describedby` points at. `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes. Other attributes (id, aria-*, data-*) go to the text input.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string[]]', description: 'Fires when tags are added or removed.' },
    { name: 'add', payload: '[tag: string]', description: 'A tag was added.' },
    { name: 'remove', payload: '[tag: string]', description: 'A tag was removed.' },
    { name: 'duplicate', payload: '[tag: string]', description: 'The (trimmed) text already exists and was not added.' },
    { name: 'reject', payload: "[payload: { value: string; reason: 'duplicate' | 'max' }]", description: 'Any rejected addition. Also fires after `duplicate`.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: `const skills = ref(['vue', 'typescript'])`,
      code: `<div class="flex w-80 flex-col gap-2">
  <TagsInput v-model="skills" placeholder="Add a skill" aria-label="Skills" />
  <p class="text-sm text-muted-foreground">{{ skills.length }} tags</p>
</div>`,
      state: () => ({ skills: ref(['vue', 'typescript']) }),
    },
    {
      title: 'Limit with feedback',
      description: 'Listen to `reject` to show why a tag was not added. The reason is also spoken by the built-in status region.',
      script: `const tags = ref(['one', 'two'])
const error = ref('')
function onReject({ value, reason }) {
  error.value = reason === 'max' ? 'At most 3 tags.' : \`"\${value}" is already added.\`
}`,
      code: `<Field label="Keywords" hint="Press Enter or comma to add" :error="error" class="w-80">
  <TagsInput v-model="tags" :max="3" @reject="onReject" @add="error = ''" />
</Field>`,
      state: () => {
        const tags = ref(['one', 'two'])
        const error = ref('')
        return {
          tags,
          error,
          onReject: ({ value, reason }: { value: string; reason: string }) => {
            error.value = reason === 'max' ? 'At most 3 tags.' : `"${value}" is already added.`
          },
        }
      },
    },
    {
      title: 'Variants and shapes',
      description: 'Outline (default), filled, underline and ghost, then pill and square corners.',
      code: `<div class="grid w-80 max-w-full gap-2">
  <TagsInput :default-value="['outline']" aria-label="Outline" />
  <TagsInput variant="filled" :default-value="['filled']" aria-label="Filled" />
  <TagsInput variant="underline" :default-value="['underline']" aria-label="Underline" />
  <TagsInput variant="ghost" :default-value="['ghost']" aria-label="Ghost" />
  <TagsInput shape="pill" :default-value="['pill']" aria-label="Pill" />
  <TagsInput shape="square" :default-value="['square']" aria-label="Square" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="grid w-80 max-w-full gap-2">
  <TagsInput size="xs" :default-value="['xs']" aria-label="Extra small" />
  <TagsInput size="sm" :default-value="['sm']" aria-label="Small" />
  <TagsInput :default-value="['md']" aria-label="Medium" />
  <TagsInput size="lg" :default-value="['lg']" aria-label="Large" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon at the end of the first row. Pair them with a visible message in a Field.',
      code: `<div class="grid w-80 max-w-full gap-3">
  <Field label="Approved keywords" hint="Sample message: every keyword is accepted."><TagsInput status="success" :default-value="['one']" /></Field>
  <Field label="Draft keywords" hint="Sample message: two keywords are very similar."><TagsInput status="warning" :default-value="['two', 'too']" /></Field>
  <Field label="Required keywords" error="Sample message: add at least one keyword."><TagsInput status="error" placeholder="Add a keyword" /></Field>
</div>`,
    },
    {
      title: 'Disabled',
      code: `<TagsInput class="w-80" :model-value="['locked', 'read-only']" disabled aria-label="Locked tags" />`,
    },
  ],
  a11y: [
    'The text input keeps native input semantics; tags are listed before it and each remove button is named "Remove <tag>" (the button labels itself, because the library part otherwise names it with the bare tag text). Remove buttons are 24px square (36px on coarse pointers).',
    'Additions, removals, duplicates and `max` rejections are announced through a polite `role="status"` region. After a tag is removed with its button, focus moves back to the text input.',
    'Backspace (or ArrowLeft) at the start of an empty input highlights the last tag (aria-current); Backspace/Delete again removes it.',
    'Inside `Field` the text input gets the field id (so the Field label names it), aria-describedby and aria-invalid; pass `aria-label` otherwise.',
    'The field wraps tags onto new lines, is at least 44px high on coarse pointers, uses 16px text on small screens and shows a forced-colors outline while focused. The selected chip has a ring and, in forced-colors mode, an outline.',
    '`status` is never colour alone: success, warning and error draw an icon, and success and warning add visually hidden text ("Valid", "Warning") that the text input references from `aria-describedby`. Error sets `aria-invalid` and relies on the Field error message.',
    'Every `variant` keeps a visible edge or fill and the focus indicator on the container (a ring, or a thicker bottom border for `underline`); forced-colors mode draws the border of `underline` and `ghost` in system colours.',
    'Enter never submits the surrounding form while text is pending.',
  ],
  related: ['Combobox', 'Input', 'Field', 'Badge'],
  requires: [
    'Throws a ContractError when the text input has no accessible name: no `Field` label, `for` label, `ariaLabel` or `aria-labelledby`.',
  ],
  llmNotes: [
    'v-model is string[]; tags are trimmed and case-sensitive unique.',
    'Surface `reject` (reason duplicate | max) with a visible Field error. A screen reader already hears the rejection through the built-in status region.',
    'Attributes such as id/aria-label land on the inner text input, class lands on the root.',
    'Look props are `variant`, `shape`, `status` and `size`. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
    'Use Combobox, not TagsInput, when values must come from a fixed set.',
  ],
  replaces: ['ad-hoc chip inputs'],
}
export default doc
