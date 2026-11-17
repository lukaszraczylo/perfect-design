import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Skeleton',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Placeholder block shown while content loads: text, circle, avatar, pill, rounded, rect and paragraph shapes with a pulse or no animation.',
  description:
    'Use `Skeleton` to reserve layout space while data loads. Size it with classes (`h-4 w-40`, `size-12`) and compose several to mimic the final layout. Unknown `shape` / `animation` values fall back to `rect` / `pulse`. Do not use it for in-progress actions (use `Spinner`).\n\n' +
    '**Shapes**: `text` (one text line, h-4), `circle` and `avatar` (round size-10; `avatar` never shrinks in flex rows), `rect` (default block), `rounded` (block with large radius for cards and images), `pill` (h-6 w-24 for badges, chips and buttons) and `lines` (a paragraph of `lines` text lines, the last one shorter).\n\n' +
    '**Presets**: `SkeletonText` (paragraph), `SkeletonAvatar` (sm to xl, circle or square), `SkeletonCard` (media + title + lines) and `SkeletonTable` (rows x columns) are ready-made compositions of `Skeleton`, so apps do not hand-build them. They are compound parts rather than a `preset` prop because each has its own props (`rows`, `columns`, `size`) that would not apply to the other shapes. Each part is `aria-hidden`; announce the loading state once from the caller (a region with `aria-busy="true"`, or `LoadingState`).\n\n**Animation**: `pulse` (default), `shimmer` (deprecated alias: it pulses, because a moving highlight needs a gradient) or `none` (static placeholder, e.g. dense tables or when many skeletons would be noisy). The pulse stops under prefers-reduced-motion. The older boolean `shimmer` still works and is ignored when `animation` is set.',
  status: 'stable',
  parts: [
    {
      name: 'SkeletonText',
      description: 'A paragraph placeholder: `lines` text lines, the last one shorter. Same output as `Skeleton shape="lines"` with the part slot name.',
      props: [
        { name: 'lines', type: 'number', default: '3', description: 'Line count (floored, 1..20; invalid values give 3).' },
        { name: 'animation', type: "'none' | 'pulse' | 'shimmer'", default: "'pulse'", description: 'Same as Skeleton.' },
        { name: 'as', type: 'string | Component', default: "'div'", description: 'Wrapper element.' },
      ],
    },
    {
      name: 'SkeletonAvatar',
      description: 'A round or square avatar placeholder that never shrinks in a flex row.',
      props: [
        { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: '32px, 40px, 48px, 64px. Unknown values fall back to md.' },
        { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'square is rounded-md, for logos and app icons.' },
        { name: 'animation', type: "'none' | 'pulse' | 'shimmer'", default: "'pulse'", description: 'Same as Skeleton.' },
      ],
    },
    {
      name: 'SkeletonCard',
      description: 'A card placeholder: optional media block, a title line and body lines, inside a bordered card.',
      props: [
        { name: 'media', type: 'boolean', default: 'true', description: 'Show the media block above the text.' },
        { name: 'lines', type: 'number', default: '3', description: 'Body lines (0..20); 0 or invalid values drop the body.' },
        { name: 'animation', type: "'none' | 'pulse' | 'shimmer'", default: "'pulse'", description: 'Same as Skeleton.' },
      ],
    },
    {
      name: 'SkeletonTable',
      description: 'A table placeholder: an optional header row and `rows` rows of `columns` cells on a grid.',
      props: [
        { name: 'rows', type: 'number', default: '5', description: 'Body rows (floored, 1..50; invalid values give 5).' },
        { name: 'columns', type: 'number', default: '4', description: 'Columns (floored, 1..12; invalid values give 4).' },
        { name: 'header', type: 'boolean', default: 'true', description: 'Render a header row.' },
        { name: 'animation', type: "'none' | 'pulse' | 'shimmer'", default: "'pulse'", description: 'Same as Skeleton.' },
      ],
    },
  ],
  props: [
    { name: 'shape', type: "'text' | 'circle' | 'rect' | 'rounded' | 'pill' | 'avatar' | 'lines'", default: "'rect'", description: 'text = h-4 full-width line, circle/avatar = size-10 round, rect = h-20 block, rounded = h-20 block with rounded-xl, pill = h-6 w-24 fully rounded, lines = paragraph wrapper. Unknown values fall back to rect.' },
    { name: 'animation', type: "'none' | 'pulse' | 'shimmer'", default: "'pulse'", description: 'Loading animation. Unknown values fall back to pulse (or shimmer when `shimmer` is set).' },
    { name: 'shimmer', type: 'boolean', default: 'false', description: 'Shortcut for animation="shimmer". Ignored when `animation` is set.' },
    { name: 'lines', type: 'number', default: '3', description: 'Line count for shape="lines" (floored, 1..20; invalid values give 3). The last line is w-3/4 when there are 2 or more.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render (the wrapper, for shape="lines"; its lines are divs).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; use it to set the size. For shape="lines" it applies to the wrapper (e.g. max-w-sm, gap-3).' },
  ],
  examples: [
    {
      title: 'Card placeholder',
      code: `<div class="flex items-center gap-3">
  <Skeleton shape="circle" class="size-12" />
  <div class="flex-1 space-y-2">
    <Skeleton shape="text" class="w-1/2" />
    <Skeleton shape="text" class="w-3/4" />
  </div>
</div>`,
    },
    {
      title: 'Shapes',
      description: 'text, circle, avatar, rect, rounded and pill.',
      code: `<div class="flex max-w-md flex-wrap items-center gap-4">
  <Skeleton shape="text" class="w-32" />
  <Skeleton shape="circle" />
  <Skeleton shape="avatar" />
  <Skeleton shape="rect" class="h-10 w-24" />
  <Skeleton shape="rounded" class="h-10 w-24" />
  <Skeleton shape="pill" />
</div>`,
    },
    {
      title: 'Paragraph (lines)',
      description: 'A block of text lines; the last line is shorter.',
      code: `<div class="max-w-sm space-y-4">
  <Skeleton shape="lines" />
  <Skeleton shape="lines" :lines="5" />
</div>`,
    },
    {
      title: 'Animations',
      description: 'pulse (default) and none; shimmer is a deprecated alias of pulse.',
      code: `<div class="max-w-sm space-y-2">
  <Skeleton animation="pulse" shape="text" />
    <Skeleton animation="none" shape="text" />
</div>`,
    },
    {
      title: 'Loading card',
      description: 'Compose avatar, pill, rounded image and a paragraph into a loading card. `aria-busy` on the container tells assistive tech the region is loading.',
      code: `<div class="max-w-sm space-y-3" aria-busy="true">
  <Skeleton shape="rounded" class="h-40" />
  <div class="flex items-center gap-3">
    <Skeleton shape="avatar" />
    <Skeleton shape="text" class="w-1/3" />
    <Skeleton shape="pill" class="ms-auto" />
  </div>
  <Skeleton shape="lines" :lines="3" />
</div>`,
    },
    {
      title: 'SkeletonText',
      description: 'Paragraph placeholder; the last line is shorter.',
      code: `<div class="max-w-sm space-y-4" aria-busy="true">
  <SkeletonText />
  <SkeletonText :lines="5" />
  <SkeletonText :lines="2" animation="none" />
</div>`,
    },
    {
      title: 'SkeletonAvatar',
      description: 'Sizes and shapes.',
      code: `<div class="flex items-center gap-3" aria-busy="true">
  <SkeletonAvatar size="sm" />
  <SkeletonAvatar />
  <SkeletonAvatar size="lg" />
  <SkeletonAvatar size="xl" shape="square" />
</div>`,
    },
    {
      title: 'SkeletonCard',
      description: 'With and without the media block.',
      code: `<div class="grid max-w-2xl gap-4 sm:grid-cols-2" aria-busy="true">
  <SkeletonCard />
  <SkeletonCard :media="false" :lines="2" />
</div>`,
    },
    {
      title: 'SkeletonTable',
      description: 'Rows and columns, with and without a header.',
      code: `<div class="max-w-xl space-y-6" aria-busy="true">
  <SkeletonTable :rows="3" :columns="3" />
  <SkeletonTable :rows="2" :columns="5" :header="false" animation="none" />
</div>`,
    },
  ],
  a11y: ['aria-hidden="true": the placeholder is invisible to assistive tech, so many skeletons never produce noise. Announce the loading state once on the container with `aria-busy="true"` or a single visually hidden `role="status"` message, and swap both when the data arrives.', 'The pulse is disabled with `motion-reduce:animate-none`; the muted fill stays visible, so the placeholder is still perceivable without motion.', 'Skeletons are flat `bg-muted` blocks with no border: in forced-colors mode add a `border` class on large placeholders if they must stay visible.', 'Size them with `w-full`, `max-w-*` or percentage widths so they reflow at 320px.'],
  related: ['Spinner', 'Avatar', 'Progress', 'LoadingState'],
  llmNotes: [
    'Mirror the final layout dimensions to avoid layout shift.',
    'Put aria-busy on the loading region; the skeleton itself is aria-hidden.',
    'Do not hard-code colours; the component uses `bg-muted`.',
    'Use shape="lines" for paragraphs instead of stacking text skeletons; set class on the wrapper.',
    'Use SkeletonText, SkeletonAvatar, SkeletonCard and SkeletonTable for common shapes instead of hand-building them.',
    'Use animation="none" for static placeholders; do not use the deprecated `shimmer` flag.',
  ],
  replaces: ['shadcn-vue Skeleton', 'ad-hoc animate-pulse divs', 'vue-content-loader style placeholders'],
}
export default doc
