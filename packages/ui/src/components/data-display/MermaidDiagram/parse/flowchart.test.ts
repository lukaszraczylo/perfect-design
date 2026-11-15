import { describe, expect, it } from 'vitest'
import { parseMermaid, type FlowchartAst } from '.'

const ok = (src: string): FlowchartAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(`${r.errors[0]!.message} (${r.errors[0]!.line}:${r.errors[0]!.column})`)
  expect(r.ast.type).toBe('flowchart')
  return r.ast as FlowchartAst
}
const err = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error(`expected an error for ${JSON.stringify(src)}`)
  return r.errors[0]!
}
const shapeOf = (src: string) => ok(`flowchart TD\n${src}`).nodes[0]!

describe('flowchart header', () => {
  it.each([
    ['flowchart TD', 'TB'], ['flowchart TB', 'TB'], ['flowchart BT', 'BT'], ['flowchart LR', 'LR'], ['flowchart RL', 'RL'],
    ['graph TD', 'TB'], ['graph LR;', 'LR'], ['flowchart', 'TB'], ['graph', 'TB'], ['flowchart-elk RL', 'RL'],
  ])('%s gives direction %s', (header, dir) => {
    expect(ok(`${header}\n A --> B`).direction).toBe(dir)
  })
  it('remembers the keyword', () => {
    expect(ok('graph TD\n A').keyword).toBe('graph')
    expect(ok('flowchart TD\n A').keyword).toBe('flowchart')
  })
  it('rejects an unknown direction with the column of the word', () => {
    const e = err('flowchart XY\n A-->B')
    expect(e).toMatchObject({ code: 'syntax', line: 1, column: 11 })
    expect(e.message).toContain('Unknown direction "XY"')
    expect(e.sourceLine).toBe('flowchart XY')
  })
  it('accepts statements on the header line after a semicolon', () => {
    const ast = ok('flowchart TD; A-->B; B-->C')
    expect(ast.edges.map((e) => `${e.from}>${e.to}`)).toEqual(['A>B', 'B>C'])
  })
})

describe('flowchart nodes and shapes', () => {
  it.each([
    ['A[Text]', 'rect'], ['A(Text)', 'round'], ['A([Text])', 'stadium'], ['A[[Text]]', 'subroutine'], ['A[(Text)]', 'cylinder'],
    ['A((Text))', 'circle'], ['A(((Text)))', 'doublecircle'], ['A{Text}', 'rhombus'], ['A{{Text}}', 'hexagon'],
    ['A[/Text/]', 'parallelogram'], ['A[\\Text\\]', 'parallelogram-alt'], ['A[/Text\\]', 'trapezoid'], ['A[\\Text/]', 'trapezoid-alt'], ['A>Text]', 'asymmetric'],
  ])('%s is a %s', (src, shape) => {
    const n = shapeOf(src)
    expect(n.shape).toBe(shape)
    expect(n.label).toBe('Text')
    expect(n.id).toBe('A')
  })
  it('a bare node uses its id as the label', () => {
    expect(shapeOf('Plain')).toMatchObject({ id: 'Plain', label: 'Plain', shape: 'rect', defined: false })
  })
  it('keeps quoted text with brackets, colons and arrows', () => {
    expect(shapeOf('A["a [b] --> c: d"]').label).toBe('a [b] --> c: d')
  })
  it('unescapes a backslash-quote in quoted text', () => {
    expect(shapeOf('A["say \\"hi\\""]').label).toBe('say "hi"')
  })
  it('accepts quoted text for the other forms', () => {
    expect(shapeOf('A("Round (x)")')).toMatchObject({ shape: 'round', label: 'Round (x)' })
    expect(shapeOf('A[/"Slash"/]')).toMatchObject({ shape: 'parallelogram', label: 'Slash' })
    expect(shapeOf('A[/"Trap"\\]')).toMatchObject({ shape: 'trapezoid', label: 'Trap' })
  })
  it('treats [/path] without a closing slash as a rectangle', () => {
    expect(shapeOf('A[/path]')).toMatchObject({ shape: 'rect', label: '/path' })
  })
  it('later text overrides earlier text, a bare reference does not', () => {
    const ast = ok('flowchart TD\n A[First]\n A --> B\n A[Second]')
    expect(ast.nodes.find((n) => n.id === 'A')!.label).toBe('Second')
    expect(ast.nodes).toHaveLength(2)
  })
  it('supports ids with hyphens, dots, digits and unicode', () => {
    const ast = ok('flowchart TD\n step-1 --> step.2 --> 3rd --> Ünï --> 日本[日本語]')
    expect(ast.nodes.map((n) => n.id)).toEqual(['step-1', 'step.2', '3rd', 'Ünï', '日本'])
    expect(ast.nodes[4]!.label).toBe('日本語')
  })
  it('supports the @{ shape, label } form', () => {
    const n = shapeOf('A@{ shape: cyl, label: "Store" }')
    expect(n).toMatchObject({ shape: 'cylinder', label: 'Store' })
    expect(shapeOf('A@{ shape: diamond }')).toMatchObject({ shape: 'rhombus', label: 'A' })
    expect(shapeOf('A@{ shape: unknown-thing, label: "x" }')).toMatchObject({ shape: 'rect', label: 'x' })
  })
  it('keeps very long labels whole', () => {
    const long = 'word '.repeat(2000).trim()
    expect(shapeOf(`A[${long}]`).label).toBe(long)
  })
  it('keeps html-like and hostile text as plain label text', () => {
    expect(shapeOf('A["<script>alert(1)</script>"]').label).toBe('<script>alert(1)</script>')
    expect(shapeOf('A["\\"><img src=x onerror=alert(1)>"]').label).toBe('"><img src=x onerror=alert(1)>')
    expect(shapeOf('A[javascript:alert(1)]').label).toBe('javascript:alert(1)')
  })
})

