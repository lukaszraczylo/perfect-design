import { ref } from 'vue'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'FileDropzone',
  group: 'forms',
  subgroup: 'Upload',
  summary: 'Drag-and-drop or click-to-browse file picker with type, size and count validation. Selection only, no upload.',
  description:
    'Collects `File` objects; **it never uploads anything**. Send the `v-model` files to your own endpoint. Validation runs on drop and on pick: `accept` (native syntax: `image/*`, `.pdf`, `text/csv`), `maxSize` (bytes), `maxFiles` (with `multiple`). Accepted files go to `v-model` (always `File[]`); rejected ones are reported through `reject` (`[{ file, reason: "type" | "size" | "count" }]`) and a human-readable `error` message, which is also shown inline. In single mode a new file replaces the old one. Duplicates (same name, size and modified time) are ignored. The whole area is a native `<button>` (Enter and Space open the picker); customise its content with the default slot, which receives `{ dragging }`. `variant`, `size` and `status` change the look of the area. There is no `shape`: the area is a tall panel and a pill or square corner adds nothing to it. There is no `underline`: a bottom rule alone does not read as a place to drop files, so `solid` and `filled` cover the quieter looks.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'File[] | null', description: 'Accepted files. Always an array, also without `multiple`.' },
    { name: 'accept', type: 'string', description: 'Comma separated MIME types, wildcards or extensions, e.g. `image/*,.pdf`. Case-insensitive. Everything is accepted when omitted.' },
    { name: 'maxSize', type: 'number', description: 'Maximum size per file in bytes. Larger files are rejected with reason `size`.' },
    { name: 'maxFiles', type: 'number', description: 'Maximum total files (requires `multiple`; single mode always allows one). Extra files are rejected with reason `count`.' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow several files; new files are appended instead of replacing.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks click, keyboard, drag/drop and file removal.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required on the hidden input.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid and destructive styling. Also applied automatically while a rejection message is shown.' },
    { name: 'name', type: 'string', description: 'Form field name of the hidden file input.' },
    { name: 'showFiles', type: 'boolean', default: 'true', description: 'Render the list of accepted files with remove buttons.' },
    { name: 'ariaLabel', type: 'string', description: 'Extra name text, rendered visually hidden inside the button so the visible prompt always stays part of the accessible name. A surrounding Field label is added to the name as well.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the drop area: 64, 96, 128 or 192 px minimum. The default icon scales with it. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'outline' | 'solid' | 'filled' | 'ghost'", default: "'outline'", description: 'Surface of the drop area. `outline` is the dashed border, `solid` draws the border as a continuous line, `filled` replaces it with a muted fill, `ghost` shows the border on hover, focus and while dragging. Unknown values fall back to `outline`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status. Colours the border and adds an icon in the top corner; `success` and `warning` also add hidden text that `aria-describedby` points at. `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root wrapper (dropzone + list); wins over internal classes. Other attributes go to the dropzone area.' },
  ],
  slots: [{ name: 'default', props: '{ dragging: boolean }', description: 'Content of the dropzone area. Replaces the default icon, prompt and constraints hint.' }],
  emits: [
    { name: 'update:modelValue', payload: '[files: File[]]', description: 'Fires when accepted files are added or one is removed.' },
    { name: 'reject', payload: "[rejections: { file: File; reason: 'type' | 'size' | 'count' }[]]", description: 'Fires when any file was not accepted.' },
    { name: 'error', payload: '[message: string]', description: 'Human-readable summary of the rejection (also shown inline with role="alert").' },
  ],
  examples: [
    {
      title: 'Images up to 2 MB',
      script: `const files = ref([])`,
      code: `<div class="w-96 max-w-full">
  <FileDropzone v-model="files" accept="image/*" :max-size="2 * 1024 * 1024" aria-label="Upload an image" />
  <p class="mt-2 text-sm text-muted-foreground tabular-nums">{{ files.length }} file(s) selected</p>
</div>`,
      state: () => ({ files: ref<File[]>([]) }),
    },
    {
      title: 'Multiple with limits and custom content',
      script: `const docs = ref([])
const message = ref('')`,
      code: `<Field label="Attachments" hint="PDF only, up to 3 files" class="w-96 max-w-full">
  <FileDropzone v-model="docs" multiple accept=".pdf" :max-files="3" @error="message = $event">
    <template #default="{ dragging }">
      <Icon :icon="faFilePdf" size="xl" />
      <span>{{ dragging ? 'Release to add' : 'Drop PDFs or click to browse' }}</span>
    </template>
  </FileDropzone>
  <p class="mt-2 text-sm text-muted-foreground tabular-nums">{{ docs.length }} file(s) kept. Last rejection: {{ message || 'none' }}</p>
</Field>`,
      state: () => ({ docs: ref<File[]>([]), message: ref(''), faFilePdf }),
    },
    {
      title: 'Variants',
      description: 'Outline (dashed, default), solid, filled and ghost.',
      code: `<div class="grid w-96 max-w-full gap-3">
  <FileDropzone aria-label="Outline dropzone" size="sm" />
  <FileDropzone aria-label="Solid dropzone" size="sm" variant="solid" />
  <FileDropzone aria-label="Filled dropzone" size="sm" variant="filled" />
  <FileDropzone aria-label="Ghost dropzone" size="sm" variant="ghost" />
</div>`,
    },
    {
      title: 'Sizes',
      description: 'A compact row for tight forms up to a roomy area for a primary upload.',
      code: `<div class="grid w-96 max-w-full gap-3">
  <FileDropzone aria-label="Extra small dropzone" size="xs" />
  <FileDropzone aria-label="Small dropzone" size="sm" />
  <FileDropzone aria-label="Medium dropzone" />
  <FileDropzone aria-label="Large dropzone" size="lg" />
</div>`,
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon in the top corner. Pair them with a visible message in a Field.',
      code: `<div class="grid w-96 max-w-full gap-4">
  <Field label="Signed copy" hint="Sample message: the file was verified."><FileDropzone status="success" size="sm" /></Field>
  <Field label="Photo" hint="Sample message: the image is lower resolution than advised."><FileDropzone status="warning" size="sm" /></Field>
  <Field label="Contract" error="Sample message: attach the contract."><FileDropzone status="error" size="sm" /></Field>
</div>`,
    },
    {
      title: 'Disabled',
      code: `<FileDropzone class="w-96 max-w-full" disabled aria-label="Uploads disabled" />`,
    },
  ],
  a11y: [
    'The drop area is a native `<button type="button">`: Tab focuses it, Enter and Space open the file picker, and disabled removes it from the tab order. Clicking or pressing the button is the keyboard and touch alternative to dragging files in.',
    'The accessible name is the visible prompt text. `ariaLabel` adds hidden text inside the button instead of replacing the name (WCAG 2.5.3 label in name). Inside a `Field`, the Field label and the prompt are combined with `aria-labelledby`.',
    'A hidden native file input does the real work, stays out of the tab order and is `aria-hidden`.',
    'Rejections render in a `role="alert"` paragraph, linked with `aria-describedby`, and set `aria-invalid` on the button. Accepted and removed files are announced politely through a visually hidden `role="status"` region ("report.pdf added").',
    'Each accepted file has a remove button named "Remove <file name>"; it is 24px square and grows to 44px on coarse pointers.',
    'Dragging adds `data-dragging` to the root and the area and changes the text to "Drop to upload". In forced-colors mode the dragging state adds an outline, so it does not depend on colour alone.',
    '`status` is never colour alone: success, warning and error draw an icon in the top corner, and success and warning add visually hidden text ("Valid", "Warning") outside the button that the button references from `aria-describedby` (so it does not change the accessible name). Error sets `aria-invalid` and relies on the Field error message.',
    'Every `variant` keeps a visible edge or fill and the focus ring; `filled` and `ghost` draw a system-colour border in forced-colors mode, so the area never disappears.',
    'Responsive: the area and file names shrink with `min-w-0` and truncate, so nothing overflows at 320px.',
  ],
  related: ['Field', 'Input', 'Button'],
  requires: [
    'Throws a ContractError when the drop area has no accessible name: custom slot content without text, and no `ariaLabel`, `aria-label` or `Field` label.',
  ],
  llmNotes: [
    'v-model is File[] (even in single mode). The component never uploads: send files yourself.',
    'Handle `reject`/`error` or rely on the inline message; set `max-size` in BYTES.',
    'Look props are `variant`, `size` and `status`; there is no `shape` or `underline` (see the description). `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
    '`max-files` only applies together with `multiple`.',
    'Custom slot content must be phrasing content (spans, icons) and must not contain interactive elements: the area is itself a button.',
    'Do not pass `aria-label` through attrs: it would replace the visible prompt in the accessible name. Use the `ariaLabel` prop.',
  ],
  replaces: ['ad-hoc dropzone divs', '<input type="file"> usages'],
}
export default doc
