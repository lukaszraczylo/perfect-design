/**
 * Draws a graph (nodes, edges, clusters) as render items: layout, edge routing, label plates, cluster frames. The
 * flowchart, state, class and entity-relationship renderers all feed it; each node brings its own `draw` function, so
 * shapes with compartments (classes, entities) share the same layout and routing as plain boxes.
 */
import { layoutGraph, type LayoutResult } from './layout'
import { assignPorts, edgeMidpoint, routeEdge } from './route'
import type { Box, NodeShape } from './shapes'
import { cleanLabel, labelBlock, r2 } from './text'
import { ParseFail, type Direction, type EdgeStyle, type Marker, type Metrics, type Paint, type PaintTone, type Point, type RPath, type RenderItem, type RenderOptions, type RShape, type RText } from './types'

export interface GraphNode {
  id: string
  width: number
  height: number
  /** Outline used to clip edges. Defaults to a rectangle. */
  shape?: NodeShape
  parent?: string
  draw: (box: Box) => RenderItem[]
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  /** Label text (plain, may contain line breaks as `<br>`). */
  label?: string
  minLen?: number
  style: 'solid' | 'dashed' | 'dotted'
  thick?: boolean
  markerStart?: Marker
  markerEnd?: Marker
  /** Takes part in the layout but is not drawn. */
  hidden?: boolean
  tone?: PaintTone
}

export interface GraphCluster {
  id: string
  parent?: string
  title: string
  direction?: Direction
  /** Extra text drawn under the title (class diagram namespaces and similar). */
  paint?: Paint
}

export interface GraphSpec {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters?: GraphCluster[]
  direction: Direction
}

export interface GraphDrawing {
  items: RenderItem[]
  width: number
  height: number
  layout: LayoutResult
}

const shift = (b: Box, dx: number, dy: number): Box => ({ ...b, x: b.x + dx, y: b.y + dy })

export function rectPath(b: Box, r = 0): string {
  const rr = Math.max(0, Math.min(r, b.width / 2, b.height / 2))
  const { x, y, width: w, height: h } = b
  if (rr === 0) return `M${r2(x)},${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`
  return `M${r2(x + rr)},${r2(y)}H${r2(x + w - rr)}A${rr},${rr} 0 0 1 ${r2(x + w)},${r2(y + rr)}V${r2(y + h - rr)}A${rr},${rr} 0 0 1 ${r2(x + w - rr)},${r2(y + h)}H${r2(x + rr)}A${rr},${rr} 0 0 1 ${r2(x)},${r2(y + h - rr)}V${r2(y + rr)}A${rr},${rr} 0 0 1 ${r2(x + rr)},${r2(y)}Z`
}

/** Throws a `limit` error when the diagram exceeds `maxNodes` or `maxEdges`. */
export function checkLimits(nodes: number, edges: number, opts: RenderOptions): void {
  const maxNodes = opts.maxNodes ?? 300
  const maxEdges = opts.maxEdges ?? 600
  if (nodes > maxNodes) throw new ParseFail(1, 1, `This diagram has ${nodes} nodes, more than the limit of ${maxNodes}. Raise maxNodes or split the diagram.`, 'limit')
  if (edges > maxEdges) throw new ParseFail(1, 1, `This diagram has ${edges} connections, more than the limit of ${maxEdges}. Raise maxEdges or split the diagram.`, 'limit')
}

