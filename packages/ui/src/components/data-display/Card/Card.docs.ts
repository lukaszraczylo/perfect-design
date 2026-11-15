import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' }
const asProps = [
  { name: 'as', type: 'string | Component', description: 'Element to render.' },
  { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
]

const doc: ComponentDoc = {
  name: 'Card',
  group: 'data-display',
  subgroup: 'Containers',
  summary: 'Surface that groups related content, with header, content and footer parts.',
  description:
    'Use `Card` to frame a self-contained chunk of information (a stat, a form section, a list item with actions). Compose with `CardHeader` (`CardTitle`, `CardDescription`, `CardAction`), `CardContent` and `CardFooter`. Surface variants: `default` (border + shadow), `outline` (border only), `elevated` (shadow, no border), `interactive` (hover + focus styles; render it as a link/button with `as="a"` or `as-child`), `ghost` (no surface, for grouping inside an already-framed area), `filled` (flat muted surface for secondary panels), `with-image-header` (flush `CardMedia` on top, corners clipped). `layout="horizontal"` puts `CardMedia` beside a `CardBody` from the `sm` breakpoint (stacked below). `selectable` turns the whole card into a checkbox-like toggle (plan pickers, multi-select galleries) with `v-model`/`checked`. Do not nest cards inside cards; for a KPI use `KpiTile`.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'outline' | 'elevated' | 'interactive' | 'ghost' | 'filled' | 'with-image-header'", default: "'default'", description: 'Surface style. Unknown values render only the base layout classes.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and gap: `sm` 1rem, `md` 1.5rem (the original), `lg` 2rem. `CardHeader`, `CardContent`, `CardFooter` and `CardBody` take their horizontal and vertical padding from the card, so one prop sizes the whole composition. Unknown values fall back to `md`.' },
    { name: 'layout', type: "'vertical' | 'horizontal'", default: "'vertical'", description: '`horizontal` lays `CardMedia` + `CardBody` side by side from `sm` up (no padding/gap on the card itself); unknown values fall back to `vertical`.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Whole card toggles on click / Space / Enter. Adds `role="checkbox"`, `aria-checked`, `data-state="checked|unchecked"` and `tabindex=0`. Clicks on inner links, buttons and inputs do not toggle.' },
    { name: 'modelValue', type: 'boolean', description: 'Selected state (`v-model`). When neither `modelValue` nor `checked` is given the card keeps its own state.' },
    { name: 'checked', type: 'boolean', description: 'Alias of `modelValue` for `v-model:checked`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Selectable cards only: dims the card, sets `aria-disabled`, removes it from the tab order and blocks toggling.' },
    ...asProps,
    classProp,
  ],
  slots: [{ name: 'default', description: 'Card parts or arbitrary content.' }],
  emits: [
    { name: 'update:modelValue', payload: '[value: boolean]', description: 'Selectable cards: the new selected state.' },
    { name: 'update:checked', payload: '[value: boolean]', description: 'Same payload, for `v-model:checked`.' },
  ],
  parts: [
    { name: 'CardHeader', description: 'Grid header; places `CardAction` top-right automatically.', props: [...asProps, classProp] },
    { name: 'CardTitle', description: 'Heading (renders `h3`; change with `as`).', props: [...asProps, classProp] },
    { name: 'CardDescription', description: 'Muted supporting text (`p`).', props: [...asProps, classProp] },
    { name: 'CardAction', description: 'Slot for a header action such as a Button or menu.', props: [...asProps, classProp] },
    { name: 'CardContent', description: 'Main body with horizontal padding.', props: [...asProps, classProp] },
    { name: 'CardFooter', description: 'Footer row (flex) for actions or meta.', props: [...asProps, classProp] },
    { name: 'CardMedia', description: 'Image/illustration area (`img` children fill it with object-cover). Takes 40% of the row inside a horizontal card; override with `class`.', props: [...asProps, classProp] },
    { name: 'CardBody', description: 'Content column (padding + gap) for horizontal cards, where the card itself has no padding.', props: [...asProps, classProp] },
  ],
  examples: [
    {
      title: 'Basic card',
      code: `<Card class="max-w-sm">
  <CardHeader>
    <CardTitle>Sample project</CardTitle>
    <CardDescription>Sample data</CardDescription>
  </CardHeader>
  <CardContent>Card content goes here.</CardContent>
</Card>`,
    },
    {
      title: 'With action and footer',
      code: `<Card class="max-w-sm">
  <CardHeader>
    <CardTitle>Sample plan</CardTitle>
    <CardDescription>Sample data</CardDescription>
    <CardAction><Badge variant="success">Active</Badge></CardAction>
  </CardHeader>
  <CardContent>Plan details go here.</CardContent>
  <CardFooter class="gap-2 justify-end">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm">Save changes</Button>
  </CardFooter>
</Card>`,
    },
    {
      title: 'Ghost',
      description: 'No surface or shadow; the transparent border keeps alignment with bordered cards.',
      code: `<Card variant="ghost" class="max-w-sm"><CardHeader><CardTitle>Ghost</CardTitle><CardDescription>Grouped without a frame</CardDescription></CardHeader></Card>`,
    },
    {
      title: 'Filled',
      description: 'Flat muted surface for secondary panels.',
      code: `<Card variant="filled" class="max-w-sm"><CardHeader><CardTitle>Filled</CardTitle><CardDescription>Secondary panel</CardDescription></CardHeader><CardContent>Muted background, no shadow.</CardContent></Card>`,
    },
    {
      title: 'With image header',
      description: 'A flush `CardMedia` on top; the card clips it to the rounded corners.',
      code: `<Card variant="with-image-header" class="max-w-sm">
  <CardMedia class="h-36" role="img" aria-label="Sample cover placeholder"><div class="size-full bg-muted" /></CardMedia>
  <CardHeader><CardTitle>Image header</CardTitle><CardDescription>Sample data</CardDescription></CardHeader>
  <CardContent>Cover image, then the usual parts.</CardContent>
</Card>`,
    },
    {
      title: 'Horizontal layout with media',
      description: 'Media beside a `CardBody` from `sm` up; stacked on mobile. Put `CardMedia` last in the DOM for a right-hand image.',
      code: `<Card layout="horizontal" class="max-w-xl">
  <CardMedia role="img" aria-label="Sample media placeholder"><div class="h-32 size-full bg-muted sm:h-full" /></CardMedia>
  <CardBody>
    <CardHeader><CardTitle>Horizontal card</CardTitle><CardDescription>Sample data</CardDescription></CardHeader>
    <CardContent>Media on the left from the sm breakpoint, stacked on a phone.</CardContent>
    <CardFooter><Button size="sm" variant="outline">Open details</Button></CardFooter>
  </CardBody>
</Card>`,
    },
    {
      title: 'Selectable (v-model)',
      description: 'The whole card toggles with click, Space or Enter. Inner buttons and links do not toggle it.',
      script: `const picked = ref(['plan b'])
const plans = ['plan a', 'plan b', 'plan c']
function set(plan, on) { picked.value = on ? [...picked.value, plan] : picked.value.filter((p) => p !== plan) }`,
      state: () => {
        const picked = ref<string[]>(['plan b'])
        const plans = ['plan a', 'plan b', 'plan c']
        const set = (plan: string, on: boolean) => {
          picked.value = on ? [...picked.value, plan] : picked.value.filter((p) => p !== plan)
        }
        return { picked, plans, set }
      },
      code: `<div class="grid gap-3 sm:grid-cols-3">
  <Card v-for="plan in plans" :key="plan" selectable :aria-label="plan" :model-value="picked.includes(plan)" @update:model-value="set(plan, $event)">
    <CardHeader><CardTitle class="capitalize">{{ plan }}</CardTitle><CardDescription>{{ picked.includes(plan) ? 'Selected' : 'Click to select' }}</CardDescription></CardHeader>
  </Card>
  <Card selectable disabled aria-label="Plan d"><CardHeader><CardTitle>Plan d</CardTitle><CardDescription>Unavailable</CardDescription></CardHeader></Card>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size` sm, md and lg: the parts follow the card (sample content).',
      code: `<div class="flex flex-col gap-4">
  <Card size="sm"><CardHeader><CardTitle>Small</CardTitle><CardDescription>Padding 1rem</CardDescription></CardHeader><CardContent>Sample content</CardContent></Card>
  <Card size="md"><CardHeader><CardTitle>Medium</CardTitle><CardDescription>Padding 1.5rem</CardDescription></CardHeader><CardContent>Sample content</CardContent></Card>
  <Card size="lg"><CardHeader><CardTitle>Large</CardTitle><CardDescription>Padding 2rem</CardDescription></CardHeader><CardContent>Sample content</CardContent></Card>
</div>`,
    },
    {
      title: 'Variants and interactive link card',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <Card variant="outline"><CardContent>Outline</CardContent></Card>
  <Card variant="elevated"><CardContent>Elevated</CardContent></Card>
  <Card variant="interactive" as="a" href="/components"><CardHeader><CardTitle>Interactive link</CardTitle><CardDescription>Opens the components list</CardDescription></CardHeader></Card>
</div>`,
    },
  ],
  a11y: [
    '`selectable` cards expose `role="checkbox"` with `aria-checked`; give them an accessible name (heading text or `aria-label`). Space and Enter toggle, `disabled` sets `aria-disabled` and drops the card from the tab order.',
    'Plain card is a presentational div; add `role="region"` + `aria-labelledby` if it must be a landmark.',
    '`CardMedia` is a plain div: `aria-label` is only valid on it with a role, so a decorative placeholder gets `role="img"` plus a label (or `aria-hidden`), and a real image carries its own `alt`.',
    'No variant uses a gradient, glow, edge stripe or hover movement: a card is a bordered surface; `elevated` and `interactive` only change the shadow and border colour.',
    'A checked `selectable` card keeps a visible keyboard focus indicator: besides the focus ring it draws a 2px solid outline, because its primary ring and border would otherwise hide the ring.',
    '`interactive` only styles the card: render it as `a`/`button` (`as`) so it is focusable and announced correctly.',
    'CardTitle renders an h3; set `as` to match the page heading hierarchy.',
  ],
  related: ['KpiTile', 'List', 'DescriptionList'],
  requires: [
    'Throws a ContractError when a `selectable` card (role checkbox) has no accessible name from its text, `aria-label` or `aria-labelledby`, or when a card given `role="region"` has no `aria-label` or `aria-labelledby`. A plain card needs nothing.',
  ],
  llmNotes: [
    'Compose Card from its parts; do not hand-roll padding.',
    'Use `variant="interactive"` together with `as="a"` or `as-child`, never on a bare div with @click only.',
    'Use `selectable` (with v-model) for pick-one/pick-many cards instead of wrapping a Card in a checkbox label; do not put `variant="interactive"` and `selectable` together.',
    'For an image on top use `variant="with-image-header"` + `CardMedia` as the first child; for side-by-side use `layout="horizontal"` with `CardMedia` + `CardBody`.',
    'Do not nest Card inside Card; use `variant="outline"` sections or DescriptionList inside CardContent.',
    'Put the single header action in CardAction, not inside CardTitle.',
  ],
  replaces: ['shadcn-vue Card', 'hand-rolled Card markup in app code'],
}
export default doc
