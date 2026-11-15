/**
 * `flowchart` / `graph` parser.
 *
 * Supported: direction (TB TD BT LR RL), all node shapes (see `NODE_SHAPES`), the `A@{ shape: x, label: "y" }` form for
 * the common shapes, chains (`A --> B --> C`), groups (`A & B --> C & D`), edge kinds (`-->` `---` `-.->` `==>` `--o` `--x`
 * `<-->` `o--o` `x--x` `~~~`), longer arrows (`---->`), labels (`-->|text|` and `-- text -->`), subgraphs (nested, with
 * `direction`), `classDef`, `class`, `:::class`, `style`, `linkStyle`. `click` lines are accepted and ignored.
 * Edge ids (`e1@-->`) and their `e1@{ animate: true }` property lines are read and ignored. `%%` comments may follow a
 * statement. Not supported: `@{ ... }` icon/image shapes, markdown strings, FontAwesome icons.
 */
import type { NodeShape } from '../../_diagram/shapes'
import { fail, type DiagramMeta, type SourceLine } from '../../_diagram/types'
import type { PreparedSource } from '../../_diagram/source'
import { parseDecl, type StyleDecl } from '../../_diagram/style'

export type FlowDirection = 'TB' | 'BT' | 'LR' | 'RL'
export type FlowEdgeLine = 'solid' | 'dotted' | 'thick' | 'invisible'
export type FlowEdgeEnd = 'arrow' | 'cross' | 'circle' | 'none'

export interface FlowNode {
  id: string
  /** Text as written (before `<br>` and entity handling). Equals `id` when the node has no text. */
  label: string
  shape: NodeShape
  classes: string[]
  style: StyleDecl
  /** Id of the innermost subgraph that lists the node. */
  parent?: string
  /** True when the node was given text or a shape (not only referenced). */
  defined: boolean
  line: number
}

export interface FlowEdge {
  index: number
  /** Id written before the arrow (`e1@-->`), read and kept; it has no visual effect. */
  id?: string
  from: string
  to: string
  label?: string
  line: FlowEdgeLine
  head: FlowEdgeEnd
  tail: FlowEdgeEnd
  /** Ranks spanned (1 for `-->`, 2 for `--->`). */
  length: number
  source: number
}

export interface FlowSubgraph {
  id: string
  title: string
  parent?: string
  direction?: FlowDirection
  line: number
}

export interface FlowchartAst {
  type: 'flowchart'
  keyword: string
  direction: FlowDirection
  nodes: FlowNode[]
  edges: FlowEdge[]
  subgraphs: FlowSubgraph[]
  classDefs: Record<string, StyleDecl>
  linkStyles: { indexes: number[] | 'default'; decl: StyleDecl }[]
  meta: DiagramMeta
}

