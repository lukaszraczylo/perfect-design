import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const SAMPLE_LINES = `[
  { time: '2026-03-04T10:00:00Z', level: 'info', source: 'build', message: 'Resolving 42 packages' },
  { time: '2026-03-04T10:00:03Z', level: 'debug', source: 'build', message: 'Cache hit for 38 packages' },
  { time: '2026-03-04T10:00:05Z', level: 'warn', source: 'build', message: 'Package sample-lib is deprecated' },
  { time: '2026-03-04T10:00:09Z', level: 'error', source: 'test', message: 'Case "parses empty input" failed: expected 0, received 1' },
  { time: '2026-03-04T10:00:10Z', level: 'info', source: 'test', message: '41 passed, 1 failed' },
]`

const sampleLines = () => [
  { time: '2026-03-04T10:00:00Z', level: 'info', source: 'build', message: 'Resolving 42 packages' },
  { time: '2026-03-04T10:00:03Z', level: 'debug', source: 'build', message: 'Cache hit for 38 packages' },
  { time: '2026-03-04T10:00:05Z', level: 'warn', source: 'build', message: 'Package sample-lib is deprecated' },
  { time: '2026-03-04T10:00:09Z', level: 'error', source: 'test', message: 'Case "parses empty input" failed: expected 0, received 1' },
  { time: '2026-03-04T10:00:10Z', level: 'info', source: 'test', message: '41 passed, 1 failed' },
]

const PLAIN_LINES = `[
  'INFO Starting sample worker',
  'WARN Queue depth above 80%',
  '\\u001b[31mERROR\\u001b[0m Job 17 failed',
  'Job 18 finished',
]`
const plainLines = () => ['INFO Starting sample worker', 'WARN Queue depth above 80%', '\u001b[31mERROR\u001b[0m Job 17 failed', 'Job 18 finished']

