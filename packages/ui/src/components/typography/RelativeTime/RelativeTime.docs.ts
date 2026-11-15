import type { ComponentDoc } from '../../../docs-types'

const NOW = '2025-06-15T12:00:00Z'

const doc: ComponentDoc = {
  name: 'RelativeTime',
  group: 'typography',
  subgroup: 'Text',
  summary: 'A `<time>` element that writes a moment as relative text ("3 minutes ago", "in 2 days") with the absolute date in the tooltip, optionally kept fresh by one shared timer.',
  description:
    'Use `RelativeTime` for timestamps in feeds, tables and activity lists. It renders a real `<time datetime="...">` with text from `Intl.RelativeTimeFormat`, so the machine-readable value and the localised text always agree. Past and future moments both work ("3 minutes ago", "in 3 minutes"); units step from seconds through minutes, hours, days, weeks and months to years, truncating toward zero so 59 minutes never reads as an hour. Use `minUnit` and `maxUnit` to limit the units (`maxUnit="day"` gives "400 days ago").\n\n' +
    'Hydration safety: the component never reads the clock while setting up or rendering. Without `now`, the first render (server and client) is the absolute date, formatted in UTC unless `timeZone` is given, and the relative text appears right after mount. With `now` (a Date, epoch milliseconds or ISO string) the output is fully pinned and identical everywhere, which also makes tests, docs and screenshots deterministic. `locale` defaults to `en`, not the browser locale, for the same reason: pass the app locale. After mount the tooltip date uses the browser time zone unless `timeZone` is set.\n\n' +
    'Live updates: `updateInterval` (milliseconds, 250 to 2147483647, default 0 = off) refreshes the text. Every instance shares ONE module-level timer that runs at the smallest requested period and is created with the first subscriber and cleared with the last, or when the interval changes to 0. A pinned `now` disables updates. Avoid intervals below 1000 ms for lists: text only changes when a unit count changes.\n\n' +
    'Input handling: strings must be ISO 8601 (`2025-06-15`, `2025-06-15T09:30:00Z`, with an offset or a space instead of `T`); other date strings are treated as invalid because engines parse them differently. Dates and numbers outside the JavaScript Date range, NaN, Infinity, blank or non-date values render `fallback` (default "Unknown time") in a `<time>` without a `datetime` attribute and with `data-state="invalid"`. Nothing throws. `data-state` is `relative`, `absolute` (before mount without `now`) or `invalid`.\n\n' +
    'The name is `unitStyle` because `style` is the Vue inline-style attribute; it maps to the Intl `style` option. For a plain string use `formatRelative(datetime, now, options)` exported next to the component.',
  status: 'stable',
  props: [
    { name: 'datetime', type: 'Date | number | string', required: true, description: 'The moment: a Date, epoch milliseconds or an ISO 8601 string. Anything invalid renders `fallback`.' },
    { name: 'now', type: 'Date | number | string', description: 'Reference moment. Pins the output (no clock read, `updateInterval` ignored). Without it the first render is the absolute date and relative text follows after mount.' },
    { name: 'locale', type: 'string', default: "'en'", description: 'BCP 47 tag (`de`, `ar`, `ja-JP`). Malformed tags fall back to `en`. Also written to `lang` on the element.' },
    { name: 'numeric', type: "'auto' | 'always'", default: "'auto'", description: '`auto` writes words where the language has them ("yesterday", "tomorrow", "now"), `always` writes counts ("1 day ago"). Unknown values fall back to `auto`.' },
    { name: 'unitStyle', type: "'long' | 'short' | 'narrow'", default: "'long'", description: 'Width of unit names: "3 minutes ago", "3 min. ago", "3m ago". Maps to the Intl `style` option. Unknown values fall back to `long`.' },
    { name: 'minUnit', type: "'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'", default: "'second'", description: 'Smallest unit used. Closer moments read as 0 of this unit ("this minute").' },
    { name: 'maxUnit', type: "'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'", default: "'year'", description: 'Largest unit used. `day` gives "400 days ago". Raised to `minUnit` when smaller.' },
    { name: 'updateInterval', type: 'number', default: '0', description: 'Milliseconds between live updates, 250 to 2147483647. 0, negative or non-numeric turns updates off. All instances share one timer. Ignored when `now` is set.' },
    { name: 'showTitle', type: 'boolean', default: 'true', description: 'Put the absolute date in the `title` attribute. A `title` you pass yourself wins.' },
    { name: 'dateStyle', type: "'full' | 'long' | 'medium' | 'short'", default: "'medium'", description: 'Intl date style for the absolute date.' },
    { name: 'timeStyle', type: "'full' | 'long' | 'medium' | 'short' | 'none'", default: "'short'", description: 'Intl time style for the absolute date; `none` leaves the time of day out.' },
    { name: 'timeZone', type: 'string', description: 'IANA zone for the absolute date (`UTC`, `Europe/Warsaw`). Unknown zones are ignored. Before mount it is UTC when not given.' },
    { name: 'fallback', type: 'string', default: "'Unknown time'", description: 'Text for an invalid `datetime`.' },
    { name: 'variant', type: "'plain' | 'muted' | 'dotted'", default: "'plain'", description: '`plain` inherits, `muted` uses the secondary colour, `dotted` adds a dotted underline that hints at the tooltip. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'inherit' | 'xs' | 'sm' | 'base' | 'md' | 'lg'", default: "'inherit'", description: 'Font size; `inherit` keeps the surrounding size.' },
    { name: 'tone', type: "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Text colour. Colour never carries meaning alone: keep the words in surrounding text.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Past and future',
      description: 'Everything is relative to the fixed `now`, so the text is deterministic.',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-15T11:57:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-15T09:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-14T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-01T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-15T12:03:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-18T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2023-06-15T12:00:00Z" now="${NOW}" /></li>
</ul>`,
    },
    {
      title: 'Numeric auto and always',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-14T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-14T12:00:00Z" now="${NOW}" numeric="always" /></li>
  <li><RelativeTime datetime="2025-06-16T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-16T12:00:00Z" now="${NOW}" numeric="always" /></li>
</ul>`,
    },
    {
      title: 'Unit style',
      description: 'Long, short and narrow unit names.',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-15T11:57:00Z" now="${NOW}" unit-style="long" /></li>
  <li><RelativeTime datetime="2025-06-15T11:57:00Z" now="${NOW}" unit-style="short" /></li>
  <li><RelativeTime datetime="2025-06-15T11:57:00Z" now="${NOW}" unit-style="narrow" /></li>
</ul>`,
    },
    {
      title: 'Locales and right to left',
      description: 'The locale sets the language; `lang` and `dir="auto"` are written on the element.',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-15T11:57:00Z" now="${NOW}" locale="de" /></li>
  <li><RelativeTime datetime="2025-06-15T09:00:00Z" now="${NOW}" locale="ja-JP" /></li>
  <li><RelativeTime datetime="2025-06-15T09:00:00Z" now="${NOW}" locale="ar" /></li>
</ul>`,
    },
    {
      title: 'Limit the units',
      description: '`maxUnit="day"` avoids weeks and months; `minUnit="minute"` avoids counting seconds.',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-04-01T12:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-04-01T12:00:00Z" now="${NOW}" max-unit="day" /></li>
  <li><RelativeTime datetime="2025-06-15T11:59:40Z" now="${NOW}" min-unit="minute" /></li>
  <li><RelativeTime datetime="2025-06-15T11:59:40Z" now="${NOW}" /></li>
</ul>`,
    },
    {
      title: 'Absolute date in the title',
      description: 'The tooltip shows the absolute date. Set `timeZone`, `dateStyle` and `timeStyle` to control it; `show-title="false"` removes it.',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-14T09:30:00Z" now="${NOW}" time-zone="UTC" /></li>
  <li><RelativeTime datetime="2025-06-14T09:30:00Z" now="${NOW}" time-zone="UTC" date-style="full" time-style="long" /></li>
  <li><RelativeTime datetime="2025-06-14T09:30:00Z" now="${NOW}" time-zone="UTC" date-style="short" time-style="none" /></li>
  <li><RelativeTime datetime="2025-06-14T09:30:00Z" now="${NOW}" :show-title="false" /></li>
</ul>`,
    },
    {
      title: 'Variants, sizes and tones',
      code: `<ul class="space-y-1">
  <li><RelativeTime datetime="2025-06-15T11:00:00Z" now="${NOW}" /></li>
  <li><RelativeTime datetime="2025-06-15T11:00:00Z" now="${NOW}" variant="muted" size="sm" /></li>
  <li><RelativeTime datetime="2025-06-15T11:00:00Z" now="${NOW}" variant="dotted" time-zone="UTC" /></li>
  <li>Last backup <RelativeTime datetime="2025-06-13T12:00:00Z" now="${NOW}" tone="warning" /></li>
  <li>Synced <RelativeTime datetime="2025-06-15T11:59:00Z" now="${NOW}" tone="success" size="lg" /></li>
</ul>`,
    },
    {
      title: 'Date objects, epoch numbers and invalid input',
      description: 'Invalid values render the fallback text and never throw.',
      code: `<ul class="space-y-1">
  <li><RelativeTime :datetime="1749988800000" :now="1750000000000" /></li>
  <li><RelativeTime datetime="not a date" now="${NOW}" /></li>
  <li><RelativeTime datetime="" now="${NOW}" fallback="No date" /></li>
  <li><RelativeTime :datetime="1e20" now="${NOW}" /></li>
</ul>`,
    },
  ],
  a11y: [
    'Renders a native `<time>` element with a machine-readable `datetime`; the visible text is the accessible name and is read as written ("3 minutes ago").',
    'The `title` tooltip is supplemental: it is not reachable by keyboard or touch. Show the absolute date as text where it matters (receipts, audit logs).',
    '`lang` is set to the resolved locale and `dir="auto"` lets right-to-left text such as `ar` resolve its own direction inside a left-to-right page.',
    'Live updates replace the text in place without a live region, so screen readers are not interrupted every tick. Do not wrap the element in `aria-live`.',
    'Tone and the dotted variant are never the only signal. Colours use `text-success`, `text-warning-foreground`, `text-destructive`, `text-info` and `text-muted-foreground`, covered by the contrast tests; the dotted underline survives forced-colors mode.',
  ],
  related: ['FormattedNumber', 'StaleNotice', 'NotificationList', 'Text'],
  llmNotes: [
    'Always pass `now` in docs, tests and server-rendered pages that must be deterministic; without it the first render is the absolute date.',
    'The Intl style option is the prop `unitStyle`, not `style`.',
    'Pass `datetime` as ISO 8601 (or a Date or epoch ms); other date strings are invalid and render the fallback.',
    'Use `updateInterval` (for example 60000) only on pages that stay open; all instances share one timer, so many rows are cheap.',
    'Do not format times in templates with `new Date()` or `Date.now()`: it breaks hydration. Use RelativeTime.',
    'Use `formatRelative(datetime, now, options)` for plain strings (`aria-label`, chart tooltips).',
  ],
  replaces: ['timeago-style helpers', 'hand-written <time> plus Date.now() arithmetic'],
}
export default doc
