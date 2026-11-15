import type { ComponentDoc } from '../../../docs-types'

const TONE = "'auto' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'"

const flows = [
  { source: 'Orders', target: 'Shipped', value: 80 },
  { source: 'Orders', target: 'Returned', value: 20 },
  { source: 'Shipped', target: 'Delivered', value: 70 },
  { source: 'Shipped', target: 'Lost', value: 10 },
]

const doc: ComponentDoc = {
  name: 'Sankey',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Flow diagram: nodes in layers joined by ribbons whose width is the amount that flows, with a table of flows as the text alternative.',
  description:
    'Use `Sankey` to show how a quantity moves and splits across stages (orders to outcomes, budget to spending lines, traffic to pages), when the paths matter as much as the totals. Pass `links` of `{ source, target, value }`; nodes are created from the ids, and an optional `nodes` list sets labels. The layout is layered and deterministic: a node sits one layer after its latest source, nodes that nothing leaves line up on the right edge, and a fixed number of relaxation passes places nodes near the nodes they exchange flow with. Repeated source and target pairs are added up. Flows with a value that is not above zero, flows from a node to itself and flows that close a loop are left out and reported in a message. `variant` chooses solid nodes with tinted ribbons or outlined nodes with hairline-edged ribbons; ribbon opacity comes from tokens (`linkOpacity`), never a gradient. Do not use it for a few categories without stages (use `DonutChart` or `BarChart`), for flows that loop back, or for more than a few dozen nodes.',
  status: 'stable',
  props: [
    { name: 'links', type: 'SankeyLink[]', required: true, description: '`{ source, target, value }` flows between node ids. Repeated pairs are added up. An empty array shows `emptyText`.' },
    { name: 'nodes', type: 'SankeyNode[]', description: '`{ id, label? }` entries to set labels. Ids that only appear in `links` become nodes labelled with the id; nodes that no flow touches are left out.' },
    { name: 'variant', type: "'flat' | 'outline'", default: "'flat'", description: '`flat` solid nodes and tinted ribbons; `outline` empty nodes with a tone coloured edge and ribbons with a hairline edge.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the drawing: 220, 320 or 440 (an explicit `height` wins).' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Vertical space between the nodes of one layer: 6, 12 or 22 px.' },
    { name: 'tone', type: TONE, default: "'auto'", description: '`auto` gives each node the next chart colour and colours a ribbon like its source; any other value paints the whole diagram in that token.' },
    { name: 'linkOpacity', type: "'soft' | 'medium' | 'strong'", default: "'medium'", description: 'Ribbon opacity: 15, 30 or 45 percent of the tone. Labels stay readable over all three.' },
    { name: 'showValues', type: 'boolean', default: 'true', description: 'Print the node value after its label.' },
    { name: 'valueFormatter', type: '(n: number) => string', description: 'Formats values in labels, tooltips and the table. Default: grouped number with up to two decimals.' },
    { name: 'label', type: 'string', description: 'Accessible name of the diagram. Required unless `title`, `aria-label` or `aria-labelledby` is set.' },
    { name: 'title', type: 'string', description: 'Visible heading above the diagram; also the name when there is no `label`.' },
    { name: 'description', type: 'string', description: 'Visible sentence under the title.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown when there is no flow to draw.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width until the container is measured. The diagram then fills its container (1 unit = 1 CSS pixel).' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample order outcomes for a fictional shop. Nodes come from the ids in `links`.',
      code: `<Sankey
  label="Sample order outcomes"
  :links="[
    { source: 'Orders', target: 'Shipped', value: 80 },
    { source: 'Orders', target: 'Returned', value: 20 },
    { source: 'Shipped', target: 'Delivered', value: 70 },
    { source: 'Shipped', target: 'Lost', value: 10 }
  ]"
/>`,
    },
    {
      title: 'Variant: flat and outline',
      description: 'Solid nodes with tinted ribbons, and empty nodes with a coloured edge. Same data and geometry.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <Sankey variant="flat" size="sm" label="Sample outcomes, flat" :links="flows" />
  <Sankey variant="outline" size="sm" label="Sample outcomes, outline" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
    {
      title: 'Size',
      description: 'Drawing height 220, 320 and 440.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Sankey size="sm" label="Sample, small" :links="flows" />
  <Sankey size="md" label="Sample, medium" :links="flows" />
  <Sankey size="lg" label="Sample, large" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
    {
      title: 'Gap between nodes',
      description: 'Space between nodes of one layer: 6, 12 and 22 px. A wider gap leaves less height for the nodes.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Sankey gap="sm" size="sm" label="Sample, small gap" :links="flows" />
  <Sankey gap="md" size="sm" label="Sample, medium gap" :links="flows" />
  <Sankey gap="lg" size="sm" label="Sample, large gap" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
    {
      title: 'Ribbon opacity',
      description: 'Soft, medium and strong ribbons (15, 30, 45 percent of the token).',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <Sankey link-opacity="soft" size="sm" label="Sample, soft ribbons" :links="flows" />
  <Sankey link-opacity="medium" size="sm" label="Sample, medium ribbons" :links="flows" />
  <Sankey link-opacity="strong" size="sm" label="Sample, strong ribbons" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
    {
      title: 'Tone',
      description: 'Automatic chart colours per node, or one token for the whole diagram.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <Sankey tone="auto" size="sm" label="Sample, automatic colours" :links="flows" />
  <Sankey tone="chart-2" size="sm" label="Sample, one tone" :links="flows" />
  <Sankey tone="success" variant="outline" size="sm" label="Sample, success" :links="flows" />
  <Sankey tone="muted" variant="outline" size="sm" label="Sample, muted" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
    {
      title: 'Labels, title and value formatter',
      description: 'Declared node labels, a visible title and description, and a formatter for units. Sample budget for a fictional company.',
      code: `<Sankey
  title="Sample budget by line"
  description="Sample data for Orchard Mill, in thousands."
  show-values
  :value-formatter="(n) => n + 'k'"
  :nodes="[
    { id: 'budget', label: 'Budget' },
    { id: 'ops', label: 'Operations' },
    { id: 'people', label: 'People' },
    { id: 'rent', label: 'Rent' },
    { id: 'tools', label: 'Tools' }
  ]"
  :links="[
    { source: 'budget', target: 'ops', value: 60 },
    { source: 'budget', target: 'people', value: 140 },
    { source: 'ops', target: 'rent', value: 35 },
    { source: 'ops', target: 'tools', value: 25 },
    { source: 'people', target: 'tools', value: 12 }
  ]"
/>`,
    },
    {
      title: 'Without values',
      description: 'Labels only. The tooltips and the table still carry the numbers.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<Sankey :show-values="false" size="sm" label="Sample, labels only" :links="flows" />`,
      state: () => ({ flows }),
    },
    {
      title: 'Four layers and a loop',
      description: 'A longer chain. The last flow would close a loop, so it is left out and the message says so.',
      code: `<Sankey
  size="lg"
  label="Sample four-stage pipeline"
  :links="[
    { source: 'Visits', target: 'Signed up', value: 120 },
    { source: 'Visits', target: 'Left', value: 280 },
    { source: 'Signed up', target: 'Active', value: 90 },
    { source: 'Signed up', target: 'Left', value: 30 },
    { source: 'Active', target: 'Paid', value: 40 },
    { source: 'Active', target: 'Left', value: 50 },
    { source: 'Paid', target: 'Visits', value: 5 }
  ]"
/>`,
    },
    {
      title: 'Empty and invalid flows',
      description: 'No flows shows `emptyText`. Flows with a zero, negative or non-numeric value are left out and counted.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <Sankey label="Sample, no flows" :links="[]" empty-text="No flows recorded" />
  <Sankey size="sm" label="Sample, some invalid flows" :links="[{ source: 'a', target: 'b', value: 5 }, { source: 'b', target: 'c', value: 0 }, { source: 'b', target: 'c', value: -2 }, { source: 'b', target: 'c', value: 3 }]" />
</div>`,
    },
    {
      title: 'Narrow container',
      description: 'The diagram measures its container and reflows into a 320px column; labels that no longer fit are dropped, the table keeps every flow.',
      script: `const flows = ${JSON.stringify(flows)}`,
      code: `<div class="w-80 max-w-full">
  <Sankey size="sm" label="Sample outcomes in a narrow column" :links="flows" />
</div>`,
      state: () => ({ flows }),
    },
  ],
  a11y: [
    'The drawing is one SVG `role="img"` named by `label` (or `title`, `aria-label`, `aria-labelledby`) and described by an automatic summary (nodes, flows, layers).',
    'A visually hidden table lists every flow as From, To and Value (first 200 rows). It is the text alternative; the nodes and ribbons also carry native tooltips ("Shipped to Lost: 10").',
    'Colour is never the only signal: every node that has room is labelled with its name and value, ribbons are matched to their ends by position and tooltip, and the table names every flow. Ribbon tints stay at 45 percent or less so labels over them keep their contrast in light and dark.',
    'The `outline` variant adds a hairline edge to ribbons and an edge to nodes, so shapes remain visible in forced-colors mode.',
    'The diagram is not interactive and has no motion. It scales to its container (1 unit = 1 CSS pixel), so text keeps its real size and nothing overflows at 320px.',
  ],
  related: ['BarChart', 'DonutChart', 'Treemap', 'NetworkGraph'],
  requires: [
    'Throws a ContractError when there is no `label`, `title`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `links` is not an array of flows. An empty array is valid and shows `emptyText`.',
  ],
  llmNotes: [
    'Pass `links` as `{ source, target, value }` with ids that name the nodes; add `nodes` only to set labels.',
    'Values must be numbers above zero. Do not pass flows that loop back (A to B to A); they are dropped.',
    'Always set `label` or `title`; use `valueFormatter` for units.',
    'Use `variant="outline"` for dense pages, `tone` for one-colour diagrams, `linkOpacity` to tune ribbon weight. Never add gradients.',
    'Do not use a Sankey for categories without stages, or for more than a few dozen nodes. Use BarChart, DonutChart or Treemap.',
  ],
  replaces: ['d3-sankey wrappers', 'hand-rolled SVG flow diagrams'],
}
export default doc
