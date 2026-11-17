import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Affix',
  group: 'layout',
  subgroup: 'Scrolling',
  summary: 'Pins content with `position: sticky` and reports whether it is currently stuck.',
  description:
    'Wrap a toolbar, table of contents or summary card in `Affix` so it stays visible while the page (or a scroll container, via `root`) scrolls. Positioning is pure CSS (`sticky` plus an inline `top` / `bottom` from `offsetTop` / `offsetBottom` in px); an `IntersectionObserver` watching a 1px sentinel placed next to the content drives the `change` event, the `data-stuck` attribute and the `stuck` slot prop (a scroll-listener fallback is used when IntersectionObserver is unavailable). The `variant` prop adds a shadow or border only while stuck. Sticky only works while the nearest scrolling ancestor and the parent are taller than the content: do not put `overflow: hidden` on ancestors. The sentinel is a zero-net-height inline-block sibling next to the content, so avoid parents that add `gap` between children. For two-column layouts use `SplitLayout` with `sticky`.',
  status: 'stable',
  props: [
    { name: 'offsetTop', type: 'number', description: 'Pixels from the top of the scroll container where the content sticks. Defaults to 0 unless only `offsetBottom` is given. Non-finite values are ignored; negative values are allowed.' },
    { name: 'offsetBottom', type: 'number', description: 'Pixels from the bottom edge (pins to the bottom). Drives stuck detection only when `offsetTop` is not set; both are applied inline when both are set.' },
    { name: 'zIndex', type: 'number | string', default: "'var(--z-sticky)' token", description: 'A number or any CSS value such as `var(--z-overlay)`. Invalid values fall back to the `--z-sticky` token.' },
    { name: 'variant', type: "'plain' | 'elevated' | 'bordered'", default: "'plain'", description: 'Look while stuck: `elevated` adds background + shadow, `bordered` background + edge border. Unknown values fall back to plain.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Render as a normal block: not sticky, no observer, never stuck.' },
    { name: 'root', type: 'HTMLElement | string | null', default: 'null', description: 'Scroll container as an element or CSS selector. `null` or not found = the viewport.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge (e.g. `z-10`, `bg-card`); wins over internal classes.' },
  ],
  slots: [{ name: 'default', props: '{ stuck: boolean }', description: 'The pinned content.' }],
  emits: [{ name: 'change', payload: '[stuck: boolean]', description: 'The stuck state flipped. Not emitted for the initial not-stuck state.' }],
  examples: [
    {
      title: 'Sticky toolbar with stuck state',
      description: 'Scroll the box: the bar gains a shadow while stuck and reports it.',
      script: 'const stuck = ref(false)',
      code: `<div id="affix-demo-scroll" class="h-48 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Sticky toolbar demo">
  <Affix root="#affix-demo-scroll" variant="elevated" class="px-3 py-2" @change="stuck = $event">
    <span class="text-sm font-medium">Toolbar ({{ stuck ? 'stuck' : 'in flow' }})</span>
  </Affix>
  <div class="grid gap-2 p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Paragraph {{ n }}</p>
  </div>
</div>`,
      state: () => ({ stuck: ref(false) }),
    },
    {
      title: 'Offset below a header and a bottom bar',
      description: 'Scroll the box: the first card stops 48px from the top, under the header; the second stops 40px from the bottom, above the bar.',
      code: `<div id="affix-offset-scroll" class="relative h-64 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Offset demo">
  <div class="sticky top-0 z-40 flex h-12 items-center border-b bg-card px-3 text-sm text-card-foreground">Header, 48px</div>
  <Affix root="#affix-offset-scroll" :offset-top="48" :z-index="30" variant="bordered" class="px-3 py-2 text-sm">Pins 48px from the top</Affix>
  <div class="grid gap-2 p-3">
    <p v-for="n in 8" :key="n" class="text-sm">Paragraph {{ n }}</p>
  </div>
  <Affix root="#affix-offset-scroll" :offset-bottom="40" :z-index="30" variant="bordered" class="px-3 py-2 text-sm">Pins 40px from the bottom</Affix>
  <div class="grid gap-2 p-3">
    <p v-for="n in 8" :key="n" class="text-sm">Paragraph {{ n + 8 }}</p>
  </div>
  <div class="sticky bottom-0 z-40 flex h-10 items-center border-t bg-card px-3 text-sm text-card-foreground">Bottom bar, 40px</div>
</div>`,
    },
    {
      title: 'Bordered variant and disabled',
      code: `<div class="grid gap-4">
  <Affix variant="bordered" class="px-3 py-2 text-sm">Border appears when stuck</Affix>
  <Affix disabled class="rounded-md border p-3 text-sm">Disabled: behaves like a plain block</Affix>
</div>`,
    },
  ],
  a11y: [
    'Affix adds no role or label of its own: put landmarks (`role="toolbar"`, `<nav aria-label>`) on the content or pass `aria-*` attributes, which fall through to the pinned element.',
    'The sentinel is `aria-hidden` and not focusable. Stuck styling never hides content; ensure the pinned element does not cover focused elements below it (use scroll-padding on the container).',
    'Transitions are disabled under `prefers-reduced-motion`.',
    'When `root` is a scrolling box, that box must itself be keyboard reachable: give it `tabindex="0"`, `role="region"` and an `aria-label` (the live example does), or axe reports scrollable-region-focusable.',
    'The `elevated` variant also gets the opaque `bg-background`, and a border in forced-colors mode (shadows disappear there), so stuck content is distinguishable from the scrolled content without relying on the shadow alone.',
  ],
  related: ['SplitLayout', 'AppShell', 'PageHeader'],
  requires: [
    'Throws a ContractError when `root` is a selector that matches no element (or is not a valid selector), because the Affix would silently watch the viewport.',
  ],
  llmNotes: [
    'Use `offset-top` / `offset-bottom` numbers (px), not inline style, for the sticky distance.',
    'Use `z-index` with a CSS variable such as `var(--z-overlay)` rather than magic numbers when layering.',
    'Sticky fails if an ancestor has overflow hidden/auto without a height; point `root` at the real scroll container.',
    'Attributes (id, aria-label, data-*) land on the pinned element, not on a wrapper; the component renders a sentinel sibling before/after it.',
  ],
}

export default doc
