import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Price',
  group: 'typography',
  subgroup: 'Text',
  summary: 'A locale-aware price with an optional period, a struck-through previous price and a label for free or missing amounts.',
  description:
    'Use `Price` wherever an amount of money is shown: plan cards, rate lists, order summaries. It formats with `Intl.NumberFormat` (through `formatPrice`), uses tabular figures, and never throws on bad input.\n\n' +
    'Digits: whole amounts show no fraction digits, other amounts show two, unless `minimumFractionDigits` or `maximumFractionDigits` say otherwise. `locale` defaults to the `ConfigProvider` locale, else `en-US`, never the browser locale, so server and client render the same text.\n\n' +
    'Safe fallbacks: a missing, NaN or infinite `amount` renders `fallback` (default a dash, announced as "No price"); an invalid `currency` code renders a plain number; a malformed `locale` falls back to `en-US`. `freeLabel` replaces a zero amount ("Free"). With `compareAt` the old price is struck through for sighted users and screen readers hear "Was X, now Y". The default slot replaces the amount text. For plain strings (chart labels, `aria-label`) use `formatPrice(amount, options)` exported next to the component; `significantFractionDigits` picks the digits for metered rates such as 0.0004.\n\n' +
    'Not for percentages or counts: use `FormattedNumber`. Not for a whole plan: use `PricingCard`.',
  status: 'stable',
  props: [
    { name: 'amount', type: 'number | null', description: 'Amount in major units (49.5 is 49.50). null, undefined, NaN and Infinity render `fallback`.' },
    { name: 'currency', type: 'string', default: "'USD'", description: 'ISO 4217 code (any case). An invalid code renders a plain number instead of throwing.' },
    { name: 'locale', type: 'string', default: "ConfigProvider locale, else 'en-US'", description: 'BCP 47 tag such as `de-DE`. Malformed tags fall back to `en-US`.' },
    { name: 'period', type: 'string', description: 'Text after the amount, smaller and muted, such as "/month".' },
    { name: 'compareAt', type: 'number', description: 'Previous price. Struck through before the amount; screen readers read "Was X, now Y". Ignored when `amount` is missing or `compareAt` is not finite.' },
    { name: 'notation', type: "'standard' | 'compact'", default: "'standard'", description: '`compact` shortens large amounts ("$1.2M"). Unknown values mean `standard`.' },
    { name: 'minimumFractionDigits', type: 'number', description: 'Fewest fraction digits. Default 0 for whole amounts and 2 otherwise.' },
    { name: 'maximumFractionDigits', type: 'number', description: 'Most fraction digits. Default 0 for whole amounts and 2 otherwise.' },
    { name: 'freeLabel', type: 'string', description: 'Text shown when `amount` is exactly 0, such as "Free". Unset formats the zero.' },
    { name: 'fallback', type: 'string', default: "'—'", description: 'Text for a missing or non-finite amount. The default dash is announced as "No price".' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Amount scale; the period and previous price scale with it. Unknown values fall back to `md`.' },
    { name: 'tone', type: "'default' | 'muted' | 'primary'", default: "'default'", description: 'Amount colour. Unknown values fall back to `default`.' },
    { name: 'as', type: 'string', default: "'span'", description: 'Root element tag.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Replaces the formatted amount text, for example a range such as "from" plus a number. The period and previous price still render.' }],
  examples: [
    {
      title: 'Minimal',
      description: 'A whole amount with a period. Labelled sample value.',
      code: `<div class="flex items-center gap-2">
  <span class="text-sm text-muted-foreground">Sample plan A</span>
  <Price :amount="20" period="/month" />
</div>`,
    },
    {
      title: 'Previous price and free label',
      description: 'The struck-through price is hidden from assistive technology, which reads "Was $30, now $20".',
      code: `<div class="flex flex-wrap items-baseline gap-6">
  <Price :amount="20" :compare-at="30" period="/month" />
  <Price :amount="0" free-label="Free" />
  <Price :amount="null" />
</div>`,
    },
    {
      title: 'Size',
      description: 'The period and previous price scale with the amount.',
      code: `<div class="flex flex-wrap items-baseline gap-6">
  <Price :amount="12" size="sm" period="/month" />
  <Price :amount="12" size="md" period="/month" />
  <Price :amount="12" size="lg" period="/month" />
  <Price :amount="12" size="xl" period="/month" />
</div>`,
    },
    {
      title: 'Tone',
      code: `<div class="flex flex-wrap items-baseline gap-6">
  <Price :amount="40" tone="default" />
  <Price :amount="40" tone="muted" />
  <Price :amount="40" tone="primary" />
</div>`,
    },
    {
      title: 'Locales and currencies',
      description: 'Separators, symbol position and digits follow the locale. Sample amounts.',
      code: `<dl class="grid grid-cols-[max-content_auto] gap-x-4 gap-y-1">
  <dt>en-US, USD</dt><dd><Price :amount="1234.5" size="sm" /></dd>
  <dt>de-DE, EUR</dt><dd><Price :amount="1234.5" currency="EUR" locale="de-DE" size="sm" /></dd>
  <dt>ja-JP, JPY</dt><dd><Price :amount="1500" currency="JPY" locale="ja-JP" size="sm" /></dd>
</dl>`,
    },
    {
      title: 'Compact notation and metered digits',
      description: 'Compact shortens large amounts. Explicit digits show a small per-unit rate. Sample rate.',
      code: `<div class="flex flex-wrap items-baseline gap-6">
  <Price :amount="1200000" notation="compact" size="sm" />
  <Price :amount="0.0004" :minimum-fraction-digits="4" :maximum-fraction-digits="4" size="sm" period="per sample unit" />
</div>`,
    },
    {
      title: 'Slot override',
      description: 'The default slot replaces the amount text; the period still renders.',
      code: `<Price :amount="20" period="/month"><span>From $20</span></Price>`,
    },
  ],
  a11y: [
    'Renders plain text, so screen readers read the formatted string. With `compareAt` they read "Was $30, now $20"; the visual strike-through is `aria-hidden`.',
    'A missing amount with the default dash is exposed as an image named "No price" so the dash is not read as "dash" or skipped.',
    'Strike-through is not the only signal: the "Was" text exists for assistive technology, and the previous price is also muted.',
    'Tabular figures change width only. Colours are `text-foreground`, `text-muted-foreground` and `text-primary`, covered by the contrast tests.',
    'Use `locale` that matches the page language so digits and separators read correctly.',
  ],
  llmNotes: [
    'Pass the amount as a number in major units; never pre-format it, `Price` formats it.',
    'Pass `locale` from app state, or wrap the app in `ConfigProvider`; the fallback is `en-US`, not the browser locale.',
    'Use `free-label` for zero amounts and `:compare-at` for a previous price; never hand-roll a strike-through.',
    'Use `period` for "/month" style suffixes instead of a sibling span.',
    'For metered rates under one cent pass `minimum-fraction-digits` and `maximum-fraction-digits` (or `significantFractionDigits`), otherwise 0.0004 renders as $0.00.',
    'Use `formatPrice()` for strings such as chart labels and `aria-label`.',
  ],
  related: ['FormattedNumber', 'PricingCard', 'PricingTable', 'RateCard', 'TieredPricing'],
  replaces: ['hand-rolled Intl.NumberFormat price markup', 'value.toLocaleString() currency helpers in templates'],
}
export default doc
