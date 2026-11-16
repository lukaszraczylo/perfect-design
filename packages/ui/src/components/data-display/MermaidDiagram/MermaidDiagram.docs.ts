import type { ComponentDoc, ExampleDoc } from '../../../docs-types'

/** Sample diagrams. Every name is invented; the data is labelled as sample. */
const FLOW = `flowchart TD
  A[Booking received] --> B{Pallets fit the truck?}
  B -->|Yes| C[Assign driver]
  B -->|No| D[Split the load]
  D --> C
  C --> E([Depart depot])
  E --> F[(Delivery log)]`

const SHAPES = `flowchart LR
  a[Rectangle] --> b(Rounded) --> c([Stadium]) --> d[[Subroutine]]
  e[(Database)] --> f((Circle)) --> g(((Double circle)))
  h{Decision} --> i{{Hexagon}}
  j[/Parallelogram/] --> k[\\Parallelogram alt\\]
  l[/Trapezoid\\] --> m[\\Trapezoid alt/]`

const EDGES = `flowchart LR
  A[Source] --> B[Arrow]
  A --- C[Plain line]
  A -.-> D[Dotted arrow]
  A ==> E[Thick arrow]
  A --o F[Circle end]
  A --x G[Cross end]
  A <--> H[Both ways]
  A -- with text --> I[Labelled]`

const GROUPS = `flowchart LR
  subgraph intake [Intake]
    direction TB
    a[Order placed] --> b[Check stock]
  end
  subgraph packing [Packing]
    c[Pick items] --> d[Seal box]
  end
  b -->|in stock| c
  b -->|backorder| e[Notify buyer]:::late
  d --> f[Dispatch]:::done
  classDef late stroke-dasharray:5 3,tone:warning
  classDef done tone:success`

const SEQUENCE = `sequenceDiagram
  autonumber
  actor Buyer
  participant Shop as Orchard Mill shop
  participant Pay as Payments
  Buyer->>Shop: Place order
  activate Shop
  Shop->>Pay: Charge card
  alt Approved
    Pay-->>Shop: Payment accepted
    Shop-->>Buyer: Order confirmed
  else Declined
    Pay-->>Shop: Payment declined
    Shop--xBuyer: Order cancelled
  end
  deactivate Shop
  Note over Buyer,Shop: Confirmation is sent by email`

const PIE = `pie showData title Sample pallets by region
  "North" : 42
  "South" : 28
  "East" : 18
  "West" : 12`

const STATE = `stateDiagram-v2
  [*] --> Pending
  Pending --> Packed: items picked
  Packed --> InTransit: truck leaves
  state InTransit {
    [*] --> OnRoad
    OnRoad --> AtBorder: crossing
    AtBorder --> OnRoad: cleared
  }
  InTransit --> Delivered
  Delivered --> [*]`

const REGIONS = `stateDiagram-v2
  [*] --> Loading
  state Loading {
    [*] --> Picking
    Picking --> Picked
    --
    [*] --> Paperwork
    Paperwork --> Signed
  }
  Loading --> Departed
  Departed --> [*]`

