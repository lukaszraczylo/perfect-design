import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'TrendBadge',
  group: 'data-display',
  subgroup: 'Statistics',
  summary: 'Compact up / down / flat change indicator with good-or-bad colouring, Intl formatting and screen-reader text.',
  description:
    'Use `TrendBadge` next to a metric to show how it moved. `direction` picks the arrow (or is derived from the sign of `value`); `goodWhen` (or `inverse`) says which direction is desirable, so a drop in latency is green and a drop in revenue is red. The magnitude is printed without sign because the arrow carries the direction. Formatting goes through `Intl.NumberFormat` (`number`, `percent`, `compact`, `currency`). `null`, `NaN` and `Infinity` render an en dash and announce "No data". Use `KpiTile` when you need the whole tile; use this badge inside tables, lists and headings.',
  status: 'stable',
  props: [
    { name: 'direction', type: "'up' | 'down' | 'flat'", description: 'Arrow direction. Derived from the sign of `value` when omitted; invalid values are ignored.' },
    { name: 'value', type: 'number | null', description: 'Magnitude of the change (sign is not printed). Omit for an arrow-only badge; null / NaN / Infinity show `–`.' },
    { name: 'goodWhen', type: "'up' | 'down' | 'none'", default: "'up'", description: 'Which direction is good. `none` always uses the neutral colour.' },
    { name: 'inverse', type: 'boolean', default: 'false', description: 'Shorthand for `goodWhen="down"` (cost, latency, error rate).' },
    { name: 'format', type: "'number' | 'percent' | 'compact' | 'currency'", default: "'number'", description: '`percent` appends % to the value as-is (12 becomes 12%).' },
    { name: 'currency', type: 'string', description: 'ISO 4217 code for `format="currency"`; invalid codes fall back to a plain number.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale; invalid values fall back to the runtime default.' },
    { name: 'fractionDigits', type: 'number', default: '1', description: 'Maximum fraction digits (clamped to 0-20).' },
    { name: 'variant', type: "'soft' | 'solid' | 'ghost' | 'outline'", default: "'soft'", description: 'Tinted background, solid fill, text only, or bordered text. Unknown values fall back to `soft`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner radius: 6px, fully round, or none. Unknown values fall back to `rounded`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Badge size. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', props: '{ text: string; direction: TrendDirection; tone: "good" | "bad" | "neutral" }', description: 'Replace the visible value text (the screen-reader text keeps the formatted value).' },
  ],
  examples: [
    {
      title: 'Up, down and flat',
      description: 'Direction comes from the sign of the value; up is good by default. Sample data.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <TrendBadge :value="12.4" format="percent" />
  <TrendBadge :value="-3.2" format="percent" />
  <TrendBadge :value="0" format="percent" />
</div>`,
    },
    {
      title: 'Down can be good',
      description: '`inverse` / `good-when="down"` for metrics where lower is better.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <TrendBadge :value="-120" inverse><template #default="{ text }">{{ text }} ms</template></TrendBadge>
  <TrendBadge :value="8" good-when="down" format="percent" />
  <TrendBadge direction="up" :value="5" good-when="none" />
</div>`,
    },
    {
      title: 'Variants and sizes',
      code: `<div class="flex flex-wrap items-center gap-3">
  <TrendBadge variant="soft" size="sm" :value="4" />
  <TrendBadge variant="solid" :value="-4" />
  <TrendBadge variant="ghost" size="lg" :value="1500" format="compact" />
</div>`,
    },
    {
      title: 'Outline and shapes',
      description: 'Gallery of the `outline` variant and the `pill` and `square` shapes. Sample data.',
      code: `<div class="flex flex-wrap items-center gap-3">
  <TrendBadge variant="outline" :value="6" />
  <TrendBadge variant="outline" :value="-6" />
  <TrendBadge variant="soft" shape="pill" :value="6" />
  <TrendBadge variant="solid" shape="square" :value="-2" />
</div>`,
    },
    {
      title: 'Currency and missing data',
      code: `<div class="flex flex-wrap items-center gap-3">
  <TrendBadge :value="1234.5" format="currency" currency="USD" locale="en-US" :fraction-digits="2" />
  <TrendBadge :value="null" />
  <TrendBadge direction="down" />
</div>`,
    },
  ],
  a11y: [
    'The arrow is decorative (aria-hidden); a visually-hidden text states the change: "Increase of 12.4", "Decrease of 3.2", "No change" or "No data".',
    'Colour is never the only signal: direction is conveyed by the arrow and the hidden text, meaning by the text.',
    '`outline` keeps the 1px border in forced-colors mode and uses the same text tokens as `ghost`; `shape` changes only the radius.',
    'Colours come from theme tokens (success / destructive / muted) and keep contrast in light and dark mode. The number uses `tabular-nums`, and the badge never wraps (`whitespace-nowrap`).',
  ],
  related: ['KpiTile', 'StatGroup', 'Sparkline', 'Badge'],
  llmNotes: [
    'Pass the absolute magnitude or a signed number; the sign is never printed, the arrow is.',
    'Set `inverse` (or good-when="down") for cost, latency and error-rate metrics.',
    'Use `format="percent"` with percentage points (12 means 12%), not fractions.',
    'Do not pass pre-formatted strings as `value`; use the default slot for custom text.',
  ],
}
export default doc
