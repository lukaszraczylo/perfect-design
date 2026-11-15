import type { ComponentDoc } from '../../../docs-types'

/** Real source projects of this library (see DESIGN.md), listed as text: no invented customers or logos. */
const logos = [{ name: 'Kestrel Freight' }, { name: 'Orchard Mill' }, { name: 'Tallow and Finch' }, { name: 'Brightwater Co' }, { name: 'Quarry Row' }, { name: 'Halden Optics' }]

const doc: ComponentDoc = {
  name: 'LogoCloud',
  group: 'marketing',
  subgroup: 'Social proof',
  summary: 'Logos (or names) as a grid, inline row, marquee, split, centered or card strip, in grayscale, muted or colour, with optional bordered tiles.',
  description:
    'Use for strips of customers, partners or source projects, only with real, permitted names. Each entry has a `name` (alt text and text fallback), optional `src` image and optional `href`. Broken images fall back to the name. Layouts: `grid` (default), `inline` (centred wrapping row, best for 3-6 logos), `marquee` (continuous scroll using `Marquee`, for 10+ logos; logos are not links there), `with-title` (small caption on the left, logos in a grid on the right from `lg`), `split` (headline-size title on the left third, wrapping logos on the rest, from `lg`), `centered` (headline-size centred title above a centred wrapping row) and `card` (title and grid inside a bordered panel). `tone` picks grayscale-until-hover, always-muted or full colour (only the image is dimmed, text names keep full contrast); `size` sets logo height; `shape` draws each logo in a bordered tile (`rounded`, `square`, `pill`); `gap` sets the spacing between logos.',
  status: 'stable',
  props: [
    { name: 'logos', type: 'LogoItem[]', default: '[]', description: '`{ name: string, src?: string, href?: string }`. `name` is always required, even with `src` (it is the alt text). `href` is ignored by the `marquee` layout.' },
    { name: 'title', type: 'string', description: 'Caption: above the logos, or beside them in `with-title`. In `marquee` it also labels the scrolling group for assistive tech.' },
    {
      name: 'layout',
      type: "'grid' | 'inline' | 'marquee' | 'with-title' | 'split' | 'centered' | 'card'",
      default: "'grid'",
      description: 'Arrangement. `split` and `centered` use a headline-size title; `grid`, `inline`, `with-title` (smaller) and `card` use the caption size. `grid`, `with-title` and `card` use `columns`; `split` and `centered` wrap like `inline`. Unknown values fall back to `grid`. Reflected as `data-layout`.',
    },
    {
      name: 'tone',
      type: "'grayscale' | 'color' | 'muted'",
      description: '`grayscale` dims images until hover/focus; `color` shows them as is; `muted` keeps them dimmed and gives no hover or focus reveal. Only the image is dimmed, never the text. When unset, the `grayscale` prop decides. Invalid values are ignored.',
    },
    { name: 'shape', type: "'plain' | 'rounded' | 'square' | 'pill'", default: "'plain'", description: 'Logo tile. `plain` is the original borderless logo; `rounded`, `square` and `pill` draw a bordered tile on the card surface. Unknown values fall back to `plain`. Reflected as `data-shape`.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between logos (grid: 1rem/2rem/3rem columns, 1rem/1.5rem/2rem rows; row layouts: 1.5rem/2.5rem/4rem columns). In `marquee` `sm` uses the medium strip gap and `md` and `lg` the large one. Unknown values fall back to `md`. Reflected as `data-gap`.' },
    { name: 'grayscale', type: 'boolean', default: 'true', description: 'Backwards-compatible switch for grayscale-until-hover. Only used when `tone` is not set.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Logo height: 2rem, 3rem, 4rem. Invalid values fall back to `md`.' },
    { name: 'columns', type: '3 | 4 | 5 | 6', default: '5', description: 'Columns from `md` up in `grid` and `with-title`; invalid falls back to 5. Always 2 on mobile, 3 on `sm`. Ignored by `inline` and `marquee`.' },
    { name: 'duration', type: 'number', description: '`marquee` only: seconds for one loop. Unset uses the Marquee default (30); invalid values also fall back to it.' },
    { name: 'direction', type: "'left' | 'right'", description: '`marquee` only: scroll direction (Marquee default `left`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  examples: [
    { title: 'Minimal (names only)', code: `<LogoCloud title="Sample logos" :columns="4" :logos="[{ name: 'Kestrel Freight' }, { name: 'Orchard Mill' }, { name: 'Tallow and Finch' }, { name: 'Brightwater Co' }]" />` },
    {
      title: 'Realistic: links, colour, large',
      code: `<LogoCloud tone="color" size="lg" :columns="3" :logos="[{ name: 'Migration guide', href: '/guides/migration' }, { name: 'Customisation guide', href: '/guides/customisation' }, { name: 'Testing guide' }]" />`,
    },
    { title: 'Layout grid', code: `<LogoCloud layout="grid" title="Sample logos" :columns="3" :logos="logos" />`, script: `const logos = [{ name: 'Kestrel Freight' }, ...]`, state: () => ({ logos }) },
    { title: 'Layout inline', code: `<LogoCloud layout="inline" size="sm" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout marquee', code: `<LogoCloud layout="marquee" title="Sample logos" :duration="40" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout marquee, reversed', code: `<LogoCloud layout="marquee" direction="right" tone="color" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout split', description: 'Headline-size title on the left third, wrapping logos on the rest, from `lg`. Stacks on narrow screens.', code: `<LogoCloud layout="split" title="Extracted from these projects" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout centered', description: 'Headline-size centred title above a centred wrapping row.', code: `<LogoCloud layout="centered" title="Extracted from these projects" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout card', description: 'Title and logo grid inside a bordered panel on the card surface.', code: `<LogoCloud layout="card" title="Extracted from these projects" :columns="3" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Layout with-title', code: `<LogoCloud layout="with-title" title="Extracted from these projects" :columns="3" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Tone grayscale (hover to colour)', code: `<LogoCloud tone="grayscale" layout="inline" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Tone muted', description: 'Images stay dimmed with no hover reveal. Text names are not dimmed.', code: `<LogoCloud tone="muted" layout="inline" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Tone color', code: `<LogoCloud tone="color" layout="inline" :logos="logos" />`, script: `const logos = [...]`, state: () => ({ logos }) },
    { title: 'Size sm / md / lg', code: `<div class="flex flex-col gap-6"><LogoCloud size="sm" layout="inline" :logos="logos.slice(0, 3)" /><LogoCloud size="md" layout="inline" :logos="logos.slice(0, 3)" /><LogoCloud size="lg" layout="inline" :logos="logos.slice(0, 3)" /></div>`, script: `const logos = [...]`, state: () => ({ logos }) },
    {
      title: 'Shape gallery: plain, rounded, square, pill',
      description: 'Logo tiles. `plain` has no border; the others draw a border on the card surface. Linked tiles keep the focus ring.',
      code: `<div class="flex flex-col gap-6">
  <LogoCloud shape="plain" layout="inline" size="sm" :logos="logos.slice(0, 3)" />
  <LogoCloud shape="rounded" layout="inline" size="sm" :logos="logos.slice(0, 3)" />
  <LogoCloud shape="square" layout="inline" size="sm" :logos="logos.slice(0, 3)" />
  <LogoCloud shape="pill" layout="inline" size="sm" :logos="logos.slice(0, 3)" />
</div>`,
      script: `const logos = [...]`,
      state: () => ({ logos }),
    },
    {
      title: 'Gap gallery: sm, md, lg',
      description: 'Spacing between logos in a grid. The same values apply to the row layouts and the marquee.',
      code: `<div class="flex flex-col gap-8">
  <LogoCloud gap="sm" shape="rounded" :columns="3" :logos="logos" />
  <LogoCloud gap="md" shape="rounded" :columns="3" :logos="logos" />
  <LogoCloud gap="lg" shape="rounded" :columns="3" :logos="logos" />
</div>`,
      script: `const logos = [...]`,
      state: () => ({ logos }),
    },
  ],
  a11y: [
    'grid, inline, with-title, split, centered and card render a native list; images use the name as alt (the text fallback is the name itself); linked logos are focusable with the shared focus ring and reveal colour on focus.',
    'Contrast: only the image is dimmed in the grayscale tone. The text fallback is never faded (no opacity on text), so names keep the 4.5:1 ratio in light and dark mode.',
    'marquee: the group is labelled by `title`; the duplicated copy is aria-hidden; logos there are not focusable links. It inherits Marquee\'s pause button (Tab, Enter/Space) and stops moving under prefers-reduced-motion.',
    '`shape` tiles have a border, so they stay visible in forced-colors mode; the muted tone dims only the image, and text names keep the muted-foreground on card contrast pair. `card` is a plain bordered container, not a landmark. `split` and `centered` wrap instead of using columns.',
    'Reflow: two columns at 320px, three from `sm`, then `columns` from `md`; names wrap instead of overflowing.',
  ],
  requires: [
    'Throws a ContractError when an entry of `logos` has no non-empty `name`, even if it has a `src`. The message names the first failing index.',
  ],
  related: ['Marquee', 'Testimonial', 'TestimonialGrid'],
  llmNotes: [
    'Always give `name`, even when `src` is set (alt text).',
    'Prefer SVG logos in the same visual height. Only list names you may show.',
    'Use `layout="marquee"` for more than ~10 logos; use `inline` for a short hero strip; use `with-title` when the headline should sit beside the logos.',
    'Use `layout="split"` or `"centered"` when the title is a real claim, `"card"` to set the strip apart, `shape` only when the logos need a tile, and `tone="muted"` for logos that are not links.',
    'Use `tone="color"` on brand-coloured sections and `grayscale` on neutral ones; never pass both `tone` and `grayscale`.',
    'Do not rely on `href` in the marquee layout.',
  ],
  replaces: ['hand-rolled LogoCloud markup in app code'],
}
export default doc