describe('flowchart edges', () => {
  const edge = (arrow: string) => ok(`flowchart TD\n A ${arrow} B`).edges[0]!
  it.each([
    ['-->', 'solid', 'arrow', 'none', 1], ['---', 'solid', 'none', 'none', 1], ['-.->', 'dotted', 'arrow', 'none', 1], ['-.-', 'dotted', 'none', 'none', 1],
    ['==>', 'thick', 'arrow', 'none', 1], ['===', 'thick', 'none', 'none', 1], ['--o', 'solid', 'circle', 'none', 1], ['--x', 'solid', 'cross', 'none', 1],
    ['<-->', 'solid', 'arrow', 'arrow', 1], ['o--o', 'solid', 'circle', 'circle', 1], ['x--x', 'solid', 'cross', 'cross', 1], ['~~~', 'invisible', 'none', 'none', 1],
    ['--->', 'solid', 'arrow', 'none', 2], ['---->', 'solid', 'arrow', 'none', 3], ['----', 'solid', 'none', 'none', 2], ['-..->', 'dotted', 'arrow', 'none', 2], ['===>', 'thick', 'arrow', 'none', 2],
  ])('%s is %s, head %s, tail %s, length %i', (arrow, line, head, tail, length) => {
    expect(edge(arrow)).toMatchObject({ from: 'A', to: 'B', line, head, tail, length })
  })
  it('reads |label| after the arrow, quoted or not, with spaces', () => {
    expect(ok('flowchart TD\n A -->|yes| B').edges[0]!.label).toBe('yes')
    expect(ok('flowchart TD\n A --> |  yes please  | B').edges[0]!.label).toBe('yes please')
    expect(ok('flowchart TD\n A -->|"a | b"| B').edges[0]!.label).toBe('a | b')
  })
  it('reads inline text between the dashes', () => {
    expect(ok('flowchart TD\n A -- some text --> B').edges[0]).toMatchObject({ label: 'some text', line: 'solid', head: 'arrow' })
    expect(ok('flowchart TD\n A -- text --- B').edges[0]).toMatchObject({ label: 'text', head: 'none' })
    expect(ok('flowchart TD\n A == big ==> B').edges[0]).toMatchObject({ label: 'big', line: 'thick' })
    expect(ok('flowchart TD\n A -. dotted .-> B').edges[0]).toMatchObject({ label: 'dotted', line: 'dotted', head: 'arrow' })
  })
  it('chains edges', () => {
    const ast = ok('flowchart TD\n A --> B --> C -.-> D')
    expect(ast.edges.map((e) => `${e.from}>${e.to}:${e.line}`)).toEqual(['A>B:solid', 'B>C:solid', 'C>D:dotted'])
    expect(ast.edges.map((e) => e.index)).toEqual([0, 1, 2])
  })
  it('expands groups with & into every pair', () => {
    const ast = ok('flowchart TD\n A & B --> C & D')
    expect(ast.edges.map((e) => `${e.from}>${e.to}`)).toEqual(['A>C', 'A>D', 'B>C', 'B>D'])
  })
  it('keeps parallel and self edges', () => {
    const ast = ok('flowchart TD\n A --> B\n A --> B\n A --> A')
    expect(ast.edges).toHaveLength(3)
    expect(ast.edges[2]).toMatchObject({ from: 'A', to: 'A' })
  })
  it('splits statements on semicolons but not inside brackets or quotes', () => {
    const ast = ok('flowchart TD\n A[a;b] --> B; B --> C["x;y"];')
    expect(ast.nodes.map((n) => n.label)).toEqual(['a;b', 'B', 'C'.length ? 'x;y' : ''])
    expect(ast.edges).toHaveLength(2)
  })
  it('records the source line of every edge', () => {
    const ast = ok('flowchart TD\n\n A --> B\n %% comment\n B --> C')
    expect(ast.edges.map((e) => e.source)).toEqual([3, 5])
  })
})

