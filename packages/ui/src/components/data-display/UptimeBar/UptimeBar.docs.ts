import type { ComponentDoc } from '../../../docs-types'

const STATE = "'up' | 'degraded' | 'down' | 'unknown'"

const doc: ComponentDoc = {
  name: 'UptimeBar',
  group: 'data-display',
  subgroup: 'Status',
  summary: 'Row of segments, one per check or period, each marked up, degraded, down or unknown, for status pages.',
  description:
    'Use `UptimeBar` to show the history of one service as a strip: one segment per check (or per day), oldest first. Each segment is `up` (success), `degraded` (warning), `down` (destructive) or `unknown` (muted track). Segments share the width, with a 1px minimum, so 90 days or 200 checks fit a phone; above 100 segments the gap between them is dropped. The strip is one image with a text alternative: "API: 28 checks: 26 up, 1 degraded, 1 down", and the same counts show as a visible summary line, so state never relies on colour alone. Each segment has a native tooltip with its `label` and state name. Pass `summary` (or the `summary` slot) for your own line, such as an uptime percentage you computed. Not a chart for numeric values (use `Sparkline` or `BarChart`) and not a single indicator (use `StatusDot`).',
  status: 'stable',
  props: [
    { name: 'segments', type: `{ state: ${STATE}; label?: string }[]`, required: true, description: 'One entry per check or period, oldest first. Unknown states are drawn as `unknown`. An empty array shows `emptyText`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the image, e.g. "API checks, last 28 days". Required (or pass `aria-label` / `aria-labelledby`).' },
    { name: 'stateLabels', type: `Partial<Record<${STATE}, string>>`, description: 'Replaces the state names in tooltips and the summary. English defaults: up, degraded, down, unknown. Blank values are ignored.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Segment height: 16px, 32px or 48px. Unknown values fall back to `md`.' },
    { name: 'summary', type: 'string', description: 'Replaces the generated summary in the visible line and the accessible name.' },
    { name: 'hideSummary', type: 'boolean', default: 'false', description: 'Hide the visible summary line; the accessible name still carries it.' },
    { name: 'emptyText', type: 'string', default: "'No checks yet'", description: 'Shown when there are no segments.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  slots: [{ name: 'summary', props: '{ total: number; counts: Record<state, number>; text: string }', description: 'Replaces the visible summary line. The accessible name is unchanged; use `summary` to change both.' }],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<UptimeBar label="Sample service, last 6 checks" :segments="[{ state: 'up' }, { state: 'up' }, { state: 'degraded' }, { state: 'up' }, { state: 'down' }, { state: 'up' }]" />`,
    },
    {
      title: 'Status page row (28 days)',
      description: 'Deterministic sample data with a label per day, translated state names and a computed summary line.',
      script: `const days = Array.from({ length: 28 }, (_, i) => ({ state: i === 9 ? 'down' : i === 17 || i === 18 ? 'degraded' : 'up', label: 'Day ' + (i + 1) }))`,
      code: `<div class="flex max-w-xl flex-col gap-2">
  <div class="flex items-baseline justify-between text-sm"><span class="font-medium">Sample API</span><span class="text-muted-foreground">Sample data</span></div>
  <UptimeBar label="Sample API, last 28 days" :segments="days" />
</div>`,
      state: () => ({ days: Array.from({ length: 28 }, (_, i) => ({ state: i === 9 ? 'down' : i === 17 || i === 18 ? 'degraded' : 'up', label: 'Day ' + (i + 1) })) }),
    },
    {
      title: 'Sizes, 200 segments and translated states',
      description: 'Dense strips drop the gap. `stateLabels` translates the tooltips and the summary.',
      code: `<div class="flex max-w-xl flex-col gap-4">
  <UptimeBar size="sm" label="Sample data: 200 checks" :segments="Array.from({ length: 200 }, (_, i) => ({ state: i % 50 === 7 ? 'down' : 'up' }))" />
  <UptimeBar size="lg" label="Beispieldaten" :state-labels="{ up: 'in Betrieb', degraded: 'eingeschränkt', down: 'ausgefallen', unknown: 'unbekannt' }" :segments="[{ state: 'up' }, { state: 'degraded' }, { state: 'down' }, { state: 'unknown' }]" empty-text="Noch keine Prüfungen" />
</div>`,
    },
    {
      title: 'Empty',
      code: `<UptimeBar label="Sample service" :segments="[]" />`,
    },
  ],
  a11y: [
    'The strip is a `role="img"` named "<label>: <summary>", so a screen reader gets the counts without 200 separate stops. Segments are not focusable.',
    'State never relies on colour alone: the summary line shows the counts as text and each segment has a native tooltip with its label and state name. Touch and keyboard users read the summary.',
    'The success, warning and destructive fills and the muted track are semantic tokens, checked in every theme. No animation.',
    'Direction-neutral: the row follows the document direction, so right-to-left shows the oldest segment on the right.',
  ],
  related: ['StatusDot', 'StatusBadge', 'Sparkline', 'StatBar'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `segments` is not an array. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `segments` oldest first, one per check or period; add `label` (time or day) so tooltips are useful.',
    'Always set `label`; compute figures such as an uptime percentage yourself and pass them as `summary`.',
    'Translate state names with `stateLabels`; use `StatusDot` for one current state instead.',
    'Do not invent uptime numbers in examples; label sample data as sample.',
  ],
  replaces: ['hand-rolled div strips of coloured status squares'],
}
export default doc
