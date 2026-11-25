import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StatBar',
  group: 'data-display',
  subgroup: 'Meters',
  summary: 'Label + value + proportional bar for usage vs limit (quota, disk, budget).',
  description:
    'Use `StatBar` to show how much of a limit is consumed. It renders a caption row (label left, value text right) and a track with a `role="meter"` fill. Use `tone="auto"` to turn the bar warning/danger as it fills. Ratios are clamped to 0..100% so overflowing values never break layout; show the real numbers via `valueText`. For task progress (something completing over time) use a Progress component instead.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', required: true, description: 'Caption and accessible name of the meter.' },
    { name: 'value', type: 'number', required: true, description: 'Current value. Non-finite or negative values render as empty.' },
    { name: 'max', type: 'number', default: '100', description: 'Value that fills the bar. Must be finite and > 0, otherwise the bar is empty.' },
    { name: 'valueText', type: 'string', description: 'Right-hand text and aria-valuetext. Defaults to the rounded percentage.' },
    { name: 'tone', type: "'auto' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: '`auto` escalates to warning at `warnAt` and danger at `dangerAt`.' },
    { name: 'warnAt', type: 'number', default: '0.75', description: 'Ratio (0..1) at which `auto` turns warning.' },
    { name: 'dangerAt', type: 'number', default: '0.9', description: 'Ratio (0..1) at which `auto` turns danger.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bar thickness: 6px, 10px or 16px. Unknown values fall back to `md`.' },
    { name: 'layout', type: "'stacked' | 'inline'", default: "'stacked'", description: '`stacked` shows the caption row above the bar. `inline` puts label, bar and value on one row (the bar takes the free width). `hideLabel` always renders the bar alone. Unknown values fall back to `stacked`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'End caps of the track and fill: pill (default) or square. Unknown values fall back to `rounded`.' },
    { name: 'hideLabel', type: 'boolean', default: 'false', description: 'Hide the caption row (keep it when the surrounding UI already labels the bar).' },
    { name: 'markers', type: "Array<{ value: number; label: string; tone?: 'neutral' | 'warning' | 'danger' | 'primary'; valueText?: string }>", default: '[]', description: 'Vertical ticks on the track at `value / max`, clamped to the track (a limit, a pacing threshold). `tone` defaults to `neutral`. Each tick has `data-slot="stat-bar-marker"`, is `aria-hidden` and carries a `ring-1 ring-background` edge so it stays visible on a fill of the same tone; the meter is described by the list ("pacing 24, limit 30"), with each value formatted like the chart tooltips (`1,200,000`) or taken from the marker `valueText` (`1.2M`). A non-finite value is announced by its label alone, and `null` entries are ignored. Unset or empty renders the same markup as before.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Basic',
      description: 'Sample data.',
      code: `<div class="max-w-sm"><StatBar label="Storage" :value="42" /></div>`,
    },
    {
      title: 'Sizes, layouts and shapes',
      description: 'Gallery of `size` sm, md and lg, the `inline` layout and the `square` shape. Sample data.',
      code: `<div class="flex max-w-md flex-col gap-4">
  <StatBar size="sm" label="Small" :value="30" />
  <StatBar size="md" label="Medium" :value="50" />
  <StatBar size="lg" label="Large" :value="70" />
  <StatBar layout="inline" label="Inline" :value="45" />
  <StatBar shape="square" size="lg" label="Square" :value="60" />
</div>`,
    },
    {
      title: 'Usage against limits with auto tone',
      description: 'Sample data. The value text carries the real numbers, so the bar colour is never the only signal.',
      code: `<div class="flex max-w-sm flex-col gap-4">
  <StatBar label="Requests / day" :value="420" :max="1000" value-text="420 / 1,000" tone="auto" />
  <StatBar label="Budget / month" :value="82" tone="auto" value-text="82 / 100 units" />
  <StatBar label="Seats" :value="19" :max="20" tone="auto" value-text="19 / 20" size="sm" />
</div>`,
    },
    {
      title: 'Usage against a limit with a pacing threshold',
      description: 'Sample data. 27 of 30 with a warning tick at 24 and a danger tick at the limit, then the same bar over the limit (the fill clamps at the end, the value text keeps the real number), then a token meter with a formatted `valueText`.',
      code: `<div class="flex max-w-sm flex-col gap-4">
  <StatBar label="Requests this month" :value="27" :max="30" value-text="27 / 30" :markers="[{ value: 24, label: 'pacing from', tone: 'warning' }, { value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar label="Requests, over the limit" :value="32" :max="30" value-text="32 / 30" tone="danger" :markers="[{ value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar label="Tokens" :value="1020000" :max="1200000" value-text="1.02M / 1.2M" :markers="[{ value: 1200000, label: 'limit' }]" />
</div>`,
    },
    {
      title: 'Markers at size sm',
      description: 'The same three meters at `size="sm"`. Sample data.',
      code: `<div class="flex max-w-sm flex-col gap-4">
  <StatBar size="sm" label="Requests this month" :value="27" :max="30" value-text="27 / 30" :markers="[{ value: 24, label: 'pacing from', tone: 'warning' }, { value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar size="sm" label="Requests, over the limit" :value="32" :max="30" value-text="32 / 30" tone="danger" :markers="[{ value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar size="sm" label="Tokens" :value="1020000" :max="1200000" value-text="1.02M / 1.2M" :markers="[{ value: 1200000, label: 'limit' }]" />
</div>`,
    },
    {
      title: 'Markers in dark mode',
      description: 'Ticks use theme tokens, so they keep contrast on a dark surface. Sample data.',
      code: `<div class="dark flex max-w-sm flex-col gap-4 rounded-lg bg-background p-4 text-foreground">
  <StatBar label="Requests this month" :value="27" :max="30" value-text="27 / 30" :markers="[{ value: 24, label: 'pacing from', tone: 'warning' }, { value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar label="Requests, over the limit" :value="32" :max="30" value-text="32 / 30" tone="danger" :markers="[{ value: 30, label: 'limit', tone: 'danger' }]" />
  <StatBar label="Tokens" :value="1020000" :max="1200000" value-text="1.02M / 1.2M" :markers="[{ value: 1200000, label: 'limit' }]" />
</div>`,
    },
  ],
  a11y: [
    'Uses `role="meter"` with `aria-valuemin` 0, `aria-valuemax` 100, `aria-valuenow` (clamped 0..100), `aria-valuetext` and the label as accessible name.',
    'Colour is never the only signal: always provide `valueText` with the real numbers. The value text uses `tabular-nums`, so stacked bars line up.',
    '`layout="inline"` keeps the DOM order (label, value, then the meter) but shows the meter between them visually; the meter keeps its own `aria-label`, so the name does not depend on the row. `size`, `layout` and `shape` change geometry only.',
    'Marker ticks are decorative (`aria-hidden`, children of a meter are presentational in ARIA 1.2), and the meter is described (`aria-describedby`) by a visually hidden list of every marker, so coinciding markers keep both labels. Tone never carries the meaning alone.',
    'The fill animates its width only when reduced motion is not requested. The bar is fluid and the caption row wraps its content, so nothing overflows at 320px.',
  ],
  related: ['KpiTile', 'Sparkline', 'DonutChart'],
  requires: [
    'Throws a ContractError when `label` is blank.',
    'Throws a ContractError when `value` is not a finite number (show a skeleton or hide the bar while it loads).',
    'Throws a ContractError when `max` is not a finite number above 0.',
  ],
  llmNotes: [
    'Always pass `valueText` with the real "used / limit" numbers.',
    'Use `tone="auto"` for quotas; fixed tones only for categorical meaning.',
    'Pass `markers` for quota meters: one tick at the limit, optionally a `warning` tick where pacing starts. Keep the labels short; they are announced as the meter description.',
    'Do not use StatBar for loading progress.',
  ],
  replaces: ['hand-rolled StatBar markup in app code'],
}
export default doc
