import type { Align, Block, CodeNode, HeadingNode, Inline, ListItemNode, Root, TableNode } from './ast'
import { unescapeString } from './entities'
import { parseInline, parseReference, type RefMap } from './inline'

/**
 * Block structure parser. Follows the CommonMark reference algorithm (open container stack, one line at a
 * time, lazy continuation, deferred list tightness) with GFM tables and task items added. It is iterative:
 * nesting only grows the stack of open containers, which is capped by `maxDepth`.
 */

type BType = 'document' | 'blockquote' | 'list' | 'item' | 'paragraph' | 'heading' | 'code' | 'thematic' | 'table'

class B {
  children: B[] = []
  open = true
  lastLineBlank = false
  content = ''
  level = 0
  fenced = false
  fenceChar = ''
  fenceLength = 0
  fenceOffset = 0
  closed = false
  ordered = false
  bullet = ''
  delim = ''
  start = 1
  tight = true
  padding = 0
  markerOffset = 0
  align: Align[] = []
  header = ''
  line = 0
  constructor(
    public type: BType,
    public parent: B | null,
    public depth: number,
  ) {}
}

const isSpaceCode = (c: number) => c === 32 || c === 9
/** Characters that can begin a block construct (or a table delimiter row); lines starting with anything else are plain text. */
const SPECIAL = new Set('#`~*+_=<>0123456789-|:'.split('').map((c) => c.charCodeAt(0)))

function canContain(parent: BType, child: BType): boolean {
  if (parent === 'document' || parent === 'blockquote' || parent === 'item') return child !== 'item'
  if (parent === 'list') return child === 'item'
  return false
}
const acceptsLines = (t: BType) => t === 'paragraph' || t === 'code' || t === 'table'

/** Split a table row on unescaped pipes. `\|` becomes `|`. Outer pipes are optional. */
export function splitRow(row: string): string[] {
  let s = row.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) {
    let slashes = 0
    for (let i = s.length - 2; i >= 0 && s.charCodeAt(i) === 92; i -= 1) slashes += 1
    if (slashes % 2 === 0) s = s.slice(0, -1)
  }
  const cells: string[] = []
  let cur = ''
  let from = 0
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i)
    if (c === 92 && s.charCodeAt(i + 1) === 124) {
      cur += s.slice(from, i) + '|'
      i += 1
      from = i + 1
    } else if (c === 124) {
      cells.push((cur + s.slice(from, i)).trim())
      cur = ''
      from = i + 1
    }
  }
  cells.push((cur + s.slice(from)).trim())
  return cells
}

const DELIM_CELL = /^:?-+:?$/
function delimiterAlign(cells: string[]): Align[] | null {
  const out: Align[] = []
  for (const cell of cells) {
    if (!DELIM_CELL.test(cell)) return null
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    out.push(left && right ? 'center' : right ? 'right' : left ? 'left' : null)
  }
  return out
}

const THEMATIC = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/
const SETEXT = /^(?:=+|-+)[ \t]*$/

function atxContent(rest: string): string {
  let start = 0
  while (start < rest.length && isSpaceCode(rest.charCodeAt(start))) start += 1
  let end = rest.length
  while (end > start && isSpaceCode(rest.charCodeAt(end - 1))) end -= 1
  let j = end
  while (j > start && rest.charCodeAt(j - 1) === 35) j -= 1
  if (j < end && (j === start || isSpaceCode(rest.charCodeAt(j - 1)))) {
    end = j
    while (end > start && isSpaceCode(rest.charCodeAt(end - 1))) end -= 1
  }
  return rest.slice(start, end)
}

class BlockParser {
  doc = new B('document', null, 0)
  tip: B = this.doc
  oldtip: B = this.doc
  lastMatched: B = this.doc
  allClosed = true
  refs: RefMap = new Map()
  line = ''
  lineNumber = 0
  offset = 0
  column = 0
  nextNonspace = 0
  nextNonspaceColumn = 0
  indent = 0
  indented = false
  blank = false
  partialTab = false