describe('flowchart subgraphs', () => {
  it('parses id and title forms', () => {
    const ast = ok('flowchart TD\n subgraph one [First group]\n A\n end\n subgraph Two words\n B\n end\n subgraph "Quoted title"\n C\n end')
    expect(ast.subgraphs.map((s) => [s.id, s.title])).toEqual([['one', 'First group'], ['Two_words', 'Two words'], ['Quoted_title', 'Quoted title']])
    expect(ast.nodes.map((n) => n.parent)).toEqual(['one', 'Two_words', 'Quoted_title'])
  })
  it('nests subgraphs and reads direction', () => {
    const ast = ok('flowchart TD\n subgraph outer\n direction LR\n subgraph inner\n A --> B\n end\n C\n end')
    expect(ast.subgraphs).toMatchObject([{ id: 'outer', direction: 'LR' }, { id: 'inner', parent: 'outer' }])
    expect(ast.nodes.find((n) => n.id === 'A')!.parent).toBe('inner')
    expect(ast.nodes.find((n) => n.id === 'C')!.parent).toBe('outer')
  })
  it('an edge to a subgraph id refers to the subgraph, not a new node', () => {
    const ast = ok('flowchart TD\n subgraph g\n A\n end\n X --> g')
    expect(ast.nodes.map((n) => n.id)).toEqual(['A', 'X'])
    expect(ast.edges[0]!.to).toBe('g')
  })
  it('makes duplicate subgraph ids unique', () => {
    const ast = ok('flowchart TD\n subgraph g\n A\n end\n subgraph g\n B\n end')
    expect(new Set(ast.subgraphs.map((s) => s.id)).size).toBe(2)
  })
  it('reports an unclosed subgraph at its opener', () => {
    const e = err('flowchart TD\n  subgraph one\n A')
    expect(e).toMatchObject({ code: 'syntax', line: 2, column: 3 })
    expect(e.message).toContain('never closed')
  })
  it('reports a stray end and a direction outside a subgraph', () => {
    expect(err('flowchart TD\n end')).toMatchObject({ line: 2, column: 2 })
    expect(err('flowchart TD\n direction LR').message).toContain('inside a subgraph')
    expect(err('flowchart TD\n subgraph\n end').message).toContain('needs a name')
    expect(err('flowchart TD\n subgraph a\n direction XX\n end').message).toContain('Unknown direction')
  })
})

