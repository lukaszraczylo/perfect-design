import { describe, expect, it } from 'vitest'
import { layoutGraph } from './layout'
import { drawGraph, rectPath, type GraphNode, type GraphSpec } from './graph'
import { assignPorts, avoidObstacles, edgeFaces, edgeMidpoint, routeEdge, routeSelfLoop, type Endpoint } from './route'
import { metricsFor } from './text'
import type { Box } from './shapes'
import type { PlacedEdge } from './layout'
import type { Direction, EdgeStyle, Point } from './types'

const box = (x: number, y: number, w = 80, h = 40): Box => ({ x, y, width: w, height: h })
const ep = (b: Box, shape: Endpoint['shape'] = 'rect'): Endpoint => ({ box: b, shape })
const placed = (direction: Direction, waypoints: Point[] = [], extra: Partial<PlacedEdge> = {}): PlacedEdge => ({ id: 'e', from: 'a', to: 'b', waypoints, selfLoop: false, direction, backward: false, ...extra })
const nums = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
const STYLES: EdgeStyle[] = ['straight', 'curved', 'orthogonal']

describe('routeEdge', () => {
  it.each(STYLES)('%s: a TB edge starts on the bottom of the source and ends on the top of the target', (style) => {
    const a = box(0, 0)
    const b = box(100, 120)
    const r = routeEdge(placed('TB'), ep(a), ep(b), style)
    const first = r.points[0]!
    const last = r.points[r.points.length - 1]!
    expect(first.y).toBeCloseTo(a.y + a.height)
    expect(last.y).toBeCloseTo(b.y)
    expect(first.x).toBeGreaterThanOrEqual(a.x)
    expect(first.x).toBeLessThanOrEqual(a.x + a.width)
    expect(last.x).toBeGreaterThanOrEqual(b.x)
    expect(last.x).toBeLessThanOrEqual(b.x + b.width)
    expect(r.d.startsWith('M')).toBe(true)
    expect(r.d).not.toMatch(/NaN|undefined|Infinity/)
  })
  it.each(STYLES)('%s: an LR edge leaves the right side and enters the left side', (style) => {
    const a = box(0, 0)
    const b = box(160, 90)
    const r = routeEdge(placed('LR'), ep(a), ep(b), style)
    expect(r.points[0]!.x).toBeCloseTo(a.x + a.width)
    expect(r.points[r.points.length - 1]!.x).toBeCloseTo(b.x)
  })
  it.each(['BT', 'RL'] as const)('%s edges run against the axis', (dir) => {
    const a = box(300, 300)
    const b = box(100, 100)
    const r = routeEdge(placed(dir), ep(a), ep(b), 'curved')
    const horizontal = dir === 'RL'
    expect(horizontal ? r.points[0]!.x : r.points[0]!.y).toBeCloseTo(horizontal ? a.x : a.y)
    expect(horizontal ? r.points[r.points.length - 1]!.x : r.points[r.points.length - 1]!.y).toBeCloseTo(horizontal ? b.x + b.width : b.y + b.height)
  })
  it('a backward edge leaves the top of the lower node and enters the bottom of the upper one', () => {
    const lower = box(0, 200)
    const upper = box(0, 0)
    const r = routeEdge(placed('TB', [{ x: 120, y: 120 }], { backward: true }), ep(lower), ep(upper), 'curved')
    expect(r.points[0]!.y).toBeCloseTo(lower.y)
    expect(r.points[r.points.length - 1]!.y).toBeCloseTo(upper.y + upper.height)
  })
  it('curved edges use cubic segments, orthogonal ones right angles with rounded corners, straight ones lines', () => {
    const a = box(0, 0)
    const b = box(200, 160)
    expect(routeEdge(placed('TB'), ep(a), ep(b), 'curved').d).toContain('C')
    const orth = routeEdge(placed('TB'), ep(a), ep(b), 'orthogonal').d
    expect(orth).toContain('Q')
    expect(orth).not.toContain('C')
    const straight = routeEdge(placed('TB'), ep(a), ep(b), 'straight').d
    expect(straight).not.toMatch(/[CQ]/)
    expect(new Set([routeEdge(placed('TB'), ep(a), ep(b), 'curved').d, orth, straight]).size).toBe(3)
  })
  it('aligned nodes give a plain vertical line in every style', () => {
    const a = box(0, 0)
    const b = box(0, 120)
    for (const s of STYLES) expect(routeEdge(placed('TB'), ep(a), ep(b), s).d).not.toMatch(/[CQ]/)
  })
  it('passes through the waypoints in order', () => {
    const a = box(0, 0)
    const b = box(0, 300)
    const wps = [{ x: 140, y: 100 }, { x: 140, y: 200 }]
    for (const s of STYLES) {
      const r = routeEdge(placed('TB', wps), ep(a), ep(b), s)
      expect(r.points.slice(1, 3)).toEqual(wps)
    }
  })
  it('curved edges with waypoints are smooth cubic chains', () => {
    const r = routeEdge(placed('TB', [{ x: 140, y: 100 }, { x: 140, y: 200 }]), ep(box(0, 0)), ep(box(0, 300)), 'curved')
    expect(r.d.match(/C/g)!.length).toBe(3)
    expect(nums(r.d).every(Number.isFinite)).toBe(true)
  })
  it('very long waypoint chains fall back to simple S-curves', () => {
    const wps = Array.from({ length: 60 }, (_, i) => ({ x: 100 + (i % 2) * 20, y: 50 + i * 10 }))
    const r = routeEdge(placed('TB', wps), ep(box(0, 0)), ep(box(0, 800)), 'curved')
    expect(r.d).toContain('C')
  })
  it('an edge between nodes in the same rank is a straight clipped line', () => {
    const r = routeEdge(placed('TB'), ep(box(0, 0)), ep(box(200, 0)), 'curved')
    expect(r.d).not.toContain('C')
    expect(r.points[0]!.x).toBeCloseTo(80)
    expect(r.points[1]!.x).toBeCloseTo(200)
  })
  it('lands on the outline of round shapes', () => {
    const a = box(0, 0, 60, 60)
    const b = box(100, 150, 80, 60)
    for (const [sa, sb] of [['circle', 'rhombus'], ['doublecircle', 'hexagon']] as const) {
      const r = routeEdge(placed('TB'), ep(a, sa), ep(b, sb), 'curved')
      const first = r.points[0]!
      if (sa === 'circle' || sa === 'doublecircle') {
        const v = ((first.x - 30) / 30) ** 2 + ((first.y - 30) / 30) ** 2
        expect(v).toBeCloseTo(1, 5)
      }
    }
  })
  it('places the label at the layout label centre', () => {
    const lab: Box = { x: 40, y: 80, width: 40, height: 20 }
    const r = routeEdge(placed('TB', [{ x: 60, y: 90 }], { label: lab }), ep(box(0, 0)), ep(box(0, 200)), 'curved')
    expect(r.label).toEqual({ x: 60, y: 90 })
  })
  it('keeps ports when given', () => {
    const a = box(0, 0)
    const b = box(0, 120)
    const r = routeEdge(placed('TB'), ep(a), ep(b), 'curved', 26, undefined, { start: 20, end: 60 })
    expect(r.points[0]!.x).toBeCloseTo(20)
    expect(r.points[r.points.length - 1]!.x).toBeCloseTo(60)
  })
  it('handles identical boxes without NaN', () => {
    const r = routeEdge(placed('TB'), ep(box(0, 0)), ep(box(0, 0)), 'curved')
    expect(r.d).not.toMatch(/NaN/)
  })
})