const DIRECTIONS: Record<string, FlowDirection> = { TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' }

interface Stmt {
  text: string
  /** Column (1-based) of text[0]. */
  col: number
  no: number
}

/** Split on `;` outside quotes and brackets. */
function splitStatements(line: SourceLine): Stmt[] {
  const out: Stmt[] = []
  const s = line.text
  let depth = 0
  let quote = false
  let start = 0
  for (let i = 0; i <= s.length; i++) {
    const ch = s[i]
    if (ch === '"') quote = !quote
    else if (!quote && (ch === '[' || ch === '(' || ch === '{')) depth++
    else if (!quote && (ch === ']' || ch === ')' || ch === '}')) depth = Math.max(0, depth - 1)
    if ((!quote && depth === 0 && ch === ';') || i === s.length) {
      const raw = s.slice(start, i)
      const text = raw.trim()
      if (text) out.push({ text, col: line.col + start + (raw.length - raw.trimStart().length), no: line.no })
      start = i + 1
    }
  }
  return out
}

const slug = (s: string): string => s.trim().replace(/[^\p{L}\p{N}_]+/gu, '_').replace(/^_+|_+$/g, '') || 'group'

const ID_START = /[\p{L}\p{N}_]/u

const OPENERS: { open: string; close: string; shape: NodeShape }[] = [
  { open: '(((', close: ')))', shape: 'doublecircle' },
  { open: '((', close: '))', shape: 'circle' },
  { open: '([', close: '])', shape: 'stadium' },
  { open: '(', close: ')', shape: 'round' },
  { open: '[[', close: ']]', shape: 'subroutine' },
  { open: '[(', close: ')]', shape: 'cylinder' },
  { open: '[/', close: '/]', shape: 'parallelogram' },
  { open: '[\\', close: '\\]', shape: 'parallelogram-alt' },
  { open: '[/', close: '\\]', shape: 'trapezoid' },
  { open: '[\\', close: '/]', shape: 'trapezoid-alt' },
  { open: '[', close: ']', shape: 'rect' },
  { open: '{{', close: '}}', shape: 'hexagon' },
  { open: '{', close: '}', shape: 'rhombus' },
  { open: '>', close: ']', shape: 'asymmetric' },
]

const SHAPE_ALIASES: Record<string, NodeShape> = {
  rect: 'rect', rectangle: 'rect', proc: 'rect', process: 'rect', 'div-proc': 'rect',
  rounded: 'round', event: 'round', stadium: 'stadium', terminal: 'stadium', pill: 'stadium',
  'fr-rect': 'subroutine', subproc: 'subroutine', subroutine: 'subroutine', 'framed-rectangle': 'subroutine',
  cyl: 'cylinder', cylinder: 'cylinder', db: 'cylinder', database: 'cylinder',
  circle: 'circle', circ: 'circle', 'dbl-circ': 'doublecircle', 'double-circle': 'doublecircle',
  diam: 'rhombus', diamond: 'rhombus', decision: 'rhombus', question: 'rhombus',
  hex: 'hexagon', hexagon: 'hexagon', prepare: 'hexagon',
  'lean-r': 'parallelogram', 'lean-right': 'parallelogram', 'in-out': 'parallelogram',
  'lean-l': 'parallelogram-alt', 'lean-left': 'parallelogram-alt', 'out-in': 'parallelogram-alt',
  'trap-b': 'trapezoid', trapezoid: 'trapezoid', 'trap-t': 'trapezoid-alt', 'inv-trapezoid': 'trapezoid-alt', odd: 'asymmetric',
}

class Cursor {
  i = 0
  constructor(readonly s: string, readonly col: number, readonly no: number) {}
  get done(): boolean {
    return this.i >= this.s.length
  }
  at(offset = 0): string {
    return this.s[this.i + offset] ?? ''
  }
  ws(): void {
    while (this.i < this.s.length && /\s/.test(this.s[this.i]!)) this.i++
  }
  startsWith(t: string): boolean {
    return this.s.startsWith(t, this.i)
  }
  fail(msg: string, at = this.i): never {
    return fail(this.no, this.col + at, msg)
  }
}

interface ParseState {
  ast: FlowchartAst
  nodes: Map<string, FlowNode>
  subgraphIds: Set<string>
  stack: FlowSubgraph[]
  pendingClass: { ids: string[]; names: string[]; no: number }[]
  styles: Map<string, StyleDecl>
}

function scanId(c: Cursor): string {
  const start = c.i
  while (c.i < c.s.length) {
    const ch = c.s[c.i]!
    if (ID_START.test(ch)) c.i++
    else if (ch === '-' && c.i > start && /[\p{L}\p{N}_]/u.test(c.s[c.i + 1] ?? '') ) c.i++
    else if (ch === '.' && c.i > start && /[\p{L}\p{N}_]/u.test(c.s[c.i + 1] ?? '')) c.i++
    else break
  }
  return c.s.slice(start, c.i)
}

/** Text between quotes starting at the opening quote; returns the unquoted text and moves past the closing quote. */
function scanQuoted(c: Cursor): string {
  const open = c.i
  c.i++
  let out = ''
  while (c.i < c.s.length && c.s[c.i] !== '"') {
    if (c.s[c.i] === '\\' && c.s[c.i + 1] === '"') {
      out += '"'
      c.i += 2
    } else out += c.s[c.i++]
  }
  if (c.i >= c.s.length) c.fail('This quoted text is never closed. Add the closing ".', open)
  c.i++
  return out
}

const OPEN_ORDER = ['(((', '((', '([', '(', '[[', '[(', '[/', '[\\', '[', '{{', '{', '>']

function parseShapeText(c: Cursor, id: string): { text: string; shape: NodeShape } | null {
  for (const open of OPEN_ORDER) {
    if (!c.startsWith(open)) continue
    const group = OPENERS.filter((o) => o.open === open)
    // `[/path]` is a plain rectangle unless a slash closer follows
    if ((open === '[/' || open === '[\\') && !group.some((o) => c.s.includes(o.close, c.i + open.length))) continue
    const start = c.i
    c.i += open.length
    c.ws()
    if (c.at() === '"') {
      const text = scanQuoted(c)
      c.ws()
      const hit = group.find((o) => c.startsWith(o.close))
      if (!hit) return c.fail(`Expected "${group[0]!.close}" after the quoted text of ${id}.`, c.i)
      c.i += hit.close.length
      return { text, shape: hit.shape }
    }
    let at = -1
    let hit = group[0]!
    for (const o of group) {
      const found = c.s.indexOf(o.close, c.i)
      if (found !== -1 && (at === -1 || found < at)) {
        at = found
        hit = o
      }
    }
    if (at === -1) return c.fail(`The "${open}" opened here is never closed. Expected "${group[0]!.close}" after the text of ${id}.`, start)
    const text = c.s.slice(c.i, at)
    c.i = at + hit.close.length
    return { text, shape: hit.shape }
  }
  return null
}

function parseNewShape(c: Cursor): { text?: string; shape?: NodeShape } {
  // c is at "@{"
  const open = c.i
  const end = c.s.indexOf('}', c.i)
  if (end === -1) c.fail('The "@{" shape block is never closed. Add the closing "}".', open)
  const body = c.s.slice(c.i + 2, end)
  c.i = end + 1
  const out: { text?: string; shape?: NodeShape } = {}
  const re = /\s*([\w-]+)\s*:\s*("(?:[^"]*)"|[^,]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    const key = m[1]!.toLowerCase()
    const val = m[2]!.trim().replace(/^"|"$/g, '')
    if (key === 'shape') {
      const shape = SHAPE_ALIASES[val.toLowerCase()]
      if (shape) out.shape = shape
    } else if (key === 'label') out.text = val
    if (re.lastIndex === m.index) re.lastIndex++
    while (body[re.lastIndex] === ',') re.lastIndex++
  }
  return out
}