  constructor(private maxDepth: number) {}

  private findNextNonspace(): void {
    let i = this.offset
    let cols = this.column
    let c = 0
    while (i < this.line.length) {
      c = this.line.charCodeAt(i)
      if (c === 32) {
        i += 1
        cols += 1
      } else if (c === 9) {
        i += 1
        cols += 4 - (cols % 4)
      } else break
    }
    this.blank = i >= this.line.length
    this.nextNonspace = i
    this.nextNonspaceColumn = cols
    this.indent = cols - this.column
    this.indented = this.indent >= 4
  }

  private advanceNextNonspace(): void {
    this.offset = this.nextNonspace
    this.column = this.nextNonspaceColumn
    this.partialTab = false
  }

  private advanceOffset(count: number, columns: boolean): void {
    while (count > 0 && this.offset < this.line.length) {
      if (this.line.charCodeAt(this.offset) === 9) {
        const toTab = 4 - (this.column % 4)
        if (columns) {
          this.partialTab = toTab > count
          const adv = toTab > count ? count : toTab
          this.column += adv
          this.offset += this.partialTab ? 0 : 1
          count -= adv
        } else {
          this.partialTab = false
          this.column += toTab
          this.offset += 1
          count -= 1
        }
      } else {
        this.partialTab = false
        this.offset += 1
        this.column += 1
        count -= 1
      }
    }
  }

  private addLine(): void {
    if (this.partialTab) {
      this.offset += 1
      this.tip.content += ' '.repeat(4 - (this.column % 4))
    }
    this.tip.content += this.line.slice(this.offset) + '\n'
  }

  private addChild(type: BType): B {
    while (!canContain(this.tip.type, type)) this.finalize(this.tip)
    const parent = this.tip
    const depth = type === 'blockquote' || type === 'list' ? parent.depth + 1 : parent.depth
    const node = new B(type, parent, depth)
    node.line = this.lineNumber
    parent.children.push(node)
    this.tip = node
    return node
  }

  /** Depth a new blockquote or list would get when started at `container`. */
  private childDepth(container: B): number {
    if (container.type === 'list') return container.depth
    if (container.type === 'document' || container.type === 'blockquote' || container.type === 'item') return container.depth + 1
    return (container.parent?.depth ?? 0) + 1
  }

  private closeUnmatched(): void {
    if (this.allClosed) return
    while (this.oldtip !== this.lastMatched) {
      const parent = this.oldtip.parent!
      this.finalize(this.oldtip)
      this.oldtip = parent
    }
    this.allClosed = true
  }

  private finalize(block: B): void {
    const above = block.parent
    block.open = false
    this.tip = above as B
    switch (block.type) {
      case 'paragraph': {
        let content = block.content
        while (content.charCodeAt(0) === 91) {
          const used = parseReference(content, this.refs)
          if (used === 0) break
          content = content.slice(used)
        }
        block.content = content
        if (isBlank(content) && above) above.children.splice(above.children.indexOf(block), 1)
        break
      }
      case 'code':
        if (block.fenced) {
          const nl = block.content.indexOf('\n')
          block.header = block.content.slice(0, nl)
          let body = block.content.slice(nl + 1)
          if (body.endsWith('\n')) body = body.slice(0, -1)
          block.content = body
        } else {
          let end = block.content.length
          while (end > 0 && (block.content.charCodeAt(end - 1) === 10 || block.content.charCodeAt(end - 1) === 32)) end -= 1
          block.content = block.content.slice(0, end)
        }
        break
      case 'list': {
        for (let i = 0; i < block.children.length && block.tight; i += 1) {
          const item = block.children[i]
          const hasNext = i < block.children.length - 1
          if (endsWithBlank(item) && hasNext) {
            block.tight = false
            break
          }
          for (let k = 0; k < item.children.length; k += 1) {
            if (endsWithBlank(item.children[k]) && (hasNext || k < item.children.length - 1)) {
              block.tight = false
              break
            }
          }
        }
        break
      }
    }
  }

