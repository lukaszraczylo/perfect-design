import { ref } from 'vue'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Collapsible',
  group: 'navigation',
  subgroup: 'Tabs & disclosure',
  summary: 'A single show/hide region with an animated reveal. Built on reka-ui.',
  description:
    'Compose `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`. Control with `v-model:open` or leave uncontrolled (`defaultOpen`). The default slot receives `{ open }`. Use as-child on the trigger to turn your own Button into the toggle. For several related sections use `Accordion`.',
  status: 'stable',
  parts: [
    { name: 'CollapsibleTrigger', description: 'Toggle element (button by default; `as-child` to use your own). Sets aria-expanded/aria-controls.', props: [{ name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child.' }, { name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    { name: 'CollapsibleContent', description: 'Region that animates with `animate-ds-collapse-*`.', props: [{ name: 'forceMount', type: 'boolean', default: 'false', description: 'Keep mounted while closed.' }, { name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
  ],
  props: [
    { name: 'as', type: 'string | Component', description: 'Element or component to render as (reka-ui Primitive).' },
    { name: 'asChild', type: 'boolean', description: 'Render the single slot child instead of a wrapper element.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevent toggling.' },
    { name: 'unmountOnHide', type: 'boolean', default: 'false', description: 'Unmount content while closed.' },
    { name: 'variant', type: "'plain' | 'bordered' | 'filled'", default: "'plain'", description: '`plain`: no surface. `bordered`: rounded frame with padding. `filled`: muted surface with padding. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding of the framed variants and text size of the content. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  slots: [{ name: 'default', description: 'Trigger and content.', props: '{ open: boolean }' }],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  examples: [
    {
      title: 'Basic',
      code: `<Collapsible class="w-72 space-y-2">
  <CollapsibleTrigger as-child><Button variant="outline" size="sm">Toggle details</Button></CollapsibleTrigger>
  <CollapsibleContent class="rounded-md border p-3 text-sm">Extra details that were hidden.</CollapsibleContent>
</Collapsible>`,
    },
    {
      title: 'Bordered and filled',
      description: 'Gallery of the framed variants at different sizes.',
      code: `<div class="grid max-w-sm gap-4">
  <Collapsible v-for="variant in ['bordered', 'filled']" :key="variant" :variant="variant" size="sm" default-open class="space-y-2">
    <CollapsibleTrigger as-child><Button variant="outline" size="sm">Toggle {{ variant }}</Button></CollapsibleTrigger>
    <CollapsibleContent>Details inside the {{ variant }} surface.</CollapsibleContent>
  </Collapsible>
  <Collapsible variant="bordered" size="lg" default-open class="space-y-2">
    <CollapsibleTrigger as-child><Button variant="outline" size="sm">Toggle large</Button></CollapsibleTrigger>
    <CollapsibleContent>Larger padding and text.</CollapsibleContent>
  </Collapsible>
</div>`,
    },
    {
      title: 'Controlled with icon',
      script: `const open = ref(true)`,
      code: `<Collapsible v-model:open="open" class="w-72 space-y-2">
  <CollapsibleTrigger class="flex w-full items-center justify-between text-sm font-medium">
    Advanced options
    <Icon :icon="faChevronDown" :class="open ? 'rotate-180' : ''" />
  </CollapsibleTrigger>
  <CollapsibleContent class="text-sm text-muted-foreground">Timeouts, retries and proxies.</CollapsibleContent>
</Collapsible>`,
      state: () => ({ open: ref(true), faChevronDown }),
    },
  ],
  a11y: ['Trigger has aria-expanded and aria-controls pointing at the content.', 'Enter/Space toggles; disabled sets the disabled attribute.', 'The reveal animation is turned off under `motion-reduce`.', '`variant` and `size` only change the surface, padding and text size; the trigger and region wiring is identical.', 'The trigger is a real button, so give an icon-only trigger an aria-label and keep the visible text inside its name.'],
  related: ['Accordion', 'SidebarNav'],
  requires: [
    'Throws a ContractError when `Collapsible` has no `CollapsibleTrigger` or no `CollapsibleContent`.',
    'Throws a ContractError when a `CollapsibleTrigger` rendered as a button or link has no accessible name (text or `aria-label`).',
  ],
  llmNotes: ['Use `as-child` on CollapsibleTrigger to reuse Button; do not nest a Button inside it.', 'Prefer `Accordion` for groups of sections.', 'Use `v-model:open` for controlled state.'],
  replaces: ['shadcn-vue Collapsible', 'hand-rolled Collapsible markup in app code'],
}
export default doc
