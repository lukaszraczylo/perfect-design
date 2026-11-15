import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

/** Deterministic sample days from `startDay` on: some quiet days (0) and some days without an entry. */
function sampleDays(year: number, month: number, date: number, count: number) {
  const out: { date: string; value: number }[] = []
  for (let i = 0; i < count; i++) {
    if (i % 17 === 5) continue
    const d = new Date(Date.UTC(year, month - 1, date + i))
    const v = (i * 7 + Math.floor(i / 8) * 5) % 13
    out.push({ date: d.toISOString().slice(0, 10), value: v < 4 ? 0 : v - 3 })
  }
  return out
}

const SCRIPT = `// ISO dates (YYYY-MM-DD) with a count per day
const days = Array.from({ length: 84 }, (_, i) => ({
  date: new Date(Date.UTC(2025, 2, 3 + i)).toISOString().slice(0, 10),
  value: (i * 7 + Math.floor(i / 8) * 5) % 13,
}))`

const doc: ComponentDoc = {
  name: 'CalendarHeatmap',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Contribution-style calendar: one cell per day, weeks as columns and weekdays as rows, with month labels, a legend and a month table for assistive technology.',
  description:
    'Use `CalendarHeatmap` to show activity per day over weeks or years (commits, deploys, support tickets, visits). `data` is `{ date: "YYYY-MM-DD", value }` per day; entries of the same day are summed, a date-time is read up to its date, and entries with an invalid date or a negative or non-numeric value are skipped and counted in an inline message. The range is `start` to `end`; without them it is the span of the data (at most 1830 days, the latest are kept). All date maths is UTC, and the component never reads the current date, so server and browser render the same grid. A day without an entry is drawn as an outlined "no data" cell, a day with value 0 as the faint level 0 cell, and the rest in `levels` (3 to 7) steps of the `tone` from the domain `min` (default 0) to `max` (default the largest value). Month names sit above the first week of each month (the year at the first label and every January), and Mon, Wed and Fri label the rows. The grid keeps its cell size and scrolls inside a focusable, named region instead of shrinking. For a rows-by-columns matrix of anything else use `Heatmap`.',
  status: 'stable',
  props: [
    { name: 'data', type: 'CalendarEntry[]', required: true, description: '`{ date, value }` per day. `date` is `YYYY-MM-DD`, an ISO date-time or a `Date` (its UTC date). `value` is a number >= 0. The same day is summed. An empty array with `start` and `end` draws empty days; without them it shows `emptyText`.' },
    { name: 'start', type: 'string', description: 'First day shown, `YYYY-MM-DD`. Default: the earliest day in `data` (or 364 days before `end`).' },
    { name: 'end', type: 'string', description: 'Last day shown, `YYYY-MM-DD`. Default: the latest day in `data` (or `start` when the data ends earlier).' },
    { name: 'weekStart', type: "'sun' | 'mon'", default: "'sun'", description: 'First row of each week column: Sunday or Monday. The Mon, Wed and Fri labels follow.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell size: 10, 12 or 16 px.' },
    { name: 'shape', type: "'square' | 'circle'", default: "'square'", description: 'Rounded squares or circles. The legend uses the same shape.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between cells: 1, 2 or 4 px.' },
    { name: 'levels', type: 'number', default: '5', description: 'Number of intensity steps above zero, clamped to 3 to 7 (a non-number gives 5).' },
    { name: 'tone', type: TONE, default: "'chart-1'", description: 'Colour token of the intensity ramp.' },
    { name: 'min', type: 'number', description: 'Value where the ramp starts (default 0). Values below it are the faintest step.' },
    { name: 'max', type: 'number', description: 'Value of the strongest step (default: the largest value in the range). Set it to compare several calendars on one scale.' },
    { name: 'showLegend', type: 'boolean', default: 'true', description: 'Less ... More legend with the no-activity cell and every step.' },
    { name: 'showMonthLabels', type: 'boolean', default: 'true', description: 'Month names above the weeks (the year at the first label and every January).' },
    { name: 'showWeekdayLabels', type: 'boolean', default: 'true', description: 'Mon, Wed and Fri beside the rows.' },
    { name: 'cellTitle', type: '(date: string, value: number | null) => string', description: 'Custom native tooltip per day. Receives the `YYYY-MM-DD` date and the summed value, or `null` for a day without data.' },
    { name: 'label', type: 'string', description: 'Accessible name of the chart. Required unless `title`, `aria-label` or `aria-labelledby` is set.' },
    { name: 'title', type: 'string', description: 'Visible heading text above the chart. Also names the chart when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible supporting text under the title.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when there is nothing to draw: no valid data and no `start` or `end`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Three weeks with a few sample entries; the other days have no data.',
      code: `<CalendarHeatmap
  label="Sample data: deploys per day"
  start="2025-03-03"
  end="2025-03-23"
  :data="[{ date: '2025-03-03', value: 2 }, { date: '2025-03-05', value: 6 }, { date: '2025-03-12', value: 1 }, { date: '2025-03-18', value: 9 }]"
/>`,
    },
    {
      title: 'A year of activity',
      description: 'Sample data over 52 weeks with a title and a description. The grid scrolls inside its own focusable region on a phone.',
      script: `const year = Array.from({ length: 364 }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10), value: (i * 7 + Math.floor(i / 8) * 5) % 13 }))`,
      code: `<CalendarHeatmap
  title="Deploys in 2025"
  description="Sample data, one cell per day"
  tone="success"
  :data="year"
/>`,
      state: () => ({ year: sampleDays(2025, 1, 1, 364) }),
    },
    {
      title: 'Week start: Sunday and Monday',
      description: 'The first row is Sunday or Monday; the Mon, Wed and Fri labels move with it. Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap week-start="sun" label="Sample data: weeks start on Sunday" :data="days" :show-legend="false" />
  <CalendarHeatmap week-start="mon" label="Sample data: weeks start on Monday" :data="days" :show-legend="false" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'Size: sm, md and lg',
      description: 'Cells of 10, 12 and 16 px. Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap size="sm" label="Sample data: small cells" :data="days" />
  <CalendarHeatmap size="md" label="Sample data: medium cells" :data="days" />
  <CalendarHeatmap size="lg" label="Sample data: large cells" :data="days" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'Shape: square and circle',
      description: 'The same data as rounded squares and as dots. The table alternative is identical. Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap shape="square" label="Sample data: square cells" :data="days" />
  <CalendarHeatmap shape="circle" label="Sample data: circle cells" :data="days" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'Gap: sm, md and lg',
      description: 'Tight, default and wide spacing between cells. Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap gap="sm" label="Sample data: tight spacing" :data="days" :show-legend="false" />
  <CalendarHeatmap gap="md" label="Sample data: default spacing" :data="days" :show-legend="false" />
  <CalendarHeatmap gap="lg" shape="circle" label="Sample data: wide spacing" :data="days" :show-legend="false" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'Levels: 3, 5 and 7',
      description: 'Fewer steps read as a coarse scale, more steps as a fine one. The legend shows every step. Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap :levels="3" label="Sample data: 3 levels" :data="days" />
  <CalendarHeatmap :levels="5" label="Sample data: 5 levels" :data="days" />
  <CalendarHeatmap :levels="7" label="Sample data: 7 levels" :data="days" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'Tone',
      description: 'One tone per calendar; pick the colour by meaning (success for deploys, danger for incidents). Sample data.',
      script: SCRIPT,
      code: `<div class="flex flex-col gap-6">
  <CalendarHeatmap tone="success" label="Sample data: success tone" :data="days" :show-legend="false" />
  <CalendarHeatmap tone="danger" label="Sample data: danger tone" :data="days" :show-legend="false" />
  <CalendarHeatmap tone="info" label="Sample data: info tone" :data="days" :show-legend="false" />
  <CalendarHeatmap tone="muted" label="Sample data: muted tone" :data="days" :show-legend="false" />
</div>`,
      state: () => ({ days: sampleDays(2025, 3, 3, 84) }),
    },
    {
      title: 'A range across two years',
      description: 'The first label and every January carry the year. Sample data from November 2024 to February 2025.',
      code: `<CalendarHeatmap
  label="Sample data: activity across a year boundary"
  start="2024-11-01"
  end="2025-02-28"
  week-start="mon"
  :data="days"
/>`,
      state: () => ({ days: sampleDays(2024, 11, 1, 120) }),
    },
    {
      title: 'Empty days, shared scale and custom tooltips',
      description: 'Days without an entry are outlined "no data" cells; `max` fixes the scale so several calendars compare; `cellTitle` writes the tooltip. Labels and legend can be switched off. Sample data.',
      code: `<CalendarHeatmap
  label="Sample data: sparse activity"
  start="2025-05-05"
  end="2025-06-01"
  :max="20"
  :show-legend="false"
  :show-weekday-labels="false"
  :cell-title="(date, value) => date + (value === null ? ': nothing recorded' : ': ' + value + ' tickets')"
  :data="[{ date: '2025-05-06', value: 4 }, { date: '2025-05-06', value: 3 }, { date: '2025-05-14', value: 12 }, { date: '2025-05-21T09:30:00Z', value: 20 }, { date: '2025-05-22', value: 0 }]"
/>
<CalendarHeatmap class="mt-6" label="Sample data: no month labels" :show-month-labels="false" start="2025-05-05" end="2025-05-25" :data="[]" />`,
    },
    {
      title: 'Empty',
      code: `<CalendarHeatmap label="Sample data: no activity" :data="[]" empty-text="No activity yet" />`,
    },
  ],
  a11y: [
    'The grid is one `role="img"` SVG named by `label`, `title`, `aria-label` or `aria-labelledby` (an automatic summary with the range and the total is the fallback when strict mode is off). It sits in a focusable `role="region"` with the same name, so a keyboard user can scroll a wide calendar.',
    'A visually hidden table gives the text alternative by month: total, active days, busiest day and days without data. No value depends on colour.',
    'Every day cell has a native tooltip with the weekday, date and value ("Mon 3 Mar 2025: 12", or "no data"). Cells keep an outline in forced-colors mode and the legend shows every step.',
    'Month and weekday names are 12px text. Weekday labels show Mon, Wed and Fri only; all seven days are in each cell tooltip.',
    'No animation. Invalid entries are counted in an inline message; NaN and Infinity never reach the SVG.',
  ],
  related: ['Heatmap', 'BarChart', 'Sparkline', 'Calendar'],
  requires: [
    'Throws a ContractError when there is no `label`, `title`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `data` is not an array. An empty array is valid.',
    'Throws a ContractError when `start` or `end` is set but is not a real `YYYY-MM-DD` date.',
  ],
  llmNotes: [
    'Give every CalendarHeatmap a `label` or a `title`.',
    'Pass `data` as `{ date: "YYYY-MM-DD", value }`; use `start` and `end` so a quiet period still shows its empty days.',
    'Never compute `start` or `end` from the current date inside a server-rendered page without passing it in; the component itself never reads the clock.',
    'Use `max` to compare several calendars on one scale; use `levels` (3 to 7) for a coarser or finer ramp.',
    'Use `weekStart="mon"` for locales that start the week on Monday.',
    'Do not use it for a rows-by-columns matrix of unrelated labels (use Heatmap).',
  ],
  replaces: ['GitHub-style contribution graph components', 'custom div-grid activity calendars'],
}
export default doc
