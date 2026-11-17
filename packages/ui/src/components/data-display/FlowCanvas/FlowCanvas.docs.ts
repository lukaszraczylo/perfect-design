import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Sample workflow. Every name is invented; the data is labelled as sample in the examples. */
const nodes = () => [
  { id: 'booking', label: 'Booking received', x: 20, y: 70, width: 150 },
  { id: 'check', label: 'Pallets fit the truck?', x: 250, y: 60, width: 170, height: 72, shape: 'rhombus' },
  { id: 'driver', label: 'Assign driver', x: 500, y: 20, tone: 'primary' },
  { id: 'split', label: 'Split the load', x: 500, y: 130, tone: 'warning' },
  { id: 'depart', label: 'Depart depot', x: 720, y: 70, shape: 'stadium', tone: 'success' },
]
const edges = () => [
  { id: 'e1', from: 'booking', to: 'check' },
  { id: 'e2', from: 'check', to: 'driver', label: 'Yes' },
  { id: 'e3', from: 'check', to: 'split', label: 'No' },
  { id: 'e4', from: 'split', to: 'driver', style: 'dashed' },
  { id: 'e5', from: 'driver', to: 'depart' },
]

const NODES_SCRIPT = `const nodes = ref([
  { id: 'booking', label: 'Booking received', x: 20, y: 70, width: 150 },
  { id: 'check', label: 'Pallets fit the truck?', x: 250, y: 60, width: 170, height: 72, shape: 'rhombus' },
  { id: 'driver', label: 'Assign driver', x: 500, y: 20, tone: 'primary' },
  { id: 'split', label: 'Split the load', x: 500, y: 130, tone: 'warning' },
  { id: 'depart', label: 'Depart depot', x: 720, y: 70, shape: 'stadium', tone: 'success' },
])
const edges = ref([
  { id: 'e1', from: 'booking', to: 'check' },
  { id: 'e2', from: 'check', to: 'driver', label: 'Yes' },
  { id: 'e3', from: 'check', to: 'split', label: 'No' },
  { id: 'e4', from: 'split', to: 'driver', style: 'dashed' },
  { id: 'e5', from: 'driver', to: 'depart' },
])`

const PORT_NODES = `const nodes = ref([
  { id: 'orders', label: 'Orders', x: 20, y: 90, ports: [{ id: 'out', side: 'right', type: 'source', label: 'Order out' }] },
  { id: 'stock', label: 'Stock check', x: 260, y: 20, ports: [
    { id: 'in', side: 'left', type: 'target', label: 'Order in' },
    { id: 'ok', side: 'right', type: 'source', label: 'In stock' },
    { id: 'short', side: 'bottom', type: 'source', label: 'Short' },
  ] },
  { id: 'pack', label: 'Pack', x: 500, y: 20, ports: [{ id: 'in', side: 'left', type: 'target' }] },
  { id: 'backorder', label: 'Backorder', x: 260, y: 170, tone: 'warning', ports: [{ id: 'in', side: 'top', type: 'target', label: 'Short items' }] },
])
const edges = ref([
  { id: 'e1', from: 'orders', to: 'stock', fromPort: 'out', toPort: 'in' },
  { id: 'e2', from: 'stock', to: 'pack', fromPort: 'ok', toPort: 'in' },
])`
const portNodes = () => [
  { id: 'orders', label: 'Orders', x: 20, y: 90, ports: [{ id: 'out', side: 'right', type: 'source', label: 'Order out' }] },
  {
    id: 'stock', label: 'Stock check', x: 260, y: 20,
    ports: [
      { id: 'in', side: 'left', type: 'target', label: 'Order in' },
      { id: 'ok', side: 'right', type: 'source', label: 'In stock' },
      { id: 'short', side: 'bottom', type: 'source', label: 'Short' },
    ],
  },
  { id: 'pack', label: 'Pack', x: 500, y: 20, ports: [{ id: 'in', side: 'left', type: 'target' }] },
  { id: 'backorder', label: 'Backorder', x: 260, y: 170, tone: 'warning', ports: [{ id: 'in', side: 'top', type: 'target', label: 'Short items' }] },
]
const portEdges = () => [
  { id: 'e1', from: 'orders', to: 'stock', fromPort: 'out', toPort: 'in' },
  { id: 'e2', from: 'stock', to: 'pack', fromPort: 'ok', toPort: 'in' },
]

