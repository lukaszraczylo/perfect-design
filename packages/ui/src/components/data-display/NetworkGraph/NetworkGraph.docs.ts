import type { ComponentDoc } from '../../../docs-types'

type Site = { id: string; label: string; group?: string }
type Link = { from: string; to: string; weight?: number; label?: string; directed?: boolean }

const sites: Site[] = [
  { id: 'kestrel', label: 'Kestrel Freight', group: 'Carrier' },
  { id: 'orchard', label: 'Orchard Mill', group: 'Producer' },
  { id: 'brightwater', label: 'Brightwater Co', group: 'Retail' },
  { id: 'quarry', label: 'Quarry Row', group: 'Producer' },
  { id: 'halden', label: 'Halden Optics', group: 'Retail' },
  { id: 'tallow', label: 'Tallow and Finch', group: 'Carrier' },
]
const links: Link[] = [
  { from: 'kestrel', to: 'orchard', weight: 3, label: 'Pickup' },
  { from: 'kestrel', to: 'quarry', weight: 2 },
  { from: 'orchard', to: 'brightwater', weight: 4, label: 'Flour' },
  { from: 'quarry', to: 'halden', weight: 1 },
  { from: 'tallow', to: 'kestrel', weight: 2 },
  { from: 'tallow', to: 'brightwater', weight: 1 },
  { from: 'halden', to: 'brightwater', weight: 1 },
]

const SCRIPT = `const sites = [
  { id: 'kestrel', label: 'Kestrel Freight', group: 'Carrier' },
  { id: 'orchard', label: 'Orchard Mill', group: 'Producer' },
  { id: 'brightwater', label: 'Brightwater Co', group: 'Retail' },
  { id: 'quarry', label: 'Quarry Row', group: 'Producer' },
  { id: 'halden', label: 'Halden Optics', group: 'Retail' },
  { id: 'tallow', label: 'Tallow and Finch', group: 'Carrier' },
]
const links = [
  { from: 'kestrel', to: 'orchard', weight: 3, label: 'Pickup' },
  { from: 'kestrel', to: 'quarry', weight: 2 },
  { from: 'orchard', to: 'brightwater', weight: 4, label: 'Flour' },
  { from: 'quarry', to: 'halden', weight: 1 },
  { from: 'tallow', to: 'kestrel', weight: 2 },
  { from: 'tallow', to: 'brightwater', weight: 1 },
  { from: 'halden', to: 'brightwater', weight: 1 },
]`
const state = () => ({ sites, links })

