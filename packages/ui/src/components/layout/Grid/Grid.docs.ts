import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Grid',
  group: 'layout',
  subgroup: 'Stacks & grids',
  summary: 'CSS grid with 1-12 columns, per-breakpoint column counts and a gap scale.',
  description:
    'Use `Grid` for card galleries, stat rows and form layouts. Set `cols` for the base (mobile) count and `sm`/`md`/`lg`/`xl` to change it from that breakpoint upwards (mobile-first). All class names come from fixed maps so Tailwind generates them. Invalid column numbers fall back to 1 (base) or are ignored (breakpoints). For content-driven grids set `minItemWidth` (e.g. `16rem`): the grid fits as many columns as possible, each at least that wide (`repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`), so no breakpoints are needed. Add `autoFill` to keep empty tracks. `gapSm` / `gapMd` / `gapLg` grow the gap responsively. `variant` draws each direct child as a `bordered` or `card` cell and `layout` sets emphasis: `lead` makes the first item span the whole row, `feature` makes it span 2 columns and 2 rows from `md` up (use at least 3 columns from `md`). For other span control apply your own classes on the children.',
  status: 'stable',
  props: [
    { name: 'cols', type: '1 | 2 | … | 12', default: '1', description: 'Base column count. Invalid values fall back to 1.' },
    { name: 'sm', type: '1 | 2 | … | 12', description: 'Columns from the `sm` breakpoint up.' },
    { name: 'md', type: '1 | 2 | … | 12', description: 'Columns from the `md` breakpoint up.' },
    { name: 'lg', type: '1 | 2 | … | 12', description: 'Columns from the `lg` breakpoint up.' },
    { name: 'xl', type: '1 | 2 | … | 12', description: 'Columns from the `xl` breakpoint up.' },
    { name: 'gap', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', default: '4', description: 'Gap on both axes. Invalid values fall back to 4.' },
    { name: 'gapSm', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `sm` breakpoint up (sm:gap-*). Invalid values are ignored.' },
    { name: 'gapMd', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `md` breakpoint up (md:gap-*). Invalid values are ignored.' },
    { name: 'gapLg', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Gap from the `lg` breakpoint up (lg:gap-*). Invalid values are ignored.' },
    { name: 'minItemWidth', type: 'string | number', description: 'Auto-fit mode: columns are at least this wide and as many as fit. Number = px, string = CSS length (`16rem`, `240px`, `20ch`, `30%`). Set through the `--grid-min` CSS variable; replaces base `cols`; breakpoint props (`sm`/`md`/...) still override it. Invalid values are ignored.' },
    { name: 'autoFill', type: 'boolean', default: 'false', description: 'With `minItemWidth`: use `auto-fill` (keeps empty tracks) instead of `auto-fit` (collapses empty tracks so items stretch).' },
    { name: 'gapX', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Column gap. Wins over `gap` and over `gapSm`/`gapMd`/`gapLg` horizontally at every breakpoint.' },
    { name: 'gapY', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', description: 'Row gap. Wins over `gap` and over `gapSm`/`gapMd`/`gapLg` vertically at every breakpoint.' },
    { name: 'variant', type: "'plain' | 'bordered' | 'card'", default: "'plain'", description: 'Cell look for every direct child. `plain`: none. `bordered`: rounded-lg, border, p-4. `card`: bordered bg-card cell with text-card-foreground. Cells get min-w-0. Applied with child selectors, so override with `class` on the grid (e.g. `[&>*]:p-6`). Unknown values fall back to `plain`.' },
    { name: 'layout', type: "'uniform' | 'lead' | 'feature'", default: "'uniform'", description: '`uniform`: equal cells. `lead`: the first item spans the full row at every width. `feature`: from `md` up the first item spans 2 columns and 2 rows (needs 3 or more columns from `md`); below `md` it is a normal cell. Unknown values fall back to `uniform`.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render, e.g. `ul`.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Grid items.' }],
  examples: [
    {
      title: 'Responsive columns',
      description: '1 column on mobile, 2 from sm, 4 from lg.',
      code: `<Grid :cols="1" :sm="2" :lg="4" :gap="3">
  <div v-for="n in 8" :key="n" class="rounded-md border bg-card p-4 text-sm">Sample item {{ n }}</div>
</Grid>`,
    },
    {
      title: 'Different row and column gaps',
      code: `<Grid :cols="3" :gap-x="6" :gap-y="2">
  <Badge v-for="n in 6" :key="n" variant="secondary">Cell {{ n }}</Badge>
</Grid>`,
    },
    {
      title: 'Auto-fit with minItemWidth',
      description: 'No breakpoints: as many columns as fit, each at least 12rem wide.',
      code: `<Grid min-item-width="12rem" :gap="3">
  <div v-for="n in 6" :key="n" class="rounded-md border bg-card p-4 text-sm">Sample card {{ n }}</div>
</Grid>`,
    },
    {
      title: 'Auto-fill and numeric width',
      description: '`autoFill` keeps empty tracks, so a few items do not stretch; a number means px.',
      code: `<Grid :min-item-width="160" auto-fill :gap="3">
  <div v-for="n in 2" :key="n" class="rounded-md border bg-card p-4 text-sm">Sample card {{ n }}</div>
</Grid>`,
    },
    {
      title: 'Responsive gaps',
      description: 'Gap grows from 2 to 4 (md) to 8 (lg).',
      code: `<Grid :cols="2" :gap="2" :gap-md="4" :gap-lg="8">
  <Badge v-for="n in 4" :key="n" variant="secondary">Cell {{ n }}</Badge>
</Grid>`,
    },
    {
      title: 'Cell variants',
      description: '`bordered` and `card` draw every direct child as a cell.',
      code: `<div class="space-y-4">
  <Grid :cols="1" :sm="3" :gap="3" variant="bordered">
    <div v-for="n in 3" :key="n" class="text-sm">Bordered cell {{ n }}</div>
  </Grid>
  <Grid :cols="1" :sm="3" :gap="3" variant="card">
    <div v-for="n in 3" :key="n" class="text-sm">Card cell {{ n }}</div>
  </Grid>
</div>`,
    },
    {
      title: 'Lead and feature layouts',
      description: '`lead` gives the first item a full row; `feature` gives it a 2 by 2 area from `md` up. Both stay one column at 320px.',
      code: `<div class="space-y-6">
  <Grid :cols="1" :sm="3" :gap="3" layout="lead" variant="card">
    <div class="text-sm font-medium">First item spans the row</div>
    <div v-for="n in 3" :key="n" class="text-sm">Sample item {{ n }}</div>
  </Grid>
  <Grid :cols="1" :md="3" :gap="3" layout="feature" variant="card">
    <div class="text-sm font-medium">First item spans two columns and two rows</div>
    <div v-for="n in 4" :key="n" class="text-sm">Sample item {{ n }}</div>
  </Grid>
</div>`,
    },
    {
      title: 'Two-column form',
      code: `<Grid :cols="1" :md="2" :gap="4" class="max-w-xl">
  <Input placeholder="First name" aria-label="First name" />
  <Input placeholder="Last name" aria-label="Last name" />
  <Input placeholder="Email" aria-label="Email" class="md:col-span-2" />
</Grid>`,
    },
  ],
  a11y: ['Presentational. Source order = reading order; do not reorder items with CSS in a way that breaks it.', 'Use `as="ul"` with `<li>` children for lists of cards.', 'Responsive: `cols` is the mobile (320px) layout, so start at 1 and add columns with `sm`/`md`/`lg`. `minItemWidth` clamps each track with `min(100%, width)`, so a track never exceeds the container and the grid cannot overflow at 320px.', 'Item content that must be able to shrink needs `min-w-0` (grid items default to `min-width: auto`); cells drawn by `variant` already have it.', '`lead` and `feature` only change spans, not source order, so reading order is unchanged. `feature` applies from `md` up, so the layout is a single column at 320px.'],
  related: ['Stack', 'Container', 'SplitLayout'],
  llmNotes: [
    'Write numbers as bound props: `:cols="3" :md="4"` (not cols="3" md="4").',
    'Mobile-first: `cols` is the smallest screen; sm/md/lg/xl only override upwards.',
    'Only 1-12 are valid for cols. For card galleries prefer `min-item-width="16rem"` (auto-fit) over breakpoint columns.',
    'minItemWidth takes a number (px) or a plain CSS length string; calc()/var() are rejected and ignored.',
    'Use gapSm/gapMd/gapLg for responsive spacing (mobile-first).',
    'Use `variant="card"` for card galleries instead of styling every child; put the most important item first and use `layout="lead"` or `"feature"` so it gets more room than the rest.',
  ],
  replaces: ['hand-rolled Grid markup in app code'],
}
export default doc
