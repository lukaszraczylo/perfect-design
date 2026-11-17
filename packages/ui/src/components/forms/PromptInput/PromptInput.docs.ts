import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'
import { faPlus } from '../../../lib/icons'

const doc: ComponentDoc = {
  name: 'PromptInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Auto-growing message box for chat style interfaces: Enter sends, Shift+Enter adds a line, a Stop button replaces Send while a reply is running.',
  description:
    'Use `PromptInput` at the bottom of a conversation or a command panel where one block of text is sent at a time. It grows with its text up to `maxRows`, then scrolls. `submitOn="enter"` (default) sends on Enter and inserts a line break on Shift+Enter; `submitOn="mod-enter"` sends on Ctrl or Cmd with Enter and keeps Enter for line breaks, which suits long prompts. An Enter that confirms an IME candidate never sends. Text that is empty or only whitespace never sends; the `submit` event carries the trimmed text and the field clears afterwards unless `clearOnSubmit` is off. While `loading` the Send button becomes a Stop button (emits `stop`) and sending is blocked, but the field stays editable so the next prompt can be drafted. `maxLength` shows a `count / limit` counter in code points; typing past the limit is allowed so pasted text is not cut, but the over-limit state is shown in text and an icon, `aria-invalid` is set and sending is blocked. The component renders no `<form>` and no messages: the app owns the conversation. Use `Textarea` for ordinary form fields and `Input` for one-line text. `class` goes on the root; every other attribute reaches the `<textarea>`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'v-model text. Uncontrolled when omitted.' },
    { name: 'placeholder', type: 'string', description: 'Hint text while the field is empty. It is not the accessible name.' },
    { name: 'submitOn', type: "'enter' | 'mod-enter'", default: "'enter'", description: 'Key that sends. `enter`: Enter sends, Shift+Enter (or Alt+Enter) adds a line. `mod-enter`: Ctrl or Cmd with Enter sends, Enter adds a line. Never sends while an IME is composing.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'A reply is in progress. Shows the Stop button instead of Send, sets `aria-busy` and `data-loading` on the root, and blocks sending. The field stays editable.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the field and both buttons. Also inherited from a surrounding Field.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Blocks editing and sending. The Stop button keeps working while `loading`.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error, and by being over `maxLength`.' },
    { name: 'variant', type: "'default' | 'filled' | 'minimal'", default: "'default'", description: 'Surface of the box. `default` is bordered, `filled` uses a muted fill, `minimal` shows its border on hover and focus. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, text size (14px, 14px, 16px from `md`; 16px below it) and button size (32px, 36px, 44px; 44px on touch). Unknown values fall back to `md`.' },
    { name: 'rows', type: 'number', default: '1', description: 'Rows shown while the text is short.' },
    { name: 'maxRows', type: 'number', default: '8', description: 'Rows the field grows to before the text scrolls inside it.' },
    { name: 'maxLength', type: 'number', description: 'Character limit in code points (an emoji counts as one). Adds the counter and the limit states. It is not the native `maxlength`, so typing past it is allowed.' },
    { name: 'clearOnSubmit', type: 'boolean', default: 'true', description: 'Empties the field after a successful submit and emits `update:modelValue` with `""`. Turn off to keep the text until the app decides.' },
    { name: 'submitLabel', type: 'string', default: "'Send'", description: 'Accessible name of the Send button. Set it when the app is not in English.' },
    { name: 'stopLabel', type: 'string', default: "'Stop'", description: 'Accessible name of the Stop button.' },
    { name: 'limitNearLabel', type: 'string', default: "'Close to the character limit'", description: 'Announced politely once when the text reaches 90% of `maxLength`.' },
    { name: 'limitOverLabel', type: 'string', default: "'Over the character limit'", description: 'Shown beside the counter and announced politely once when the text is over `maxLength`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the root (the prompt box); wins over internal classes. Other attributes go to the `<textarea>`.' },
  ],
  slots: [
    { name: 'header', description: 'Above the text, for attachment chips or a quoted message.' },
    { name: 'attach', description: 'Start of the toolbar under the text: the attach button, mode toggles. Give every icon-only button a label.' },
    { name: 'actions', description: 'End of the toolbar, before Send or Stop: a voice button, a model picker.' },
    { name: 'footer', description: 'Below the toolbar, in small muted text: a keyboard hint or a notice.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted on every input event, and with `""` after a submit when `clearOnSubmit` is on.' },
    { name: 'submit', payload: '[value: string]', description: 'The trimmed text. Not emitted when the text is empty or whitespace, over `maxLength`, `loading`, `disabled` or `readonly`.' },
    { name: 'stop', description: 'The Stop button was pressed while `loading`.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: "const text = ref('')\nconst sent = ref('')\nfunction onSubmit(v) { sent.value = v }",
      code: `<div class="grid max-w-xl gap-2">
  <PromptInput v-model="text" aria-label="Message" placeholder="Write a message" @submit="onSubmit" />
  <p class="text-sm text-muted-foreground">Last sent: {{ sent || 'nothing yet' }}</p>
</div>`,
      state: () => {
        const sent = ref('')
        return { text: ref(''), sent, onSubmit: (v: string) => (sent.value = v) }
      },
    },
    {
      title: 'Streaming with a Stop button',
      description: 'While `loading` the Send button is replaced by Stop. The field stays editable so the next prompt can be drafted.',
      script: "const text = ref('Summarise the sample notes')\nconst busy = ref(false)\nfunction start() { busy.value = true }\nfunction stop() { busy.value = false }",
      code: `<div class="grid max-w-xl gap-2">
  <PromptInput v-model="text" aria-label="Message" :loading="busy" @submit="start" @stop="stop" />
  <p class="text-sm text-muted-foreground">{{ busy ? 'Reply running. Press Stop to end it.' : 'Idle.' }}</p>
</div>`,
      state: () => {
        const busy = ref(false)
        return { text: ref('Summarise the sample notes'), busy, start: () => (busy.value = true), stop: () => (busy.value = false) }
      },
    },
    {
      title: 'Character limit',
      description: 'The counter reads `count / limit`. Near the limit it turns bold and a polite status speaks once; over it, an icon and text join the counter, `aria-invalid` is set and Send is disabled.',
      script: "const text = ref('This sample text is already over the limit of twenty characters.')",
      code: `<PromptInput v-model="text" class="max-w-xl" aria-label="Note" :max-length="20" />`,
      state: () => ({ text: ref('This sample text is already over the limit of twenty characters.') }),
    },
    {
      title: 'Send with Ctrl or Cmd and Enter',
      description: '`submitOn="mod-enter"` keeps Enter for line breaks, which suits long prompts.',
      script: "const text = ref('')",
      code: `<PromptInput v-model="text" class="max-w-xl" aria-label="Long prompt" submit-on="mod-enter" :rows="3" placeholder="Press Enter for a new line, Ctrl or Cmd with Enter to send">
  <template #footer>Ctrl or Cmd with Enter sends.</template>
</PromptInput>`,
      state: () => ({ text: ref('') }),
    },
    {
      title: 'Attach button, actions and footer',
      description: 'The toolbar slots take plain buttons. Icon-only buttons need an `aria-label`.',
      script: "const text = ref('')",
      code: `<PromptInput v-model="text" class="max-w-xl" aria-label="Message">
  <template #header><Badge variant="outline">notes.txt</Badge></template>
  <template #attach><IconButton label="Attach a file" variant="outline" shape="circle" :icon="faPlus" /></template>
  <template #actions><Badge variant="secondary">Draft - fast</Badge></template>
  <template #footer>Enter sends, Shift+Enter adds a line.</template>
</PromptInput>`,
      state: () => ({ text: ref(''), faPlus }),
    },
    {
      title: 'Variants',
      description: 'Default (bordered), filled and minimal side by side.',
      code: `<div class="grid max-w-xl gap-3">
  <PromptInput variant="default" aria-label="Default" placeholder="Default" />
  <PromptInput variant="filled" aria-label="Filled" placeholder="Filled" />
  <PromptInput variant="minimal" aria-label="Minimal" placeholder="Minimal" />
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Small, medium (default) and large. Text stays 16px below `md` and the buttons grow to 44px on touch devices.',
      code: `<div class="grid max-w-xl gap-3">
  <PromptInput size="sm" aria-label="Small" placeholder="Small" />
  <PromptInput size="md" aria-label="Medium" placeholder="Medium" />
  <PromptInput size="lg" aria-label="Large" placeholder="Large" />
</div>`,
    },
    {
      title: 'Auto-grow and max rows',
      description: 'The field grows from `rows` to `maxRows`; longer text scrolls inside it.',
      script: "const text = ref('First line\\nSecond line\\nThird line\\nFourth line\\nFifth line')",
      code: `<PromptInput v-model="text" class="max-w-xl" aria-label="Draft" :rows="2" :max-rows="4" />`,
      state: () => ({ text: ref('First line\nSecond line\nThird line\nFourth line\nFifth line') }),
    },
    {
      title: 'Disabled and read-only',
      code: `<div class="grid max-w-xl gap-3">
  <PromptInput disabled aria-label="Disabled" model-value="Not available right now" />
  <PromptInput readonly loading aria-label="Read-only while running" model-value="Draft is locked" />
</div>`,
    },
    {
      title: 'In a Field',
      script: "const text = ref('')",
      code: `<Field class="max-w-xl" label="Message" hint="Sample hint: keep it short.">
  <PromptInput v-model="text" :max-length="200" />
</Field>`,
      state: () => ({ text: ref('') }),
    },
  ],
  a11y: [
    'The `<textarea>` is the only tab stop for typing and carries the accessible name; buttons are native `<button>` elements named "Send" and "Stop" (`submitLabel`, `stopLabel`). Name the field with `aria-label`, `aria-labelledby` or a `Field` label; a placeholder is not a name.',
    'Keyboard: Enter sends (Shift+Enter inserts a line) or, with `submitOn="mod-enter"`, Ctrl or Cmd with Enter sends and Enter inserts a line. An Enter that confirms an IME candidate (`isComposing`, keyCode 229) is ignored, so Japanese, Chinese and Korean input is not cut off. Tab moves from the field to the toolbar buttons.',
    'With `maxLength` the counter is read once when the field gets focus (`aria-describedby`). A separate polite `role="status"` region stays empty until the text reaches 90% of the limit or goes over it, then says one fixed sentence, so a screen reader does not read the count on every key.',
    'The over-limit state is never colour alone: the counter gains an icon and the words in `limitOverLabel`, the field gets `aria-invalid="true"` and the Send button is disabled. The Stop button is a named button, and the root carries `aria-busy` while `loading`.',
    'The focus ring surrounds the whole box while the field has keyboard focus; forced-colors mode draws an outline. Targets: 32, 36 and 44px buttons by `size`, 44px on touch devices, never below 24px in the dense style packs. Text is 16px below `md`. The toolbar wraps at 320px and layout uses logical properties (RTL safe).',
    'Auto-grow reads the layout and does nothing when there is none (hidden container, tests). It follows width changes through a `ResizeObserver`, so it re-measures when the box is narrowed.',
  ],
  related: ['Textarea', 'Input', 'Field', 'ModelPicker', 'IconButton'],
  requires: ['Throws a ContractError when the textarea has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder does not count).'],
  llmNotes: [
    'Always set `aria-label` (or use Field); a placeholder is not a name.',
    'Listen to `@submit` (trimmed text, never empty) and `@stop`; the component renders no messages and no form.',
    'Set `loading` while a reply streams so Send turns into Stop; wire `@stop` to cancel the request.',
    'Use `max-length` for a limit: it allows typing past it and blocks sending. It is not the native `maxlength`.',
    'Put the attach button in the `attach` slot and give icon-only buttons a label. Do not wrap the component in a form just to catch Enter.',
    'Look props are `variant` and `size`; width goes in `class`, other attributes (`name`, `autofocus`, `autocomplete`) reach the textarea.',
  ],
  replaces: ['hand-rolled chat composer markup in app code', 'shadcn-vue Textarea with a send button'],
}
export default doc
