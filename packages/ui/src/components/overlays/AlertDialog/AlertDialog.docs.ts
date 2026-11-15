import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'AlertDialog',
  group: 'overlays',
  subgroup: 'Modals',
  summary: 'Modal confirmation that interrupts the user and requires an explicit Cancel or Action choice.',
  description:
    'Use for destructive or irreversible confirmations ("Delete project?"). Unlike `Dialog` it has no close (X) button and does NOT close on overlay click; only `AlertDialogCancel`, `AlertDialogAction` or Esc dismiss it. Focus starts on the Cancel button. Style the confirm button with `variant="destructive"` for destructive actions, or set `tone="danger"` on `AlertDialogContent`: it tints the border and makes `AlertDialogAction` destructive unless the action sets its own `variant`. `tone` also takes `warning`, `success` and `info` (border only). `size` (`xs` | `sm` | `md` | `lg`) sets the max width and `variant="centered"` centres the text and the buttons; `alertDialogContentVariants` is exported for reuse. For forms and general content use `Dialog`; for side panels use `Sheet`.',
  props: [
    { name: 'unmountOnHide', type: 'boolean', description: 'Unmount the content from the DOM when closed (reka-ui). Leave at the default unless you need the content to stay mounted.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'AlertDialogTrigger and AlertDialogContent.' }],
  parts: [
    { name: 'AlertDialogTrigger', description: 'Element that opens the dialog (use as-child on a Button).' },
    {
      name: 'AlertDialogContent',
      description: 'Portalled panel with scrim overlay. Accepts reka-ui DialogContent props (e.g. `forceMount`) and falls attributes through.',
      props: [
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Max-width preset from the sm breakpoint (unknown values fall back to md).' },
        { name: 'variant', type: "'default' | 'centered'", default: "'default'", description: 'Text and footer alignment (unknown values fall back to default). Adds nothing but classes.' },
        { name: 'tone', type: "'neutral' | 'danger' | 'warning' | 'success' | 'info'", default: "'neutral'", description: 'Border colour (unknown values fall back to neutral). `danger` also makes AlertDialogAction destructive by default. Adds data-tone when not neutral.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the panel.' },
      ],
    },
    { name: 'AlertDialogHeader', description: 'Stacks title + description.' },
    { name: 'AlertDialogTitle', description: 'Required accessible name (aria-labelledby).' },
    { name: 'AlertDialogDescription', description: 'Explains the consequence (aria-describedby).' },
    { name: 'AlertDialogFooter', description: 'Right-aligned action row (stacked on mobile).' },
    {
      name: 'AlertDialogAction',
      description: 'Confirms and closes. Styled with `buttonVariants`.',
      props: [
        { name: 'variant', type: 'ButtonVariant', default: "'default' ('destructive' inside a danger dialog)", description: "Button variant; an explicit value always wins. Use 'destructive' for destructive confirmations." },
        { name: 'size', type: 'ButtonSize', default: "'md'", description: 'Button size.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'AlertDialogCancel',
      description: 'Dismisses without acting. Receives initial focus.',
      props: [
        { name: 'variant', type: 'ButtonVariant', default: "'outline'", description: 'Button variant.' },
        { name: 'size', type: 'ButtonSize', default: "'md'", description: 'Button size.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
  ],
  examples: [
    {
      title: 'Destructive confirmation',
      code: `<AlertDialog>
  <AlertDialogTrigger as-child><Button variant="destructive">Delete project</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this project?</AlertDialogTitle>
      <AlertDialogDescription>This permanently removes the project and all of its data. This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep project</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    },
    {
      title: 'Tones',
      description: '`tone` tints the border; `danger` also makes the action button destructive. The title and description still say what happens.',
      code: `<div class="flex flex-wrap gap-2">
  <AlertDialog v-for="tone in ['neutral', 'danger', 'warning', 'success', 'info']" :key="tone">
    <AlertDialogTrigger as-child><Button variant="outline">{{ tone }}</Button></AlertDialogTrigger>
    <AlertDialogContent :tone="tone" size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm the {{ tone }} action</AlertDialogTitle>
        <AlertDialogDescription>The border follows the tone and this text names it.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
    },
    {
      title: 'Sizes and the centered variant',
      description: '`size` xs to lg sets the max width; `variant="centered"` centres the text and the buttons for short confirmations.',
      code: `<div class="flex flex-wrap gap-2">
  <AlertDialog v-for="size in ['xs', 'sm', 'md', 'lg']" :key="size">
    <AlertDialogTrigger as-child><Button variant="outline">{{ size }}</Button></AlertDialogTrigger>
    <AlertDialogContent :size="size">
      <AlertDialogHeader>
        <AlertDialogTitle>Size {{ size }}</AlertDialogTitle>
        <AlertDialogDescription>Max-width preset applied from the sm breakpoint.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction>Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog>
    <AlertDialogTrigger as-child><Button variant="outline">centered</Button></AlertDialogTrigger>
    <AlertDialogContent variant="centered" tone="danger" size="sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Remove this member?</AlertDialogTitle>
        <AlertDialogDescription>They lose access to the workspace immediately.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep member</AlertDialogCancel>
        <AlertDialogAction>Remove</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>`,
    },
    {
      title: 'Controlled, run an action',
      script: `const open = ref(false)
const status = ref('idle')
function confirm() { status.value = 'archived' }`,
      code: `<div class="flex items-center gap-3">
  <Button variant="outline" @click="open = true">Archive</Button>
  <Badge>{{ status }}</Badge>
</div>
<AlertDialog v-model:open="open">
  <AlertDialogContent size="sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Archive this item?</AlertDialogTitle>
      <AlertDialogDescription>You can restore it later from the archive.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction @click="confirm">Archive</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
      state: () => {
        const open = ref(false)
        const status = ref('idle')
        return { open, status, confirm: () => (status.value = 'archived') }
      },
    },
  ],
  a11y: [
    'role="alertdialog", aria-labelledby on AlertDialogTitle, aria-describedby on AlertDialogDescription. Page content behind it is inert.',
    'Focus is trapped, starts on Cancel (the safe action) and returns to the trigger on close.',
    'Esc cancels. A click on the overlay does not close it: an explicit choice is required.',
    'Tone is a border colour (and the default action colour for danger). The title and description must say what is at stake in words.',
    'The panel is capped at the viewport width minus 2rem, keeps `100dvh` minus 2rem as max height and scrolls inside itself. Scroll chaining to the page is stopped.',
  ],
  related: ['Dialog', 'Sheet', 'Popover'],
  requires: [
    'Throws a ContractError when `AlertDialogContent` is shown without an `AlertDialogTitle` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `AlertDialogContent` is shown without an `AlertDialogDescription` (or `aria-describedby`): an alert dialog must say what is being confirmed.',
  ],
  llmNotes: [
    'Use AlertDialog only for confirmations that need an explicit decision; use Dialog for forms.',
    'Always include AlertDialogTitle and AlertDialogDescription.',
    'Destructive confirmations: <AlertDialogAction variant="destructive"> or tone="danger" on AlertDialogContent; keep Cancel as the safe default.',
    'size (xs, sm, md, lg), variant (default, centered) and tone (neutral, danger, warning, success, info) fall back to md, default and neutral when unknown.',
    'AlertDialogAction/Cancel close the dialog by themselves; do not also toggle open manually.',
  ],
  replaces: ['shadcn-vue AlertDialog'],
}
export default doc