describe('flowchart styling statements', () => {
  it('reads classDef, class and :::', () => {
    const ast = ok('flowchart TD\n classDef hot fill:#f96,stroke:#333,stroke-width:4px\n classDef a,b stroke-dasharray:5 5\n A --> B:::hot\n class A a')
    expect(ast.classDefs.hot).toEqual({ fill: '#f96', stroke: '#333', 'stroke-width': '4px' })
    expect(ast.classDefs.a).toEqual({ 'stroke-dasharray': '5 5' })
    expect(ast.classDefs.b).toEqual({ 'stroke-dasharray': '5 5' })
    expect(ast.nodes.find((n) => n.id === 'B')!.classes).toEqual(['hot'])
    expect(ast.nodes.find((n) => n.id === 'A')!.classes).toEqual(['a'])
  })
  it('reads style for nodes defined before and after the statement', () => {
    const ast = ok('flowchart TD\n A --> B\n style A fill:#fff,stroke:#000\n style C stroke-width:3px\n C')
    expect(ast.nodes.find((n) => n.id === 'A')!.style).toEqual({ fill: '#fff', stroke: '#000' })
    expect(ast.nodes.find((n) => n.id === 'C')!.style).toEqual({ 'stroke-width': '3px' })
  })
  it('reads linkStyle by index and default', () => {
    const ast = ok('flowchart TD\n A --> B --> C\n linkStyle 0,1 stroke-width:3px\n linkStyle default stroke-dasharray:4')
    expect(ast.linkStyles).toEqual([{ indexes: [0, 1], decl: { 'stroke-width': '3px' } }, { indexes: 'default', decl: { 'stroke-dasharray': '4' } }])
  })
  it('ignores click lines safely', () => {
    const ast = ok('flowchart TD\n A --> B\n click A href "javascript:alert(1)" _blank\n click B callback "tip"')
    expect(ast.nodes.map((n) => n.id)).toEqual(['A', 'B'])
    expect(ast.edges).toHaveLength(1)
  })
  it('rejects incomplete styling statements', () => {
    expect(err('flowchart TD\n classDef').message).toContain('classDef needs')
    expect(err('flowchart TD\n class A').message).toContain('class needs')
    expect(err('flowchart TD\n style A').message).toContain('style needs')
    expect(err('flowchart TD\n linkStyle x').message).toContain('linkStyle needs')
    expect(err('flowchart TD\n A:::').message).toContain('class name')
  })
})

describe('flowchart syntax errors report line, column and the offending line', () => {
  it('unterminated bracket', () => {
    const e = err('flowchart TD\n A[Start --> B')
    expect(e).toMatchObject({ code: 'syntax', line: 2, column: 3, sourceLine: ' A[Start --> B' })
    expect(e.message).toContain('never closed')
  })
  it('unterminated quote', () => {
    expect(err('flowchart TD\n A["open --> B')).toMatchObject({ line: 2, column: 4 })
    expect(err('flowchart TD\n A["open --> B').message).toContain('quoted text is never closed')
  })
  it.each([
    ['A -> B', 4, 'Unknown arrow "->"'],
    ['A --> B --> ', 12, 'Expected a node after the arrow'],
    ['A B', 4, 'Unexpected "B"'],
    ['A -- B', 4, 'link text is not closed'],
    ['A == B', 4, 'link text is not closed'],
    ['A -. B', 4, 'link text is not closed'],
    ['A --B', 4, 'not an arrow'],
    ['A --> |label B', 8, 'never closed'],
    ['A --> |"label B', 9, 'quoted text is never closed'],
    ['A ==>> B', 7, 'Check the arrow before it'],
    ['A --> $', 8, 'Unexpected "$"'],
    ['A@{ shape: cyl', 3, 'never closed'],
    ['A ??', 4, 'Unexpected "??"'],
  ])('%s fails at column %i', (stmt, column, text) => {
    const e = err(`flowchart TD\n ${stmt}`)
    expect(e.line).toBe(2)
    expect(e.column).toBe(column)
    expect(e.message).toContain(text)
  })
  it('an unknown arrow at the end of a statement', () => {
    expect(err('flowchart TD\n A -').message).toContain('Unknown arrow')
  })
  it('reports the right line after comments and blank lines', () => {
    const e = err('%% note\nflowchart TD\n\n  A --> B\n\n  B -> C')
    expect(e.line).toBe(6)
    expect(e.sourceLine).toBe('  B -> C')
  })
  it('an unclosed bracket in a quoted shape names the missing closer', () => {
    expect(err('flowchart TD\n A["text" ').message).toContain('Expected "]"')
  })
})

