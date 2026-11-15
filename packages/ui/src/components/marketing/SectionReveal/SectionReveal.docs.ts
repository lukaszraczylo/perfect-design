import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SectionReveal',
  group: 'marketing',
  subgroup: 'Motion',
  summary: 'Opt-in wrapper that fades its content in (rising, dropping or sliding sideways) when scrolled into view. Does nothing unless `enabled`.',
  description:
    'Off by default: without `enabled` it renders a plain element, with no classes, no observer and no hidden state. Turn it on for at most one orchestrated moment on a page (for example the first below-the-fold section), never on every section, because the same fade-up on every block is a stock look. When enabled it uses IntersectionObserver. Content is visible by default for server rendering, no-JS and browsers without IntersectionObserver; it is hidden only after mount, and only when it starts below the viewport. Users who prefer reduced motion never see the hidden state. Use `delay` to stagger siblings. Do not wrap above-the-fold content. `effect`, `distance` and `speed` only change the hidden state and the transition length: only `opacity` and `translate` animate, so the box never moves in the layout. A sideways effect moves the wrapper itself, so put it inside a container that clips horizontally (`overflow-x-clip`, or a `Container` with side padding at least as large as `distance`) when it spans the full viewport width, otherwise the hidden state can add a horizontal scrollbar.',
  status: 'stable',
  props: [
    { name: 'enabled', type: 'boolean', default: 'false', description: 'Turn the reveal on. When false the component is a plain wrapper (no-op).' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element or component to render.' },
    { name: 'once', type: 'boolean', default: 'true', description: 'Reveal once; false re-hides when scrolled out.' },
    { name: 'threshold', type: 'number', default: '0.15', description: 'Visible fraction (0-1) that triggers the reveal; invalid falls back to 0.15.' },
    { name: 'rootMargin', type: 'string', default: "'0px 0px -8% 0px'", description: 'IntersectionObserver rootMargin.' },
    { name: 'delay', type: 'number', default: '0', description: 'transition-delay in ms for staggering; invalid falls back to 0.' },
    { name: 'effect', type: "'fade-up' | 'fade' | 'fade-down' | 'slide-left' | 'slide-right'", default: "'fade-up'", description: '`fade-up` fades in while rising, `fade-down` while dropping, `fade` only fades, `slide-left` and `slide-right` fade in from the left or right. The sides are physical and are not mirrored in right-to-left pages. Unknown values fall back to `fade-up`. Reflected as `data-effect` while enabled.' },
    { name: 'distance', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'How far the hidden state is offset: 0.5rem, 1rem or 2rem. Ignored by `fade`. Unknown values fall back to `md`. Reflected as `data-distance` while enabled.' },
    { name: 'speed', type: "'fast' | 'normal' | 'slow'", default: "'normal'", description: 'Transition length: 300ms, 700ms or 1000ms. Unknown values fall back to `normal`. Reflected as `data-speed` while enabled.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Content to reveal.' }],
  emits: [{ name: 'reveal', description: 'Content became visible (each time when `once` is false). Never emitted while `enabled` is false.' }],
  examples: [
    { title: 'Default (no-op)', description: 'Without `enabled` the wrapper adds nothing.', code: `<SectionReveal><p class="rounded-lg border p-6">Rendered as is: no animation, no hidden state.</p></SectionReveal>` },
    { title: 'Enabled', description: 'Starts visible when already on screen; only content below the fold animates in.', code: `<SectionReveal enabled><p class="rounded-lg border p-6">I fade in when I scroll into view.</p></SectionReveal>` },
    {
      title: 'One staggered moment',
      description: 'Short transitions (`duration-150`) and small delays keep the whole moment under half a second.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <SectionReveal v-for="(n, i) in [1, 2, 3]" :key="n" enabled :delay="i * 40" effect="fade" class="duration-150">
    <div class="rounded-lg border p-6">Sample card {{ n }}</div>
  </SectionReveal>
</div>`,
    },
    {
      title: 'Effect gallery: fade-up, fade-down, fade, slide-left, slide-right',
      description: 'Each card is its own wrapper with `enabled`. `overflow-x-clip` on the grid stops the sideways effects from adding a horizontal scrollbar. Cards that are on screen at mount stay visible; scroll them out and reload to see the motion.',
      code: `<div class="grid gap-4 overflow-x-clip sm:grid-cols-2 lg:grid-cols-3">
  <SectionReveal enabled effect="fade-up"><div class="rounded-lg border p-6">fade-up (default)</div></SectionReveal>
  <SectionReveal enabled effect="fade-down"><div class="rounded-lg border p-6">fade-down</div></SectionReveal>
  <SectionReveal enabled effect="fade"><div class="rounded-lg border p-6">fade</div></SectionReveal>
  <SectionReveal enabled effect="slide-left"><div class="rounded-lg border p-6">slide-left</div></SectionReveal>
  <SectionReveal enabled effect="slide-right"><div class="rounded-lg border p-6">slide-right</div></SectionReveal>
</div>`,
    },
    {
      title: 'Distance gallery: sm, md, lg',
      description: '`distance` sets how far the hidden state is offset: 0.5rem, 1rem or 2rem.',
      code: `<div class="grid gap-4 overflow-x-clip sm:grid-cols-3">
  <SectionReveal enabled distance="sm"><div class="rounded-lg border p-6">distance sm</div></SectionReveal>
  <SectionReveal enabled distance="md"><div class="rounded-lg border p-6">distance md</div></SectionReveal>
  <SectionReveal enabled distance="lg"><div class="rounded-lg border p-6">distance lg</div></SectionReveal>
</div>`,
    },
    {
      title: 'Speed gallery: fast, normal, slow',
      description: '`speed` sets the transition length: 300ms, 700ms or 1000ms. Prefer `fast` for a group of siblings.',
      code: `<div class="grid gap-4 overflow-x-clip sm:grid-cols-3">
  <SectionReveal enabled speed="fast"><div class="rounded-lg border p-6">speed fast</div></SectionReveal>
  <SectionReveal enabled speed="normal"><div class="rounded-lg border p-6">speed normal</div></SectionReveal>
  <SectionReveal enabled speed="slow"><div class="rounded-lg border p-6">speed slow</div></SectionReveal>
</div>`,
    },
    {
      title: 'Slide in from the sides',
      description: 'Two columns entering from opposite sides, once, with a short delay between them.',
      code: `<div class="grid gap-4 overflow-x-clip sm:grid-cols-2">
  <SectionReveal enabled effect="slide-left" speed="fast"><div class="rounded-lg border p-6">Sample column that enters from the left</div></SectionReveal>
  <SectionReveal enabled effect="slide-right" speed="fast" :delay="60"><div class="rounded-lg border p-6">Sample column that enters from the right</div></SectionReveal>
</div>`,
    },
  ],
  a11y: [
    'The new effects change only `opacity` and `translate`; text is never scaled or rotated, so it stays readable at 200% zoom, and nothing moves in the layout. Sideways effects can extend past the right edge while hidden: wrap them in `overflow-x-clip` so no horizontal scrollbar appears at 320px.',
    'Content is never removed from the accessibility tree or `display`-hidden, only made transparent, so assistive technology reads it in order. Without JavaScript or IntersectionObserver it stays fully visible.',
    'prefers-reduced-motion: content is shown immediately and no observer is created; transitions also carry `motion-reduce:transition-none`.',
    'No focusable element is moved or hidden by the transition, and the wrapper adds no role or tab stop.',
  ],
  related: ['ScrollProgress', 'Marquee'],
  llmNotes: [
    'Default is a no-op. Add `enabled` for one orchestrated moment, not on every section.',
    'Never wrap the Hero or other above-the-fold content.',
    'Keep the whole moment short: `duration-150` to `duration-300` via `class`, and `delay` steps of 40 to 100ms, not long chains.',
    'Prefer `effect="fade"` for large containers to avoid layout-looking jumps.',
    'Put `slide-left` and `slide-right` inside an `overflow-x-clip` container; keep `distance` at `sm` or `md` and `speed` at `fast` or `normal` for a calm page.',
  ],
  replaces: ['hand-rolled SectionReveal markup in app code'],
}
export default doc
