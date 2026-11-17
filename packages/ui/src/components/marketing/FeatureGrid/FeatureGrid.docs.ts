import { faChartLine, faCircleHalfStroke, faPalette, faPenToSquare, faPuzzlePiece, faUniversalAccess } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless landscape sample (docs only). */
const sampleScene = (bg = '#e4e4e7', mid = '#d4d4d8', fg = '#a1a1aa') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${bg}"/><circle cx="470" cy="110" r="42" fill="${mid}"/><path d="M0 300 170 150 300 260 410 180 640 330V360H0z" fill="${mid}"/><path d="M0 360 220 230 380 360z" fill="${fg}"/></svg>`)}`

const blank = sampleScene()

const items = () => [
  { icon: faPalette, title: 'Tokens', description: 'One theme file sets colour, radius and type.' },
  { icon: faUniversalAccess, title: 'Keyboard support', description: 'Visible focus and documented keys per component.' },
  { icon: faPuzzlePiece, title: 'Composable', description: 'Parts such as CardHeader and CardContent export separately.' },
  { icon: faPenToSquare, title: 'Forms', description: 'Field wraps a control with its label.' },
  { icon: faChartLine, title: 'Charts', description: 'LineChart, BarChart and DonutChart draw from your data.' },
  { icon: faCircleHalfStroke, title: 'Themes', description: 'Accent presets override the same tokens, in light and dark.' },
]