const SHAPE_NAMES = ['rect', 'round', 'stadium', 'subroutine', 'cylinder', 'circle', 'rhombus', 'hexagon'] as const
const TONES = ['neutral', 'primary', 'success', 'info', 'warning', 'danger'] as const
const shapeNodes = () => SHAPE_NAMES.map((shape, i) => ({ id: shape, label: shape, x: 20 + (i % 4) * 190, y: 20 + Math.floor(i / 4) * 120, width: 150, height: shape === 'circle' ? 90 : 60, shape, tone: TONES[i % TONES.length] }))

const bigNodes = () => Array.from({ length: 300 }, (_, i) => ({ id: `n${i}`, label: `Stop ${i + 1}`, x: (i % 20) * 190, y: Math.floor(i / 20) * 90 }))
const bigEdges = () => Array.from({ length: 280 }, (_, i) => ({ id: `e${i}`, from: `n${i}`, to: `n${i + 1}` }))

const doc: ComponentDoc = {
  name: 'FlowCanvas',
  group: 'data-display',
  subgroup: 'Diagrams',
  summary: 'Interactive node and edge canvas: drag nodes, connect ports with the pointer or the keyboard, pan, zoom, undo, auto layout and a text alternative, drawn as one SVG with no extra dependency.',
  description:
    'Use `FlowCanvas` when people build or edit a graph: a workflow, a pipeline, a routing table. For a picture of a graph nobody edits, use `MermaidDiagram` or `NetworkGraph`. Bind `v-model:nodes` (`{ id, label?, x, y, width?, height?, shape?, tone?, ports? }`) and `v-model:edges` (`{ id, from, to, label?, fromPort?, toPort?, style? }`); without a binding the canvas keeps its own copy.\n\n' +
    '**Interaction.** Drag the background to pan (touch: one finger; two fingers pinch). Zoom with Ctrl or Command plus the wheel, the toolbar or the keys. Drag a node to move it (`grid` snaps). Drag from a port to another node to connect, or click a port and then a node. Shift plus drag, or the "Select area" toggle, draws a selection box. Every one of these has a keyboard path, see the accessibility notes. Undo and redo keep up to `historyLimit` steps.\n\n' +
    '**Exposed methods** (template ref): `autoLayout()` arranges the nodes with the layered layout of `MermaidDiagram` in `direction`, `fit()`, `zoomIn()`, `zoomOut()`, `zoomTo(n)`, `undo()`, `redo()`, `deleteSelected()`, `selectAll()`, `clearSelection()`, `getViewport()` and `setViewport()`. They also work when `readonly` (the caller asked for them); `readonly` blocks the user only.\n\n' +
    '**Limits.** No nested groups. Custom nodes go through the `node` slot, which draws SVG in the node\'s own coordinates (no HTML inside the canvas). Undo works on the data this component changed; edits you make elsewhere are not tracked. With more than 120 nodes only the nodes and connections near the visible area are drawn (300 nodes stay interactive). The canvas keeps left to right coordinates in right to left pages; the toolbar and labels follow the page direction. The canvas captures touch gestures, so scroll the page from outside it.',
  status: 'beta',
  props: [
    { name: 'nodes', type: 'FlowNode[]', default: '[]', description: '`v-model:nodes`. `{ id, label?, x, y, width?, height?, shape?, tone?, ports? }`. `x` and `y` are the top-left corner in canvas units; size defaults to 148 by 52; `shape` is any Mermaid node shape; `tone` is neutral, primary, success, info, warning or danger; `ports` defaults to one port per side and `[]` makes the node impossible to connect.' },
    { name: 'edges', type: 'FlowEdge[]', default: '[]', description: '`v-model:edges`. `{ id, from, to, label?, fromPort?, toPort?, style? }`. `from` and `to` are node ids, `style` is `solid`, `dashed` or `dotted`. A connection to an unknown node is not drawn and a note says so.' },
    { name: 'label', type: 'string', description: 'Accessible name of the canvas. Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'No editing by the user: nodes cannot be moved, connected, deleted or laid out, ports are hidden, undo and redo are off. Selecting, panning and zooming still work.' },
    { name: 'grid', type: 'number | boolean', default: 'false', description: 'Snap positions to this many canvas units while dragging and moving by keyboard. `true` is 20. It also sets the spacing of the `dots` and `grid` backgrounds.' },
    { name: 'variant', type: "'plain' | 'dots' | 'grid'", default: "'plain'", description: 'Background: a flat surface, a dot grid or grid lines. Both patterns move and scale with the canvas and fade out when they would be denser than 6 pixels.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the canvas: 288, 384 or 512 px (and the gap to the toolbar and list).' },
    { name: 'edgeStyle', type: "'straight' | 'curved' | 'orthogonal'", default: "'curved'", description: 'Shape of connections: a line, a smooth curve that leaves each port outward, or right angles with rounded corners.' },
    { name: 'direction', type: "'TB' | 'LR' | 'BT' | 'RL'", default: "'LR'", description: 'Direction of `autoLayout()` and the toolbar button: top to bottom, left to right, bottom to top or right to left.' },
    { name: 'toolbar', type: 'boolean', default: 'true', description: 'Show the toolbar above the canvas (zoom, fit, auto layout, undo, redo, delete, select area). The `toolbar` slot replaces its content.' },
    { name: 'minimap', type: 'boolean', default: 'false', description: 'Show a small overview in the bottom corner with the visible area; press or drag on it to move there. It is a pointer shortcut and hidden from assistive technology.' },
    { name: 'minZoom', type: 'number', default: '0.25', description: 'Lowest zoom factor, at most 1.' },
    { name: 'maxZoom', type: 'number', default: '2', description: 'Highest zoom factor, at least 1.' },
    { name: 'historyLimit', type: 'number', default: '50', description: 'Most undo steps kept, 1 to 500. Keyboard moves of the same nodes within one second count as one step.' },
    { name: 'autoFit', type: 'boolean', default: 'true', description: 'Fit all nodes into view once, when the canvas first has a size and nodes. Turn it off to keep the canvas origin at the top-left corner.' },
    { name: 'emptyText', type: 'string', default: "'No nodes yet'", description: 'Text shown while there are no nodes.' },
  ],
  slots: [
    { name: 'node', props: '{ node, selected, active, connecting, width, height }', description: 'Replaces the label of a node. SVG content in the node\'s own coordinates (0,0 is its top-left corner); the outline, selection ring and ports stay. Text is rendered as text, never as markup.' },
    { name: 'toolbar', props: '{ zoom, readonly, canUndo, canRedo, hasSelection, zoomIn, zoomOut, fit, autoLayout, undo, redo, deleteSelected }', description: 'Replaces the default toolbar content. Use the scoped functions so your buttons share the canvas history.' },
  ],
  emits: [
    { name: 'update:nodes', payload: '[nodes: FlowNode[]]', description: 'The node array changed (move, delete, layout, undo, redo).' },
    { name: 'update:edges', payload: '[edges: FlowEdge[]]', description: 'The connection array changed (connect, delete, undo, redo).' },
    { name: 'node-move', payload: '[{ nodes: { id, x, y }[] }]', description: 'Nodes were moved by drag, keyboard or auto layout. Fires once per gesture with every moved node.' },
    { name: 'connect', payload: '[{ edge: FlowEdge }]', description: 'A connection was made by the pointer or the keyboard.' },
    { name: 'disconnect', payload: '[{ edge: FlowEdge }]', description: 'A connection was removed, including those removed with their node.' },
    { name: 'select', payload: '[{ nodes: string[], edges: string[] }]', description: 'The selection changed.' },
    { name: 'change', payload: "[{ reason: 'move' | 'connect' | 'disconnect' | 'delete' | 'layout' | 'undo' | 'redo', nodes, edges }]", description: 'The data changed, with the new arrays.' },
  ],
  examples: [
    {
      title: 'Workflow with v-model',
      description: 'Sample data. Drag a node, drag from a port to another node, select and press Delete, then try Undo in the toolbar.',
      script: NODES_SCRIPT,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample delivery workflow" edge-style="curved" />`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: 'Events, selection and snapping',
      description: 'Sample data. `grid` snaps moves to 20 units; the events appear in the log under the canvas.',
      script: `${NODES_SCRIPT}
const log = ref('Nothing yet')
const show = (name, payload) => (log.value = name + ': ' + JSON.stringify(payload))`,
      code: `<div class="flex flex-col gap-2">
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample workflow with events" grid size="sm" variant="dots"
    @node-move="show('node-move', $event)" @connect="show('connect', $event)" @disconnect="show('disconnect', $event)" @select="show('select', $event)" />
  <p class="text-sm text-muted-foreground" data-testid="flow-log">{{ log }}</p>
</div>`,
      state: () => {
        const log = ref('Nothing yet')
        return { nodes: ref(nodes()), edges: ref(edges()), log, show: (name: string, payload: unknown) => (log.value = `${name}: ${JSON.stringify(payload)}`) }
      },
    },
    {
      title: 'Ports',
      description: 'Sample data. Ports sit on a side, accept `source`, `target` or `both` and show their `label` as a tooltip. Edges name them with `fromPort` and `toPort`. A node with `ports: []` cannot be connected.',
      script: PORT_NODES,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample order routing with named ports" edge-style="orthogonal" variant="grid" />`,
      state: () => ({ nodes: ref(portNodes()), edges: ref(portEdges()) }),
    },
    {
      title: 'Node shapes and tones',
      description: 'Any Mermaid shape and the six tones. Selection is an outline ring, not a colour change.',
      script: `const shapes = ['rect', 'round', 'stadium', 'subroutine', 'cylinder', 'circle', 'rhombus', 'hexagon']
const tones = ['neutral', 'primary', 'success', 'info', 'warning', 'danger']
const nodes = ref(shapes.map((shape, i) => ({ id: shape, label: shape, shape, tone: tones[i % tones.length], x: 20 + (i % 4) * 190, y: 20 + Math.floor(i / 4) * 120, width: 150, height: shape === 'circle' ? 90 : 60 })))`,
      code: `<FlowCanvas v-model:nodes="nodes" label="Sample node shapes" size="sm" readonly />`,
      state: () => ({ nodes: ref(shapeNodes()) }),
    },
    {
      title: 'Backgrounds',
      description: '`variant` is `plain`, `dots` or `grid`. The pattern pans and zooms with the content. Each canvas is wide enough to fit the graph at a readable zoom.',
      script: NODES_SCRIPT,
      code: `<div class="grid gap-4 xl:grid-cols-2">
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, plain background" size="md" variant="plain" :toolbar="false" readonly />
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, dots background" size="md" variant="dots" :toolbar="false" readonly />
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, grid background" size="md" variant="grid" :toolbar="false" readonly />
</div>`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: 'Edge styles',
      description: '`edgeStyle` is `straight`, `curved` or `orthogonal`.',
      script: NODES_SCRIPT,
      code: `<div class="grid gap-4 lg:grid-cols-3">
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, straight edges" size="sm" edge-style="straight" :toolbar="false" readonly />
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, curved edges" size="sm" edge-style="curved" :toolbar="false" readonly />
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample, orthogonal edges" size="sm" edge-style="orthogonal" :toolbar="false" readonly />
</div>`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: 'Auto layout',
      description: 'Sample data placed at one point. `autoLayout()` (and the toolbar button) arranges it with the layered layout; `direction` picks the flow.',
      script: `const canvas = ref(null)
const nodes = ref(['Booking', 'Check', 'Driver', 'Split', 'Depart'].map((label, i) => ({ id: 'n' + i, label, x: 20, y: 20 })))
const edges = ref([['n0', 'n1'], ['n1', 'n2'], ['n1', 'n3'], ['n3', 'n2'], ['n2', 'n4']].map(([from, to], i) => ({ id: 'e' + i, from, to })))`,
      code: `<div class="flex flex-col gap-2">
  <div><Button size="sm" variant="outline" @click="canvas.autoLayout()">Arrange from the page</Button></div>
  <FlowCanvas ref="canvas" v-model:nodes="nodes" v-model:edges="edges" label="Sample nodes to arrange" direction="TB" size="sm" :auto-fit="false" />
</div>`,
      state: () => ({
        canvas: ref(null),
        nodes: ref(['Booking', 'Check', 'Driver', 'Split', 'Depart'].map((label, i) => ({ id: `n${i}`, label, x: 20, y: 20 }))),
        edges: ref([['n0', 'n1'], ['n1', 'n2'], ['n1', 'n3'], ['n3', 'n2'], ['n2', 'n4']].map(([from, to], i) => ({ id: `e${i}`, from: from!, to: to! }))),
      }),
    },
    {
      title: 'Read only with a minimap',
      description: 'Sample data. `readonly` hides ports and editing; panning, zooming and selecting stay. `minimap` shows the visible area.',
      script: NODES_SCRIPT,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample read-only workflow" readonly minimap variant="dots" size="sm" />`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: 'Custom node content and toolbar',
      description: 'The `node` slot draws SVG inside the node (selection is shown by the dot, the text stays the node label); the `toolbar` slot receives the canvas actions.',
      script: `${NODES_SCRIPT}
// slot props: { node, selected, active, connecting, width, height }`,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample workflow with custom nodes" size="sm">
  <template #node="{ node, selected, width }">
    <circle :cx="14" cy="26" r="4" :class="selected ? 'fill-primary' : 'fill-muted-foreground'" />
    <text :x="width / 2" y="26" dominant-baseline="central" text-anchor="middle" font-size="13" class="pointer-events-none fill-foreground">{{ node.label }}</text>
  </template>
  <template #toolbar="{ zoomIn, zoomOut, fit, canUndo, undo }">
    <Button size="sm" variant="outline" @click="zoomOut">Smaller</Button>
    <Button size="sm" variant="outline" @click="zoomIn">Larger</Button>
    <Button size="sm" variant="outline" @click="fit">Show all</Button>
    <Button size="sm" variant="outline" :disabled="!canUndo" @click="undo">Undo last change</Button>
  </template>
</FlowCanvas>`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: '300 nodes',
      description: 'Sample data with 300 nodes and 280 connections. Only what is near the visible area is drawn, so panning and zooming stay quick. Use the minimap to move around.',
      script: `const nodes = ref(Array.from({ length: 300 }, (_, i) => ({ id: 'n' + i, label: 'Stop ' + (i + 1), x: (i % 20) * 190, y: Math.floor(i / 20) * 90 })))
const edges = ref(Array.from({ length: 280 }, (_, i) => ({ id: 'e' + i, from: 'n' + i, to: 'n' + (i + 1) })))`,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample route with 300 stops" minimap variant="dots" edge-style="straight" />`,
      state: () => ({ nodes: ref(bigNodes()), edges: ref(bigEdges()) }),
    },
    {
      title: 'Right to left page',
      description: 'The toolbar and the list follow the page direction; the canvas coordinates stay left to right, so arrow keys still mean left and right on screen.',
      script: NODES_SCRIPT,
      code: `<div dir="rtl">
  <FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample workflow on a right to left page" size="sm" />
</div>`,
      state: () => ({ nodes: ref(nodes()), edges: ref(edges()) }),
    },
    {
      title: 'Empty canvas',
      description: 'No nodes shows `emptyText`. Add nodes by changing the model; the canvas fits them when they first appear.',
      script: `const nodes = ref([])
const edges = ref([])`,
      code: `<FlowCanvas v-model:nodes="nodes" v-model:edges="edges" label="Sample empty canvas" empty-text="Add a step to start the workflow" size="sm" />`,
      state: () => ({ nodes: ref([]), edges: ref([]) }),
    },
  ],
  a11y: [
    'The canvas is a `role="application"` element named by `label` (or `aria-label` / `aria-labelledby`) and described by a visually hidden paragraph that states the keyboard model. It is focusable (Tab) and the page keeps its own scrolling outside it.',
    'Keyboard on the canvas: arrow keys pan (Shift for larger steps), + and - zoom, 0 fits the view, Ctrl or Command plus A selects everything, Delete removes the selection, Ctrl or Command plus Z undoes and Shift plus Ctrl or Command plus Z (or Ctrl plus Y) redoes, Escape clears the selection or abandons a drag.',
    'Nodes are `role="button"` elements named by their label with `aria-pressed` for the selection; one node is the tab stop (roving). Arrow keys move focus to the nearest node in that direction, Home and End jump to the first and last in reading order, Enter or Space selects, Shift plus Enter adds to the selection. Alt plus an arrow key moves the selection (by `grid` or 10 units, Shift for 5 times as far); each move is announced.',
    'Connections by keyboard: focus a node and press C. Focus moves to the nearest other node; arrow keys choose a target in that direction, Tab and Shift plus Tab cycle through all targets, Enter or Space confirms, Escape cancels. Every step is announced. With the pointer, a click on a port followed by a click on a node works without dragging.',
    'Connections are `role="button"` elements named "Edge A to B" (plus the label), also one tab stop; arrow keys move between them, Enter selects and Delete removes. A selected node has a dashed outline ring and a selected connection a thicker line, never colour alone; forced-colors mode uses system colours.',
    'One polite `role="status"` region announces moves, connections, deletions, undo, redo, layout and selection counts. Delete reports how many nodes and connections went; Undo and Redo name the step.',
    'A visually hidden list of every node (with its connection count) and every connection ("Edge A to B") is always in the page; "Show as list" reveals it in a focusable, labelled, scrollable region. Lists are cut at 500 entries with a note.',
    'Touch: the canvas sets `touch-action: none` so one finger pans and two fingers pinch; ports have a 24 pixel hit area. Pointer dragging always has a keyboard or click alternative. The page can be scrolled from outside the canvas.',
    'No motion except the user\'s own pan and zoom. Colours come from tokens; outlines are system colours in forced-colors mode. The toolbar, list and messages follow the page direction (right to left); the canvas itself stays left to right so coordinates and arrow keys keep their meaning.',
    'Labels are text only (never markup) and long labels are wrapped and cut with the full text in a tooltip and in the accessible name.',
  ],
  requires: [
    'Throws a ContractError when there is no `label`, `aria-label` or `aria-labelledby`.',
    'Throws a ContractError when `nodes` is not an array. An empty array is valid and shows the empty state.',
    'Throws a ContractError when a node has no `id` (a non-empty string).',
    'Throws a ContractError when two nodes share an `id`.',
    'Throws a ContractError when a node has no numeric `x` and `y`.',
    'Throws a ContractError when `edges` is not an array.',
    'Throws a ContractError when a connection has no `id`, `from` or `to`.',
    'Throws a ContractError when two connections share an `id`.',
  ],
  llmNotes: [
    'Always pass `label`, give every node a unique `id` and numeric `x` and `y`, and every connection a unique `id` with `from` and `to` node ids.',
    'Use `v-model:nodes` and `v-model:edges`; handle `connect` or `change` only to react (save, validate), not to re-add what the model already holds.',
    'Text drawn in the `node` slot is the node\'s visible text, and the accessible name is `node.label`: draw the label itself (WCAG 2.5.3 label in name) and show extra state with shapes, not a second text.',
    'Do not put HTML or components inside nodes: use the `node` slot with SVG elements, in the node\'s own coordinates.',
    'Use `readonly` for display. Use `grid` (or `grid="20"`) when tidy alignment matters; use `autoLayout()` on a template ref to arrange imported data with no positions.',
    'Pick `edge-style="orthogonal"` for flowcharts, `curved` for graphs, `straight` for dense maps. Pick `direction` for auto layout, not for display.',
    'Keep `ports` omitted unless the data has named inputs and outputs; then give each port an `id` and reference it with `fromPort` and `toPort`.',
    'For a static picture of a graph use `MermaidDiagram` or `NetworkGraph`; do not use FlowCanvas for charts.',
    'Give the canvas room: it needs a width, and `size` sets its height. Do not wrap it in another scroll container.',
  ],
  related: ['MermaidDiagram', 'NetworkGraph', 'Tree', 'Sankey'],
  replaces: ['hand-rolled SVG node editors', 'node-editor libraries for small and medium graphs'],
}
export default doc
