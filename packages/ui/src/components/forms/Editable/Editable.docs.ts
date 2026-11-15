import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Editable',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Inline editable text: click to edit, Enter saves, Escape cancels, blur saves (configurable).',
  description:
    'Use `Editable` for titles, names and short notes that should look like plain text until the user wants to change them (rename a project, edit a caption). The preview is a focusable button-like element: click (or double-click / focus via `activationMode`), Enter, Space or F2 starts editing; the input is focused and its text selected. `submitMode` controls what commits: `both` (Enter and blur, default), `enter` (blur cancels) or `blur` (Enter ignored). Escape always cancels. With `multiline` a textarea is used and Shift/Ctrl/Cmd+Enter commits. Not for forms that need always-visible fields: use `Input` / `Textarea` there.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'v-model text. `null` renders as empty. Uncontrolled when omitted.' },
    { name: 'placeholder', type: 'string', description: 'Muted text shown in preview while empty, and the control placeholder.' },
    { name: 'submitMode', type: "'both' | 'enter' | 'blur'", default: "'both'", description: '`both`: Enter and blur commit. `enter`: Enter commits, blur cancels. `blur`: only blur commits, Enter is ignored. Escape always cancels.' },
    { name: 'activationMode', type: "'click' | 'dblclick' | 'focus'", default: "'click'", description: 'How the preview enters edit mode with the pointer / focus. Enter, Space and F2 always work on the focused preview. In `focus` mode a keyboard commit still returns focus to the preview without re-entering edit mode.' },
    { name: 'multiline', type: 'boolean', default: 'false', description: 'Edit in a `<textarea>`; Enter inserts a newline, Shift/Ctrl/Cmd+Enter commits.' },
    { name: 'rows', type: 'number', default: '3', description: 'Textarea rows (multiline only).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Not editable, dimmed, `aria-disabled`. Also inherited from a Field.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Not editable and not interactive; renders as plain text.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required on the editing control. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` on the editing control. Also set by a Field with an error.' },
    { name: 'variant', type: "'plain' | 'outline' | 'filled' | 'underline'", default: "'plain'", description: 'Look of the preview before editing. `plain` reads as text until hovered, `outline` always shows a border, `filled` shows a muted fill, `underline` shows only a bottom rule. The editing control keeps a visible border (a thicker bottom rule for `underline`). Unknown values fall back to `plain`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of preview and control (12px, 14px, 16px or 18px from the `md` breakpoint; `lg` is always 18px). 16px below the `md` breakpoint (no iOS focus zoom). On coarse pointers both are at least 44px high.' },
    { name: 'ariaLabel', type: 'string', description: 'Accessible name of the editing control. The preview button is named `<ariaLabel>: <visible text>`, which contains its visible text.' },
    { name: 'savedLabel', type: 'string', default: "'Saved'", description: 'Spoken after a commit through a polite live region (`Saved: <text>`).' },
    { name: 'cancelledLabel', type: 'string', default: "'Changes discarded'", description: 'Spoken after the draft is discarded.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted on commit when the text changed.' },
    { name: 'submit', payload: '[value: string]', description: 'Emitted on every commit, even when unchanged.' },
    { name: 'cancel', payload: '[value: string]', description: 'Emitted when the draft is discarded; payload is the unchanged value.' },
    { name: 'edit', description: 'Emitted when edit mode starts.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: "const title = ref('Quarterly report')",
      code: `<div class="grid max-w-sm gap-2">
  <Editable v-model="title" placeholder="Untitled" aria-label="Title" />
  <p class="text-sm text-muted-foreground">Saved: {{ title }}</p>
</div>`,
      state: () => ({ title: ref('Quarterly report') }),
    },
    {
      title: 'Multiline',
      description: 'Enter adds a line; Shift+Enter (or Ctrl/Cmd+Enter) saves; Escape cancels.',
      script: "const note = ref('First line\\nSecond line')",
      code: `<Editable class="max-w-sm" v-model="note" multiline :rows="4" placeholder="Add a note" aria-label="Note" />`,
      state: () => ({ note: ref('First line\nSecond line') }),
    },
    {
      title: 'Submit modes',
      description: 'Only Enter saves in the first; only blur saves in the second.',
      script: "const a = ref('Enter only (blur cancels)')\nconst b = ref('Blur only (Enter ignored)')",
      code: `<div class="grid max-w-sm gap-2">
  <Editable v-model="a" submit-mode="enter" aria-label="Enter mode" />
  <Editable v-model="b" submit-mode="blur" aria-label="Blur mode" />
</div>`,
      state: () => ({ a: ref('Enter only (blur cancels)'), b: ref('Blur only (Enter ignored)') }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-sm gap-2">
  <Editable size="xs" model-value="Extra small" aria-label="Extra small" />
  <Editable size="sm" model-value="Small" aria-label="Small" />
  <Editable size="md" model-value="Medium" aria-label="Medium" />
  <Editable size="lg" model-value="Large" aria-label="Large" />
</div>`,
    },
    {
      title: 'Variants',
      description: 'Plain (default), outline, filled and underline previews. Click one to see the editing control.',
      code: `<div class="grid max-w-sm gap-2">
  <Editable model-value="Plain preview" aria-label="Plain" />
  <Editable variant="outline" model-value="Outline preview" aria-label="Outline" />
  <Editable variant="filled" model-value="Filled preview" aria-label="Filled" />
  <Editable variant="underline" model-value="Underline preview" aria-label="Underline" />
</div>`,
    },
    {
      title: 'Disabled and readonly',
      code: `<div class="grid max-w-sm gap-2">
  <Editable disabled model-value="Disabled" aria-label="Disabled" />
  <Editable readonly model-value="Read only" aria-label="Read only" />
</div>`,
    },
    {
      title: 'Events',
      script: "const name = ref('Sample project')\nconst log = ref('')",
      code: `<div class="grid max-w-sm gap-2">
  <Editable v-model="name" aria-label="Project name" @edit="log = 'editing'" @submit="log = 'saved'" @cancel="log = 'cancelled'" />
  <p class="text-sm text-muted-foreground">Last event: {{ log || 'none' }}</p>
</div>`,
      state: () => ({ name: ref('Sample project'), log: ref('') }),
    },
  ],
  a11y: [
    'Preview is `role="button"` with `tabindex="0"`; Enter, Space or F2 starts editing. Disabled/readonly previews are not interactive.',
    'The preview button is named `<ariaLabel>: <visible text>` (or the Field label plus its text through `aria-labelledby`), so the visible text is always part of the name. The editing control gets `ariaLabel`, `aria-invalid`, `required`, `autocomplete="off"`, `enterkeyhint="done"` and Field wiring.',
    'Escape cancels; after a keyboard commit/cancel focus returns to the preview (also in `activationMode="focus"`) so keyboard users keep their place.',
    'A commit or cancel is announced through a polite `role="status"` region ("Saved: <text>", "Changes discarded").',
    'Responsive: preview and control are at least 32px high (44px on coarse pointers) and 16px text on small screens; the preview wraps long text and never overflows at 320px. Hover adds a border, so the editable state does not rely on background alone.',
    'Every `variant` keeps a visible way to tell it is editable and a visible focus indicator: `outline`, `filled` and `underline` show their edge at rest, `plain` shows a border on hover and focus. Forced-colors mode draws the border of every variant in system colours. `variant` never changes the keyboard map or the accessible name.',
    'IME composition Enter does not commit.',
  ],
  related: ['Input', 'Textarea', 'Field', 'CopyField'],
  requires: [
    'Throws a ContractError when the control has no accessible name: no `ariaLabel` (or `aria-label`) and no `Field` label.',
  ],
  llmNotes: [
    'Use Editable for inline rename/caption patterns, not for regular form fields (use Input/Textarea).',
    'Always provide `aria-label` or a Field label (an `aria-labelledby` on the root does not reach the control); add `placeholder` so empty values stay clickable.',
    'Use `v-model`; listen to `submit`/`cancel` for side effects like API calls.',
    'Use `variant="plain"` for titles that should read as text, `outline` or `filled` when the value must look editable at rest, `underline` inside dense forms. `size` also takes `xs`.',
    'Use `multiline` for long text: plain Enter inserts a newline, Shift/Ctrl+Enter saves.',
  ],
  replaces: ['custom click-to-edit text components'],
}
export default doc
