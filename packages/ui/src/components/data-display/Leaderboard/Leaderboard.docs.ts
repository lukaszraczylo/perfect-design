import type { ComponentDoc } from '../../../docs-types'

const teams = `[
    { id: 'a', label: 'Team A', value: 128 },
    { id: 'b', label: 'Team B', value: 117 },
    { id: 'c', label: 'Team C', value: 96 },
    { id: 'd', label: 'Team D', value: 74 },
    { id: 'e', label: 'Team E', value: 52 },
  ]`

const doc: ComponentDoc = {
  name: 'Leaderboard',
  group: 'data-display',
  subgroup: 'Rankings',
  summary: 'Ranked entries as a list, a table or a podium, with ties, deltas, proportional bars and a highlighted entry.',
  description:
    'Use `Leaderboard` to show who or what is ahead on one number: sales by region, tickets closed by team, tests passed by suite. Each entry is `{ id, label, value, rank?, delta?, avatar? }`. Entries are sorted (`sort`), ranked (`ties`) and formatted (`valueFormat`, `locale`) for you.\n\n' +
    '`variant="list"` is an ordered list of ruled rows. `variant="table"` is a real table (rank, name, value, change) inside a focusable, named scroll region. `variant="podium"` shows the top three as steps in the visual order 2-1-3 while the DOM stays in rank order, with the remaining entries in a list below.\n\n' +
    'Ranks: `competition` (default) gives equal values the same rank and skips the next (1, 2, 2, 4); `dense` does not skip (1, 2, 2, 3); `none` ranks by position. An entry `rank` always wins. Values that are not finite numbers render the fallback text, sort last and have no rank. `sort="asc"` makes the lowest value rank 1 (times, costs); `sort="none"` keeps the order you pass.\n\n' +
    'A delta is shown as an arrow icon and a signed number, never as colour alone. `highlight` marks one entry with `aria-current`, a tinted surface and the visible text from `highlightLabel`. Bars are decorative: the number is always the text. For a single quota against a limit use StatBar; for a full data grid use DataTable.',
  status: 'stable',
  props: [
    { name: 'entries', type: 'LeaderboardEntry[]', default: '[]', description: 'The entries: `{ id, label, value, rank?, delta?, avatar? }`. `id` is a unique non-empty string or number. `avatar` is an image source string (an inline data URI works) or `{ src?, fallback? }`; without an image the initials of the label (or `fallback`) are shown. An empty or missing array shows the empty state.' },
    { name: 'label', type: 'string', description: 'Accessible name of the leaderboard and the hidden table caption. Required, or pass `aria-label` / `aria-labelledby`.' },
    { name: 'variant', type: "'list' | 'table' | 'podium'", default: "'list'", description: '`list` ruled rows, `table` a real table in a scroll region, `podium` the top three as 2-1-3 steps and the rest in a list. Unknown values fall back to `list`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text and avatar size. Unknown values fall back to `md`.' },
    { name: 'density', type: "'comfortable' | 'compact'", default: "'comfortable'", description: 'Row spacing. Unknown values fall back to `comfortable`.' },
    { name: 'showRank', type: 'boolean', default: 'true', description: 'Show the rank of each entry (a column in the table).' },
    { name: 'highlight', type: 'string | number', description: 'Id of the entry to mark: `aria-current="true"`, a tinted surface and the visible `highlightLabel`.' },
    { name: 'highlightLabel', type: 'string', default: "'Selected'", description: 'Visible text on the highlighted entry. Change it to match the meaning, for example "Your team".' },
    { name: 'bars', type: 'boolean', default: 'false', description: 'Draw a bar under each entry, proportional to the largest value (negative values draw an empty bar). Decorative: hidden from assistive technology.' },
    { name: 'valueFormat', type: 'LeaderboardValueFormat', description: 'Number format of values and deltas: `{ format, currency, unit, notation, minimumFractionDigits, maximumFractionDigits, signDisplay }`, the same options as FormattedNumber (`format` is `decimal`, `percent`, `currency`, `unit` or `compact`). Deltas always show a sign.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for numbers (`de-DE`). Defaults to `en`, not the browser locale, so server and client agree.' },
    { name: 'ties', type: "'competition' | 'dense' | 'none'", default: "'competition'", description: 'How equal values rank: 1 2 2 4, 1 2 2 3, or by position. Unknown values fall back to `competition`.' },
    { name: 'sort', type: "'desc' | 'asc' | 'none'", default: "'desc'", description: 'Highest first, lowest first (the lowest is rank 1), or keep the given order (ranks still follow the highest value). The sort is stable. Unknown values fall back to `desc`.' },
    { name: 'columnLabels', type: 'LeaderboardColumnLabels', description: 'Texts of the table headers and the hidden word before each rank: `{ rank, name, value, delta }`. Defaults: Rank, Name, Value, Change.' },
    { name: 'emptyText', type: 'string', default: "'No entries yet.'", description: 'Text shown when there are no entries and no `empty` slot.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'entry', description: 'Replaces the name of an entry (the label text). The avatar, rank, highlight text and value stay.', props: '{ entry: LeaderboardEntry, rank: number | null, index: number, highlighted: boolean }' },
    { name: 'value', description: 'Replaces the formatted value of an entry.', props: '{ entry: LeaderboardEntry, rank: number | null, index: number, formatted: string }' },
    { name: 'empty', description: 'Content shown when there are no entries (replaces `emptyText`).' },
  ],
  examples: [
    {
      title: 'List',
      description: 'Sample data. The default variant: ruled rows with the rank on the left.',
      code: `<div class="max-w-md"><Leaderboard label="Tickets closed by team (sample)" :entries="${teams}" /></div>`,
    },
    {
      title: 'Table',
      description: 'Sample data. A real table with a hidden caption inside a focusable scroll region; the change column appears when an entry has a delta.',
      code: `<div class="max-w-lg"><Leaderboard variant="table" label="Orders by region (sample)" :entries="[
    { id: 1, label: 'Region 1', value: 4120, delta: 210 },
    { id: 2, label: 'Region 2', value: 3890, delta: -140 },
    { id: 3, label: 'Region 3', value: 2755, delta: 0 },
    { id: 4, label: 'Region 4', value: 1980 },
  ]" :value-format="{ format: 'compact', maximumFractionDigits: 1 }" :column-labels="{ name: 'Region', value: 'Orders', delta: 'Since last month' }" /></div>`,
    },
    {
      title: 'Podium',
      description: 'Sample data. The top three stand as 2-1-3; the rest follow in a list. Initials come from the label; one entry uses an inline SVG sample portrait.',
      code: `<div class="max-w-lg"><Leaderboard variant="podium" label="Suite pass rate (sample)" :entries="entries" :value-format="{ format: 'percent', maximumFractionDigits: 1 }" /></div>`,
      script: `const portrait = (bg: string, fg: string) => \`data:image/svg+xml;utf8,\${encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="\${bg}"/><circle cx="40" cy="31" r="14" fill="\${fg}"/><path d="M12 80c2-17 14-26 28-26s26 9 28 26z" fill="\${fg}"/></svg>\`)}\`
const svg = portrait('#e4e4e7', '#a1a1aa')
const entries = [
  { id: 'a', label: 'Suite A', value: 0.992, avatar: svg },
  { id: 'b', label: 'Suite B', value: 0.981, avatar: { fallback: 'SB' } },
  { id: 'c', label: 'Suite C', value: 0.964 },
  { id: 'd', label: 'Suite D', value: 0.93 },
  { id: 'e', label: 'Suite E', value: 0.9 },
]`,
      state: () => {
        const portrait = (bg: string, fg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><circle cx="40" cy="31" r="14" fill="${fg}"/><path d="M12 80c2-17 14-26 28-26s26 9 28 26z" fill="${fg}"/></svg>`)}`
        const svg = portrait('#e4e4e7', '#a1a1aa')
        return {
          entries: [
            { id: 'a', label: 'Suite A', value: 0.992, avatar: svg },
            { id: 'b', label: 'Suite B', value: 0.981, avatar: { fallback: 'SB' } },
            { id: 'c', label: 'Suite C', value: 0.964 },
            { id: 'd', label: 'Suite D', value: 0.93 },
            { id: 'e', label: 'Suite E', value: 0.9 },
          ],
        }
      },
    },
    {
      title: 'Sizes and density',
      description: 'Sample data. `size` sm, md and lg, and the compact `density`.',
      code: `<div class="flex max-w-md flex-col gap-6">
  <Leaderboard size="sm" label="Small" :entries="${teams}.slice(0, 3)" />
  <Leaderboard size="lg" label="Large" :entries="${teams}.slice(0, 3)" />
  <Leaderboard density="compact" label="Compact" :entries="${teams}.slice(0, 3)" />
</div>`,
    },
    {
      title: 'Bars',
      description: 'Sample data. Each bar is proportional to the largest value; the number stays the text.',
      code: `<div class="max-w-md"><Leaderboard bars label="Builds per week (sample)" :entries="${teams}" /></div>`,
    },
    {
      title: 'Ties and sorting',
      description: 'Sample data. Equal values share a rank: `competition` skips the next rank, `dense` does not. `sort="asc"` ranks the lowest value first.',
      code: `<div class="grid max-w-2xl gap-6 md:grid-cols-3">
  <Leaderboard label="Competition ranking" :entries="[{ id: 1, label: 'Team A', value: 9 }, { id: 2, label: 'Team B', value: 7 }, { id: 3, label: 'Team C', value: 7 }, { id: 4, label: 'Team D', value: 4 }]" />
  <Leaderboard ties="dense" label="Dense ranking" :entries="[{ id: 1, label: 'Team A', value: 9 }, { id: 2, label: 'Team B', value: 7 }, { id: 3, label: 'Team C', value: 7 }, { id: 4, label: 'Team D', value: 4 }]" />
  <Leaderboard sort="asc" label="Fastest first" :value-format="{ format: 'unit', unit: 'second' }" :entries="[{ id: 1, label: 'Run A', value: 41 }, { id: 2, label: 'Run B', value: 38 }, { id: 3, label: 'Run C', value: 55 }]" />
</div>`,
    },
    {
      title: 'Highlight',
      description: 'Sample data. The marked entry has `aria-current`, a tinted surface and visible text, so it is not colour alone.',
      code: `<div class="max-w-md"><Leaderboard label="Support queue (sample)" highlight="c" highlight-label="Your team" :entries="${teams}" /></div>`,
    },
    {
      title: 'Deltas and currency',
      description: 'Sample data. The arrow icon and the signed number carry the change; the colour only backs them up. Non-finite values show the fallback text and sort last.',
      code: `<div class="max-w-md"><Leaderboard label="Revenue by region (sample)" :value-format="{ format: 'currency', currency: 'EUR', maximumFractionDigits: 0 }" locale="de-DE" :entries="[
    { id: 1, label: 'Region 1', value: 12400, delta: 800 },
    { id: 2, label: 'Region 2', value: 9800, delta: -350 },
    { id: 3, label: 'Region 3', value: 9100, delta: 0 },
    { id: 4, label: 'Region 4', value: Number.NaN },
  ]" /></div>`,
    },
    {
      title: 'Empty',
      description: 'No entries: the default text, or the `empty` slot for a real next step.',
      code: `<div class="max-w-md"><Leaderboard label="Tickets closed (sample)" :entries="[]"><template #empty><p class="py-6 text-center text-muted-foreground">No tickets were closed this week.</p></template></Leaderboard></div>`,
    },
  ],
  a11y: [
    'The list variant is an ordered list (`ol` and `li`); the table variant is a real `table` with a hidden caption, `th scope="col"` headers and `th scope="row"` names inside a focusable region with the same name, so it scrolls by keyboard at 320px; the podium is an ordered list of the top three in rank order (CSS only reorders them visually to 2-1-3) followed by a list of the rest.',
    'Each rank is text, with a visually hidden "Rank" before it. The highlighted entry has `aria-current="true"` and visible text from `highlightLabel`, so it never relies on colour. A delta is an arrow icon plus a signed number.',
    'Bars and avatars are decorative (`aria-hidden`); the label and the number are always text. Long labels truncate with a `title` and `min-w-0`, hostile text is rendered as text, and logical properties make it work right-to-left.',
    'Numbers use tabular figures and bidi isolation (FormattedNumber), so a sign or digit never reorders in right-to-left text. The leaderboard is not interactive, so it has no keyboard map beyond the scroll region of the table.',
  ],
  related: ['StatBar', 'DataTable', 'FormattedNumber', 'Avatar', 'TrendBadge'],
  requires: [
    'Throws a ContractError when there is no accessible name (`label`, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when two entries share the same `id`.',
    'Throws a ContractError when an entry has no valid `id` (a non-empty string or a finite number).',
    'Throws a ContractError when an entry has a blank `label`.',
  ],
  llmNotes: [
    'Entry avatars blur when a surrounding `ConfigProvider` sets `blurMedia` (privacy, not decoration); there is no prop on this component.',
    'Always pass `label` (or `aria-label`) and give every entry a unique `id`.',
    'Pass raw numbers in `value` and set `valueFormat` (and `locale`) instead of pre-formatting strings.',
    'Use `highlight` plus `highlightLabel` to mark the current user or team; never mark it with colour only.',
    'Use `ties="dense"` when the next rank must not skip; use `sort="asc"` when lower is better.',
    'Do not use Leaderboard for one value against a limit (StatBar) or for sortable, filterable data (DataTable).',
  ],
  replaces: ['hand-rolled ranking lists and top-N tables'],
}
export default doc
