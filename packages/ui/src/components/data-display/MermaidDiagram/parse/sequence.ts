/**
 * `sequenceDiagram` parser.
 *
 * Supported: `participant` / `actor` (with `as` aliases, quoted ids, `create participant`), implicit participants from
 * messages and notes in order of first appearance, the eight arrows (`->>` `-->>` `->` `-->` `-x` `--x` `-)` `--)`) plus
 * the bidirectional `<<->>` and `<<-->>`, `+` / `-` activation shorthand, `activate` / `deactivate`, notes (`left of`,
 * `right of`, `over A` and `over A,B`), blocks (`loop` `alt`/`else` `opt` `par`/`and` `critical`/`option` `break`) closed
 * by `end`, `autonumber` (`off`, start, start and step) and `title`.
 * Accepted and ignored: `box` and `rect` (their `end` is matched but nothing is drawn), `link`, `links`, `destroy`, the
 * `@{ ... }` participant configuration. `create` only declares the participant at the top of the diagram.
 * Not supported: several statements on one line separated by `;` (a trailing `;` is fine), `par_over`, `properties`.
 */
import type { PreparedSource } from '../../_diagram/source'
import { fail, type DiagramMeta, type SourceLine } from '../../_diagram/types'

export type SeqLineStyle = 'solid' | 'dashed'
/** `arrow` filled head, `open` async head, `cross` lost message, `none` plain line. */
export type SeqHead = 'arrow' | 'open' | 'cross' | 'none'
export type SeqBlockKind = 'loop' | 'alt' | 'opt' | 'par' | 'critical' | 'break'
export type SeqBranchKind = 'else' | 'and' | 'option'

export interface SeqParticipant {
  id: string
  /** Display text as written (before `<br>` and entity handling). Equals `id` when there is no alias. */
  label: string
  actor: boolean
  line: number
}

export interface SeqMessage {
  kind: 'message'
  from: string
  to: string
  text: string
  line: SeqLineStyle
  head: SeqHead
  /** `<<->>`: arrowheads on both ends. */
  both: boolean
  /** `+` after the arrow: the receiver becomes active. */
  activate: boolean
  /** `-` after the arrow: the sender stops being active. */
  deactivate: boolean
  /** Number shown by `autonumber`. */
  num?: number
  at: number
}

export interface SeqNote {
  kind: 'note'
  side: 'left' | 'right' | 'over'
  /** One id, or two for `over A,B`. */
  ids: string[]
  text: string
  at: number
}

export interface SeqActivation {
  kind: 'activate' | 'deactivate'
  id: string
  at: number
}

export interface SeqBlockStart {
  kind: 'block'
  block: SeqBlockKind
  text: string
  at: number
}

export interface SeqBranch {
  kind: 'branch'
  branch: SeqBranchKind
  text: string
  at: number
}

export interface SeqBlockEnd {
  kind: 'end'
  at: number
}

export type SeqEvent = SeqMessage | SeqNote | SeqActivation | SeqBlockStart | SeqBranch | SeqBlockEnd

export interface SequenceAst {
  type: 'sequence'
  participants: SeqParticipant[]
  events: SeqEvent[]
  meta: DiagramMeta
}

const BLOCKS: readonly SeqBlockKind[] = ['loop', 'alt', 'opt', 'par', 'critical', 'break']
const BRANCH_OF: Record<string, SeqBlockKind> = { else: 'alt', and: 'par', option: 'critical' }
const KEYWORD = /^(participant|actor|activate|deactivate|loop|alt|else|opt|par|and|critical|option|break|end|autonumber|title|box|rect|link|links|create|destroy)(?=\s|$|:)/

const VALID =
  'a message such as "Alice->>Bob: Hello", or start the line with participant, actor, Note, activate, deactivate, loop, alt, else, opt, par, and, critical, option, break, end, autonumber or title'
const ARROWS = '->>, -->>, ->, -->, -x, --x, -) or --)'

interface Open {
  kind: SeqBlockKind | 'box' | 'rect'
  line: number
  col: number
}

/** Arrow candidates: `<<->>` / `<<-->>` (both ends) or `->>` `-->>` `->` `-->` `-x` `--x` `-)` `--)`. */
const ARROW = /(<<)?(--?)(>>|>|x|\))/g

interface Found {
  index: number
  text: string
  dashed: boolean
  head: SeqHead
  both: boolean
}

