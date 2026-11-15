import { ref } from 'vue'
import { useConfirm } from './useConfirm'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ConfirmDialog',
  group: 'feedback',
  subgroup: 'Confirmation',
  summary: 'Confirm / cancel dialog with destructive styling and async-aware confirm, plus a promise-based useConfirm() host.',
  description:
    'Two ways to use it. (1) Declarative: render `<ConfirmDialog v-model:open="open" title=... @confirm="handler" />`. The handler may be async: the dialog stays open with a spinner while it runs, closes on success, and shows the error (and emits `error`) if it throws. (2) Imperative: mount `<ConfirmHost />` once (requires Pinia) and call `const { confirm } = useConfirm(); if (await confirm({ title, destructive: true })) ...`. Concurrent confirm() calls queue and resolve one at a time. Escape, outside click and the cancel button resolve `false`; while busy the dialog cannot be dismissed. `@confirm` is declared as an `onConfirm` handler prop so its returned promise can be awaited.',
  status: 'stable',
  parts: [
    { name: 'ConfirmHost', description: 'Mount once near the app root; renders the queue of useConfirm() requests. Takes no props.' },
  ],
  props: [
    { name: 'open', type: 'boolean', default: 'false', description: 'v-model:open. Works controlled or uncontrolled.' },
    { name: 'title', type: 'string', required: true, description: 'Question naming the action. A blank value throws a ContractError (in production it shows "Are you sure?").' },
    { name: 'description', type: 'string', description: 'Consequence text. A screen-reader-only description is used when omitted.' },
    { name: 'confirmLabel', type: 'string', default: "'Confirm'", description: 'Confirm button text. Name the action ("Delete project").' },
    { name: 'cancelLabel', type: 'string', default: "'Cancel'", description: 'Cancel button text.' },
    { name: 'destructive', type: 'boolean', default: 'false', description: 'Destructive confirm button.' },
    { name: 'tone', type: "'neutral' | 'danger' | 'warning' | 'success' | 'info'", default: "'neutral'", description: 'Tone of the prompt. Non-neutral tones tint the panel border and show a status icon above the title; `danger` also makes the confirm button destructive. Unknown values fall back to `neutral`. Adds `data-tone` on the panel.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", description: 'Maximum panel width from the `sm` breakpoint (xs 20rem, sm 24rem, md 32rem, lg 42rem). Unknown values fall back to `sm`.' },
    { name: 'variant', type: "'default' | 'centered'", default: "'default'", description: '`centered` centres the icon, text and buttons, for short confirmations. Unknown values fall back to `default`.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'External busy state; blocks confirm, cancel and dismissal.' },
    { name: 'onConfirm', type: '() => unknown | Promise<unknown>', description: 'The `@confirm` handler. Awaited; rejection keeps the dialog open.' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the dialog content.' },
  ],
  slots: [{ name: 'default', description: 'Extra content between the description and the buttons (e.g. a "type the name to confirm" input).' }],
  emits: [
    { name: 'update:open', payload: '[value: boolean]', description: 'v-model:open. Set to false after success or cancel.' },
    { name: 'cancel', payload: '[]', description: 'Dismissed without confirming (Cancel button or Escape; a click outside does not dismiss it).' },
    { name: 'error', payload: '[error: unknown]', description: 'The confirm handler threw or rejected.' },
  ],
  examples: [
    {
      title: 'Destructive confirmation',
      script: `const open = ref(false)\nfunction remove() { /* delete it */ }`,
      code: `<Button variant="destructive" @click="open = true">Delete project</Button>
<ConfirmDialog
  v-model:open="open"
  title="Delete this project?"
  description="This permanently removes the project and its data."
  confirm-label="Delete"
  destructive
  @confirm="remove"
/>`,
      state: () => ({ open: ref(false), remove: () => {} }),
    },
    {
      title: 'Tone, size and centred layout',
      description: 'The tone adds a status icon beside the title, so the meaning never rests on colour. `danger` makes the confirm button destructive without `destructive`.',
      script: `const open = ref(false)\nconst tone = ref('warning')\nfunction show(next) { tone.value = next; open.value = true }\nfunction apply() { /* save it */ }`,
      code: `<div class="flex flex-wrap gap-2">
  <Button variant="outline" @click="show('danger')">Danger</Button>
  <Button variant="outline" @click="show('warning')">Warning</Button>
  <Button variant="outline" @click="show('info')">Info</Button>
  <Button variant="outline" @click="show('success')">Success</Button>
</div>
<ConfirmDialog
  v-model:open="open"
  :tone="tone"
  size="xs"
  variant="centered"
  title="Apply this change?"
  description="It takes effect for everyone in the workspace."
  confirm-label="Apply change"
  @confirm="apply"
/>`,
      state: () => {
        const open = ref(false)
        const tone = ref('warning')
        return { open, tone, show: (next: string) => { tone.value = next; open.value = true }, apply: () => {} }
      },
    },
    {
      title: 'Async confirm',
      script: `const open = ref(false)\nconst save = () => new Promise((r) => setTimeout(r, 1000))`,
      code: `<Button @click="open = true">Publish</Button>
<ConfirmDialog v-model:open="open" title="Publish changes?" description="Visitors will see them immediately." confirm-label="Publish" @confirm="save" />`,
      state: () => ({ open: ref(false), save: () => new Promise((r) => setTimeout(r, 1000)) }),
    },
    {
      title: 'Promise-based with useConfirm()',
      script: `const { confirm } = useConfirm()\nasync function run() { if (await confirm({ title: 'Reset settings?', destructive: true })) result.value = 'reset' }`,
      code: `<Button variant="outline" @click="run">Reset settings</Button>
<span class="ml-2 text-sm text-muted-foreground">{{ result }}</span>
<ConfirmHost />`,
      state: () => {
        const { confirm } = useConfirm()
        const result = ref('')
        return { result, run: async () => { result.value = (await confirm({ title: 'Reset settings?', destructive: true })) ? 'reset' : 'cancelled' } }
      },
    },
  ],
  a11y: [
    'Built on AlertDialog (reka-ui): role="alertdialog", focus is trapped, Escape cancels, focus returns to the trigger.',
    'Initial focus goes to Cancel, the safe action, also for non-destructive confirmations.',
    'Clicking outside does not dismiss it: an explicit choice is required.',
    'Title and description are wired with aria-labelledby and aria-describedby. An sr-only description is added when none is given.',
    'While busy the confirm button exposes aria-busy, Cancel is disabled, and the dialog cannot be dismissed.',
    'Errors from the handler render in a role="alert" paragraph.',
    'The tone icon is decorative (aria-hidden) and the tint is a border only: the title, description and button label say what the tone says. Every size and tone keeps the Title, Description and Cancel parts.',
    'The panel is capped at the viewport width minus 2rem and scrolls inside itself when the content is taller than the viewport.',
  ],
  related: ['AlertDialog', 'Dialog', 'Button'],
  requires: [
    'Throws a ContractError when a `ConfirmDialog` has a blank `title`, no `open` (use `v-model:open`) or no `@confirm` handler.',
    'Throws a ContractError when `useConfirm().confirm()` is called with a blank `title` or while no `ConfirmHost` is mounted (the promise would never settle).',
  ],
  llmNotes: [
    'Use destructive for irreversible actions and name the action in confirmLabel.',
    'Prefer useConfirm() + one <ConfirmHost /> for "are you sure?" checks in scripts.',
    'Return the promise from @confirm so the dialog can show progress and errors.',
    'Set `tone="danger"` for irreversible actions (it also styles the confirm button); use `warning`, `info` or `success` for other prompts. Keep `tone` and `title` in agreement.',
    'Do not nest ConfirmDialog inside another dialog.',
  ],
  replaces: ['window.confirm() calls'],
}
export default doc