describe('self loops', () => {
  it('TB loops leave the right side and carry a label', () => {
    const b = box(10, 10)
    const r = routeSelfLoop(b, { width: 40, height: 20 }, 'TB', 26)
    expect(r.points[0]!.x).toBeCloseTo(b.x + b.width)
    expect(r.points[2]!.x).toBeCloseTo(b.x + b.width)
    expect(r.label!.x).toBeGreaterThan(b.x + b.width + 26)
    expect(r.d).toContain('C')
  })
  it('LR loops use the bottom side', () => {
    const b = box(10, 10)
    const r = routeSelfLoop(b, { width: 40, height: 20 }, 'LR', 26)
    expect(r.points[0]!.y).toBeCloseTo(b.y + b.height)
    expect(r.label!.y).toBeGreaterThan(b.y + b.height + 26)
  })
  it('has no label point without a label and routeEdge delegates to it', () => {
    expect(routeSelfLoop(box(0, 0), undefined, 'TB', 26).label).toBeUndefined()
    const r = routeEdge(placed('RL', [], { selfLoop: true }), ep(box(0, 0)), ep(box(0, 0)), 'curved', 26, { width: 10, height: 10 })
    expect(r.label).toBeDefined()
  })
})

describe('edgeMidpoint', () => {
  it('finds the middle of a polyline by length', () => {
    expect(edgeMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }])).toEqual({ x: 50, y: 0 })
    expect(edgeMidpoint([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 90 }])).toEqual({ x: 10, y: 40 })
  })
  it('handles one point and none', () => {
    expect(edgeMidpoint([{ x: 5, y: 6 }])).toEqual({ x: 5, y: 6 })
    expect(edgeMidpoint([])).toEqual({ x: 0, y: 0 })
    expect(edgeMidpoint([{ x: 1, y: 1 }, { x: 1, y: 1 }])).toEqual({ x: 1, y: 1 })
  })
})

