import type { Inline } from './ast'
import { matchEntity, unescapeString } from './entities'

export interface RefDef {
  url: string
  title: string | null
}
export type RefMap = Map<string, RefDef>

export interface InlineOptions {
  maxDepth: number
  /** The text is still arriving: close dangling syntax at the end instead of showing it raw. */
  streaming?: boolean
}

type Kind = 'text' | 'code' | 'em' | 'strong' | 'del' | 'link' | 'image' | 'soft' | 'hard'

/** Working node (doubly linked so a closing bracket or delimiter can adopt its siblings in O(children)). */
class N {
  parent: N | null = null
  first: N | null = null
  last: N | null = null
  prev: N | null = null
  next: N | null = null
  /** Height of the subtree below this node; used to cap nesting. */
  h = 0
  /** Delimiter and bracket text nodes are edited in place and must not be merged into. */
  fixed = false
  /** Link written as `<url>`. */
  auto = false
  constructor(
    public kind: Kind,
    public value = '',
    public title: string | null = null,
  ) {}
}

function append(parent: N, child: N) {
  child.parent = parent
  child.prev = parent.last
  child.next = null
  if (parent.last) parent.last.next = child
  else parent.first = child
  parent.last = child
}
function unlink(node: N) {
  const parent = node.parent
  if (node.prev) node.prev.next = node.next
  else if (parent) parent.first = node.next
  if (node.next) node.next.prev = node.prev
  else if (parent) parent.last = node.prev
  node.parent = node.prev = node.next = null
}
function insertAfter(node: N, sibling: N) {
  sibling.parent = node.parent
  sibling.prev = node
  sibling.next = node.next
  if (node.next) node.next.prev = sibling
  else if (node.parent) node.parent.last = sibling
  node.next = sibling
}

