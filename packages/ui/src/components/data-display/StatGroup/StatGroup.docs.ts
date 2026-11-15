import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StatGroup',
  group: 'data-display',
  subgroup: 'Statistics',
  summary: 'Responsive grid wrapper for KpiTile (or any tile) rows.',
  description:
    'Use `StatGroup` to lay out a row of `KpiTile`s. The default `auto` mode fits as many tiles of at least 12rem per row as the container allows; pass `columns` for a fixed number at the `lg` breakpoint (collapsing to 2 then 1 column on small screens). Layouts: `grid` (default; separate tiles with gaps, best for card-style `KpiTile`s), `inline` (wrapping flex row, tiles grow from 10rem; best for a handful of compact tiles in a toolbar/header, `columns` is ignored), `divided` (one bordered surface with hairline dividers; the tiles lose their own border, radius and shadow; choose `columns` that divide the tile count evenly so no empty divider-coloured cell shows).',
  status: 'stable',
  props: [
    { name: 'layout', type: "'grid' | 'inline' | 'divided'", default: "'grid'", description: 'Arrangement of the tiles; unknown values fall back to `grid`.' },
    { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between tiles of the `grid` and `inline` layouts: 0, 0.5rem, 1rem, 1.5rem. `divided` ignores it (its rules are hairlines). Unknown values fall back to `md`.' },
    { name: 'columns', type: "'auto' | 1 | 2 | 3 | 4 | 5 | 6", default: "'auto'", description: 'Column count at the largest breakpoint; invalid values fall back to `auto`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Tiles.' }],
  examples: [
    {
      title: 'Auto layout',
      description: 'Sample data.',
      code: `<StatGroup aria-label="Sample data: auto layout">
  <KpiTile label="Requests" :value="98213" />
  <KpiTile label="Errors" :value="12" />
  <KpiTile label="Latency" value="142 ms" />
</StatGroup>`,
    },
    {
      title: 'Fixed four columns with aria-label',
      description: 'Sample data.',
      code: `<StatGroup :columns="4" aria-label="Key metrics">
  <KpiTile label="A" :value="1" />
  <KpiTile label="B" :value="2" />
  <KpiTile label="C" :value="3" />
  <KpiTile label="D" :value="4" />
</StatGroup>`,
    },
    {
      title: 'Inline layout',
      description: 'Wrapping flex row; tiles share the width and wrap below 10rem.',
      code: `<StatGroup layout="inline" aria-label="Summary">
  <KpiTile size="compact" label="Open" :value="24" />
  <KpiTile size="compact" label="In review" :value="7" />
  <KpiTile size="compact" label="Done" :value="311" />
</StatGroup>`,
    },
    {
      title: 'Divided layout',
      description: 'One framed surface, hairline dividers between tiles (use a column count that fits the tiles).',
      code: `<StatGroup layout="divided" :columns="4" aria-label="Totals">
  <KpiTile label="Requests" value="48k" delta="+12%" trend="up" />
  <KpiTile label="Completed" :value="1320" delta="+3%" trend="up" />
  <KpiTile label="Failed" :value="14" delta="+2" trend="up" good-when="down" />
  <KpiTile label="Success rate" value="3.4%" delta="0" trend="flat" />
</StatGroup>`,
    },
    {
      title: 'Gap sizes',
      description: 'Gallery of the four `gap` values on the grid layout (sample data).',
      code: `<div class="flex flex-col gap-6">
  <StatGroup gap="none" :columns="3" aria-label="Sample data: no gap">
    <KpiTile label="A" :value="1" variant="outline" />
    <KpiTile label="B" :value="2" variant="outline" />
    <KpiTile label="C" :value="3" variant="outline" />
  </StatGroup>
  <StatGroup gap="sm" :columns="3" aria-label="Sample data: small gap">
    <KpiTile label="A" :value="1" />
    <KpiTile label="B" :value="2" />
    <KpiTile label="C" :value="3" />
  </StatGroup>
  <StatGroup gap="lg" layout="inline" aria-label="Sample data: large gap">
    <KpiTile size="compact" label="A" :value="1" />
    <KpiTile size="compact" label="B" :value="2" />
    <KpiTile size="compact" label="C" :value="3" />
  </StatGroup>
</div>`,
    },
  ],
  a11y: [
    'Rendered with `role="group"`; give it an `aria-label` describing the metrics.',
    'Tiles keep their reading order in every layout and wrap or stack on a phone (`auto` fits 12rem columns, fixed counts collapse to 1 or 2 columns), so nothing scrolls sideways at 320px. Values and deltas inside the tiles use tabular figures.',
  ],
  related: ['KpiTile', 'Card'],
  llmNotes: ['Use `layout="divided"` for a single framed stats strip (columns must divide the tile count), `inline` for a few compact tiles, `grid` otherwise.', 'Use `columns` only when you need an exact count; prefer `auto`.', 'Always add aria-label when the group is not introduced by a heading.'],
  replaces: ['hand-written dashboard grids around StatCard/KpiTile'],
}
export default doc
