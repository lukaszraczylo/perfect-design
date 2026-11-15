import { faDollarSign, faServer } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'KpiTile',
  group: 'data-display',
  subgroup: 'Statistics',
  summary: 'Headline metric tile: label, value, trend delta with good/bad colouring, hint, icon and loading skeleton.',
  description:
    'Use `KpiTile` for dashboard headline numbers. `trend` (`up`/`down`/`flat`) picks the arrow; `goodWhen` says which direction is desirable so colour reflects meaning (error rate going down is good). Group tiles with `StatGroup`. Numbers are formatted for you (`12345.6` shows `12,345.6`); pass a string for pre-formatted values such as `99.9%` or `1.2 MB`. Values, deltas and the sparkline use tabular figures so columns of tiles line up. Variations: `size="compact"` for dense dashboards; `variant="inverted"` for one high-contrast hero tile; `sparkline` (array of numbers, or the `sparkline` slot) for a mini trend line; `progress` (0-100) for a bar showing usage against a target. All still accept the Card surfaces (`outline`, `elevated`, `interactive`, `ghost`, ...). For usage against a hard limit with labels use `StatBar`.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', required: true, description: 'Metric name.' },
    { name: 'value', type: 'string | number | null', description: 'Headline value; numbers are formatted, null / NaN / Infinity show `–`.' },
    { name: 'delta', type: 'string | number', description: 'Change text; numbers get a sign and formatting.' },
    { name: 'trend', type: "'up' | 'down' | 'flat'", default: "'flat'", description: 'Direction of the change (arrow icon).' },
    { name: 'goodWhen', type: "'up' | 'down' | 'none'", default: "'up'", description: 'Which direction is good. `none` always uses the neutral colour.' },
    { name: 'hint', type: 'string', description: 'Supporting text, e.g. "vs last 7 days".' },
    { name: 'icon', type: 'IconDefinition', description: 'FontAwesome icon shown top-right.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a skeleton instead of value/delta and sets aria-busy.' },
    { name: 'variant', type: "'default' | 'outline' | 'elevated' | 'interactive' | 'ghost' | 'filled' | 'with-image-header' | 'inverted'", default: "'default'", description: 'Card surface, or `inverted` = foreground background with light text. The old `accent` edge stripe was removed; a stale `accent` value renders the plain default tile.' },
    { name: 'size', type: "'default' | 'compact' | 'lg'", default: "'default'", description: '`compact` = `p-3 gap-1`, smaller label and value; `lg` = `p-6 gap-3` with a 36px value. Unknown values behave like `default`.' },
    { name: 'layout', type: "'stacked' | 'split' | 'centered'", default: "'stacked'", description: '`stacked` is the default column. `split` puts the label at the start and the value at the end of one row (delta, sparkline and progress span the full width below). `centered` centres every row. Unknown values behave like `stacked`.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Colour of the progress bar and sparkline. Unknown values fall back to `primary`.' },
    { name: 'sparkline', type: 'number[]', description: 'Values for a mini area sparkline under the delta (non-finite entries become gaps). Hidden while `loading` or when empty.' },
    { name: 'progress', type: 'number | null', description: 'Percentage 0-100 (clamped) rendered as `role="progressbar"`; null / NaN / Infinity hide it.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render (e.g. `a` for a linking tile).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'value', description: 'Replace the value text.' },
    { name: 'delta', description: 'Replace the delta text (arrow and colour remain).' },
    { name: 'hint', description: 'Replace the hint (e.g. with a Sparkline).' },
    { name: 'icon', description: 'Custom icon content.' },
    { name: 'sparkline', description: 'Replace the built-in sparkline (e.g. a custom chart); rendered below the delta row.' },
  ],
  examples: [
    {
      title: 'Basic tiles',
      description: 'Sample data.',
      code: `<StatGroup aria-label="Sample data: basic tiles">
  <KpiTile label="Requests" :value="1284" delta="+8.2%" trend="up" hint="vs previous period" />
  <KpiTile label="Error rate" value="0.4%" delta="-0.1pt" trend="down" good-when="down" />
  <KpiTile label="Queue depth" :value="37" delta="0" trend="flat" />
</StatGroup>`,
    },
    {
      title: 'Icons, sparkline and loading',
      description: 'Sample data.',
      code: `<StatGroup :columns="3" aria-label="Sample data: icons and loading">
  <KpiTile label="Traffic" value="48.2k" delta="+12%" trend="up" :icon="faDollarSign">
    <template #hint><Sparkline :data="[3, 5, 4, 7, 9, 8, 12]" area label="Traffic trend, sample data" /></template>
  </KpiTile>
  <KpiTile label="Servers" :value="12" :icon="faServer" hint="2 draining" />
  <KpiTile label="Latency p95" loading />
</StatGroup>`,
      state: () => ({ faDollarSign, faServer }),
    },
    {
      title: 'Compact',
      description: '`size="compact"` for dense dashboards. Sample data.',
      code: `<StatGroup :columns="3" aria-label="Sample data: compact tiles">
  <KpiTile size="compact" label="Requests" :value="98213" delta="+4%" trend="up" />
  <KpiTile size="compact" label="Errors" :value="12" delta="-2" trend="down" good-when="down" />
  <KpiTile size="compact" label="Latency" value="142 ms" />
</StatGroup>`,
    },
    {
      title: 'With sparkline',
      description: 'Pass `sparkline` values; the line takes the tile `tone`. Sample data.',
      code: `<StatGroup :columns="2" aria-label="Sample data: sparkline tiles">
  <KpiTile label="Throughput" value="48.2k" delta="+12%" trend="up" :sparkline="[3, 5, 4, 7, 9, 8, 12]" tone="success" />
  <KpiTile label="Retries" :value="320" :sparkline="[9, 7, 8, 5, 6, 4, 3]" />
</StatGroup>`,
    },
    {
      title: 'With progress',
      description: 'Usage against a target; `progress` is a 0-100 percentage. Sample data.',
      code: `<StatGroup :columns="2" aria-label="Sample data: progress tiles">
  <KpiTile label="Storage" value="64 GB" hint="of 100 GB" :progress="64" />
  <KpiTile label="Quota used" value="92%" hint="Nearly exhausted" :progress="92" tone="danger" />
</StatGroup>`,
    },
    {
      title: 'Sizes and layouts',
      description: 'Gallery: `size="lg"`, then `layout="split"` and `layout="centered"`. Sample data.',
      code: `<StatGroup :columns="3" aria-label="Sample data: sizes and layouts">
  <KpiTile size="lg" label="Requests" :value="98213" delta="+4%" trend="up" />
  <KpiTile layout="split" label="Queue depth" :value="37" delta="-3" trend="down" good-when="down" hint="vs yesterday" :progress="37" />
  <KpiTile layout="centered" label="Success rate" value="99.2%" delta="+0.1pt" trend="up" :sparkline="[4, 5, 5, 6, 7]" />
</StatGroup>`,
    },
    {
      title: 'Inverted',
      description: 'High-contrast tile for one headline number. The delta takes the surface text colour; the arrow and the hidden "Increase" / "Decrease" text carry the direction. Sample data.',
      code: `<StatGroup :columns="2" aria-label="Sample data: inverted tiles">
  <KpiTile variant="inverted" label="Total requests" value="1.2M" delta="+8.4%" trend="up" hint="vs previous period" :progress="72" />
  <KpiTile variant="inverted" label="Failure rate" value="2.1%" delta="-0.3pt" trend="down" good-when="down" :sparkline="[5, 4, 4, 3, 3, 2]" />
</StatGroup>`,
    },
  ],
  a11y: [
    'The delta includes visually-hidden text ("Increase:", "Decrease:", "No change:") so direction is not conveyed by colour/arrow alone.',
    '`progress` renders `role="progressbar"` with `aria-valuenow` and the label "<label> progress"; the sparkline has an `aria-label` ("<label> trend"). Neither replaces the textual value.',
    'Colour is never the only signal: tone and sentiment colours accompany an arrow icon and hidden text. Numbers use `tabular-nums`.',
    '`layout` and `size` only rearrange and rescale the same elements in the same reading order (label, value, delta, sparkline, progress); the colour pairs are unchanged. `split` is a two-column grid whose label column shrinks and wraps, so a long label never overflows at 320px.',
    'Loading sets `aria-busy` and announces "Loading" via a status region.',
    'Render with `as="a"` (or `as-child`) when the tile navigates; a plain tile is not interactive.',
  ],
  related: ['StatGroup', 'StatBar', 'Sparkline', 'Card'],
  requires: [
    'Throws a ContractError when `label` is blank.',
  ],
  llmNotes: [
    'Set `good-when="down"` for cost, latency, error rate metrics so decreases are green.',
    'Wrap tiles in StatGroup, not a hand-written grid.',
    'Pass pre-formatted strings for currency/percent; numbers only get generic grouping.',
    'Use `size="compact"` in dense grids and `variant="inverted"` for at most one hero tile per view. There is no accent stripe or gradient variant.',
    'Pass `sparkline` / `progress` props rather than custom children; use the `sparkline` slot only for a different chart.',
    'Use `loading` instead of rendering a zero while data is fetching.',
  ],
  replaces: ['hand-rolled KpiTile markup in app code'],
}
export default doc
