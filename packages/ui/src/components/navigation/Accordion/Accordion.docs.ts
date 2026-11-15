import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Accordion',
  group: 'navigation',
  subgroup: 'Tabs & disclosure',
  summary: 'Vertically stacked sections that expand and collapse. Single or multiple open items. Built on reka-ui.',
  description:
    'Compose `Accordion` + `AccordionItem` (unique `value`) + `AccordionTrigger` + `AccordionContent`. `type="single"` keeps one item open (and `collapsible`, on by default, lets it close); `type="multiple"` allows several. Control with `v-model` (string for single, string[] for multiple) or use `defaultValue`. Content animates with `animate-ds-collapse-*` and respects reduced motion. For one standalone toggle use `Collapsible`.',
  status: 'stable',
  parts: [
    { name: 'AccordionItem', description: 'One section. Divided by `border-b` in `flush`/`bordered`, its own card in `separated` and `filled`.', props: [{ name: 'value', type: 'string', required: true, description: 'Unique identifier.' }, { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable this item.' }, { name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    { name: 'AccordionTrigger', description: 'Heading button (wrapped in an `h3` by default) with a rotating chevron. Slot `icon` replaces the chevron.', props: [{ name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Level of the wrapping heading; match it to the page outline.' }, { name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    { name: 'AccordionContent', description: 'Collapsible region (`role="region"`); `class` is applied to the padded inner wrapper.', props: [{ name: 'forceMount', type: 'boolean', default: 'false', description: 'Keep mounted while closed.' }, { name: 'class', type: 'string | object | array', description: 'Merged onto the inner wrapper.' }] },
  ],
  props: [
    { name: 'type', type: "'single' | 'multiple'", default: "'single'", description: 'Open behaviour. Unknown values fall back to `single`.' },
    { name: 'modelValue', type: 'string | string[]', description: 'Controlled open item(s) (v-model).' },
    { name: 'defaultValue', type: 'string | string[]', description: 'Initially open item(s).' },
    { name: 'collapsible', type: 'boolean', default: 'true', description: 'In single mode, allow closing the open item.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all items.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Arrow-key axis.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction.' },
    { name: 'variant', type: "'flush' | 'bordered' | 'separated' | 'filled'", default: "'flush'", description: '`flush`: items divided by a rule. `bordered`: one rounded frame around all items. `separated`: each item a bordered card with a gap. `filled`: each item on a muted surface. Unknown values fall back to `flush`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and padding of triggers and content. Unknown values fall back to `md`.' },
    { name: 'iconPosition', type: "'start' | 'end'", default: "'end'", description: 'Where the chevron (or the `icon` slot) sits relative to the title. Unknown values fall back to `end`.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child as the root.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [{ name: 'default', description: 'AccordionItem parts.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string | string[] | undefined]', description: 'Open item(s) changed.' }],
  examples: [
    {
      title: 'Single, collapsible',
      code: `<Accordion type="single" default-value="shipping" class="max-w-md">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Orders ship within two business days.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Return unused items within 30 days.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="support" disabled>
    <AccordionTrigger>Support</AccordionTrigger>
    <AccordionContent>Unavailable.</AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
    {
      title: 'Variants',
      description: 'Gallery of the four variants.',
      code: `<div class="grid max-w-md gap-6">
  <Accordion v-for="variant in ['flush', 'bordered', 'separated', 'filled']" :key="variant" type="single" collapsible :variant="variant" default-value="one">
    <AccordionItem value="one"><AccordionTrigger>Variant {{ variant }}</AccordionTrigger><AccordionContent>Open section.</AccordionContent></AccordionItem>
    <AccordionItem value="two"><AccordionTrigger>Second section</AccordionTrigger><AccordionContent>Closed section.</AccordionContent></AccordionItem>
  </Accordion>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg`.',
      code: `<div class="grid max-w-md gap-6">
  <Accordion v-for="size in ['sm', 'md', 'lg']" :key="size" type="single" collapsible variant="bordered" :size="size" default-value="one">
    <AccordionItem value="one"><AccordionTrigger>Size {{ size }}</AccordionTrigger><AccordionContent>Content at the same size.</AccordionContent></AccordionItem>
  </Accordion>
</div>`,
    },
    {
      title: 'Icon at the start',
      code: `<Accordion type="single" collapsible variant="separated" icon-position="start" default-value="one" class="max-w-md">
  <AccordionItem value="one"><AccordionTrigger>Chevron before the title</AccordionTrigger><AccordionContent>Useful for tree-like lists.</AccordionContent></AccordionItem>
  <AccordionItem value="two"><AccordionTrigger>Second section</AccordionTrigger><AccordionContent>More text.</AccordionContent></AccordionItem>
</Accordion>`,
    },
    {
      title: 'Multiple with v-model',
      script: `const open = ref(['a'])`,
      code: `<div class="max-w-md space-y-2">
  <Accordion v-model="open" type="multiple">
    <AccordionItem value="a"><AccordionTrigger>Section A</AccordionTrigger><AccordionContent>Alpha</AccordionContent></AccordionItem>
    <AccordionItem value="b"><AccordionTrigger>Section B</AccordionTrigger><AccordionContent>Beta</AccordionContent></AccordionItem>
  </Accordion>
  <p class="text-sm text-muted-foreground">Open: {{ open.join(', ') || 'none' }}</p>
</div>`,
      state: () => ({ open: ref(['a']) }),
    },
  ],
  a11y: [
    'Each trigger is a button inside a heading with aria-expanded and aria-controls.',
    'Content is role="region" labelled by its trigger.',
    'Arrow Up/Down, Home and End move focus between triggers; Enter/Space toggles. Tab also reaches every trigger.',
    'Set `headingLevel` on AccordionTrigger so the headings fit the page outline (default h3).',
    'Triggers are at least 44px high on coarse pointers, text aligns to the start edge (RTL-safe), and the open/close animation is off under `motion-reduce`.',
    '`variant`, `size` and `iconPosition` only change the look. Roles, heading levels, names, arrow-key movement and the reduced-motion handling are identical for every value; the chevron is decorative, so moving it to the start changes nothing for assistive technology.',
    'Disabled items stay in the DOM with the disabled attribute and are skipped by arrow keys.',
  ],
  related: ['Collapsible', 'Tabs'],
  requires: [
    'Throws a ContractError when two `AccordionItem`s share a `value`, or an item has a blank `value`.',
    'Throws a ContractError when an `AccordionItem` has no `AccordionTrigger` or no `AccordionContent`.',
    'Throws a ContractError when an `AccordionTrigger` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Every AccordionItem needs a unique `value`.',
    'Set `heading-level` on AccordionTrigger to the level below the surrounding heading.',
    'v-model is a string for `single` and a string[] for `multiple`.',
    'Put content classes on AccordionContent (applied to the inner padded wrapper), not on the animated outer element.',
  ],
  replaces: ['shadcn-vue Accordion', 'hand-rolled Accordion markup in app code'],
}
export default doc
