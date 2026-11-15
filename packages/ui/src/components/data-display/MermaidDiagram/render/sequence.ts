/**
 * Sequence diagram renderer. Participants sit in a row at the top (repeated at the bottom of long diagrams), messages
 * run top to bottom, and the gaps between lifelines widen until every message label, note and self loop fits.
 * The geometry runs twice: the first pass finds how far content reaches to the left, the second one draws with an
 * offset so everything starts at the margin.
 */
import { checkLimits, rectPath } from '../../_diagram/graph'
import { cleanLabel, labelBlock, measureText, plural, r2 } from '../../_diagram/text'
import { ParseFail, type Marker, type Metrics, type RenderItem, type RenderModel, type RenderOptions, type RShape, type RText, type TextAlt } from '../../_diagram/types'
import type { SeqBlockStart, SeqBranch, SeqMessage, SeqNote, SequenceAst } from '../parse/sequence'

const MARKER: Record<SeqMessage['head'], Marker | undefined> = { arrow: 'arrow', open: 'open', cross: 'cross', none: undefined }
/** Participant boxes are repeated at the bottom when there are more messages than this. */
const REPEAT_ABOVE = 8

interface Label {
  lines: string[]
  width: number
  height: number
}

const NO_LABEL: Label = { lines: [], width: 0, height: 0 }

interface Pending {
  kw: string
  startY: number
  minX: number
  maxX: number
  depth: number
  tabW: number
  cond: Label
  branches: { y: number; kw: string; cond: Label }[]
}

interface Drawn {
  items: RenderItem[]
  minX: number
  maxX: number
  maxY: number
}