const ER = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "appears in"
  CUSTOMER {
    string name PK
    string email UK
  }
  ORDER {
    int id PK
    date placed_on
  }`

const CLASSES = `classDiagram
  class Shipment {
    +String id
    +Date dueOn
    +dispatch() void
  }
  class Pallet {
    -int weightKg
    +load() bool
  }
  class Vehicle {
    <<interface>>
    +capacityKg() int
  }
  Shipment "1" *-- "many" Pallet : holds
  Shipment ..> Vehicle : uses
  Truck ..|> Vehicle
  Van --|> Truck`

const GANTT = `gantt
  title Sample mill upgrade plan
  dateFormat YYYY-MM-DD
  section Design
  Survey the site :done, survey, 2026-03-02, 5d
  Draw the layout :active, layout, after survey, 7d
  section Build
  Install machinery :crit, install, after layout, 3w
  Commissioning :commission, after install, 5d
  Handover :milestone, after commission, 0d`

const MINDMAP = `mindmap
  root((Open the new depot))
    Site
      Lease
      Permits
    People
      Drivers
      Dispatchers
    Equipment
      Trucks
      Racking`

const TIMELINE = `timeline
  title Sample depot history
  section Early
    2019 : Lease signed
    2020 : First truck : Second truck
  section Growth
    2022 : Night shift starts
    2024 : Second yard opens`

const JOURNEY = `journey
  title Sample delivery day
  section Before arrival
    Get the notice: 4: Customer
    Clear the dock: 3: Customer, Dispatcher
  section On the day
    Unload the truck: 2: Driver, Customer
    Sign the receipt: 5: Customer`

const SMALL = `flowchart LR
  A[Plan] --> B[Build] --> C[Ship]`
const BROKEN = `flowchart TD
  A[Start] --> B[Unclosed label
  B --> C[Done]`
const UNSUPPORTED = `gitGraph
  commit
  commit`

/** Show a source constant as the display script of an example. */
const asScript = (name: string, text: string) => `const ${name} = \`${text.replace(/\\/g, '\\\\')}\``

/** A binary tree of sample steps with a few cross links, built at mount time. */
const buildLarge = (count: number): string => {
  const lines = ['flowchart TD']
  for (let i = 0; i < count; i++) lines.push(`  n${i}[Step ${i + 1}]`)
  for (let i = 1; i < count; i++) lines.push(`  n${Math.floor((i - 1) / 2)} --> n${i}`)
  for (let i = 1; i * 4 + 3 < count; i += 3) lines.push(`  n${i} -.-> n${i * 4 + 3}`)
  return lines.join('\n')
}
const LARGE_SCRIPT = `const lines = ['flowchart TD']
for (let i = 0; i < 60; i++) lines.push(\`  n\${i}[Step \${i + 1}]\`)
for (let i = 1; i < 60; i++) lines.push(\`  n\${Math.floor((i - 1) / 2)} --> n\${i}\`)
for (let i = 1; i * 4 + 3 < 60; i += 3) lines.push(\`  n\${i} -.-> n\${i * 4 + 3}\`)
const large = lines.join('\\n')`

const one = (name: string, text: string, title: string, description: string, code: string): ExampleDoc => ({
  title,
  description,
  code,
  script: asScript(name, text),
  state: () => ({ [name]: text }),
})

const TONE = "'neutral' | 'primary' | 'success' | 'info' | 'warning' | 'danger'"

const doc: ComponentDoc = {
  name: 'MermaidDiagram',
  group: 'data-display',
  subgroup: 'Diagrams',
  summary: 'Draws Mermaid text (flowchart, sequence, pie, state, entity relationship, class, gantt, mindmap, timeline, journey) as an accessible SVG, with its own parser and layout and no extra dependency.',
  description: `Use \`MermaidDiagram\` when a diagram lives as text next to the code or content it explains. Pass the Mermaid source in \`source\`; the component parses it, lays it out (layered layout for graphs, custom layouts for the rest) and draws SVG with design tokens, so light, dark and accent presets work. Everything is drawn by Vue templates: the source is never inserted as HTML, so hostile text stays inert text.

A source that cannot be drawn never throws and never leaves a blank area. A syntax error shows an inline alert with the line, the column, the offending source line and what to write instead; an unsupported diagram type shows a message that names the type. Both emit \`error\`. A diagram that is larger than \`maxNodes\` or \`maxEdges\` shows a size message instead of hanging the page.

**Supported syntax**

- \`flowchart\` / \`graph\` (TB TD BT LR RL): shapes rectangle, rounded, stadium, subroutine, cylinder, circle, double circle, rhombus, hexagon, parallelograms, trapezoids and the asymmetric flag (\`A[text]\`, \`A(text)\`, \`A([text])\`, \`A[[text]]\`, \`A[(text)]\`, \`A((text))\`, \`A(((text)))\`, \`A{text}\`, \`A{{text}}\`, \`A[/text/]\`, \`A[\\text\\]\`, \`A[/text\\]\`, \`A[\\text/]\`, \`A>text]\`, plus \`A@{ shape: cyl, label: "text" }\` for the common shapes); edges \`-->\` \`---\` \`-.->\` \`==>\` \`--o\` \`--x\` \`<-->\` \`o--o\` \`x--x\` \`~~~\`, longer arrows (\`---->\`), labels \`-->|text|\` and \`-- text -->\`; chains (\`A --> B --> C\`) and groups (\`A & B --> C & D\`); nested \`subgraph ... end\` with \`direction\`; \`classDef\`, \`class\`, \`:::class\`, \`style\`, \`linkStyle\`; edge ids (\`e1@-->\`, with \`e1@{ animate: true }\` lines) are read and ignored; \`click\` lines are accepted and ignored.
- \`sequenceDiagram\`: \`participant\` and \`actor\` with \`as\` aliases, messages \`->>\` \`-->>\` \`->\` \`-->\` \`-x\` \`--x\` \`-)\` \`--)\`, activation (\`+\` \`-\`, \`activate\`, \`deactivate\`), self messages, \`Note left of|right of|over\`, \`loop\` \`alt\`/\`else\` \`opt\` \`par\`/\`and\` \`critical\`/\`option\` \`break\` blocks, \`autonumber\`, \`title\`.
- \`pie\`: \`title\`, \`showData\`, \`"Label" : value\` lines.
- \`stateDiagram\` / \`stateDiagram-v2\`: states, \`state "text" as id\`, \`id : description\`, transitions with labels, \`[*]\` start and end, composite states (nested), concurrent regions separated by \`--\` (side by side with a dashed divider), \`<<choice>>\` \`<<fork>>\` \`<<join>>\`, \`note left of|right of\`, \`direction\`.
- \`erDiagram\`: entities with attributes (type, name, PK FK UK, comment), aliases, relationships with all cardinality marks (\`||\` \`|o\` \`o|\` \`}o\` \`o{\` \`}|\` \`|{\`) and the word forms, identifying \`--\` and non-identifying \`..\` lines, labels.
- \`classDiagram\`: classes with attributes and methods, visibility \`+ - # ~\`, annotations (\`<<interface>>\`), generics (\`Name~T~\`), inheritance, composition, aggregation, association, link, dependency, realisation, cardinalities, labels, namespaces, notes.
- \`gantt\`: \`title\`, \`dateFormat\`, sections, tasks with ids, \`after\`, \`until\`, durations in ms s m h d w (calendar months \`M\` and years \`y\` as whole numbers), tags \`done\` \`active\` \`crit\` \`milestone\`.
- \`mindmap\`: indentation tree with node shapes (square, rounded, circle, bang, cloud, hexagon).
- \`timeline\`: \`title\`, sections, periods with several events.
- \`journey\`: \`title\`, sections, tasks with a 1 to 5 score and actors.
- \`sequenceDiagram\`, \`stateDiagram\`, \`erDiagram\` and \`classDiagram\` accept \`;\` between statements on one line (write \`#59;\` for a literal semicolon in text). In flowcharts \`;\` already works outside brackets and quotes.
- All types: \`%%\` comment lines and \`%%\` comments after a statement (not inside quotes or brackets), \`accTitle\` and \`accDescr\` (one line or a \`{ }\` block), \`---\` front matter with \`title:\`, and \`%%{init: ...}%%\` directives (read and ignored: configure the look with props instead).

**Not supported** (it draws what it can, or shows an error that says so): other Mermaid diagram types (git graph, quadrant, xy chart, sankey, block, packet, architecture, kanban, C4, requirement, radar, treemap), icons, images and markdown strings in nodes (\`<br>\` breaks a line, other HTML tags are dropped and their text is kept), interactive \`click\` handlers, themes and custom CSS from the source, \`:::\` styling beyond tones.

**Colour.** The source cannot set arbitrary colours. A \`classDef\` or \`style\` fill or stroke colour is mapped to the nearest tone of the design system by hue (red to danger, green to success, blue to info, yellow and orange to warning, teal to primary, greys to neutral); a class named like a tone (\`success\`, \`warning\`, \`danger\`, \`info\`, \`primary\`) picks that tone; \`tone:success\` in a declaration sets it explicitly; \`stroke-dasharray\` makes the outline dashed and a \`stroke-width\` of 3px or more makes it thick. Dashes and weight carry meaning, so state is never shown by colour alone.

**Size and reflow.** With \`fit="width"\` (default) the SVG scales down to its container, so on a 320px screen a wide diagram gets small text. \`fit="scroll"\` keeps the natural size inside a focusable, named, scrollable region. \`fit="auto"\` measures the container and behaves like \`width\` until the scale would drop below 0.6 (text of 14px would be under about 8px), then switches to \`scroll\`; the choice is made after mount, so the server render is always \`width\`. Use \`auto\` for content you do not control and \`width\` for small, known diagrams.

Use \`Markdown\` for prose with code fences, \`CodeViewer\` to show plain source, and a chart component (\`LineChart\`, \`DonutChart\`, \`BarChart\`) when the data is numeric and should be formatted and interactive.`,
  status: 'beta',
  props: [
    { name: 'source', type: 'string', required: true, description: 'Mermaid source text. Required: a blank value throws a ContractError in strict mode (and shows a "Nothing to draw" message otherwise).' },
    { name: 'variant', type: "'outline' | 'filled' | 'mono' | 'soft'", default: "'outline'", description: '`outline` bordered nodes on a card, `filled` tinted nodes, `soft` borderless nodes on a muted panel, `mono` single-colour ink with a heavier border (tones are ignored). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text and spacing scale: 12, 14 and 16 px base text inside the drawing, and the caption and control text around it.' },
    { name: 'density', type: "'compact' | 'comfortable' | 'spacious'", default: "'comfortable'", description: 'Space between nodes and ranks, node padding, and the padding of the frame.' },
    { name: 'edgeStyle', type: "'curved' | 'straight' | 'orthogonal'", default: "'curved'", description: 'How graph edges are drawn: S-curves, straight segments, or right angles with rounded corners. Applies to flowchart, state, class, ER and mindmap.' },
    { name: 'direction', type: "'TB' | 'LR' | 'BT' | 'RL'", description: 'Overrides the direction of graph diagrams (flowchart, state, class, ER). Without it the direction written in the source is used.' },
    { name: 'rounded', type: "'none' | 'sm' | 'md' | 'full'", default: "'md'", description: 'Corner radius of rectangular nodes and boxes. `full` makes pills. Shapes that are round by definition (stadium, circle) are not affected.' },
    { name: 'tone', type: TONE, default: "'neutral'", description: 'Accent of nodes that the source does not style itself: the outline colour (outline), the tint (filled, soft). Ignored by `mono`. Pie slices use the categorical chart colours.' },
    { name: 'fit', type: "'width' | 'scroll' | 'auto'", default: "'width'", description: '`width` scales the SVG down to the container (viewBox); `scroll` keeps the natural size inside a focusable, named scroll region; `auto` is `width` until the scale would fall below 0.6 (`MERMAID_AUTO_MIN_SCALE`), then `scroll`. The resolved value is on the root as `data-fit`.' },
    { name: 'showSource', type: 'boolean', default: 'false', description: 'Show the Mermaid source below the diagram (read-only, with a copy button). Readers can also toggle it with the "Show source" button.' },
    { name: 'showCode', type: 'boolean', default: 'false', description: 'Alias of `showSource`.' },
    { name: 'showTable', type: 'boolean', default: 'false', description: 'Show the text version (nodes and connections, participants and messages, slices with values) as visible content. It is always in the page for screen readers; this makes it visible too. Readers can toggle it with the "Show as text" button.' },
    { name: 'title', type: 'string', description: 'Caption above the diagram and the accessible name. Wins over `accTitle`, the front matter `title` and the title written in the diagram.' },
    { name: 'description', type: 'string', description: 'Longer accessible description. Wins over `accDescr`. Without either, an automatic summary such as "Flowchart with 6 nodes and 7 connections, top to bottom" describes the image.' },
    { name: 'maxNodes', type: 'number', default: '300', description: 'Largest diagram that is drawn, counted in nodes (states, classes, entities, tasks, participants, slices...). Above it an inline error is shown instead of laying out the graph.' },
    { name: 'maxEdges', type: 'number', default: '600', description: 'Largest number of connections (edges, messages, relations) that is drawn.' },
    { name: 'maxSourceLength', type: 'number', default: '100000', description: 'Longest source, in characters, that is parsed. Longer text shows a size error before any parsing.' },
    { name: 'maxLineLength', type: 'number', default: '2000', description: 'Longest single source line, in characters, that is parsed. A longer line shows a size error naming the line.' },
    { name: 'as', type: 'string', default: "'figure'", description: 'Root element. With `figure` the title is a `figcaption`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root element.' },
  ],
  emits: [
    { name: 'error', payload: '[event: { message: string; line: number; column: number }]', description: 'The source could not be drawn (syntax error, unsupported type, empty input, size limit). Line and column are 1-based; they are 1 for errors without a position.' },
    { name: 'rendered', payload: "[event: { type: string; nodes: number; edges: number }]", description: 'The diagram was drawn, on mount and after every change of the source or the options. `type` is `flowchart`, `sequence`, `pie`, `state`, `er`, `class`, `gantt`, `mindmap`, `timeline` or `journey`.' },
  ],
  examples: [
    one('flow', FLOW, 'Flowchart', 'A flowchart with a decision, labels, a database and a stadium. Sample content.', '<MermaidDiagram :source="flow" title="Booking flow (sample)" />'),
    one('shapes', SHAPES, 'Flowchart: node shapes', 'All eleven node shapes. Each shape is also named in the text version, so meaning does not depend on the outline.', '<MermaidDiagram :source="shapes" title="Node shapes" fit="scroll" />'),
    one('edges', EDGES, 'Flowchart: edge types', 'Solid, plain, dotted, thick, circle end, cross end, both ways and labelled. Dotted and thick lines differ by pattern and weight, not colour.', '<MermaidDiagram :source="edges" title="Edge types" fit="scroll" />'),
    one('groups', GROUPS, 'Flowchart: subgraphs and classes', 'Nested layout per group, a group with its own direction, and `classDef` mapped to tones and dashes. Sample content.', '<MermaidDiagram :source="groups" title="Order handling (sample)" fit="scroll" />'),
    one('sequence', SEQUENCE, 'Sequence diagram', 'Participants, an actor, activation, an alt block, numbered messages and a note. Sample content.', '<MermaidDiagram :source="sequence" title="Checkout (sample)" />'),
    one('pie', PIE, 'Pie chart', 'Slices with the value and percentage in the legend, so colour is never the only cue.', '<MermaidDiagram :source="pie" />'),
    one('state', STATE, 'State diagram', 'A composite state with its own start, a labelled transition and the end state.', '<MermaidDiagram :source="state" title="Shipment states (sample)" />'),
    one('regions', REGIONS, 'State diagram: concurrent regions', 'A `--` line splits a composite state into regions that run in parallel. They sit side by side, separated by a dashed divider (stacked in left to right diagrams).', '<MermaidDiagram :source="regions" title="Loading in parallel (sample)" />'),
    one('er', ER, 'Entity relationship diagram', 'Entities with keys and crow\'s foot cardinalities. Sample content.', '<MermaidDiagram :source="er" title="Order data (sample)" />'),
    one('classes', CLASSES, 'Class diagram', 'Members with visibility, an interface, composition, dependency, realisation and inheritance. Sample content.', '<MermaidDiagram :source="classes" title="Shipment model (sample)" />'),
    one('gantt', GANTT, 'Gantt chart', 'Done, active and critical tasks, `after` dependencies and a milestone. Status is written next to the bars.', '<MermaidDiagram :source="gantt" fit="scroll" />'),
    one('mindmap', MINDMAP, 'Mind map', 'An indentation tree with a circular root.', '<MermaidDiagram :source="mindmap" title="Depot opening plan (sample)" />'),
    one('timeline', TIMELINE, 'Timeline', 'Periods with several events, grouped in sections.', '<MermaidDiagram :source="timeline" />'),
    one('journey', JOURNEY, 'User journey', 'Tasks with a score from 1 to 5 and actors; the score is printed as text as well as drawn as a face.', '<MermaidDiagram :source="journey" />'),
    {
      title: 'Variant',
      description: '`outline` (default), `filled`, `soft` and `mono`. The same source in all four.',
      script: asScript('small', SMALL),
      state: () => ({ small: SMALL }),
      code: `<div class="grid gap-4 md:grid-cols-2">
  <MermaidDiagram :source="small" variant="outline" title="Outline variant" />
  <MermaidDiagram :source="small" variant="filled" tone="primary" title="Filled variant" />
  <MermaidDiagram :source="small" variant="soft" tone="info" title="Soft variant" />
  <MermaidDiagram :source="small" variant="mono" title="Mono variant" />
</div>`,
    },
    {
      title: 'Size',
      description: '`sm`, `md` and `lg` scale the text and the spacing together.',
      script: asScript('small', SMALL),
      state: () => ({ small: SMALL }),
      code: `<div class="grid gap-4">
  <MermaidDiagram :source="small" size="sm" title="Small" />
  <MermaidDiagram :source="small" size="md" title="Medium" />
  <MermaidDiagram :source="small" size="lg" title="Large" />
</div>`,
    },
    {
      title: 'Density',
      description: '`compact`, `comfortable` and `spacious` change the space between nodes and the padding of the frame.',
      script: asScript('flow', FLOW),
      state: () => ({ flow: FLOW }),
      code: `<div class="grid gap-4 lg:grid-cols-3">
  <MermaidDiagram :source="flow" density="compact" title="Compact" />
  <MermaidDiagram :source="flow" density="comfortable" title="Comfortable" />
  <MermaidDiagram :source="flow" density="spacious" title="Spacious" />
</div>`,
    },
    {
      title: 'Edge style',
      description: '`curved` (default), `straight` and `orthogonal` edges.',
      script: asScript('flow', FLOW),
      state: () => ({ flow: FLOW }),
      code: `<div class="grid gap-4 lg:grid-cols-3">
  <MermaidDiagram :source="flow" edge-style="curved" title="Curved edges" />
  <MermaidDiagram :source="flow" edge-style="straight" title="Straight edges" />
  <MermaidDiagram :source="flow" edge-style="orthogonal" title="Orthogonal edges" />
</div>`,
    },
    {
      title: 'Direction',
      description: '`direction` overrides the direction written in the source: top to bottom, left to right, bottom to top, right to left.',
      script: asScript('small', SMALL),
      state: () => ({ small: SMALL }),
      code: `<div class="grid gap-4 md:grid-cols-2">
  <MermaidDiagram :source="small" direction="TB" title="Top to bottom" />
  <MermaidDiagram :source="small" direction="LR" title="Left to right" />
  <MermaidDiagram :source="small" direction="BT" title="Bottom to top" />
  <MermaidDiagram :source="small" direction="RL" title="Right to left" />
</div>`,
    },
    {
      title: 'Tone and rounded corners',
      description: '`tone` sets the accent of unstyled nodes; `rounded` sets the corner radius.',
      script: asScript('small', SMALL),
      state: () => ({ small: SMALL }),
      code: `<div class="grid gap-4 md:grid-cols-3">
  <MermaidDiagram :source="small" tone="primary" rounded="none" title="Primary, square" />
  <MermaidDiagram :source="small" tone="success" rounded="sm" title="Success, small radius" />
  <MermaidDiagram :source="small" tone="info" rounded="md" title="Info, medium radius" />
  <MermaidDiagram :source="small" tone="warning" rounded="full" title="Warning, pills" />
  <MermaidDiagram :source="small" tone="danger" variant="filled" title="Danger, filled" />
  <MermaidDiagram :source="small" tone="neutral" variant="filled" title="Neutral, filled" />
</div>`,
    },
    {
      title: 'Fit: auto',
      description: '`fit="auto"` scales to the container while text stays readable and switches to a scroll region at natural size once the scale would drop below 0.6. Resize the window to see it switch.',
      script: asScript('shapes', SHAPES),
      state: () => ({ shapes: SHAPES }),
      code: '<MermaidDiagram :source="shapes" fit="auto" title="Node shapes, automatic fit" />',
    },
    one('flow', FLOW, 'Fit: scroll', '`fit="scroll"` keeps the natural size in a scroll region that can be focused with the keyboard. Use it for wide diagrams on small screens.', '<MermaidDiagram :source="flow" fit="scroll" title="Booking flow, natural size" />'),
    {
      title: 'Syntax error',
      description: 'A source that cannot be read shows an alert with the line, the column and the offending line. The component never throws and the area is never blank.',
      script: asScript('broken', BROKEN),
      state: () => ({ broken: BROKEN }),
      code: '<MermaidDiagram :source="broken" title="Diagram with a mistake" />',
    },
    {
      title: 'Unsupported diagram type',
      description: 'A Mermaid type that is not drawn gets a message that names it.',
      script: asScript('unsupported', UNSUPPORTED),
      state: () => ({ unsupported: UNSUPPORTED }),
      code: '<MermaidDiagram :source="unsupported" />',
    },
    {
      title: 'Large diagram',
      description: '60 sample nodes laid out on mount. `maxNodes` and `maxEdges` stop pathological sources before layout.',
      script: LARGE_SCRIPT,
      state: () => ({ large: buildLarge(60) }),
      code: '<MermaidDiagram :source="large" fit="scroll" title="Sixty sample steps" :max-nodes="200" />',
    },
    one('flow', FLOW, 'Source visible', '`showSource` shows the Mermaid text under the diagram; `showTable` shows the text version.', '<MermaidDiagram :source="flow" show-source show-table title="Booking flow with source and text version" />'),
  ],
  a11y: [
    'The drawing is one `<svg role="img">` named by `aria-labelledby` (a `<title>` and a `<desc>`): the `title` prop, then `accTitle`, then the title written in the diagram, then an automatic summary such as "Flowchart with 6 nodes and 7 connections, top to bottom". The description comes from `description`, `accDescr` or the summary.',
    'A text version is always in the page: an ordered list of nodes (in reading order) and a list of connections "A to B: label" for graphs, participants and messages in order for sequence diagrams, slices with values for pie charts, tasks with dates for gantt charts. It is visually hidden until `showTable` or the "Show as text" button reveals it (`aria-expanded`, `aria-controls`).',
    'A syntax error is a `role="alert"` panel naming the line and column, with the offending line; "unsupported" and "nothing to draw" are `role="status"`. Nothing is announced on every redraw.',
    'With `fit="scroll"` the viewport is `role="region"`, focusable (`tabindex="0"`, visible focus ring) and named "<title>, scrollable diagram", so keyboard users can scroll it with the arrow keys.',
    'State is not shown by colour alone: dotted and thick edges differ by pattern and weight, shapes differ by outline, gantt status is written as text and drawn as outline, check or diamond, journey scores are printed, actors differ by marker shape, pie slices list value and percentage in the legend.',
    'Text inside the drawing is at least 12px at natural size (`size="md"` is 14px); with `fit="width"` it shrinks with the container, so use `fit="auto"` (scrolls below a 0.6 scale) or `fit="scroll"` for wide diagrams on narrow screens. Colours are tokens only (ink, muted ink, tones) so dark mode, accent presets and forced-colors mode (system colours replace the tokens) keep working. The component has no animation.',
    'The source is only ever rendered as Vue text nodes inside SVG `<text>` elements. Markup, `<script>`, event handlers and `javascript:` text in the source can never be executed or inserted as HTML: tags inside labels are dropped (their text stays), and the title, description and the source panel show the text literally. `click` lines are ignored, so no link or handler is ever created.',
  ],
  related: ['CodeViewer', 'Markdown', 'LineChart', 'DonutChart', 'NetworkGraph', 'Timeline', 'Tree'],
  requires: ['Throws a ContractError when `source` is missing or blank (a non-empty string of Mermaid text is required).'],
  llmNotes: [
    'Pass Mermaid text in `source`; build it with a template literal or a constant, never by concatenating untrusted markup (the component is safe, but the text must be valid Mermaid).',
    'Always set `title` (or `accTitle` in the source) so the diagram has a meaningful accessible name; add `description` for the takeaway.',
    'Pick the diagram type with the first line: `flowchart TD`, `sequenceDiagram`, `pie`, `stateDiagram-v2`, `erDiagram`, `classDiagram`, `gantt`, `mindmap`, `timeline`, `journey`.',
    'Do not put colours in the source: use `classDef name tone:success` or a class named `success`, `warning`, `danger`, `info`, `primary`; fills and strokes are mapped to tones.',
    'Use `fit="auto"` when the diagram size is not known (user content): it scrolls instead of shrinking text below 60%. Use `fit="scroll"` for wide or dense diagrams and `fit="width"` (default) for small ones. Prefer `direction="TB"` for wide diagrams in narrow columns.',
    'Use `variant="mono"` for print-like output and `variant="soft"` inside cards that already have a border.',
    'Handle `@error` when the source comes from users; read `line` and `column` to point at the mistake.',
    'Import `parseMermaid` and `renderModel` to validate or inspect a source without mounting the component.',
    'Keep diagrams under the default 300 nodes; raise `maxNodes` deliberately.',
  ],
  replaces: ['mermaid.js client-side rendering', 'hand-drawn SVG diagrams', 'pre-rendered diagram images'],
}

export default doc
