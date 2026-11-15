import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Container',
  group: 'layout',
  subgroup: 'Containers',
  summary: 'Constrains content to a max width, centres it and adds responsive horizontal padding.',
  description:
    'Wrap page content in `Container` instead of hand-writing `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`. Pick a `size` preset (`sm` … `7xl`, `prose` for a readable text measure, or `full`). Horizontal padding is `padded` (default responsive gutter) or, for explicit control, a `gutter` preset (`none` | `sm` | `md` | `lg`, replaces `padded`). `paddingY` (`none` | `sm` | `md` | `lg`) adds vertical padding so you do not need a wrapping `Section`. Use `padded=false` when the parent already pads, and `centered=false` to left-align. Not for vertical rhythm (use `Section`) or spacing between children (use `Stack`).',
  status: 'stable',
  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'prose' | 'full'", default: "'7xl'", description: 'Max-width preset (Tailwind max-w-*; `prose` = max-w-prose). Unknown values fall back to 7xl.' },
    { name: 'padded', type: 'boolean', default: 'true', description: 'Responsive horizontal padding: px-4 sm:px-6 lg:px-8. Ignored when `gutter` is set.' },
    { name: 'gutter', type: "'none' | 'sm' | 'md' | 'lg'", description: 'Horizontal gutter preset (none px-0, sm px-3 sm:px-4, md = default responsive, lg px-6 sm:px-8 lg:px-12). Replaces `padded`; unknown values are ignored.' },
    { name: 'paddingY', type: "'none' | 'sm' | 'md' | 'lg'", description: 'Vertical padding preset (py-0, py-4 md:py-6, py-8 md:py-12, py-12 md:py-20). Unset or unknown adds none.' },
    { name: 'centered', type: 'boolean', default: 'true', description: 'Horizontally centre with mx-auto.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render, e.g. `main`.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Page content.' }],
  examples: [
    {
      title: 'Sizes',
      code: `<div class="space-y-2">
  <Container size="sm" class="bg-muted py-2 text-sm">sm</Container>
  <Container size="3xl" class="bg-muted py-2 text-sm">3xl</Container>
  <Container size="full" class="bg-muted py-2 text-sm">full</Container>
</div>`,
    },
    {
      title: 'Page wrapper',
      description: 'On a real page pass `as="main"` once. Here it renders a labelled `section`, because the docs page already has a `main`.',
      code: `<Container as="section" aria-label="Sample page" size="5xl" class="py-8">
  <h4 class="text-2xl font-semibold">Sample page title</h4>
  <p class="text-muted-foreground">Content is centred and padded.</p>
</Container>`,
    },
    {
      title: 'Prose measure',
      description: '`size="prose"` caps the line length for long-form text.',
      code: `<Container size="prose" class="bg-muted py-3 text-sm">A readable measure of roughly 65 characters per line, ideal for articles, docs and legal copy.</Container>`,
    },
    {
      title: 'Gutter presets',
      description: '`gutter` replaces `padded` with an explicit horizontal padding scale.',
      code: `<div class="space-y-2">
  <Container size="2xl" gutter="none" class="bg-muted py-2 text-sm">gutter none</Container>
  <Container size="2xl" gutter="sm" class="bg-muted py-2 text-sm">gutter sm</Container>
  <Container size="2xl" gutter="lg" class="bg-muted py-2 text-sm">gutter lg</Container>
</div>`,
    },
    {
      title: 'Vertical padding',
      description: '`paddingY` gives page content breathing room without a Section.',
      code: `<div class="space-y-2">
  <Container size="2xl" padding-y="sm" class="bg-muted text-sm">paddingY sm</Container>
  <Container size="2xl" padding-y="lg" class="bg-muted text-sm">paddingY lg</Container>
</div>`,
    },
    {
      title: 'No padding, left-aligned',
      code: `<Container size="2xl" :padded="false" :centered="false" class="bg-muted p-3 text-sm">Left-aligned, own padding</Container>`,
    },
  ],
  a11y: [
    'Renders a plain div by default; use `as="main"` for the primary landmark (only one per page) and `as="section"` with an `aria-label` for a named region.',
    'Responsive: `padded` adds 16px gutters (24px from `sm`, 32px from `lg`), the container is `w-full`, so content reflows at 320px and at 200% zoom without horizontal scroll.',
    'No interactive behaviour, no focus handling.',
  ],
  related: ['Section', 'Stack', 'Grid', 'AppShell'],
  llmNotes: [
    'Use Container for page-level width; do not hand-write mx-auto max-w-* px-* wrappers.',
    'Pass `as="main"` only once per page.',
    'Use size="prose" for long-form text; use `gutter` instead of `padded` when you need a specific gutter scale.',
    'Use `paddingY` for simple vertical padding; use Section when you also need backgrounds or dividers.',
    'Nest a Container inside a Section for full-bleed backgrounds with constrained content.',
  ],
  replaces: ['hand-rolled Container markup in app code'],
}
export default doc
