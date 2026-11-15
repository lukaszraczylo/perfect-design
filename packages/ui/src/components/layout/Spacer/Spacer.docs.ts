import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Spacer',
  group: 'layout',
  subgroup: 'Stacks & grids',
  summary: 'Flexible (flex-1) or fixed-size empty space for use inside flex layouts.',
  description:
    'Without `size`, `Spacer` grows to fill free space in a flex container, pushing siblings apart (e.g. logo left, actions right). With `size` it becomes a fixed gap along `axis`. Sizes run 0-6, 8, 10, 12 and the section-level steps 14, 16, 20 and 24; `sizeMd` and `sizeLg` change the size from a breakpoint up (mobile-first), for example tight on a phone and 24 units between page sections on a desktop. Prefer the `gap` prop of Stack/Grid for uniform spacing and use Spacer for one-off gaps or push-apart behaviour. Always `aria-hidden`.',
  status: 'stable',
  props: [
    { name: 'size', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16 | 20 | 24', description: 'Fixed size from the spacing scale. Omit (or pass an invalid value) for flexible flex-1.' },
    { name: 'sizeMd', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16 | 20 | 24', description: 'Size from the `md` breakpoint up (md:h-* / md:w-*). Ignored without a valid `size`; invalid values are ignored.' },
    { name: 'sizeLg', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 14 | 16 | 20 | 24', description: 'Size from the `lg` breakpoint up (lg:h-* / lg:w-*). Ignored without a valid `size`; invalid values are ignored.' },
    { name: 'axis', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Which dimension `size` sets: vertical = height, horizontal = width.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [],
  examples: [
    {
      title: 'Push items apart',
      code: `<HStack class="rounded-md border p-2">
  <Badge>Start</Badge>
  <Spacer />
  <Button size="sm">End</Button>
</HStack>`,
    },
    {
      title: 'Fixed sizes',
      code: `<div>
  <Badge>Above</Badge>
  <Spacer :size="8" />
  <Badge>Below (8 units later)</Badge>
</div>
<HStack class="mt-4">
  <Badge>Left</Badge>
  <Spacer :size="6" axis="horizontal" />
  <Badge>Right</Badge>
</HStack>`,
    },
    {
      title: 'Section spacing that grows with the screen',
      description: 'Eight units on a phone, 16 from `md`, 24 from `lg`. The larger steps 14, 16, 20 and 24 are for gaps between page sections.',
      code: `<div>
  <Badge>First section</Badge>
  <Spacer :size="8" :size-md="16" :size-lg="24" />
  <Badge>Second section</Badge>
</div>
<HStack class="mt-4">
  <Badge>Left</Badge>
  <Spacer axis="horizontal" :size="4" :size-md="12" />
  <Badge>Right</Badge>
</HStack>`,
    },
  ],
  a11y: ['Rendered with aria-hidden="true"; contains no content.', 'Large fixed sizes (16 to 24 units = 64 to 96px) are fixed lengths: use `sizeMd` / `sizeLg` and start small so the spacing does not crowd a 320px screen.'],
  related: ['Stack', 'Grid'],
  llmNotes: [
    'A Spacer without `size` only works inside a flex container.',
    'Do not use Spacer for uniform spacing; use the gap prop of Stack/Grid.',
    'sizeMd / sizeLg need a `size`; set `size` to the smallest-screen value.',
  ],
  replaces: ['`<div class="flex-1" />` and `<div class="h-4" />` filler elements'],
}
export default doc
