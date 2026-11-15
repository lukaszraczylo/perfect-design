import type { ComponentDoc } from '../../../docs-types'

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
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes. Pass `static` to render the strip in the page flow, as the galleries below do.' },
  ],
  examples: [
    {
      title: 'Top bar (contained preview)',
      description: 'The bar is `position: fixed`; in real pages place it anywhere in the root layout.',
      code: `<ScrollProgress />`,
    },
    { title: 'Bottom, thicker', code: `<ScrollProgress position="bottom" size="lg" label="Progress through the article" />` },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'All three thicknesses side by side. `static` takes the strips out of the viewport edge for this preview and `bg-muted` shows the empty track; the fill follows the page scroll.',
      code: `<div class="flex flex-col gap-4">
  <ScrollProgress size="sm" class="static bg-muted" label="Reading progress, small" />
  <ScrollProgress size="md" class="static bg-muted" label="Reading progress, medium" />
  <ScrollProgress size="lg" class="static bg-muted" label="Reading progress, large" />
</div>`,
    },
    {
      title: 'Tone gallery: primary, neutral, success, info',
      description: 'The fill colour only. Colour never carries the meaning: the progressbar role and its value text do.',
      code: `<div class="flex flex-col gap-4">
  <ScrollProgress tone="primary" size="lg" class="static bg-muted" label="Reading progress, primary" />
  <ScrollProgress tone="neutral" size="lg" class="static bg-muted" label="Reading progress, neutral" />
  <ScrollProgress tone="success" size="lg" class="static bg-muted" label="Reading progress, success" />
  <ScrollProgress tone="info" size="lg" class="static bg-muted" label="Reading progress, info" />
</div>`,
    },
    {
      title: 'Variant gallery: bar, rounded, inset',
      description: '`bar` is flush, `rounded` rounds the fill, `inset` is a rounded track with its own muted surface and a gap to the edge.',
      code: `<div class="flex flex-col gap-4">
  <ScrollProgress variant="bar" size="lg" class="static bg-muted" label="Reading progress, bar" />
  <ScrollProgress variant="rounded" size="lg" class="static bg-muted" label="Reading progress, rounded" />
  <ScrollProgress variant="inset" size="lg" class="static" label="Reading progress, inset" />
</div>`,
    },
    {
      title: 'Inset at the bottom, neutral',
      description: 'Combines `variant`, `position` and `tone`. Fixed to the viewport like the default.',
      code: `<ScrollProgress variant="inset" position="bottom" tone="neutral" label="Progress through the article" />`,
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
  llmNotes: ['Mount once per page, not per section.', 'Do not use for form or upload progress; use Progress from feedback.', 'It tracks the whole document, not an inner scroll container.'],
  replaces: ['hand-rolled ScrollProgress markup in app code'],
}
export default doc