const doc: ComponentDoc = {
  name: 'LogViewer',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Searchable, filterable log pane with level badges, ANSI colours, line selection, copy and a tail mode.',
  description:
    'Use for build output, job logs and service logs that grow while the page is open. Lines are plain strings (a leading level word such as `ERROR` becomes the badge, ANSI colour codes are rendered) or `{ time, level, message, source }` objects. Only the rows near the viewport are in the DOM, so thousands of lines stay quick. The toolbar searches (`filter` hides other lines, `highlight` marks matches and Enter / Shift+Enter jump between them), filters by level and copies the selected lines. `follow` sticks to the newest line; scrolling up pauses it and shows "Jump to latest". Times given as numbers or Dates are formatted with `locale` and `timeZone`, which fall back to `ConfigProvider`, then `en` and `UTC`, so server and client print the same text. For source code with folding use `CodeViewer`; for a chat transcript use `ChatThread`.',
  status: 'stable',
  props: [
    { name: 'lines', type: '(string | LogLine)[]', required: true, description: 'The lines: strings or `{ time?, level?, message, source? }`. An empty array is fine.' },
    { name: 'label', type: 'string', description: 'Accessible name of the log. Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'follow', type: 'boolean', default: 'false', description: 'Tail mode: stick to the newest line. Scrolling up pauses it (`pause` event); "Jump to latest" or reaching the end resumes (`resume`).' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of scrolling sideways.' },
    { name: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show line numbers. They are also the buttons that select a line for copying.' },
    { name: 'timestamps', type: 'boolean', default: 'true', description: 'Show the time of lines that have one.' },
    { name: 'query', type: 'string', default: "''", description: 'Search text, case-insensitive. Supports `v-model:query`.' },
    { name: 'queryMode', type: "'filter' | 'highlight'", default: "'filter'", description: '`filter` hides lines without a match; `highlight` keeps every line and only marks matches.' },
    { name: 'levelFilter', type: 'LogLevel[]', description: 'Levels to show (default all). Lines without a level always show. Supports `v-model:levelFilter`.' },
    { name: 'maxLines', type: 'number', description: 'Keep only the newest N lines; older ones are dropped and the line numbers keep counting from the dropped ones.' },
    { name: 'variant', type: "'plain' | 'panel' | 'terminal'", default: "'panel'", description: '`plain` has no frame, `panel` a bordered card, `terminal` a heavier ink frame. Unknown values fall back to `panel`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text and row size. Unknown values fall back to `md`.' },
    { name: 'density', type: "'compact' | 'default' | 'comfortable'", default: "'comfortable'", description: 'Row spacing. Unknown values fall back to `comfortable`.' },
    { name: 'toolbar', type: 'boolean', default: 'true', description: 'Show the search, level and copy controls.' },
    { name: 'announce', type: 'boolean', default: 'true', description: 'While following, announce new lines to screen readers as one throttled polite summary, never the lines themselves.' },
    { name: 'announceInterval', type: 'number', default: '2000', description: 'Minimum milliseconds between announcements.' },
    { name: 'height', type: 'number | string', default: "'20rem'", description: 'Height of the whole viewer: a number (px) or any CSS length. `class` can set another.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for numbers and times. Falls back to `ConfigProvider`, then `en` (not the runtime locale).' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone for times given as Date or epoch milliseconds. Falls back to `ConfigProvider`, then `UTC`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'empty', description: 'Shown when there are no lines, or none match the search and level filter.' }],
  emits: [
    { name: 'update:query', payload: '[query: string]', description: 'The search text changed.' },
    { name: 'update:levelFilter', payload: '[levels: LogLevel[]]', description: 'The shown levels changed.' },
    { name: 'copy', payload: '[text: string]', description: 'Lines were copied.' },
    { name: 'pause', payload: '[]', description: 'Following paused because the reader scrolled up.' },
    { name: 'resume', payload: '[]', description: 'Following resumed (scrolled to the end, or "Jump to latest").' },
  ],
  examples: [
    {
      title: 'Build output with levels and sources',
      description: 'Sample data: `{ time, level, source, message }` lines with the toolbar. Search, level buttons and copy work on the lines.',
      script: `const lines = ${SAMPLE_LINES}`,
      code: `<LogViewer label="Sample build output" :lines="lines" :height="260" locale="en" time-zone="UTC" />`,
      state: () => ({ lines: sampleLines() }),
    },
    {
      title: 'Plain strings with ANSI colour, wrapped',
      description: 'A leading `INFO` / `WARN` / `ERROR` becomes the badge, and colour codes are rendered. `variant="terminal"` and `wrap` suit command output.',
      script: `const lines = ${PLAIN_LINES}`,
      code: `<LogViewer label="Sample worker output" variant="terminal" wrap :line-numbers="false" :timestamps="false" :lines="lines" :height="200" />`,
      state: () => ({ lines: plainLines() }),
    },
    {
      title: 'Controlled search that highlights matches',
      description: '`v-model:query` with `query-mode="highlight"` keeps every line and marks matches; Enter in the search box jumps to the next match.',
      script: `const lines = ${SAMPLE_LINES}
const query = ref('test')`,
      code: `<LogViewer v-model:query="query" query-mode="highlight" label="Sample build output, searchable" :lines="lines" :height="260" locale="en" time-zone="UTC" />`,
      state: () => ({ lines: sampleLines(), query: ref('test') }),
    },
    {
      title: 'Tail mode and an empty state',
      description: '`follow` keeps the newest line in view. With no lines the `empty` slot is shown.',
      script: `const lines = ${SAMPLE_LINES}`,
      code: `<div class="flex flex-col gap-4">
  <LogViewer follow label="Sample live output" :lines="lines" :height="160" locale="en" time-zone="UTC" />
  <LogViewer label="Sample empty log" :lines="[]" :height="100"><template #empty>No output yet. Start the sample job.</template></LogViewer>
</div>`,
      state: () => ({ lines: sampleLines() }),
    },
  ],
  a11y: [
    'The line area is `role="log"` with `aria-live="off"` and is focusable (`tabindex="0"`) so keyboard users can scroll it; it is named by `label`, `aria-label` or `aria-labelledby`.',
    'New lines are announced through a separate polite `role="status"` region as a throttled summary while following, never as a stream of lines. A second status region reports search results and copying.',
    'Press `n` and `p` with the line area focused to move between matches. In the search box, Enter and Shift+Enter move to the next and previous match and Escape clears the search.',
    'Level buttons use `aria-pressed`; line numbers are buttons named "Select line N" with `aria-pressed`. Level and match state also show as text or a badge, not colour alone.',
    'Targets are at least 24px (44px on coarse pointers). The focus ring survives forced-colors mode.',
  ],
  related: ['CodeViewer', 'ChatThread', 'ActivityFeed', 'DataGrid'],
  llmNotes: [
    'Always give `label` (or `aria-label`): the log is a named region.',
    'Pass `lines` as an array and replace or append to it; cap growth with `maxLines`.',
    'Set `time-zone` and `locale` (or a `ConfigProvider`) when giving numeric or Date times and the page is server-rendered.',
    'Use `follow` only for logs that grow while open; never auto-scroll a static log.',
    'Use `v-model:query` and `v-model:levelFilter` only when the page needs to own the filters; the toolbar works without them.',
  ],
  replaces: ['hand-rolled <pre> log panel with scroll and search'],
}

export default doc