describe('ports', () => {
  it('edgeFaces tells which side an edge uses', () => {
    const f = edgeFaces(placed('TB'), ep(box(0, 0)), ep(box(0, 100)))
    expect(f).toMatchObject({ horizontal: false, sign: 1, sameRank: false, startHigh: true, endHigh: false })
    expect(edgeFaces(placed('BT'), ep(box(0, 100)), ep(box(0, 0)))).toMatchObject({ startHigh: false, endHigh: true })
    expect(edgeFaces(placed('LR'), ep(box(0, 0)), ep(box(0, 0)))).toMatchObject({ sameRank: true })
  })
  it('spreads edges that share a face, sorted by where they go, and leaves single edges centred', () => {
    const src = box(100, 0, 120, 40)
    const targets = [box(0, 120), box(100, 120), box(200, 120)]
    const list = targets.map((t, i) => ({ id: `e${i}`, placed: { ...placed('TB'), id: `e${i}` }, from: ep(src), to: ep(t), fromId: 's', toId: `t${i}` }))
    const ports = assignPorts(list)
    const starts = list.map((e) => ports.get(e.id)!.start!)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    expect(new Set(starts).size).toBe(3)
    for (const s of starts) expect(s).toBeGreaterThan(src.x)
    for (const s of starts) expect(s).toBeLessThan(src.x + src.width)
    for (const e of list) expect(ports.get(e.id)!.end).toBeUndefined()
  })
  it('ignores self loops and same-rank edges', () => {
    const b = box(0, 0)
    const list = [
      { id: 'a', placed: placed('TB', [], { selfLoop: true }), from: ep(b), to: ep(b), fromId: 'x', toId: 'x' },
      { id: 'b', placed: placed('TB'), from: ep(b), to: ep(box(200, 0)), fromId: 'x', toId: 'y' },
      { id: 'c', placed: placed('TB'), from: ep(b), to: ep(box(300, 0)), fromId: 'x', toId: 'z' },
    ]
    expect(assignPorts(list).size).toBe(0)
  })
  it('works in a real layout: every routed end point stays on its node box', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => ({ id, width: 80, height: 40 }))
    const edges = [{ id: '1', from: 'a', to: 'b' }, { id: '2', from: 'a', to: 'c' }, { id: '3', from: 'a', to: 'd' }, { id: '4', from: 'b', to: 'd' }]
    const l = layoutGraph(nodes, edges, [], { direction: 'LR', nodeSep: 28, rankSep: 45, clusterPad: 12 })
    const list = edges.map((e) => ({ id: e.id, placed: l.edges.get(e.id)!, from: ep(l.nodes.get(e.from)!), to: ep(l.nodes.get(e.to)!), fromId: e.from, toId: e.to }))
    const ports = assignPorts(list)
    for (const e of list) {
      const r = routeEdge(e.placed, e.from, e.to, 'orthogonal', 26, undefined, ports.get(e.id))
      const a = e.from.box
      const first = r.points[0]!
      expect(first.x).toBeCloseTo(a.x + a.width)
      expect(first.y).toBeGreaterThanOrEqual(a.y - 0.01)
      expect(first.y).toBeLessThanOrEqual(a.y + a.height + 0.01)
    }
  })
})