function registerNode(st: ParseState, id: string, line: number, info: { text?: string; shape?: NodeShape }, classes: string[]): void {
  const sub = st.stack[st.stack.length - 1]
  if (st.subgraphIds.has(id) && info.text === undefined && info.shape === undefined && classes.length === 0) return
  let node = st.nodes.get(id)
  if (!node) {
    node = { id, label: id, shape: 'rect', classes: [], style: {}, defined: false, line }
    st.nodes.set(id, node)
    st.ast.nodes.push(node)
  }
  if (info.text !== undefined) {
    node.label = info.text
    node.defined = true
  }
  if (info.shape !== undefined) {
    node.shape = info.shape
    node.defined = true
  }
  for (const k of classes) if (!node.classes.includes(k)) node.classes.push(k)
  if (sub) node.parent = sub.id
}

function parseNode(st: ParseState, c: Cursor): string {
  c.ws()
  const start = c.i
  const id = scanId(c)
  if (!id) {
    const ch = c.at()
    if (ch && '-=.<>~'.includes(ch)) return c.fail(`Unexpected "${ch}" where a node name was expected. Check the arrow before it: arrows are "-->", "---", "-.->", "==>", "--o", "--x", "<-->" and "~~~".`, start)
    return c.fail(ch ? `Unexpected "${ch}" where a node name was expected. Node names use letters, digits and underscores.` : 'Expected a node name here.', start)
  }
  let classes: string[] = []
  const takeClasses = () => {
    if (c.startsWith(':::')) {
      c.i += 3
      const s = c.i
      while (/[\w-]/.test(c.at())) c.i++
      if (c.i === s) c.fail('Expected a class name after ":::".')
      classes = classes.concat(c.s.slice(s, c.i).split(','))
    }
  }
  takeClasses()
  let info: { text?: string; shape?: NodeShape } = {}
  if (c.startsWith('@{')) info = parseNewShape(c)
  else {
    const shaped = parseShapeText(c, id)
    if (shaped) info = shaped
  }
  takeClasses()
  registerNode(st, id, c.no, info, classes)
  return id
}

