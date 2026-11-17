import type { ComponentDoc } from '../../../docs-types'

/** Scrollable sample article the bars track (`target` = its id). It opens part-way down so the fill is visible before any interaction. */
const box = (id: string) =>
  `<div id="${id}" role="region" aria-label="Sample article" tabindex="0" :ref="(el) => { if (el && !el.scrollTop) el.scrollTop = 90 }" class="h-32 overflow-auto rounded-md border p-3 text-sm text-muted-foreground"><p v-for="n in 12" :key="n" class="py-1">Sample paragraph {{ n }}.</p></div>`

const doc: ComponentDoc = {
  name: 'ScrollProgress',
  group: 'marketing',
  subgroup: 'Chrome',
  summary: 'Thin reading-progress bar pinned to the top or bottom of the viewport.',
  description:
    'Use on long-form pages (articles, docs, case studies). It reads window scroll position and document height, never throws on pages that do not scroll (stays at 0) and removes its listeners on unmount. The bar is non-interactive (`pointer-events-none`) and its transition is disabled for reduced-motion users. Render it once per page, e.g. next to `SiteHeader`.',
  status: 'stable',
  props: [
    { name: 'position', type: "'top' | 'bottom'", default: "'top'", description: 'Viewport edge to pin to. Unknown values fall back to `top`.' },
    { name: 'variant', type: "'bar' | 'rounded' | 'inset'", default: "'bar'", description: '`bar` is a flush strip, `rounded` rounds both ends of the fill, `inset` floats a rounded track 0.5rem from the edge and 1rem from the viewport sides. Unknown values fall back to `bar`. Reflected as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Thickness: 2px, 4px or 6px. Unknown values fall back to `md`. Reflected as `data-size`.' },
    { name: 'tone', type: "'primary' | 'neutral' | 'success' | 'info'", default: "'primary'", description: 'Fill colour: `primary`, `neutral` (the foreground colour), `success` or `info`. Unknown values fall back to `primary`. Reflected as `data-tone`.' },
    { name: 'label', type: 'string', default: "'Reading progress'", description: 'Accessible name (localise here).' },
    { name: 'target', type: 'string | HTMLElement | null', description: 'Follow this scroll container (an element or a CSS selector) instead of the page. A selector that matches nothing falls back to the page.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes. Pass `static` to render the strip in the page flow, as the galleries below do.' },
  ],
  examples: [
    {
      title: 'Tracking a scroll box',
      description: 'Pass `target` (a selector or an element) to follow an inner scroll container. Without it the bar follows the page and is `position: fixed`; `static` and `bg-muted` keep it in the preview and show the empty track.',
      code: `<div class="flex flex-col gap-2">
  <ScrollProgress target="#sp-basic" class="static bg-muted" label="Progress through the sample article" />
  ${box('sp-basic')}
</div>`,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'All three thicknesses follow the same scroll box.',
      code: `<div class="flex flex-col gap-3">
  <ScrollProgress size="sm" target="#sp-size" class="static bg-muted" label="Reading progress, small" />
  <ScrollProgress size="md" target="#sp-size" class="static bg-muted" label="Reading progress, medium" />
  <ScrollProgress size="lg" target="#sp-size" class="static bg-muted" label="Reading progress, large" />
  ${box('sp-size')}
</div>`,
    },
    {
      title: 'Tone gallery: primary, neutral, success, info',
      description: 'The fill colour only. Colour never carries the meaning: the progressbar role and its value text do.',
      code: `<div class="flex flex-col gap-3">
  <ScrollProgress tone="primary" size="lg" target="#sp-tone" class="static bg-muted" label="Reading progress, primary" />
  <ScrollProgress tone="neutral" size="lg" target="#sp-tone" class="static bg-muted" label="Reading progress, neutral" />
  <ScrollProgress tone="success" size="lg" target="#sp-tone" class="static bg-muted" label="Reading progress, success" />
  <ScrollProgress tone="info" size="lg" target="#sp-tone" class="static bg-muted" label="Reading progress, info" />
  ${box('sp-tone')}
</div>`,
    },
    {
      title: 'Variant gallery: bar, rounded, inset',
      description: '`bar` is flush, `rounded` rounds the fill, `inset` is a rounded track with its own muted surface and a gap to the edge.',
      code: `<div class="flex flex-col gap-3">
  <ScrollProgress variant="bar" size="lg" target="#sp-variant" class="static bg-muted" label="Reading progress, bar" />
  <ScrollProgress variant="rounded" size="lg" target="#sp-variant" class="static bg-muted" label="Reading progress, rounded" />
  <ScrollProgress variant="inset" size="lg" target="#sp-variant" class="static" label="Reading progress, inset" />
  ${box('sp-variant')}
</div>`,
    },
    {
      title: 'Page-level bar, bottom edge',
      description: 'Without `target` the bar follows the document and sits on the viewport edge. `position` picks the edge; it is fixed, so it is not shown inside this preview strip.',
      code: `<ScrollProgress position="bottom" variant="inset" tone="neutral" label="Progress through the article" />`,
    },
  ],
  requires: [
    'Throws a ContractError when the progress bar has no accessible name (`label` emptied and no `aria-label` / `aria-labelledby`).',
  ],
  a11y: [
    'role="progressbar" with aria-valuemin/max (0-100), aria-valuenow, aria-valuetext ("42%") and an aria-label (`label`, default "Reading progress"). It is not focusable, has no keyboard map and never takes pointer events.',
    '`size`, `tone` and `variant` change looks only: the role, name and value text are the same in every combination. `tone` is colour only, so the percentage in `aria-valuetext` stays the signal.',
    'The bar is smoothed with `motion-safe:transition-transform`, so reduced-motion users get position updates without animation. Nothing flashes or loops.',
    'In forced-colors mode the fill is drawn as a 4px bottom border in the text colour, because background colours are overridden there.',
    'The bar fills from the start edge, so it mirrors in right-to-left pages (`rtl:origin-right`).',
    'It is a 4px bar fixed to the viewport edge (2px to 6px with `size`; `inset` sits 0.5rem from the edge), so it never affects reflow at 320px and does not cover content that scrolls into view (it is thinner than any focus indicator).',
  ],
  related: ['SiteHeader', 'SectionReveal'],
  llmNotes: ['Mount once per page, not per section.', 'Do not use for form or upload progress; use Progress from feedback.', 'It tracks the whole document unless `target` names an inner scroll container.'],
  replaces: ['hand-rolled ScrollProgress markup in app code'],
}
export default doc
