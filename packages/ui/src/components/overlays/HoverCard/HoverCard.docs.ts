import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'HoverCard',
  group: 'overlays',
  subgroup: 'Floating',
  summary: 'Rich preview card that appears when hovering or focusing a link or element.',
  description:
    'Compose `HoverCard` + `HoverCardTrigger` + `HoverCardContent`. Use for previews of the thing a link points at (user profile, repo summary). Opens after `openDelay` (700ms) and stays open while the pointer is over the card. It is supplementary and hover-driven, so it must never be the only way to reach information (touch devices do not open it). Width and padding come from `size` on `HoverCardContent` (`sm` w-52, `md` w-64 default, `lg` w-80, `xl` w-96, `auto` fits the content; all capped to the viewport width). `variant` (`neutral` | `inverted`) sets the colours and `showArrow` adds an arrow that points at the trigger (off by default). `hoverCardContentVariants` is exported for reuse. Use `Popover` for click-driven interactive panels and `Tooltip` for one-line hints.',
  props: [
    { name: 'enableTouch', type: 'boolean', description: 'Also open the card on touch input (reka-ui). Off by default because hover cards have no touch equivalent.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'openDelay', type: 'number', default: '700', description: 'Delay in ms before opening on hover.' },
    { name: 'closeDelay', type: 'number', default: '300', description: 'Delay in ms before closing after leaving.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'HoverCardTrigger and HoverCardContent.' }],
  parts: [
    { name: 'HoverCardTrigger', description: 'Element that triggers the card; renders an <a> by default.' },
    {
      name: 'HoverCardContent',
      description: 'Portalled floating surface. Attributes fall through.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Preferred side.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the side axis.' },
        { name: 'sideOffset', type: 'number', default: '6', description: 'Gap in px between trigger and card.' },
        { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'auto'", default: "'md'", description: 'Width and padding preset (unknown values fall back to md).' },
        { name: 'variant', type: "'neutral' | 'inverted'", default: "'neutral'", description: 'Surface colours (unknown values fall back to neutral). Adds data-variant when inverted.' },
        { name: 'showArrow', type: 'boolean', default: 'false', description: 'Render an arrow that points at the trigger (decorative, aria-hidden).' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the surface (wins over the size preset).' },
      ],
    },
  ],
  examples: [
    {
      title: 'Profile preview',
      code: `<HoverCard>
  <HoverCardTrigger href="/components" class="text-sm font-medium underline underline-offset-4">Sample user</HoverCardTrigger>
  <HoverCardContent class="space-y-1">
    <p class="text-sm font-semibold">Sample user</p>
    <p class="text-sm text-muted-foreground">Profile preview text appears here.</p>
    <Badge>Admin</Badge>
  </HoverCardContent>
</HoverCard>`,
    },
    {
      title: 'Sizes, variants and arrow',
      description: 'Gallery: `size` sets the width, `variant` the colours and `showArrow` adds an arrow.',
      code: `<div class="flex flex-wrap gap-3">
  <HoverCard v-for="size in ['sm', 'md', 'lg', 'xl', 'auto']" :key="size">
    <HoverCardTrigger href="#sizes" class="text-sm underline underline-offset-4">size {{ size }}</HoverCardTrigger>
    <HoverCardContent :size="size"><p class="text-sm">Hover card size {{ size }}.</p></HoverCardContent>
  </HoverCard>
  <HoverCard>
    <HoverCardTrigger href="#inverted" class="text-sm underline underline-offset-4">inverted</HoverCardTrigger>
    <HoverCardContent variant="inverted" size="sm"><p class="text-sm">Inverted surface.</p></HoverCardContent>
  </HoverCard>
  <HoverCard>
    <HoverCardTrigger href="#arrow" class="text-sm underline underline-offset-4">with arrow</HoverCardTrigger>
    <HoverCardContent show-arrow size="sm"><p class="text-sm">Arrow points at the trigger.</p></HoverCardContent>
  </HoverCard>
</div>`,
    },
    {
      title: 'Custom delays and placement',
      code: `<HoverCard :open-delay="100" :close-delay="100">
  <HoverCardTrigger as-child><Button variant="link">Quick preview</Button></HoverCardTrigger>
  <HoverCardContent side="right" align="start" class="w-80">
    <p class="text-sm">Opens fast, to the right of the trigger.</p>
  </HoverCardContent>
</HoverCard>`,
    },
  ],
  a11y: [
    'Also opens on keyboard focus of the trigger. Esc dismisses it.',
    'The card is hoverable: the pointer can move onto it without it closing (WCAG 1.4.13).',
    'Touch devices do not open it. Do not hide essential content here, and keep the trigger a real link or button.',
    'The inverted variant uses foreground and background colours: keep the content to plain text. The arrow is decorative and hidden from assistive technology.',
    'The card is capped at the available height and the viewport width, and scrolls when it has to.',
  ],
  related: ['Popover', 'Tooltip'],
  requires: [
    'Throws a ContractError when the element a `HoverCardTrigger` renders is not keyboard focusable (a link needs `href`) or has no accessible name.',
  ],
  llmNotes: [
    'Hover cards are supplementary previews only; the trigger link must work on its own.',
    'Use Popover when the user needs to interact with the content.',
    'HoverCardTrigger renders <a>; pass as-child to wrap your own element.',
    'Choose width with size (sm/md/lg/xl/auto) instead of w-* classes; unknown size/variant values fall back to md/neutral. show-arrow is off by default.',
  ],
  replaces: ['shadcn-vue HoverCard'],
}
export default doc