  // Container continuation: 0 matched, 1 not matched, 2 line fully consumed (fence closed).
  private continueBlock(container: B): 0 | 1 | 2 {
    switch (container.type) {
      case 'blockquote':
        if (!this.indented && this.line.charCodeAt(this.nextNonspace) === 62) {
          this.advanceNextNonspace()
          this.advanceOffset(1, false)
          if (isSpaceCode(this.line.charCodeAt(this.offset))) this.advanceOffset(1, true)
          return 0
        }
        return 1
      case 'item':
        if (this.blank) {
          if (container.children.length === 0) return 1
          this.advanceNextNonspace()
        } else if (this.indent >= container.markerOffset + container.padding) {
          this.advanceOffset(container.markerOffset + container.padding, true)
        } else return 1
        return 0
      case 'heading':
      case 'thematic':
        return 1
      case 'code':
        if (container.fenced) {
          if (this.indent <= 3 && this.line[this.nextNonspace] === container.fenceChar) {
            let end = this.nextNonspace
            while (this.line[end] === container.fenceChar) end += 1
            let rest = end
            while (rest < this.line.length && isSpaceCode(this.line.charCodeAt(rest))) rest += 1
            if (end - this.nextNonspace >= container.fenceLength && rest >= this.line.length) {
              container.closed = true
              this.finalize(container)
              return 2
            }
          }
          let skip = container.fenceOffset
          while (skip > 0 && isSpaceCode(this.line.charCodeAt(this.offset))) {
            this.advanceOffset(1, true)
            skip -= 1
          }
          return 0
        }
        if (this.indent >= 4) {
          this.advanceOffset(4, true)
          return 0
        }
        if (this.blank) {
          this.advanceNextNonspace()
          return 0
        }
        return 1
      case 'paragraph':
      case 'table':
        return this.blank ? 1 : 0
      default:
        return 0
    }
  }

  // Block starts: 0 no match, 1 container opened, 2 leaf opened.
  private tryStarts(container: B): 0 | 1 | 2 {
    const s = this.line
    const c = s.charCodeAt(this.nextNonspace)
    if (!this.indented) {
      if (c === 62) {
        if (this.childDepth(container) > this.maxDepth) return 0
        this.advanceNextNonspace()
        this.advanceOffset(1, false)
        if (isSpaceCode(s.charCodeAt(this.offset))) this.advanceOffset(1, true)
        this.closeUnmatched()
        this.addChild('blockquote')
        return 1
      }
      if (c === 35) {
        let n = 0
        while (s.charCodeAt(this.nextNonspace + n) === 35) n += 1
        const after = s.charCodeAt(this.nextNonspace + n)
        if (n <= 6 && (Number.isNaN(after) || isSpaceCode(after))) {
          this.advanceNextNonspace()
          this.advanceOffset(n, false)
          this.closeUnmatched()
          const h = this.addChild('heading')
          h.level = n
          h.content = atxContent(s.slice(this.offset))
          this.advanceOffset(s.length - this.offset, false)
          return 2
        }
      }
      if (c === 96 || c === 126) {
        let n = 0
        while (s.charCodeAt(this.nextNonspace + n) === c) n += 1
        if (n >= 3 && (c === 126 || s.indexOf('`', this.nextNonspace + n) === -1)) {
          this.closeUnmatched()
          const code = this.addChild('code')
          code.fenced = true
          code.fenceChar = s[this.nextNonspace]
          code.fenceLength = n
          code.fenceOffset = this.indent
          this.advanceNextNonspace()
          this.advanceOffset(n, false)
          return 2
        }
      }
      if (container.type === 'paragraph' && (c === 124 || c === 58 || c === 45)) {
        const rest = s.slice(this.nextNonspace)
        if (rest.includes('|')) {
          const align = delimiterAlign(splitRow(rest))
          if (align) {
            const lines = container.content.split('\n')
            lines.pop()
            const header = lines[lines.length - 1]
            if (splitRow(header).length === align.length) return this.openTable(container, lines, header, align)
          }
        }
      }
      if (container.type === 'paragraph' && (c === 61 || c === 45) && SETEXT.test(s.slice(this.nextNonspace))) {
        this.closeUnmatched()
        let content = container.content
        while (content.charCodeAt(0) === 91) {
          const used = parseReference(content, this.refs)
          if (used === 0) break
          content = content.slice(used)
        }
        if (content.length > 0) {
          const parent = container.parent!
          parent.children.pop()
          const h = new B('heading', parent, parent.depth)
          h.line = container.line
          h.level = c === 61 ? 1 : 2
          h.content = content.trim()
          parent.children.push(h)
          container.open = false
          this.tip = h
          this.advanceOffset(s.length - this.offset, false)
          return 2
        }
      }
      if ((c === 42 || c === 45 || c === 95) && THEMATIC.test(s.slice(this.nextNonspace))) {
        this.closeUnmatched()
        this.addChild('thematic')
        this.advanceOffset(s.length - this.offset, false)
        return 2
      }
    }
    if (!this.indented || container.type === 'list') {
      const start = this.listStart(container)
      if (start) return start
    }
    if (this.indented && this.tip.type !== 'paragraph' && this.tip.type !== 'table' && !this.blank) {
      this.advanceOffset(4, true)
      this.closeUnmatched()
      this.addChild('code')
      return 2
    }
    return 0
  }