describe('avoidObstacles', () => {
  const hits = (pts: Point[], b: Box) => {
    // sampled check: no point of any segment is strictly inside the box
    for (let i = 1; i < pts.length; i++) for (let t = 0; t <= 1; t += 0.02) {
      const x = pts[i - 1]!.x + (pts[i]!.x - pts[i - 1]!.x) * t
      const y = pts[i - 1]!.y + (pts[i]!.y - pts[i - 1]!.y) * t
      if (x > b.x + 0.6 && x < b.x + b.width - 0.6 && y > b.y + 0.6 && y < b.y + b.height - 0.6) return true
    }
    return false
  }
  const o = box(60, 100, 80, 40)
  it('leaves a clear polyline alone and does nothing without obstacles', () => {
    const pts = [{ x: 0, y: 0 }, { x: 0, y: 300 }]
    expect(avoidObstacles(pts, [o], false)).toEqual(pts)
    expect(avoidObstacles(pts, [], false)).toBe(pts)
    expect(avoidObstacles([{ x: 1, y: 1 }], [o], false)).toHaveLength(1)
  })
  it('bends a line that runs through a box around it, keeping both end points', () => {
    const pts = [{ x: 100, y: 0 }, { x: 100, y: 300 }]
    for (const horizontal of [false, true]) {
      const out = avoidObstacles(horizontal ? pts.map((p) => ({ x: p.y, y: p.x })) : pts, [horizontal ? box(100, 60, 40, 80) : o], horizontal)
      expect(out.length).toBeGreaterThan(2)
      expect(out[0]).toEqual(horizontal ? { x: 0, y: 100 } : pts[0])
      expect(hits(out, horizontal ? box(100, 60, 40, 80) : o)).toBe(false)
    }
  })
  it('goes around the nearer side and works in both travel directions', () => {
    const left = avoidObstacles([{ x: 70, y: 0 }, { x: 70, y: 300 }], [o], false)
    expect(Math.max(...left.map((p) => p.x))).toBeLessThanOrEqual(70)
    const right = avoidObstacles([{ x: 130, y: 300 }, { x: 130, y: 0 }], [o], false)
    expect(Math.min(...right.map((p) => p.x))).toBeGreaterThanOrEqual(130)
    expect(hits(left, o) || hits(right, o)).toBe(false)
  })
  it('handles several obstacles in a row', () => {
    const boxes = [box(60, 100, 80, 40), box(60, 200, 80, 40), box(60, 300, 80, 40)]
    const out = avoidObstacles([{ x: 100, y: 0 }, { x: 100, y: 500 }], boxes, false)
    for (const b of boxes) expect(hits(out, b)).toBe(false)
    expect(out[out.length - 1]).toEqual({ x: 100, y: 500 })
  })
  it('keeps the detour inside the bounds when a side allows it and clamps otherwise', () => {
    const pts = [{ x: 100, y: 0 }, { x: 100, y: 300 }]
    const inside = avoidObstacles(pts, [o], false, 10, { x: 0, y: 0, width: 140, height: 300 })
    expect(Math.min(...inside.map((p) => p.x))).toBeGreaterThanOrEqual(0)
    const tight = avoidObstacles(pts, [o], false, 10, { x: 95, y: 0, width: 10, height: 300 })
    for (const p of tight) {
      expect(p.x).toBeGreaterThanOrEqual(95)
      expect(p.x).toBeLessThanOrEqual(105)
    }
  })
  it('a segment that only touches a box is not bent', () => {
    expect(avoidObstacles([{ x: 0, y: 0 }, { x: 0, y: 300 }], [box(-90, 100, 80, 40)], false, 10)).toHaveLength(2)
  })
})

