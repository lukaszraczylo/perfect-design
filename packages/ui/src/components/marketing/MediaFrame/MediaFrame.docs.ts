import type { ComponentDoc } from '../../../docs-types'
import { sampleImage } from '../shared/sample'

const doc: ComponentDoc = {
  name: 'MediaFrame',
  group: 'marketing',
  subgroup: 'Sections',
  summary: 'Browser, window, phone or plain frame around a real screenshot or code block.',
  description:
    'Wrap real screenshots of the product, or a code block, in a frame. Do not use it to draw a fake dashboard: the content must be an actual capture or actual code. Variants: `browser` (three dots and an address pill; web screenshots), `window` (dots and a centred file name; terminal and code), `phone` (rounded bezel with a notch; mobile screenshots) and `plain` (bordered panel, no chrome). Hero uses it through its `mediaFrame` prop. Content comes from the default slot or the `src` shortcut. The frame is flat: no shadow unless `elevated` is set. `size` scales the chrome (and the phone width), `shape` squares the corners and `appearance` drops the outline.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'browser' | 'window' | 'phone' | 'plain'", default: "'browser'", description: 'Chrome style. Unknown values fall back to `browser`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Chrome bar padding, dots and text, phone notch and phone width (14rem, 18rem, 20rem). `plain` has no chrome, so `size` only affects the phone there. Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Corners: `rounded-lg` (`rounded-xl` for the phone bezel) or none. Unknown values fall back to `rounded`. Reflected as `data-shape`.' },
    { name: 'appearance', type: "'bordered' | 'borderless'", default: "'bordered'", description: 'Outline of the browser, window and plain frames. `borderless` removes it (a border returns in forced-colors mode). The phone keeps its bezel: it is the device. Unknown values fall back to `bordered`. Reflected as `data-appearance`.' },
    { name: 'title', type: 'string', description: 'Chrome bar text: URL (browser) or file name (window). Ignored by phone and plain.' },
    { name: 'src', type: 'string', description: 'Image shortcut used when the default slot is empty. Pair it with a meaningful `alt`.' },
    { name: 'alt', type: 'string', description: 'Alt text for `src`. Required with `src` (and no default slot). Describe what the screenshot shows. An empty string marks the image decorative; only do that when the caption already says it.' },
    { name: 'elevated', type: 'boolean', default: 'false', description: 'Neutral `shadow-md` under the frame. Off by default because only floating surfaces cast shadows.' },
    { name: 'contentClass', type: 'string | object | array', description: 'Classes for the content area (padding, background, font).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the frame root; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Frame content (image, video, code). Overrides `src`. Wide code needs its own scroll container (see the code example).' }],
  examples: [
    {
      title: 'Browser around a screenshot',
      description: 'The image is a flat placeholder; swap `shot` for a real capture and write the alt text from it.',
      code: `<MediaFrame variant="browser" title="localhost:5173/dashboard" :src="shot" alt="Dashboard with a sidebar and a table of components" />`,
      script: `const shot = '/screenshots/dashboard.png'`,
      state: () => ({ shot: sampleImage('16/9') }),
    },
    {
      title: 'Window with code',
      description: 'The `pre` scrolls inside the frame, so it is focusable and named for keyboard users.',
      code: `<MediaFrame variant="window" title="install.sh" content-class="bg-foreground p-4 font-mono text-sm text-background">
  <pre tabindex="0" role="region" aria-label="Install command" class="overflow-x-auto whitespace-pre">pnpm add @perfect-design/ui</pre>
</MediaFrame>`,
    },
    {
      title: 'Phone',
      code: `<MediaFrame variant="phone" :src="shot" alt="Mobile layout of the settings page" />`,
      script: `const shot = '/screenshots/settings-mobile.png'`,
      state: () => ({ shot: sampleImage('1/1') }),
    },
    {
      title: 'Plain with a shadow',
      code: `<MediaFrame variant="plain" elevated :src="shot" alt="Component catalogue with nine groups" />`,
      script: `const shot = '/screenshots/catalogue.png'`,
      state: () => ({ shot: sampleImage('4/3') }),
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Chrome bar density and text size. The image is a flat sample placeholder.',
      code: `<div class="flex flex-col gap-6">
  <MediaFrame size="sm" title="localhost:5173/small" :src="shot" alt="Sample capture in a small browser frame" />
  <MediaFrame size="md" title="localhost:5173/medium" :src="shot" alt="Sample capture in a medium browser frame" />
  <MediaFrame size="lg" title="localhost:5173/large" :src="shot" alt="Sample capture in a large browser frame" />
</div>`,
      script: `const shot = '/screenshots/dashboard.png'`,
      state: () => ({ shot: sampleImage('16/9') }),
    },
    {
      title: 'Phone size gallery: sm, md, lg',
      description: 'The phone width follows `size`: 14rem, 18rem and 20rem, each capped by its container. Stacked here so each frame can reach its own width.',
      code: `<div class="flex flex-col gap-6">
  <MediaFrame variant="phone" size="sm" :src="shot" alt="Sample capture in a small phone frame" />
  <MediaFrame variant="phone" size="md" :src="shot" alt="Sample capture in a medium phone frame" />
  <MediaFrame variant="phone" size="lg" :src="shot" alt="Sample capture in a large phone frame" />
</div>`,
      script: `const shot = '/screenshots/settings-mobile.png'`,
      state: () => ({ shot: sampleImage('1/1') }),
    },
    {
      title: 'Shape gallery: rounded, square',
      description: 'Corners of the frame. Use `square` next to other square elements.',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <MediaFrame shape="rounded" title="localhost:5173/rounded" :src="shot" alt="Sample capture in a rounded frame" />
  <MediaFrame shape="square" title="localhost:5173/square" :src="shot" alt="Sample capture in a square frame" />
</div>`,
      script: `const shot = '/screenshots/dashboard.png'`,
      state: () => ({ shot: sampleImage('4/3') }),
    },
    {
      title: 'Appearance gallery: bordered, borderless',
      description: 'The outline of the frame. A borderless frame suits a section that already has a surface; in forced-colors mode the border returns.',
      code: `<div class="grid gap-4 bg-muted p-4 sm:grid-cols-2">
  <MediaFrame appearance="bordered" variant="plain" :src="shot" alt="Sample capture with an outline" />
  <MediaFrame appearance="borderless" variant="plain" :src="shot" alt="Sample capture without an outline" />
</div>`,
      script: `const shot = '/screenshots/catalogue.png'`,
      state: () => ({ shot: sampleImage('4/3') }),
    },
  ],
  a11y: [
    'The frame is a `figure`. Add `aria-label` or a `figcaption` when the capture needs a name; the chrome dots and notch are aria-hidden decoration and the address bar text is plain text.',
    'Give `src` images a meaningful `alt`. Empty alt is for decoration only.',
    'Scrollable code inside the frame must be focusable and labelled: `tabindex="0"`, `role="region"` and `aria-label` on the scrolling element (Hero does this for its `code` prop).',
    '`size`, `shape` and `appearance` change looks only: the figure, the alt contract and the aria-hidden chrome are the same. A borderless frame keeps a border in forced-colors mode so its edge stays visible.',
    'Reflows at 320px: the frame is `min-w-0` and the phone variant is capped at `max-w-56`, `max-w-72` or `max-w-80` by `size` (and by its container). Logical properties only, so RTL needs no changes.',
  ],
  requires: [
    'Throws a ContractError when `src` is set without an `alt` string (and no default slot content). An empty string marks the image decorative.',
  ],
  related: ['Hero', 'ImageGrid', 'AspectRatio'],
  llmNotes: [
    'Wrap real screenshots only. Never recreate a dashboard in markup inside a frame.',
    'Use `size` for chrome density, `shape="square"` and `appearance="borderless"` for flush layouts; never add chrome with custom classes.',
    'Use `browser` for web screenshots, `window` for terminal and code, `phone` for mobile screens, `plain` for no chrome.',
    'Always set `alt` on `src` images to describe the capture.',
    'Never put interactive controls inside the chrome; only the content area is a slot.',
    'Give wide code a focusable, labelled scroll container.',
    'In Hero prefer the `mediaFrame` prop instead of wrapping the media slot by hand.',
  ],
}
export default doc