  private openTable(container: B, lines: string[], header: string, align: Align[]): 2 {
    this.closeUnmatched()
    const parent = container.parent!
    const before = lines.slice(0, -1)
    if (before.length) {
      container.content = before.join('\n') + '\n'
    } else {
      parent.children.splice(parent.children.indexOf(container), 1)
      container.open = false
      this.tip = parent
    }
    const table = this.addChild('table')
    table.align = align
    table.header = header
    this.advanceOffset(this.line.length - this.offset, false)
    return 2
  }

  private listStart(container: B): 0 | 1 {
    if (this.indent >= 4) return 0
    const s = this.line
    const first = s.charCodeAt(this.nextNonspace)
    let markerLength = 0
    let ordered = false
    let bullet = ''
    let delim = ''
    let start = 1
    if (first === 42 || first === 43 || first === 45) {
      markerLength = 1
      bullet = s[this.nextNonspace]
    } else if (first >= 48 && first <= 57) {
      let n = 0
      while (n < 10 && s.charCodeAt(this.nextNonspace + n) >= 48 && s.charCodeAt(this.nextNonspace + n) <= 57) n += 1
      const mark = s[this.nextNonspace + n]
      if (n > 9 || (mark !== '.' && mark !== ')')) return 0
      start = parseInt(s.slice(this.nextNonspace, this.nextNonspace + n), 10)
      if (container.type === 'paragraph' && start !== 1) return 0
      markerLength = n + 1
      ordered = true
      delim = mark
    } else return 0
    const after = s.charCodeAt(this.nextNonspace + markerLength)
    if (!(Number.isNaN(after) || isSpaceCode(after))) return 0
    // An empty item cannot interrupt a paragraph.
    if (container.type === 'paragraph' && isBlank(s.slice(this.nextNonspace + markerLength))) return 0
    const joins = container.type === 'list' && container.ordered === ordered && container.delim === delim && container.bullet === bullet
    if (!joins && this.childDepth(container) > this.maxDepth) return 0

    const markerOffset = this.indent
    this.advanceNextNonspace()
    this.advanceOffset(markerLength, true)
    const spacesStartCol = this.column
    const spacesStartOffset = this.offset
    do {
      this.advanceOffset(1, true)
    } while (this.column - spacesStartCol < 5 && isSpaceCode(s.charCodeAt(this.offset)))
    const blankItem = this.offset >= s.length
    const spaces = this.column - spacesStartCol
    let padding: number
    if (spaces >= 5 || spaces < 1 || blankItem) {
      padding = markerLength + 1
      this.column = spacesStartCol
      this.offset = spacesStartOffset
      if (isSpaceCode(s.charCodeAt(this.offset))) this.advanceOffset(1, true)
    } else padding = markerLength + spaces

    this.closeUnmatched()
    if (!(this.tip.type === 'list' && this.tip.ordered === ordered && this.tip.delim === delim && this.tip.bullet === bullet)) {
      const list = this.addChild('list')
      list.ordered = ordered
      list.delim = delim
      list.bullet = bullet
      list.start = start
    }
    const item = this.addChild('item')
    item.padding = padding
    item.markerOffset = markerOffset
    return 1
  }

