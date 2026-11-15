import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Tooltip',
  group: 'overlays',
  subgroup: 'Floating',
  summary: 'Short text hint shown on hover or keyboard focus. Compound component plus a one-line `SimpleTooltip`.',
  description:
    'Use `SimpleTooltip` with a `content` prop for the common case, or compose `TooltipProvider` + `Tooltip` + `TooltipTrigger` + `TooltipContent` for full control. Wrap the app (or a region) in one `TooltipProvider` to share the open delay and get instant hand-off between neighbouring tooltips; `SimpleTooltip` includes its own provider. Variations: `variant` (`dark` inverted bubble, the default and best contrast on light pages; `light` popover-coloured bubble with border and shadow, for dark surfaces or when an inverted bubble feels heavy) and `size` (`sm` compact labels for dense toolbars, `md` default, `lg` roomier text for longer hints). Both are props of `TooltipContent` and `SimpleTooltip`; `tooltipVariants` is exported for reuse. Tooltips are for supplementary, non-interactive text only; never hide essential information in one. Use `Popover` or `HoverCard` for interactive content.',
  props: [
    { name: 'disableClosingTrigger', type: 'boolean', description: 'Keep the tooltip open when the trigger is clicked (reka-ui).' },
    { name: 'ignoreNonKeyboardFocus', type: 'boolean', description: 'Open on keyboard focus only, not on pointer focus (reka-ui).' },
    { name: 'open', type: 'boolean', description: 'Tooltip root: controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Tooltip root: initial state when uncontrolled.' },
    { name: 'delayDuration', type: 'number', description: 'Tooltip root: hover delay in ms; overrides the provider value.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Tooltip root: never show the tooltip.' },
    { name: 'disableHoverableContent', type: 'boolean', default: 'false', description: 'Tooltip root: close when the pointer leaves the trigger even if it moves onto the content.' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Tooltip root: open state changed.' }],
  slots: [{ name: 'default', description: 'TooltipTrigger and TooltipContent.' }],
  parts: [
    {
      name: 'TooltipProvider',
      description: 'Shares timing between tooltips; mount once near the app root.',
      props: [
        { name: 'delayDuration', type: 'number', default: '400', description: 'Hover delay in ms before opening.' },
        { name: 'skipDelayDuration', type: 'number', default: '300', description: 'Window in ms after closing during which the next tooltip opens instantly.' },
        { name: 'disableHoverableContent', type: 'boolean', default: 'false', description: 'Prevent the pointer from entering the content.' },
      ],
    },
    { name: 'TooltipTrigger', description: 'Element that triggers the tooltip (use as-child on the target).' },
    {
      name: 'TooltipContent',
      description: 'Portalled bubble with arrow. Attributes fall through.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'", description: 'Preferred side.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment along the side axis.' },
        { name: 'sideOffset', type: 'number', default: '6', description: 'Gap in px between trigger and bubble.' },
        { name: 'showArrow', type: 'boolean', default: 'true', description: 'Render the arrow.' },
        { name: 'variant', type: "'dark' | 'light'", default: "'dark'", description: 'Bubble look (unknown values fall back to dark). The arrow follows the variant.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, text size and max width (unknown values fall back to md).' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the bubble (wins over variant classes).' },
      ],
    },
    {
      name: 'SimpleTooltip',
      description: 'Wraps its default slot (a single element) with a tooltip showing `content`. Has its own provider.',
      props: [
        { name: 'content', type: 'string', description: 'Tooltip text. Without content (and without the `content` slot) the tooltip is disabled.' },
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'", description: 'Preferred side.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment.' },
        { name: 'delayDuration', type: 'number', default: '400', description: 'Hover delay in ms.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Never show the tooltip.' },
        { name: 'variant', type: "'dark' | 'light'", default: "'dark'", description: 'Bubble look.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bubble size.' },
        { name: 'showArrow', type: 'boolean', default: 'true', description: 'Render the arrow that points at the trigger.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the bubble.' },
      ],
    },
  ],
  examples: [
    {
      title: 'SimpleTooltip',
      code: `<div class="flex items-center gap-3">
  <SimpleTooltip content="Save your changes"><Button>Save</Button></SimpleTooltip>
  <SimpleTooltip content="Shown on the right" side="right"><Button variant="outline">Right</Button></SimpleTooltip>
  <SimpleTooltip content="Never shown" disabled><Button variant="ghost">Disabled</Button></SimpleTooltip>
</div>`,
    },
    {
      title: 'Variants: dark and light',
      description: '`dark` is the default inverted bubble; `light` uses the popover surface with a border.',
      code: `<div class="flex items-center gap-3">
  <SimpleTooltip content="Dark (default) bubble" variant="dark"><Button variant="outline">Dark</Button></SimpleTooltip>
  <SimpleTooltip content="Light bubble with border" variant="light"><Button variant="outline">Light</Button></SimpleTooltip>
</div>`,
    },
    {
      title: 'Sizes',
      description: '`sm` for compact labels, `md` default, `lg` for longer hints.',
      code: `<div class="flex items-center gap-3">
  <SimpleTooltip content="Small" size="sm"><Button variant="outline" size="sm">sm</Button></SimpleTooltip>
  <SimpleTooltip content="Medium (default)" size="md"><Button variant="outline">md</Button></SimpleTooltip>
  <SimpleTooltip content="Large tooltips fit longer explanatory text comfortably" size="lg"><Button variant="outline" size="lg">lg</Button></SimpleTooltip>
</div>`,
    },
    {
      title: 'Without an arrow',
      description: '`showArrow="false"` drops the arrow, e.g. for tooltips that sit flush against a toolbar.',
      code: `<div class="flex flex-wrap gap-2">
  <SimpleTooltip content="Arrow (default)"><Button variant="outline">With arrow</Button></SimpleTooltip>
  <SimpleTooltip content="No arrow" :show-arrow="false"><Button variant="outline">No arrow</Button></SimpleTooltip>
  <SimpleTooltip content="Light, no arrow" variant="light" :show-arrow="false"><Button variant="outline">Light, no arrow</Button></SimpleTooltip>
</div>`,
    },
    {
      title: 'Compound with variant and size',
      description: 'The same props exist on TooltipContent.',
      code: `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as-child><Button variant="ghost">Compound</Button></TooltipTrigger>
    <TooltipContent variant="light" size="lg" side="bottom">Light, large, below the trigger.</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
    },
    {
      title: 'Compound with shared provider',
      code: `<TooltipProvider :delay-duration="200">
  <div class="flex items-center gap-3">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="outline" size="icon" aria-label="Help"><Icon :icon="faCircleInfo" /></Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Opens the help centre</TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger as-child><Button variant="outline">Custom</Button></TooltipTrigger>
      <TooltipContent :show-arrow="false" class="max-w-sm">No arrow, wider bubble.</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`,
      script: `import { faCircleInfo } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCircleInfo }),
    },
  ],
  a11y: [
    'Trigger gets aria-describedby pointing at the tooltip (role=tooltip).',
    'Opens on keyboard focus as well as hover and Esc dismisses it. The tooltip stays open while the pointer is on it (WCAG 1.4.13).',
    'Never put interactive controls or essential information in a tooltip. Icon-only buttons still need an aria-label.',
    'The bubble gets a border in forced-colors mode and keeps 8px from the viewport edges.',
  ],
  related: ['Popover', 'HoverCard'],
  requires: [
    'Throws a ContractError when a `Tooltip` has no `TooltipProvider` around it (use `SimpleTooltip` or mount one provider near the app root). It still renders with a fallback provider.',
    'Throws a ContractError when `TooltipTrigger` or `TooltipContent` is not inside a `Tooltip`.',
    'Throws a ContractError when the element a `TooltipTrigger` renders cannot be reached with the keyboard (a span or div without `tabindex="0"`) or has no accessible name (an icon-only button without `aria-label`).',
  ],
  llmNotes: [
    'Use variant="light" on dark or busy surfaces where the inverted bubble blends in; keep the default dark elsewhere.',
    'Use size="sm" for dense toolbars and size="lg" only for longer hints; unknown variant/size values fall back to dark/md.',
    'Prefer <SimpleTooltip content="..."> for plain text.',
    'The trigger must be a single focusable element; tooltips on disabled buttons need a wrapper element.',
    'Do not use a tooltip as the only label of an icon-only button; add aria-label as well.',
    'TooltipContent must be inside Tooltip; Tooltip must be inside TooltipProvider (SimpleTooltip handles this itself).',
  ],
  replaces: ['shadcn-vue Tooltip', 'native title="" hints'],
}
export default doc
