import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless sample scene sized to the tile ratio, so masonry keeps its mixed heights and nothing clips under `object-cover`. */
const sample = (n: number, w = 4, h = 3) => {
  const [W, H] = [w * 160, h * 160]
  const [bg, mid, fg] = [['#e4e4e7', '#d4d4d8', '#a1a1aa'], ['#e7e5e4', '#d6d3d1', '#a8a29e'], ['#e4e4e7', '#cfcfd4', '#8b8b94']][n % 3]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${bg}"/><circle cx="${W * 0.72}" cy="${H * 0.3}" r="${Math.min(W, H) * 0.12}" fill="${mid}"/><path d="M0 ${H * 0.83} ${W * 0.27} ${H * 0.42} ${W * 0.47} ${H * 0.72} ${W * 0.64} ${H * 0.5} ${W} ${H * 0.92}V${H}H0z" fill="${mid}"/><path d="M0 ${H} ${W * 0.34} ${H * 0.64} ${W * 0.6} ${H}z" fill="${fg}"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const shapes: [number, number][] = [[4, 3], [3, 4], [4, 3], [1, 1], [4, 3]]
const gallery = () =>
  shapes.map(([w, h], i) => ({ src: sample(i, w, h), alt: `Sample image ${i + 1}`, ...(i === 1 ? { caption: 'Caption shown in the viewer' } : {}) }))

const doc: ComponentDoc = {
  name: 'ImageGrid',
  group: 'marketing',
  subgroup: 'Media',
  summary: 'Image gallery as a uniform grid, masonry or featured layout that opens a Lightbox on click.',
  description:
    'Use for galleries and screenshot collections. `variant` selects the layout: `grid` (uniform tiles, default), `masonry` (CSS columns with natural image heights, so mixed portrait/landscape photos pack tightly) and `featured` (the first image spans 2x2 beside smaller tiles). `gap` sets the spacing, `aspect` the tile ratio (`ratio` still works as a legacy alias) and `shape` the tile corners. Each thumbnail is a button labelled "View image: <alt>" that opens the built-in `Lightbox` at that image (state is internal; listen to `open` if you need to know). Set `lightbox=false` for a static grid. Broken thumbnails fall back to their alt text.',
  status: 'stable',
  props: [
    { name: 'images', type: 'GridImage[]', default: '[]', description: '`{ src, alt, caption?, thumb? }`. `alt` is required (an empty string marks the image decorative; with `lightbox` a `caption` also counts). `thumb` is a smaller image for the grid.' },
    { name: 'variant', type: "'grid' | 'masonry' | 'featured'", default: "'grid'", description: 'Layout. Unknown values fall back to `grid`. Reflected as `data-variant`.' },
    { name: 'columns', type: '2 | 3 | 4', default: '3', description: 'Columns from `sm` upward; invalid falls back to 3. Always 2 on mobile.' },
    { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between tiles (0 / 0.375rem / 0.75rem / 1.5rem); invalid falls back to `md`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Tile corners: `rounded-lg` or none. Unknown values fall back to `rounded`. Reflected as `data-shape`. There is no circle: tiles are photos with their own aspect ratio, and a circle would crop them into ovals (use `Avatar` for round images).' },
    { name: 'aspect', type: "'square' | 'video' | 'portrait' | 'landscape' | 'auto'", description: 'Tile shape (1:1, 16:9, 3:4, 4:3, natural height). Wins over `ratio`; invalid values are ignored. Default `square`, or `auto` for masonry.' },
    { name: 'ratio', type: "'square' | 'video' | 'auto'", description: 'Legacy alias of `aspect` kept for compatibility; used when `aspect` is not set. Default `square` (`auto` for masonry).' },
    { name: 'lightbox', type: 'boolean', default: 'true', description: 'Open a Lightbox on click.' },
    { name: 'viewLabel', type: 'string', default: "'View image'", description: 'Prefix of each button\'s accessible name (localise here).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  emits: [{ name: 'open', payload: '[index: number]', description: 'A thumbnail was activated.' }],
  examples: [
    {
      title: 'Basic: gallery with lightbox',
      code: `<ImageGrid :images="images" :columns="3" />`,
      script: `const images = [{ src: '/a.jpg', alt: 'Describe what the photo shows' }, ...]`,
      state: () => ({ images: gallery().slice(0, 3) }),
    },
    {
      title: 'Static 16:9 grid',
      code: `<ImageGrid :lightbox="false" aspect="video" :columns="2" :images="images" />`,
      state: () => ({ images: [{ src: sample(0, 16, 9), alt: 'Sample screenshot one' }, { src: sample(1, 16, 9), alt: 'Sample screenshot two' }] }),
    },
    {
      title: 'Grid variant: portrait tiles, large gap',
      description: 'Uniform tiles; `aspect` and `gap` tune the rhythm.',
      code: `<ImageGrid variant="grid" aspect="portrait" gap="lg" :columns="4" :images="images" />`,
      state: () => ({ images: gallery() }),
    },
    {
      title: 'Masonry variant',
      description: 'CSS columns with natural heights; no cropping, so photos of different shapes pack tightly.',
      code: `<ImageGrid variant="masonry" :columns="3" gap="sm" :images="images" />`,
      state: () => ({ images: gallery() }),
    },
    {
      title: 'Featured variant',
      description: 'The first image spans 2x2 next to smaller tiles; lead with your best shot.',
      code: `<ImageGrid variant="featured" :columns="3" :images="images" />`,
      state: () => ({ images: gallery() }),
    },
    {
      title: 'Tight gallery without gaps',
      code: `<ImageGrid gap="none" aspect="landscape" :columns="4" :images="images" class="overflow-hidden rounded-lg" />`,
      state: () => ({ images: gallery().slice(0, 4) }),
    },
    {
      title: 'Shape gallery: rounded, square',
      description: 'Tile corners. `square` suits a flush gallery next to other square elements; the border keeps each tile visible in forced-colors mode.',
      code: `<div class="flex flex-col gap-6">
  <ImageGrid shape="rounded" :columns="3" :images="images" />
  <ImageGrid shape="square" :columns="3" :images="images" />
</div>`,
      state: () => ({ images: gallery().slice(0, 3) }),
    },
    {
      title: 'Square tiles in a featured layout',
      code: `<ImageGrid variant="featured" shape="square" gap="sm" :columns="3" :images="images" />`,
      state: () => ({ images: gallery() }),
    },
  ],
  a11y: [
    'The root is a native `<ul>` and each tile an `<li>`. With the lightbox on, a tile is a `<button type="button" aria-haspopup="dialog">` named "View image: <alt>" (the alt text, else the caption, else the position); its image is decorative so the name is not announced twice. Tiles are at least 44px tall (`min-h-11`) even before the image loads, which keeps lazy images above the 24px target size.',
    'Keyboard: Tab moves through the thumbnails, Enter or Space opens the Lightbox (see Lightbox: Esc closes, Left/Right arrows and Home/End navigate, focus returns to the thumbnail). With `lightbox=false` the tiles are plain images with their `alt`.',
    'Masonry fills column by column, so the visual order differs from the DOM and tab order across columns; use it for galleries whose order does not matter.',
    '`shape` changes the corners only: the tile is still a bordered, named button, so `square` tiles stay visible in forced-colors mode and keep the focus ring.',
    'Two columns on a 320px screen, `columns` from `sm`; there is no hover zoom, so nothing moves under reduced motion. Tiles have a border (visible in forced-colors mode).',
  ],
  requires: [
    'Throws a ContractError when an entry of `images` has no `alt` string (with `lightbox` on, a non-empty `caption` also satisfies it). The message names the first failing index. The internal Lightbox is bound to `open`, so its own contract holds.',
  ],
  related: ['Lightbox', 'BeforeAfter', 'MediaFrame'],
  llmNotes: [
    'Always provide meaningful `alt` (it becomes the button label); never remote placeholder URLs in examples.',
    'Provide `thumb` for large originals.',
    'Choose `variant`: grid for uniform screenshots, masonry for mixed-orientation photography, featured to spotlight one hero image among 4-7 others.',
    'Use `aspect` (not `ratio`) in new code; use `aspect="auto"` only with masonry or when images share a shape.',
    'Use `shape="square"` for flush galleries; do not try to make tiles circular (use Avatar for round images).',
    'Do not nest ImageGrid inside a link.',
  ],
  replaces: ['hand-rolled ImageGrid markup in app code'],
}
export default doc
