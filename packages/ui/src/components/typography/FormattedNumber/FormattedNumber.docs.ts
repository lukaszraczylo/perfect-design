import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'FormattedNumber',
  group: 'typography',
  subgroup: 'Text',
  summary: 'A locale-aware number, percentage, currency amount, unit or compact figure rendered with Intl.NumberFormat, with tabular figures and bidi isolation.',
  description:
    'Use `FormattedNumber` wherever a figure is shown to people: prices, deltas, counts, durations, table cells. It wraps `Intl.NumberFormat`, accepts numbers, bigints and numeric strings (formatted exactly, no float rounding), and never throws on bad input.\n\n' +
    'The number-format "style" is the prop `format` (`decimal`, `percent`, `currency`, `unit`, `compact`), not `style`: in Vue `style` is the inline-style attribute, and a static `style="percent"` is compiled into an empty style object before the component sees it. A dynamic `:style="\'percent\'"` string that names one of the five formats is still accepted as an alias (for code written against the Intl option name), but write `format`. `format="compact"` is decimal style with compact notation ("1.2K"); an explicit `notation` wins over it.\n\n' +
    '`locale` defaults to `en`, not the browser locale, so server and client render identical text; pass the app locale explicitly. Safe fallbacks (nothing throws): a value that is NaN, Infinity, blank or non-numeric renders `fallback` (default `n/a`); `format="currency"` without a valid `currency`, or `format="unit"` without `unit`, renders plain decimal (and throws a ContractError in strict mode, see `requires`); a malformed `currency` code renders plain decimal; an unknown `unit` renders the plain number followed by the unit text; a malformed `locale` falls back to `en`; fraction digits are clamped to 0 to 20 and `maximumFractionDigits` is raised to `minimumFractionDigits` when smaller. `-0` is shown as `0`. A small negative that rounds to zero ("-0") needs `signDisplay="negative"`.\n\n' +
    '`tone="positive"`, `"negative"` and `"auto"` (from the sign of the value) add colour AND a visible sign (`signDisplay` defaults to `exceptZero` for them), so colour is never the only signal. Use `formatNumber(value, options)` (exported next to the component) for plain strings such as chart labels or `aria-label`s.',
  status: 'stable',
  props: [
    { name: 'value', type: 'number | bigint | string', required: true, description: 'The figure. Numeric strings (`"1234.5"`, `"1e3"`) and bigints are formatted exactly. NaN, Infinity, blank and non-numeric values render `fallback`.' },
    { name: 'format', type: "'decimal' | 'percent' | 'currency' | 'unit' | 'compact'", default: "'decimal'", description: 'Number-format style (the Intl `style` option; named `format` because `style` is the Vue inline-style attribute). `percent` multiplies by 100 (0.25 is 25%). `currency` needs `currency`, `unit` needs `unit`. `compact` is decimal with compact notation. Unknown values fall back to `decimal`.' },
    { name: 'currency', type: 'string', description: 'ISO 4217 code such as `EUR` (any case). Required for `format="currency"`. A malformed code renders plain decimal.' },
    { name: 'unit', type: 'string', description: 'Intl sanctioned unit such as `kilometer`, `liter`, `kilometer-per-hour`. Required for `format="unit"`. An unknown unit renders the number then the unit text.' },
    { name: 'notation', type: "'standard' | 'compact' | 'scientific' | 'engineering'", description: 'Notation. Defaults to `compact` for `format="compact"`, else `standard`. Unknown values are ignored.' },
    { name: 'minimumFractionDigits', type: 'number', description: 'Fewest fraction digits, 0 to 20 (clamped).' },
    { name: 'maximumFractionDigits', type: 'number', description: 'Most fraction digits, 0 to 20 (clamped); raised to `minimumFractionDigits` when smaller.' },
    { name: 'signDisplay', type: "'auto' | 'always' | 'never' | 'exceptZero' | 'negative'", description: 'When to show a sign. Defaults to `auto`, or `exceptZero` for the tones `positive`, `negative` and `auto` so the sign backs up the colour.' },
    { name: 'locale', type: 'string', default: "'en'", description: 'BCP 47 tag (`de-DE`, `ar-EG`). Malformed tags fall back to `en`. Never defaults to the runtime locale, so SSR and hydration agree.' },
    { name: 'fallback', type: 'string', default: "'n/a'", description: 'Text for an invalid value. Sets `data-invalid="true"` on the root.' },
    { name: 'tabular', type: 'boolean', default: 'true', description: 'Equal-width figures (`tabular-nums`) so numbers in a column line up.' },
    { name: 'isolate', type: 'boolean', default: 'true', description: 'Wrap the text in a `<bdi>` so a number or its sign never reorders inside right-to-left or mixed-direction text.' },
    { name: 'variant', type: "'plain' | 'mono' | 'outline'", default: "'plain'", description: '`plain` inherits the font, `mono` uses the monospace font, `outline` draws a hairline box. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'inherit' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl'", default: "'inherit'", description: 'Font size; `inherit` keeps the surrounding size. Unknown values fall back to `inherit`.' },
    { name: 'tone', type: "'default' | 'muted' | 'positive' | 'negative' | 'auto'", default: "'default'", description: '`muted` secondary colour. `positive` (success) and `negative` (destructive) colour the text and show a sign. `auto` picks positive, negative or default from the sign of the value. An invalid value never gets a status colour.' },
    { name: 'weight', type: "'normal' | 'medium' | 'semibold' | 'bold'", description: 'Font weight. Unset inherits.' },
    { name: 'as', type: 'string', default: "'span'", description: 'Root element tag (`span`, `strong`, `div`, `td`...).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Formats',
      description: 'Decimal, percent, currency, unit and compact from the same component.',
      code: `<dl class="grid grid-cols-[max-content_auto] gap-x-4 gap-y-1">
  <dt>Decimal</dt><dd><FormattedNumber :value="1234567.891" /></dd>
  <dt>Percent</dt><dd><FormattedNumber :value="0.256" format="percent" :maximum-fraction-digits="1" /></dd>
  <dt>Currency</dt><dd><FormattedNumber :value="1499.5" format="currency" currency="EUR" /></dd>
  <dt>Unit</dt><dd><FormattedNumber :value="42.5" format="unit" unit="kilometer-per-hour" /></dd>
  <dt>Compact</dt><dd><FormattedNumber :value="1234567" format="compact" /></dd>
</dl>`,
    },
    {
      title: 'Locales',
      description: 'The locale controls separators, digits, currency placement and text direction.',
      code: `<dl class="grid grid-cols-[max-content_auto] gap-x-4 gap-y-1">
  <dt>de-DE</dt><dd><FormattedNumber :value="1234567.891" locale="de-DE" format="currency" currency="EUR" /></dd>
  <dt>ja-JP</dt><dd><FormattedNumber :value="1234567" locale="ja-JP" format="currency" currency="JPY" /></dd>
  <dt>fr-FR</dt><dd><FormattedNumber :value="0.075" locale="fr-FR" format="percent" :maximum-fraction-digits="1" /></dd>
  <dt>ar-EG</dt><dd dir="rtl"><FormattedNumber :value="-1234.5" locale="ar-EG" /></dd>
</dl>`,
    },
    {
      title: 'Notation and fraction digits',
      code: `<dl class="grid grid-cols-[max-content_auto] gap-x-4 gap-y-1">
  <dt>Compact</dt><dd><FormattedNumber :value="1500000" notation="compact" :maximum-fraction-digits="1" /></dd>
  <dt>Scientific</dt><dd><FormattedNumber :value="123456" notation="scientific" /></dd>
  <dt>Engineering</dt><dd><FormattedNumber :value="123456" notation="engineering" /></dd>
  <dt>Fixed 2 digits</dt><dd><FormattedNumber :value="3" :minimum-fraction-digits="2" /></dd>
  <dt>Rounded</dt><dd><FormattedNumber :value="3.14159" :maximum-fraction-digits="0" /></dd>
</dl>`,
    },
    {
      title: 'Deltas with sign and tone',
      description: 'Colour is backed by an explicit sign, so it still reads in monochrome.',
      code: `<div class="flex flex-wrap gap-4">
  <FormattedNumber :value="0.124" format="percent" tone="auto" :maximum-fraction-digits="1" />
  <FormattedNumber :value="-0.087" format="percent" tone="auto" :maximum-fraction-digits="1" />
  <FormattedNumber :value="0" format="percent" tone="auto" />
  <FormattedNumber :value="42" sign-display="always" tone="muted" />
  <FormattedNumber :value="-42" sign-display="never" />
</div>`,
    },
    {
      title: 'Variants, sizes and weight',
      code: `<div class="flex flex-wrap items-baseline gap-4">
  <FormattedNumber :value="2048" />
  <FormattedNumber :value="2048" variant="mono" />
  <FormattedNumber :value="2048" variant="outline" size="sm" />
  <FormattedNumber :value="2048" size="2xl" weight="semibold" />
  <FormattedNumber :value="2048" size="xs" tone="muted" />
</div>`,
    },
    {
      title: 'Bigint and numeric strings',
      description: 'Large integers are formatted exactly; a float would round them.',
      code: `<div class="flex flex-col gap-1">
  <FormattedNumber value="12345678901234567890" />
  <FormattedNumber value="12345678901234567890" format="compact" />
  <FormattedNumber value="1e6" />
</div>`,
    },
    {
      title: 'Invalid values and fallback',
      description: 'NaN, blank and non-numeric values render the fallback text instead of "NaN".',
      code: `<div class="flex flex-wrap gap-4">
  <FormattedNumber :value="NaN" />
  <FormattedNumber value="" />
  <FormattedNumber value="12 apples" fallback="No data" />
  <FormattedNumber :value="1" format="currency" currency="not-a-code" />
  <FormattedNumber :value="7" format="unit" unit="parsec" />
</div>`,
    },
    {
      title: 'Right-to-left page',
      description: 'The bdi wrapper keeps the sign and digits in order inside right-to-left text; turn it off with isolate=false only when the parent already isolates.',
      code: `<p dir="rtl" lang="ar">
  <span>الرصيد:</span>
  <FormattedNumber :value="-1234.5" locale="ar" format="currency" currency="USD" />
</p>`,
    },
  ],
  a11y: [
    'Renders plain text, so screen readers read the formatted string. Prefer a locale that matches the page language.',
    'Tone is never the only signal: `positive`, `negative` and `auto` also show a sign (`signDisplay` defaults to `exceptZero` for them). Do not set `signDisplay="never"` with a status tone.',
    'The invalid fallback text ("n/a" by default) is read as written; use a more specific `fallback` such as "No data" where it helps.',
    'The `<bdi>` wrapper keeps numbers and signs in order in right-to-left and mixed text. Digits follow the locale (`ar-EG` uses Arabic-Indic digits).',
    'Tabular figures change width only, not meaning. Colours use `text-success`, `text-destructive` and `text-muted-foreground`, covered by the contrast tests; forced-colors mode keeps the sign and the outline variant border.',
  ],
  requires: [
    "Throws a ContractError when `format` is 'currency' and `currency` is missing or blank (the value would otherwise render as a bare number).",
    "Throws a ContractError when `format` is 'unit' and `unit` is missing or blank.",
  ],
  related: ['RelativeTime', 'Text', 'KpiTile', 'StatGroup'],
  llmNotes: [
    'The number-format style prop is `format`, never `style` (a static `style="percent"` is compiled to an empty style object).',
    'Always pass `currency` with `format="currency"` and `unit` with `format="unit"`.',
    '`format="percent"` expects a ratio: 0.25 renders 25%. Pass 25 and you get 2,500%.',
    'Pass `locale` from app state; the default is `en`, not the browser locale.',
    'Use `tone="auto"` or `tone="positive"` for deltas, not a hand-written `text-green-*` class; the sign is added for you.',
    'Use `formatNumber(value, options)` for strings (chart labels, `aria-label`). It takes the same options with `style` instead of `format`, and returns `fallback` for invalid input.',
    'Do not format a number yourself with `toLocaleString` in templates: server and browser locales differ and cause hydration mismatches.',
  ],
  replaces: ['value.toLocaleString() in templates', 'hand-rolled currency and percent helpers'],
}
export default doc
