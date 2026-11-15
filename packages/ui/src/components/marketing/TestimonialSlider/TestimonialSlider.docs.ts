import type { ComponentDoc } from '../../../docs-types'

const items = [
  { quote: 'Sample quote.', author: 'Customer name', role: 'Role, Company' },
  { quote: 'Short sample quote.', author: 'Second customer', role: 'Role' },
  { quote: 'Medium-length sample quote.', author: 'Third customer', role: 'Role', rating: 4 },
  { quote: 'Sample quote without a role.', author: 'Fourth customer' },
]

const doc: ComponentDoc = {
  name: 'TestimonialSlider',
  group: 'marketing',
  subgroup: 'Social proof',
  summary: 'Swipeable testimonial carousel built on CSS scroll-snap, no JavaScript carousel engine.',
  description:
    'A horizontally scrolling, snap-aligned row of testimonials with optional previous/next buttons. Touch swiping, trackpad scrolling and keyboard (focus the track, then Left/Right arrows) all work. There is no autoplay by design. Use `perView` to show 2-3 slides on large screens. For a static wall use `TestimonialGrid`.',
  status: 'stable',
  props: [
    { name: 'items', type: 'TestimonialItem[]', default: '[]', description: '`{ quote?, author?, role?, avatar?, avatarAlt?, rating? }` per slide. Ignored when the default slot is used.' },
    { name: 'variant', type: "'card' | 'quote' | 'inline' | 'with-rating' | 'avatar-left' | 'featured'", default: "'card'", description: 'Testimonial variant for generated slides. Unknown values fall back to `card`. The resolved value is exposed as `data-variant` on the root, also when the slides come from the slot.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Testimonial `size` for generated slides (quote and padding scale). Exposed as `data-size`.' },
    { name: 'tone', type: "'default' | 'muted' | 'primary' | 'inverted'", default: "'default'", description: 'Testimonial `tone` for generated slides. Exposed as `data-tone`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Testimonial `shape` for generated slides. Exposed as `data-shape`.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'end'", description: 'Where the previous and next buttons sit under the track. Unknown values fall back to `end`. Exposed as `data-align`.' },
    { name: 'perView', type: '1 | 2 | 3', default: '1', description: 'Slides visible at once on large screens (always 1 on mobile, 2 from `md` for 3). Invalid values fall back to 1.' },
    { name: 'controls', type: 'boolean', default: 'true', description: 'Show previous/next buttons. At the ends (or when everything fits) they are aria-disabled, not disabled, so a focused button keeps focus.' },
    { name: 'label', type: 'string', default: "'Testimonials'", description: 'Accessible name of the carousel region. Make it unique when a page has several carousels (identical region names fail the landmark-unique rule).' },
    { name: 'slidesLabel', type: 'string', default: "'Slides'", description: 'Accessible name of the focusable, scrollable track (a group inside the region).' },
    { name: 'slideLabel', type: 'string', default: "'{n} of {total}'", description: 'Name of each generated slide; `{n}` and `{total}` are replaced (position in the original sequence).' },
    { name: 'statusLabel', type: 'string', default: "'Slide {n} of {total}'", description: 'Text announced in the polite live region once scrolling settles on a different slide. Silent on load.' },
    { name: 'prevLabel', type: 'string', default: "'Previous testimonial'", description: 'aria-label of the previous button.' },
    { name: 'nextLabel', type: 'string', default: "'Next testimonial'", description: 'aria-label of the next button.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces `items`. Each child should be a slide, e.g. `<div class="snap-start shrink-0 basis-full">`.' }],
  examples: [
    { title: 'Minimal', code: `<TestimonialSlider label="Minimal testimonial slider" :items="[{ quote: 'First sample.', author: 'Customer name' }, { quote: 'Second sample.', author: 'Second customer' }]" />` },
    { title: 'Realistic: with-rating cards, 2 per view', code: `<TestimonialSlider variant="with-rating" :per-view="2" label="Sample reviews" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    { title: 'Variant quote without controls', code: `<TestimonialSlider variant="quote" :controls="false" label="Pull quotes without buttons" :items="items" />`, script: `const items = [...]`, state: () => ({ items }) },
    {
      title: 'Size, tone, shape and centred controls',
      code: `<TestimonialSlider size="lg" tone="muted" shape="square" align="center" label="Sample large slides" :items="items" />`,
      script: `const items = [...]`,
      state: () => ({ items }),
    },
    {
      title: 'Custom slides',
      code: `<TestimonialSlider label="Custom slides example">
  <div class="snap-start shrink-0 basis-full"><Testimonial quote="One." author="Customer name" /></div>
  <div class="snap-start shrink-0 basis-full"><Testimonial quote="Two." author="Second customer" /></div>
</TestimonialSlider>`,
    },
  ],
  a11y: [
    'The wrapper is role="region" with aria-roledescription="carousel" and an accessible name from `label` (give each carousel on a page a different `label`). The track is a focusable `role="group"` named by `slidesLabel`; generated slides are role="group" aria-roledescription="slide" labelled "n of N".',
    'Keyboard map: Tab reaches the track, then Left/Right arrows scroll one page (visual direction, also in RTL); Tab continues to the Previous and Next buttons (Enter or Space). Arrow keys pressed inside a link or button in a slide are left alone. At the ends the buttons stay focusable (aria-disabled) and do nothing.',
    'A visually hidden polite status region announces "Slide N of M" after scrolling settles on a different slide (scrollend, or a 150ms debounce); it is silent on load. The buttons are 36px (44px on coarse pointers) with the shared focus ring; chevrons mirror in RTL.',
    'No autoplay, so there is nothing to pause. Smooth scrolling is replaced by instant scrolling under prefers-reduced-motion. One slide per view at 320px; the track scrolls inside itself, never the page.',
  ],
  requires: [
    'Throws a ContractError when `label` is an empty string (the carousel region needs a name), or, with `controls`, when `prevLabel` or `nextLabel` is empty.',
    'Throws a ContractError when an entry of `items` has no non-empty `quote` or no non-empty `author` (the message names the first failing index).',
  ],
  related: ['Testimonial', 'TestimonialGrid', 'Marquee'],
  llmNotes: [
    'Prefer TestimonialGrid when all quotes can be shown at once; use the slider when vertical space is tight.',
    'Always set a meaningful `label` when the page has more than one carousel.',
    'In custom slot content every slide needs `snap-start shrink-0` plus a basis class.',
  ],
}
export default doc
