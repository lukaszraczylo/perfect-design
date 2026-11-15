import { faClock, faDownload, faUsers } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

// Numbers are facts reproducible from this repository, or visibly sample values.
const items = [
  { value: 170, label: 'Components', description: 'Counted from the catalogue' },
  { value: 9, label: 'Groups', description: 'From primitives to marketing' },
  { value: 1200, label: 'Sample count', suffix: '+', description: 'Replace with a sourced number' },
]
const trendItems = [
  { value: 120, label: 'Sample metric A', trend: 'up' as const, change: '+12' },
  { value: 80, label: 'Sample metric B', trend: 'flat' as const, change: '0' },
  { value: 40, label: 'Sample metric C', suffix: ' per week', trend: 'down' as const, change: '-8' },
]
const iconItems = [
  { value: 170, label: 'Components', icon: faUsers },
  { value: 9, label: 'Groups', icon: faClock },
  { value: 40, label: 'Sample value', icon: faDownload },
]
const short = [
  { value: 170, label: 'Components' },
  { value: 9, label: 'Groups' },
  { value: '24/7', label: 'Sample text value' },
]

const doc: ComponentDoc = {
  name: 'StatGrid',
  group: 'marketing',
  subgroup: 'Stats',
  summary: 'Headline numbers with labels in five layouts, optional icons and trend indicators. Numbers are static.',
  description:
    'Use to show 2-4 numbers you can source, next to the claim they support. A banner of big numbers with no source is a stock look, so only list figures you can reproduce. Numeric values render through `StatCounter` (static, tabular figures); string values (for example "24/7") are shown as-is. Uses a `<dl>` so labels and values are programmatically related. Variants: `plain` (default: bare numbers, no boxes), `cards` (bordered cards), `divided` (one panel with hairline dividers), `inline` (compact single row), `with-icons` (bare icon above each number). Any item can carry a `trend` and `change` for dashboards. The count-up animation was removed; the `animate` prop is accepted and ignored.',
  status: 'stable',
  props: [
    {
      name: 'items',
      type: 'StatItem[]',
      default: '[]',
      description: '`{ value: number | string, label, prefix?, suffix?, decimals?, description?, icon?, trend?: "up" | "down" | "flat", change?: string }`.',
    },
    {
      name: 'variant',
      type: "'plain' | 'cards' | 'divided' | 'inline' | 'with-icons'",
      default: "'plain'",
      description: 'Layout. Unknown values fall back to `plain`.',
    },
    { name: 'columns', type: '2 | 3 | 4', default: '4', description: 'Columns from `sm` up (4 uses 2 on `sm`, 4 on `lg`). Invalid falls back to 4. Ignored by `inline`.' },
    { name: 'align', type: "'left' | 'center'", description: 'Text alignment. Default depends on the variant: `left` for `cards` and `with-icons`, otherwise `center`. Invalid values use that default.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Figure size (`text-2xl`, `text-4xl`, `text-5xl`; `inline` uses `text-xl`, `text-2xl`, `text-3xl`). `cards` and `divided` scale their padding too. Unknown values fall back to `md`. Exposed as `data-size`.' },
    { name: 'tone', type: "'default' | 'primary'", default: "'default'", description: 'Figure colour: foreground, or the accent. Unknown values fall back to `default`. Exposed as `data-tone`.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Spacing between stats. `md` keeps each variant\'s own spacing. `divided` draws its cell borders with a 1px gap and ignores it. Unknown values fall back to `md`. Exposed as `data-gap`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'Corners of `cards` and `divided`. Unknown values fall back to `rounded`. Exposed as `data-shape`.' },
    { name: 'animate', type: 'boolean', description: 'Deprecated no-op. The count-up animation was removed; numbers are always static.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  examples: [
    { title: 'Plain (default)', code: `<StatGrid :columns="3" :items="short" />`, script: `const short = [{ value: 170, label: 'Components' }, ...]`, state: () => ({ short }) },
    { title: 'With descriptions', code: `<StatGrid :columns="3" :items="items" />`, script: `const items = [{ value: 170, label: 'Components', description: 'Counted from the catalogue' }, ...]`, state: () => ({ items }) },
    { title: 'Variant cards', code: `<StatGrid variant="cards" :columns="3" :items="short" />`, script: `const short = [...]`, state: () => ({ short }) },
    { title: 'Variant divided', code: `<StatGrid variant="divided" :columns="3" :items="short" />`, script: `const short = [...]`, state: () => ({ short }) },
    { title: 'Variant inline', code: `<StatGrid variant="inline" :items="short" />`, script: `const short = [...]`, state: () => ({ short }) },
    { title: 'Variant with-icons', code: `<StatGrid variant="with-icons" :columns="3" :items="iconItems" />`, script: `const iconItems = [{ value: 170, label: 'Components', icon: faUsers }, ...]`, state: () => ({ iconItems }) },
    {
      title: 'Trend indicators on cards',
      description: 'The arrow is decorative; screen readers hear "Up", "Down" or "No change" followed by the change text.',
      code: `<StatGrid variant="cards" :columns="3" :items="trendItems" />`,
      script: `const trendItems = [{ value: 120, label: 'Sample metric A', trend: 'up', change: '+12' }, ...]`,
      state: () => ({ trendItems }),
    },
    {
      title: 'Sizes',
      description: '`size` scales the figures; boxed variants scale their padding too.',
      code: `<div class="grid gap-8">
  <StatGrid variant="cards" size="sm" :columns="3" :items="short" />
  <StatGrid variant="cards" size="lg" :columns="3" :items="short" />
</div>`,
      script: `const short = [...]`,
      state: () => ({ short }),
    },
    { title: 'Tone primary and a loose gap', code: `<StatGrid tone="primary" gap="lg" :columns="3" :items="short" />`, script: `const short = [...]`, state: () => ({ short }) },
    { title: 'Square corners', code: `<StatGrid variant="divided" shape="square" :columns="3" :items="short" />`, script: `const short = [...]`, state: () => ({ short }) },
    { title: 'Left-aligned with-icons in 2 columns', code: `<StatGrid variant="with-icons" align="left" :columns="2" :items="iconItems.slice(0, 2)" />`, script: `const iconItems = [...]`, state: () => ({ iconItems }) },
  ],
  requires: [
    'Throws a ContractError when an item has an empty `label`, or a `value` that is not a finite number or a non-empty string (the first one is named by index).',
  ],
  a11y: [
    'Renders dl/dt/dd, so each label is programmatically tied to its value. Numbers are plain text with `tabular-nums`; there is no animation, live region or aria-hidden duplicate.',
    'Trend arrows and icons are aria-hidden; the trend direction is announced through sr-only text ("Up", "Down", "No change") before the change text, and colour is never the only signal.',
    'Columns collapse to one on phones (`grid-cols-1`), so it reflows at 320px. Alignment uses `text-start`, so RTL mirrors.',
  ],
  related: ['StatCounter', 'SectionHeading', 'Testimonial'],
  llmNotes: [
    'Only list numbers you can source or reproduce. Do not invent metrics.',
    'Use numbers for formatted values, strings for pre-formatted ones.',
    'Keep 2-4 items and place them next to the claim they support.',
    'Do not pass `animate`; the count-up was removed.',
    'Default `plain` has no boxes. Pick `cards` or `divided` on tinted backgrounds, `inline` for a one-line strip, `with-icons` when each stat has a clear symbol.',
    'Pass `icon` as an IconDefinition object; it only renders in `with-icons`.',
    'Use `trend` with `change` text; never encode direction by colour alone (the component already adds sr-only text).',
  ],
  replaces: ['hand-rolled StatGrid markup in app code'],
}
export default doc