const doc: ComponentDoc = {
  name: 'NetworkGraph',
  group: 'data-display',
  subgroup: 'Charts',
  summary: 'Dependency-free node-link diagram with four deterministic layouts, group colours with marker shapes, arrowheads, hulls and a text alternative.',
  description:
    'Use `NetworkGraph` to show how things connect: services that call each other, sites on a route, people in a team. Pass `nodes` (`{ id, label?, group?, size? }`) and `edges` (`{ from, to, weight?, directed?, label? }`). `layout` places the nodes: `force` (a spring simulation with a fixed number of steps and no randomness, so the same data always gives the same picture), `circular`, `grid` or `layered` (left to right along the edge direction; cycles are broken deterministically). `variant` sets how much is drawn: `plain`, `labelled` (node and connection labels, up to 120 nodes) or `grouped` (a dashed hull around every group). Nodes grow with their weighted degree (the sum of the weights of their connections) unless `size` is set, so mix `size` on all nodes or on none. Group is told by colour and by marker shape (circle, square, diamond, triangle), and listed in a legend. Hover or focus a node to keep it and its neighbours at full strength and dim the rest. Bad data is handled in place: duplicate ids are ignored, connections to unknown ids are skipped, more than `maxNodes` nodes (default 300) are cut, and a short message under the graph says what happened. Do not use it for more than a few hundred nodes or for a tree; use `Tree` for hierarchies.',
  status: 'stable',
  props: [
    { name: 'nodes', type: '{ id: string; label?: string; group?: string; size?: number }[]', required: true, description: 'The nodes. `id` is unique and required; a repeated id is ignored. `label` defaults to the id. `group` sets colour, marker shape and hull. `size` is a relative size (positive number).' },
    { name: 'edges', type: '{ from: string; to: string; weight?: number; directed?: boolean; label?: string }[]', default: '[]', description: 'Connections between node ids. `weight` (positive) widens the line and enlarges both nodes; `directed` draws an arrowhead at `to`; `label` shows on the line in the `labelled` variant. Unknown ids are skipped and counted; `from` equal to `to` draws a loop.' },
    { name: 'layout', type: "'force' | 'circular' | 'grid' | 'layered'", default: "'force'", description: 'Placement. `force` is a spring simulation with fixed steps, `circular` puts the nodes on a ring grouped by group, `grid` fills rows, `layered` stacks columns along the edge direction.' },
    { name: 'variant', type: "'plain' | 'labelled' | 'grouped'", default: "'plain'", description: '`plain` draws nodes and lines; `labelled` adds node labels (cut at 12 characters) and connection labels, up to 120 nodes; `grouped` outlines every group with a dashed hull.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Drawing height when `height` is not set: 200 / 300 / 420 viewBox units. Also the gap between title, drawing, legend and messages.' },
    { name: 'edgeStyle', type: "'straight' | 'curved'", default: "'straight'", description: '`curved` bends every line to one side of its direction, so a connection A to B and one B to A no longer overlap.' },
    { name: 'directed', type: 'boolean', default: 'false', description: 'Draw an arrowhead on every connection that does not set its own `directed`.' },
    { name: 'showLegend', type: "boolean | 'auto'", default: "'auto'", description: 'Legend of groups with their colour and marker. `auto` shows it when any node has a group; `false` hides it.' },
    { name: 'maxNodes', type: 'number', default: '300', description: 'Most nodes drawn, 1 to 5000. The first nodes are kept; a message says how many were left out. Connections to left-out nodes are skipped.' },
    { name: 'title', type: 'string', description: 'Visible title above the drawing (plain text, not a heading). Also names the graph when `label` is not set.' },
    { name: 'description', type: 'string', description: 'Visible description under the title.' },
    { name: 'label', type: 'string', description: 'Accessible name of the graph. Required unless `title`, `aria-label` or `aria-labelledby` is set; an automatic summary ("Network graph: 6 nodes, 7 connections, 3 groups") is only the fallback when strict mode is off.' },
    { name: 'emptyText', type: 'string', default: "'No data'", description: 'Shown (as role="img") when there is nothing to draw.' },
    { name: 'width', type: 'number', default: '480', description: 'ViewBox width used until the container is measured. The graph then fills its container (1 unit = 1 CSS px), so text keeps its size at 320px.' },
    { name: 'height', type: 'number', description: 'ViewBox height. Overrides `size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Sample data: six sites and seven connections, force layout.',
      script: SCRIPT,
      code: `<NetworkGraph class="max-w-xl" label="Sample data: how six sites connect" :nodes="sites" :edges="links" />`,
      state,
    },
    {
      title: 'Layout',
      description: 'The same sample data placed four ways. `force` and `layered` follow the connections; `circular` and `grid` group nodes by their group.',
      script: SCRIPT,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph layout="force" size="sm" label="Sample data: force layout" :nodes="sites" :edges="links" />
  <NetworkGraph layout="circular" size="sm" label="Sample data: circular layout" :nodes="sites" :edges="links" />
  <NetworkGraph layout="grid" size="sm" label="Sample data: grid layout" :nodes="sites" :edges="links" />
  <NetworkGraph layout="layered" size="sm" directed label="Sample data: layered layout" :nodes="sites" :edges="links" />
</div>`,
      state,
    },
    {
      title: 'Variant',
      description: '`plain` is the picture alone, `labelled` names every node and connection, `grouped` outlines each group with a hull.',
      script: SCRIPT,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph variant="plain" layout="circular" label="Sample data: plain variant" :nodes="sites" :edges="links" />
  <NetworkGraph variant="labelled" layout="circular" label="Sample data: labelled variant" :nodes="sites" :edges="links" />
  <NetworkGraph class="md:col-span-2" variant="grouped" label="Sample data: grouped variant" :nodes="sites" :edges="links" />
</div>`,
      state,
    },
    {
      title: 'Size',
      description: 'Drawing height of 200, 300 and 420 units. `height` sets any other value.',
      script: SCRIPT,
      code: `<div class="grid gap-6 md:grid-cols-3">
  <NetworkGraph size="sm" layout="circular" label="Sample data: small" :nodes="sites" :edges="links" />
  <NetworkGraph size="md" layout="circular" label="Sample data: medium" :nodes="sites" :edges="links" />
  <NetworkGraph size="lg" layout="circular" label="Sample data: large" :nodes="sites" :edges="links" />
</div>`,
      state,
    },
    {
      title: 'Edge style and arrowheads',
      description: 'Straight and curved lines. With `directed` every line gets an arrowhead; a connection can opt out with `directed: false`. The two-way pair below separates only when curved.',
      script: `const pair = [
  { id: 'a', label: 'Kestrel Freight' },
  { id: 'b', label: 'Orchard Mill' },
  { id: 'c', label: 'Quarry Row' },
]
const trips = [
  { from: 'a', to: 'b' },
  { from: 'b', to: 'a' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'a', directed: false },
]`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph edge-style="straight" directed layout="circular" label="Sample data: straight lines" :nodes="pair" :edges="trips" />
  <NetworkGraph edge-style="curved" directed layout="circular" label="Sample data: curved lines" :nodes="pair" :edges="trips" />
</div>`,
      state: () => ({
        pair: [{ id: 'a', label: 'Kestrel Freight' }, { id: 'b', label: 'Orchard Mill' }, { id: 'c', label: 'Quarry Row' }],
        trips: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }, { from: 'b', to: 'c' }, { from: 'c', to: 'a', directed: false }],
      }),
    },
    {
      title: 'Weight and node size',
      description: 'Without `size` a node grows with the sum of its connection weights and a line widens with its own weight. With `size` the node size is yours.',
      script: SCRIPT + `
const sized = sites.map((s, i) => ({ ...s, size: [8, 3, 5, 2, 2, 6][i] }))`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph variant="labelled" label="Sample data: size by weighted degree" :nodes="sites" :edges="links" />
  <NetworkGraph variant="labelled" label="Sample data: explicit node sizes" :nodes="sized" :edges="links" />
</div>`,
      state: () => ({ sites, links, sized: sites.map((s, i) => ({ ...s, size: [8, 3, 5, 2, 2, 6][i] })) }),
    },
    {
      title: 'Groups, markers and legend',
      description: 'Each group has its own colour and marker shape, so the groups still differ without colour. The legend lists them; `:show-legend="false"` hides it. Nodes without a group are muted circles.',
      script: SCRIPT + `
const mixed = [...sites, { id: 'depot', label: 'Depot 9' }]`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph variant="grouped" label="Sample data: groups with a legend" :nodes="mixed" :edges="links" />
  <NetworkGraph :show-legend="false" layout="circular" label="Sample data: groups without a legend" :nodes="sites" :edges="links" />
</div>`,
      state: () => ({ sites, links, mixed: [...sites, { id: 'depot', label: 'Depot 9' }] }),
    },
    {
      title: 'Layered with cycles',
      description: 'Dependencies read left to right. The last connection closes a cycle; the layout reverses it for placement only and still draws the arrow the right way round.',
      script: `const steps = [
  { id: 'cut', label: 'Cut' },
  { id: 'sew', label: 'Sew' },
  { id: 'dye', label: 'Dye' },
  { id: 'press', label: 'Press' },
  { id: 'pack', label: 'Pack' },
  { id: 'rework', label: 'Rework' },
]
const flow = [
  { from: 'cut', to: 'sew' },
  { from: 'cut', to: 'dye' },
  { from: 'sew', to: 'press' },
  { from: 'dye', to: 'press' },
  { from: 'press', to: 'pack' },
  { from: 'pack', to: 'rework' },
  { from: 'rework', to: 'sew' },
]`,
      code: `<NetworkGraph layout="layered" variant="labelled" directed edge-style="curved" size="lg" label="Sample data: production steps with a rework cycle" :nodes="steps" :edges="flow" />`,
      state: () => ({
        steps: [{ id: 'cut', label: 'Cut' }, { id: 'sew', label: 'Sew' }, { id: 'dye', label: 'Dye' }, { id: 'press', label: 'Press' }, { id: 'pack', label: 'Pack' }, { id: 'rework', label: 'Rework' }],
        flow: [{ from: 'cut', to: 'sew' }, { from: 'cut', to: 'dye' }, { from: 'sew', to: 'press' }, { from: 'dye', to: 'press' }, { from: 'press', to: 'pack' }, { from: 'pack', to: 'rework' }, { from: 'rework', to: 'sew' }],
      }),
    },
    {
      title: 'Self loops and separate parts',
      description: 'A node that connects to itself draws a loop; parts with no link between them stay in view side by side.',
      script: `const parts = [
  { id: 'a', label: 'Kestrel Freight' },
  { id: 'b', label: 'Orchard Mill' },
  { id: 'c', label: 'Quarry Row' },
  { id: 'd', label: 'Halden Optics' },
  { id: 'e', label: 'Depot 9' },
]
const ties = [
  { from: 'a', to: 'b' },
  { from: 'b', to: 'b', directed: true, label: 'Repack' },
  { from: 'c', to: 'd' },
]`,
      code: `<NetworkGraph variant="labelled" label="Sample data: loops and unconnected parts" :nodes="parts" :edges="ties" />`,
      state: () => ({
        parts: [{ id: 'a', label: 'Kestrel Freight' }, { id: 'b', label: 'Orchard Mill' }, { id: 'c', label: 'Quarry Row' }, { id: 'd', label: 'Halden Optics' }, { id: 'e', label: 'Depot 9' }],
        ties: [{ from: 'a', to: 'b' }, { from: 'b', to: 'b', directed: true, label: 'Repack' }, { from: 'c', to: 'd' }],
      }),
    },
    {
      title: 'Cap and messages',
      description: 'Sample data with 12 nodes and `maxNodes="8"`: the first eight are drawn and a message says so. A repeated id and a connection to an unknown id are reported too.',
      script: `const many = Array.from({ length: 12 }, (_, i) => ({ id: 'n' + i, label: 'Site ' + (i + 1) }))
const rows = [{ id: 'n3', label: 'Repeated' }, ...many]
const chain = [...many.slice(1).map((n, i) => ({ from: 'n' + i, to: n.id })), { from: 'n0', to: 'missing' }]`,
      code: `<NetworkGraph :max-nodes="8" layout="circular" label="Sample data: more nodes than the cap" :nodes="rows" :edges="chain" />`,
      state: () => {
        const many = Array.from({ length: 12 }, (_, i) => ({ id: 'n' + i, label: 'Site ' + (i + 1) }))
        return { rows: [{ id: 'n3', label: 'Repeated' }, ...many], chain: [...many.slice(1).map((n, i) => ({ from: 'n' + i, to: n.id })), { from: 'n0', to: 'missing' }] }
      },
    },
    {
      title: 'Title, description and empty state',
      description: 'A visible title names the graph. Without nodes the empty state shows `emptyText`.',
      script: SCRIPT,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <NetworkGraph size="sm" title="Supply routes" description="Sample data" layout="layered" directed :nodes="sites" :edges="links" />
  <NetworkGraph label="Supply routes" :nodes="[]" empty-text="No routes yet" />
</div>`,
      state,
    },
  ],
  a11y: [
    'The drawing is a `role="group"` named by `label` (or `title`, `aria-label`, `aria-labelledby`). Every node is a focusable `role="img"` named with its label, group, number of connections and up to five neighbours.',
    'Keyboard: Tab enters the graph on one node (a roving tab stop); Arrow Right and Down move to the next node, Arrow Left and Up to the previous one, Home and End jump to the first and last. The order follows the layout (grouped for circular and grid, by column for layered). Tab leaves the graph. Hover and focus highlight the node, its neighbours and their lines; the rest dims. Focus also draws a ring.',
    'Group is never colour alone: each group has a marker shape (circle, square, diamond, triangle), the legend shows both, and the node name includes the group. Direction is an arrowhead, not a colour. Nodes keep an outline in forced-colors mode.',
    'A visually hidden text alternative follows the drawing: a table of nodes (name, group, connections written as "A to B (weight 3)") and a table of connections (pair, weight, label), each cut at 200 rows with the cut stated in the caption.',
    'Messages about cut or skipped data are plain text under the graph. The empty state is a `role="img"` with `emptyText`.',
    'The drawing scales to the container (1 unit = 1 CSS px) and reflows at 320px. Highlight changes use opacity only, with a transition under `motion-safe`; nothing moves on its own.',
  ],
  requires: [
    'Throws a ContractError when there is no `label`, `title`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `nodes` is not an array. An empty array is valid and shows the empty state.',
    'Throws a ContractError when a node has no `id` (a non-empty string).',
    'Throws a ContractError when `edges` is given and is not an array.',
    'Throws a ContractError when a connection has no `from` or no `to`.',
  ],
  llmNotes: [
    'Always pass `label` or `title`; give every node a unique `id` and use those ids in `edges`.',
    'Use `group` for categories: it sets colour, marker shape, the legend and the `grouped` hulls. Do not add a second colour prop.',
    'Pick `layout="layered"` with `directed` for flows and dependencies, `circular` for small symmetric sets, `grid` for lists, `force` (the default) for general networks.',
    'Use `variant="labelled"` for fewer than about 30 nodes; larger graphs stay `plain` and rely on hover, focus and the legend.',
    'Do not pass random or time-based data to force a different picture: the layout is deterministic by design.',
    'Raise `maxNodes` only when you must; the default of 300 keeps the drawing readable and fast.',
  ],
  related: ['Sankey', 'Treemap', 'Tree', 'BarChart'],
  replaces: ['hand-rolled SVG node-link diagrams', 'force-graph libraries for small and medium networks'],
}
export default doc
