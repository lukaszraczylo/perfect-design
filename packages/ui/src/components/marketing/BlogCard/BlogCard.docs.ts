import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless landscape sample (docs only). */
const sampleScene = (bg = '#e4e4e7', mid = '#d4d4d8', fg = '#a1a1aa') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${bg}"/><circle cx="470" cy="110" r="42" fill="${mid}"/><path d="M0 300 170 150 300 260 410 180 640 330V360H0z" fill="${mid}"/><path d="M0 360 220 230 380 360z" fill="${fg}"/></svg>`)}`

const cover = (mid = '#d4d4d8', fg = '#a1a1aa') => sampleScene('#e4e4e7', mid, fg)

const post = {
  title: 'Install the package and import the theme',
  excerpt: 'Two CSS imports and one @source line. This sample teaser links to the getting started guide.',
  href: '/guides/getting-started',
  image: cover(),
  imageAlt: '',
  category: 'Guide',
  author: 'Author name',
  date: '2024-03-01',
  readTime: 6,
}

const doc: ComponentDoc = {
  name: 'BlogCard',
  group: 'marketing',
  subgroup: 'Blog',
  summary: 'Article teaser card: cover image, category badge, title link, excerpt and author/date/read-time meta.',
  description:
    'Use in blog indexes, "latest posts" strips and related-article lists. Renders a semantic `<article>`; the title is a link stretched over the whole card (the card is one tab stop and one click target), so do not nest other links in it. A valid ISO `date` renders `<time datetime>`; any other string is shown as plain text. `vertical` stacks image over text, `horizontal` places a fixed-width image beside the text from `sm`, `featured` is a large hero card (image 60% from `lg`, bigger title). For several cards use `BlogGrid`.',
  status: 'stable',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Post title; becomes the link text when `href` is set. Must not be empty.' },
    { name: 'excerpt', type: 'string', description: 'Short summary (the default slot overrides it).' },
    { name: 'href', type: 'string', description: 'Post URL. When set the title is a link stretched over the whole card; otherwise the title is plain text.' },
    { name: 'image', type: 'string', description: 'Cover image URL. A missing or broken image leaves a neutral placeholder (or no image block when unset).' },
    { name: 'imageAlt', type: 'string', description: 'Alt text of the cover. Required with `image`; an empty string marks it decorative (the title is adjacent text).' },
    { name: 'category', type: 'string', description: 'Category shown as a Badge.' },
    { name: 'author', type: 'string', description: 'Author name in the meta line.' },
    { name: 'date', type: 'string', description: 'ISO 8601 date (`2024-03-01`, `2024-03-01T10:00:00Z`). Valid: `<time datetime>` with a formatted label. Invalid (`"Last Tuesday"`, `2024-02-31`): shown as plain text in a span, no `datetime`.' },
    { name: 'readTime', type: 'string | number', description: 'A number means minutes (`5` -> "5 min read"; zero, negative and non-finite render nothing); a string is shown as given.' },
    { name: 'variant', type: "'vertical' | 'horizontal' | 'featured'", default: "'vertical'", description: 'Layout; unknown values fall back to `vertical`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gaps, title and text scale. `sm` is compact (16px padding, `text-base` title), `md` is the original, `lg` is roomy (24px padding, `text-xl` title, 16px excerpt). The featured layout scales the same way. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Corners: `rounded` is the original 8px radius, `square` has none (the cover image is clipped to the same shape). Unknown values fall back to `rounded`.' },
    { name: 'appearance', type: "'card' | 'plain' | 'filled'", default: "'card'", description: '`card` is the original bordered surface. `plain` has no fill and a transparent border (the content sits straight on the page; the border appears in forced-colors mode). `filled` uses the secondary surface with secondary-foreground text and no visible border. Unknown values fall back to `card`.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading element level of the title; invalid values fall back to 3.' },
    { name: 'locale', type: 'string', default: "'en-US'", description: 'BCP 47 locale used to format a valid `date` (always in UTC, so server and client agree). Unsupported locales fall back to `en-US`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'image', description: 'Replaces the cover `<img>` (e.g. a responsive `<picture>` or NuxtImg). The image block renders when this slot is used.' },
    { name: 'default', description: 'Replaces the excerpt text.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<div class="max-w-sm"><BlogCard title="Sample post title" excerpt="One or two sentences that summarise the article." href="/guides/getting-started" /></div>`,
    },
    {
      title: 'Vertical variant',
      description: 'Default. Image on top; best in 2-4 column grids.',
      code: `<div class="max-w-sm"><BlogCard variant="vertical" v-bind="post" /></div>`,
      script: `const post = { title: 'Install the package and import the theme', excerpt: '...', href: '/guides/getting-started', image: '/cover.jpg', imageAlt: '', category: 'Guide', author: 'Author name', date: '2024-03-01', readTime: 6 }`,
      state: () => ({ post }),
    },
    {
      title: 'Horizontal variant',
      description: 'Image beside the text from `sm`; good for list-style indexes.',
      code: `<BlogCard variant="horizontal" v-bind="post" />`,
      script: `const post = { ... }`,
      state: () => ({ post }),
    },
    {
      title: 'Featured variant',
      description: 'Large hero card for the latest post.',
      code: `<BlogCard variant="featured" :level="2" v-bind="post" />`,
      script: `const post = { ... }`,
      state: () => ({ post }),
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size`: sm, md (default) and lg side by side.',
      code: `<div class="grid items-start gap-6 md:grid-cols-3">
  <BlogCard v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s" :title="'Size ' + s" excerpt="Sample teaser text for the size gallery." category="Sample" author="Author name" date="2024-03-01" :read-time="3" href="/guides/getting-started" />
</div>`,
    },
    {
      title: 'Shapes',
      description: 'Gallery of `shape`: rounded (default) and square.',
      code: `<div class="grid gap-6 sm:grid-cols-2">
  <BlogCard v-for="s in ['rounded', 'square']" :key="s" :shape="s" :image="cover" image-alt="" :title="'Shape ' + s" excerpt="Sample teaser text for the shape gallery." href="/guides/getting-started" />
</div>`,
      script: `const cover = '/cover.svg'`,
      state: () => ({ cover: post.image }),
    },
    {
      title: 'Appearances',
      description: 'Gallery of `appearance`: card (default), plain and filled. Plain has no box, filled uses the secondary surface.',
      code: `<div class="grid gap-6 md:grid-cols-3">
  <BlogCard v-for="a in ['card', 'plain', 'filled']" :key="a" :appearance="a" :title="'Appearance ' + a" excerpt="Sample teaser text for the appearance gallery." category="Sample" author="Author name" date="2024-03-01" :read-time="3" href="/guides/getting-started" />
</div>`,
    },
    {
      title: 'Combined: square, filled, large, horizontal',
      code: `<BlogCard variant="horizontal" size="lg" shape="square" appearance="filled" v-bind="post" />`,
      script: `const post = { ... }`,
      state: () => ({ post }),
    },
    {
      title: 'Realistic: meta variations and fallbacks',
      description: 'Number vs string read time, an invalid date shown as text, and a card without an image or link.',
      code: `<div class="grid gap-6 sm:grid-cols-3">
  <BlogCard title="Numeric read time" category="Guide" author="Author name" date="2024-05-17T09:30:00Z" :read-time="4" href="/guides/customisation" />
  <BlogCard title="Free-form date" author="Author name" date="Last Tuesday" read-time="a quick read" href="/guides/migration" />
  <BlogCard title="No link, no image" excerpt="Plain card without href." category="Note" />
</div>`,
    },
  ],
  a11y: [
    'Root is an `<article>`; the title is a heading (`level`, default 3: set it to fit the page outline) containing the only link, stretched over the card with a pseudo-element so the whole card is one focus target (well above 24px, and the card is one tab stop).',
    'Keyboard: Tab focuses the title link, Enter follows it. The focus ring surrounds the whole card; in forced-colors mode an outline replaces the ring.',
    'The cover image is decorative by default (`imageAlt=""`); give it alt text only when it carries information.',
    'Valid dates use `<time datetime>`; the visible text is formatted for the `locale`. Separator dots in the meta line are aria-hidden.',
    '`size`, `shape` and `appearance` change padding, corners and surface only; the title link, heading level and focus handling are the same in every combination. `plain` and `filled` keep a transparent 1px border, so the focus ring (and the forced-colors outline) still surrounds the whole card, and the box does not shift between appearances. Text colours use token pairs checked for contrast: foreground on background (plain), card-foreground on card, secondary-foreground on secondary (filled).',
    'Layouts reflow to one column on a 320px screen (`horizontal` and `featured` only go side by side from `sm` / `lg`); long words wrap (`overflow-wrap:anywhere`). Nothing animates on hover.',
  ],
  requires: [
    'Throws a ContractError when `title` is missing or blank.',
    'Throws a ContractError when `image` is set without an `imageAlt` string (and no `image` slot). An empty string marks the cover decorative.',
  ],
  related: ['BlogGrid', 'Badge', 'FeatureCard', 'Testimonial'],
  llmNotes: [
    'The cover image blur when a surrounding `ConfigProvider` sets `blurMedia` (privacy, not decoration); there is no prop on this component.',
    'Pass dates as ISO strings (`2024-03-01`) so `<time datetime>` is emitted.',
    'Do not nest interactive elements in the card: the title link is stretched over it.',
    'Use `vertical` in grids, `horizontal` for list-style indexes, `featured` once at the top of an index.',
    'Set `level` to fit the page outline (default 3 under an h2 section heading).',
    'Use `appearance="plain"` for dense indexes on a page background and `filled` for related-post strips on a card surface; keep `card` for general use. Keep one `size` per list.',
    'Use BlogGrid for several posts instead of hand-building a grid.',
  ],
}
export default doc
