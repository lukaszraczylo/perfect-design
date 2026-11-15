/**
 * `stateDiagram` / `stateDiagram-v2` parser.
 *
 * Supported: `direction` (TB TD BT LR RL, also inside a composite), states (`S`, `state "Long text" as s`,
 * `s : description line`, several description lines), transitions (`A --> B`, `A --> B : label`), `[*]` start and end
 * (scoped per composite state), composite states (`state P { ... }`, nested to a depth of 40, own `[*]`), the
 * concurrency divider `--` (each region gets its own `[*]`; the renderer lays the regions side by side with a dashed divider),
 * `state X <<choice>>`,
 * `<<fork>>`, `<<join>>`, notes (`note left of S : text`, `note right of S : text` and the multi-line form closed by
 * `end note`), `classDef`, `class` and `A:::name`. `hide empty description` and `scale ...` are accepted and ignored.
 * Not supported: `note over`, `style`, `click`, several statements on one line, `<<[[choice]]>>` style types.
 */
import type { PreparedSource } from '../../_diagram/source'
import { parseDecl, type StyleDecl } from '../../_diagram/style'
import { fail, type DiagramMeta, type Direction, type SourceLine } from '../../_diagram/types'

export type StateKind = 'state' | 'composite' | 'choice' | 'fork' | 'join' | 'start' | 'end'

export interface StateDef {
  /** Unique id. Start and end markers are `start:<scope>` and `end:<scope>`; user ids never contain a colon. */
  id: string
  /** Text as written (`state "Long text" as id` sets it); the id when the state was never given text. */
  title: string
  /** Lines added with `id : description`. */
  descriptions: string[]
  kind: StateKind
  /** Id of the composite state that contains this state. */
  parent?: string
  /** Layout direction of a composite state (`direction LR` inside it). */
  direction?: Direction
  /** Concurrent region (1-based, counted by the `--` dividers) of the composite state that contains this state. */
  region?: number
  /** Number of concurrent regions of a composite state; set only when it has a `--` divider (so it is at least 2). */
  regions?: number
  classes: string[]
  line: number
}

export interface StateTransition {
  index: number
  from: string
  to: string
  label?: string
  line: number
}

export interface StateNote {
  index: number
  side: 'left' | 'right'
  /** Id of the state the note belongs to. */
  target: string
  /** Text lines as written. */
  lines: string[]
  line: number
}

export interface StateAst {
  type: 'state'
  keyword: string
  direction: Direction
  states: StateDef[]
  transitions: StateTransition[]
  notes: StateNote[]
  classDefs: Record<string, StyleDecl>
  meta: DiagramMeta
}

const MAX_DEPTH = 40
const DIRECTION_WORDS: Record<string, Direction> = { TB: 'TB', TD: 'TB', BT: 'BT', LR: 'LR', RL: 'RL' }
const SPECIAL_KINDS: Record<string, StateKind> = { choice: 'choice', fork: 'fork', join: 'join' }

const snip = (s: string): string => (s.length > 40 ? `${s.slice(0, 40)}...` : s)
const isSpace = (ch: string | undefined): boolean => ch !== undefined && /\s/.test(ch)

/** Cursor over one statement; remembers where it started so every error can point into the original source. */
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

function readId(c: Cur): string {
  const start = c.i
  while (!c.done) {
    const ch = c.t[c.i]!
    if (isSpace(ch) || ch === ':' || ch === '{' || ch === '}' || ch === '"' || ch === '|' || c.at('-->') || c.at('<<')) break
    c.i++
  }
  return c.t.slice(start, c.i)
}

interface Frame {
  id: string
  region: number
  line: number
  col: number
}