export function renderSequence(ast: SequenceAst, opts: RenderOptions, m: Metrics): RenderModel {
  const parts = ast.participants
  const messages = ast.events.filter((e): e is SeqMessage => e.kind === 'message')
  if (parts.length === 0) throw new ParseFail(1, 1, 'This sequence diagram has no participants. Add a message such as "Alice->>Bob: Hello".', 'empty')
  checkLimits(parts.length, messages.length, opts)

  const tone = opts.tone ?? 'neutral'
  const font = m.font
  const lh = m.lineHeight
  const pad = Math.round(font * 0.6)
  const bw = Math.round(font * 0.7)
  const loopW = Math.round(font * 2.6)
  const loopH = lh
  const noteInset = Math.round(m.padY * 0.6)
  const spanHang = Math.round(m.padX * 0.7)
  const figure = Math.round(font * 2.2)
  const n = parts.length
  const idx = new Map(parts.map((p, i) => [p.id, i]))
  const at = (id: string): number => idx.get(id)!
  const label = (text: string, wrap: number, bold = false): Label => {
    const lines = cleanLabel(text)
    if (lines.join('') === '') return NO_LABEL
    return labelBlock(lines, wrap, font, lh, bold)
  }

  // ---- participant headers
  const heads = parts.map((p) => {
    const block = label(p.label, m.wrap)
    const text = block === NO_LABEL ? labelBlock([p.id], m.wrap, font, lh) : block
    if (p.actor) return { text, width: Math.max(text.width + m.padX, figure * 0.8, font * 3.5), height: figure + 4 + text.height }
    return { text, width: Math.max(text.width + 2 * m.padX, font * 3.5), height: text.height + 2 * m.padY }
  })
  const boxH = Math.max(0, ...heads.filter((_, i) => !parts[i]!.actor).map((h) => h.height))
  const actorH = Math.max(0, ...heads.filter((_, i) => parts[i]!.actor).map((h) => h.height))
  const headerH = Math.max(boxH, actorH)

  // ---- message and note labels, measured once
  const labelOf = new Map<SeqMessage, Label>()
  for (const e of messages) {
    const base = cleanLabel(e.text).join(' ').trim()
    const prefix = e.num === undefined ? '' : `${e.num}.`
    const text = prefix && base ? `${prefix} ${base}` : `${prefix}${base}`
    labelOf.set(e, text === '' ? NO_LABEL : labelBlock([text], m.wrap * 1.6, font, lh))
  }
  const noteLabel = new Map<SeqNote, Label>()
  for (const e of ast.events) {
    if (e.kind !== 'note') continue
    const l = label(e.text, e.side === 'over' ? m.wrap * 1.6 : m.wrap * 1.1)
    noteLabel.set(e, l === NO_LABEL ? labelBlock([''], m.wrap, font, lh) : l)
  }
  const noteWidth = (e: SeqNote): number => noteLabel.get(e)!.width + 2 * m.padX

  // ---- gaps between neighbouring lifelines
  const gap: number[] = []
  for (let i = 0; i < n - 1; i++) gap.push(heads[i]!.width / 2 + heads[i + 1]!.width / 2 + m.nodeSep)
  const need: { a: number; b: number; v: number }[] = []
  for (const e of ast.events) {
    if (e.kind === 'message') {
      const l = labelOf.get(e)!
      const from = at(e.from)
      const to = at(e.to)
      if (from === to) {
        if (from < n - 1) need.push({ a: from, b: from + 1, v: Math.max(l.width + 14, loopW) + bw + 14 })
      } else need.push({ a: Math.min(from, to), b: Math.max(from, to), v: (l.width > 0 ? l.width + 24 : 0) + bw })
    } else if (e.kind === 'note') {
      const w = noteWidth(e)
      const first = at(e.ids[0]!)
      if (e.ids.length === 2) {
        const second = at(e.ids[1]!)
        need.push({ a: Math.min(first, second), b: Math.max(first, second), v: w - 2 * spanHang })
      } else if (e.side === 'over') {
        if (first > 0) need.push({ a: first - 1, b: first, v: w / 2 + 12 })
        if (first < n - 1) need.push({ a: first, b: first + 1, v: w / 2 + 12 })
      } else if (e.side === 'left') {
        if (first > 0) need.push({ a: first - 1, b: first, v: w + bw / 2 + 20 })
      } else if (first < n - 1) need.push({ a: first, b: first + 1, v: w + bw / 2 + 20 })
    }
  }
  need.sort((x, y) => x.b - x.a - (y.b - y.a))
  for (const c of need) {
    let have = 0
    for (let k = c.a; k < c.b; k++) have += gap[k]!
    if (have >= c.v) continue
    const add = (c.v - have) / (c.b - c.a)
    for (let k = c.a; k < c.b; k++) gap[k] = gap[k]! + add
  }
  const rel: number[] = [0]
  for (let i = 1; i < n; i++) rel.push(rel[i - 1]! + gap[i - 1]!)
  const contentW = rel[n - 1]! + heads[0]!.width / 2 + heads[n - 1]!.width / 2

  const longRun = messages.length > REPEAT_ABOVE

  const draw = (off: number): Drawn => {
    const X = (i: number): number => off + rel[i]!
    let minX = Infinity
    let maxX = -Infinity
    let maxY = 0
    const frames: { depth: number; item: RenderItem }[] = []
    const lifelines: RenderItem[] = []
    const bars: RenderItem[] = []
    const noteShapes: RenderItem[] = []
    const arrows: RenderItem[] = []
    const texts: RenderItem[] = []
    const headItems: RenderItem[] = []
    const act: number[][] = parts.map(() => [])
    const stack: Pending[] = []
    let y = m.margin + headerH + pad * 0.5

    const touch = (x1: number, x2: number, y2: number): void => {
      minX = Math.min(minX, x1)
      maxX = Math.max(maxX, x2)
      maxY = Math.max(maxY, y2)
    }
    const ext = (x1: number, x2: number): void => {
      touch(x1, x2, y)
      const top = stack[stack.length - 1]
      if (top) {
        top.minX = Math.min(top.minX, x1)
        top.maxX = Math.max(top.maxX, x2)
      }
    }
    const text = (x: number, cy: number, l: Label | string[], anchor: 'middle' | 'start', role: string, extra: Partial<RText> = {}): void => {
      const lines = Array.isArray(l) ? l : l.lines
      const w = Math.max(...lines.map((s) => measureText(s, font, extra.bold)))
      const x1 = anchor === 'middle' ? x - w / 2 : x
      touch(x1, x1 + w, cy + (lines.length * lh) / 2)
      texts.push({ kind: 'text', role, x: r2(x), y: r2(cy), lines, anchor, size: font, ...extra })
    }
    const box = (x: number, top: number, w: number, h: number, role: string, paint: RShape['paint'], radius = m.radius): void => {
      touch(x, x + w, top + h)
      const item: RShape = { kind: 'shape', role, d: rectPath({ x, y: top, width: w, height: h }, radius), paint }
      if (role === 'note') noteShapes.push(item)
      else headItems.push(item)
    }
    const barLeft = (i: number, count: number): number => (count > 0 ? X(i) - bw / 2 : X(i))
    const barRight = (i: number, count: number): number => (count > 0 ? X(i) + bw / 2 + ((count - 1) * bw) / 2 : X(i))

    const drawHead = (i: number, top: number): void => {
      const h = heads[i]!
      const x = X(i)
      if (parts[i]!.actor) {
        const t = top + headerH - actorH
        const r = figure * 0.2
        const shoulder = t + 2 * r + figure * 0.1
        const hip = t + figure * 0.64
        const arm = figure * 0.3
        const leg = figure * 0.26
        touch(x - h.width / 2, x + h.width / 2, t + h.height)
        headItems.push({ kind: 'shape', role: 'actor-head', d: `M${r2(x - r)},${r2(t + r)}A${r2(r)},${r2(r)} 0 1 0 ${r2(x + r)},${r2(t + r)}A${r2(r)},${r2(r)} 0 1 0 ${r2(x - r)},${r2(t + r)}Z`, paint: { fill: 'surface', tone, stroke: 'normal' } })
        headItems.push({
          kind: 'path',
          role: 'actor-body',
          d: `M${r2(x)},${r2(t + 2 * r)}V${r2(hip)}M${r2(x - arm)},${r2(shoulder)}H${r2(x + arm)}M${r2(x)},${r2(hip)}L${r2(x - leg)},${r2(t + figure)}M${r2(x)},${r2(hip)}L${r2(x + leg)},${r2(t + figure)}`,
          style: 'solid',
          tone,
        })
        text(x, t + figure + 4 + h.text.height / 2, h.text, 'middle', 'participant-label')
      } else {
        const t = top + headerH - boxH
        box(x - h.width / 2, t, h.width, boxH, 'participant', { fill: 'surface', tone, stroke: 'normal' })
        text(x, t + boxH / 2, h.text, 'middle', 'participant-label')
      }
    }
    for (let i = 0; i < n; i++) drawHead(i, m.margin)

    const closeBar = (i: number, y2: number): void => {
      const y1 = act[i]!.pop()
      if (y1 === undefined) return
      const level = act[i]!.length
      const end = Math.max(y2, y1 + pad)
      const x = X(i) - bw / 2 + (level * bw) / 2
      touch(x, x + bw, end)
      bars.push({ kind: 'shape', role: 'activation', d: rectPath({ x, y: y1, width: bw, height: end - y1 }, Math.min(m.radius, 2)), paint: { fill: 'surface', tone, stroke: 'thin' } })
    }

    const tabWidth = (kw: string): number => measureText(kw, font, true) + 2 * Math.round(m.padX * 0.6)
    const condLabel = (t: string, used: number): Label => {
      const cleaned = cleanLabel(t).join(' ').trim()
      return cleaned === '' ? NO_LABEL : labelBlock([`[${cleaned}]`], Math.max(m.wrap, contentW - used), font, lh)
    }

    const openBlock = (e: SeqBlockStart): void => {
      const tabW = tabWidth(e.block)
      const cond = condLabel(e.text, tabW + 24)
      const startY = y + pad
      stack.push({ kw: e.block, startY, minX: Infinity, maxX: -Infinity, depth: stack.length, tabW, cond, branches: [] })
      y = startY + Math.max(lh + 4, cond.height + 4)
    }
    const branch = (e: SeqBranch): void => {
      const top = stack[stack.length - 1]!
      const cond = condLabel(e.text, measureText(e.branch, font, true) + 32)
      const dividerY = y + pad
      top.branches.push({ y: dividerY, kw: e.branch, cond })
      y = dividerY + Math.max(lh + 4, cond.height + 4)
    }
    const closeBlock = (): void => {
      const b = stack.pop()!
      y += pad
      let x1 = (Number.isFinite(b.minX) ? b.minX : X(0)) - 10
      let x2 = (Number.isFinite(b.maxX) ? b.maxX : X(n - 1)) + 10
      let headW = b.tabW + 16 + b.cond.width
      for (const br of b.branches) headW = Math.max(headW, measureText(br.kw, font, true) + 16 + br.cond.width)
      x2 = Math.max(x2, x1 + headW + 8)
      x1 = r2(x1)
      x2 = r2(x2)
      touch(x1, x2, y)
      const parent = stack[stack.length - 1]
      if (parent) {
        parent.minX = Math.min(parent.minX, x1 - 6)
        parent.maxX = Math.max(parent.maxX, x2 + 6)
      }
      frames.push({ depth: b.depth, item: { kind: 'shape', role: 'block', d: rectPath({ x: x1, y: b.startY, width: x2 - x1, height: y - b.startY }, Math.min(m.radius, 6)), paint: { fill: 'none', tone: 'neutral', stroke: 'thin' } } })
      const tabH = lh + 4
      frames.push({ depth: b.depth, item: { kind: 'shape', role: 'block-tab', d: rectPath({ x: x1, y: b.startY, width: b.tabW, height: tabH }, Math.min(m.radius, 4)), paint: { fill: 'muted', tone: 'neutral', stroke: 'thin' } } })
      text(x1 + b.tabW / 2, b.startY + tabH / 2, [b.kw], 'middle', 'block-keyword', { bold: true })
      if (b.cond.lines.length) text(x1 + b.tabW + 8, b.startY + 2 + b.cond.height / 2, b.cond, 'start', 'block-condition')
      for (const br of b.branches) {
        arrows.push({ kind: 'path', role: 'block-divider', d: `M${r2(x1)},${r2(br.y)}H${r2(x2)}`, style: 'dashed' })
        text(x1 + 8, br.y + 2 + lh / 2, [br.kw], 'start', 'block-keyword', { bold: true })
        if (br.cond.lines.length) text(x1 + 8 + measureText(br.kw, font, true) + 8, br.y + 2 + br.cond.height / 2, br.cond, 'start', 'block-condition')
      }
    }

    for (const e of ast.events) {
      switch (e.kind) {
        case 'message': {
          const l = labelOf.get(e)!
          const from = at(e.from)
          const to = at(e.to)
          const top = y + pad
          const ay = top + (l.height > 0 ? l.height + 4 : lh * 0.4)
          const before = act[from]!.length
          const after = act[to]!.length + (e.activate ? 1 : 0)
          const marker = MARKER[e.head]
          const common = { kind: 'path' as const, role: 'message', style: e.line, markerEnd: marker, markerStart: e.both ? ('arrow' as const) : undefined }
          if (from === to) {
            const x = barRight(from, Math.max(before, after))
            y = ay
            ext(X(from) - bw / 2, x + loopW)
            if (l.height > 0) {
              ext(x + 10, x + 10 + l.width)
              text(x + 10, top + l.height / 2, l, 'start', 'message-label')
            }
            arrows.push({ ...common, d: `M${r2(x)},${r2(ay)}H${r2(x + loopW)}V${r2(ay + loopH)}H${r2(x)}` })
            y = ay + loopH
          } else {
            const right = X(to) > X(from)
            const xs = right ? barRight(from, before) : barLeft(from, before)
            const xe = right ? barLeft(to, after) : barRight(to, after)
            y = ay
            ext(Math.min(X(from), X(to)) - bw / 2, Math.max(X(from), X(to)) + bw / 2)
            if (l.height > 0) {
              ext((xs + xe) / 2 - l.width / 2, (xs + xe) / 2 + l.width / 2)
              text((xs + xe) / 2, top + l.height / 2, l, 'middle', 'message-label')
            }
            arrows.push({ ...common, d: `M${r2(xs)},${r2(ay)}H${r2(xe)}` })
          }
          if (e.activate) act[to]!.push(ay)
          if (e.deactivate) closeBar(from, ay)
          break
        }
        case 'note': {
          const l = noteLabel.get(e)!
          const w = noteWidth(e)
          const h = l.height + 2 * noteInset
          const first = at(e.ids[0]!)
          const top = y + pad
          let x1: number
          let width = w
          if (e.ids.length === 2) {
            const second = at(e.ids[1]!)
            x1 = Math.min(X(first), X(second)) - spanHang
            width = Math.max(w, Math.abs(X(first) - X(second)) + 2 * spanHang)
          } else if (e.side === 'over') x1 = X(first) - w / 2
          else if (e.side === 'left') x1 = barLeft(first, act[first]!.length) - 8 - w
          else x1 = barRight(first, act[first]!.length) + 8
          y = top + h
          ext(x1, x1 + width)
          box(x1, top, width, h, 'note', { fill: 'muted', tone: 'neutral', stroke: 'thin' }, Math.min(m.radius, 4))
          text(x1 + width / 2, top + h / 2, l, 'middle', 'note-label')
          break
        }
        case 'activate':
          act[at(e.id)]!.push(y + pad * 0.5)
          break
        case 'deactivate':
          closeBar(at(e.id), y)
          break
        case 'block':
          openBlock(e)
          break
        case 'branch':
          branch(e)
          break
        default:
          closeBlock()
      }
    }

    y += pad * 1.5
    const lifeEnd = y
    const bottomTop = longRun ? y : undefined
    for (let i = 0; i < n; i++) {
      while (act[i]!.length) closeBar(i, lifeEnd)
      const start = m.margin + headerH
      lifelines.push({ kind: 'path', role: 'lifeline', d: `M${r2(X(i))},${r2(start)}V${r2(lifeEnd)}`, style: 'dashed', faint: true, id: `lifeline-${i}` })
    }
    touch(X(0), X(n - 1), lifeEnd)
    if (bottomTop !== undefined) for (let i = 0; i < n; i++) drawHead(i, bottomTop)

    frames.sort((a, b) => a.depth - b.depth)
    return { items: [...frames.map((f) => f.item), ...headItems, ...lifelines, ...bars, ...noteShapes, ...arrows, ...texts], minX, maxX, maxY }
  }

  const nameOf = (id: string): string => {
    const p = parts[at(id)]!
    return cleanLabel(p.label).join(' ').trim() || p.id
  }
  const first = draw(0)
  const done = draw(m.margin - first.minX)
  const width = Math.ceil(done.maxX + m.margin)
  const height = Math.ceil(done.maxY + m.margin)

  return {
    type: 'sequence',
    title: ast.meta.title,
    width,
    height,
    items: done.items,
    alt: { sections: altSections(ast, nameOf) },
    summary: `Sequence diagram with ${plural(n, 'participant')} and ${plural(messages.length, 'message')}`,
    nodes: n,
    edges: messages.length,
    fontSize: font,
  }
}

