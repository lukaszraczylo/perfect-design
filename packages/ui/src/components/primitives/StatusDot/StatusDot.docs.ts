import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StatusDot',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Small coloured dot that signals a state (online, failing, pending), optionally pulsing.',
  description:
    'Use `StatusDot` next to text that already names the state (a table row, a list item, a header). When the dot is the ONLY indicator pass `label` so assistive tech announces it; otherwise it is `aria-hidden`. For a labelled pill use `StatusBadge`. `pulse` adds an animated halo for live/in-progress states and is disabled automatically for users who prefer reduced motion.\n\nVariations:\n\n- `variant`: `solid` (filled, default), `ring` (filled with an outline and a gap, for the current or selected item), `outline` (hollow, for "not started" or "disabled" states) and `soft` (tinted fill with a border). `ring`, `outline` and `soft` draw a border or outline, so they stay visible in forced-colors mode where a fill alone is dropped.\n- `size`: `xs` (4px), `sm` (6px), `md` (8px, default), `lg` (10px), `xl` (12px).\n- `tone`: `neutral`, `primary`, `success`, `warning`, `danger`, `info`.\n\nThe shape is not the state: pair every variant with text or a `label`, as before.',
  status: 'stable',
  props: [
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'neutral'", description: 'Semantic colour. Unknown values fall back to neutral.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Diameter: 4px, 6px, 8px, 10px, 12px. Unknown values fall back to md.' },
    { name: 'variant', type: "'solid' | 'ring' | 'outline' | 'soft'", default: "'solid'", description: 'solid = filled; ring = filled with an outline and a gap; outline = hollow border; soft = 30% tinted fill with a border. Unknown values fall back to solid.' },
    { name: 'pulse', type: 'boolean', default: 'false', description: 'Animated halo (animate-ping); removed under prefers-reduced-motion.' },
    { name: 'label', type: 'string', description: 'Accessible name. Sets role="status" and aria-label; without it the dot is aria-hidden.' },
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [],
  examples: [
    {
      title: 'Tones and sizes',
      code: `<div class="flex items-center gap-3">
  <StatusDot tone="neutral" />
  <StatusDot tone="primary" />
  <StatusDot tone="success" />
  <StatusDot tone="warning" />
  <StatusDot tone="danger" />
  <StatusDot tone="info" />
  <StatusDot tone="success" size="sm" />
  <StatusDot tone="success" size="lg" />
</div>`,
    },
    {
      title: 'Inline with text, pulsing and labelled',
      code: `<ul class="space-y-2 text-sm">
  <li class="flex items-center gap-2"><StatusDot tone="success" pulse /> Sample service is live</li>
  <li class="flex items-center gap-2"><StatusDot tone="danger" /> Sample database is down</li>
  <li class="flex items-center gap-2"><StatusDot tone="warning" label="Degraded" /> <Badge variant="outline">Sample cache</Badge></li>
</ul>`,
    },
    {
      title: 'Variants',
      description: 'The four looks in two tones. Each dot sits next to its text; a dot alone would need a `label`.',
      code: `<ul class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
  <li class="flex items-center gap-2"><StatusDot tone="success" /> Solid</li>
  <li class="flex items-center gap-2"><StatusDot tone="danger" /> Solid</li>
  <li class="flex items-center gap-2"><StatusDot tone="success" variant="ring" /> Ring</li>
  <li class="flex items-center gap-2"><StatusDot tone="danger" variant="ring" /> Ring</li>
  <li class="flex items-center gap-2"><StatusDot tone="success" variant="outline" /> Outline</li>
  <li class="flex items-center gap-2"><StatusDot tone="danger" variant="outline" /> Outline</li>
  <li class="flex items-center gap-2"><StatusDot tone="success" variant="soft" /> Soft</li>
  <li class="flex items-center gap-2"><StatusDot tone="danger" variant="soft" /> Soft</li>
</ul>`,
    },
    {
      title: 'Sizes and pulse on every variant',
      description: 'All five sizes, then a pulsing dot of each variant. The pulse is removed under reduced motion.',
      code: `<div class="flex flex-col gap-3">
  <div class="flex items-center gap-3">
    <StatusDot tone="info" size="xs" /><StatusDot tone="info" size="sm" /><StatusDot tone="info" size="md" /><StatusDot tone="info" size="lg" /><StatusDot tone="info" size="xl" />
    <span class="text-sm text-muted-foreground">xs to xl</span>
  </div>
  <div class="flex items-center gap-3">
    <StatusDot tone="success" pulse /><StatusDot tone="success" variant="ring" pulse /><StatusDot tone="success" variant="outline" pulse /><StatusDot tone="success" variant="soft" pulse />
    <span class="text-sm text-muted-foreground">Sample live indicators</span>
  </div>
</div>`,
    },
  ],
  a11y: [
    'Decorative by default (aria-hidden="true"); pair it with visible text.',
    'With `label` it becomes role="img" with that aria-label (a static image, not a live region, so it does not interrupt screen-reader users when it re-renders). Use `role="status"` on a surrounding element if a state change must be announced.',
    'The pulse halo is aria-hidden and disabled via motion-reduce.',
    'Never rely on colour alone: always include text or a label. The `ring`, `outline` and `soft` variants change the shape as well as the colour, but the shape is not a status either.',
    '`ring`, `outline` and `soft` use an outline or border, which forced-colors mode keeps; a `solid` fill is dropped there, so keep the adjacent text.',
  ],
  related: ['StatusBadge', 'Badge', 'Spinner'],
  llmNotes: [
    'Always add visible text next to the dot or pass `label`; colour alone is not accessible.',
    'Use `tone`, not custom bg-* classes, for state colours.',
    'Use `pulse` only for live/ongoing states, sparingly.',
    'Use `variant="outline"` for inactive or not-started states and `variant="ring"` for the current item; keep `solid` for the usual status.',
  ],
  replaces: ['ad-hoc `<span class="h-2 w-2 rounded-full bg-green-500">` indicators'],
}
export default doc
