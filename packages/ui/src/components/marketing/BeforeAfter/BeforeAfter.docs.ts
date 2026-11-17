import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless landscape sample (docs only). */
const sampleScene = (bg = '#e4e4e7', mid = '#d4d4d8', fg = '#a1a1aa') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice"><rect width="640" height="360" fill="${bg}"/><circle cx="470" cy="110" r="42" fill="${mid}"/><path d="M0 300 170 150 300 260 410 180 640 330V360H0z" fill="${mid}"/><path d="M0 360 220 230 380 360z" fill="${fg}"/></svg>`)}`

const before = sampleScene('#e4e4e7', '#d4d4d8', '#a1a1aa')
const after = sampleScene('#d6e4e6', '#a9c8cc', '#5f8f96')

const doc: ComponentDoc = {
  name: 'BeforeAfter',
  group: 'marketing',
  subgroup: 'Media',
  summary: 'Image comparison slider, horizontal or vertical: drag or use the keyboard to reveal the before and after images.',
  description:
    'Use to compare two images with identical framing (renovations, retouching, UI redesigns). `orientation="horizontal"` (default) splits left/right; `orientation="vertical"` stacks before on top of after and the divider moves up/down. The divider is a real ARIA slider: pointer drag on either axis, arrow keys (step, Shift = 5x), PageUp/PageDown, Home/End. Position is a percentage of the width (height when vertical) showing "before" (0 = all "after", 100 = all "before") and is clamped; non-numeric values fall back to 50. Supports `v-model` or uncontrolled via `start`.',
  status: 'stable',
  props: [
    { name: 'before', type: 'string', description: 'Image URL on the left (top when vertical). Missing = neutral placeholder.' },
    { name: 'after', type: 'string', description: 'Image URL on the right (bottom when vertical). Missing = accent placeholder.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Divider axis. Unknown values fall back to `horizontal`. Reflected as `data-orientation` and `aria-orientation`.' },
    { name: 'showLabels', type: 'boolean', default: 'true', description: 'Show the decorative labels. `false` is the same as `variant="none"`. The slider\'s `aria-valuetext` always names both sides.' },
    { name: 'variant', type: "'overlay' | 'bar' | 'none'", default: "'overlay'", description: 'Label placement. `overlay` puts a chip in the corner of each image, `bar` docks one opaque caption strip along the bottom edge, `none` shows no labels. Unknown values fall back to `overlay`. Reflected as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Handle and label size. Hit area 2rem, 2.5rem or 3rem wide; knob 1.75rem, 2.25rem or 2.75rem. Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Frame corners (and label chips): `rounded-lg` or none. Unknown values fall back to `rounded`. Reflected as `data-shape`.' },
    { name: 'tone', type: "'default' | 'primary' | 'neutral'", default: "'default'", description: 'Colour of the divider line and grip: the background colour, the primary colour (grip text uses primary-foreground) or the foreground colour (grip text uses background). Unknown values fall back to `default`. Reflected as `data-tone`.' },
    { name: 'appearance', type: "'knob' | 'bar' | 'line'", default: "'knob'", description: 'Handle style. `knob` is a line with a round grip and two arrows, `bar` a line with a short rounded grip, `line` a thicker line only. Unknown values fall back to `knob`. Reflected as `data-appearance`.' },
    { name: 'beforeAlt', type: 'string', description: 'Alt text for the before image. Required with `before`; an empty string marks it decorative.' },
    { name: 'afterAlt', type: 'string', description: 'Alt text for the after image. Required with `after`; an empty string marks it decorative.' },
    { name: 'beforeLabel', type: 'string', default: "'Before'", description: 'Corner label and slider text.' },
    { name: 'afterLabel', type: 'string', default: "'After'", description: 'Corner label and slider text.' },
    { name: 'modelValue', type: 'number', description: 'Divider position 0-100 (v-model): % of the width (height when vertical) showing "before". Clamped.' },
    { name: 'start', type: 'number', default: '50', description: 'Initial position when uncontrolled.' },
    { name: 'step', type: 'number', default: '2', description: 'Keyboard step in percent; invalid falls back to 2.' },
    { name: 'aspect', type: 'string', default: "'16 / 9'", description: 'CSS aspect ratio "w / h"; invalid falls back to 16 / 9.' },
    { name: 'label', type: 'string', default: "'Image comparison slider'", description: 'Accessible name of the slider.' },
    { name: 'blurred', type: 'boolean', description: 'Privacy blur on both images; the labels and the slider stay sharp. v-model:blurred. Wins over `ConfigProvider blurMedia`, true or false; undefined inherits, then false.' },
    { name: 'defaultBlurred', type: 'boolean', description: 'Starting blur when `blurred` is not bound.' },
    { name: 'revealable', type: 'boolean', default: 'false', description: 'When blurred, show a button that unblurs, then a toggle that blurs again. The button is an action whose name says what it does next ("Show image", "Hide image"), with a 24px minimum target (44px on coarse pointers) and does not appear while the media was never blurred.' },
    { name: 'revealLabel', type: 'string', default: "'Show image'", description: 'Name of the reveal button (translate it).' },
    { name: 'hideLabel', type: 'string', default: "'Hide image'", description: 'Name of the button that blurs again (translate it).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:blurred', payload: '[value: boolean]', description: 'The reveal button changed the blur.' },
    { name: 'update:modelValue', payload: '[value: number]', description: 'Position changed by pointer or keyboard.' }],
  examples: [
    { title: 'Basic: uncontrolled placeholders', code: `<BeforeAfter class="max-w-xl" aspect="4 / 3" before-label="Before" after-label="After" />` },
    {
      title: 'Realistic: images, alt text and v-model',
      description: 'Inline SVG samples stand in for real screenshots. Describe what differs between the two images in the alt text.',
      code: `<div class="max-w-xl space-y-2">
  <BeforeAfter v-model="pos" :before="before" :after="after" before-alt="Sample image showing the previous layout" after-alt="Sample image showing the new layout" />
  <p class="text-sm text-muted-foreground">Position: {{ Math.round(pos) }}%</p>
</div>`,
      script: `const pos = ref(30)
const before = '/screenshots/before.png'
const after = '/screenshots/after.png'`,
      state: () => ({ pos: ref(30), before, after }),
    },
    {
      title: 'Horizontal variant (default) without labels',
      description: 'Left/right split; hide the corner labels when the images speak for themselves.',
      code: `<BeforeAfter class="max-w-xl" orientation="horizontal" :show-labels="false" before-alt="Original photo" after-alt="Retouched photo" />`,
    },
    {
      title: 'Vertical variant',
      description: 'Before on top, after below; the divider moves up/down. Good for tall or portrait comparisons and narrow columns.',
      code: `<BeforeAfter class="max-w-sm" orientation="vertical" aspect="3 / 4" before-label="Before" after-label="After" :start="40" />`,
    },
    {
      title: 'Label placement gallery: overlay, bar, none',
      description: '`variant` moves or removes the decorative labels. The slider keeps naming both sides in its `aria-valuetext` in all three. Sample images stand in for real captures.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <BeforeAfter variant="overlay" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, overlay labels" />
  <BeforeAfter variant="bar" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, caption bar" />
  <BeforeAfter variant="none" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, no labels" />
</div>`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Handle hit area, knob and label text scale together. All sizes stay above the 24px target size.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <BeforeAfter size="sm" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, small handle" />
  <BeforeAfter size="md" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, medium handle" />
  <BeforeAfter size="lg" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, large handle" />
</div>`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Shape gallery: rounded, square',
      description: 'Frame corners and label chips. Use `square` inside a container that already has its own radius.',
      code: `<div class="grid gap-4 sm:grid-cols-2">
  <BeforeAfter shape="rounded" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, rounded frame" />
  <BeforeAfter shape="square" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, square frame" />
</div>`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Tone gallery: default, primary, neutral',
      description: 'Divider and grip colour. Pick the tone that keeps the line visible against your images; the default is light.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <BeforeAfter tone="default" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, default tone" />
  <BeforeAfter tone="primary" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, primary tone" />
  <BeforeAfter tone="neutral" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, neutral tone" />
</div>`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Appearance gallery: knob, bar, line',
      description: 'Handle style. Focus the sliders with Tab: the whole handle gets an inset outline, and the grip a ring.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <BeforeAfter appearance="knob" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, knob handle" />
  <BeforeAfter appearance="bar" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, bar handle" />
  <BeforeAfter appearance="line" aspect="4 / 3" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, line handle" />
</div>`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Combined: vertical, square, caption bar, primary bar handle',
      description: 'Dimensions combine freely. The vertical divider moves with Up and Down.',
      code: `<BeforeAfter class="max-w-sm" orientation="vertical" shape="square" variant="bar" tone="primary" appearance="bar" size="lg" aspect="3 / 4" :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" label="Compare, vertical" />`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
    {
      title: 'Vertical with v-model and custom labels',
      code: `<div class="max-w-sm space-y-2">
  <BeforeAfter v-model="pos" orientation="vertical" aspect="4 / 5" before-label="Draft" after-label="Final" label="Compare draft and final" />
  <p class="text-sm text-muted-foreground">Divider at {{ Math.round(pos) }}% from the top</p>
</div>`,
      script: `const pos = ref(60)`,
      state: () => ({ pos: ref(60) }),
    },
    {
      title: 'Blurred, revealable',
      description: 'Both images are blurred; the slider still works. Dragging the divider never triggers the button.',
      code: `<BeforeAfter class="max-w-xl" aspect="4 / 3" revealable default-blurred :before="before" :after="after" before-alt="Sample image: before" after-alt="Sample image: after" />`,
      script: `const before = '/screenshots/before.png'\nconst after = '/screenshots/after.png'`,
      state: () => ({ before, after }),
    },
  ],
  a11y: [
    'Blur is visual only: alt text and names are unchanged and nothing is hidden from assistive technology; the root gets `data-blurred`. The reveal button is a real button whose name changes with the action (`revealLabel` while blurred, `hideLabel` once shown); it has no `aria-pressed`, because a toggle must not also change its label. Blur is a CSS filter on the media only, so it needs no colour and survives forced-colors mode; its transition runs only under `motion-safe:`.',
    'The divider handle is role="slider" (tabindex 0) with aria-valuemin 0, aria-valuemax 100, aria-valuenow, aria-valuetext ("40% Before, 60% After") and an aria-label (`label`).',
    'Keyboard map: ArrowRight/ArrowUp/PageUp add "before" and ArrowLeft/ArrowDown/PageDown remove it (horizontal); vertical follows the arrow (Down/Right/PageDown move the divider down). Shift multiplies the step by 5; PageUp/PageDown always move 5 steps; Home = 0, End = 100.',
    'Focus is shown as an inset outline around the whole handle and as a ring on the round knob (and, in forced-colors mode, an outline). The handle hit area is 40px wide (a 36px knob) so it exceeds the 24px target size; the page can still scroll over the image on the cross axis (`touch-pan-y` / `touch-pan-x`).',
    '`size`, `shape`, `tone`, `appearance` and `variant` change looks only. The role, name, value text, keyboard map and alt contract are identical in every combination. In every appearance, focus is an inset 2px outline in the ring colour around the whole handle hit area (also visible in forced-colors mode), plus the ring on the grip when there is one; `appearance="line"` has no grip, so the outline is its only indicator. With `tone` primary or neutral the grip border follows the tone.',
    '`variant="bar"` is an opaque caption strip (no blur, no translucency) docked along the bottom edge with the labels in physical order (before left, after right) in right-to-left pages too; it is aria-hidden like the chips.',
    '`aria-orientation` follows `orientation`. Corner labels are decorative (aria-hidden), opaque, and can be hidden with `showLabels`; the slider text always names both sides.',
    'Provide meaningful beforeAlt/afterAlt: both images stay in the accessibility tree. The divider axis is physical (left/right or top/bottom) and is not mirrored in RTL because the images are not mirrored either. Nothing animates, so reduced motion needs no special handling.',
  ],
  requires: [
    'Throws a ContractError when `before` is set without a `beforeAlt` string, or `after` without an `afterAlt` string. An empty string marks the image decorative.',
    'Throws a ContractError when `label` is an empty string: the slider needs an accessible name.',
  ],
  related: ['ImageGrid', 'Lightbox'],
  llmNotes: [
'Use `blurred` for privacy, not decoration.',
    'Use `orientation="vertical"` for portrait/tall images or narrow columns; keep horizontal for landscape images.', 'Both images must share the same crop/aspect ratio.', 'Always set beforeAlt/afterAlt describing the content.', 'Do not rely on drag only; the slider is keyboard operable by design.'],
  replaces: ['hand-rolled BeforeAfter markup in app code'],
}
export default doc
