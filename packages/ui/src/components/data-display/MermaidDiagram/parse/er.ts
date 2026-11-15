/**
 * `erDiagram` parser.
 *
 * Supported: `direction TB|BT|LR|RL`, entity blocks (`NAME { type name PK, FK "comment" }`, also on one line and empty),
 * bare entities (`NAME`), quoted names (`"Order Line"`), display names (`p[Person]`, `p["Long name"]`), `NAME:::class`,
 * relationships `A ||--o{ B : label` with the symbols `||` (exactly one), `|o` / `o|` (zero or one), `}o` / `o{` (zero or
 * more), `}|` / `|{` (one or more) on either end, `--` (identifying, solid) or `..` (non-identifying, dashed), the word
 * forms `A only one to zero or more B` / `A one or more optionally to many(0) B` (`zero or one`, `one or zero`,
 * `zero or more`, `zero or many`, `many(0)`, `0+`, `one or more`, `one or many`, `many(1)`, `1+`, `only one`, `1`),
 * a quoted or bare label (a missing label is accepted), `classDef`, `class` and `style` (mapped to a tone, dashed and
 * thick outline, never to colours).
 * Not supported: a `title` line (use front matter `title:`), several statements on one line, attribute types with
 * generics (`list<int>`).
 */
import type { PreparedSource } from '../../_diagram/source'
import { parseDecl, type StyleDecl } from '../../_diagram/style'
import { fail, type DiagramMeta, type Direction, type SourceLine } from '../../_diagram/types'

export type ErCardinality = 'one' | 'zero-one' | 'zero-many' | 'one-many'
export type ErKey = 'PK' | 'FK' | 'UK'

export interface ErAttribute {
  type: string
  name: string
  keys: ErKey[]
  comment?: string
  line: number
}

export interface ErEntity {
  /** Name as written (the key in relationships). */
  id: string
  /** Display name from `p[Person]`. */
  alias?: string
  attributes: ErAttribute[]
  classes: string[]
  style: StyleDecl
  line: number
}

export interface ErRelationship {
  index: number
  /** Entity ids. */
  from: string
  to: string
  /** Cardinality at the `from` end and at the `to` end. */
  fromCard: ErCardinality
  toCard: ErCardinality
  /** `--` (true, solid line) or `..` (false, dashed line). */
  identifying: boolean
  label?: string
  line: number
}

export interface ErAst {
  type: 'er'
  direction: Direction
  entities: ErEntity[]
  relationships: ErRelationship[]
  classDefs: Record<string, StyleDecl>
  meta: DiagramMeta
}