const PUNCT = /[\p{P}\p{S}]/u
const SPACE = /[\s\p{Zs}]/u
const ESCAPABLE = /[!-/:-@[-`{-~]/
/** Unescaped parentheses may nest this deep in a link destination; deeper input is not a link (bounds scanning). */
const MAX_PARENS = 32
const isSpace = (c: number) => c === 32 || c === 9
const isWs = (c: number) => c === 32 || c === 9 || c === 10 || c === 11 || c === 12 || c === 13

/** Reference label key: trimmed, inner whitespace collapsed, case folded. */
export function normalizeLabel(label: string): string {
  return label.trim().replace(/[ \t\r\n]+/g, ' ').toLowerCase().toUpperCase()
}

/** Cursor over a string with the link-syntax scanners shared by inline links and reference definitions. */
class Scanner {
  pos = 0
  constructor(public s: string) {}

  peek(): number {
    return this.pos < this.s.length ? this.s.charCodeAt(this.pos) : -1
  }

  /** Skip spaces and at most one line ending. */
  spnl(): void {
    while (isSpace(this.peek())) this.pos += 1
    if (this.peek() === 10) {
      this.pos += 1
      while (isSpace(this.peek())) this.pos += 1
    }
  }

  /** Length of a `[label]` at `pos` (brackets included), or 0. Labels hold at most 999 characters and no bare brackets. */
  labelLength(): number {
    if (this.peek() !== 91) return 0
    let i = this.pos + 1
    const limit = Math.min(this.s.length, this.pos + 1001)
    while (i < limit) {
      const c = this.s.charCodeAt(i)
      if (c === 92) i += 2
      else if (c === 91) return 0
      else if (c === 93) return i + 1 - this.pos
      else i += 1
    }
    return 0
  }

  /** Link destination: `<...>` or a run without spaces and with balanced parentheses. */
  destination(): string | null {
    const s = this.s
    if (this.peek() === 60) {
      let i = this.pos + 1
      while (i < s.length) {
        const c = s.charCodeAt(i)
        if (c === 92 && i + 1 < s.length && ESCAPABLE.test(s[i + 1])) i += 2
        else if (c === 62) {
          const value = s.slice(this.pos + 1, i)
          this.pos = i + 1
          return unescapeString(value)
        } else if (c === 10 || c === 60) return null
        else i += 1
      }
      return null
    }
    const start = this.pos
    let depth = 0
    let i = start
    while (i < s.length) {
      const c = s.charCodeAt(i)
      if (c === 92 && i + 1 < s.length && ESCAPABLE.test(s[i + 1])) i += 2
      else if (c === 40) {
        depth += 1
        if (depth > MAX_PARENS) return null
        i += 1
      } else if (c === 41) {
        if (depth < 1) break
        depth -= 1
        i += 1
      } else if (c <= 32 || c === 127) break
      else i += 1
    }
    if (depth !== 0 || (i === start && s.charCodeAt(i) !== 41)) return null
    this.pos = i
    return unescapeString(s.slice(start, i))
  }

  /** Link title in `"..."`, `'...'` or `(...)`. */
  title(): string | null {
    const s = this.s
    const open = this.peek()
    const close = open === 34 ? 34 : open === 39 ? 39 : open === 40 ? 41 : -1
    if (close === -1) return null
    let i = this.pos + 1
    while (i < s.length) {
      const c = s.charCodeAt(i)
      if (c === 92 && i + 1 < s.length && ESCAPABLE.test(s[i + 1])) i += 2
      else if (c === close) {
        const value = s.slice(this.pos + 1, i)
        this.pos = i + 1
        return unescapeString(value)
      } else if (open === 40 && c === 40) return null
      else i += 1
    }
    return null
  }
}

/**
 * Parse one link reference definition at the start of `text` (a paragraph's raw content).
 * Stores it in `refs` (first definition of a label wins) and returns the number of characters consumed, or 0.
 */
export function parseReference(text: string, refs: RefMap): number {
  const sc = new Scanner(text)
  const labelLen = sc.labelLength()
  if (labelLen === 0) return 0
  const rawLabel = text.slice(0, labelLen)
  sc.pos = labelLen
  if (sc.peek() !== 58) return 0
  sc.pos += 1
  sc.spnl()
  const url = sc.destination()
  if (url === null) return 0
  const beforeTitle = sc.pos
  sc.spnl()
  let title: string | null = null
  if (sc.pos !== beforeTitle) title = sc.title()
  if (title === null) sc.pos = beforeTitle
  const atLineEnd = (): boolean => {
    let i = sc.pos
    while (isSpace(text.charCodeAt(i))) i += 1
    if (i >= text.length || text.charCodeAt(i) === 10) {
      sc.pos = Math.min(text.length, i + 1)
      return true
    }
    return false
  }
  if (!atLineEnd()) {
    if (title === null) return 0
    title = null
    sc.pos = beforeTitle
    if (!atLineEnd()) return 0
  }
  const key = normalizeLabel(rawLabel.slice(1, -1))
  if (key === '') return 0
  if (!refs.has(key)) refs.set(key, { url, title })
  return sc.pos
}

interface Delim {
  ch: string
  num: number
  orig: number
  node: N
  prev: Delim | null
  next: Delim | null
  canOpen: boolean
  canClose: boolean
}
interface Bracket {
  node: N
  prev: Bracket | null
  prevDelim: Delim | null
  index: number
  image: boolean
  active: boolean
  after: boolean
}

const TEXT_RUN = /[^\n`[\]\\!<&*_~]+/y
const AUTOLINK = /^[A-Za-z][A-Za-z0-9.+-]{1,31}:[^\s<>]*$/
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/
const MAX_AUTOLINK = 2048

class InlineParser extends Scanner {
  private delims: Delim | null = null
  private brackets: Bracket | null = null
  private readonly root = new N('text')
  private ticks: Map<number, number[]> | null = null
  private tickPtr = new Map<number, number>()

  constructor(
    text: string,
    private refs: RefMap,
    private opts: InlineOptions,
  ) {
    super(text)
  }

  run(): Inline[] {
    while (this.pos < this.s.length) this.parseInline()
    if (this.opts.streaming) {
      this.dropDanglingBrackets()
      this.processEmphasis(null, true)
      this.closeEmphasis()
    }
    this.processEmphasis(null)
    return convert(this.root, false)
  }

  private text(value: string, fixed = false): N {
    const last = this.root.last
    if (!fixed && last && last.kind === 'text' && !last.fixed) {
      last.value += value
      return last
    }
    const node = new N('text', value)
    node.fixed = fixed
    append(this.root, node)
    return node
  }

  private parseInline(): void {
    const c = this.s.charCodeAt(this.pos)
    switch (c) {
      case 10:
        return this.newline()
      case 92:
        return this.backslash()
      case 96:
        return this.backticks()
      case 42:
      case 95:
      case 126:
        return this.delimiterRun(this.s[this.pos])
      case 91:
        return this.openBracket(false)
      case 33:
        if (this.s.charCodeAt(this.pos + 1) === 91) return this.openBracket(true)
        this.pos += 1
        this.text('!')
        return
      case 93:
        return this.closeBracket()
      case 60:
        return this.angle()
      case 38: {
        const hit = matchEntity(this.s, this.pos)
        if (hit) {
          this.pos += hit.length
          this.text(hit.value)
        } else {
          this.pos += 1
          this.text('&')
        }
        return
      }
      default: {
        TEXT_RUN.lastIndex = this.pos
        const m = TEXT_RUN.exec(this.s)
        this.pos += m ? m[0].length : 1
        this.text(m ? m[0] : this.s[this.pos - 1])
      }
    }
  }

  private newline(): void {
    this.pos += 1
    const last = this.root.last
    let hard = false
    if (last && last.kind === 'text' && last.value.endsWith(' ')) {
      let end = last.value.length
      while (end > 0 && last.value.charCodeAt(end - 1) === 32) end -= 1
      hard = last.value.length - end >= 2
      last.value = last.value.slice(0, end)
      if (last.value === '' && !last.fixed) unlink(last)
    }
    append(this.root, new N(hard ? 'hard' : 'soft'))
    while (this.peek() === 32) this.pos += 1
  }

  private backslash(): void {
    const next = this.s[this.pos + 1]
    if (next === '\n') {
      this.pos += 2
      append(this.root, new N('hard'))
      while (this.peek() === 32) this.pos += 1
    } else if (next !== undefined && ESCAPABLE.test(next)) {
      this.pos += 2
      this.text(next)
    } else {
      this.pos += 1
      this.text('\\')
    }
  }

  /** Positions of every backtick run, by run length: finds a matching closer without rescanning. */
  private findTicks(length: number, from: number): number {
    if (!this.ticks) {
      this.ticks = new Map()
      const s = this.s
      let i = s.indexOf('`')
      while (i !== -1) {
        let j = i
        while (s.charCodeAt(j) === 96) j += 1
        const list = this.ticks.get(j - i)
        if (list) list.push(i)
        else this.ticks.set(j - i, [i])
        i = s.indexOf('`', j)
      }
    }
    const list = this.ticks.get(length)
    if (!list) return -1
    let ptr = this.tickPtr.get(length) ?? 0
    while (ptr < list.length && list[ptr] < from) ptr += 1
    this.tickPtr.set(length, ptr)
    return ptr < list.length ? list[ptr] : -1
  }

  private backticks(): void {
    let end = this.pos
    while (this.s.charCodeAt(end) === 96) end += 1
    const length = end - this.pos
    const close = this.findTicks(length, end)
    if (close === -1) {
      if (this.opts.streaming) {
        this.codeSpan(this.s.slice(end))
        this.pos = this.s.length
        return
      }
      this.pos = end
      this.text('`'.repeat(length))
      return
    }
    this.codeSpan(this.s.slice(end, close))
    this.pos = close + length
  }

  private codeSpan(raw: string): void {
    let value = raw.replace(/\n/g, ' ')
    if (value.length > 1 && value.startsWith(' ') && value.endsWith(' ') && /[^ ]/.test(value)) value = value.slice(1, -1)
    if (value === '' && this.opts.streaming) return
    append(this.root, new N('code', value))
  }

  private charBefore(i: number): string {
    if (i === 0) return '\n'
    const c = this.s.charCodeAt(i - 1)
    if (c >= 0xdc00 && c <= 0xdfff && i >= 2) {
      const hi = this.s.charCodeAt(i - 2)
      if (hi >= 0xd800 && hi <= 0xdbff) return this.s.slice(i - 2, i)
    }
    return this.s[i - 1]
  }

  private delimiterRun(ch: string): void {
    const start = this.pos
    let end = start
    while (this.s[end] === ch) end += 1
    const num = end - start
    this.pos = end
    if (ch === '~' && num !== 2) {
      this.text(ch.repeat(num))
      return
    }
    const before = this.charBefore(start)
    const after = end >= this.s.length ? '\n' : String.fromCodePoint(this.s.codePointAt(end)!)
    const afterWs = SPACE.test(after)
    const afterPunct = PUNCT.test(after)
    const beforeWs = SPACE.test(before)
    const beforePunct = PUNCT.test(before)
    const left = !afterWs && (!afterPunct || beforeWs || beforePunct)
    const right = !beforeWs && (!beforePunct || afterWs || afterPunct)
    let canOpen = left
    let canClose = right
    if (ch === '_') {
      canOpen = left && (!right || beforePunct)
      canClose = right && (!left || afterPunct)
    }
    const node = this.text(ch.repeat(num), true)
    if (canOpen || canClose) this.pushDelim({ ch, num, orig: num, node, prev: this.delims, next: null, canOpen, canClose })
  }

  private pushDelim(d: Delim): void {
    if (this.delims) this.delims.next = d
    this.delims = d
  }

  private removeDelim(d: Delim): void {
    if (d.prev) d.prev.next = d.next
    if (d.next) d.next.prev = d.prev
    else this.delims = d.prev
  }

  private removeBetween(bottom: Delim, top: Delim): void {
    if (top.prev !== bottom) {
      top.prev = bottom
      bottom.next = top
    }
  }

  private processEmphasis(bottom: Delim | null, keepStack = false): void {
    const openersBottom = new Map<string, Delim | null>()
    let closer = this.delims
    while (closer && closer.prev !== bottom) closer = closer.prev
    while (closer) {
      if (!closer.canClose) {
        closer = closer.next
        continue
      }
      const key = `${closer.ch}${closer.orig % 3}${closer.canOpen ? 1 : 0}`
      const floor = openersBottom.has(key) ? openersBottom.get(key)! : bottom
      let opener = closer.prev
      let found = false
      while (opener && opener !== bottom && opener !== floor) {
        const oddMatch = (closer.canOpen || opener.canClose) && closer.orig % 3 !== 0 && (opener.orig + closer.orig) % 3 === 0
        if (opener.ch === closer.ch && opener.canOpen && !oddMatch && (closer.ch !== '~' || (opener.num === 2 && closer.num === 2))) {
          found = true
          break
        }
        opener = opener.prev
      }
      const oldCloser = closer
      if (found && opener) {
        const use = closer.ch === '~' ? 2 : closer.num >= 2 && opener.num >= 2 ? 2 : 1
        const kind: Kind = closer.ch === '~' ? 'del' : use === 1 ? 'em' : 'strong'
        // Height of everything that would move inside the new node.
        let height = 0
        for (let n = opener.node.next; n && n !== closer.node; n = n.next) height = Math.max(height, n.h)
        if (height + 1 > this.opts.maxDepth) {
          found = false
        } else {
          opener.num -= use
          closer.num -= use
          opener.node.value = opener.node.value.slice(0, opener.node.value.length - use)
          closer.node.value = closer.node.value.slice(0, closer.node.value.length - use)
          const wrap = new N(kind)
          wrap.h = height + 1
          let tmp = opener.node.next
          while (tmp && tmp !== closer.node) {
            const next = tmp.next
            unlink(tmp)
            append(wrap, tmp)
            tmp = next
          }
          insertAfter(opener.node, wrap)
          this.removeBetween(opener, closer)
          if (opener.num === 0) {
            unlink(opener.node)
            this.removeDelim(opener)
          }
          if (closer.num === 0) {
            unlink(closer.node)
            const next = closer.next
            this.removeDelim(closer)
            closer = next
          }
        }
      }
      if (!found) {
        openersBottom.set(key, oldCloser.prev)
        const next = oldCloser.next
        if (!oldCloser.canOpen) this.removeDelim(oldCloser)
        closer = next
      }
    }
    if (keepStack) return
    while (this.delims && this.delims !== bottom) this.removeDelim(this.delims)
  }

  private openBracket(image: boolean): void {
    const node = this.text(image ? '![' : '[', true)
    this.pos += image ? 2 : 1
    if (this.brackets) this.brackets.after = true
    this.brackets = { node, prev: this.brackets, prevDelim: this.delims, index: this.pos - 1, image, active: true, after: false }
  }

  private closeBracket(): void {
    this.pos += 1
    const startPos = this.pos
    const opener = this.brackets
    if (!opener) {
      this.text(']')
      return
    }
    if (!opener.active) {
      this.brackets = opener.prev
      this.text(']')
      return
    }
    let url: string | null = null
    let title: string | null = null
    let matched = false
    if (this.peek() === 40) {
      this.pos += 1
      this.spnl()
      url = this.destination()
      if (url !== null) {
        this.spnl()
        if (isWs(this.s.charCodeAt(this.pos - 1))) title = this.title()
        this.spnl()
        if (this.peek() === 41) {
          this.pos += 1
          matched = true
        }
      }
      if (!matched) {
        if (this.opts.streaming && this.s.indexOf(')', startPos) === -1) return this.dropPartial(opener)
        this.pos = startPos
      }
    }
    if (!matched) {
      const before = this.pos
      const n = this.labelLength()
      let label = ''
      if (n > 2) label = this.s.slice(before, before + n)
      else if (!opener.after) label = this.s.slice(opener.index, startPos)
      this.pos += n
      const key = label ? normalizeLabel(label.slice(1, -1)) : ''
      const def = key ? this.refs.get(key) : undefined
      if (def) {
        url = def.url
        title = def.title
        matched = true
      }
    }
    if (matched) {
      let height = 0
      for (let n = opener.node.next; n; n = n.next) height = Math.max(height, n.h)
      if (height + 1 > this.opts.maxDepth) matched = false
    }
    if (!matched) {
      if (this.opts.streaming && this.pos >= this.s.length && !opener.image) {
        this.pos = this.s.length
        return this.dropPartial(opener)
      }
      this.brackets = opener.prev
      this.pos = startPos
      this.text(']')
      return
    }
    const node = new N(opener.image ? 'image' : 'link', url ?? '', title)
    let height = 0
    let tmp = opener.node.next
    while (tmp) {
      const next = tmp.next
      height = Math.max(height, tmp.h)
      unlink(tmp)
      append(node, tmp)
      tmp = next
    }
    append(this.root, node)
    this.processEmphasis(opener.prevDelim)
    height = 0
    for (let n = node.first; n; n = n.next) height = Math.max(height, n.h)
    node.h = height + 1
    this.brackets = opener.prev
    unlink(opener.node)
    if (!opener.image) for (let b = this.brackets; b; b = b.prev) if (!b.image) b.active = false
  }

  /** Streaming: `[label](http://par` is still arriving. Show the label (links) or nothing (images) until it completes. */
  private dropPartial(opener: Bracket): void {
    this.pos = this.s.length
    this.brackets = opener.prev
    if (opener.image) {
      while (this.root.last && this.root.last !== opener.node) unlink(this.root.last)
      unlink(opener.node)
      while (this.delims && this.delims !== opener.prevDelim) this.removeDelim(this.delims)
    } else {
      unlink(opener.node)
    }
  }

  /** Streaming: drop unclosed `[` / `![` openers and a half-typed delimiter run at the very end. */
  private dropDanglingBrackets(): void {
    for (let b = this.brackets; b; b = b.prev) {
      if (b.node.parent !== this.root) continue
      if (b.image) {
        while (this.root.last && this.root.last !== b.node) unlink(this.root.last)
        unlink(b.node)
        while (this.delims && this.delims !== b.prevDelim) this.removeDelim(this.delims)
      } else {
        unlink(b.node)
      }
    }
    this.brackets = null
    // A delimiter run at the very end that can neither open nor close is half-typed syntax.
    const tail = this.root.last
    if (tail && tail.kind === 'text' && tail.fixed && /^[*_~]+$/.test(tail.value) && !(this.delims && this.delims.node === tail)) unlink(tail)
  }

  /** Streaming: emphasis that is still open at the end is closed, so `**bol` shows as bold instead of raw asterisks. */
  private closeEmphasis(): void {
    const openers: Delim[] = []
    for (let d = this.delims; d; d = d.prev) if (d.canOpen && !d.canClose) openers.push(d)
    for (const d of openers) {
      const node = new N('text', d.ch.repeat(d.num))
      node.fixed = true
      append(this.root, node)
      this.pushDelim({ ch: d.ch, num: d.num, orig: d.num, node, prev: this.delims, next: null, canOpen: false, canClose: true })
    }
  }

  private angle(): void {
    const s = this.s
    const stop = Math.min(s.length, this.pos + MAX_AUTOLINK)
    let i = this.pos + 1
    while (i < stop) {
      const c = s.charCodeAt(i)
      if (c === 62 || c === 60 || c <= 32) break
      i += 1
    }
    if (s.charCodeAt(i) === 62) {
      const inner = s.slice(this.pos + 1, i)
      const email = EMAIL.test(inner)
      if (email || AUTOLINK.test(inner)) {
        const node = new N('link', email ? `mailto:${inner}` : inner)
        node.auto = true
        node.h = 1
        append(node, new N('text', inner))
        append(this.root, node)
        this.pos = i + 1
        return
      }
    }
    this.pos += 1
    this.text('<')
  }
}

const BARE_TRAILING = '?!.,:*_~\'"'

/** Split bare `http(s)://` URLs out of plain text (GFM extended autolink, restricted to http and https). */
function linkifyText(value: string): Inline[] | null {
  let at = value.indexOf('://')
  if (at === -1) return null
  const out: Inline[] = []
  let last = 0
  let from = 0
  while (at !== -1) {
    let start = -1
    const lower = value.slice(Math.max(0, at - 5), at).toLowerCase()
    if (lower.endsWith('https')) start = at - 5
    else if (lower.endsWith('http')) start = at - 4
    const boundary = start === 0 || (start > 0 && /[\s*_~(]/.test(value[start - 1]))
    if (start >= last && boundary) {
      let end = at + 3
      while (end < value.length && !/[\s<>]/.test(value[end])) end += 1
      const bodyStart = at + 3
      for (;;) {
        const c = value[end - 1]
        if (end <= bodyStart) break
        if (BARE_TRAILING.includes(c)) end -= 1
        else if (c === ')') {
          let open = 0
          let close = 0
          for (let k = start; k < end; k += 1) {
            if (value[k] === '(') open += 1
            else if (value[k] === ')') close += 1
          }
          if (close > open) end -= 1
          else break
        } else if (c === ';') {
          const amp = value.lastIndexOf('&', end - 1)
          if (amp > bodyStart && /^&[A-Za-z0-9]+;$/.test(value.slice(amp, end))) end = amp
          else break
        } else break
      }
      if (end > bodyStart && /[\p{L}\p{N}[]/u.test(value[bodyStart])) {
        if (start > last) out.push({ type: 'text', value: value.slice(last, start) })
        const url = value.slice(start, end)
        out.push({ type: 'link', url, title: null, autolink: true, children: [{ type: 'text', value: url }] })
        last = end
        from = end
        at = value.indexOf('://', from)
        continue
      }
    }
    from = at + 3
    at = value.indexOf('://', from)
  }
  if (!out.length) return null
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
  return out
}

function pushText(out: Inline[], value: string) {
  if (value === '') return
  const prev = out[out.length - 1]
  if (prev && prev.type === 'text') prev.value += value
  else out.push({ type: 'text', value })
}

/** Flatten inline nodes to plain text. Soft and hard breaks become `separator`. */
export function inlineToText(nodes: readonly Inline[], separator = ' '): string {
  let out = ''
  for (const n of nodes) {
    switch (n.type) {
      case 'text':
      case 'inlineCode':
        out += n.value
        break
      case 'image':
        out += n.alt
        break
      case 'break':
      case 'softbreak':
        out += separator
        break
      default:
        out += inlineToText(n.children, separator)
    }
  }
  return out
}

function convert(parent: N, inLink: boolean): Inline[] {
  const out: Inline[] = []
  for (let n = parent.first; n; n = n.next) {
    switch (n.kind) {
      case 'text':
        pushText(out, n.value)
        break
      case 'soft':
        out.push({ type: 'softbreak' })
        break
      case 'hard':
        out.push({ type: 'break' })
        break
      case 'code':
        out.push({ type: 'inlineCode', value: n.value })
        break
      case 'em':
        out.push({ type: 'emphasis', children: convert(n, inLink) })
        break
      case 'strong':
        out.push({ type: 'strong', children: convert(n, inLink) })
        break
      case 'del':
        out.push({ type: 'delete', children: convert(n, inLink) })
        break
      case 'link': {
        const children = convert(n, true)
        out.push(n.auto ? { type: 'link', url: n.value, title: null, autolink: true, children } : { type: 'link', url: n.value, title: n.title, children })
        break
      }
      case 'image':
        out.push({ type: 'image', url: n.value, title: n.title, alt: inlineToText(convert(n, true)) })
        break
    }
  }
  if (inLink) return out
  const result: Inline[] = []
  for (const item of out) {
    const split = item.type === 'text' ? linkifyText(item.value) : null
    if (split) for (const piece of split) result.push(piece)
    else result.push(item)
  }
  return result
}

/** Parse inline syntax in `text`. Reference definitions must already be in `refs`. */
export function parseInline(text: string, refs: RefMap, options: InlineOptions): Inline[] {
  return new InlineParser(text, refs, options).run()
}