function findArrow(head: string): Found | undefined {
  let best: Found | undefined
  for (const m of head.matchAll(ARROW)) {
    if (m[1] && m[3] !== '>>') continue
    const kind = m[3]!
    const found: Found = {
      index: m.index,
      text: m[0],
      dashed: m[2] === '--',
      head: kind === '>>' ? 'arrow' : kind === '>' ? 'none' : kind === 'x' ? 'cross' : 'open',
      both: Boolean(m[1]),
    }
    // `>` arrows win over `x` and `)` so a name such as "a-xray" is not split at "-x"
    if (kind.startsWith('>')) return found
    best ??= found
  }
  return best
}

/** `A as Alice` split at the first standalone "as", by scanning so long whitespace runs cost linear time. */
function splitAlias(rest: string): { id: string; label: string } | undefined {
  let at = rest.indexOf('as')
  while (at !== -1) {
    const before = rest[at - 1]
    const after = rest[at + 2]
    if (at > 0 && /\s/.test(before!) && (after === undefined || /\s/.test(after))) return { id: rest.slice(0, at).trim(), label: rest.slice(at + 2).trim() }
    at = rest.indexOf('as', at + 1)
  }
  return undefined
}

const NOTE_HEAD = /^[Nn]ote\s+(left of|right of|over)\s+/

/** `Note over A,B: text` as [whole, side, names, text]; names and text split on the first colon without lazy backtracking. */
function matchNote(text: string): [string, string, string, string | undefined] | undefined {
  const head = NOTE_HEAD.exec(text)
  if (!head) return undefined
  const tail = text.slice(head[0].length)
  const colon = tail.indexOf(':')
  const names = (colon === -1 ? tail : tail.slice(0, colon)).trimEnd()
  return [text, head[1]!, names, colon === -1 ? undefined : tail.slice(colon + 1)]
}

