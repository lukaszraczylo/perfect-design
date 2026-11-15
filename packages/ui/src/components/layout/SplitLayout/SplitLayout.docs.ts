import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'SplitLayout',
  group: 'layout',
  subgroup: 'Page structure',
  summary: 'Two-pane layout (start / end) with ratio presets, fixed-width pane and responsive stacking.',
  description:
    'Use `SplitLayout` for master/detail views, settings with a side panel, or content next to a preview. Choose a `ratio` preset (`1:1`, `1:2`, `2:1`, `1:3`, `3:1` as start:end; the older `equal`, `1/3`, `2/3` still work as aliases of `1:1`, `1:2`, `2:1`) or pin one pane to a CSS length with `fixed-start` / `fixed-end` + `fixedWidth`. Below the `stackBelow` breakpoint the panes stack vertically. Use `sticky="start"` or `"end"` to keep one pane (filters, summary, table of contents) in view while the other scrolls, and `reverseOnMobile` to show the end pane first when stacked (e.g. a summary above the form). Panes do not scroll by themselves; add `overflow-auto` and a height via `class` on the content you slot in. For resizable panes use a dedicated Resizable component.',
  status: 'stable',
  props: [
    { name: 'ratio', type: "'equal' | '1:1' | '1/3' | '1:2' | '2/3' | '2:1' | '1:3' | '3:1' | 'fixed-start' | 'fixed-end'", default: "'equal'", description: 'Column split, start:end. `1:1` = `equal`; `1:2` = `1/3` (start gets a third); `2:1` = `2/3` (start gets two thirds); `1:3` and `3:1` quarter splits. Unknown values fall back to equal.' },
    { name: 'fixedWidth', type: 'string', default: "'16rem'", description: 'CSS length of the fixed pane, set through the `--split-fixed` CSS variable. Only used by fixed-start / fixed-end.' },
    { name: 'stackBelow', type: "'md' | 'lg'", default: "'md'", description: 'Breakpoint below which the panes stack vertically.' },
    { name: 'gap', type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12', default: '0', description: 'Gap between panes.' },
    { name: 'divider', type: 'boolean', default: 'false', description: 'Border between the panes (horizontal when stacked, vertical when side by side).' },
    { name: 'sticky', type: "'start' | 'end'", description: 'Makes that pane sticky (self-start, top = stickyOffset) once side by side. Unknown values are ignored. Sets `data-sticky`.' },
    { name: 'stickyOffset', type: 'string', default: "'1rem'", description: 'CSS length for the sticky pane top offset, set through the `--split-sticky-top` CSS variable. Empty values fall back to 1rem.' },
    { name: 'reverseOnMobile', type: 'boolean', default: 'false', description: 'While stacked, show the end pane first (max-md:order-first / max-lg:order-first). DOM order is unchanged. Sets `data-reverse-mobile`.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'start', description: 'First pane (left in LTR).' },
    { name: 'end', description: 'Second pane (right in LTR).' },
  ],
  examples: [
    {
      title: 'Ratios',
      code: `<div class="flex flex-col gap-4">
  <SplitLayout ratio="1/3" :gap="4">
    <template #start><div class="rounded-md border p-3 text-sm">1/3</div></template>
    <template #end><div class="rounded-md border p-3 text-sm">2/3</div></template>
  </SplitLayout>
  <SplitLayout ratio="equal" :gap="4">
    <template #start><div class="rounded-md border p-3 text-sm">50%</div></template>
    <template #end><div class="rounded-md border p-3 text-sm">50%</div></template>
  </SplitLayout>
</div>`,
    },
    {
      title: 'Fixed sidebar with divider',
      code: `<SplitLayout ratio="fixed-start" fixed-width="12rem" divider class="rounded-md border">
  <template #start><div class="p-3 text-sm">Fixed 12rem</div></template>
  <template #end><div class="p-3 text-sm">Fluid remainder</div></template>
</SplitLayout>`,
    },
    {
      title: 'Quarter ratios',
      description: '`1:3` and `3:1` (start:end) for narrow rails next to wide content.',
      code: `<div class="flex flex-col gap-4">
  <SplitLayout ratio="1:3" :gap="4">
    <template #start><div class="rounded-md border p-3 text-sm">1</div></template>
    <template #end><div class="rounded-md border p-3 text-sm">3</div></template>
  </SplitLayout>
  <SplitLayout ratio="2:1" :gap="4">
    <template #start><div class="rounded-md border p-3 text-sm">2</div></template>
    <template #end><div class="rounded-md border p-3 text-sm">1</div></template>
  </SplitLayout>
</div>`,
    },
    {
      title: 'Sticky pane',
      description: 'The end pane stays in view (below a 0.5rem offset) while the start pane scrolls.',
      code: `<div class="h-48 overflow-auto rounded-md border p-2" tabindex="0" role="region" aria-label="Sticky pane demo">
  <SplitLayout ratio="2:1" :gap="4" sticky="end" sticky-offset="0.5rem">
    <template #start><div class="h-96 rounded-md border p-3 text-sm">Long sample content, scroll the box</div></template>
    <template #end><div class="rounded-md border bg-card p-3 text-sm">Sample sticky pane</div></template>
  </SplitLayout>
</div>`,
    },
    {
      title: 'Reverse on mobile',
      description: 'On narrow screens the summary (end pane) appears above the form; side by side it stays on the right.',
      code: `<SplitLayout ratio="2:1" :gap="4" reverse-on-mobile divider>
  <template #start><div class="p-3 text-sm">Sample form (first in the DOM)</div></template>
  <template #end><div class="p-3 text-sm">Sample summary (first when stacked)</div></template>
</SplitLayout>`,
    },
    {
      title: 'Stack below lg',
      code: `<SplitLayout stack-below="lg" ratio="2/3" :gap="6">
  <template #start><Badge>Start pane</Badge></template>
  <template #end><Badge variant="secondary">End pane</Badge></template>
</SplitLayout>`,
    },
  ],
  a11y: ['Presentational grid; DOM order (start, then end) is the reading and tab order, including when stacked. With `reverseOnMobile` the visual order differs from the DOM order, so only use it when both orders make sense.', 'Use `as` with a landmark (`section`) and aria-label when a pane is a distinct region.', 'Responsive: panes stack in one column below `stackBelow` (`md` by default, 768px; `lg` = 1024px) and both panes have `min-w-0`, so nothing overflows at 320px. A scrolling container around a sticky pane must be focusable and labelled (see the live example).', 'Ratios and the fixed width are applied through CSS variables (`--split-cols`, `--split-fixed`) so they follow the same breakpoint as the stack.'],
  related: ['Grid', 'AppShell', 'Stack'],
  llmNotes: [
    'Slots are named `start` and `end`.',
    'The ratio, fixedWidth and stickyOffset are applied as CSS variables (the only inline styles); pass any valid CSS length.',
    'Prefer a:b ratios (`1:2`, `2:1`) in new code; `1/3` and `2/3` are legacy aliases.',
    'Use sticky + stickyOffset for side summaries/filters; the sticky pane sticks to the nearest scroll container and only once side by side.',
    'reverseOnMobile changes visual order only; keep the important pane first in the DOM for screen readers.',
    'Panes use min-w-0 so wide content does not overflow; set overflow on your own content.',
  ],
  replaces: ['hand-rolled SplitLayout markup in app code'],
}
export default doc
