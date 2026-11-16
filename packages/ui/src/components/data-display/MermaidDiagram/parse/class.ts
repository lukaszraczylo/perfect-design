/**
 * `classDiagram` / `classDiagram-v2` parser.
 *
 * Supported: `direction`, `class Name`, `class Name { members }`, generics (`Name~T~`, shown as `Name<T>`), a display
 * label (`class Name["Label"]`), `Name : member`, annotations (`<<interface>>` inside the body, after `Name :` or as
 * `<<interface>> Name`), attributes and methods with visibility (`+ - # ~`), the `$` (static) and `*` (abstract)
 * suffixes, relations (`<|--` `--|>` `*--` `--*` `o--` `--o` `-->` `<--` `--` `..>` `<..` `..|>` `<|..` `..`) with
 * cardinalities (`A "1" --> "*" B`) and a label after `:`, `namespace X { ... }`, `note "text"`, `note for Name "text"`,
 * `classDef`, `cssClass`, `:::name`. `click`, `link`, `callback` and `style` lines are accepted and ignored.
 * Not supported: lollipop interfaces (`()--`), `<-->`, a class inside a class body, several statements per line.
 */
import type { PreparedSource } from '../../_diagram/source'
import { parseDecl, type StyleDecl } from '../../_diagram/style'
import { decodeEntities } from '../../_diagram/text'
import { fail, type DiagramMeta, type Direction, type Marker, type SourceLine } from '../../_diagram/types'

export type ClassVisibility = '+' | '-' | '#' | '~'
export type ClassEnd = Extract<Marker, 'triangle' | 'open' | 'diamond' | 'diamond-filled'>

export interface ClassMember {
  /** Text as shown: visibility glyph kept, `~T~` written as `<T>`, the abstract `*` removed (the `$` of static members stays). */
  text: string
  kind: 'attribute' | 'method'
  visibility?: ClassVisibility
  abstract: boolean
  static: boolean
}

export interface ClassDef {
  id: string
  /** Text of `class Name["Label"]`, when given. */
  label?: string
  /** Generic parameters without the angle brackets (`T`, `K, V`). */
  generic?: string
  /** Annotation names without the angle brackets (`interface`). */
  annotations: string[]
  attributes: ClassMember[]
  methods: ClassMember[]
  namespace?: string
  classes: string[]
  line: number
}

export interface ClassRelation {
  index: number
  from: string
  to: string
  /** Marker at the `from` end. */
  fromEnd?: ClassEnd
  /** Marker at the `to` end. */
  toEnd?: ClassEnd
  dashed: boolean
  fromCard?: string
  toCard?: string
  label?: string
  line: number
}

export interface ClassNote {
  index: number
  /** Class the note belongs to; absent for a free-standing note. */
  target?: string
  text: string
  line: number
}

export interface ClassNamespace {
  id: string
  line: number
}

export interface ClassAst {
  type: 'class'
  keyword: string
  direction: Direction
  classes: ClassDef[]
  relations: ClassRelation[]
  notes: ClassNote[]
  namespaces: ClassNamespace[]
  classDefs: Record<string, StyleDecl>
  meta: DiagramMeta
}

export const RELATION_HELP =
  'Valid relations: "<|--" and "--|>" (inheritance), "*--" and "--*" (composition), "o--" and "--o" (aggregation), "-->" and "<--" (association), "--" (link), "..>" and "<.." (dependency), "..|>" and "<|.." (realisation), ".." (dashed link).'

const DIRECTION_WORDS: Record<string, Direction> = { TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' }
const LEFT_END: Record<string, ClassEnd> = { '<|': 'triangle', '<': 'open', '*': 'diamond-filled', o: 'diamond' }
const RIGHT_END: Record<string, ClassEnd> = { '|>': 'triangle', '>': 'open', '*': 'diamond-filled', o: 'diamond' }
const OP = /^(<\||<|\*|o)?(--|\.\.)(\|>|>|\*|o)?/

const snip = (s: string): string => (s.length > 40 ? `${s.slice(0, 40)}...` : s)
const isSpace = (ch: string | undefined): boolean => ch !== undefined && /\s/.test(ch)
const isWord = (ch: string | undefined): boolean => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch)

/** `List~List~int~~` becomes `List<List<int>>`: a `~` followed by text opens, any other `~` closes. */
export function genericsToAngle(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!
    if (ch !== '~') out += ch
    else {
      const next = s[i + 1]
      out += next !== undefined && next !== '~' && !isSpace(next) ? '<' : '>'
    }
  }
  return out
}