  incorporate(line: string): void {
    let container = this.doc
    this.oldtip = this.tip
    this.offset = 0
    this.column = 0
    this.blank = false
    this.partialTab = false
    this.lineNumber += 1
    this.line = line
    for (;;) {
      const last = container.children[container.children.length - 1]
      if (!last || !last.open) break
      container = last
      this.findNextNonspace()
      const result = this.continueBlock(container)
      if (result === 2) return
      if (result === 1) {
        container = container.parent!
        break
      }
    }
    this.allClosed = container === this.oldtip
    this.lastMatched = container
    let matchedLeaf = container.type !== 'paragraph' && container.type !== 'table' && acceptsLines(container.type)
    while (!matchedLeaf) {
      this.findNextNonspace()
      if (!this.indented && !SPECIAL.has(line.charCodeAt(this.nextNonspace))) {
        this.advanceNextNonspace()
        break
      }
      const res = this.tryStarts(container)
      if (res === 0) {
        this.advanceNextNonspace()
        break
      }
      container = this.tip
      if (res === 2) matchedLeaf = true
    }
    if (!this.allClosed && !this.blank && this.tip.type === 'paragraph') {
      this.addLine()
    } else {
      this.closeUnmatched()
      if (this.blank && container.children.length) container.children[container.children.length - 1].lastLineBlank = true
      const t = container.type
      const lastLineBlank = this.blank && !(t === 'blockquote' || (t === 'code' && container.fenced) || (t === 'item' && container.children.length === 0 && container.line === this.lineNumber))
      for (let cont: B | null = container; cont; cont = cont.parent) cont.lastLineBlank = lastLineBlank
      if (acceptsLines(t)) this.addLine()
      else if (this.offset < line.length && !this.blank) {
        this.addChild('paragraph')
        this.advanceNextNonspace()
        this.addLine()
      }
    }
  }

  finish(): B {
    while (this.tip) this.finalize(this.tip)
    return this.doc
  }
}

function isBlank(s: string): boolean {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13) return false
  }
  return true
}

function endsWithBlank(block: B): boolean {
  let b: B | undefined = block
  while (b) {
    if (b.lastLineBlank) return true
    if (b.type === 'list' || b.type === 'item') b = b.children[b.children.length - 1]
    else break
  }
  return false
}

export interface BlockOptions {
  maxDepth: number
  streaming: boolean
}

interface Ctx extends BlockOptions {
  refs: RefMap
}

function lastLeaf(b: B): B {
  let cur = b
  while (cur.children.length) cur = cur.children[cur.children.length - 1]
  return cur
}