describe('flowchart edge ids and trailing comments', () => {
  it('reads edge ids before any arrow kind and keeps the edge', () => {
    const ast = ok('flowchart TD\n A e1@--> B\n B e2@-.-> C\n C e3@==> D\n D e4@-- text --> E\n E e5@o--o F')
    expect(ast.edges.map((e) => [e.id, e.from, e.to, e.line])).toEqual([['e1', 'A', 'B', 'solid'], ['e2', 'B', 'C', 'dotted'], ['e3', 'C', 'D', 'thick'], ['e4', 'D', 'E', 'solid'], ['e5', 'E', 'F', 'solid']])
    expect(ast.edges[3]!.label).toBe('text')
    expect(ast.edges[4]).toMatchObject({ head: 'circle', tail: 'circle' })
  })
  it('edges without an id have no id field', () => {
    expect('id' in ok('flowchart TD\n A --> B').edges[0]!).toBe(false)
  })
  it('ignores property lines of an edge id and reports an unclosed one', () => {
    const ast = ok('flowchart TD\n A e1@--> B\n e1@{ animate: true }')
    expect(ast.nodes.map((n) => n.id)).toEqual(['A', 'B'])
    expect(err('flowchart TD\n A e1@--> B\n e1@{ animate: true').message).toContain('never closed')
  })
  it('a node with a shape block is still a node, also when its name looks like an edge id', () => {
    expect(ok('flowchart TD\n e1@{ shape: cyl, label: "DB" }').nodes[0]).toMatchObject({ id: 'e1', shape: 'cylinder' })
  })
  it('ignores a %% comment after a statement but not inside text', () => {
    const ast = ok('flowchart TD\n A --> B %% a note\n B["50%% off"] --> C[x %% y] %% trailing\n C --> D  %%')
    expect(ast.edges).toHaveLength(3)
    expect(ast.nodes.find((n) => n.id === 'B')!.label).toBe('50%% off')
    expect(ast.nodes.find((n) => n.id === 'C')!.label).toBe('x %% y')
  })
})

describe('flowchart extra forms', () => {
  it('a subgraph title without letters still gets an id', () => {
    expect(ok('flowchart TD\n subgraph "!!!"\n A\n end').subgraphs[0]!.id).toBe('group')
  })
  it('a dangling & is reported', () => {
    expect(err('flowchart TD\n A &').message).toContain('Expected a node name')
  })
  it('a quoted edge label must be closed after the quote', () => {
    expect(err('flowchart TD\n A -->|"x" y| B').message).toContain('never closed')
  })
  it('an empty quoted label falls back to the id when drawn', () => {
    expect(shapeOf('A[""]').label).toBe('')
  })
})

describe('flowchart robustness', () => {
  it('parses CRLF and CR line endings like LF', () => {
    const lf = ok('flowchart TD\n A --> B\n B --> C')
    expect(ok('flowchart TD\r\n A --> B\r\n B --> C').edges).toEqual(lf.edges)
    expect(ok('flowchart TD\r A --> B\r B --> C').edges).toEqual(lf.edges)
  })
  it('parses 1000 lines quickly', () => {
    const lines = ['flowchart LR']
    for (let i = 0; i < 1000; i++) lines.push(`  n${i}[Step ${i}] --> n${i + 1}`)
    const t = performance.now()
    const ast = ok(lines.join('\n'))
    expect(ast.edges).toHaveLength(1000)
    expect(performance.now() - t).toBeLessThan(500)
  })
  it('handles a 100 000 character line', () => {
    const t = performance.now()
    const ast = ok(`flowchart TD\n A[${'x'.repeat(100000)}] --> B`)
    expect(ast.nodes[0]!.label).toHaveLength(100000)
    expect(performance.now() - t).toBeLessThan(500)
  })
  it('handles a flowchart with only a header', () => {
    expect(ok('flowchart TD')).toMatchObject({ nodes: [], edges: [] })
  })
  it('ignores %% comments, directives and keeps accessibility lines in meta', () => {
    const ast = ok('%%{init: {"theme": "dark"}}%%\nflowchart TD\n %% a comment\n accTitle: Shipping\n accDescr: How a parcel moves\n A --> B')
    expect(ast.meta).toEqual({ accTitle: 'Shipping', accDescr: 'How a parcel moves' })
    expect(ast.edges).toHaveLength(1)
  })
})
