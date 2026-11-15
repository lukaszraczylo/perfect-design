import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Heading',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Semantic h1-h6 heading with independent visual size, underline/divider decoration and optional eyebrow and description.',
  description:
    'Use `Heading` for every title. `level` decides the semantic element (h1-h6, invalid values fall back to 2) and drives the default visual size; `size` overrides the look without changing the document outline. Use `as` only when the element must not be a heading tag. Do not use for body copy (use `Text`).\n\nVariants: `default` for ordinary titles; `underline` for a short accent bar under section titles; `divider` for a full-width rule under a title that opens a section. Alignment: `align` left/center/right. Eyebrow + description: pass `eyebrow` and/or `description` (or the same-named slots) and the heading is wrapped in a `heading-group` block (eyebrow above, paragraph below); `class` and attributes still go to the heading element itself, `groupClass` to the wrapper. Use that for page and section headers.',
  status: 'stable',
  props: [
    { name: 'level', type: "1 | 2 | 3 | 4 | 5 | 6 | '1'..'6'", default: '2', description: 'Semantic level. Renders h1-h6. Invalid values fall back to 2.' },
    { name: 'size', type: "'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'", default: 'by level (1: 4xl, 2: 3xl, 3: 2xl, 4: xl, 5: lg, 6: md)', description: 'Visual size, independent of level. Unknown values fall back to the level default.' },
    { name: 'weight', type: "'normal' | 'medium' | 'semibold' | 'bold'", default: "'semibold'", description: 'Font weight.' },
    { name: 'tone', type: "'default' | 'muted' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Text colour. `default` inherits.' },
    { name: 'variant', type: "'default' | 'underline' | 'divider'", default: "'default'", description: 'Decoration. `underline` adds a short accent bar (override with `after:bg-*`), `divider` adds a full-width bottom border. Unknown values fall back to `default`.' },
    { name: 'align', type: "'left' | 'center' | 'right'", description: 'Text alignment. With an eyebrow/description it aligns the whole group and keeps the underline bar aligned. Not set by default.' },
    { name: 'eyebrow', type: 'string', description: 'Small plain label above the heading (use only when it adds information the heading lacks); wraps the heading in a `heading-group`. The `eyebrow` slot overrides it.' },
    { name: 'eyebrowTone', type: "'primary' | 'muted'", default: "'primary'", description: 'Colour of the eyebrow.' },
    { name: 'description', type: 'string', description: 'Muted supporting paragraph below the heading; wraps it in a `heading-group`. Size scales with the heading size. The `description` slot overrides it.' },
    { name: 'groupClass', type: 'string | object | array', description: 'Classes for the `heading-group` wrapper (only rendered with an eyebrow/description). Merged last, e.g. `gap-4`.' },
    { name: 'balance', type: 'boolean', default: 'false', description: 'Applies text-wrap: balance for even line lengths.' },
    { name: 'as', type: 'string | Component', description: 'Element to render instead of h1-h6; styling is kept.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Heading content.' },
    { name: 'eyebrow', description: 'Eyebrow content (overrides the `eyebrow` prop).' },
    { name: 'description', description: 'Description content (overrides the `description` prop); may contain links or inline markup.' },
  ],
  examples: [
    {
      title: 'Levels',
      code: `<div class="space-y-3">
  <Heading :level="1">Heading 1</Heading>
  <Heading :level="2">Heading 2</Heading>
  <Heading :level="3">Heading 3</Heading>
  <Heading :level="4">Heading 4</Heading>
  <Heading :level="5">Heading 5</Heading>
  <Heading :level="6">Heading 6</Heading>
</div>`,
    },
    {
      title: 'Semantic level vs visual size',
      description: 'An h1 can look small and an h3 can look large without breaking the outline.',
      code: `<div class="space-y-3">
  <Heading :level="4" size="xl" tone="muted">Quiet title</Heading>
  <Heading :level="5" size="5xl" weight="bold" balance>Balanced display statement that wraps evenly</Heading>
  <Heading as="div" size="lg" tone="primary">Not a heading element</Heading>
</div>`,
    },
    {
      title: 'Underline accent',
      description: 'Short accent bar under section titles; it follows align.',
      code: `<div class="space-y-6">
  <Heading variant="underline">Section title</Heading>
  <Heading variant="underline" align="center" class="after:bg-success">Centered title</Heading>
</div>`,
    },
    {
      title: 'Divider',
      description: 'Full-width rule under a title that opens a section.',
      code: `<Heading :level="4" variant="divider">Sample section</Heading>`,
    },
    {
      title: 'Alignment',
      code: `<div class="space-y-3">
  <Heading align="left">Left</Heading>
  <Heading align="center">Center</Heading>
  <Heading align="right">Right</Heading>
</div>`,
    },
    {
      title: 'Eyebrow and description',
      description: 'Props are the quick path; the group wraps eyebrow, heading and description.',
      code: `<Heading :level="4" size="4xl" eyebrow="Typography" description="Eyebrow above, description below, both optional.">
  Sample heading
</Heading>`,
    },
    {
      title: 'Centered header with slots',
      description: 'Slots allow rich markup; groupClass tunes the wrapper, eyebrowTone the label colour.',
      code: `<Heading :level="4" size="5xl" align="center" eyebrow-tone="muted" group-class="gap-4">
  <template #eyebrow>Sample label</template>
  Sample centered heading
  <template #description>Sample description with a <a class="underline" href="/guides/getting-started">sample link</a>.</template>
</Heading>`,
    },
  ],
  a11y: ['Renders real h1-h6 elements; keep one h1 per page and do not skip levels.', 'Use `size` rather than a different `level` to change appearance.', 'The eyebrow and description are separate elements (p) next to the heading, so the heading text itself stays the accessible name.', 'Heading text always uses solid token colours; `tone="warning"` switches to the dark warning ink in light mode so it stays AA.', 'In examples and pages, start nested headings one level below the surrounding section so the outline never jumps (h2 then h3, not h2 then h4).'],
  related: ['Text', 'Eyebrow', 'Lead', 'Prose'],
  llmNotes: ['Choose `level` for document structure, `size` for looks.', 'One h1 per page.', 'Do not set font sizes with raw classes; use `size`.', 'Use `description` instead of stacking Heading + Text by hand.', 'Use `eyebrow` only when it adds information the heading lacks.'],
  replaces: ['ad-hoc h1-h6 with text-* classes across apps'],
}
export default doc
