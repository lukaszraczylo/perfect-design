import { DIRECTION_PHRASE, checkLimits, drawGraph, rectPath, type GraphCluster, type GraphEdge, type GraphNode } from '../../_diagram/graph'
import type { Box } from '../../_diagram/shapes'
import { MARKERS } from '../../_diagram/palette'
import { interpretStyle, mergeStyles, type NodeStyle } from '../../_diagram/style'
import { cleanLabel, decodeEntities, labelBlock, measureText, plural, r2 } from '../../_diagram/text'
import { ParseFail, type Marker, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions, type RShape, type RText, type TextAlt } from '../../_diagram/types'
import type { ClassDef, ClassMember, ClassRelation, ClassAst } from '../parse/class'

export function classStyle(ast: ClassAst, def: ClassDef): NodeStyle {
  const parts: NodeStyle[] = [interpretStyle(ast.classDefs.default)]
  for (const name of def.classes) parts.push(interpretStyle(ast.classDefs[name], name))
  return mergeStyles(...parts)
}

/** Name shown in the header and read by assistive technology: the label when given, else the id, plus `<T>`. */
export function classTitle(def: ClassDef): string {
  const base = def.label ? cleanLabel(def.label).join(' ') : decodeEntities(def.id)
  return def.generic ? `${base}<${def.generic}>` : base
}

type Pt = [number, number]
interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Every coordinate pair of a path made only of move, line, curve and quadratic commands, in drawing order. */
function pathPoints(d: string): Pt[] {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
  const pts: Pt[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!])
  return pts
}

/** First and last point of an edge path, with the neighbour of each for direction. */
function pathEnds(pts: Pt[]): { start: Pt; afterStart: Pt; end: Pt; beforeEnd: Pt } {
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  const near = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.5
  return {
    start: first,
    afterStart: pts.find((p) => near(p, first)) ?? first,
    end: last,
    beforeEnd: [...pts].reverse().find((p) => near(p, last)) ?? last,
  }
}