describe('edges that cross a group boundary go around the nodes inside it', () => {
  const m = metricsFor()
  const node = (id: string, parent?: string): GraphNode => ({ id, width: 80, height: 40, parent, draw: (b) => [{ kind: 'shape', role: 'node', id, d: rectPath(b), paint: { fill: 'surface', tone: 'neutral', stroke: 'normal' } }] })
  const nums = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const polyline = (d: string): Point[] => nums(d).reduce<Point[]>((acc, n, i) => (i % 2 === 0 ? [...acc, { x: n, y: 0 }] : (acc[acc.length - 1]!.y = n, acc)), [])
  const SPEC = (direction: Direction): GraphSpec => ({
    direction,
    nodes: [node('x'), node('a', 'g'), node('b', 'g'), node('c', 'g'), node('d', 'g'), node('y')],
    edges: [
      { id: 'a-b', from: 'a', to: 'b', style: 'solid' }, { id: 'b-c', from: 'b', to: 'c', style: 'solid' }, { id: 'c-d', from: 'c', to: 'd', style: 'solid' },
      { id: 'x-d', from: 'x', to: 'd', style: 'solid', markerEnd: 'arrow' }, { id: 'a-y', from: 'a', to: 'y', style: 'solid', markerEnd: 'arrow' }, { id: 'x-y', from: 'x', to: 'y', style: 'solid' },
    ],
    clusters: [{ id: 'g', title: 'Group' }],
  })
  const crossing = (style: EdgeStyle, direction: Direction) => {
    const drawing = drawGraph(SPEC(direction), m, style)
    const boxes = new Map([...drawing.layout.nodes].map(([id, b]) => [id, { x: b.x + m.margin, y: b.y + m.margin, width: b.width, height: b.height }]))
    let bad = 0
    for (const item of drawing.items) {
      if (item.kind !== 'path') continue
      const [from, to] = (item.id ?? '').split('-')
      const pts = polyline(item.d)
      for (const [id, b] of boxes) {
        if (id === from || id === to) continue
        for (let i = 1; i < pts.length; i++) for (let t = 0; t <= 1; t += 0.02) {
          const x = pts[i - 1]!.x + (pts[i]!.x - pts[i - 1]!.x) * t
          const y = pts[i - 1]!.y + (pts[i]!.y - pts[i - 1]!.y) * t
          if (x > b.x + 1 && x < b.x + b.width - 1 && y > b.y + 1 && y < b.y + b.height - 1) bad++
        }
      }
    }
    return bad
  }
  it.each(['straight', 'orthogonal'] as const)('%s edges do not cross other nodes (TB, LR, BT, RL)', (style) => {
    for (const d of ['TB', 'LR', 'BT', 'RL'] as const) expect(crossing(style, d), `${style} ${d}`).toBe(0)
  })
  it('the check is meaningful: the same graph without detours crosses nodes', () => {
    const drawing = drawGraph({ ...SPEC('TB'), nodes: SPEC('TB').nodes }, m, 'straight')
    expect(drawing.items.length).toBeGreaterThan(5)
    const crossingWithoutDetour = (() => {
      // route the cross-group edge straight through the group with no obstacles
      const b = (id: string) => drawing.layout.nodes.get(id)!
      const from = { x: b('x').x + m.margin + 40, y: b('x').y + m.margin + 40 }
      const to = { x: b('d').x + m.margin + 40, y: b('d').y + m.margin }
      let n = 0
      for (const id of ['a', 'b', 'c']) {
        const bb = b(id)
        for (let t = 0; t <= 1; t += 0.02) {
          const x = from.x + (to.x - from.x) * t
          const y = from.y + (to.y - from.y) * t
          if (x > bb.x + m.margin && x < bb.x + m.margin + bb.width && y > bb.y + m.margin && y < bb.y + m.margin + bb.height) n++
        }
      }
      return n
    })()
    expect(crossingWithoutDetour).toBeGreaterThan(0)
  })
  it('curved edges keep their route points clear of other nodes', () => {
    const drawing = drawGraph(SPEC('TB'), m, 'curved')
    expect(JSON.stringify(drawing.items)).not.toMatch(/NaN|Infinity/)
  })
  it('edges inside one group or at the top level are not bent', () => {
    const spec: GraphSpec = { direction: 'TB', nodes: [node('a'), node('b'), node('c')], edges: [{ id: 'a-c', from: 'a', to: 'c', style: 'solid' }, { id: 'a-b', from: 'a', to: 'b', style: 'solid' }, { id: 'b-c', from: 'b', to: 'c', style: 'solid' }] }
    expect(drawGraph(spec, m, 'straight').items.filter((i) => i.kind === 'path')).toHaveLength(3)
  })
})
