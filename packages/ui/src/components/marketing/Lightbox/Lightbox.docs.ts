import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Flat sample image as an inline SVG data URI (no network, no gradient). Fills are the only raw colours, kept neutral. */
const sample = (n: number, w = 4, h = 3) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * 40} ${h * 40}"><rect width="${w * 40}" height="${h * 40}" fill="${['#52525b', '#0f766e', '#71717a', '#115e59', '#3f3f46'][n % 5]}"/><text x="${w * 20}" y="${h * 20 + 4}" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif">Sample ${n + 1}</text></svg>`)}`

const doc: ComponentDoc = {
  name: 'Lightbox',
  group: 'marketing',
  subgroup: 'Media',
  summary: 'Full-screen image viewer dialog with previous/next, Esc, focus containment and scroll lock.',
  description:
    'Use to enlarge images from a gallery or screenshot. Controlled with `v-model:open` (and optionally `v-model:index`); it is teleported to `<body>`. Opening moves focus to the close button, Tab stays inside, Escape closes, arrow keys navigate, and focus returns to the opener on close. `ImageGrid` wires this up for you. For arbitrary modal content use the overlays Dialog instead.',
  status: 'stable',
  props: [
    { name: 'open', type: 'boolean', required: true, description: 'v-model:open. Required: the viewer never opens itself, so bind it (`false` is fine). Renders nothing when false or when `images` is empty.' },
    { name: 'index', type: 'number', description: 'v-model:index, the visible image; clamped to the valid range.' },
    { name: 'images', type: 'LightboxImage[]', default: '[]', description: '`{ src, alt, caption? }`. `alt` is required (an empty string marks the image decorative); a non-empty `caption` also satisfies it.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap around at the ends; false disables prev/next at the ends.' },
    { name: 'closeOnBackdrop', type: 'boolean', default: 'true', description: 'Close on backdrop click.' },
    { name: 'label', type: 'string', default: "'Image viewer'", description: 'Accessible name of the dialog.' },
    { name: 'closeLabel', type: 'string', default: "'Close'", description: 'aria-label of the close button.' },
    { name: 'prevLabel', type: 'string', default: "'Previous image'", description: 'aria-label of the previous button.' },
    { name: 'nextLabel', type: 'string', default: "'Next image'", description: 'aria-label of the next button.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the overlay; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:open', payload: '[open: boolean]', description: 'Requested open state change.' },
    { name: 'update:index', payload: '[index: number]', description: 'Visible image changed.' },
    { name: 'close', description: 'Closed by Esc, close button or backdrop.' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<Button @click="open = true">Open viewer</Button>
<Lightbox v-model:open="open" :images="images" />`,
      script: `const open = ref(false)\nconst images = [{ src: '/a.jpg', alt: 'A', caption: 'First' }, ...]`,
      state: () => ({
        open: ref(false),
        images: [
          { src: sample(0), alt: 'Sample image 1', caption: 'First sample image' },
          { src: sample(1), alt: 'Sample image 2' },
        ],
      }),
    },
    {
      title: 'Controlled index, no looping',
      code: `<Button variant="outline" @click="open = true">Start at third</Button>
<Lightbox v-model:open="open" v-model:index="index" :loop="false" :images="images" />`,
      script: `const open = ref(false)\nconst index = ref(2)`,
      state: () => ({
        open: ref(false),
        index: ref(2),
        images: [0, 1, 2].map((n) => ({ src: sample(n), alt: `Sample image ${n + 1}` })),
      }),
    },
  ],
  a11y: [
    'role="dialog" aria-modal="true" with an aria-label (`label`); focus moves to Close on open and is restored to the opener on close.',
    'Keyboard map: Tab/Shift+Tab stay inside the dialog (no trap escape); Escape closes; ArrowLeft/ArrowRight move to the previous/next image (swapped in RTL); Home/End jump to the first/last image. Close, previous and next are real buttons with accessible names (`closeLabel`, `prevLabel`, `nextLabel`). At the ends with `loop=false` they use aria-disabled so a focused button keeps focus.',
    'The counter ("2 / 5") is a polite live region. Body scroll is locked while open and restored afterwards (including on unmount).',
    'Layout: the overlay is `h-dvh`, controls sit in header and footer bars (never over the picture), the image shrinks to the space left, so nothing is clipped at 320px or behind mobile browser bars. Controls are 40px (48px on coarse pointers) and the chevrons mirror in RTL. Nothing animates, so reduced motion needs no special handling.',
    'Give every image meaningful `alt` (it falls back to the caption).',
  ],
  requires: [
    'Throws a ContractError when the `open` prop is not provided (undefined). `false` is fine: bind `v-model:open`.',
    'Throws a ContractError when an entry of `images` has no `alt` string and no non-empty `caption`. The message names the first failing index.',
  ],
  related: ['ImageGrid', 'BeforeAfter', 'Dialog'],
  llmNotes: ['Always bind `v-model:open`; the component never opens itself.', 'Supply `alt` for each image.', 'Prefer ImageGrid unless you need a custom trigger.'],
  replaces: ['hand-rolled Lightbox markup in app code'],
}
export default doc
