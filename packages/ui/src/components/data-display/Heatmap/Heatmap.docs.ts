import type { ComponentDoc } from '../../../docs-types'

const TONE = "'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const doc: ComponentDoc = {
  name: 'Heatmap',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Accessible grid heatmap (commit calendar, activity by hour) with intensity levels, labels, legend and cell tooltips.',
  description:
    'Use `Heatmap` for a rows × columns matrix of magnitudes: activity calendars, usage by weekday/hour, correlation-style grids. It is a real `<table>`: row/column labels are `<th>`, every cell is a `<td>` with a visually hidden value and the colour in an inner span. Intensity is one of `levels` (1–5) opacity steps of the tone; `null`, NaN, missing and zero cells are the muted "empty" colour. The domain defaults to the data min/max (override with `min`/`max`). Ragged rows are padded. For long column label lists use `colLabelStep` to show every n-th label visibly. `heatLevel(value, min, max, levels)` is exported as a pure helper.',
  status: 'stable',
  props: [
    { name: 'values', type: '(number | null)[][]', required: true, description: 'Rows × columns of values. Empty array → `emptyText`.' },
    { name: 'rowLabels', type: 'string[]', description: 'Row headers (`<th scope="row">`).' },
    { name: 'colLabels', type: 'string[]', description: 'Column headers (`<th scope="col">`).' },
    { name: 'tone', type: TONE, default: "'chart-1'", description: 'Colour token of the intensity ramp.' },
    { name: 'min', type: 'number', description: 'Domain minimum (default: smallest value in the data).' },
    { name: 'max', type: 'number', description: 'Domain maximum (default: largest value in the data).' },
    { name: 'levels', type: 'number', default: '5', description: 'Number of intensity steps, clamped to 1–5.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell size: size-3 / size-4 / size-6.' },
    { name: 'shape', type: "'square' | 'circle'", default: "'square'", description: 'Cell shape: slightly rounded square, or a circle (`rounded-full`) for a dot matrix. Applies to the legend swatches too.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between cells: 1px, 2px or 4px (`border-spacing`).' },
    { name: 'showLegend', type: 'boolean', default: 'true', description: 'Less … More swatch legend.' },
    { name: 'colLabelStep', type: 'number', default: '1', description: 'Show every n-th column label visibly; the others stay screen-reader only. With `fit` the step also grows automatically so labels never overlap.' },
    { name: 'fit', type: 'boolean', default: 'false', description: 'Stretch the columns to the width of the container. Cells stay square and grow up to 40px (`size` is ignored; `shape` and `gap` still apply). The table keeps its semantics through ARIA roles. The first and last column labels always show and the ones between are thinned so none overlap.' },
    { name: 'label', type: 'string', description: 'Accessible name of the region and its visually hidden table caption. Required (or pass `aria-label` / `aria-labelledby`); an auto-generated summary is only the fallback when strict mode is off.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when there are no cells.' },
    { name: 'cellTitle', type: '(value: number | null, rowLabel: string, colLabel: string) => string', description: 'Custom native tooltip per cell (default "Row, Col: value").' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data.',
      code: `<Heatmap
  label="Sample data: three rows by four columns"
  :row-labels="['Mon', 'Tue', 'Wed']"
  :col-labels="['9', '12', '15', '18']"
  :values="[[0, 3, 5, 1], [2, 8, 9, 4], [null, 1, 6, 2]]"
/>`,
    },
    {
      title: 'Commit calendar (7 × 26)',
      description: 'Deterministic sample data; `colLabelStep` thins the visible week labels, `cellTitle` customises tooltips. The grid scrolls inside its own focusable region on a phone.',
      script: `const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weeks = Array.from({ length: 26 }, (_, i) => 'W' + (i + 1))
const grid = days.map((_, r) => weeks.map((_, c) => ((r * 7 + c * 13) % 11 < 3 ? 0 : (r * 31 + c * 17) % 9)))`,
      code: `<Heatmap
  size="sm"
  label="Sample data: activity by weekday and week"
  tone="success"
  :row-labels="days"
  :col-labels="weeks"
  :col-label-step="4"
  :values="grid"
  :cell-title="(v, r, c) => (v ? v + ' commits' : 'No commits') + ' on ' + r + ', ' + c"
/>`,
      state: () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const weeks = Array.from({ length: 26 }, (_, i) => 'W' + (i + 1))
        const grid = days.map((_, r) => weeks.map((_, c) => ((r * 7 + c * 13) % 11 < 3 ? 0 : (r * 31 + c * 17) % 9)))
        return { days, weeks, grid }
      },
    },
    {
      title: 'Fit the container',
      description: '`fit` fills the available width with square cells and thins the hour labels to fit. Deterministic sample data.',
      code: `<Heatmap fit label="Sample data: requests by hour" :row-labels="['Mon', 'Tue', 'Wed']" :col-labels="Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00')" :values="Array.from({ length: 3 }, (_, r) => Array.from({ length: 24 }, (_, c) => (r * 7 + c * 3) % 11))" />`,
    },
    {
      title: 'Shape: square and circle',
      description: 'The same sample data as squares and as dots. Intensity and the hidden values are identical; circles suit a sparse matrix, squares a calendar.',
      code: `<div class="flex flex-wrap items-start gap-8">
  <Heatmap shape="square" label="Sample data: square cells" :row-labels="['Mon', 'Tue']" :col-labels="['9', '12', '15']" :values="[[0, 3, 5], [2, 8, 9]]" />
  <Heatmap shape="circle" size="lg" label="Sample data: circle cells" :row-labels="['Mon', 'Tue']" :col-labels="['9', '12', '15']" :values="[[0, 3, 5], [2, 8, 9]]" />
</div>`,
    },
    {
      title: 'Gap',
      description: 'Tight, default and wide spacing between cells. Sample data.',
      code: `<div class="flex flex-wrap items-start gap-8">
  <Heatmap gap="sm" label="Sample data: tight cells" :values="[[1, 4, 7], [3, 6, 9]]" :show-legend="false" />
  <Heatmap gap="md" label="Sample data: default cells" :values="[[1, 4, 7], [3, 6, 9]]" :show-legend="false" />
  <Heatmap gap="lg" shape="circle" label="Sample data: wide spacing" :values="[[1, 4, 7], [3, 6, 9]]" :show-legend="false" />
</div>`,
    },
    {
      title: 'Empty',
      code: `<Heatmap label="Activity by weekday" :values="[]" empty-text="No activity yet" />`,
    },
  ],
  a11y: [
    'Native table semantics: row and column labels are `<th scope>`, cells are `<td>`; a visually hidden `<caption>` carries `label` or an automatic summary.',
    'Each cell contains its value as visually hidden text ("no data" for empty cells), so colour is never the only carrier; the swatch has a native tooltip.',
    'The grid sits in a focusable `role="region"` (named by `label` or the summary) that scrolls horizontally, so a wide heatmap never widens the page and keyboard users can scroll it. Text is 12px; the legend uses tabular figures.',
    'The empty state is a `role="img"` element labelled with `emptyText`.',
    '`shape` and `gap` change only the swatches: the table, the hidden values and the intensity steps are identical. Circles are not read differently from squares.',
  ],
  related: ['BarChart', 'LineChart', 'DonutChart', 'Table'],
  requires: [
    'Throws a ContractError when there is no `label` (or `aria-label` / `aria-labelledby`).',
    'Throws a ContractError when `values` is not an array of rows (each row an array). An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `values` as rows × columns; use null for missing cells (zero is also drawn as empty).',
    'Provide `rowLabels`/`colLabels` so the table is understandable to screen readers.',
    'Use `shape="circle"` for sparse matrices and `gap="lg"` to separate cells further; keep squares for dense calendars. `levels` already sets the number of intensity steps (1 to 5), so there is no separate `scale` prop.',
    'Use `colLabelStep` for wide calendars instead of removing labels.',
    'Pick one `tone`; do not mix colours. Use `min`/`max` to compare several heatmaps on one scale.',
  ],
  replaces: ['GitHub-style contribution calendar components', 'custom div-grid heatmaps'],
}
export default doc