function altSections(ast: SequenceAst, nameOf: (id: string) => string): TextAlt['sections'] {
  const people = ast.participants.map((p) => `${nameOf(p.id)}${p.actor ? ' (actor)' : ''}`)
  const flat = (t: string): string => cleanLabel(t).join(' ').trim()
  const ctx: string[] = []
  const starts: number[] = []
  const items: string[] = []
  const prefix = (): string => (ctx.length ? `${ctx.join(' ')} ` : '')
  for (const e of ast.events) {
    switch (e.kind) {
      case 'message': {
        const kinds: string[] = []
        if (e.line === 'dashed') kinds.push('reply')
        if (e.head === 'cross') kinds.push('lost')
        else if (e.head === 'open') kinds.push('async')
        else if (e.head === 'none') kinds.push('no arrowhead')
        if (e.both) kinds.push('both directions')
        if (e.activate) kinds.push(`activates ${nameOf(e.to)}`)
        if (e.deactivate) kinds.push(`deactivates ${nameOf(e.from)}`)
        const text = flat(e.text)
        items.push(`${e.num === undefined ? '' : `#${e.num} `}${prefix()}${nameOf(e.from)} to ${nameOf(e.to)}${text ? `: ${text}` : ''}${kinds.length ? ` (${kinds.join(', ')})` : ''}`)
        break
      }
      case 'note': {
        const side = e.side === 'over' ? 'over' : `${e.side} of`
        items.push(`${prefix()}Note ${side} ${e.ids.map(nameOf).join(', ')}: ${flat(e.text)}`)
        break
      }
      case 'activate':
      case 'deactivate':
        items.push(`${prefix()}${e.kind === 'activate' ? 'Activate' : 'Deactivate'} ${nameOf(e.id)}`)
        break
      case 'block':
        ctx.push(`[${e.block}${flat(e.text) ? ` ${flat(e.text)}` : ''}]`)
        starts.push(items.length)
        break
      case 'branch':
        ctx[ctx.length - 1] = `[${e.branch}${flat(e.text) ? ` ${flat(e.text)}` : ''}]`
        break
      default:
        if (starts.pop() === items.length) items.push(`${prefix()}(nothing happens in this block)`)
        ctx.pop()
    }
  }
  return [
    { title: 'Participants', ordered: true, items: people },
    { title: 'Messages', ordered: true, items },
  ]
}
