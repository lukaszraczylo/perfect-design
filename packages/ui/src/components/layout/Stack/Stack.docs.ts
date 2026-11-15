import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Stack',
  group: 'layout',
  subgroup: 'Stacks & grids',
  summary: 'Flex container that lays children out in a row or column with consistent gaps.',
  description:
    'Use `Stack` for one-dimensional layout with a gap scale instead of `flex flex-col gap-4` snippets. `HStack` (row, vertically centred) and `VStack` (column) are thin wrappers that preset `direction`. Responsive gaps (`gapSm` / `gapMd` / `gapLg`) grow the gap from a breakpoint up, `collapse` turns a horizontal stack into a column on small screens, and `divided` draws separators between children. `variant` gives the stack itself a surface (`bordered`, `card`, `muted`) and `padding` sets its inner padding, so a card-like panel needs no wrapper. For two-dimensional layouts use `Grid`; for pushing items apart inside a stack add a `Spacer`.',
  status: 'stable',
  parts: [
    {
      name: 'HStack',
      description: 'Stack with `direction="horizontal"` and `align="center"` by default. Accepts every Stack prop except `direction`. Root has `data-slot="h-stack"`.',
      props: [
        { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", default: "'center'", description: 'Cross-axis alignment.' },
        { name: 'gap', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', default: '4', description: 'Gap scale.' },
      ],
    },
    {
      name: 'VStack',
      description: 'Stack with `direction="vertical"`. Accepts every Stack prop except `direction`. Root has `data-slot="v-stack"`.',
      props: [{ name: 'gap', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', default: '4', description: 'Gap scale.' }],
    },
  ],
  props: [
    { name: 'direction', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Main axis (flex-col / flex-row).' },
    { name: 'gap', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', default: '4', description: 'Gap between children (Tailwind spacing scale). Invalid values fall back to 4.' },
    { name: 'gapSm', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `sm` breakpoint up (sm:gap-*). Invalid values are ignored.' },
    { name: 'gapMd', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `md` breakpoint up (md:gap-*). Invalid values are ignored.' },
    { name: 'gapLg', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `lg` breakpoint up (lg:gap-*). Invalid values are ignored.' },
    { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", description: 'Cross-axis alignment (align-items). Unset keeps the browser default (stretch).' },
    { name: 'justify', type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'", description: 'Main-axis distribution (justify-content).' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Allow children to wrap (flex-wrap).' },
    { name: 'collapse', type: "'sm' | 'md' | 'lg'", description: 'Horizontal stacks only: column below this breakpoint, row from it up (flex-col md:flex-row). Unknown values are ignored.' },
    { name: 'divided', type: 'boolean', default: 'false', description: 'Border between children: divide-y (vertical) or divide-x (horizontal) with the border token.' },
    { name: 'variant', type: "'plain' | 'bordered' | 'card' | 'muted'", default: "'plain'", description: 'Surface of the stack. `plain`: none. `bordered`: rounded-lg with a border. `card`: bordered bg-card panel (text-card-foreground). `muted`: rounded filled panel (secondary token pair). Surfaces add p-4 unless `padding` is set. Unknown values fall back to `plain`.' },
    { name: 'padding', type: "'auto' | 'none' | 'sm' | 'md' | 'lg'", default: "'auto'", description: 'Inner padding: `auto` = none for `plain`, p-4 for the surfaces; `none` p-0, `sm` p-3, `md` p-4, `lg` p-6. Works on `plain` too. Unknown values fall back to `auto`.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render, e.g. `ul` or `nav`.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Children to lay out.' }],
  examples: [
    {
      title: 'Vertical and horizontal',
      code: `<div class="flex flex-col gap-6">
  <Stack :gap="2">
    <Badge>One</Badge>
    <Badge variant="secondary">Two</Badge>
  </Stack>
  <Stack direction="horizontal" :gap="2" align="center">
    <Badge>One</Badge>
    <Badge variant="secondary">Two</Badge>
  </Stack>
</div>`,
    },
    {
      title: 'HStack toolbar and VStack form',
      code: `<VStack :gap="4" class="max-w-sm">
  <Input placeholder="Email" aria-label="Email" />
  <HStack justify="between">
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </HStack>
</VStack>`,
    },
    {
      title: 'Responsive gap',
      description: 'Tight gap on mobile, roomier from `md`, roomiest from `lg`.',
      code: `<VStack :gap="2" :gap-md="4" :gap-lg="8">
  <Badge>One</Badge>
  <Badge variant="secondary">Two</Badge>
  <Badge variant="outline">Three</Badge>
</VStack>`,
    },
    {
      title: 'Collapse to a column on mobile',
      description: 'A horizontal toolbar that stacks below `md`.',
      code: `<Stack direction="horizontal" collapse="md" :gap="3" align="start">
  <Input placeholder="Search" aria-label="Search" />
  <Button variant="outline">Filter</Button>
  <Button>Apply</Button>
</Stack>`,
    },
    {
      title: 'Divided list',
      description: '`divided` draws separators between rows (vertical) or columns (horizontal).',
      code: `<div class="space-y-4">
  <VStack divided :gap="0" class="rounded-md border">
    <div class="p-3 text-sm">Row one</div>
    <div class="p-3 text-sm">Row two</div>
    <div class="p-3 text-sm">Row three</div>
  </VStack>
  <HStack divided :gap="0" class="rounded-md border">
    <div class="flex-1 p-3 text-sm">Col one</div>
    <div class="flex-1 p-3 text-sm">Col two</div>
  </HStack>
</div>`,
    },
    {
      title: 'Surface variants',
      description: '`plain`, `bordered`, `card` and `muted` side by side, all with the default padding.',
      code: `<Grid min-item-width="12rem" :gap="3">
  <VStack :gap="2"><Badge>plain</Badge><span class="text-sm">Plain stack</span></VStack>
  <VStack variant="bordered" :gap="2"><Badge>bordered</Badge><span class="text-sm">Bordered stack</span></VStack>
  <VStack variant="card" :gap="2"><Badge>card</Badge><span class="text-sm">Card stack</span></VStack>
  <VStack variant="muted" :gap="2"><Badge>muted</Badge><span class="text-sm">Muted stack</span></VStack>
</Grid>`,
    },
    {
      title: 'Card with divided rows and padding',
      description: '`padding` changes the inner space; with `divided` and `:gap="0"` the card becomes a list.',
      code: `<VStack variant="card" padding="none" divided :gap="0" class="max-w-sm">
  <div class="p-3 text-sm">Sample row one</div>
  <div class="p-3 text-sm">Sample row two</div>
  <div class="p-3 text-sm">Sample row three</div>
</VStack>
<HStack variant="muted" padding="lg" justify="between" class="mt-4 max-w-sm">
  <span class="text-sm">Large padding</span>
  <Button size="sm">Action</Button>
</HStack>`,
    },
    {
      title: 'Wrapping chips',
      code: `<HStack wrap :gap="2" class="max-w-xs">
  <Badge v-for="n in 8" :key="n" variant="outline">Tag {{ n }}</Badge>
</HStack>`,
    },
  ],
  a11y: ['Purely presentational; use `as="ul"` / `as="nav"` with proper child elements when the content is a list or navigation.', 'Visual order follows DOM order; do not rely on flex reordering for reading order.', 'Surface variants are decorative boxes with no role; use `as="section"` with an `aria-label` or `as="ul"` when the box is a landmark or list. `card` and `muted` use the tested card and secondary token pairs.', 'Responsive: use `collapse` so a horizontal toolbar becomes a column below the breakpoint (mobile first), or `wrap` to let items flow onto new lines; both avoid horizontal overflow at 320px.'],
  related: ['Grid', 'Spacer', 'Container', 'Section'],
  llmNotes: [
    'Use Stack/HStack/VStack instead of ad-hoc flex + gap classes.',
    'gap accepts only 0-6, 8, 10, 12; other values fall back to 4.',
    'Use gapSm/gapMd/gapLg for responsive spacing (mobile-first: `gap` is the smallest screen).',
    'Use `collapse="md"` on a horizontal Stack to stack it on mobile; it has no effect on vertical stacks.',
    'Use `divided` with `:gap="0"` and padded children for list rows; the separator uses the border token.',
    'HStack centres items vertically by default; Stack and VStack do not set align.',
    'Use `variant="card"` instead of wrapping a Stack in a bordered div; set `padding="none"` when rows bring their own padding.',
    'Put a Spacer inside an HStack to push following items to the end.',
  ],
  replaces: ['hand-rolled Stack markup in app code'],
}
export default doc
