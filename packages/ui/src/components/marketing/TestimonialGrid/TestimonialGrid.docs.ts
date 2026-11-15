import type { ComponentDoc } from '../../../docs-types'

const items = [
  { quote: 'Sample quote.', author: 'Customer name', role: 'Role, Company' },
  { quote: 'A longer sample quote that runs over several lines, so the masonry layout has something to balance against the short ones.', author: 'Second customer', role: 'Role' },
  { quote: 'Medium-length sample quote.', author: 'Third customer', role: 'Role', rating: 4 },
  { quote: 'Sample quote without a role.', author: 'Fourth customer' },
]

const doc: ComponentDoc = {
  name: 'TestimonialGrid',
  group: 'marketing',
  subgroup: 'Social proof',
  summary: 'Wall of testimonials in a grid, masonry or side-by-side columns layout.',
  description:
    'Lays out several `Testimonial`s. Pass `items` for the common case or fill the default slot with your own `Testimonial`s. `layout="grid"` gives equal-height rows, `masonry` flows cards by natural height (best when quote lengths differ), `columns` puts 2-4 testimonials side by side on `md`+ and stacks them on mobile. The `variant` is passed to every generated `Testimonial`. For a swipeable single row use `TestimonialSlider`.',
  status: 'stable',
  props: [
    { name: 'items', type: 'TestimonialItem[]', default: '[]', description: '`{ quote?, author?, role?, avatar?, avatarAlt?, rating? }` per testimonial. Ignored when the default slot is used.' },
    { name: 'layout', type: "'grid' | 'masonry' | 'columns'", default: "'grid'", description: 'Arrangement. Unknown values fall back to `grid`.' },
    { name: 'columns', type: '1 | 2 | 3', default: '3', description: 'Max columns on large screens for `grid` and `masonry` (always 1 on mobile, 2 from `sm`). Ignored by `columns`. Invalid values fall back to 3.' },
    { name: 'variant', type: "'card' | 'quote' | 'inline' | 'with-rating' | 'avatar-left' | 'featured'", default: "'card'", description: 'Testimonial variant for generated items. Unknown values fall back to `card`.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Spacing between testimonials: `md` is the original spacing (`gap-6`), `sm` tightens and `lg` loosens it, in every layout. Unknown values fall back to `md`. Exposed as `data-gap`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Testimonial `size` for generated items (quote and padding scale). Exposed as `data-size`.' },
    { name: 'tone', type: "'default' | 'muted' | 'primary' | 'inverted'", default: "'default'", description: 'Testimonial `tone` for generated items. Exposed as `data-tone`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Testimonial `shape` for generated items. Exposed as `data-shape`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces `items`; place `Testimonial` components (the grid does not wrap them).' }],
  examples: [
    {
      title: 'Minimal',
      code: `<TestimonialGrid :columns="2" :items="[{ quote: 'First sample.', author: 'Customer name' }, { quote: 'Second sample.', author: 'Second customer' }]" />`,
    },
    { title: 'Layout grid (equal-height rows)', code: `<TestimonialGrid layout="grid" :columns="2" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Layout masonry (CSS columns)', code: `<TestimonialGrid layout="masonry" :columns="2" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Layout columns (side by side)', code: `<TestimonialGrid layout="columns" :items="items.slice(0, 3)" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant with-rating', code: `<TestimonialGrid variant="with-rating" :columns="2" :items="items.slice(0, 2)" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant inline, one column', code: `<TestimonialGrid variant="inline" :columns="1" :items="items.slice(0, 3)" />`, script: `const items = [...]`, state: () => ({ items }) },
    {
      title: 'Gap, size, tone and shape',
      description: 'These props go to every generated testimonial. Top: tight, small, muted. Bottom: loose, large, square.',
      code: `<div class="grid gap-8">
  <TestimonialGrid :columns="2" gap="sm" size="sm" tone="muted" :items="items.slice(0, 2)" />
  <TestimonialGrid :columns="2" gap="lg" size="lg" shape="square" :items="items.slice(0, 2)" />
</div>`,
      script: `const items = [...]`,
      state: () => ({ items }),
    },
    {
      title: 'Realistic: featured quote plus slot content',
      code: `<TestimonialGrid layout="grid" :columns="2">
  <Testimonial variant="featured" quote="Sample featured quote." author="Customer name" role="Role" />
  <Testimonial quote="Short sample." author="Second customer" role="Role" />
</TestimonialGrid>`,
    },
  ],
  a11y: [
    'Each generated Testimonial is a `<figure>` with blockquote and figcaption, so every quote stays tied to its author. With `items` the grid is a native `<ul>` of `<li>` (a screen reader announces "list, 4 items"); with the default slot or no items it is a plain `<div>` and adds no ARIA roles (`role` is a Testimonial prop, the job title).',
    'No interactive parts, so there is no keyboard map. One column at 320px, two from `sm`, `columns` from `lg` (`columns` layout stacks below `md`); cards wrap long text.',
  ],
  requires: [
    'Throws a ContractError when an entry of `items` has no non-empty `quote` or no non-empty `author` (the message names the first failing index).',
  ],
  related: ['Testimonial', 'TestimonialSlider', 'LogoCloud'],
  llmNotes: [
    'Use `masonry` when quote lengths vary a lot, `grid` for uniform cards, `columns` for 2-3 headline quotes.',
    'Use `columns` prop only with `grid`/`masonry`.',
    'Give every item `author`; omit fabricated ratings.',
    'Use the default slot to mix a `featured` Testimonial with normal ones.',
  ],
}
export default doc