const doc: ComponentDoc = {
  name: 'FeatureGrid',
  group: 'marketing',
  subgroup: 'Features',
  summary: 'Feature section in six layouts (grid, list, alternating, bento, centered, with-heading) built from an items array or slot content.',
  description:
    'Use to show 3-12 product features. Pass `items` for the common case, or place your own `FeatureCard`s (or any element) in the default slot. `layout` chooses the arrangement: `grid` (default, 1 column on mobile, 2 from `sm`, then `columns` from `lg`), `list` (stacked icon-left rows), `alternating` (text next to an image, flipping sides every row), `bento` (tiles of mixed width via `span`), `centered` (centred, unboxed cards) and `with-heading` (a built-in SectionHeading above a grid; any of `eyebrow`/`title`/`description` also adds the heading in other layouts). `variant` is passed to every generated card; without it each layout picks a default (`grid`: card, `list`: icon-left, `alternating`: minimal, `bento`: card, `centered`: minimal). Generated items render as a real `ul` with `li` children. When a heading is present the root is a wrapper and the list is the inner `feature-grid-items`. Content placed in the default slot renders in a plain grid `div` without list semantics, so any element is valid there. Give the feature that matters more extra weight (`span`, `variant: "highlight"`) instead of repeating identical cards.',
  status: 'stable',
  props: [
    { name: 'layout', type: "'grid' | 'list' | 'alternating' | 'bento' | 'centered' | 'with-heading'", default: "'grid'", description: 'Arrangement of the items. Unknown values fall back to `grid`. Exposed as `data-layout`.' },
    { name: 'columns', type: '2 | 3 | 4', default: '3', description: 'Columns on large screens for `grid`, `bento`, `centered` and `with-heading`; invalid falls back to 3. Ignored by `list` and `alternating`.' },
    {
      name: 'items',
      type: 'FeatureItem[]',
      default: '[]',
      description:
        'Cards to render: `{ icon?, title, description?, href?, linkLabel?, external?, span?, image?, imageAlt?, variant? }`. `span` (1-4, clamped to `columns`) is used by `bento`; `image`/`imageAlt` by `alternating`; `variant` overrides the grid variant for that item.',
    },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level for generated cards.' },
    {
      name: 'variant',
      type: "'card' | 'bordered' | 'flat' | 'icon-left' | 'icon-top' | 'icon-badge' | 'minimal' | 'highlight'",
      description: 'FeatureCard variant for generated cards. Omitted = the layout default. Unknown values fall back to `card`. The resolved value is exposed as `data-variant` on the root, also when the cards come from the slot.',
    },
    { name: 'align', type: "'left' | 'center'", default: "'left'", description: 'Alignment of card content and of the built-in heading. `centered` layout always centres.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Spacing between items. `md` keeps each layout\'s own spacing; `sm` tightens and `lg` loosens it. Unknown values fall back to `md`. Exposed as `data-gap`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'FeatureCard `size` for generated cards (padding and type scale). Cards placed in the slot keep their own props. Exposed as `data-size`.' },
    { name: 'tone', type: "'default' | 'muted' | 'primary' | 'inverted'", default: "'default'", description: 'FeatureCard `tone` for generated cards. Exposed as `data-tone`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'FeatureCard `shape` for generated cards. Exposed as `data-shape`.' },
    { name: 'eyebrow', type: 'string', description: 'Built-in SectionHeading eyebrow.' },
    { name: 'title', type: 'string', description: 'Built-in SectionHeading title.' },
    { name: 'description', type: 'string', description: 'Built-in SectionHeading description.' },
    { name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Element level of the built-in heading title (cards use `level`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; lands on the root (the wrapper when a heading is shown).' },
  ],
  slots: [
    { name: 'default', description: 'Custom cards; replaces `items` rendering (in every layout).' },
    { name: 'heading', description: 'Replaces the built-in SectionHeading and forces the heading wrapper.' },
    { name: 'media', description: '`alternating` layout: media for each row instead of `item.image`.', props: '{ item: FeatureItem, index: number }' },
  ],
  examples: [
    {
      title: 'Minimal: from items',
      code: `<FeatureGrid :columns="3" :items="items" />`,
      script: `const items = [{ icon: faPalette, title: 'Tokens', description: 'One theme file.' }, ...]`,
      state: () => ({ items: items().slice(0, 3) }),
    },
    {
      title: 'Slot with links, four columns',
      code: `<FeatureGrid :columns="4">
  <FeatureCard :icon="faCircleHalfStroke" title="Themes" description="Accent presets and dark mode." href="/foundations/themes" link-label="Read about the themes" />
  <FeatureCard :icon="faPalette" title="Tokens" description="One theme file." />
</FeatureGrid>`,
      state: () => ({ faCircleHalfStroke, faPalette }),
    },
    {
      title: 'Layout: grid with two columns and a card variant',
      description: 'Default layout. `variant` is applied to every generated card.',
      code: `<FeatureGrid layout="grid" :columns="2" variant="bordered" :items="items" />`,
      state: () => ({ items: items().slice(0, 4) }),
    },
    {
      title: 'Layout: list',
      description: 'Stacked rows with the icon on the left; ideal for sidebars and narrow columns.',
      code: `<FeatureGrid class="max-w-xl" layout="list" :items="items" />`,
      state: () => ({ items: items().slice(0, 3) }),
    },
    {
      title: 'Layout: alternating',
      description: 'Text and image rows that flip sides. Give each item an `image` and an `imageAlt` that describes it; leave `imageAlt` empty only for decoration. Use real screenshots.',
      code: `<FeatureGrid layout="alternating" :items="rows" />`,
      script: `const rows = [{ title: 'Design', description: '...', image: '/screens/tokens.png', imageAlt: 'Token reference page' }, ...]`,
      state: () => ({
        rows: [
          { icon: faCircleHalfStroke, title: 'Tokens and components', description: 'Tokens, components and docs live in one repository.', image: blank, imageAlt: 'Placeholder for a screenshot of the token reference', href: '/foundations/colors', linkLabel: 'Read about the colour tokens' },
          { icon: faPalette, title: 'Live examples', description: 'Every component page renders its examples live.', image: blank, imageAlt: 'Placeholder for a screenshot of a component page' },
          { icon: faUniversalAccess, title: 'Keyboard support', description: 'Documented per component.' },
        ],
      }),
    },
    {
      title: 'Layout: alternating with the media slot',
      description: 'Render anything as media (video, illustration, live component).',
      code: `<FeatureGrid layout="alternating" :items="items">
  <template #media="{ item, index }"><div class="grid aspect-video place-items-center text-muted-foreground">Media {{ index + 1 }}: {{ item.title }}</div></template>
</FeatureGrid>`,
      state: () => ({ items: items().slice(0, 2) }),
    },
    {
      title: 'Layout: bento',
      description: 'Mixed-width tiles. `span` is the number of columns a tile covers (clamped to `columns`).',
      code: `<FeatureGrid layout="bento" :columns="3" :items="tiles" />`,
      script: `const tiles = [{ title: 'Tokens', description: '...', span: 2 }, { title: 'Keyboard support' }, ...]`,
      state: () => ({
        tiles: [
          { icon: faPalette, title: 'Tokens', description: 'One theme file sets colour, radius and type.', span: 2 },
          { icon: faUniversalAccess, title: 'Keyboard support' },
          { icon: faPuzzlePiece, title: 'Composable' },
          { icon: faChartLine, title: 'Charts', description: 'LineChart, BarChart and DonutChart draw from your data.', span: 2 },
        ],
      }),
    },
    {
      title: 'Layout: centered',
      description: 'Centred icons and text, no box.',
      code: `<FeatureGrid layout="centered" :columns="3" :items="items" />`,
      state: () => ({ items: items().slice(0, 3) }),
    },
    {
      title: 'Layout: with-heading',
      description: 'Built-in SectionHeading via `eyebrow`, `title` and `description`.',
      code: `<FeatureGrid layout="with-heading" title="Six parts of one library, each with its own page" description="Open a card to read how the part works." align="center" variant="flat" :items="items" />`,
      state: () => ({ items: items().slice(0, 3) }),
    },
    {
      title: 'Gap, size, tone and shape',
      description: '`gap` spaces the items; `size`, `tone` and `shape` are passed to every generated card. Left: tight, small, muted. Right: loose, large, square.',
      code: `<div class="grid gap-8">
  <FeatureGrid :columns="2" gap="sm" size="sm" tone="muted" :items="items" />
  <FeatureGrid :columns="2" gap="lg" size="lg" shape="square" :items="items" />
</div>`,
      state: () => ({ items: items().slice(0, 2) }),
    },
    {
      title: 'Custom heading slot',
      code: `<FeatureGrid layout="with-heading" :items="items">
  <template #heading><h2 class="text-2xl font-semibold">What the library ships</h2></template>
</FeatureGrid>`,
      state: () => ({ items: items().slice(0, 3) }),
    },
    {
      title: 'Realistic: six features with a highlighted item',
      code: `<FeatureGrid layout="with-heading" title="Each part works alone and with the others" description="Tokens connect them, so a theme change reaches every part." :columns="3" :items="items" />`,
      state: () => ({ items: items().map((item, i) => (i === 0 ? { ...item, variant: 'highlight' } : item)) }),
    },
  ],
  a11y: [
    'Generated items are a native `ul` with `li` children (cards, or rows in `alternating`), so axe `aria-required-children` and `aria-allowed-role` pass. Slot content is a plain grid `div` with no list role; wrap items in your own list element if you need list semantics.',
    'Alternating images need a meaningful `imageAlt`; an empty alt marks the image decorative. Text comes first in DOM order, so reading order does not change when rows flip.',
    'Layout is 1 column on phones, 2 from `sm` and `columns` from `lg`, so it reflows at 320px. Cards use `min-w-0` and logical alignment for RTL. Heading levels are configurable: `headingLevel` for the section heading and `level` for the cards.',
  ],
  requires: [
    'Throws a ContractError when an entry of `items` has no non-empty `title` (the message names the first failing index).',
    'Throws a ContractError when, in the `alternating` layout, an entry of `items` has an `image` but no `imageAlt` string and there is no `media` slot. An empty string marks the image decorative.',
  ],
  related: ['FeatureCard', 'SectionHeading', 'NumberedSteps'],
  llmNotes: [
    'Use `items` unless cards need custom content.',
    'Give the feature that matters more extra room with `span` or `variant: "highlight"` instead of repeating identical cards, or use the `list` layout.',
    'Give `alternating` images an `imageAlt` that describes the real screenshot.',
    'Pick `columns` 3 for 3/6/9 items, 4 for 4/8, 2 for 2/4.',
    'Use `layout="with-heading"` (or just set `title`) instead of stacking SectionHeading + FeatureGrid by hand.',
    'Choose `grid` for 3-12 equal features, `list` for narrow columns, `alternating` for 2-4 features that deserve a screenshot each, `bento` for one or two hero features among small ones (give those `span: 2`), `centered` for short icon+title+text rows.',
    'Pass `variant` on the grid, not on each item, unless one item must stand out (`variant: "highlight"`).',
    'Do not set `span`/`image` outside `bento`/`alternating`; they are ignored.',
  ],
  replaces: ['hand-rolled FeatureGrid markup in app code'],
}
export default doc