class Cur {
  i = 0
  constructor(readonly t: string, readonly col: number, readonly no: number) {}
  get done(): boolean {
    return this.i >= this.t.length
  }
  ws(): void {
    while (this.i < this.t.length && isSpace(this.t[this.i])) this.i++
  }
  at(s: string): boolean {
    return this.t.startsWith(s, this.i)
  }
  rest(): string {
    return this.t.slice(this.i).trim()
  }
  fail(message: string, i = this.i): never {
    return fail(this.no, this.col + i, message)
  }
}

interface Ref {
  id: string
  generic?: string
}

/** A class name: backtick quoted, or letters, digits and `_` with single `-` or `.` between them; then `~generic~`. */
function readRef(c: Cur, what: string): Ref {
  const start = c.i
  let id: string
  if (c.at('`')) {
    const end = c.t.indexOf('`', c.i + 1)
    if (end < 0) c.fail('This backtick name is never closed. End it with a second backtick.', start)
    id = c.t.slice(c.i + 1, end)
    c.i = end + 1
  } else {
    while (!c.done) {
      const ch = c.t[c.i]!
      if (isWord(ch) || ((ch === '-' || ch === '.') && c.i > start && isWord(c.t[c.i + 1]))) c.i++
      else break
    }
    id = c.t.slice(start, c.i)
  }
  if (!id.trim()) c.fail(`Expected ${what}, for example "Animal" or "Animal~T~".`, start)
  let generic: string | undefined
  if (c.at('~')) {
    // spaces are allowed inside the tildes (`Map~K, V~`); the generic ends where its tildes balance
    const at = c.i
    let depth = 0
    let closed = false
    while (!c.done && !closed && c.t[c.i] !== '{' && c.t[c.i] !== '"') {
      if (c.t[c.i] === '~') {
        const next = c.t[c.i + 1]
        if (next !== undefined && next !== '~' && !isSpace(next)) depth++
        else if (--depth <= 0) closed = true
      }
      c.i++
    }
    if (!closed || depth < 0) c.fail(`The generic type "${snip(c.t.slice(at, c.i).trim())}" is never closed. Write it as ${id.trim()}~T~.`, at)
    generic = decodeEntities(genericsToAngle(c.t.slice(at, c.i)).slice(1, -1))
  }
  return { id: id.trim(), generic }
}

function parseMember(raw: string): ClassMember {
  let s = raw.trim()
  const glyph = '+-#~'.includes(s[0]!) ? (s[0] as ClassVisibility) : undefined
  let abstract = false
  const mid = /\)\s*\*(?=\s|$)/.exec(s)
  if (mid) {
    abstract = true
    s = s.slice(0, mid.index + 1) + s.slice(mid.index + mid[0].length)
  } else if (s.endsWith('*')) {
    abstract = true
    s = s.slice(0, -1).trimEnd()
  }
  const isStatic = /\)\s*\$/.test(s) || s.endsWith('$')
  const body = glyph ? s.slice(1) : s
  const text = (glyph ?? '') + genericsToAngle(decodeEntities(body))
  return { text, kind: body.includes('(') ? 'method' : 'attribute', visibility: glyph, abstract, static: isStatic }
}

interface Frame {
  kind: 'class' | 'namespace'
  id: string
  line: number
  col: number
}

