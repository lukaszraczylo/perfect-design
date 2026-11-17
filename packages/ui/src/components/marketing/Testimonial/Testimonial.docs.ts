import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless avatar sample (docs only). */
const samplePortrait = (bg = '#e4e4e7', fg = '#a1a1aa') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><circle cx="40" cy="31" r="14" fill="${fg}"/><path d="M12 80c2-17 14-26 28-26s26 9 28 26z" fill="${fg}"/></svg>`)}`

const portrait = samplePortrait()

const doc: ComponentDoc = {
  name: 'Testimonial',
  group: 'marketing',
  subgroup: 'Social proof',
  summary: 'Customer quote with author, role, avatar and optional star rating in six layouts.',
  description:
    'Use for customer or user quotes. Semantic `<figure>` + `<blockquote>` + `<figcaption>`. If the avatar image is missing or fails to load, initials from the author name are shown. Pick a `variant` for the context: `card` for walls of love, `quote` for one big pull quote, `inline` inside prose or sidebars, `with-rating` for review-style proof, `avatar-left` for a roomy row layout, `featured` to highlight the best quote in a grid. Several testimonials in a layout: use `TestimonialGrid` or `TestimonialSlider`.',
  status: 'stable',
  props: [
    { name: 'quote', type: 'string', required: true, description: 'Required unless the default slot is used. The quote text (curly quotes are added automatically).' },
    { name: 'author', type: 'string', required: true, description: 'Person name. Required unless the `author` slot is used.' },
    { name: 'role', type: 'string', description: 'Job title / company.' },
    { name: 'avatar', type: 'string', description: 'Image URL; falls back to initials when missing or broken.' },
    { name: 'avatarAlt', type: 'string', default: "''", description: 'Alt text of the avatar (empty = decorative, since the name is adjacent).' },
    {
      name: 'variant',
      type: "'card' | 'quote' | 'inline' | 'with-rating' | 'avatar-left' | 'featured'",
      default: "'card'",
      description: 'Layout. `avatar-left` needs an avatar (image, author name or avatar slot) and otherwise renders like `card`. Unknown values fall back to `card`.',
    },
    {
      name: 'rating',
      type: 'number',
      description: 'Star rating from 0 to 5, rounded to the nearest half. Out-of-range values are clamped (7 -> 5, -1 -> 0); NaN, Infinity and non-numbers render no stars. Stars show in any variant; `with-rating` is the card style meant for it.',
    },
    { name: 'as', type: 'string | Component', default: "'figure'", description: 'Root element.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Quote text and padding scale. `md` is the original look. Unknown values fall back to `md`. Exposed as `data-size`.' },
    {
      name: 'tone',
      type: "'default' | 'muted' | 'primary' | 'inverted'",
      default: "'default'",
      description: 'Surface colour. `default` keeps the variant\'s own surface; `muted`, `primary` and `inverted` paint a filled surface and recolour the text, role line, stars and avatar to match. `quote` and `inline` gain a padded rounded box when a tone is set. Unknown values fall back to `default`. Exposed as `data-tone`.',
    },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: '`square` removes the radius of the card and of the avatar. Unknown values fall back to `rounded`. Exposed as `data-shape`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Replaces the quote text (no curly quotes added).' },
    { name: 'avatar', description: 'Replaces the avatar.' },
    { name: 'author', description: 'Replaces name and role.' },
  ],
  examples: [
    { title: 'Minimal (initials avatar)', code: `<Testimonial quote="Sample quote." author="Customer name" role="Role, Company" />` },
    {
      title: 'Variant card (default), image avatar in a grid',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <Testimonial variant="card" quote="Short sample quote." author="Customer name" role="Role" :avatar="portrait" avatar-alt="Sample portrait placeholder" />
  <Testimonial variant="card" quote="Medium-length sample quote." author="Second customer" role="Role" />
</div>`,
      state: () => ({ portrait }),
    },
    {
      title: 'Variant quote (large pull quote)',
      code: `<Testimonial variant="quote" quote="Sample pull quote, set large." author="Customer name" role="Role, Company" />`,
    },
    {
      title: 'Variant inline (compact)',
      code: `<Testimonial variant="inline" quote="Sample inline quote." author="Customer name" role="Role" />`,
    },
    {
      title: 'Variant with-rating (stars)',
      description: 'Half stars are supported; the stars expose "4.5 out of 5" to assistive tech. The numbers here are sample values: show a rating only when it comes from a real source.',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <Testimonial variant="with-rating" :rating="4.5" quote="Sample quote with a rating." author="Customer name" role="Role" />
  <Testimonial variant="with-rating" :rating="3" quote="Second sample quote with a rating." author="Second customer" role="Role" />
</div>`,
    },
    {
      title: 'Variant avatar-left',
      code: `<Testimonial variant="avatar-left" quote="Sample quote for the avatar-left layout." author="Customer name" role="Role, Company" :avatar="portrait" avatar-alt="Sample portrait placeholder" />`,
      state: () => ({ portrait }),
    },
    {
      title: 'Variant featured (highlighted)',
      code: `<Testimonial variant="featured" quote="Sample featured quote, the one to highlight." author="Customer name" role="Role, Company" />`,
    },
    {
      title: 'Sizes',
      description: '`size` scales the quote and the padding.',
      code: `<div class="grid gap-4 md:grid-cols-3">
  <Testimonial size="sm" quote="Sample small quote." author="Customer name" role="Role" />
  <Testimonial size="md" quote="Sample medium quote." author="Customer name" role="Role" />
  <Testimonial size="lg" quote="Sample large quote." author="Customer name" role="Role" />
</div>`,
    },
    {
      title: 'Tones',
      description: '`tone` paints the surface. The avatar, role line and stars follow it. Use `primary` or `inverted` for the one quote that leads the section.',
      code: `<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Testimonial tone="default" :rating="4" quote="Sample quote." author="Customer name" role="Role" />
  <Testimonial tone="muted" :rating="4" quote="Sample quote." author="Customer name" role="Role" />
  <Testimonial tone="primary" :rating="4" quote="Sample quote." author="Customer name" role="Role" />
  <Testimonial tone="inverted" :rating="4" quote="Sample quote." author="Customer name" role="Role" />
</div>`,
    },
    {
      title: 'Shape and tone on a pull quote',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <Testimonial variant="quote" tone="muted" shape="square" quote="Sample pull quote in a square muted box." author="Customer name" role="Role" />
  <Testimonial variant="inline" tone="muted" quote="Sample inline quote in a muted box." author="Customer name" role="Role" />
</div>`,
    },
    {
      title: 'Realistic: custom slots',
      code: `<Testimonial variant="card" author="Customer name" role="Role">
  <template #default>Sample quote with <strong>inline emphasis</strong>.</template>
  <template #avatar><span class="flex size-10 items-center justify-center rounded-full bg-muted text-sm">CN</span></template>
</Testimonial>`,
    },
  ],
  a11y: [
    'Semantic `<figure>` + `<blockquote>` + `<figcaption>` relate the quote to its author; the initials avatar is aria-hidden and an image avatar is decorative unless you pass `avatarAlt`.',
    'Stars are one role="img" element with aria-label such as "4.5 out of 5"; individual stars are aria-hidden. Filled stars use the foreground colour (not the warning colour) so they stay clearly visible against the empty ones in light and dark mode; the value is never colour-only.',
    'No interactive parts, so there is no keyboard map. Text wraps (`text-pretty` / `text-balance`) and the card needs no horizontal space beyond its container, so it reflows at 320px; the quote rule of `inline` uses a logical `border-s-2` for RTL.',
    'The `featured` variant is a solid primary border on the card surface (visible in forced-colors mode); no shadow or glow is used for emphasis in any variant.',
  ],
  requires: [
    'Throws a ContractError when there is neither a non-empty `quote` nor default slot content.',
    'Throws a ContractError when there is neither a non-empty `author` nor an `author` slot.',
  ],
  related: ['TestimonialGrid', 'TestimonialSlider', 'LogoCloud', 'StatGrid'],
  llmNotes: [
    'The avatar blur when a surrounding `ConfigProvider` sets `blurMedia` (privacy, not decoration); there is no prop on this component.',
    'Pass `quote` without surrounding quotation marks.',
    'Use real names, roles and ratings only; never fabricate testimonials. Examples use visibly sample text.',
    'Leave `avatarAlt` empty unless the image conveys extra information.',
    'Choose `quote` for a single hero quote, `inline` for compact use, `featured` for one highlighted card among cards.',
    'Pass `rating` as a number 0-5; never as a string.',
  ],
  replaces: ['hand-rolled Testimonial markup in app code'],
}
export default doc
