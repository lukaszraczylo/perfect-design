import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StatusBadge',
  group: 'primitives',
  subgroup: 'Status',
  summary: 'Badge that maps a raw status string (active, pending, failed...) to a tone, with a leading dot.',
  description:
    'Use `StatusBadge` to display backend status values without writing a status-to-colour map in every view. Statuses are matched case-insensitively after trimming and normalising spaces and dashes to underscores, so `In Progress`, `in-progress` and `IN_PROGRESS` all match `in_progress`. Built-in groups: success (active, online, healthy, ok, success, completed, approved, ...), warning (pending, warning, degraded, queued, paused, ...), info (running, in_progress, processing, new, draft, info, ...), danger (error, failed, offline, down, rejected, critical, unhealthy, ...), anything else neutral. `null`/empty renders "Unknown". Override with `tones`, or reuse the logic with the exported `statusTone(status, overrides?)` and `statusBadgeDefaultTones`.\n\nVariations:\n\n- `variant`: `soft` (default: tinted success, warning and info, filled danger, secondary neutral), `outline` (bordered, tone-coloured text), `solid` (filled with the tone colour) and `plain` (tone-coloured dot and text with no border, fill or side padding, for dense tables and lists).\n- `size`: `sm`, `md` (default), `lg`. The dot scales with the text (4px, 6px, 8px).\n- `shape`: `rounded` (default, rounded-md), `pill` (fully round), `square` (no radius).\n\nThe status text is always rendered, whatever the variant: the tone colour never carries the status alone.',
  status: 'stable',
  props: [
    { name: 'status', type: 'string | null', description: 'Raw status value. null/undefined/empty renders "Unknown" in the neutral tone.' },
    { name: 'tones', type: "Record<string, 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'>", description: 'Overrides of the built-in map. Keys are normalised like the status; invalid tones are ignored.' },
    { name: 'label', type: 'string', description: 'Text to show. Defaults to the humanised status (`in_progress` -> `In progress`).' },
    { name: 'variant', type: "'soft' | 'outline' | 'solid' | 'plain'", default: "'soft'", description: 'Look. soft = the original tinted/filled badges; outline = border and tone text; solid = tone fill; plain = text and dot only. Unknown values fall back to soft.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Badge text and padding size; the dot follows (4px, 6px, 8px). Unknown values fall back to md.' },
    { name: 'shape', type: "'pill' | 'rounded' | 'square'", default: "'rounded'", description: 'Corner radius: rounded-full, rounded-md or none. Unknown values fall back to rounded.' },
    { name: 'dot', type: 'boolean', default: 'true', description: 'Show the leading status dot.' },
    { name: 'pulse', type: 'boolean', default: 'false', description: 'Animate the dot (live / in-progress states; reduced-motion safe).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the badge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces the label text.', props: '{ label: string; tone: Tone }' }],
  examples: [
    {
      title: 'Built-in statuses',
      code: `<div class="flex flex-wrap gap-2">
  <StatusBadge status="active" />
  <StatusBadge status="pending" />
  <StatusBadge status="in_progress" pulse />
  <StatusBadge status="failed" />
  <StatusBadge status="draft" />
  <StatusBadge status="archived" />
  <StatusBadge :status="null" />
</div>`,
    },
    {
      title: 'Overrides, labels and no dot',
      code: `<div class="flex flex-wrap items-center gap-2">
  <StatusBadge status="running" :tones="{ running: 'success' }" label="Live" pulse />
  <StatusBadge status="decommissioned" :tones="{ decommissioned: 'danger' }" :dot="false" />
  <StatusBadge status="quarantined" label="Isolated" />
  <StatusBadge status="CUSTOM-STATE" :tones="{ custom_state: 'primary' }" />
</div>`,
    },
    {
      title: 'Variants',
      description: 'The four looks for the same four statuses.',
      code: `<div class="flex flex-col gap-3">
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge status="active" /><StatusBadge status="pending" /><StatusBadge status="failed" /><StatusBadge status="running" /><StatusBadge status="archived" />
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge variant="outline" status="active" /><StatusBadge variant="outline" status="pending" /><StatusBadge variant="outline" status="failed" /><StatusBadge variant="outline" status="running" /><StatusBadge variant="outline" status="archived" />
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge variant="solid" status="active" /><StatusBadge variant="solid" status="pending" /><StatusBadge variant="solid" status="failed" /><StatusBadge variant="solid" status="running" /><StatusBadge variant="solid" status="archived" />
  </div>
  <div class="flex flex-wrap items-center gap-4">
    <StatusBadge variant="plain" status="active" /><StatusBadge variant="plain" status="pending" /><StatusBadge variant="plain" status="failed" /><StatusBadge variant="plain" status="running" /><StatusBadge variant="plain" status="archived" />
  </div>
</div>`,
    },
    {
      title: 'Sizes and shapes',
      description: 'Sizes small to large, then the three corner shapes.',
      code: `<div class="flex flex-col gap-3">
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge size="sm" status="active" /><StatusBadge status="active" /><StatusBadge size="lg" status="active" />
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <StatusBadge shape="pill" status="pending" /><StatusBadge shape="rounded" status="pending" /><StatusBadge shape="square" status="pending" />
    <StatusBadge shape="pill" variant="outline" size="lg" status="running" pulse />
  </div>
</div>`,
    },
  ],
  a11y: [
    'The status is conveyed by text, not colour; the dot is aria-hidden. Every variant renders the text, including `plain`.',
    '`solid` keeps a border in forced-colors mode, where fills are dropped. The tone colours are tested token pairs (tinted, outline and plain text on the page background, foreground colours on solid fills).',
    'Keep the label meaningful when you override it (screen readers read the label only).',
    'The pulsing halo is disabled under prefers-reduced-motion.',
  ],
  related: ['Badge', 'StatusDot', 'Progress'],
  llmNotes: [
    'Pass the raw backend status to `status`; do not pre-map to variants.',
    'Add app-specific statuses via `tones`, not new components.',
    'Use `statusTone(status)` when you need the tone outside the badge (row colour, icon).',
    'Do not use for counts or categories; use Badge.',
    'Use `variant="plain"` for dense tables, `variant="outline"` on tinted surfaces, `variant="solid"` sparingly; do not drop the text.',
  ],
  replaces: ['per-view statusVariant maps'],
}
export default doc
