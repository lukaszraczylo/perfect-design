import type { ComponentDoc } from '../../../docs-types'
import { sampleImage } from '../shared/sample'

const shot = `<div class="flex aspect-video items-center justify-center bg-muted text-muted-foreground">Screenshot placeholder</div>`

const doc: ComponentDoc = {
  name: 'Hero',
  group: 'marketing',
  subgroup: 'Sections',
  summary: 'Page-top hero with 14 layouts, 4 backgrounds, 3 sizes, media frames, stats, logos, a form slot and bento tiles.',
  description: [
    'Use once at the top of a landing, docs or product page. Pick a `variant`, a `size` and optionally a `background`; everything else is slots. The default `variant` is `left`: left-aligned text with a headline that says what the product does. The title is an h1 by default; raise `level` to 2 when the page already has an h1. Unknown `variant`, `size` and `background` values fall back to `left`, `md` and none. Entrance fades use `motion-safe:` so they stop under prefers-reduced-motion.',
    '',
    'Variants and when to use them:',
    '- `left` (default): left-aligned text, optional media below. Docs, product and editorial pages.',
    '- `centered`: short display line, centred. Use only when the headline is a few words; centred long text is hard to read.',
    '- `split`: text on one side, media on the other. Use when one real screenshot carries the argument.',
    '- `split-reverse`: media first on large screens.',
    '- `minimal`: compact heading. Inner pages and changelogs.',
    '- `stacked-media`: large media below the text in a browser frame. For a real dashboard screenshot.',
    '- `announcement`: a bordered notice above the title. Only for real news with a link; leave it out otherwise.',
    '- `with-stats`: stat row below the text (`stats` prop or slot). Only numbers you can source.',
    '- `with-logos`: logo strip below the text. Only logos you have permission to show.',
    '- `with-form`: `form` slot under the subtitle, for example an email field.',
    '- `terminal`: text beside a window frame with command output (`code` prop or media slot).',
    '- `code`: text beside a window frame with source code.',
    '- `full-bleed`: cover `image` behind a solid text panel, so contrast never depends on the picture. Without an image it falls back to the primary colour with `primary-foreground` text.',
    '- `bento`: text plus a grid of tiles in the `bento` slot. Only when tile sizes reflect importance.',
    '',
    'Backgrounds: `none` (default), `grid` and `dots` (aria-hidden SVG patterns, hidden in forced-colors mode) and `image` (cover photo, needs `image`). `gradient`, `glow` and `spotlight` were removed and now render nothing. `decoration` is the old name of `background` and still works.',
    '',
    'Actions: put one primary action in `actions`, labelled with what happens ("Open the catalogue"), not a generic invitation.',
  ].join('\n'),
  status: 'stable',
  props: [
    {
      name: 'variant',
      type: "'left' | 'centered' | 'split' | 'split-reverse' | 'minimal' | 'stacked-media' | 'announcement' | 'with-stats' | 'with-logos' | 'with-form' | 'terminal' | 'code' | 'full-bleed' | 'bento'",
      default: "'left'",
      description: 'Layout. Unknown values fall back to `left`. Slots and props specific to a variant are ignored by the others.',
    },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Vertical padding and type scale. Unknown values fall back to `md`.' },
    { name: 'background', type: "'none' | 'grid' | 'dots' | 'image'", default: "'none'", description: 'Built-in aria-hidden background. `image` renders `image` behind a scrim and puts the text on a solid panel. `gradient`, `glow` and `spotlight` were removed and render nothing.' },
    { name: 'decoration', type: "'none' | 'grid' | 'dots' | 'image'", description: 'Deprecated alias of `background`; `background` wins when both are set.' },
    { name: 'image', type: 'string', description: 'Cover image URL for `background="image"` and `variant="full-bleed"`. Decorative (empty alt).' },
    { name: 'eyebrow', type: 'string', description: 'Plain label above the title. Use only when it adds information the title lacks.' },
    { name: 'title', type: 'string', description: 'Main heading text. A heading is required: `title`, the `title` slot, a heading in the default slot or an `aria-label`.' },
    { name: 'subtitle', type: 'string', description: 'Supporting paragraph.' },
    { name: 'reverse', type: 'boolean', default: 'false', description: 'Split, terminal and code: media before text on large screens.' },
    { name: 'mediaFrame', type: "'browser' | 'window' | 'phone' | 'plain' | 'none'", description: 'MediaFrame chrome around the media slot. Default: `browser` for stacked-media, `window` for terminal/code, else `none`.' },
    { name: 'mediaTitle', type: 'string', description: 'Chrome bar text of the media frame (URL or file name). Also names the code block.' },
    { name: 'code', type: 'string', description: 'Code or terminal text rendered in a focusable, scrollable `pre` when the `media` slot is empty.' },
    { name: 'codeLabel', type: 'string', description: 'Accessible name of the code block. Defaults to `<mediaTitle> code`, then `Code sample`.' },
    { name: 'announcement', type: 'string', description: '`announcement` variant: notice text. Use only for real news.' },
    { name: 'announcementHref', type: 'string', description: '`announcement` variant: makes the notice a link with an arrow.' },
    { name: 'stats', type: '{ value: string | number; label: string }[]', default: '[]', description: '`with-stats` variant: stat list. Malformed entries are skipped.' },
    { name: 'logosLabel', type: 'string', description: '`with-logos` variant: caption above the strip.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '1', description: 'Heading level of the title; invalid falls back to 1.' },
    { name: 'as', type: 'string | Component', default: "'section'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'eyebrow', description: 'Replaces the eyebrow text.' },
    { name: 'title', description: 'Replaces the title text (inline content).' },
    { name: 'subtitle', description: 'Replaces the subtitle text.' },
    { name: 'actions', description: 'Action row. One primary action.' },
    { name: 'media', description: 'Real screenshot or code block. Below the text in non-split variants, beside it in split/terminal/code. Wrapped in a MediaFrame when `mediaFrame` is not `none`. A scrolling `pre` needs `tabindex="0"`, `role="region"` and `aria-label`.' },
    { name: 'announcement', description: '`announcement` variant: replaces the notice text.' },
    { name: 'form', description: '`with-form` variant: form under the subtitle. Give every field a label.' },
    { name: 'stats', description: '`with-stats` variant: replaces the built-in stat list.' },
    { name: 'logos', description: '`with-logos` variant: logo images or text (images are h-8 by default; give each an alt).' },
    { name: 'bento', description: '`bento` variant: tiles placed in a 1/2/3-column grid; use `lg:col-span-*` on tiles.' },
    { name: 'decoration', description: 'Custom background; replaces the built-in `background` pattern.' },
    { name: 'default', description: 'Extra content below the actions.' },
  ],
  examples: [
    {
      title: 'Left aligned (default)',
      description: 'One headline that names the product, one primary action.',
      code: `<Hero :level="3" eyebrow="Component library" title="170 components that share one set of tokens" subtitle="Assemble admin consoles and small product sites without writing custom CSS.">
  <template #actions><Button size="lg">Open the catalogue</Button></template>
</Hero>`,
    },
    {
      title: 'Centered',
      description: 'Only for a short display line.',
      code: `<Hero :level="3" variant="centered" title="Tokens, not custom CSS" subtitle="Colour, radius and type come from one theme file.">
  <template #actions><Button size="lg">Read the theming guide</Button></template>
</Hero>`,
    },
    {
      title: 'Split (media right)',
      description: 'Replace the placeholder with a real screenshot.',
      code: `<Hero :level="3" variant="split" background="grid" title="A table, a form and a dialog in one view" subtitle="Each part is a component with props, slots and tests.">
  <template #actions><Button>Open the catalogue</Button></template>
  <template #media>
    <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">Screenshot placeholder</div>
  </template>
</Hero>`,
    },
    {
      title: 'Split reverse (media left)',
      code: `<Hero :level="3" variant="split-reverse" background="dots" title="Media sits first on large screens" subtitle="On narrow screens the text always comes first.">
  <template #actions><Button>Open the catalogue</Button></template>
  <template #media>
    <div class="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">Screenshot placeholder</div>
  </template>
</Hero>`,
    },
    {
      title: 'Minimal',
      code: `<Hero :level="3" variant="minimal" size="sm" title="Changelog" subtitle="What changed in each release." />`,
    },
    {
      title: 'Stacked media in a browser frame',
      code: `<Hero :level="3" variant="stacked-media" title="See the whole catalogue in one view" subtitle="A large screenshot sits below the copy." media-title="localhost:5173/components">
  <template #actions><Button size="lg">Open the catalogue</Button></template>
  <template #media>${shot}</template>
</Hero>`,
    },
    {
      title: 'Announcement',
      description: 'Only for real news with a link.',
      code: `<Hero :level="3" variant="announcement" announcement="The component catalogue is updated" announcement-href="/components" title="Find a component by group" subtitle="Nine groups, from primitives to marketing sections.">
  <template #actions><Button size="lg">Open the catalogue</Button></template>
</Hero>`,
    },
    {
      title: 'With stats',
      description: 'Numbers that can be reproduced from this repository.',
      code: `<Hero :level="3" variant="with-stats" title="Counted from the repository" subtitle="Run the catalogue generator to reproduce these numbers." :stats="stats">
  <template #actions><Button>Open the catalogue</Button></template>
</Hero>`,
      script: `const stats = [{ value: 170, label: 'Components' }, { value: 9, label: 'Groups' }]`,
      state: () => ({
        stats: [
          { value: 170, label: 'Components' },
          { value: 9, label: 'Groups' },
        ],
      }),
    },
    {
      title: 'With logos',
      description: 'Sample company names, listed as text. Replace them with customers you can name.',
      code: `<Hero :level="3" variant="with-logos" title="A logo row can be plain text" subtitle="Names only, no image files needed." logos-label="Sample logos">
  <template #actions><Button>Read the migration guide</Button></template>
  <template #logos>
    <span class="text-lg font-semibold">Kestrel Freight</span>
    <span class="text-lg font-semibold">Orchard Mill</span>
    <span class="text-lg font-semibold">Tallow and Finch</span>
    <span class="text-lg font-semibold">Brightwater Co</span>
  </template>
</Hero>`,
    },
    {
      title: 'With form',
      code: `<Hero :level="3" variant="with-form" title="Get release notes by email" subtitle="Sample form: it does not send anything.">
  <template #form>
    <form class="flex w-full flex-col gap-2 sm:flex-row" @submit.prevent>
      <Input type="email" autocomplete="email" placeholder="name@example.com" aria-label="Email address" />
      <Button type="submit">Send release notes</Button>
    </form>
  </template>
</Hero>`,
    },
    {
      title: 'Terminal',
      code: `<Hero :level="3" variant="terminal" title="Install from the command line" subtitle="One package, no peer setup." media-title="zsh" :code="install">
  <template #actions><Button>Read the install guide</Button></template>
</Hero>`,
      script: `const install = '$ pnpm add @perfect-design/ui'`,
      state: () => ({ install: '$ pnpm add @perfect-design/ui' }),
    },
    {
      title: 'Code',
      code: `<Hero :level="3" variant="code" reverse title="Import a component by name" subtitle="Source code sits in a window frame beside the text." media-title="main.ts" :code="snippet">
  <template #actions><Button>Read the API docs</Button></template>
</Hero>`,
      script: `const snippet = "import { Button } from '@perfect-design/ui'"`,
      state: () => ({ snippet: "import { Button } from '@perfect-design/ui'" }),
    },
    {
      title: 'Full bleed',
      description: 'The picture is decoration. Text sits on a solid panel, so contrast is the token pair, not the photo.',
      code: `<Hero :level="3" variant="full-bleed" size="lg" :image="cover" title="Text stays readable over any picture" subtitle="The panel uses the background and foreground tokens.">
  <template #actions><Button size="lg">Open the catalogue</Button></template>
</Hero>`,
      script: `const cover = '/images/hero.jpg'`,
      state: () => ({ cover: sampleImage('16/9') }),
    },
    {
      title: 'Bento',
      code: `<Hero :level="3" variant="bento" background="grid" title="Nine groups cover a screen" subtitle="Tile sizes follow importance.">
  <template #actions><Button>Open the catalogue</Button></template>
  <template #bento>
    <div class="rounded-lg border bg-card p-6 lg:col-span-2"><h3 class="font-semibold">Forms</h3><p class="text-sm text-muted-foreground">Fields, validation and wiring.</p></div>
    <div class="rounded-lg border bg-card p-6"><h3 class="font-semibold">Overlays</h3><p class="text-sm text-muted-foreground">Dialogs and menus.</p></div>
    <div class="rounded-lg border bg-card p-6"><h3 class="font-semibold">Data display</h3><p class="text-sm text-muted-foreground">Tables and charts.</p></div>
    <div class="rounded-lg border bg-card p-6 lg:col-span-2"><h3 class="font-semibold">Marketing</h3><p class="text-sm text-muted-foreground">Sections for product pages.</p></div>
  </template>
</Hero>`,
    },
    {
      title: 'Sizes',
      code: `<div class="grid gap-4">
  <Hero :level="3" size="sm" title="Small" class="border" />
  <Hero :level="3" size="md" title="Medium" class="border" />
  <Hero :level="3" size="lg" title="Large" class="border" />
</div>`,
    },
    {
      title: 'Backgrounds',
      description: 'grid and dots; image is shown in Full bleed.',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <Hero :level="3" v-for="bg in ['grid', 'dots']" :key="bg" size="sm" :background="bg" :title="bg" class="border" />
</div>`,
    },
  ],
  requires: [
    'Throws a ContractError when the hero has no heading: set `title` (or the `title` slot), put a heading in the default slot, or set `aria-label` / `aria-labelledby`.',
  ],
  a11y: [
    'The title is an h1 by default. Set `level` so the heading order stays valid; docs examples use 3.',
    'Backgrounds, the cover image and the scrim are aria-hidden and pointer-events-none. The grid and dots patterns are hidden in forced-colors mode.',
    'Full-bleed puts text on a solid `bg-background` panel (or on `bg-primary` with `text-primary-foreground` when there is no image), so contrast is the tested token pair in light and dark, never the picture.',
    'The `code` prop renders a focusable (`tabindex="0"`), labelled (`role="region"`, `aria-label`) scrollable `pre`. A custom `media` slot with scrolling content must do the same.',
    'Stats use a description list (dt label, dd value, `tabular-nums`). The announcement is a real link when `announcementHref` is set, with a visible inset focus outline (2px, `outline-solid`; the code panel uses the same shared `insetFocus` helper).',
    'Entrance fades use `motion-safe:` and stop under prefers-reduced-motion. There is no blinking caret or looping animation. Text wraps (`break-words`) and the layout reflows at 320px; logical properties keep RTL correct.',
  ],
  related: ['MediaFrame', 'SectionHeading', 'CtaBand', 'LogoCloud', 'StatGrid', 'Button'],
  llmNotes: [
    'One Hero per page; its title is the only h1. Pass `level` 2 when the page already has one.',
    'Default is the left-aligned variant. Use `centered` only for a short display line.',
    'Choose the variant by content: split/split-reverse = one real image, stacked-media = real app screenshot, terminal/code = developer tools, with-form = email capture, with-stats/with-logos = only real numbers and logos, announcement = real news with a link, bento = tiles of unequal importance, full-bleed = photo-led page.',
    'Put one primary Button in `actions`, labelled with what happens. Never a generic invitation, and never two generic buttons.',
    'Do not invent stats, logos, customers or quotes. Use real facts or mark the gap with TODO(content).',
    'Use the `background` prop (none, grid, dots, image) instead of custom absolute divs. Gradient, glow and spotlight no longer exist.',
    'Use `mediaFrame`/`mediaTitle` instead of wrapping the media slot in MediaFrame yourself.',
    'Variant-specific props and slots (stats, logos, form, bento, announcement) only render in their own variant.',
    'On full-bleed with an image use default Buttons (text sits on a solid panel); without an image the surface is primary, so use `secondary` Buttons.',
    'Give images an alt that describes them; the cover `image` is decorative by design.',
  ],
  replaces: ['hand-rolled Hero markup in app code'],
}
export default doc
