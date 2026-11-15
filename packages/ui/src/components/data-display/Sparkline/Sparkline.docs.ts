import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Sparkline',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Tiny inline trend (pure SVG) as a line, area, bar or win/loss strip, for tables, KPI tiles and lists.',
  description:
    'Use `Sparkline` to show the shape of a short series next to a number. It has no axes, grid or tooltips: use `LineChart` when readers need values. The rendered size is controlled with `class` (default `w-24`, height follows the viewBox aspect ratio); `width`/`height` only set the viewBox proportions. `variant` picks the form: `line`, `area`, `bar` (one bar per value from a zero baseline) or `winloss` (equal squares above the centre line for positive values, below it for negative ones; a short tick on the line for zero). NaN, Infinity and null values become gaps, a single point is drawn as a dot and a flat series is a horizontal line.',
  status: 'stable',
  props: [
    { name: 'data', type: 'number[]', required: true, description: 'Series values. Non-finite entries are skipped (gap in the line).' },
    { name: 'tone', type: "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'", default: "'chart-1'", description: 'Colour token of the line, area and dots. Unknown values fall back to chart-1.' },
    { name: 'variant', type: "'line' | 'area' | 'bar' | 'winloss'", default: "'line'", description: 'Form of the sparkline. `line` and `area` join the points (see `curve`); `bar` draws a bar per value from a zero baseline; `winloss` draws equal squares above (positive) or below (negative) a centre line. When omitted, `area` decides between `line` and `area`.' },
    { name: 'area', type: 'boolean', default: 'false', description: 'Soft fill under the line. Same as `variant="area"`; `variant` wins when both are set.' },
    { name: 'curve', type: "'linear' | 'smooth' | 'step'", default: "'linear'", description: 'How `line` and `area` join points: straight, a monotone smooth curve that never overshoots the data, or steps. Ignored by `bar` and `winloss`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Rendered width: `w-16`, `w-24` or `w-32`. `class` overrides it.' },
    { name: 'negativeTone', type: "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'", default: "'danger'", description: 'Colour token of negative values in `bar` and `winloss`. Position below the baseline is the primary cue; colour only repeats it.' },
    { name: 'strokeWidth', type: 'number', default: '1.5', description: 'Line width in viewBox units. Invalid values fall back to the default.' },
    { name: 'width', type: 'number', default: '96', description: 'ViewBox width (aspect ratio only; size the element with `class`).' },
    { name: 'height', type: 'number', default: '32', description: 'ViewBox height.' },
    { name: 'label', type: 'string', description: 'Accessible label of the image. Required (or pass `aria-label` / `aria-labelledby`); an auto-generated summary of the numbers is only the fallback when strict mode is off.' },
    { name: 'showLast', type: 'boolean', default: 'false', description: 'Emphasise the last value with a dot (`line` and `area` only).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; use it to set the rendered size (`w-32`).' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Sparkline :data="[3, 5, 4, 8, 6, 9, 7, 10]" label="Sample data: steady rise" />
  <Sparkline :data="[3, 5, 4, 8, 6, 9, 7, 10]" tone="success" area show-last label="Sample data: rise with last value marked" />
  <Sparkline :data="[10, 8, 9, 5, 6, 3]" tone="danger" class="w-32" label="Sample data: decline" />
</div>`,
    },
    {
      title: 'Variant: line, area, bar, winloss',
      description: 'Gallery of the four forms on sample data. In `winloss` the sign is the position (up or down), not the colour; the label summarises the counts.',
      code: `<div class="flex flex-wrap items-center gap-6">
  <Sparkline variant="line" :data="[3, -2, 5, 4, -1, 6, 2]" label="Sample data: line" />
  <Sparkline variant="area" :data="[3, -2, 5, 4, -1, 6, 2]" label="Sample data: area" />
  <Sparkline variant="bar" :data="[3, -2, 5, 4, -1, 6, 2]" label="Sample data: bars with negatives" />
  <Sparkline variant="winloss" :data="[1, -1, 1, 1, 0, -1, 1]" label="Sample data: wins and losses" />
</div>`,
    },
    {
      title: 'Curve and size',
      description: 'Curves for line and area, widths sm, md and lg. Sample data.',
      code: `<div class="flex flex-wrap items-center gap-6">
  <Sparkline curve="linear" size="sm" :data="[3, 8, 4, 9, 5]" label="Sample data: linear" />
  <Sparkline curve="smooth" size="md" :data="[3, 8, 4, 9, 5]" label="Sample data: smooth" />
  <Sparkline curve="step" variant="area" size="lg" :data="[3, 8, 4, 9, 5]" label="Sample data: step area" />
</div>`,
    },
    {
      title: 'In a card',
      description: 'Pair the trend with a number and a Badge; supply a meaningful `label` for screen readers. Sample data.',
      code: `<Card class="max-w-xs">
  <CardContent class="flex items-center justify-between gap-4">
    <div>
      <p class="text-sm text-muted-foreground">Sample metric</p>
      <p class="text-2xl font-semibold tabular-nums">30</p>
      <Badge variant="success">+12%</Badge>
    </div>
    <Sparkline :data="[12, 15, 14, 18, 22, 21, 26, 30]" tone="success" area show-last class="w-28" label="Sample metric rose from 12 to 30 over 8 points" />
  </CardContent>
</Card>`,
    },
    {
      title: 'Gaps and edge cases',
      code: `<div class="flex flex-wrap items-center gap-4">
  <Sparkline :data="[1, 4, Number.NaN, 6, 3, 7]" label="Sample data: series with a gap" />
  <Sparkline :data="[5]" label="Sample data: one point" />
  <Sparkline :data="[2, 2, 2, 2]" tone="muted" label="Sample data: flat series" />
  <Sparkline :data="[]" label="Sample data: no points" />
</div>`,
      state: () => ({}),
    },
  ],
  a11y: [
    'Renders `<svg role="img">` with an automatic `aria-label` summary (point count, first/last value, min and max); override with `label`.',
    'Empty data is announced as "No data". The `winloss` variant is announced as "Wins and losses: N wins, N losses, N even" and shows the sign by position (above or below the centre line), not by colour; `bar` negatives sit below a visible baseline.',
    'It is a small inline image (default `w-24`) that never widens its container; put several in a `flex-wrap` row so a phone does not scroll sideways. The trend is always paired with the number in text.',
    'Purely visual: never rely on the sparkline alone to convey a value: show the number next to it.',
  ],
  related: ['LineChart', 'KpiTile', 'StatBar'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `data` is not an array. An empty array draws nothing.',
  ],
  llmNotes: [
    'Use Sparkline for inline trends only; use LineChart when axes or tooltips are needed.',
    'Set the rendered size with `class` (`w-32 h-auto`), not with `width`/`height` (those are viewBox units).',
    'Always pair it with the actual number; pass a descriptive `label` when the trend matters.',
    'Use `variant="winloss"` for outcomes per period (pass/fail, up/down), `bar` for discrete counts and `line` or `area` for continuous trends.',
    'Choose `tone` semantically (success for good, danger for bad) rather than decoratively.',
  ],
  replaces: ['inline SVG polyline sparklines in dashboards', 'chart.js mini line charts used in KPI cards'],
}
export default doc