export function parseState(p: PreparedSource): StateAst {
  const ast: StateAst = { type: 'state', keyword: p.keyword, direction: 'TB', states: [], transitions: [], notes: [], classDefs: {}, meta: p.meta }
  const byId = new Map<string, StateDef>()
  const stack: Frame[] = []

  if (p.rest) fail(p.header.no, p.header.col + p.header.text.indexOf(p.rest, p.keyword.length), `Put "${snip(p.rest)}" on its own line below ${p.keyword}.`)

  const scopeKey = (): string => {
    const top = stack[stack.length - 1]
    return top ? (top.region > 1 ? `${top.id}|${top.region}` : top.id) : ''
  }

  const touch = (id: string, no: number): StateDef => {
    let s = byId.get(id)
    if (!s) {
      const top = stack[stack.length - 1]
      s = { id, title: id, descriptions: [], kind: 'state', parent: top?.id, region: top?.region, classes: [], line: no }
      byId.set(id, s)
      ast.states.push(s)
    }
    return s
  }

  const pseudo = (kind: 'start' | 'end', no: number): string => {
    const id = `${kind}:${scopeKey()}`
    if (!byId.has(id)) {
      const s = touch(id, no)
      s.kind = kind
      s.title = ''
    }
    return id
  }

  const addClass = (s: StateDef, name: string): void => {
    if (!s.classes.includes(name)) s.classes.push(name)
  }

  /** `[*]` or an id, then an optional `:::class`. Returns the state id. */
  const endpoint = (c: Cur, role: 'source' | 'target'): string => {
    if (c.at('[*]')) {
      c.i += 3
      return pseudo(role === 'source' ? 'start' : 'end', c.no)
    }
    const at = c.i
    const id = readId(c)
    if (!id) {
      c.fail(
        role === 'source'
          ? 'Expected a state name before the arrow, for example "A --> B" or "[*] --> A".'
          : 'This transition has no target state. Write the state after the arrow, for example "A --> B" or "A --> [*]".',
        at,
      )
    }
    const s = touch(id, c.no)
    if (c.at(':::')) {
      c.i += 3
      const name = readId(c)
      if (!name) c.fail('Expected a class name after ":::".')
      addClass(s, name)
    }
    return id
  }

  const unexpected = (c: Cur, hint: string): never => c.fail(`Unexpected "${snip(c.rest())}". ${hint}`)

  const openComposite = (c: Cur, s: StateDef, line: SourceLine): void => {
    if (s.kind !== 'state' && s.kind !== 'composite') c.fail(`"${s.id}" is a <<${s.kind}>> state and cannot contain other states.`)
    if (stack.some((f) => f.id === s.id)) c.fail(`The composite state "${s.id}" is already open here, a state cannot contain itself.`)
    if (stack.length >= MAX_DEPTH) c.fail(`Composite states are nested more than ${MAX_DEPTH} levels deep. Flatten the diagram.`)
    s.kind = 'composite'
    stack.push({ id: s.id, region: 1, line: line.no, col: line.col })
  }

  const closeComposite = (c: Cur): void => {
    if (!stack.length) c.fail('Unexpected "}": no composite state is open. Remove it, or open one with "state Name {".')
    const frame = stack.pop()!
    // a composite that is opened twice keeps the larger region count
    if (frame.region > 1) {
      const def = byId.get(frame.id)!
      def.regions = Math.max(def.regions ?? 0, frame.region)
    }
  }

  /** Text after a state name: `:::class`, `<<type>>`, `{` and nothing else. */
  const trailer = (c: Cur, s: StateDef, line: SourceLine): void => {
    c.ws()
    if (c.at(':::')) {
      c.i += 3
      const name = readId(c)
      if (!name) c.fail('Expected a class name after ":::".')
      addClass(s, name)
      c.ws()
    }
    if (c.at('<<')) {
      const open = c.i
      const end = c.t.indexOf('>>', c.i + 2)
      if (end < 0) c.fail('This "<<" is never closed. Write <<choice>>, <<fork>> or <<join>>.', open)
      const word = c.t.slice(c.i + 2, end).trim()
      const kind = SPECIAL_KINDS[word.toLowerCase()]
      if (!kind) c.fail(`Unknown state type "<<${snip(word)}>>". Use <<choice>>, <<fork>> or <<join>>.`, open)
      if (s.kind === 'composite') c.fail(`"${s.id}" is a composite state and cannot be a <<${word.toLowerCase()}>>.`, open)
      s.kind = kind!
      c.i = end + 2
      c.ws()
    }
    if (c.at('{')) {
      c.i++
      openComposite(c, s, line)
      c.ws()
      if (c.at('}')) {
        c.i++
        stack.pop()
        c.ws()
      }
    }
    if (!c.done) unexpected(c, 'A state declaration ends after its name, <<type>> or "{".')
  }

  const stateStatement = (c: Cur, line: SourceLine): void => {
    c.i += 'state'.length
    c.ws()
    if (c.done) c.fail('"state" needs a name. Write "state Name", "state Name {" or state "Long text" as Name.', c.i)
    let title: string | undefined
    if (c.at('"')) {
      const open = c.i
      const end = c.t.indexOf('"', c.i + 1)
      if (end < 0) c.fail('This quoted state name is never closed. End it with a closing quote.', open)
      title = c.t.slice(c.i + 1, end)
      c.i = end + 1
      c.ws()
      if (!/^as(?=\s|$)/.test(c.t.slice(c.i))) c.fail(`A quoted state name needs an id: state "${snip(title)}" as Name.`)
      c.i += 2
      c.ws()
    }
    const at = c.i
    const id = readId(c)
    if (!id) c.fail(title === undefined ? '"state" needs a name. Write "state Name", "state Name {" or state "Long text" as Name.' : `Expected an id after "as", for example state "${snip(title)}" as Name.`, at)
    const s = touch(id, c.no)
    if (title !== undefined && title.trim()) s.title = title.trim()
    trailer(c, s, line)
  }

  const noteStatement = (c: Cur, line: SourceLine, rest: SourceLine[], next: number): number => {
    const usage = 'Write "note left of State : text" or "note right of State : text".'
    c.i += 'note'.length
    c.ws()
    const side = /^(left|right)(?=\s)/i.exec(c.t.slice(c.i))
    if (!side) return c.fail(`A note needs a side and a state. ${usage}`)
    c.i += side[0].length
    c.ws()
    if (!/^of(?=\s)/i.test(c.t.slice(c.i))) c.fail(`Expected "of" after "${side[0]}". ${usage}`)
    c.i += 2
    c.ws()
    const at = c.i
    const target = readId(c)
    if (!target) c.fail(`The note names no state. ${usage}`, at)
    const s = touch(target, c.no)
    c.ws()
    const note: StateNote = { index: ast.notes.length, side: side[0].toLowerCase() as 'left' | 'right', target: s.id, lines: [], line: line.no }
    if (c.at(':')) {
      c.i++
      const text = c.rest()
      if (!text) c.fail('This note has no text after ":". Write the note text there.')
      note.lines.push(text)
      ast.notes.push(note)
      return next
    }
    if (!c.done) unexpected(c, `${usage} For several lines, end the line after the state and close the note with "end note".`)
    let j = next
    for (; j < rest.length; j++) {
      if (/^end\s+note$/i.test(rest[j]!.text)) break
      note.lines.push(rest[j]!.text)
    }
    if (j >= rest.length) c.fail('This note is never closed. Add an "end note" line after the note text.', 0)
    if (!note.lines.length) c.fail('This note has no text. Write the text between the "note" line and "end note".', 0)
    ast.notes.push(note)
    return j + 1
  }

  const statement = (line: SourceLine, lines: SourceLine[], next: number): number => {
    const t = line.text
    const c = new Cur(t, line.col, line.no)
    if (t === '}') {
      closeComposite(c)
      return next
    }
    if (/^-{3,}$/.test(t)) c.fail(`"${t}" is not a divider. Concurrent regions are separated by exactly "--".`)
    if (t === '--') {
      const top = stack[stack.length - 1]
      if (!top) c.fail('The "--" divider separates concurrent regions inside a composite state. Remove it or move it inside "state Name { ... }".')
      top!.region++
      return next
    }
    if (/^hide\s+empty\s+description$/i.test(t) || /^scale\s+\d+\s+(?:width|height)$/i.test(t)) return next
    if (/^end\s+note$/i.test(t)) c.fail('Unexpected "end note": no note is open. Start one with "note left of State".')
    if (t === '{') c.fail('Unexpected "{". Open a composite state on the "state" line: "state Name {".')

    const kw = /^(state|note|direction|classDef|class)(?=\s|$)/.exec(t)
    let word = kw?.[1]
    if (word && kw![0].length < t.length) {
      // `class --> B` or `note : x` use the word as a state name
      const after = t.slice(kw![0].length).trimStart()
      if (after.startsWith('-->') || after.startsWith(':')) word = undefined
    }
    switch (word) {
      case 'state':
        stateStatement(c, line)
        return next
      case 'note':
        return noteStatement(c, line, lines, next)
      case 'direction': {
        c.i += 'direction'.length
        c.ws()
        const at = c.i
        const value = c.rest()
        const dir = DIRECTION_WORDS[value.toUpperCase()]
        if (!dir) c.fail(value ? `Unknown direction "${snip(value)}". Use TB, BT, LR or RL.` : 'direction needs a value: TB, BT, LR or RL.', at)
        const top = stack[stack.length - 1]
        if (top) byId.get(top.id)!.direction = dir
        else ast.direction = dir!
        return next
      }
      case 'classDef': {
        const m = /^classDef\s+(\S+)\s*(.*)$/.exec(t)
        if (!m) return c.fail('classDef needs a name and styles: "classDef name stroke-width:2px".', 0)
        const decl = parseDecl(m[2]!)
        for (const name of m[1]!.split(',')) if (name) ast.classDefs[name] = { ...ast.classDefs[name], ...decl }
        return next
      }
      case 'class': {
        const m = /^class\s+(\S+)\s+(\S+)$/.exec(t)
        if (!m) return c.fail('class needs state ids and a class name: "class s1,s2 name".', 0)
        for (const id of m[1]!.split(',')) if (id) addClass(touch(id, line.no), m[2]!)
        return next
      }
    }

    // `A --> B : label`, `A : description`, `A`, `A:::name`
    if (c.at('-->')) c.fail('This transition has no source state. Write the state before the arrow, for example "A --> B" or "[*] --> A".')
    const startOfName = c.i
    const from = endpoint(c, 'source')
    c.ws()
    if (c.at('-->')) {
      const arrowAt = c.i
      c.i += 3
      c.ws()
      if (c.done || (c.at(':') && !c.at(':::'))) c.fail('This transition has no target state. Write the state after the arrow, for example "A --> B" or "A --> [*]".', arrowAt + 3)
      const to = endpoint(c, 'target')
      c.ws()
      let label: string | undefined
      if (c.at(':')) {
        c.i++
        label = c.rest() || undefined
        c.i = c.t.length
      }
      if (!c.done) {
        if (c.at('-->')) c.fail('Chained transitions are not supported. Write each transition on its own line.')
        unexpected(c, 'Add a label with ":", for example "A --> B : label".')
      }
      ast.transitions.push({ index: ast.transitions.length, from, to, label, line: line.no })
      return next
    }
    if (c.at(':') && !c.at(':::')) {
      c.i++
      if (from.startsWith('start:') || from.startsWith('end:')) c.fail('"[*]" is the start or end marker and cannot have a description.', startOfName)
      const text = c.rest()
      if (text) byId.get(from)!.descriptions.push(text)
      return next
    }
    if (c.done) return next
    if (/^[-=.<>]/.test(c.rest())) {
      const arrow = /^\S+/.exec(c.rest())![0]
      c.fail(`Unknown transition arrow "${snip(arrow)}". State diagrams use "-->", for example "A --> B".`)
    }
    return unexpected(c, `Write "${snip(from)} --> Other" for a transition, or "${snip(from)} : text" for a description.`)
  }

  const lines = p.lines
  for (let i = 0; i < lines.length; ) i = statement(lines[i]!, lines, i + 1)

  const open = stack[stack.length - 1]
  if (open) fail(open.line, open.col, `The composite state "${open.id}" opened here is never closed. Add a "}" line after its states.`)
  return ast
}
