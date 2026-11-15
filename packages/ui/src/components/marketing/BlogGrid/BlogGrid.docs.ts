import type { ComponentDoc } from '../../../docs-types'

/** Flat sample cover as an inline SVG data URI (no network, no gradient). */
const cover = (fill: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="${fill}"/></svg>`)}`

const posts = [
  { title: 'Install the package and import the theme', excerpt: 'Two CSS imports and one @source line.', href: '/guides/getting-started', image: cover('#71717a'), imageAlt: '', category: 'Guide', author: 'Author name', date: '2024-03-01', readTime: 6 },
  { title: 'Customise tokens and accent themes', excerpt: 'Override semantic tokens instead of component classes.', href: '/guides/customisation', image: cover('#52525b'), imageAlt: '', category: 'Guide', author: 'Author name', date: '2024-02-12', readTime: 4 },
  { title: 'Migrate an existing app', excerpt: 'Replace local components one at a time.', href: '/guides/migration', category: 'Guide', author: 'Author name', date: '2024-01-20', readTime: '9 min read' },
  { title: 'Test components with Vitest', excerpt: 'Mount the library parts in jsdom.', href: '/guides/testing', date: '2023-12-05', readTime: 2 },
]

const doc: ComponentDoc = {
  name: 'BlogGrid',
  group: 'marketing',
  subgroup: 'Blog',
  summary: 'Responsive 1-4 column grid of BlogCards from a posts array, with an optional featured first post.',
  description:
    'Use for blog indexes and "latest posts" sections. Pass `items` for the common case, or place your own `BlogCard`s (or any element) in the default slot. One column on mobile, two from `sm`, then `columns` from `lg`. `variant` is forwarded to every card. `layout="featured"` renders the first post as a full-width `featured` card and the remaining posts in the grid with `variant`. An empty `items` array renders an empty container; use the `empty` slot for an "no posts" message.',
  status: 'stable',
  props: [
    { name: 'columns', type: '1 | 2 | 3 | 4', default: '3', description: 'Columns on large screens; invalid values (0, 5, strings) fall back to 3.' },
    { name: 'variant', type: "'vertical' | 'horizontal' | 'featured'", default: "'vertical'", description: 'BlogCard variant forwarded to every generated card; unknown values fall back to `vertical`.' },
    { name: 'layout', type: "'grid' | 'featured'", default: "'grid'", description: '`featured`: first post is a full-width featured card. Unknown values fall back to `grid`.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between cards: `sm` 16px, `md` 24px (the original), `lg` 32px. Unknown values fall back to `md`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'BlogCard `size` forwarded to every generated card (padding and title scale). A post in `items` can carry its own `size`, which wins. Unknown values fall back to `md`. Cards placed in the default slot keep their own props.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'BlogCard `shape` forwarded to every generated card; a post\'s own `shape` wins. Unknown values fall back to `rounded`.' },
    { name: 'appearance', type: "'card' | 'plain' | 'filled'", default: "'card'", description: 'BlogCard `appearance` forwarded to every generated card; a post\'s own `appearance` wins. Unknown values fall back to `card`.' },
    { name: 'items', type: 'BlogGridItem[]', default: '[]', description: 'Posts: `{ title, excerpt?, href?, image?, imageAlt?, category?, author?, date?, readTime?, size?, shape?, appearance? }`. `title` is required and `imageAlt` is required with `image` (empty string for a decorative cover). Non-array values and null entries are ignored.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level used by the generated cards.' },
    { name: 'locale', type: 'string', default: "'en-US'", description: 'Locale forwarded to the cards for date formatting.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Custom cards; replaces `items` rendering (and the list role).' },
    { name: 'empty', description: 'Shown when `items` is empty and there is no default slot.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<BlogGrid :columns="2" :items="[{ title: 'Sample post title', excerpt: 'Short summary of the post.', href: '/guides/getting-started' }, { title: 'Second sample post', href: '/guides/customisation' }]" />`,
    },
    {
      title: 'Vertical cards, three columns',
      description: 'Default variant and columns.',
      code: `<BlogGrid variant="vertical" :columns="3" :items="posts" />`,
      script: `const posts = [{ title: '...', excerpt: '...', href: '/guides/getting-started', image: '/x.jpg', imageAlt: '', category: 'Guide', author: 'Author name', date: '2024-03-01', readTime: 6 }, ...]`,
      state: () => ({ posts }),
    },
    {
      title: 'Horizontal cards, one column',
      description: 'List-style index.',
      code: `<BlogGrid variant="horizontal" :columns="1" :items="posts" />`,
      script: `const posts = [...]`,
      state: () => ({ posts }),
    },
    {
      title: 'Featured layout',
      description: 'First post large and full width, the rest in a three column grid.',
      code: `<BlogGrid layout="featured" :columns="3" :items="posts" :level="2" />`,
      script: `const posts = [...]`,
      state: () => ({ posts }),
    },
    {
      title: 'Gap',
      description: 'Gallery of `gap`: sm, md (default) and lg.',
      code: `<div class="grid gap-10">
  <BlogGrid v-for="g in ['sm', 'md', 'lg']" :key="g" :gap="g" :columns="2" :items="posts.slice(2, 4)" />
</div>`,
      script: `const posts = [...]`,
      state: () => ({ posts }),
    },
    {
      title: 'Size, shape and appearance',
      description: 'Forwarded to the generated cards. The second post sets its own `appearance`, which wins over the grid.',
      code: `<BlogGrid size="sm" shape="square" appearance="plain" :columns="2" :items="mixed" />`,
      script: `const mixed = [{ title: 'Follows the grid', excerpt: 'Square, plain, small.', href: '/guides/getting-started' }, { title: 'Own appearance', excerpt: 'This post asks for filled.', href: '/guides/customisation', appearance: 'filled' }]`,
      state: () => ({
        mixed: [
          { title: 'Follows the grid', excerpt: 'Square, plain, small.', href: '/guides/getting-started' },
          { title: 'Own appearance', excerpt: 'This post asks for filled.', href: '/guides/customisation', appearance: 'filled' },
        ],
      }),
    },
    {
      title: 'Realistic: heading, empty state and slot cards',
      code: `<section class="space-y-8">
  <SectionHeading title="Four guides cover installation, theming, migration and tests" />
  <BlogGrid :items="[]" :columns="2">
    <template #empty><p class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">No posts published yet.</p></template>
  </BlogGrid>
  <BlogGrid :columns="2">
    <BlogCard title="Hand-built card" excerpt="Any BlogCard works in the slot." href="/guides/getting-started" category="Slot" />
    <BlogCard title="Another one" variant="horizontal" date="2024-06-01" />
  </BlogGrid>
</section>`,
    },
  ],
  a11y: [
    'In `items` mode the root is a real `<ul>` and every card sits in an `<li>`; with the default slot or no posts the root is a plain `<div>` (wrap your own cards in `<li>` inside a `<ul>` if you want list semantics).',
    'Cards are `<article>` elements with a single stretched title link; heading levels come from `level` (set it so the titles sit one level below the section heading).',
    '`gap`, `size`, `shape` and `appearance` change spacing and surfaces only; list semantics, headings and links are identical in every combination.',
    'One column at 320px, two from `sm`, `columns` from `lg`; cards have no hover motion.',
  ],
  related: ['BlogCard', 'SectionHeading', 'FeatureGrid', 'TeamGrid'],
  requires: [
    'Throws a ContractError when a post in `items` has no non-empty `title`, or has an `image` without an `imageAlt` string (the message names the first failing index). An empty `imageAlt` marks the cover decorative.',
  ],
  llmNotes: [
    'Use `items` unless cards need custom content.',
    'Use `layout="featured"` when the newest post deserves emphasis; otherwise leave `layout` as `grid`.',
    'Pick `columns` 3 for 3/6/9 posts, 2 for 2/4, 1 with `variant="horizontal"` for list-style indexes.',
    'Provide an `empty` slot so an empty array does not leave a blank section.',
    'Pass dates as ISO strings so cards emit `<time datetime>`.',
    'Pair with SectionHeading above it.',
  ],
}
export default doc
