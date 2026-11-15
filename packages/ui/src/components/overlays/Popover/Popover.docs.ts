import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Popover',
  group: 'overlays',
  subgroup: 'Floating',
  summary: 'Non-modal floating panel anchored to a trigger. Compound component built on reka-ui.',
  description:
    'Compose `Popover` + `PopoverTrigger` + `PopoverContent` (+ `PopoverAnchor`, `PopoverClose`). Use for small interactive content (quick forms, pickers, option lists) that should stay in context. Width is set with `size` on `PopoverContent`: `xs` (w-48, tiny menus), `sm` (w-60, short option lists), `md` (w-72, default, quick forms), `lg` (w-96, pickers and richer forms), `xl` (w-lg, previews, dense panels), `auto` (fits content; for chips or short summaries); every size is capped to the viewport width and `class` can still override it. `variant` (`neutral` | `inverted`) sets the colours: `neutral` is the popover surface, `inverted` is the foreground colour with background-coloured text, like the default tooltip. `showArrow` draws an arrow that points at the trigger (off by default). `popoverContentVariants` is exported for reuse. Placement is controlled with `side`, `align` and `sideOffset` on `PopoverContent`; it flips automatically near viewport edges. Use `Tooltip` for plain text hints, `HoverCard` for hover previews, `DropdownMenu` for action lists and `Dialog` for modal flows.',
  props: [
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'modal', type: 'boolean', default: 'false', description: 'Trap focus and block outside interaction.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'PopoverTrigger, PopoverContent and optionally PopoverAnchor.' }],
  parts: [
    { name: 'PopoverTrigger', description: 'Toggles the popover (use as-child on a Button).' },
    {
      name: 'PopoverContent',
      description: 'Portalled floating surface. Attributes fall through.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Preferred side of the trigger.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the side axis.' },
        { name: 'sideOffset', type: 'number', default: '6', description: 'Gap in px between trigger and content.' },
        { name: 'alignOffset', type: 'number', default: '0', description: 'Offset in px along the alignment axis.' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto'", default: "'md'", description: 'Width and padding preset (unknown values fall back to md).' },
        { name: 'variant', type: "'neutral' | 'inverted'", default: "'neutral'", description: 'Surface colours (unknown values fall back to neutral). Adds data-variant when inverted.' },
        { name: 'showArrow', type: 'boolean', default: 'false', description: 'Render an arrow that points at the trigger (decorative, aria-hidden).' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the surface (wins over the size preset).' },
      ],
    },
    { name: 'PopoverAnchor', description: 'Optional element to position against instead of the trigger.' },
    { name: 'PopoverClose', description: 'Closes the popover; use as-child on a Button.' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<Popover>
  <PopoverTrigger as-child><Button variant="outline">Dimensions</Button></PopoverTrigger>
  <PopoverContent class="space-y-3">
    <p class="text-sm font-medium">Set dimensions</p>
    <Input placeholder="Width" aria-label="Width" />
    <Input placeholder="Height" aria-label="Height" />
  </PopoverContent>
</Popover>`,
    },
    {
      title: 'Sizes',
      description: '`size` sets width and padding: xs, sm, md (default), lg, xl, auto (fits content).',
      code: `<div class="flex flex-wrap gap-2">
  <Popover v-for="size in ['xs', 'sm', 'md', 'lg', 'xl', 'auto']" :key="size">
    <PopoverTrigger as-child><Button variant="outline">{{ size }}</Button></PopoverTrigger>
    <PopoverContent :size="size">
      <p class="text-sm">Popover size {{ size }}</p>
    </PopoverContent>
  </Popover>
</div>`,
    },
    {
      title: 'Variants and arrow',
      description: '`variant` is neutral (default) or inverted; `showArrow` adds an arrow that points at the trigger.',
      code: `<div class="flex flex-wrap gap-2">
  <Popover>
    <PopoverTrigger as-child><Button variant="outline">Neutral</Button></PopoverTrigger>
    <PopoverContent size="sm"><p class="text-sm">Neutral surface, no arrow.</p></PopoverContent>
  </Popover>
  <Popover>
    <PopoverTrigger as-child><Button variant="outline">Neutral with arrow</Button></PopoverTrigger>
    <PopoverContent size="sm" show-arrow><p class="text-sm">Neutral surface with an arrow.</p></PopoverContent>
  </Popover>
  <Popover>
    <PopoverTrigger as-child><Button variant="outline">Inverted</Button></PopoverTrigger>
    <PopoverContent size="sm" variant="inverted"><p class="text-sm">Inverted surface, no arrow.</p></PopoverContent>
  </Popover>
  <Popover>
    <PopoverTrigger as-child><Button variant="outline">Inverted with arrow</Button></PopoverTrigger>
    <PopoverContent size="sm" variant="inverted" show-arrow><p class="text-sm">Inverted surface with an arrow.</p></PopoverContent>
  </Popover>
</div>`,
    },
    {
      title: 'Placement and controlled state',
      script: `const open = ref(false)`,
      code: `<div class="flex items-center gap-3">
  <Popover v-model:open="open">
    <PopoverTrigger as-child><Button>Options</Button></PopoverTrigger>
    <PopoverContent side="right" align="start" :side-offset="10">
      <p class="mb-2 text-sm">Opens to the right, aligned to the top.</p>
      <PopoverClose as-child><Button size="sm" variant="secondary">Close</Button></PopoverClose>
    </PopoverContent>
  </Popover>
  <span class="text-sm text-muted-foreground">open = {{ open }}</span>
</div>`,
      state: () => ({ open: ref(false) }),
    },
  ],
  a11y: [
    'Trigger gets aria-haspopup=dialog, aria-expanded and aria-controls.',
    'Esc and an outside press close it. Focus moves into the content and returns to the trigger.',
    'Content is role=dialog: give it an aria-label when it has no visible heading.',
    'The inverted variant uses foreground and background colours: keep the content to plain text and do not use muted text colours inside it. The arrow is decorative and hidden from assistive technology.',
    'The content keeps 8px from the viewport edges, never exceeds the viewport width and scrolls when taller than the available space.',
  ],
  related: ['Tooltip', 'HoverCard', 'DropdownMenu', 'Dialog'],
  requires: [
    'Throws a ContractError when the element a `PopoverTrigger` renders has no accessible name (an icon-only button needs `aria-label`).',
  ],
  llmNotes: [
    'Use PopoverTrigger as-child on a Button so it stays a real button.',
    'Popover content is interactive; use Tooltip for non-interactive text.',
    'Choose width with size (xs/sm/md/lg/xl/auto) instead of hand-written w-* classes; unknown values fall back to md.',
    'A class on PopoverContent (class="w-96") still overrides the preset.',
    'variant="inverted" suits short summaries; put interactive forms on the neutral surface. show-arrow is off by default; unknown variants fall back to neutral.',
  ],
  replaces: ['shadcn-vue Popover'],
}
export default doc
