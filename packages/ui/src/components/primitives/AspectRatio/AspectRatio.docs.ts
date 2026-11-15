import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'AspectRatio',
  group: 'primitives',
  subgroup: 'Layout helpers',
  summary: 'Keeps its content at a fixed width-to-height ratio (images, video, maps, placeholders).',
  description:
    'Use `AspectRatio` to reserve space for media before it loads and to crop it consistently. The outer wrapper is `width: 100%` and takes its height from `ratio`; your content fills it absolutely. Size it by placing it in a width-constrained container. `class` and attributes go on the inner content element, so `overflow-hidden rounded-lg` clips the media. Where the native `aspect-ratio` CSS fits (a plain box), a Tailwind `aspect-video` class is simpler.\n\n' +
    '**Rounded** (`rounded`): `none` (default), `md`, `lg` or `full`. A non-`none` value also sets `overflow-hidden`, so media is clipped to the corners; `full` with `:ratio="1"` is a circle. **Variant** (`variant`): `plain` (default), `bordered` (1px border) and `muted` (muted background with muted text, for placeholders and empty media; it keeps a border in forced-colors mode, where backgrounds are replaced). **Fit** (`fit`): `none` (default, nothing is applied), `cover` (crop to fill), `contain` (letterbox) and `fill` (stretch) for a direct `img` or `video` child. Unknown values fall back to the defaults. `aspectRatioVariants` returns the same classes for a plain element.',
  status: 'stable',
  props: [
    { name: 'ratio', type: 'number', default: '16 / 9', description: 'Width divided by height (`1`, `4 / 3`, `16 / 9`). Non-finite or <= 0 falls back to 16 / 9.' },
    { name: 'rounded', type: "'none' | 'md' | 'lg' | 'full'", default: "'none'", description: 'Corner radius of the content element; any value other than none also clips the content (overflow-hidden). Unknown values fall back to none.' },
    { name: 'variant', type: "'plain' | 'bordered' | 'muted'", default: "'plain'", description: 'Surface: plain adds nothing, bordered adds a 1px border, muted adds a muted background (with a forced-colors border). Unknown values fall back to plain.' },
    { name: 'fit', type: "'none' | 'cover' | 'contain' | 'fill'", default: "'none'", description: 'Sizing of a direct img or video child: cover crops, contain letterboxes, fill stretches. none leaves the child alone. Unknown values fall back to none.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Content element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the content element (not the sizing wrapper).' },
  ],
  slots: [{ name: 'default', description: 'Content that fills the ratio box.' }],
  examples: [
    {
      title: 'Default 16:9',
      code: `<div class="w-full max-w-80">
  <AspectRatio class="flex items-center justify-center overflow-hidden rounded-lg bg-muted text-sm text-muted-foreground">16 / 9</AspectRatio>
</div>`,
    },
    {
      title: 'Square and 4:3 with overlay',
      code: `<div class="flex flex-wrap items-start gap-4">
  <div class="w-32">
    <AspectRatio :ratio="1" class="flex items-center justify-center rounded-md bg-accent text-accent-foreground">1 / 1</AspectRatio>
  </div>
  <div class="w-48">
    <AspectRatio :ratio="4 / 3" class="relative overflow-hidden rounded-md bg-muted">
      <Badge class="absolute start-2 top-2">4 / 3</Badge>
    </AspectRatio>
  </div>
</div>`,
    },
    {
      title: 'Rounded',
      description: 'none, md, lg and full. full with a square ratio is a circle.',
      code: `<div class="flex flex-wrap items-start gap-4">
  <div class="w-28"><AspectRatio :ratio="1" rounded="none" variant="muted" class="flex items-center justify-center text-sm">none</AspectRatio></div>
  <div class="w-28"><AspectRatio :ratio="1" rounded="md" variant="muted" class="flex items-center justify-center text-sm">md</AspectRatio></div>
  <div class="w-28"><AspectRatio :ratio="1" rounded="lg" variant="muted" class="flex items-center justify-center text-sm">lg</AspectRatio></div>
  <div class="w-28"><AspectRatio :ratio="1" rounded="full" variant="muted" class="flex items-center justify-center text-sm">full</AspectRatio></div>
</div>`,
    },
    {
      title: 'Variants',
      description: 'plain, bordered and muted placeholder surfaces.',
      code: `<div class="flex flex-wrap items-start gap-4">
  <div class="w-40"><AspectRatio variant="plain" rounded="md" class="flex items-center justify-center text-sm">plain</AspectRatio></div>
  <div class="w-40"><AspectRatio variant="bordered" rounded="md" class="flex items-center justify-center text-sm">bordered</AspectRatio></div>
  <div class="w-40"><AspectRatio variant="muted" rounded="md" class="flex items-center justify-center text-sm">muted</AspectRatio></div>
</div>`,
    },
    {
      title: 'Fit',
      description: 'cover crops, contain letterboxes and fill stretches a sample image drawn as inline SVG.',
      code: `<div class="flex flex-wrap items-start gap-4">
  <div class="w-40">
    <AspectRatio :ratio="1" variant="bordered" rounded="md" fit="cover">
      <img alt="Sample image, cover" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Crect width='40' height='20' fill='%23888'/%3E%3Ccircle cx='20' cy='10' r='8' fill='%23ddd'/%3E%3C/svg%3E" />
    </AspectRatio>
  </div>
  <div class="w-40">
    <AspectRatio :ratio="1" variant="bordered" rounded="md" fit="contain">
      <img alt="Sample image, contain" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Crect width='40' height='20' fill='%23888'/%3E%3Ccircle cx='20' cy='10' r='8' fill='%23ddd'/%3E%3C/svg%3E" />
    </AspectRatio>
  </div>
  <div class="w-40">
    <AspectRatio :ratio="1" variant="bordered" rounded="md" fit="fill">
      <img alt="Sample image, fill" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'%3E%3Crect width='40' height='20' fill='%23888'/%3E%3Ccircle cx='20' cy='10' r='8' fill='%23ddd'/%3E%3C/svg%3E" />
    </AspectRatio>
  </div>
</div>`,
    },
  ],
  a11y: ['Purely presentational: give embedded images alt text and give media containers a role/aria-label when they convey content.', '`rounded`, `variant` and `fit` change the look only: they add no role or name, so an informative image keeps its own `alt`. The `muted` surface uses the muted foreground on the muted background (4.5:1 in every theme) and a border in forced-colors mode. `fit` sets sizing on direct `img` and `video` children only.', 'It reserves space with the intrinsic ratio, so there is no layout shift while media loads, and it scales with its container at any zoom level or width.'],
  related: ['Skeleton', 'Card'],
  llmNotes: [
    'Constrain the width with a parent (`w-full max-w-80`, grid column); AspectRatio itself is 100% wide.',
    'Pass `:ratio="16 / 9"` as a number expression, not a string.',
    'Use `rounded` (it also clips) and `fit="cover"` instead of `overflow-hidden rounded-* ` plus `object-cover` classes.',
    'Use `variant="muted"` for placeholders and `variant="bordered"` for media on a page background; keep `plain` when a card already draws the border.',
  ],
  replaces: ['shadcn-vue AspectRatio', 'padding-bottom percentage hacks'],
}
export default doc
