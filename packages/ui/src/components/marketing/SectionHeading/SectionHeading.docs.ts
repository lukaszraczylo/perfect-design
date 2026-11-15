import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SectionHeading',
  group: 'marketing',
  subgroup: 'Sections',
  summary: 'Optional eyebrow, title, description and actions that introduce a page section, in 3 alignments, 4 sizes and 2 eyebrow styles.',
  description: [
    'Use at the top of a landing or docs section so headings, spacing and alignment stay consistent. The title should state the section\'s claim, not label it ("Every part has a keyboard map", not "Features"). `level` controls the heading element for a correct outline; `size` scales the type and the max width. Not for page titles inside a Hero (Hero has its own title). Unknown `align`/`size`/`eyebrowStyle` values fall back to `left` / `md` / `text`.',
    '',
    'Options and when to use them:',
    '- `align="left"` (default): section titles above left-aligned content such as feature lists or docs.',
    '- `align="center"`: classic landing sections above centred grids (features, pricing, testimonials).',
    '- `align="right"`: end-aligned block (follows the writing direction); rare.',
    '- `size="sm"` compact subsection or sidebar heading; `md` default; `lg` hero-like section opener; `full` removes the width limit (use with a side-by-side layout).',
    '- `eyebrowStyle="text"` plain accent label in sentence case; `eyebrowStyle="pill"` bordered badge. Use an eyebrow only when it adds information the title lacks; most sections need none.',
    '- `divider` adds a short accent rule between title and description, good on text-heavy pages.',
    '- `actions` slot (or the default slot) adds buttons or links below the description.',
  ].join('\n'),
  status: 'stable',
  props: [
    { name: 'eyebrow', type: 'string', description: 'Short label above the title. Plain sentence-case text; leave it out unless it adds information the title lacks.' },
    { name: 'title', type: 'string', description: 'Heading text. Required unless the `title` slot is used.' },
    { name: 'description', type: 'string', description: 'Supporting paragraph.' },
    { name: 'align', type: "'left' | 'center' | 'right'", default: "'left'", description: 'Text alignment; center/right also position the block and actions. Unknown falls back to `left`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'", description: 'Max width (xl / 2xl / 3xl / none) and type scale. Unknown falls back to `md`.' },
    { name: 'eyebrowStyle', type: "'text' | 'pill'", default: "'text'", description: 'Eyebrow look. Unknown falls back to `text`.' },
    { name: 'divider', type: 'boolean', default: 'false', description: 'Accent rule between title and description (aria-hidden).' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading element level. Invalid values fall back to 2.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'eyebrow', description: 'Replaces the eyebrow text.' },
    { name: 'title', description: 'Replaces the title text (keep it inline content).' },
    { name: 'description', description: 'Replaces the description text.' },
    { name: 'actions', description: 'Actions row rendered below the description (buttons, links).' },
    { name: 'default', description: 'Same row as `actions` (kept for backward compatibility); rendered after it.' },
  ],
  examples: [
    {
      title: 'Minimal (left)',
      code: `<SectionHeading title="Every part has a documented keyboard map" description="Each component page lists the keys it responds to and the roles it exposes." />`,
    },
    {
      title: 'Centered with actions',
      code: `<SectionHeading align="center" size="lg" title="Pick a component, copy its example" description="Examples render live next to their code.">
  <template #actions>
    <Button>Open the catalogue</Button>
    <Button variant="outline">Read the theming guide</Button>
  </template>
</SectionHeading>`,
    },
    {
      title: 'Right aligned',
      code: `<SectionHeading align="right" title="Alignment follows the writing direction" description="In a right-to-left page this block sits on the left." />`,
    },
    {
      title: 'Small',
      code: `<SectionHeading size="sm" :level="3" title="Props and slots" description="Compact heading for sidebars and nested sections." />`,
    },
    {
      title: 'Large',
      code: `<SectionHeading size="lg" align="center" title="Nine groups cover a screen" description="From primitives to marketing sections." />`,
    },
    {
      title: 'Pill eyebrow',
      description: 'Only when the badge carries information, such as a status.',
      code: `<SectionHeading align="center" eyebrow="Beta" eyebrow-style="pill" title="This component may change" description="Beta components can change between minor versions." />`,
    },
    {
      title: 'Text eyebrow',
      code: `<SectionHeading eyebrow="Data display" eyebrow-style="text" title="Tables, charts and lists" />`,
    },
    {
      title: 'With divider',
      code: `<SectionHeading divider title="Where the components came from" description="A short accent rule separates the title from the copy." />`,
    },
    {
      title: 'Full width',
      code: `<SectionHeading size="full" title="No width limit" description="Use when the heading sits beside other content in a grid." />`,
    },
  ],
  requires: [
    'Throws a ContractError when `title` is empty and the `title` slot is not used.',
  ],
  a11y: ['Renders a real h1-h6 chosen by `level` (default h2); keep the document outline sequential. Examples on this page use `level` 3 where an h2 would skip a level.', 'The divider is aria-hidden decoration. Titles wrap long words and the block reflows at 320px; alignment uses logical values (`text-start`, `text-end`, `ms-auto`) so RTL mirrors correctly.'],
  related: ['Hero', 'FeatureGrid', 'CtaBand'],
  llmNotes: [
    'Use one SectionHeading per section; set `level` to match the page outline (usually 2).',
    'Put buttons in the `actions` slot, not in the description.',
    'Use `align="center"` for centred layouts instead of wrapping in text-center.',
    'Skip the eyebrow unless it adds information the title lacks. Use `eyebrowStyle="pill"` for status markers, `text` for category labels.',
    'Write the title as a claim about the section, not a generic label such as "Features".',
    'Use `size="lg"` for the first section after a Hero and `sm` for nested subsections.',
  ],
  replaces: ['hand-rolled SectionHeading markup in app code'],
}
export default doc