export function parseClass(p: PreparedSource): ClassAst {
  const ast: ClassAst = { type: 'class', keyword: p.keyword, direction: 'TB', classes: [], relations: [], notes: [], namespaces: [], classDefs: {}, meta: p.meta }
  const byId = new Map<string, ClassDef>()
  const stack: Frame[] = []

  if (p.rest) fail(p.header.no, p.header.col + p.header.text.indexOf(p.rest, p.keyword.length), `Put "${snip(p.rest)}" on its own line below ${p.keyword}.`)

  const namespace = (): string | undefined => stack.find((f) => f.kind === 'namespace')?.id

  const touch = (ref: Ref, no: number): ClassDef => {
    let d = byId.get(ref.id)
    if (!d) {
      d = { id: ref.id, annotations: [], attributes: [], methods: [], namespace: namespace(), classes: [], line: no }
      byId.set(ref.id, d)
      ast.classes.push(d)
    }
    if (ref.generic) d.generic = ref.generic
    return d
  }
  const addClass = (d: ClassDef, name: string): void => {
    if (!d.classes.includes(name)) d.classes.push(name)
  }
  const addAnnotation = (d: ClassDef, name: string): void => {
    if (name && !d.annotations.includes(name)) d.annotations.push(name)
  }
  const addMember = (d: ClassDef, raw: string): void => {
    // One unbounded run per pattern and trim afterwards: `\s*([^<>]*?)\s*` backtracks cubically on long whitespace.
    const ann = /^<<([^<>]*)>>$/.exec(raw.trim())
    if (ann) return addAnnotation(d, decodeEntities(ann[1]!.trim()))
    const mem = parseMember(raw)
    ;(mem.kind === 'method' ? d.methods : d.attributes).push(mem)
  }

  const cssName = (c: Cur, d: ClassDef): void => {
    if (!c.at(':::')) return
    c.i += 3
    const start = c.i
    while (!c.done && !isSpace(c.t[c.i]) && c.t[c.i] !== '{') c.i++
    if (c.i === start) c.fail('Expected a class name after ":::".', start)
    addClass(d, c.t.slice(start, c.i))
  }

  const classStatement = (c: Cur, line: SourceLine): void => {
    c.i += 'class'.length
    c.ws()
    const ref = readRef(c, 'a class name after "class"')
    const d = touch(ref, c.no)
    if (c.at('[')) {
      const open = c.i
      const end = c.t.indexOf(']', c.i)
      if (end < 0) c.fail('This label is never closed. Write class Name["Label"].', open)
      const label = c.t.slice(c.i + 1, end).trim().replace(/^"(.*)"$/, '$1')
      if (label) d.label = label
      c.i = end + 1
    }
    cssName(c, d)
    c.ws()
    if (c.at('{')) {
      c.i++
      stack.push({ kind: 'class', id: d.id, line: line.no, col: line.col })
      c.ws()
      if (c.at('}')) {
        c.i++
        stack.pop()
        c.ws()
      }
    }
    if (!c.done) c.fail(`Unexpected "${snip(c.rest())}". A class declaration ends after its name or "{"; put members on their own lines.`)
  }

  const cardinality = (c: Cur): string | undefined => {
    c.ws()
    if (!c.at('"')) return undefined
    const end = c.t.indexOf('"', c.i + 1)
    if (end < 0) c.fail('This cardinality is never closed. End it with a closing quote, for example "1" or "0..*".')
    const text = c.t.slice(c.i + 1, end).trim()
    c.i = end + 1
    return text || undefined
  }

  const relationOrMember = (c: Cur): void => {
    const srcRef = readRef(c, 'a class name')
    const src = touch(srcRef, c.no)
    cssName(c, src)
    c.ws()
    if (c.done) return
    if (c.at(':') && !c.at(':::')) {
      c.i++
      const text = c.rest()
      if (!text) c.fail(`"${snip(src.id)} :" needs a member or annotation after the colon, for example "${snip(src.id)} : +name String".`, c.i - 1)
      addMember(src, text)
      return
    }
    const fromCard = cardinality(c)
    c.ws()
    const m = OP.exec(c.t.slice(c.i))
    if (!m) {
      const token = /^[^\s"]+/.exec(c.rest())?.[0]
      c.fail(token ? `Unknown relation "${snip(token)}" after "${snip(src.id)}". ${RELATION_HELP}` : `Expected a relation after "${snip(src.id)}". ${RELATION_HELP}`)
    }
    const opAt = c.i
    c.i += m![0].length
    const next = c.t[c.i]
    if (next !== undefined && !isSpace(next) && !isWord(next) && next !== '"' && next !== '`') {
      c.fail(`Unknown relation "${snip(/^[^\s"]+/.exec(c.t.slice(opAt))![0])}" after "${snip(src.id)}". ${RELATION_HELP}`, opAt)
    }
    const toCard = cardinality(c)
    c.ws()
    if (c.done || c.at(':')) c.fail(`This relation has no second class. Write the class after the relation, for example "${snip(src.id)} ${m![0]} Other".`)
    const dstRef = readRef(c, 'a class name after the relation')
    const dst = touch(dstRef, c.no)
    cssName(c, dst)
    c.ws()
    let label: string | undefined
    if (c.at(':')) {
      c.i++
      label = c.rest().replace(/^"(.*)"$/, '$1').trim() || undefined
      c.i = c.t.length
    }
    if (!c.done) c.fail(`Unexpected "${snip(c.rest())}". Add a label with ":", for example "${snip(src.id)} ${m![0]} ${snip(dst.id)} : label".`)
    ast.relations.push({
      index: ast.relations.length,
      from: src.id,
      to: dst.id,
      fromEnd: m![1] ? LEFT_END[m![1]] : undefined,
      toEnd: m![3] ? RIGHT_END[m![3]] : undefined,
      dashed: m![2] === '..',
      fromCard,
      toCard,
      label,
      line: c.no,
    })
  }

  const noteStatement = (c: Cur): void => {
    c.i += 'note'.length
    c.ws()
    let target: string | undefined
    if (/^for(?=\s)/.test(c.t.slice(c.i))) {
      c.i += 3
      c.ws()
      target = touch(readRef(c, 'the class the note belongs to'), c.no).id
      c.ws()
    }
    if (!c.at('"')) c.fail('Note text must be quoted: note "text" or note for Name "text".')
    const end = c.t.lastIndexOf('"')
    if (end <= c.i) c.fail('This note text is never closed. End it with a closing quote.')
    const tail = c.t.slice(end + 1)
    if (tail.trim()) c.fail(`Unexpected "${snip(tail.trim())}" after the note text.`, end + 1 + tail.length - tail.trimStart().length)
    const text = c.t.slice(c.i + 1, end)
    if (!text.trim()) c.fail('This note has no text. Write the text between the quotes.', c.i)
    ast.notes.push({ index: ast.notes.length, target, text, line: c.no })
  }

  const statement = (line: SourceLine): void => {
    const t = line.text
    const c = new Cur(t, line.col, line.no)
    const top = stack[stack.length - 1]

    if (t === '}') {
      if (!top) c.fail('Unexpected "}": nothing is open. Remove it, or open a block with "class Name {" or "namespace Name {".')
      stack.pop()
      return
    }
    if (top?.kind === 'class') {
      addMember(byId.get(top.id)!, t)
      return
    }

    const ann = /^<<([^<>]*)>>\s+(\S.*)$/.exec(t)
    if (ann) {
      const at = t.indexOf(ann[2]!, t.indexOf('>>'))
      c.i = at
      addAnnotation(touch(readRef(c, 'a class name after the annotation'), line.no), decodeEntities(ann[1]!.trim()))
      return
    }

    const kw = /^(classDef|cssClass|class|namespace|note|direction|click|link|callback|style)(?=\s|$)/.exec(t)
    let word = kw?.[1]
    if (word && kw![0].length < t.length) {
      const after = t.slice(kw![0].length).trimStart()
      const isNote = word === 'note' && (after.startsWith('"') || /^for\s/.test(after))
      if (!isNote && (after.startsWith(':') || OP.test(after))) word = undefined
    }
    switch (word) {
      case 'class':
        return classStatement(c, line)
      case 'note':
        return noteStatement(c)
      case 'direction': {
        c.i += 'direction'.length
        c.ws()
        const at = c.i
        const value = c.rest()
        const dir = DIRECTION_WORDS[value.toUpperCase()]
        if (!dir) c.fail(value ? `Unknown direction "${snip(value)}". Use TB, BT, LR or RL.` : 'direction needs a value: TB, BT, LR or RL.', at)
        ast.direction = dir!
        return
      }
      case 'namespace': {
        c.i += 'namespace'.length
        c.ws()
        const id = readRef(c, 'a namespace name after "namespace"').id
        c.ws()
        if (!c.at('{')) c.fail(`A namespace needs a body: namespace ${snip(id)} {`)
        c.i++
        c.ws()
        if (!c.done) c.fail('Put the classes of a namespace on their own lines after "{".')
        if (stack.some((f) => f.kind === 'namespace')) c.fail('Namespaces cannot be nested. Close the open namespace with "}" first.', 0)
        if (!ast.namespaces.some((n) => n.id === id)) ast.namespaces.push({ id, line: line.no })
        stack.push({ kind: 'namespace', id, line: line.no, col: line.col })
        return
      }
      case 'classDef': {
        const m = /^classDef\s+(\S+)\s*(.*)$/.exec(t)
        if (!m) return c.fail('classDef needs a name and styles: "classDef name stroke-width:2px".', 0)
        const decl = parseDecl(m[2]!)
        for (const name of m[1]!.split(',')) if (name) ast.classDefs[name] = { ...ast.classDefs[name], ...decl }
        return
      }
      case 'cssClass': {
        const m = /^cssClass\s+"?([^"]+?)"?\s+(\S+)$/.exec(t)
        if (!m) return c.fail('cssClass needs class names and a style class: cssClass "Animal,Dog" name.', 0)
        for (const id of m[1]!.split(',')) if (id.trim()) addClass(touch({ id: id.trim() }, line.no), m[2]!)
        return
      }
      case 'click':
      case 'link':
      case 'callback':
      case 'style':
        return
    }
    relationOrMember(c)
  }

  for (const line of p.lines) statement(line)

  const open = stack[stack.length - 1]
  if (open) fail(open.line, open.col, `The ${open.kind === 'class' ? 'class' : 'namespace'} "${open.id}" opened here is never closed. Add a "}" line after its ${open.kind === 'class' ? 'members' : 'classes'}.`)
  return ast
}