export function parseSequence(p: PreparedSource): SequenceAst {
  if (p.rest !== '' && p.rest !== ';') fail(p.header.no, p.header.col + p.header.text.indexOf(p.rest, p.keyword.length), 'Put each statement on its own line below "sequenceDiagram".')

  const participants: SeqParticipant[] = []
  const index = new Map<string, number>()
  const events: SeqEvent[] = []
  const stack: Open[] = []
  const active = new Map<string, number>()
  const meta: DiagramMeta = { ...p.meta }
  const num = { on: false, next: 1, step: 1 }

  const ensure = (id: string, actor: boolean | undefined, label: string | undefined, line: number): void => {
    const at = index.get(id)
    if (at === undefined) {
      index.set(id, participants.length)
      participants.push({ id, label: label ?? id, actor: actor ?? false, line })
      return
    }
    const existing = participants[at]!
    if (label !== undefined) existing.label = label
    if (actor !== undefined) existing.actor = actor
  }

  const declare = (l: SourceLine, restAt: number, actor: boolean): void => {
    let rest = l.text.slice(restAt)
    rest = rest.replace(/\s*@\{.*\}\s*$/, '')
    const col = l.col + restAt
    const kw = actor ? 'actor' : 'participant'
    if (rest === '') fail(l.no, col, `"${kw}" needs a name, for example "${kw} Alice" or "${kw} A as Alice Smith".`)
    let id: string
    let label: string | undefined
    if (rest.startsWith('"')) {
      const close = rest.indexOf('"', 1)
      if (close < 0) return fail(l.no, col, 'This quoted name is never closed. Add the closing quote.')
      id = rest.slice(1, close)
      const after = rest.slice(close + 1).trim()
      if (after !== '') {
        const as = /^as\s+(.+)$/.exec(after)
        if (!as) return fail(l.no, col + rest.length - after.length, 'After a quoted name write "as" and the display text, for example `participant "Order service" as O`.')
        label = as[1]!.trim()
      }
      if (id.trim() === '') return fail(l.no, col, `"${kw}" needs a name, the quoted name is empty.`)
    } else {
      const as = splitAlias(rest)
      if (as) {
        id = as.id
        label = as.label
        if (label === '') return fail(l.no, col + rest.length, 'Write the display text after "as", for example "participant A as Alice".')
      } else id = rest
    }
    ensure(id, actor, label, l.no)
  }

  const requireKnown = (l: SourceLine, name: string, col: number, action: string): void => {
    if (!index.has(name)) fail(l.no, col, `Cannot ${action} "${name}": no participant has this name yet. Declare it with "participant ${name}" or use it in a message first.`)
  }

  const block = (l: SourceLine, kw: string, restAt: number): void => {
    const text = l.text.slice(restAt).trim()
    if ((BLOCKS as readonly string[]).includes(kw)) {
      stack.push({ kind: kw as SeqBlockKind, line: l.no, col: l.col })
      events.push({ kind: 'block', block: kw as SeqBlockKind, text, at: l.no })
    } else stack.push({ kind: kw as 'box' | 'rect', line: l.no, col: l.col })
  }

  const note = (l: SourceLine): void => {
    const m = matchNote(l.text)
    if (!m) return fail(l.no, l.col, 'A note is written as "Note left of A: text", "Note right of A: text" or "Note over A,B: text".')
    const side = m[1] === 'left of' ? 'left' : m[1] === 'right of' ? 'right' : 'over'
    const names = m[2]!.split(',').map((n) => n.trim())
    const namesCol = l.col + l.text.indexOf(m[2]!, l.text.indexOf(m[1]!) + m[1]!.length)
    if (names.some((n) => n === '')) return fail(l.no, namesCol, `Name the participant${side === 'over' ? 's' : ''} the note belongs to, for example "Note ${m[1]} A: text".`)
    if (side !== 'over' && names.length > 1) return fail(l.no, namesCol, `A note "${m[1]}" takes one participant. Use "Note over A,B: text" to span two.`)
    if (names.length > 2) return fail(l.no, namesCol, 'A note spans at most two participants: "Note over A,B: text".')
    if (m[3] === undefined || m[3].trim() === '') return fail(l.no, l.col + l.text.length, 'A note needs text after a colon, for example "Note over A: text".')
    for (const n of names) ensure(n, undefined, undefined, l.no)
    events.push({ kind: 'note', side, ids: names.length === 2 && names[0] === names[1] ? [names[0]!] : names, text: m[3].trim(), at: l.no })
  }

  const message = (l: SourceLine): void => {
    const colon = l.text.indexOf(':')
    const head = colon < 0 ? l.text : l.text.slice(0, colon)
    const text = colon < 0 ? '' : l.text.slice(colon + 1).trim()
    const arrow = findArrow(head)
    if (!arrow) {
      const odd = /[-=~.<]*>[-=~.<>]*|[=~]{2,}[-=~.<>]*/.exec(head)
      if (odd) return fail(l.no, l.col + odd.index, `Unknown arrow "${odd[0]}". Use one of ${ARROWS}.`)
      return fail(l.no, l.col, `Unknown statement "${head.trim().split(/\s+/)[0]}". Write ${VALID}.`)
    }
    const fromPart = head.slice(0, arrow.index)
    const arrowEnd = arrow.index + arrow.text.length
    const mod = head[arrowEnd] === '+' || head[arrowEnd] === '-' ? head[arrowEnd]! : ''
    const toPart = head.slice(arrowEnd + mod.length)
    const before = /[-=~<]*$/.exec(fromPart.trimEnd())![0]
    const after = /^[-=~>]*/.exec(toPart.trimStart())![0]
    if (before !== '' || after !== '') {
      const run = before + arrow.text + after
      return fail(l.no, l.col + arrow.index - before.length, `Unknown arrow "${run}". Use one of ${ARROWS}.`)
    }
    const from = fromPart.trim()
    const to = toPart.trim()
    if (from === '') return fail(l.no, l.col + arrow.index, `This message has no sender before "${arrow.text}". Write "Alice${arrow.text}Bob: text".`)
    if (to === '') return fail(l.no, l.col + arrowEnd + mod.length, `This message has no receiver after "${arrow.text}". Write "Alice${arrow.text}Bob: text".`)
    if (/[<>]/.test(from)) return fail(l.no, l.col + fromPart.search(/[<>]/), 'A participant name cannot contain "<" or ">". Declare it with an alias: "participant A as Display name".')
    if (/[<>]/.test(to)) return fail(l.no, l.col + arrowEnd + mod.length + toPart.search(/[<>]/), 'A participant name cannot contain "<" or ">". Declare it with an alias: "participant A as Display name".')
    ensure(from, undefined, undefined, l.no)
    ensure(to, undefined, undefined, l.no)
    if (mod === '+') active.set(to, (active.get(to) ?? 0) + 1)
    if (mod === '-') {
      if (!active.get(from)) return fail(l.no, l.col + arrowEnd, `Cannot deactivate "${from}" with "-": it has no open activation. Activate it earlier with "+" after an arrow or with "activate ${from}".`)
      active.set(from, active.get(from)! - 1)
    }
    const msg: SeqMessage = { kind: 'message', from, to, text, line: arrow.dashed ? 'dashed' : 'solid', head: arrow.head, both: arrow.both, activate: mod === '+', deactivate: mod === '-', at: l.no }
    if (num.on) {
      msg.num = num.next
      num.next += num.step
    }
    events.push(msg)
  }

  for (const l0 of p.lines) {
    const l: SourceLine = /;\s*$/.test(l0.text) && !/[#&]#?\w+;$/.test(l0.text) ? { ...l0, text: l0.text.replace(/;\s*$/, '').trimEnd() } : l0
    if (l.text === '') continue
    const k = KEYWORD.exec(l.text)
    const kw = k?.[1]
    const restAt = k ? k[0].length + (/^\s*/.exec(l.text.slice(k[0].length))![0].length) : 0
    if (!kw) {
      if (/^[Nn]ote(\s|$)/.test(l.text)) note(l)
      else message(l)
      continue
    }
    switch (kw) {
      case 'participant':
      case 'actor':
        declare(l, restAt, kw === 'actor')
        break
      case 'create': {
        const m = /^create\s+(participant|actor)(?:\s+(.*))?$/.exec(l.text)
        if (!m) return fail(l.no, l.col, 'Write "create participant B" or "create actor B" before the first message to B.')
        declare(l, l.text.length - (m[2]?.length ?? 0), m[1] === 'actor')
        break
      }
      case 'activate':
      case 'deactivate': {
        const name = l.text.slice(restAt).trim()
        if (name === '') return fail(l.no, l.col + l.text.length, `"${kw}" needs a participant name, for example "${kw} Bob".`)
        requireKnown(l, name, l.col + restAt, kw)
        const count = active.get(name) ?? 0
        if (kw === 'activate') active.set(name, count + 1)
        else if (count === 0) return fail(l.no, l.col + restAt, `Cannot deactivate "${name}": it has no open activation. Write "activate ${name}" earlier, or put "+" after the arrow of the message that starts it.`)
        else active.set(name, count - 1)
        events.push({ kind: kw, id: name, at: l.no })
        break
      }
      case 'loop':
      case 'alt':
      case 'opt':
      case 'par':
      case 'critical':
      case 'break':
      case 'box':
      case 'rect':
        block(l, kw, restAt)
        break
      case 'else':
      case 'and':
      case 'option': {
        const want = BRANCH_OF[kw]!
        const top = stack[stack.length - 1]
        if (top?.kind !== want) return fail(l.no, l.col, top ? `"${kw}" is only valid directly inside "${want} ... end", but the open block is "${top.kind}". Close it with "end" first.` : `"${kw}" has no open "${want}" block. Start one with "${want} condition", or remove this line.`)
        events.push({ kind: 'branch', branch: kw, text: l.text.slice(restAt).trim(), at: l.no })
        break
      }
      case 'end': {
        if (l.text !== 'end') return fail(l.no, l.col + 3, 'The "end" line closes a block and takes no text. Put the text on its own line.')
        const top = stack.pop()
        if (!top) return fail(l.no, l.col, 'This "end" has no block to close. Remove it, or open a block with loop, alt, opt, par, critical or break.')
        if (top.kind !== 'box' && top.kind !== 'rect') events.push({ kind: 'end', at: l.no })
        break
      }
      case 'autonumber': {
        const args = l.text.slice(restAt).split(/\s+/).filter(Boolean)
        if (args.length === 1 && args[0] === 'off') num.on = false
        else if (args.length <= 2 && args.every((a) => /^\d{1,9}$/.test(a))) {
          num.on = true
          num.next = args.length ? Number(args[0]) : 1
          num.step = args.length > 1 ? Number(args[1]) : 1
        } else return fail(l.no, l.col + restAt, 'autonumber takes numbers: "autonumber", "autonumber 10", "autonumber 10 5" (start and step) or "autonumber off".')
        break
      }
      case 'title': {
        const t = l.text.replace(/^title\s*:?\s*/, '')
        if (t === '') return fail(l.no, l.col + l.text.length, 'A title needs text, for example "title Checkout flow".')
        meta.title = t
        break
      }
      default:
        // link, links, destroy: accepted and ignored
        break
    }
  }

  const open = stack[stack.length - 1]
  if (open) fail(open.line, open.col, `The "${open.kind}" block opened here is never closed. Add an "end" line after its content.`)

  return { type: 'sequence', participants, events, meta }
}
