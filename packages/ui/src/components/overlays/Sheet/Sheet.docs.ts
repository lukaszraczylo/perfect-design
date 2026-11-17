import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Sheet',
  group: 'overlays',
  subgroup: 'Modals',
  summary: 'Modal panel that slides in from the top, right, bottom or left edge. Compound component built on reka-ui Dialog.',
  description:
    'Compose `Sheet` + `SheetTrigger` + `SheetContent` (+ `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`). Use for filters, detail panes, mobile navigation, and long forms that should not leave the page. Variations: `side` (`top` | `right` | `bottom` | `left`) picks the edge and slide animation (right for detail/filters, left for navigation, bottom for mobile action sheets, top for banners/search); `size` (`sm` | `md` | `lg` | `xl` | `full`) sets the width on left/right and the max height on top/bottom; `inset` makes a floating card that keeps a margin to the viewport edges with rounded corners (use for settings drawers and previews that should feel detached from the page chrome); `variant="flush"` removes the padding and gap so a nav list or a table runs edge to edge; `tone` (`neutral` | `danger` | `warning` | `success` | `info`) tints the border (the title must still say the situation in words). Use `Dialog` for centred modals and `Popover` for small anchored content. `sheetVariants` is exported for reusing the panel styling.',
  props: [
    { name: 'unmountOnHide', type: 'boolean', description: 'Unmount the content from the DOM when closed (reka-ui). Leave at the default unless you need the content to stay mounted.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'modal', type: 'boolean', default: 'true', description: 'Block interaction outside.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'SheetTrigger and SheetContent.' }],
  parts: [
    { name: 'SheetTrigger', description: 'Element that opens the sheet (use as-child on a Button).' },
    {
      name: 'SheetContent',
      description: 'Portalled sliding panel with scrim overlay and built-in close X.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'right'", description: 'Edge it slides in from (unknown values fall back to right).' },
        { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'md'", description: 'Width preset for left/right, max-height preset for top/bottom.' },
        { name: 'inset', type: 'boolean', default: 'false', description: 'Floating card look: margin to the viewport edges, rounded corners, full border (adds data-inset).' },
        { name: 'variant', type: "'default' | 'flush'", default: "'default'", description: 'Padding: `flush` removes the padding and the gap, keeping the safe-area padding on the docked edge (unknown values fall back to default). Adds data-variant when flush.' },
        { name: 'tone', type: "'neutral' | 'danger' | 'warning' | 'success' | 'info'", default: "'neutral'", description: 'Border colour (unknown values fall back to neutral). Adds data-tone when not neutral.' },
        { name: 'showClose', type: 'boolean', default: 'true', description: 'Show the X button.' },
        { name: 'closeLabel', type: 'string', default: "'Close'", description: 'Accessible name of the X button, for i18n. A ConfigProvider can set it for every Dialog and Sheet as `dialog.close`. A blank value keeps the default.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the panel (wins over variant classes).' },
      ],
    },
    { name: 'SheetHeader', description: 'Stacks title + description.' },
    { name: 'SheetTitle', description: 'Required accessible name.' },
    { name: 'SheetDescription', description: 'Supporting text (aria-describedby).' },
    { name: 'SheetFooter', description: 'Action row pushed to the bottom of the panel.' },
    { name: 'SheetClose', description: 'Closes the sheet; use as-child on a Button.' },
  ],
  examples: [
    {
      title: 'Sides',
      code: `<div class="flex flex-wrap gap-2">
  <Sheet v-for="side in ['top', 'right', 'bottom', 'left']" :key="side">
    <SheetTrigger as-child><Button variant="outline" class="capitalize">{{ side }}</Button></SheetTrigger>
    <SheetContent :side="side">
      <SheetHeader>
        <SheetTitle>Sheet from the {{ side }}</SheetTitle>
        <SheetDescription>Press Esc or click outside to close.</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</div>`,
    },
    {
      title: 'Sizes',
      description: '`size` is a width preset for left/right sheets and a max-height preset for top/bottom sheets.',
      code: `<div class="flex flex-wrap gap-2">
  <Sheet v-for="size in ['sm', 'md', 'lg', 'xl', 'full']" :key="size">
    <SheetTrigger as-child><Button variant="outline">{{ size }}</Button></SheetTrigger>
    <SheetContent :size="size">
      <SheetHeader>
        <SheetTitle>Size {{ size }}</SheetTitle>
        <SheetDescription>Width preset on the right edge.</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</div>`,
    },
    {
      title: 'Inset (floating) sheet',
      description: '`inset` keeps a margin to the viewport edges and rounds the corners. Works on every side.',
      code: `<div class="flex flex-wrap gap-2">
  <Sheet v-for="side in ['right', 'left', 'bottom']" :key="side">
    <SheetTrigger as-child><Button variant="outline" class="capitalize">Inset {{ side }}</Button></SheetTrigger>
    <SheetContent :side="side" inset>
      <SheetHeader>
        <SheetTitle>Floating {{ side }} sheet</SheetTitle>
        <SheetDescription>Detached from the viewport edge with rounded corners.</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</div>`,
    },
    {
      title: 'Flush variant',
      description: '`variant="flush"` drops the padding so the content controls its own spacing, e.g. a navigation list with full-width rows.',
      code: `<Sheet>
  <SheetTrigger as-child><Button variant="outline">Open navigation</Button></SheetTrigger>
  <SheetContent side="left" variant="flush" size="sm">
    <SheetHeader class="border-b p-4">
      <SheetTitle>Navigation</SheetTitle>
      <SheetDescription>Rows run edge to edge.</SheetDescription>
    </SheetHeader>
    <nav aria-label="Sample sections" class="flex flex-col">
      <a href="#one" class="border-b px-4 py-3 text-sm hover:bg-accent">Overview</a>
      <a href="#two" class="border-b px-4 py-3 text-sm hover:bg-accent">Reports</a>
      <a href="#three" class="px-4 py-3 text-sm hover:bg-accent">Settings</a>
    </nav>
  </SheetContent>
</Sheet>`,
    },
    {
      title: 'Tones',
      description: '`tone` tints the border only. The title and description still state the situation.',
      code: `<div class="flex flex-wrap gap-2">
  <Sheet v-for="tone in ['neutral', 'danger', 'warning', 'success', 'info']" :key="tone">
    <SheetTrigger as-child><Button variant="outline">{{ tone }}</Button></SheetTrigger>
    <SheetContent :tone="tone">
      <SheetHeader>
        <SheetTitle>Tone {{ tone }}</SheetTitle>
        <SheetDescription>The border follows the tone; this text names it too.</SheetDescription>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</div>`,
    },
    {
      title: 'Filters panel with footer',
      script: `const open = ref(false)`,
      code: `<Sheet v-model:open="open">
  <SheetTrigger as-child><Button>Filters</Button></SheetTrigger>
  <SheetContent size="lg">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
      <SheetDescription>Narrow down the results.</SheetDescription>
    </SheetHeader>
    <Input placeholder="Keyword" aria-label="Keyword" />
    <SheetFooter>
      <SheetClose as-child><Button variant="outline">Reset</Button></SheetClose>
      <Button @click="open = false">Apply</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
      state: () => ({ open: ref(false) }),
    },
  ],
  a11y: [
    'role=dialog, aria-modal, aria-labelledby on SheetTitle and aria-describedby on SheetDescription. Content outside is inert.',
    'Focus moves in, is trapped and returns to the trigger on close. Esc and a click on the overlay close it.',
    'Panels scroll inside themselves, stop scroll chaining and respect the safe-area inset on the docked edge. Side sheets are 75% of the viewport wide below `sm`.',
    'Tone is a border colour only; state the situation in the title and description. The flush variant keeps the focusable close button and the safe-area padding.',
    'Slide animations respect reduced motion through the theme animation tokens.',
  ],
  related: ['Dialog', 'AlertDialog', 'Popover'],
  requires: [
    'Throws a ContractError when `SheetContent` is shown without a `SheetTitle` inside it (or `aria-label` / `aria-labelledby` on the content).',
  ],
  llmNotes: [
    'Always include SheetTitle (wrap in VisuallyHidden if it must not be visible).',
    'Choose side=right for detail/filters, left for navigation, bottom for mobile action sheets.',
    'Choose size=sm/md for forms and filters, lg/xl for detail panes, full for immersive flows; on top/bottom sides size limits the height.',
    'Use inset for a floating, rounded panel; combine it with any side and size.',
    'Use variant="flush" when the content has its own full-width rows; tone only tints the border.',
    'Unknown side/size/variant/tone values fall back to right/md/default/neutral; the class prop is merged last and wins.',
    'Do not put destructive confirmations in a Sheet; use AlertDialog.',
  ],
  replaces: ['shadcn-vue Sheet'],
}
export default doc