const KEYS: readonly ErKey[] = ['PK', 'FK', 'UK']
const DIRS: Record<string, Direction> = { TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' }

const SYMBOL: Record<string, ErCardinality> = {
  '||': 'one', '|o': 'zero-one', 'o|': 'zero-one', '}o': 'zero-many', 'o{': 'zero-many', '}|': 'one-many', '|{': 'one-many',
}
const WORD: Record<string, ErCardinality> = {
  'zero or one': 'zero-one', 'one or zero': 'zero-one',
  'zero or more': 'zero-many', 'zero or many': 'zero-many', 'many(0)': 'zero-many', '0+': 'zero-many',
  'one or more': 'one-many', 'one or many': 'one-many', 'many(1)': 'one-many', '1+': 'one-many',
  'only one': 'one', '1': 'one',
}
const WORD_RE = /^(zero\s+or\s+(?:one|more|many)|one\s+or\s+(?:zero|more|many)|many\(0\)|many\(1\)|0\+|1\+|only\s+one|1)(?![\p{L}\p{N}_])/iu
const VALID_CARDS = 'Valid cardinalities: "||" exactly one, "|o" or "o|" zero or one, "}o" or "o{" zero or more, "}|" or "|{" one or more. Write the left end as ||, |o, }o or }| and the right end as ||, o|, o{ or |{.'
const SYMBOL_START = /[|}o{.-]/
const NAME_PART = /[\p{L}\p{N}_]/u
const ATTR_NAME_START = /[\p{L}\p{N}_*]/u
const ATTR_NAME_PART = /[\p{L}\p{N}_*.\-[\]()]/u
const TYPE_PART = /[\p{L}\p{N}_\-[\]]/u

/** Reads one code point at a time so names with astral characters are not split. */
class Cur {
  i = 0
  constructor(readonly s: string, readonly col: number, readonly no: number) {}
  get done(): boolean {
    return this.i >= this.s.length
  }
  /** The code point at the cursor, or '' at the end. */
  at(): string {
    return this.done ? '' : String.fromCodePoint(this.s.codePointAt(this.i)!)
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

interface Ref {
  id: string
  alias?: string
  cls?: string
}

interface OpenBlock {
  entity: ErEntity
  line: number
  col: number
}

interface State {
  ast: ErAst
  entities: Map<string, ErEntity>
  open?: OpenBlock
  pendingClass: { ids: string[]; names: string[] }[]
  styles: Map<string, StyleDecl>
}

/** Text between double quotes starting at the opening quote; moves past the closing quote. `\"` is a quote. */
function scanQuoted(c: Cur, what: string): string {
  const open = c.i
  c.i++
  let out = ''
  while (!c.done && c.s[c.i] !== '"') {
    if (c.s[c.i] === '\\' && c.s[c.i + 1] === '"') {
      out += '"'
      c.i += 2
    } else {
      out += c.s[c.i]
      c.i++
    }
  }
  if (c.done) c.fail(`This ${what} is never closed. Add the closing ".`, open)
  c.i++
  return out
}

function scanName(c: Cur): string {
  const start = c.i
  while (!c.done) {
    const ch = c.at()
    if (NAME_PART.test(ch)) c.i += ch.length
    else if (ch === '-' && c.i > start && NAME_PART.test(String.fromCodePoint(c.s.codePointAt(c.i + 1) ?? 32))) c.i++
    else break
  }
  return c.s.slice(start, c.i)
}

function readRef(c: Cur, what: string): Ref {
  const at = c.i
  let id: string
  if (c.at() === '"') {
    id = scanQuoted(c, 'entity name').trim()
    if (!id) c.fail('An entity name in quotes cannot be empty.', at)
  } else {
    id = scanName(c)
    if (!id) c.fail(`Expected ${what} here: letters, digits, "_" or "-", or a name in "quotes". Found "${c.at() || 'end of line'}".`)
  }
  const ref: Ref = { id }
  if (c.at() === '[') {
    const open = c.i
    c.i++
    c.ws()
    let text: string
    if (c.at() === '"') {
      text = scanQuoted(c, 'display name')
      c.ws()
      if (c.at() !== ']') c.fail('Expected "]" after the quoted display name.')
      c.i++
    } else {
      const end = c.s.indexOf(']', c.i)
      if (end === -1) c.fail('The "[" opened here is never closed. End the display name with "]", for example p[Person].', open)
      text = c.s.slice(c.i, end).trim()
      c.i = end + 1
    }
    if (!text.trim()) c.fail('The display name between "[" and "]" is empty. Write p[Person] or remove the brackets.', open)
    ref.alias = text.trim()
  }
  if (c.startsWith(':::')) {
    const at3 = c.i
    c.i += 3
    const cls = scanName(c)
    if (!cls) c.fail('Expected a class name after ":::".', at3)
    ref.cls = cls
  }
  return ref
}

function ensure(st: State, ref: Ref, line: number): ErEntity {
  let e = st.entities.get(ref.id)
  if (!e) {
    e = { id: ref.id, attributes: [], classes: [], style: {}, line }
    st.entities.set(ref.id, e)
    st.ast.entities.push(e)
  }
  if (ref.alias !== undefined) e.alias = ref.alias
  if (ref.cls && !e.classes.includes(ref.cls)) e.classes.push(ref.cls)
  return e
}

function wordCard(c: Cur): ErCardinality | undefined {
  const m = WORD_RE.exec(c.s.slice(c.i))
  if (!m) return undefined
  c.i += m[0].length
  return WORD[m[0].toLowerCase().replace(/\s+/g, ' ')]
}

function symbolCard(c: Cur, at: number, side: 'left' | 'right'): ErCardinality {
  const tok = c.s.slice(at, at + 2)
  const card = Object.hasOwn(SYMBOL, tok) ? SYMBOL[tok] : undefined
  if (card) return card
  return c.fail(tok ? `Unknown ${side} cardinality "${tok}". ${VALID_CARDS}` : `The ${side} cardinality is missing. ${VALID_CARDS}`, at)
}

function parseRelationship(st: State, c: Cur, left: Ref, no: number): void {
  let fromCard: ErCardinality
  let toCard: ErCardinality
  let identifying = true
  const startAt = c.i
  const word = wordCard(c)
  if (word) {
    fromCard = word
    c.ws()
    if (/^optionally\s+to(?![\p{L}\p{N}_])/iu.test(c.s.slice(c.i))) {
      identifying = false
      c.i += /^optionally\s+to/i.exec(c.s.slice(c.i))![0].length
    } else if (/^to(?![\p{L}\p{N}_])/iu.test(c.s.slice(c.i))) c.i += 2
    else c.fail('Expected "to" (identifying, solid line) or "optionally to" (non-identifying, dashed line) after the first cardinality.')
    c.ws()
    const right = wordCard(c)
    if (!right) c.fail(`Expected the second cardinality here: one of "only one", "zero or one", "zero or more", "one or more". Found "${c.s.slice(c.i).trim() || 'end of line'}".`)
    toCard = right!
  } else {
    if (!SYMBOL_START.test(c.at())) {
      const hint = left.id === 'title' ? ' A title goes in the front matter: "---", "title: Name", "---".' : ''
      c.fail(`Expected a relationship after "${left.id}", for example "${left.id} ||--o{ OTHER : label", or "{" to list its attributes.${hint}`)
    }
    fromCard = symbolCard(c, startAt, 'left')
    const line = c.s.slice(startAt + 2, startAt + 4)
    if (line !== '--' && line !== '..') c.fail(`Expected "--" (identifying, solid line) or ".." (non-identifying, dashed line) between the cardinalities, found "${line || 'end of line'}".`, startAt + 2)
    identifying = line === '--'
    toCard = symbolCard(c, startAt + 4, 'right')
    c.i = startAt + 6
  }
  c.ws()
  if (c.done || c.at() === ':') c.fail(`The second entity is missing: write its name after the cardinality, for example "${left.id} ||--o{ ORDER : places".`)
  const right = readRef(c, 'the name of the second entity')
  c.ws()
  let label: string | undefined
  if (!c.done) {
    if (c.at() !== ':') c.fail(`Expected ":" and a label after "${right.id}", or the end of the line. Found "${c.s.slice(c.i).trim()}".`)
    c.i++
    c.ws()
    if (c.at() === '"') {
      label = scanQuoted(c, 'label')
      c.ws()
      if (!c.done) c.fail('Nothing may follow the quoted label on its line.')
    } else label = c.s.slice(c.i).trim()
    if (label === '') label = undefined
  }
  ensure(st, left, no)
  ensure(st, right, no)
  st.ast.relationships.push({ index: st.ast.relationships.length, from: left.id, to: right.id, fromCard, toCard, identifying, label, line: no })
}

/** Index of the first `}` outside double quotes, or -1. */
function closeIndex(text: string): number {
  let quote = false
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') quote = !quote
    else if (!quote && text[i] === '}') return i
  }
  return -1
}

function parseAttribute(entity: ErEntity, text: string, no: number, col: number): void {
  const c = new Cur(text, col, no)
  if (!/[\p{L}_]/u.test(c.at())) {
    c.fail(`Expected an attribute type such as "string" or "varchar(100)", found "${c.at()}". An attribute is written: type name PK "comment".`)
  }
  while (!c.done) {
    const ch = c.at()
    if (TYPE_PART.test(ch)) c.i += ch.length
    else if (ch === '(') {
      const close = c.s.indexOf(')', c.i)
      if (close === -1) c.fail('The "(" in this type is never closed. Write for example "varchar(100)" or "decimal(10,2)".')
      c.i = close + 1
    } else break
  }
  const type = c.s.slice(0, c.i)
  c.ws()
  if (c.done) c.fail(`The attribute type "${type}" needs a name after it, for example "${type} name".`)
  if (!ATTR_NAME_START.test(c.at())) c.fail(`Expected an attribute name after the type "${type}", found "${c.at()}".`)
  const nameStart = c.i
  while (!c.done && ATTR_NAME_PART.test(c.at())) c.i += c.at().length
  const name = c.s.slice(nameStart, c.i)
  const keys: ErKey[] = []
  let afterComma = false
  let comment: string | undefined
  for (;;) {
    c.ws()
    if (c.done || c.at() === '"') break
    if (c.at() === ',' && keys.length > 0 && !afterComma) {
      c.i++
      afterComma = true
      continue
    }
    const at = c.i
    let end = c.i
    while (end < c.s.length && /[\p{L}\p{N}_]/u.test(String.fromCodePoint(c.s.codePointAt(end)!))) end += String.fromCodePoint(c.s.codePointAt(end)!).length
    if (end === at) c.fail(`Unexpected "${c.at()}" in the attribute "${name}". After the name write PK, FK or UK (separate several with commas), then an optional "comment" in quotes.`)
    const word = c.s.slice(at, end)
    const key = word.toUpperCase() as ErKey
    if (!KEYS.includes(key)) c.fail(`Unknown key "${word}" on the attribute "${name}". Use PK, FK or UK (several separated by commas), then an optional "comment" in quotes.`, at)
    if (!keys.includes(key)) keys.push(key)
    afterComma = false
    c.i = end
  }
  if (afterComma) c.fail('Expected PK, FK or UK after ",".')
  if (c.at() === '"') {
    comment = scanQuoted(c, 'comment') || undefined
    c.ws()
    if (!c.done) c.fail('Nothing may follow the comment on an attribute line.')
  }
  entity.attributes.push({ type, name, keys, comment, line: no })
}

const NEW_STATEMENT = /(?:\|\||\|o|o\||\}o|o\{|\}\||\|\{)(?:--|\.\.)|\{/

function feed(st: State, text: string, no: number, col: number): void {
  const open = st.open!
  const close = closeIndex(text)
  const inner = close === -1 ? text : text.slice(0, close)
  const body = inner.trim()
  if (body) {
    if (NEW_STATEMENT.test(inner.replace(/"[^"]*"/g, '""'))) {
      fail(open.line, open.col, `The block of "${open.entity.id}" opened here is never closed: line ${no} starts a new statement. Add "}" after the attributes.`)
    }
    parseAttribute(open.entity, body, no, col + inner.length - inner.trimStart().length)
  }
  if (close !== -1) {
    const tail = text.slice(close + 1)
    if (tail.trim()) fail(no, col + close + 1 + tail.length - tail.trimStart().length, 'Nothing may follow "}" on its line. Start the next statement on a new line.')
    st.open = undefined
  }
}

function parseDirectionValue(v: string, no: number, col: number): Direction {
  const dir = Object.hasOwn(DIRS, v) ? DIRS[v] : undefined
  if (!dir) fail(no, col, `Unknown direction "${v}". Use TB, BT, LR or RL.`)
  return dir!
}

function parseLine(st: State, line: SourceLine): void {
  const t = line.text
  const word = /^[A-Za-z]+/.exec(t)?.[0]

  if (t.startsWith('}')) fail(line.no, line.col, 'This "}" has no matching "{". Remove it, or open the entity block with "NAME {" first.')
  if (word === 'direction' && /^direction\s+\S/.test(t)) {
    const value = t.slice(9).trim()
    st.ast.direction = parseDirectionValue(value, line.no, line.col + t.indexOf(value, 9))
    return
  }
  if (word === 'classDef' && /^classDef\s/.test(t)) {
    const m = /^classDef\s+(\S+)\s*(.*)$/.exec(t)!
    const decl = parseDecl(m[2]!)
    for (const name of m[1]!.split(',').filter(Boolean)) st.ast.classDefs[name] = { ...st.ast.classDefs[name], ...decl }
    return
  }
  if (word === 'class' && /^class\s/.test(t)) {
    const m = /^class\s+(\S+)\s+(\S+)$/.exec(t)
    if (!m) return fail(line.no, line.col, 'class needs entity names and a class name: "class A,B name".')
    st.pendingClass.push({ ids: m[1]!.split(',').filter(Boolean), names: m[2]!.split(',').filter(Boolean) })
    return
  }
  if (word === 'style' && /^style\s/.test(t)) {
    const m = /^style\s+(\S+)\s+(\S.*)$/.exec(t)
    if (!m) return fail(line.no, line.col, 'style needs an entity name and declarations: "style A stroke-width:2px".')
    for (const id of m[1]!.split(',').filter(Boolean)) st.styles.set(id, { ...(st.styles.get(id) ?? {}), ...parseDecl(m[2]!) })
    return
  }

  const c = new Cur(t, line.col, line.no)
  if (c.at() === '{') c.fail('A "{" needs the entity name in front of it, for example "CUSTOMER {".')
  const ref = readRef(c, 'an entity name')
  c.ws()
  if (c.done) {
    ensure(st, ref, line.no)
    return
  }
  if (c.at() === '{') {
    const entity = ensure(st, ref, line.no)
    const braceAt = c.i
    c.i++
    st.open = { entity, line: line.no, col: line.col + braceAt }
    const rest = t.slice(c.i)
    if (rest.trim()) feed(st, rest, line.no, line.col + c.i)
    return
  }
  parseRelationship(st, c, ref, line.no)
}

export function parseEr(p: PreparedSource): ErAst {
  const ast: ErAst = { type: 'er', direction: 'TB', entities: [], relationships: [], classDefs: {}, meta: p.meta }
  const st: State = { ast, entities: new Map(), pendingClass: [], styles: new Map() }
  const lines = [...p.lines]
  if (p.rest) lines.unshift({ no: p.header.no, text: p.rest, indent: 0, col: p.header.col + p.header.text.indexOf(p.rest, p.keyword.length) })

  for (const line of lines) {
    if (st.open) feed(st, line.text, line.no, line.col)
    else parseLine(st, line)
  }
  if (st.open) fail(st.open.line, st.open.col, `The block of "${st.open.entity.id}" opened here is never closed. Add a line with "}" after its attributes.`)

  for (const pc of st.pendingClass) {
    for (const id of pc.ids) {
      const e = st.entities.get(id)
      if (e) for (const n of pc.names) if (!e.classes.includes(n)) e.classes.push(n)
    }
  }
  for (const [id, decl] of st.styles) {
    const e = st.entities.get(id)
    if (e) e.style = decl
  }
  return ast
}