const ARROW = /([<ox])?(?:(-{2,})|(={2,})|(-\.+-)|(~{3,}))([>ox])?/y
const TEXT_OPEN = /(--|==|-\.)(?=\s)/y

interface Link {
  id?: string
  line: FlowEdgeLine
  head: FlowEdgeEnd
  tail: FlowEdgeEnd
  length: number
  label?: string
}

const endOf = (ch: string | undefined): FlowEdgeEnd => (ch === 'o' ? 'circle' : ch === 'x' ? 'cross' : ch === '>' || ch === '<' ? 'arrow' : 'none')

function bodyToLink(m: RegExpExecArray): Link {
  const [, tail, solid, thick, dotted, invisible, head] = m
  const dashes = (solid ?? thick ?? '').length
  const hasHead = head !== undefined
  let line: FlowEdgeLine = 'solid'
  let length = 1
  if (solid) {
    length = Math.max(1, hasHead ? dashes - 1 : dashes - 2)
  } else if (thick) {
    line = 'thick'
    length = Math.max(1, hasHead ? dashes - 1 : dashes - 2)
  } else if (dotted) {
    line = 'dotted'
    length = Math.max(1, dotted.length - 2)
  } else if (invisible) line = 'invisible'
  return { line, head: line === 'invisible' ? 'none' : endOf(head), tail: line === 'invisible' ? 'none' : endOf(tail), length }
}

function scanPipeLabel(c: Cursor): string | undefined {
  const save = c.i
  c.ws()
  if (c.at() !== '|') {
    c.i = save
    return undefined
  }
  const open = c.i
  c.i++
  let text: string
  c.ws()
  if (c.at() === '"') {
    text = scanQuoted(c)
    c.ws()
    if (c.at() !== '|') c.fail('The edge label opened here is never closed. Add the closing "|".', open)
    c.i++
    return text
  }
  const end = c.s.indexOf('|', c.i)
  if (end === -1) c.fail('The edge label opened here is never closed. Add the closing "|".', open)
  text = c.s.slice(c.i, end)
  c.i = end + 1
  return text.trim()
}

const EDGE_ID = /([A-Za-z_][\w-]*)@(?=[-=.<~ox])/y

function parseLink(c: Cursor): Link {
  c.ws()
  const start = c.i
  EDGE_ID.lastIndex = c.i
  const idMatch = EDGE_ID.exec(c.s)
  if (idMatch) c.i += idMatch[0].length
  const link = parseLinkBody(c, start)
  if (idMatch) link.id = idMatch[1]
  return link
}

function parseLinkBody(c: Cursor, start: number): Link {
  TEXT_OPEN.lastIndex = c.i
  const to = TEXT_OPEN.exec(c.s)
  if (to) {
    const family = to[1]!
    const re = family === '--' ? /-{2,}[>ox]|-{3,}/g : family === '==' ? /={2,}[>ox]|={3,}/g : /\.+-[>ox]?/g
    re.lastIndex = c.i + family.length
    const m = re.exec(c.s)
    if (!m) return c.fail(`This link text is not closed. After the text, end the arrow: ${family === '--' ? '"-->" or "---"' : family === '==' ? '"==>" or "==="' : '".->" or ".-"'}.`, start)
    const text = c.s.slice(c.i + family.length, m.index).trim()
    // the closer of a dotted link lacks its leading dash
    ARROW.lastIndex = 0
    const am = ARROW.exec(family === '-.' ? `-${m[0]}` : m[0])
    c.i = m.index + m[0].length
    const link = am ? bodyToLink(am) : { line: 'solid' as FlowEdgeLine, head: 'arrow' as FlowEdgeEnd, tail: 'none' as FlowEdgeEnd, length: 1 }
    link.label = text
    const pipe = scanPipeLabel(c)
    if (pipe !== undefined) link.label = pipe
    return link
  }
  ARROW.lastIndex = c.i
  const m = ARROW.exec(c.s)
  if (m) {
    const link = bodyToLink(m)
    const bare = !m[1] && !m[6] && ((m[2] && m[2].length === 2) || (m[3] && m[3].length === 2))
    if (bare) c.fail(`"${m[0]}" is not an arrow. Use "-->" or "---" ("==>" or "===" for thick), or put text between two dashes: "-- text -->".`, start)
    c.i += m[0].length
    const label = scanPipeLabel(c)
    if (label !== undefined) link.label = label
    return link
  }
  const token = /^[-=.<>~]+/.exec(c.s.slice(c.i))?.[0]
  if (token) return c.fail(`Unknown arrow "${token}". Arrows are "-->", "---", "-.->", "==>", "--o", "--x", "<-->" and "~~~".`, start)
  const word = /^\S+/.exec(c.s.slice(c.i))?.[0] ?? c.at()
  return c.fail(`Unexpected "${word}" after a node. Connect nodes with an arrow such as "-->".`, start)
}

