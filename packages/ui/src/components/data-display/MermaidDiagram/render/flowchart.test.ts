import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import { renderModel } from '.'
import type { RPath, RShape, RText, RenderModel, RenderOptions } from '../../_diagram/types'

const draw = (src: string, opts: RenderOptions = {}): RenderModel => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(p.errors[0]!.message)
  const r = renderModel(p.ast, opts)
  if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`)
  return r.model
}
const fail = (src: string, opts: RenderOptions = {}) => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(p.errors[0]!.message)
  const r = renderModel(p.ast, opts)
  if (r.ok) throw new Error('expected failure')
  return r.error
}
const shapes = (m: RenderModel, role: string) => m.items.filter((i): i is RShape => i.kind === 'shape' && i.role === role)
const paths = (m: RenderModel) => m.items.filter((i): i is RPath => i.kind === 'path')
const texts = (m: RenderModel, role?: string) => m.items.filter((i): i is RText => i.kind === 'text' && (!role || i.role === role))
const allLines = (m: RenderModel) => texts(m).flatMap((t) => t.lines)

const FLOW = `flowchart TD
  A[Booking] --> B{Fits?}
  B -->|Yes| C[Assign]
  B -->|No| D[Split]
  D --> C
  C --> E([Depart])
  E --> F[(Log)]`

describe('flowchart render: model', () => {
  it('describes the diagram', () => {
    const m = draw(FLOW)
    expect(m).toMatchObject({ type: 'flowchart', nodes: 6, edges: 6, fontSize: 14, summary: 'Flowchart with 6 nodes and 6 connections, top to bottom' })
    expect(m.width).toBeGreaterThan(100)
    expect(m.height).toBeGreaterThan(200)
  })
  it('draws one shape per node, one path per edge and the labels', () => {
    const m = draw(FLOW)
    expect(shapes(m, 'node')).toHaveLength(6)
    expect(paths(m)).toHaveLength(6)
    expect(texts(m, 'node-label').map((t) => t.lines.join(' '))).toEqual(['Booking', 'Fits?', 'Assign', 'Split', 'Depart', 'Log'])
    expect(texts(m, 'edge-label').map((t) => t.lines[0])).toEqual(['Yes', 'No'])
    expect(shapes(m, 'edge-label-plate')).toHaveLength(2)
  })
  it('paints edges after clusters and before nodes, labels last', () => {
    const m = draw('flowchart TD\n subgraph g [Group]\n A --> B\n end\n B -->|x| C')
    const roles = m.items.map((i) => i.role)
    expect(roles.indexOf('cluster')).toBeLessThan(roles.indexOf('edge'))
    expect(roles.indexOf('edge')).toBeLessThan(roles.indexOf('node'))
    expect(roles.indexOf('node')).toBeLessThan(roles.indexOf('edge-label'))
  })
  it('keeps every coordinate finite and inside the canvas', () => {
    const m = draw(FLOW + '\n  F --> A\n  A --> A')
    const json = JSON.stringify(m.items)
    expect(json).not.toMatch(/NaN|Infinity|undefined/)
    for (const t of texts(m)) {
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.x).toBeLessThanOrEqual(m.width)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeLessThanOrEqual(m.height)
    }
  })
  it('is deterministic', () => {
    expect(JSON.stringify(draw(FLOW))).toBe(JSON.stringify(draw(FLOW)))
  })
  it('draws every node shape with a different outline', () => {
    const m = draw('flowchart LR\n a[r] --> b(r) --> c([r]) --> d[[r]] --> e[(r)] --> f((r)) --> g(((r))) --> h{r} --> i{{r}} --> j[/r/] --> k[\\r\\] --> l[/r\\] --> m[\\r/] --> n>r]')
    const ds = shapes(m, 'node').map((s) => s.d)
    expect(new Set(ds).size).toBe(14)
    expect(shapes(m, 'node-detail').length).toBeGreaterThanOrEqual(4)
  })
  it('does not draw invisible links but keeps them in the layout and the text', () => {
    const m = draw('flowchart LR\n A ~~~ B\n B --> C')
    expect(paths(m)).toHaveLength(1)
    expect(m.alt.sections[1]!.items[0]).toBe('A to B (layout only)')
  })
  it('draws self loops and parallel edges', () => {
    const m = draw('flowchart TD\n A -->|again| A\n A --> B\n A --> B')
    expect(paths(m)).toHaveLength(3)
    expect(texts(m, 'edge-label').map((t) => t.lines[0])).toEqual(['again'])
    expect(m.alt.sections[1]!.items).toHaveLength(3)
  })
})

describe('flowchart render: options', () => {
  it('direction overrides the one in the source', () => {
    const td = draw(FLOW)
    const lr = draw(FLOW, { direction: 'LR' })
    expect(lr.width).toBeGreaterThan(td.width)
    expect(lr.summary).toContain('left to right')
    expect(draw(FLOW, { direction: 'BT' }).summary).toContain('bottom to top')
    expect(draw(FLOW, { direction: 'RL' }).summary).toContain('right to left')
    expect(draw('flowchart LR\n A --> B').summary).toContain('left to right')
  })
  it('edgeStyle changes the path commands', () => {
    const d = (s: RenderOptions['edgeStyle']) => paths(draw(FLOW, { edgeStyle: s })).map((p) => p.d).join('|')
    expect(d('curved')).toContain('C')
    expect(d('orthogonal')).toContain('Q')
    expect(d('straight')).not.toMatch(/[CQ]/)
  })
  it('size and density change the metrics', () => {
    expect(draw(FLOW, { size: 'lg' }).fontSize).toBe(16)
    expect(draw(FLOW, { size: 'sm' }).fontSize).toBe(12)
    expect(draw(FLOW, { density: 'spacious' }).height).toBeGreaterThan(draw(FLOW, { density: 'compact' }).height)
    expect(draw(FLOW, { size: 'lg' }).width).toBeGreaterThan(draw(FLOW, { size: 'sm' }).width)
  })
  it('rounded changes the corner radius of rectangles', () => {
    const rect = (r: RenderOptions['rounded']) => shapes(draw('flowchart TD\n A[Plain]', { rounded: r }), 'node')[0]!.d
    expect(rect('none')).not.toContain('A')
    expect(rect('md')).toContain('A')
    expect(new Set([rect('none'), rect('sm'), rect('md'), rect('full')]).size).toBe(4)
  })
  it('tone sets the default tone of unstyled nodes only', () => {
    const m = draw('flowchart TD\n A --> B:::danger\n classDef danger tone:danger', { tone: 'success' })
    expect(shapes(m, 'node').map((s) => s.paint.tone)).toEqual(['success', 'danger'])
    expect(shapes(draw('flowchart TD\n A', {}), 'node')[0]!.paint.tone).toBe('neutral')
  })
})

describe('flowchart render: classDef, style and linkStyle map to tones, dashes and weight', () => {
  const paint = (src: string, i = 0) => shapes(draw(src), 'node')[i]!.paint
  it('maps colours by hue and never keeps them', () => {
    const m = draw('flowchart TD\n A:::hot\n B:::cool\n classDef hot fill:#f96,stroke:#333\n classDef cool fill:#26f')
    expect(shapes(m, 'node').map((s) => s.paint.tone)).toEqual(['warning', 'info'])
    expect(JSON.stringify(m.items)).not.toMatch(/#f96|#333|#26f/)
  })
  it('style overrides the class', () => {
    expect(paint('flowchart TD\n A:::x\n classDef x fill:#e11\n style A fill:#2a2').tone).toBe('success')
  })
  it('default classDef applies to all nodes', () => {
    const m = draw('flowchart TD\n A --> B\n classDef default stroke-dasharray:4')
    expect(shapes(m, 'node').every((s) => s.paint.dash === 'dashed')).toBe(true)
  })
  it('dash and thickness carry meaning', () => {
    expect(paint('flowchart TD\n A\n style A stroke-dasharray:5 5')).toMatchObject({ dash: 'dashed', stroke: 'normal' })
    expect(paint('flowchart TD\n A\n style A stroke-width:4px')).toMatchObject({ stroke: 'thick' })
  })
  it('a class named like a tone applies it without a classDef', () => {
    expect(paint('flowchart TD\n A:::warning').tone).toBe('warning')
  })
  it('linkStyle changes edges by index and default', () => {
    const m = draw('flowchart TD\n A --> B --> C\n linkStyle 0 stroke-dasharray:3\n linkStyle 1 stroke-width:4px,stroke:#e11')
    const [e0, e1] = paths(m)
    expect(e0).toMatchObject({ style: 'dashed' })
    expect(e1).toMatchObject({ thick: true, tone: 'danger' })
    const d = paths(draw('flowchart TD\n A --> B\n linkStyle default stroke-dasharray:3'))
    expect(d[0]!.style).toBe('dashed')
  })
  it('edge kinds map to line style, weight and markers', () => {
    const m = draw('flowchart LR\n A --> B\n A -.-> C\n A ==> D\n A --o E\n A --x F\n A <--> G\n A --- H')
    const ps = paths(m)
    expect(ps.map((p) => p.style)).toEqual(['solid', 'dashed', 'solid', 'solid', 'solid', 'solid', 'solid'])
    expect(ps.map((p) => !!p.thick)).toEqual([false, false, true, false, false, false, false])
    expect(ps.map((p) => p.markerEnd)).toEqual(['arrow', 'arrow', 'arrow', 'circle', 'cross', 'arrow', undefined])
    expect(ps[5]!.markerStart).toBe('arrow')
  })
})

describe('flowchart render: subgraphs', () => {
  const SRC = 'flowchart LR\n subgraph one [Intake]\n  direction TB\n  A[Start] --> B[Check]\n end\n subgraph two [Pack]\n  C --> D\n end\n B --> C\n X --> one'
  it('draws a titled frame around members', () => {
    const m = draw(SRC)
    const frames = shapes(m, 'cluster')
    expect(frames).toHaveLength(2)
    expect(texts(m, 'cluster-title').map((t) => t.lines[0])).toEqual(['Intake', 'Pack'])
    expect(frames[0]!.paint).toMatchObject({ fill: 'muted', stroke: 'thin', dash: 'dashed' })
    expect(m.nodes).toBe(5)
  })
  it('the cluster direction differs from the graph direction', () => {
    const ys = (src: string) => texts(draw(src), 'node-label').map((t) => t.y)
    expect(new Set(ys('flowchart LR\n subgraph g\n direction TB\n A --> B\n end')).size).toBe(2)
    expect(new Set(ys('flowchart LR\n subgraph g\n A --> B\n end')).size).toBe(1)
  })
  it('an edge to a subgraph is routed to its frame, not to a phantom node', () => {
    const m = draw(SRC)
    expect(shapes(m, 'node')).toHaveLength(5)
    expect(paths(m)).toHaveLength(4)
  })
  it('an empty subgraph still draws', () => {
    const m = draw('flowchart TD\n subgraph g [Empty]\n end\n A')
    expect(shapes(m, 'cluster')).toHaveLength(1)
  })
  it('lists groups in the text version with their members', () => {
    const m = draw(SRC)
    const groups = m.alt.sections.find((s) => s.title === 'Groups')!
    expect(groups.items).toEqual(['Intake: Start, Check', 'Pack: C, D'])
    expect(m.alt.sections[0]!.items.find((i) => i.startsWith('Start'))).toBe('Start (in Intake)')
    expect(m.summary).toBe('Flowchart with 5 nodes and 4 connections in 2 groups, left to right')
  })
  it('nested subgraphs list their children', () => {
    const m = draw('flowchart TD\n subgraph a\n subgraph b\n X\n end\n end')
    expect(m.alt.sections.find((s) => s.title === 'Groups')!.items).toEqual(['a: b', 'b: X'])
  })
})

describe('flowchart render: text alternative and summary', () => {
  it('lists nodes in reading order, with decision and database noted', () => {
    const m = draw(FLOW)
    expect(m.alt.sections[0]).toMatchObject({ title: 'Nodes', ordered: true })
    expect(m.alt.sections[0]!.items).toEqual(['Booking', 'Fits? (decision)', 'Split', 'Assign', 'Depart', 'Log (database)'])
  })
  it('reading order follows the flow direction', () => {
    const first = (d: RenderOptions['direction']) => draw('flowchart TD\n A --> B --> C', { direction: d }).alt.sections[0]!.items
    expect(first('TB')).toEqual(['A', 'B', 'C'])
    expect(first('BT')).toEqual(['A', 'B', 'C'])
    expect(first('LR')).toEqual(['A', 'B', 'C'])
    expect(first('RL')).toEqual(['A', 'B', 'C'])
  })
  it('lists connections as "A to B: label" with the line kind', () => {
    const m = draw('flowchart TD\n A -->|go| B\n B -.-> C\n C ==> D')
    expect(m.alt.sections[1]).toMatchObject({ title: 'Connections', ordered: false })
    expect(m.alt.sections[1]!.items).toEqual(['A to B: go', 'B to C (dashed line)', 'C to D (thick line)'])
  })
  it('uses the cleaned label, not the id', () => {
    const m = draw('flowchart TD\n a["Line one<br/>Line two"] --> b[Next]')
    expect(m.alt.sections[0]!.items).toEqual(['Line one Line two', 'Next'])
    expect(m.alt.sections[1]!.items).toEqual(['Line one Line two to Next'])
  })
  it('singular forms', () => {
    expect(draw('flowchart TD\n A').summary).toBe('Flowchart with 1 node and 0 connections, top to bottom')
    expect(draw('flowchart TD\n A --> B').summary).toBe('Flowchart with 2 nodes and 1 connection, top to bottom')
  })
})

describe('flowchart render: text handling', () => {
  it('wraps long labels and grows the node', () => {
    const short = draw('flowchart TD\n A[Short]')
    const long = draw(`flowchart TD\n A[${'long words that wrap around '.repeat(6)}]`)
    expect(texts(long, 'node-label')[0]!.lines.length).toBeGreaterThan(2)
    expect(long.height).toBeGreaterThan(short.height + 30)
    expect(long.width).toBeLessThan(400)
  })
  it('breaks a single unbroken word', () => {
    const m = draw(`flowchart TD\n A[${'x'.repeat(300)}]`)
    expect(texts(m, 'node-label')[0]!.lines.length).toBeGreaterThan(3)
  })
  it('handles unicode, rtl and emoji text', () => {
    const m = draw('flowchart TD\n A[日本語のラベル] --> B[مرحبا بالعالم] --> C["\u{1F600} smile"]')
    expect(allLines(m)).toEqual(expect.arrayContaining(['日本語のラベル', 'مرحبا بالعالم', '\u{1F600} smile']))
  })
  it('keeps hostile text as inert text lines (tags are dropped, never emitted as markup)', () => {
    const m = draw('flowchart TD\n A["<script>alert(1)</script>"] --> B["\\"><img src=x onerror=alert(1)>"] --> C[javascript:alert(1)]')
    const lines = allLines(m)
    expect(lines).toContain('alert(1)')
    expect(lines).toContain('javascript:alert(1)')
    expect(lines.join('|')).not.toMatch(/<(script|img)/)
    for (const i of m.items) if (i.kind !== 'text') expect(JSON.stringify(i)).not.toMatch(/script|onerror|javascript|<img/)
  })
  it('decodes entities in labels', () => {
    expect(texts(draw('flowchart TD\n A["say #quot;hi#quot; #35;1"]'), 'node-label')[0]!.lines[0]).toBe('say "hi" #1')
  })
  it('an empty label shows the id', () => {
    expect(texts(draw('flowchart TD\n A[""]'), 'node-label')[0]!.lines[0]).toBe('A')
  })
  it('keeps snake_case text intact', () => {
    expect(texts(draw('flowchart TD\n A[snake_case_name]'), 'node-label')[0]!.lines[0]).toBe('snake_case_name')
  })
})

describe('flowchart render: limits and errors', () => {
  const big = (n: number, e: number) => ['flowchart TD', ...Array.from({ length: n }, (_, i) => `  n${i}`), ...Array.from({ length: e }, (_, i) => `  n${i % n} --> n${(i + 1) % n}`)].join('\n')
  it('maxNodes stops a large diagram with a limit error', () => {
    const err = fail(big(30, 0), { maxNodes: 10 })
    expect(err).toMatchObject({ code: 'limit', diagramType: 'flowchart' })
    expect(err.message).toContain('30 nodes')
    expect(err.message).toContain('maxNodes')
  })
  it('maxEdges stops too many connections', () => {
    const err = fail(big(5, 40), { maxEdges: 10 })
    expect(err).toMatchObject({ code: 'limit' })
    expect(err.message).toContain('maxEdges')
  })
  it('the defaults allow 300 nodes and 600 edges', () => {
    expect(() => draw(big(300, 0))).not.toThrow()
    expect(fail(big(301, 0)).code).toBe('limit')
  })
  it('an empty flowchart is reported, not drawn blank', () => {
    expect(fail('flowchart TD')).toMatchObject({ code: 'empty' })
  })
  it('a flowchart with only an empty subgraph is drawable', () => {
    expect(draw('flowchart TD\n subgraph g\n end').nodes).toBe(0)
  })
})

describe('flowchart render: speed', () => {
  it('parses, lays out and draws 200 nodes in about 100ms', () => {
    const lines = ['flowchart TD']
    for (let i = 1; i < 200; i++) lines.push(`  n${Math.floor((i - 1) / 2)}[Step ${i}] --> n${i}`)
    for (let i = 5; i < 200; i += 9) lines.push(`  n${i} -.-> n${Math.min(199, i + 17)}`)
    const src = lines.join('\n')
    let best = Infinity
    for (let k = 0; k < 3; k++) {
      const t = performance.now()
      const m = draw(src)
      best = Math.min(best, performance.now() - t)
      expect(m.nodes).toBe(200)
    }
    expect(best).toBeLessThan(150)
  })
})
