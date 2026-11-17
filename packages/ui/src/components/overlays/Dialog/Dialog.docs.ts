import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Dialog',
  group: 'overlays',
  subgroup: 'Modals',
  summary: 'Modal window that blocks the page until dismissed. Compound component built on reka-ui.',
  description:
    'Compose `Dialog` + `DialogTrigger` + `DialogContent` (+ `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`). Control with `v-model:open` or leave uncontrolled. A `DialogTitle` is REQUIRED for accessibility. Variations on `DialogContent`: `variant="default"` centred card for general content; `variant="centered-form"` roomier padding with centred text/header/footer for single-purpose forms (sign in, invite, rename); `variant="fullscreen"` covers the viewport for editors, wizards and immersive flows; `variant="drawer-bottom-on-mobile"` is a bottom sheet below the `sm` breakpoint and a normal centred dialog from `sm` up (use for mobile-first pickers and forms). `size` (`xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `full`) sets the max width from `sm` up and is ignored by `fullscreen`. `tone` (`neutral` | `danger` | `warning` | `success` | `info`) tints the panel border for a dialog about a risk or an outcome; the colour never carries the meaning, so the title and description must say it in words. `dialogContentVariants` is exported for reuse. Use `AlertDialog` for destructive confirmations and `Sheet` for side panels.',
  props: [
    { name: 'unmountOnHide', type: 'boolean', description: 'Unmount the content from the DOM when closed (reka-ui). Leave at the default unless you need the content to stay mounted.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'modal', type: 'boolean', default: 'true', description: 'Block interaction outside.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  parts: [
    { name: 'DialogTrigger', description: 'Element that opens the dialog (use as-child on a Button).' },
    {
      name: 'DialogContent',
      description: 'Portalled panel with overlay and built-in close X.',
      props: [
        { name: 'variant', type: "'default' | 'centered-form' | 'fullscreen' | 'drawer-bottom-on-mobile'", default: "'default'", description: 'Layout of the panel (unknown values fall back to default).' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'", default: "'md'", description: 'Max-width preset from the sm breakpoint (unknown values fall back to md; ignored by fullscreen).' },
        { name: 'tone', type: "'neutral' | 'danger' | 'warning' | 'success' | 'info'", default: "'neutral'", description: 'Border colour for a danger, warning, success or info dialog (unknown values fall back to neutral). Adds data-tone when not neutral.' },
        { name: 'showClose', type: 'boolean', default: 'true', description: 'Show the X button.' },
        { name: 'closeLabel', type: 'string', default: "'Close'", description: 'Accessible name of the X button, for i18n. A ConfigProvider can set it for every Dialog and Sheet as `dialog.close`. A blank value keeps the default.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the panel (wins over variant classes).' },
      ],
    },
    { name: 'DialogHeader', description: 'Stacks title + description.' },
    { name: 'DialogTitle', description: 'Required accessible name.' },
    { name: 'DialogDescription', description: 'Supporting text (aria-describedby).' },
    { name: 'DialogFooter', description: 'Right-aligned action row.' },
    { name: 'DialogClose', description: 'Closes the dialog; use as-child on a Button.' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<Dialog>
  <DialogTrigger as-child><Button variant="outline">Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes and save when you are done.</DialogDescription>
    </DialogHeader>
    <Input placeholder="Display name" aria-label="Display name" />
    <DialogFooter>
      <DialogClose as-child><Button variant="outline">Cancel</Button></DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      title: 'Sizes',
      description: '`size` is the max width from the `sm` breakpoint up: xs, sm, md (default), lg, xl, 2xl, full.',
      code: `<div class="flex flex-wrap gap-2">
  <Dialog v-for="size in ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full']" :key="size">
    <DialogTrigger as-child><Button variant="outline">{{ size }}</Button></DialogTrigger>
    <DialogContent :size="size">
      <DialogHeader>
        <DialogTitle>Size {{ size }}</DialogTitle>
        <DialogDescription>Max-width preset applied from the sm breakpoint.</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</div>`,
    },
    {
      title: 'Tones',
      description: '`tone` tints the border only. State the situation in the title and description; the colour is a supplement.',
      code: `<div class="flex flex-wrap gap-2">
  <Dialog v-for="tone in ['neutral', 'danger', 'warning', 'success', 'info']" :key="tone">
    <DialogTrigger as-child><Button variant="outline">{{ tone }}</Button></DialogTrigger>
    <DialogContent :tone="tone" size="sm">
      <DialogHeader>
        <DialogTitle>Tone {{ tone }}</DialogTitle>
        <DialogDescription>The border colour follows the tone; this text names it too.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child><Button variant="outline">Close</Button></DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>`,
    },
    {
      title: 'Variant: centered-form',
      description: 'Roomier padding and centred header, text and footer. Good for sign-in, invite and rename forms.',
      code: `<Dialog>
  <DialogTrigger as-child><Button variant="outline">Sign in</Button></DialogTrigger>
  <DialogContent variant="centered-form" size="sm">
    <DialogHeader>
      <DialogTitle>Welcome back</DialogTitle>
      <DialogDescription>Enter your email to continue.</DialogDescription>
    </DialogHeader>
    <Input type="email" placeholder="you@example.com" aria-label="Email" />
    <DialogFooter>
      <Button class="w-full sm:w-auto">Continue</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      title: 'Variant: fullscreen',
      description: 'Covers the whole viewport; `size` is ignored. Provide an explicit way out (close X or a button).',
      code: `<Dialog>
  <DialogTrigger as-child><Button variant="outline">Open editor</Button></DialogTrigger>
  <DialogContent variant="fullscreen">
    <DialogHeader>
      <DialogTitle>Full-screen editor</DialogTitle>
      <DialogDescription>Uses the entire viewport.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as-child><Button variant="outline">Close</Button></DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      title: 'Variant: drawer-bottom-on-mobile',
      description: 'Bottom sheet below the `sm` breakpoint, centred dialog from `sm` up. Resize the window to see it switch.',
      code: `<Dialog>
  <DialogTrigger as-child><Button variant="outline">Choose option</Button></DialogTrigger>
  <DialogContent variant="drawer-bottom-on-mobile" size="sm">
    <DialogHeader>
      <DialogTitle>Share</DialogTitle>
      <DialogDescription>Slides up on phones, centres on larger screens.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as-child><Button variant="outline">Cancel</Button></DialogClose>
      <Button>Share</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    },
    {
      title: 'Controlled',
      script: `const open = ref(false)`,
      code: `<div class="flex items-center gap-3">
  <Button @click="open = true">Open programmatically</Button>
  <span class="text-sm text-muted-foreground">open = {{ open }}</span>
</div>
<Dialog v-model:open="open">
  <DialogContent size="sm">
    <DialogTitle>Controlled</DialogTitle>
    <DialogDescription>State lives in your component.</DialogDescription>
  </DialogContent>
</Dialog>`,
      state: () => ({ open: ref(false) }),
    },
  ],
  a11y: [
    'role=dialog, aria-modal, aria-labelledby on DialogTitle and aria-describedby on DialogDescription. Content outside is inert.',
    'Focus moves in, is trapped, and returns to the trigger on close. Esc and a click on the overlay close it.',
    'The panel is at most the viewport width minus 2rem, has `100dvh` minus 2rem as max height and scrolls inside itself. Body scroll is locked without a layout shift and scroll chaining is stopped.',
    'Tone is a border colour only. It never replaces words: write the risk or the outcome in the title and description.',
    'The close button is 28px square, 40px on coarse pointers, and is positioned with logical properties. The fullscreen and bottom-drawer variants respect the safe-area inset.',
  ],
  related: ['AlertDialog', 'Sheet', 'Popover'],
  requires: [
    'Throws a ContractError when `DialogContent` is shown without a `DialogTitle` inside it (or `aria-label` / `aria-labelledby` on the content). Wrap the title in `VisuallyHidden` when it must not be visible.',
  ],
  llmNotes: [
    'Always include DialogTitle (wrap in VisuallyHidden if it must not be visible).',
    'Do not nest dialogs more than one level deep.',
    'Pick variant by intent: default for general content, centered-form for short forms, fullscreen for editors/wizards, drawer-bottom-on-mobile for mobile-first pickers.',
    'size only sets max width from the sm breakpoint; fullscreen ignores it. Unknown variant/size values fall back to default/md.',
    'tone (neutral, danger, warning, success, info) only tints the border; say the situation in the title. Unknown tones fall back to neutral.',
    'Override anything with the class prop; it is merged last.',
  ],
  replaces: ['shadcn-vue Dialog'],
}
export default doc