function parseChain(st: ParseState, s: Stmt): void {
  const c = new Cursor(s.text, s.col, s.no)
  const group = (): string[] => {
    const ids = [parseNode(st, c)]
    for (;;) {
      c.ws()
      if (c.at() !== '&') break
      c.i++
      ids.push(parseNode(st, c))
    }
    return ids
  }
  let left = group()
  for (;;) {
    c.ws()
    if (c.done) return
    const linkStart = c.i
    const link = parseLink(c)
    c.ws()
    if (c.done) c.fail('Expected a node after the arrow.', Math.max(linkStart, c.i - 1))
    const right = group()
    for (const a of left) {
      for (const b of right) {
        st.ast.edges.push({ index: st.ast.edges.length, ...(link.id ? { id: link.id } : {}), from: a, to: b, label: link.label, line: link.line, head: link.head, tail: link.tail, length: link.length, source: s.no })
      }
    }
    left = right
  }
}

function parseSubgraph(st: ParseState, s: Stmt): void {
  const rest = s.text.slice('subgraph'.length).trim()
  const col = s.col
  if (!rest) fail(s.no, col, 'A subgraph needs a name: "subgraph Title" or "subgraph id [Title]".')
  let id: string
  let title: string
  const bracket = /^([^\s[\]"]+)\s*\[(.*)\]$/.exec(rest)
  const quoted = /^"(.*)"$/.exec(rest)
  if (bracket) {
    id = bracket[1]!
    title = bracket[2]!.trim().replace(/^"(.*)"$/, '$1')
  } else if (quoted) {
    title = quoted[1]!
    id = slug(title)
  } else {
    title = rest
    id = /^[\p{L}\p{N}_-]+$/u.test(rest) ? rest : slug(rest)
  }
  let unique = id
  for (let n = 2; st.subgraphIds.has(unique); n++) unique = `${id}_${n}`
  const parent = st.stack[st.stack.length - 1]
  const sg: FlowSubgraph = { id: unique, title, parent: parent?.id, line: s.no }
  st.ast.subgraphs.push(sg)
  st.subgraphIds.add(unique)
  st.stack.push(sg)
}

function parseDirection(text: string, no: number, col: number): FlowDirection {
  const d = DIRECTIONS[text.trim().replace(/;$/, '')]
  if (!d) fail(no, col, `Unknown direction "${text.trim()}". Use TB, TD, BT, LR or RL.`)
  return d!
}

function parseStatement(st: ParseState, s: Stmt): void {
  const t = s.text
  const word = /^[A-Za-z]+/.exec(t)?.[0]
  const after = (n: number) => t.slice(n).trim()
  const rel = (n: number) => s.col + (t.length - t.slice(n).trimStart().length)
  if (word === 'subgraph' && (t.length === 8 || /\s/.test(t[8]!))) return parseSubgraph(st, s)
  if (t === 'end') {
    if (!st.stack.length) fail(s.no, s.col, 'This "end" has no matching "subgraph".')
    st.stack.pop()
    return
  }
  if (word === 'direction' && /^direction\s+\S+/.test(t)) {
    const dir = parseDirection(after(9), s.no, rel(9))
    const top = st.stack[st.stack.length - 1]
    if (top) top.direction = dir
    else fail(s.no, s.col, '"direction" can only be used inside a subgraph. Set the direction on the first line, for example "flowchart LR".')
    return
  }
  if (word === 'classDef' && (t === 'classDef' || /^classDef\s/.test(t))) {
    const m = /^classDef\s+(\S+)\s*(.*)$/.exec(t)
    if (!m) return fail(s.no, s.col, 'classDef needs a name and styles: "classDef name stroke-width:2px".')
    const decl = parseDecl(m[2]!)
    for (const name of m[1]!.split(',')) if (name) st.ast.classDefs[name] = { ...st.ast.classDefs[name], ...decl }
    return
  }
  if (word === 'class' && (t === 'class' || /^class\s/.test(t))) {
    const m = /^class\s+(\S+)\s+(\S+)$/.exec(t)
    if (!m) return fail(s.no, s.col, 'class needs node ids and a class name: "class A,B name".')
    st.pendingClass.push({ ids: m[1]!.split(',').filter(Boolean), names: m[2]!.split(','), no: s.no })
    return
  }
  if (word === 'style' && (t === 'style' || /^style\s/.test(t))) {
    const m = /^style\s+(\S+)\s*(.*)$/.exec(t)
    if (!m || !m[2]) return fail(s.no, s.col, 'style needs a node id and declarations: "style A stroke-width:2px".')
    for (const id of m[1]!.split(',').filter(Boolean)) st.styles.set(id, { ...(st.styles.get(id) ?? {}), ...parseDecl(m[2]) })
    return
  }
  if (word === 'linkStyle' && (t === 'linkStyle' || /^linkStyle\s/.test(t))) {
    const m = /^linkStyle\s+(default|[\d,\s]+)\s+(.*)$/.exec(t)
    if (!m) return fail(s.no, s.col, 'linkStyle needs link numbers and declarations: "linkStyle 0,1 stroke-width:2px".')
    const indexes = m[1] === 'default' ? 'default' : m[1]!.split(',').map((x) => Number(x.trim())).filter((n) => Number.isInteger(n))
    st.ast.linkStyles.push({ indexes, decl: parseDecl(m[2]!) })
    return
  }
  if ((word === 'click' || word === 'callback' || word === 'href') && /^(click|callback|href)\s/.test(t)) return
  // `e1@{ animate: true }` sets properties of an edge id: read and ignored
  const prop = /^([A-Za-z_][\w-]*)@\{/.exec(t)
  if (prop && st.ast.edges.some((e) => e.id === prop[1])) {
    if (!t.includes('}')) fail(s.no, s.col + prop[0].length - 2, 'The "@{" block is never closed. Add the closing "}".')
    return
  }
  parseChain(st, s)
}

export function parseFlowchart(p: PreparedSource): FlowchartAst {
  const ast: FlowchartAst = { type: 'flowchart', keyword: p.keyword, direction: 'TB', nodes: [], edges: [], subgraphs: [], classDefs: {}, linkStyles: [], meta: p.meta }
  const st: ParseState = { ast, nodes: new Map(), subgraphIds: new Set(), stack: [], pendingClass: [], styles: new Map() }

  // header: direction, optionally followed by statements after `;`
  let rest = p.rest
  const lines = [...p.lines]
  const semi = rest.indexOf(';')
  if (semi !== -1) {
    const tail = rest.slice(semi + 1).trim()
    rest = rest.slice(0, semi).trim()
    if (tail) lines.unshift({ no: p.header.no, text: tail, indent: 0, col: p.header.col + p.header.text.length - tail.length })
  }
  if (rest) ast.direction = parseDirection(rest, p.header.no, p.header.col + p.header.text.indexOf(rest, p.keyword.length))

  for (const line of lines) for (const s of splitStatements(line)) parseStatement(st, s)
  if (st.stack.length) {
    const open = st.stack[st.stack.length - 1]!
    fail(open.line, p.raw[open.line - 1]?.indexOf('subgraph') + 1 || 1, `The subgraph "${open.title}" is never closed. Add "end" after its nodes.`)
  }
  for (const pc of st.pendingClass) {
    for (const id of pc.ids) {
      const node = st.nodes.get(id)
      if (node) for (const n of pc.names) if (n && !node.classes.includes(n)) node.classes.push(n)
    }
  }
  for (const [id, decl] of st.styles) {
    const node = st.nodes.get(id)
    if (node) node.style = decl
  }
  // a node that only mirrors a subgraph id is the subgraph itself
  ast.nodes = ast.nodes.filter((n) => n.defined || !st.subgraphIds.has(n.id))
  return ast
}

