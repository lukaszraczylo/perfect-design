import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Badge',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Small non-interactive label for status, counts and categories.',
  description:
    'Use `Badge` to label an item with a short status or category (`Beta`, `Paid`, `3 new`). It is not interactive: for removable or toggleable tags use `Chip`; for presence on an avatar use `Avatar status`.\n\nVariations:\n\n- `variant`: fixed-colour looks `default`, `secondary`, `outline`, `destructive`, `success`, `warning`, `info`, plus the tone-aware `soft`, `solid` and `outline`.\n- `tone`: `neutral | primary | success | warning | danger | info`. Pair with `soft` (tinted, the usual choice in tables and lists), `solid` (strong, for counts and "new") or `outline` (bordered). `soft` / `solid` without a tone are neutral. Ignored by the fixed-colour variants.\n- `size`: `sm` (dense tables), `md` (default), `lg`.\n- `rounded`: `default` (rounded-md), `full` (pill), `none`.\n- `dot`: leading status dot in the current text colour, for "Active" / "Offline" style statuses.\n\nWhen using `badgeVariants` outside the component, wrap the result in `cn()` so tailwind-merge drops overridden neutral colours.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'soft' | 'solid'", default: "'default'", description: 'Look. `soft`, `solid` and `outline` are tone-aware. Unknown values fall back to default.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", description: 'Semantic colour for `soft` / `solid` / `outline`. Unset = neutral (soft, solid) or plain outline. Ignored by other variants and when unknown.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size. Unknown values fall back to md.' },
    { name: 'rounded', type: "'default' | 'full' | 'none'", default: "'default'", description: 'Corner radius: rounded-md, rounded-full (pill) or none.' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'Show a small decorative dot (aria-hidden, current colour) before the content. Not rendered with `asChild`.' },
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Badge content: text, a count, or an inline icon (svg children are sized to the badge).' }],
  examples: [
    {
      title: 'Variants',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge>Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="info">Info</Badge>
</div>`,
    },
    {
      title: 'Soft tones',
      description: 'The usual status look in tables and lists: tinted background with a coloured label.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge variant="soft">Neutral</Badge>
  <Badge variant="soft" tone="primary">Primary</Badge>
  <Badge variant="soft" tone="success">Paid</Badge>
  <Badge variant="soft" tone="warning">Pending</Badge>
  <Badge variant="soft" tone="danger">Failed</Badge>
  <Badge variant="soft" tone="info">Draft</Badge>
</div>`,
    },
    {
      title: 'Solid tones',
      description: 'High emphasis; use sparingly for counts and "New".',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge variant="solid">Neutral</Badge>
  <Badge variant="solid" tone="primary">Primary</Badge>
  <Badge variant="solid" tone="success">Success</Badge>
  <Badge variant="solid" tone="warning">Warning</Badge>
  <Badge variant="solid" tone="danger">Danger</Badge>
  <Badge variant="solid" tone="info">Info</Badge>
</div>`,
    },
    {
      title: 'Outline tones',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge variant="outline">Plain</Badge>
  <Badge variant="outline" tone="neutral">Neutral</Badge>
  <Badge variant="outline" tone="primary">Primary</Badge>
  <Badge variant="outline" tone="success">Success</Badge>
  <Badge variant="outline" tone="warning">Warning</Badge>
  <Badge variant="outline" tone="danger">Danger</Badge>
  <Badge variant="outline" tone="info">Info</Badge>
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge variant="soft" tone="primary" size="sm">Small</Badge>
  <Badge variant="soft" tone="primary">Medium</Badge>
  <Badge variant="soft" tone="primary" size="lg">Large</Badge>
</div>`,
    },
    {
      title: 'Pill and square shapes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge rounded="full">Pill</Badge>
  <Badge variant="soft" tone="success" rounded="full">12</Badge>
  <Badge variant="outline" rounded="none">Square</Badge>
</div>`,
    },
    {
      title: 'Dot indicator',
      description: 'The dot uses the badge text colour, so it follows `tone`.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Badge variant="soft" tone="success" dot rounded="full">Active</Badge>
  <Badge variant="soft" tone="warning" dot rounded="full">Pending</Badge>
  <Badge variant="soft" tone="danger" dot rounded="full">Offline</Badge>
  <Badge variant="outline" dot size="lg">Default dot</Badge>
</div>`,
    },
  ],
  a11y: [
    'Badges are plain text with no role; screen readers read the content in flow.',
    'Tone colours are tested token pairs (AA contrast in light and dark); the label text, not the colour, carries the meaning.',
    'Badges never shrink below their content and use `whitespace-nowrap`: keep them to one or two words, and place them in a `flex-wrap` row so they reflow at 320px.',
    'The `dot` is aria-hidden: never rely on colour alone, always include a text label (e.g. "Offline").',
    'A dot-only badge (no content) conveys nothing to assistive tech: add `aria-label` / visually hidden text.',
  ],
  related: ['Chip', 'Avatar', 'StatusDot'],
  llmNotes: [
    'Use `variant="soft"` + `tone` for statuses in tables/lists; `solid` for counts; do not colour-code without a text label.',
    'Use `Chip`, not `Badge`, when the label must be removable or selectable.',
    'Use `rounded="full"` for pills and `dot` for presence-style statuses; do not hand-roll dots with extra spans.',
    'Do not pass `tone` expecting it to recolour `default` / `secondary` / `destructive` / `success` / `warning` / `info` variants.',
  ],
  replaces: ['shadcn-vue Badge', 'ad-hoc status pills with tinted backgrounds'],
}
export default doc