export function drawGraph(spec: GraphSpec, m: Metrics, edgeStyle: EdgeStyle): GraphDrawing {
  const labelFont = m.font
  const edgeLabels = new Map<string, { lines: string[]; width: number; height: number }>()
  for (const e of spec.edges) {
    if (!e.label || e.hidden) continue
    const lines = cleanLabel(e.label)
    if (lines.join('').trim() === '') continue
    const block = labelBlock(lines, m.wrap * 0.8, labelFont, m.lineHeight)
    edgeLabels.set(e.id, { lines: block.lines, width: block.width + 10, height: block.height + 6 })
  }
  const clusters = spec.clusters ?? []
  const layout = layoutGraph(
    spec.nodes.map((n) => ({ id: n.id, width: n.width, height: n.height, shape: n.shape, parent: n.parent })),
    spec.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, minLen: e.minLen, label: edgeLabels.get(e.id) && { width: edgeLabels.get(e.id)!.width, height: edgeLabels.get(e.id)!.height } })),
    clusters.map((c) => {
      const lines = cleanLabel(c.title)
      const block = labelBlock(lines, m.wrap * 1.6, m.font, m.lineHeight, true)
      return { id: c.id, parent: c.parent, titleWidth: block.width + m.padX, titleHeight: block.height + m.padY * 0.6, direction: c.direction }
    }),
    { direction: spec.direction, nodeSep: m.nodeSep, rankSep: m.rankSep, clusterPad: Math.round(m.padX * 0.9), loopSize: 26 },
  )
  const dx = m.margin
  const dy = m.margin
  const items: RenderItem[] = []

  // clusters outer first so inner ones paint on top
  const depth = (id: string): number => {
    let d = 0
    let p = clusters.find((c) => c.id === id)?.parent
    while (p && d < 50) {
      d++
      p = clusters.find((c) => c.id === p)?.parent
    }
    return d
  }
  const ordered = clusters.toSorted((a, b) => depth(a.id) - depth(b.id))
  for (const c of ordered) {
    const box = layout.clusters.get(c.id)
    if (!box) continue
    const b = shift(box, dx, dy)
    items.push({ kind: 'shape', role: 'cluster', id: c.id, d: rectPath(b, Math.min(m.radius, 10)), paint: c.paint ?? { fill: 'muted', tone: 'neutral', stroke: 'thin', dash: 'dashed' } })
    const lines = cleanLabel(c.title)
    const block = labelBlock(lines, m.wrap * 1.6, m.font, m.lineHeight, true)
    items.push({ kind: 'text', role: 'cluster-title', x: r2(b.x + b.width / 2), y: r2(b.y + box.titleHeight / 2 + m.padY * 0.3), lines: block.lines, anchor: 'middle', size: m.font, bold: true })
  }

  const nodeShape = new Map(spec.nodes.map((n) => [n.id, n.shape ?? ('rect' as NodeShape)]))
  const endpoint = (id: string) => {
    const nb = layout.nodes.get(id)
    if (nb) return { box: shift(nb, dx, dy), shape: nodeShape.get(id)! }
    const cb = layout.clusters.get(id)!
    return { box: shift(cb, dx, dy), shape: 'cluster' as const }
  }
  const labelItems: RenderItem[] = []
  const routable = spec.edges.flatMap((e) => {
    const placed = layout.edges.get(e.id)
    const known = (id: string) => layout.nodes.has(id) || layout.clusters.has(id)
    if (!placed || e.hidden || !known(e.from) || !known(e.to)) return []
    const moved = {
      ...placed,
      waypoints: placed.waypoints.map((p: Point) => ({ x: p.x + dx, y: p.y + dy })),
      label: placed.label ? shift(placed.label, dx, dy) : undefined,
    }
    return [{ e, id: e.id, placed: moved, from: endpoint(e.from), to: endpoint(e.to), fromId: e.from, toId: e.to }]
  })
  const ports = assignPorts(routable)
  // only edges that cross a group boundary need bending: the layout already routes the others around every node
  const container = new Map<string, string | undefined>([...spec.nodes.map((n) => [n.id, n.parent] as const), ...clusters.map((c) => [c.id, c.parent] as const)])
  const obstacles = [...layout.nodes.values()].map((b) => shift(b, dx, dy))
  const bounds: Box = { x: dx / 2, y: dy / 2, width: layout.width + dx, height: layout.height + dy }
  for (const { e, placed, from, to } of routable) {
    const lab = edgeLabels.get(e.id)
    const routed = routeEdge(placed, from, to, edgeStyle, 26, lab && { width: lab.width, height: lab.height }, ports.get(e.id), container.get(e.from) === container.get(e.to) ? [] : obstacles, bounds)
    const path: RPath = { kind: 'path', role: 'edge', id: e.id, d: routed.d, style: e.style, thick: e.thick, markerStart: e.markerStart, markerEnd: e.markerEnd, tone: e.tone }
    items.push(path)
    const at = lab ? (routed.label ?? edgeMidpoint(routed.points)) : undefined
    if (lab && at) {
      const plate: Box = { x: at.x - lab.width / 2, y: at.y - lab.height / 2, width: lab.width, height: lab.height }
      labelItems.push({ kind: 'shape', role: 'edge-label-plate', d: rectPath(plate, 3), paint: { fill: 'canvas', tone: 'neutral', stroke: 'none' } } satisfies RShape)
      labelItems.push({ kind: 'text', role: 'edge-label', x: r2(at.x), y: r2(at.y), lines: lab.lines, anchor: 'middle', size: labelFont } satisfies RText)
    }
  }
  for (const n of spec.nodes) {
    const b = layout.nodes.get(n.id)
    if (b) items.push(...n.draw(shift(b, dx, dy)))
  }
  items.push(...labelItems)
  return { items, width: Math.ceil(layout.width + 2 * dx), height: Math.ceil(layout.height + 2 * dy), layout }
}


export const DIRECTION_PHRASE: Record<Direction, string> = { TB: 'top to bottom', BT: 'bottom to top', LR: 'left to right', RL: 'right to left' }