/** Streaming: hide a trailing table header or half-typed delimiter row until the table is complete. */
function trimPendingTable(doc: B): void {
  const leaf = lastLeaf(doc)
  if (leaf.type !== 'paragraph' || !leaf.parent) return
  const lines = leaf.content.split('\n')
  lines.pop()
  const total = lines.length
  while (lines.length && lines[lines.length - 1].trimStart().startsWith('|')) lines.pop()
  if (lines.length === total) return
  if (lines.length) leaf.content = lines.join('\n') + '\n'
  else leaf.parent.children.pop()
}

function inline(text: string, ctx: Ctx, last: boolean): Inline[] {
  return parseInline(text, ctx.refs, { maxDepth: ctx.maxDepth, streaming: ctx.streaming && last })
}

const TASK = /^\[([ xX])\](?:[ \t]+|\n|$)/

function convertList(list: B, ctx: Ctx, last: boolean): Block {
  const items: ListItemNode[] = list.children.map((item, i) => {
    const isLast = last && i === list.children.length - 1
    let checked: boolean | null = null
    const first = item.children[0]
    if (first && first.type === 'paragraph') {
      const m = TASK.exec(first.content)
      if (m) {
        checked = m[1] !== ' '
        first.content = first.content.slice(m[0].length)
      }
    }
    return { type: 'listItem', checked, children: convertBlocks(item.children, ctx, isLast) }
  })
  return { type: 'list', ordered: list.ordered, start: list.ordered ? list.start : null, tight: list.tight, children: items }
}

function convertCode(b: B): CodeNode {
  if (!b.fenced) return { type: 'code', info: '', lang: null, meta: null, value: b.content, closed: true }
  const info = unescapeString(b.header.trim())
  let split = 0
  while (split < info.length && !/\s/.test(info[split])) split += 1
  const lang = info.slice(0, split) || null
  const meta = info.slice(split).trim() || null
  return { type: 'code', info, lang, meta, value: b.content, closed: b.closed }
}

function convertTable(b: B, ctx: Ctx, last: boolean): TableNode {
  const width = b.align.length
  const fit = (cells: string[]) => {
    const out = cells.slice(0, width)
    while (out.length < width) out.push('')
    return out
  }
  // The first stored line is the already consumed delimiter row (empty); body rows follow.
  const lines = b.content.split('\n').slice(1)
  lines.pop()
  const rows = lines.map((line, i) => fit(splitRow(line)).map((cell) => inline(cell, ctx, last && i === lines.length - 1)))
  const head = fit(splitRow(b.header)).map((cell) => inline(cell, ctx, false))
  return { type: 'table', align: b.align, head, rows }
}

function convertBlocks(blocks: B[], ctx: Ctx, last: boolean): Block[] {
  const out: Block[] = []
  blocks.forEach((b, i) => {
    const isLast = last && i === blocks.length - 1
    switch (b.type) {
      case 'paragraph':
        out.push({ type: 'paragraph', children: inline(b.content.trimEnd(), ctx, isLast) })
        break
      case 'heading':
        out.push({ type: 'heading', depth: b.level as HeadingNode['depth'], children: inline(b.content, ctx, isLast) })
        break
      case 'blockquote':
        out.push({ type: 'blockquote', children: convertBlocks(b.children, ctx, isLast) })
        break
      case 'list':
        out.push(convertList(b, ctx, isLast))
        break
      case 'code':
        out.push(convertCode(b))
        break
      case 'thematic':
        out.push({ type: 'thematicBreak' })
        break
      case 'table':
        out.push(convertTable(b, ctx, isLast))
        break
    }
  })
  return out
}

/** Parse block structure, then inline content, of `source`. */
export function parseBlocks(source: string, options: BlockOptions): Root {
  const parser = new BlockParser(options.maxDepth)
  const lines = source.replace(/\0/g, '\ufffd').split(/\r\n|\r|\n/)
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  for (const line of lines) parser.incorporate(line)
  const doc = parser.finish()
  if (options.streaming) trimPendingTable(doc)
  return { type: 'root', children: convertBlocks(doc.children, { ...options, refs: parser.refs }, true) }
}