/** Box of an edge label plate (a rounded rectangle written with M, H, A and V commands only). */
function plateBox(d: string): Rect {
  const xs: number[] = []
  const ys: number[] = []
  for (const c of d.matchAll(/([MHVA])([^MHVAZ]*)/g)) {
    const n = c[2]!.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    if (c[1] === 'M') (xs.push(n[0]!), ys.push(n[1]!))
    else if (c[1] === 'H') xs.push(n[0]!)
    else if (c[1] === 'V') ys.push(n[0]!)
    else (xs.push(n[5]!), ys.push(n[6]!))
  }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

/** Does the segment p-q cross or lie inside the rectangle (Liang-Barsky clipping). */
function segmentHits(p: Pt, q: Pt, r: Rect): boolean {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  let t0 = 0
  let t1 = 1
  const checks: Pt[] = [[-dx, p[0] - r.x0], [dx, r.x1 - p[0]], [-dy, p[1] - r.y0], [dy, r.y1 - p[1]]]
  for (const [pp, qq] of checks) {
    if (pp === 0) {
      if (qq < 0) return false
    } else {
      const t = qq / pp
      if (pp < 0) {
        if (t > t1) return false
        t0 = Math.max(t0, t)
      } else {
        if (t < t0) return false
        t1 = Math.min(t1, t)
      }
    }
  }
  return true
}

function describe(r: ClassRelation, a: string, b: string): string {
  const L = r.fromEnd
  const R = r.toEnd
  if (!r.dashed) {
    if (L === 'triangle' && !R) return `${b} inherits from ${a}`
    if (R === 'triangle' && !L) return `${a} inherits from ${b}`
    if (L === 'diamond-filled' && !R) return `${a} is composed of ${b}`
    if (R === 'diamond-filled' && !L) return `${b} is composed of ${a}`
    if (L === 'diamond' && !R) return `${a} aggregates ${b}`
    if (R === 'diamond' && !L) return `${b} aggregates ${a}`
    if (R === 'open' && !L) return `${a} is associated with ${b}`
    if (L === 'open' && !R) return `${b} is associated with ${a}`
    return `${a} is linked to ${b}`
  }
  if (L === 'triangle' && !R) return `${b} implements ${a}`
  if (R === 'triangle' && !L) return `${a} implements ${b}`
  if (R === 'open' && !L) return `${a} depends on ${b}`
  if (L === 'open' && !R) return `${b} depends on ${a}`
  return `${a} has a dashed link to ${b}`
}

export function renderClass(ast: ClassAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.classes.length === 0) throw new ParseFail(1, 1, 'This class diagram has no classes. Add one such as "class Animal" or "Animal <|-- Dog".', 'empty')
  checkLimits(ast.classes.length, ast.relations.length, opts)
  const direction = opts.direction ?? ast.direction
  const byId = new Map(ast.classes.map((c) => [c.id, c]))
  const cid = (id: string) => `c:${id}`
  const nsId = (id: string) => `ns:${id}`
  const usedNamespaces = new Set(ast.classes.map((c) => c.namespace).filter((n): n is string => !!n))

  const lh = m.lineHeight
  const headPad = Math.round(m.padY * 0.8)
  const rowPad = Math.round(m.padY * 0.6)

  const nodes: GraphNode[] = ast.classes.map((def) => {
    const style = classStyle(ast, def)
    const paint: Paint = { fill: 'surface', tone: style.tone ?? opts.tone ?? 'neutral', stroke: style.thick ? 'thick' : 'normal', dash: style.dashed ? 'dashed' : undefined }
    const title = classTitle(def)
    const notes = def.annotations.map((a) => `<<${a}>>`)
    const italicName = def.annotations.some((a) => a.toLowerCase() === 'abstract')
    const compartments: ClassMember[][] = [def.attributes, def.methods].filter((c) => c.length > 0)
    const widest = Math.max(
      measureText(title, m.font, true),
      ...notes.map((n) => measureText(n, m.font)),
      ...compartments.flat().map((x) => measureText(x.text, m.font)),
    )
    const width = Math.max(widest + 2 * m.padX, m.font * 7)
    const headH = (notes.length + 1) * lh + 2 * headPad
    const height = headH + compartments.reduce((sum, c) => sum + c.length * lh + 2 * rowPad, 0)
    return {
      id: cid(def.id),
      width,
      height,
      parent: def.namespace ? nsId(def.namespace) : undefined,
      draw: (box: Box): RenderItem[] => {
        const cx = r2(box.x + box.width / 2)
        const rule = (y: number): RenderItem => ({ kind: 'path', role: 'class-divider', d: `M${r2(box.x)},${r2(y)}H${r2(box.x + box.width)}`, style: 'solid', faint: true })
        const items: RenderItem[] = [{ kind: 'shape', role: 'node', id: def.id, d: rectPath(box, Math.min(m.radius, 8)), paint }]
        let y = box.y + headPad
        if (notes.length) items.push({ kind: 'text', role: 'class-annotation', x: cx, y: r2(y + (notes.length * lh) / 2), lines: notes, anchor: 'middle', size: m.font, muted: true })
        y += notes.length * lh
        items.push({ kind: 'text', role: 'node-label', x: cx, y: r2(y + lh / 2), lines: [title], anchor: 'middle', size: m.font, bold: true, italic: italicName || undefined })
        y += lh + headPad
        for (const members of compartments) {
          items.push(rule(y))
          y += rowPad
          for (const mem of members) {
            const t: RText = { kind: 'text', role: mem.kind === 'method' ? 'class-method' : 'class-attribute', x: r2(box.x + m.padX), y: r2(y + lh / 2), lines: [mem.text], anchor: 'start', size: m.font }
            if (mem.abstract) t.italic = true
            items.push(t)
            y += lh
          }
          y += rowPad
        }
        return items
      },
    }
  })

  const noteAt = Math.round(m.font * 0.8)
  for (const n of ast.notes) {
    const block = labelBlock(cleanLabel(n.text), m.wrap, m.font, lh)
    const target = n.target ? byId.get(n.target) : undefined
    nodes.push({
      id: `n:${n.index}`,
      width: block.width + 2 * m.padX + noteAt / 2,
      height: block.height + 2 * m.padY,
      parent: target?.namespace ? nsId(target.namespace) : undefined,
      draw: (box: Box): RenderItem[] => {
        const { x, y, width: w, height: h } = box
        const c = Math.min(noteAt, h / 2, w / 2)
        return [
          { kind: 'shape', role: 'note', id: `note${n.index}`, d: `M${r2(x)},${r2(y)}H${r2(x + w - c)}L${r2(x + w)},${r2(y + c)}V${r2(y + h)}H${r2(x)}Z`, paint: { fill: 'muted', tone: 'neutral', stroke: 'thin' } },
          { kind: 'path', role: 'note-fold', d: `M${r2(x + w - c)},${r2(y)}V${r2(y + c)}H${r2(x + w)}`, style: 'solid', faint: true },
          { kind: 'text', role: 'note-text', x: r2(x + m.padX), y: r2(y + h / 2), lines: block.lines, anchor: 'start', size: m.font },
        ]
      },
    })
  }

  const clusters: GraphCluster[] = [...usedNamespaces].map((id) => ({ id: nsId(id), title: id }))

  const edgeStyle = opts.edgeStyle ?? 'curved'
  const horizontal = direction === 'LR' || direction === 'RL'
  const reverse = direction === 'BT' || direction === 'RL'

  // room a relation needs along the rank axis: label plate, both cardinalities and both markers, in a row
  const markerSize = Math.round(m.font * 0.75)
  const markerLen = (k: Marker | undefined) => (k ? (markerSize * MARKERS.find((x) => x.id === k)!.width) / 10 : 0)
  const cardH = Math.round(m.font * 1.2)
  const gap = 3
  const info = ast.relations.map((r) => {
    const lines = r.label ? cleanLabel(r.label) : []
    const block = lines.join('').trim() === '' ? undefined : labelBlock(lines, m.wrap * 0.8, m.font, lh)
    const from = r.fromCard ? decodeEntities(r.fromCard) : undefined
    const to = r.toCard ? decodeEntities(r.toCard) : undefined
    const along = (w: number, h: number) => (horizontal ? w : h)
    // each end needs its marker and cardinality; the label plate takes the middle of the line
    const side = (card: string | undefined, k: Marker | undefined) => markerLen(k) + (card ? gap + along(measureText(card, m.font), cardH) : 0)
    const labelAlong = block ? along(block.width + 10, block.height + 6) : 0
    const need = block ? labelAlong + 2 * Math.max(side(from, r.fromEnd), side(to, r.toEnd)) + 4 * gap : side(from, r.fromEnd) + side(to, r.toEnd) + 4 * gap
    return { r, from, to, hasLabel: !!block, need }
  })

  const noteEdges: GraphEdge[] = ast.notes.filter((n) => n.target).map((n) => ({ id: `q${n.index}`, from: `n:${n.index}`, to: cid(n.target!), style: 'dotted' as const }))
  const build = (lens: number[]) =>
    drawGraph(
      {
        nodes,
        edges: [
          ...ast.relations.map((r, i): GraphEdge => ({ id: `r${r.index}`, from: cid(r.from), to: cid(r.to), label: r.label, minLen: lens[i], style: r.dashed ? 'dashed' : 'solid', markerStart: r.fromEnd, markerEnd: r.toEnd })),
          ...noteEdges,
        ],
        clusters,
        direction,
      },
      m,
      edgeStyle,
    )
  const lens = info.map(() => 1)
  let drawing = build(lens)
  // measure the gap the layout really left between the two boxes; relations that are still too tight get one more rank (rank length 1 to 3, at most two extra passes)
  for (let pass = 0; pass < 2; pass++) {
    const tight = info.map(({ r, need }, i) => {
      const a = drawing.layout.nodes.get(cid(r.from))!
      const b = drawing.layout.nodes.get(cid(r.to))!
      const free = horizontal ? Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width)) : Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height))
      return r.from !== r.to && lens[i]! < 3 && free > 0 && free < need
    })
    if (!tight.includes(true)) break
    tight.forEach((t, i) => t && lens[i]!++)
    drawing = build(lens)
  }

  // cardinalities sit beside their own end of the line, clear of markers, label plates, boxes and each other
  const items = drawing.items.slice()
  const W = drawing.width
  const H = drawing.height
  const grow = (b: Rect, by: number): Rect => ({ x0: b.x0 - by, y0: b.y0 - by, x1: b.x1 + by, y1: b.y1 + by })
  const boxes: Rect[] = [...drawing.layout.nodes.values()].map((b) => ({ x0: b.x + m.margin, y0: b.y + m.margin, x1: b.x + b.width + m.margin, y1: b.y + b.height + m.margin }))
  const plates = drawing.items.filter((it): it is RShape => it.kind === 'shape' && it.role === 'edge-label-plate').map((it) => plateBox(it.d))
  const lines = new Map<string, { pts: Pt[]; box: Rect }>()
  for (const it of drawing.items) {
    if (it.kind !== 'path' || it.role !== 'edge') continue
    const pts = pathPoints(it.d)
    lines.set(it.id!, { pts, box: { x0: Math.min(...pts.map((p) => p[0])), y0: Math.min(...pts.map((p) => p[1])), x1: Math.max(...pts.map((p) => p[0])), y1: Math.max(...pts.map((p) => p[1])) } })
  }
  const unit = (at: Pt, toward: Pt): Pt => {
    const len = Math.hypot(toward[0] - at[0], toward[1] - at[1]) || 1
    return [(toward[0] - at[0]) / len, (toward[1] - at[1]) / len]
  }
  const markerRegion = (at: Pt, toward: Pt, len: number): Rect | undefined => {
    if (len === 0) return undefined
    const [ux, uy] = unit(at, toward)
    const hw = markerSize / 2 + 1
    const xs = [at[0] - uy * hw, at[0] + uy * hw, at[0] + ux * len - uy * hw, at[0] + ux * len + uy * hw]
    const ys = [at[1] + ux * hw, at[1] - ux * hw, at[1] + uy * len + ux * hw, at[1] + uy * len - ux * hw]
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
  }
  const geometry = info.map(({ r, hasLabel }) => {
    const e = pathEnds(lines.get(`r${r.index}`)!.pts)
    return { ends: e, markers: [markerRegion(e.start, e.afterStart, markerLen(r.fromEnd)), markerRegion(e.end, e.beforeEnd, markerLen(r.toEnd))].filter((x): x is Rect => !!x), hasLabel }
  })
  const markerBoxes = geometry.flatMap((g) => g.markers)
  const plateOf = new Map<number, Rect>()
  info.filter((x) => x.hasLabel).forEach((x, k) => plates[k] && plateOf.set(x.r.index, plates[k]!))
  const placed: Rect[] = []
  const step = Math.round(m.font * 0.5)

  const cardinality = (text: string, at: Pt, toward: Pt, mlen: number, plate: Rect | undefined, chord: number, self: boolean): RText => {
    const [ux, uy] = unit(at, toward)
    const nx = -uy
    const ny = ux
    const w = measureText(text, m.font)
    const alongHalf = (Math.abs(ux) * w + Math.abs(uy) * cardH) / 2
    const sideHalf = (Math.abs(nx) * w + Math.abs(ny) * cardH) / 2
    // the side without the label plate comes first
    const pref = plate ? ((((plate.x0 + plate.x1) / 2 - at[0]) * nx + ((plate.y0 + plate.y1) / 2 - at[1]) * ny > 0) ? -1 : 1) : nx > 0 || (nx === 0 && ny > 0) ? 1 : -1
    const reach = self ? 4 * step : chord / 2
    let best: { x: number; y: number; score: number } | undefined
    for (let k = 0; k < 40 && best?.score !== 0; k++) {
      const along = mlen + gap + alongHalf + k * step
      if (k > 0 && along > reach) break
      for (const s of [pref, -pref]) {
        const x = at[0] + ux * along + nx * s * (sideHalf + gap)
        const y = at[1] + uy * along + ny * s * (sideHalf + gap)
        const r: Rect = { x0: x - w / 2, y0: y - cardH / 2, x1: x + w / 2, y1: y + cardH / 2 }
        const padded = grow(r, 1)
        const hard =
          (r.x0 < 0 || r.y0 < 0 || r.x1 > W || r.y1 > H ? 1 : 0) +
          [...boxes, ...plates, ...placed, ...markerBoxes].filter((o) => overlaps(padded, o)).length
        let soft = 0
        for (const l of lines.values()) {
          if (!overlaps(padded, l.box)) continue
          for (let i = 1; i < l.pts.length; i++) if (segmentHits(l.pts[i - 1]!, l.pts[i]!, padded)) soft++
        }
        const score = hard * 1000 + soft
        if (!best || score < best.score) best = { x, y, score }
        if (score === 0) break
      }
    }
    const x = Math.min(Math.max(best!.x, w / 2 + 1), Math.max(W - w / 2 - 1, w / 2 + 1))
    const y = Math.min(Math.max(best!.y, cardH / 2 + 1), Math.max(H - cardH / 2 - 1, cardH / 2 + 1))
    placed.push({ x0: x - w / 2, y0: y - cardH / 2, x1: x + w / 2, y1: y + cardH / 2 })
    return { kind: 'text', role: 'cardinality', x: r2(x), y: r2(y), lines: [text], anchor: 'middle', size: m.font }
  }
  info.forEach(({ r, from, to }, i) => {
    const { ends } = geometry[i]!
    const plate = plateOf.get(r.index)
    const chord = Math.hypot(ends.end[0] - ends.start[0], ends.end[1] - ends.start[1])
    const self = r.from === r.to
    if (from) items.push(cardinality(from, ends.start, ends.afterStart, markerLen(r.fromEnd), plate, chord, self))
    if (to) items.push(cardinality(to, ends.end, ends.beforeEnd, markerLen(r.toEnd), plate, chord, self))
  })

  // text alternative
  const positioned = ast.classes
    .map((def) => ({ def, box: drawing.layout.nodes.get(cid(def.id))! }))
    .sort((a, b) => {
      const k = reverse ? -1 : 1
      const pa = (horizontal ? a.box.x : a.box.y) * k
      const pb = (horizontal ? b.box.x : b.box.y) * k
      const ca = horizontal ? a.box.y : a.box.x
      const cb = horizontal ? b.box.y : b.box.x
      return Math.abs(pa - pb) > 1 ? pa - pb : ca - cb
    })
  const memberText = (x: ClassMember) => (x.abstract ? `${x.text} (abstract)` : x.text)
  const classItems = positioned.map(({ def }) => {
    const tags = [...def.annotations, def.namespace ? `in namespace ${def.namespace}` : ''].filter(Boolean).join(', ')
    const parts = [
      def.attributes.length ? `attributes ${def.attributes.map(memberText).join(', ')}` : '',
      def.methods.length ? `methods ${def.methods.map(memberText).join(', ')}` : '',
    ].filter(Boolean)
    return `${classTitle(def)}${tags ? ` (${tags})` : ''}${parts.length ? `: ${parts.join('; ')}` : ''}`
  })
  const nameOf = (id: string) => classTitle(byId.get(id)!)
  const relationItems = ast.relations.map((r) => {
    const cards = [r.fromCard ? `${nameOf(r.from)}: ${r.fromCard}` : '', r.toCard ? `${nameOf(r.to)}: ${r.toCard}` : ''].filter(Boolean).join(', ')
    const label = r.label ? cleanLabel(r.label).join(' ') : ''
    return `${describe(r, nameOf(r.from), nameOf(r.to))}${label ? `: ${label}` : ''}${cards ? ` (cardinality ${cards})` : ''}`
  })
  const sections: TextAlt['sections'] = [
    { title: 'Classes', ordered: true, items: classItems },
    { title: 'Relationships', ordered: false, items: relationItems },
  ]
  if (ast.notes.length) {
    sections.push({ title: 'Notes', ordered: false, items: ast.notes.map((n) => `${n.target ? `Note for ${nameOf(n.target)}` : 'Note'}: ${cleanLabel(n.text).join(' ')}`) })
  }

  const spaces = usedNamespaces.size ? `, in ${plural(usedNamespaces.size, 'namespace')}` : ''
  return {
    type: 'class',
    title: ast.meta.title,
    width: drawing.width,
    height: drawing.height,
    items,
    alt: { sections },
    summary: `Class diagram with ${plural(ast.classes.length, 'class', 'classes')} and ${plural(ast.relations.length, 'relationship')}${spaces}, ${DIRECTION_PHRASE[direction]}`,
    nodes: ast.classes.length,
    edges: ast.relations.length,
    fontSize: m.font,
  }
}
