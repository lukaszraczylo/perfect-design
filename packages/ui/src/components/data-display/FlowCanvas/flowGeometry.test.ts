import { describe, expect, it } from 'vitest'
import {
  boundsOf, centerOf, clamp, edgeAnchors, fitViewport, gridStep, hitNode, hitPort, layoutPositions, nearestInDirection, nearestNode, normalizeEdges, normalizeNodes, normRect, outlinePath,
  pick, pointInRect, portPoints, readingOrder, rectsIntersect, routeFlowEdge, routeLoop, snap, visibleRect, zoomAt, zoomLimits, nodeRect, type NormNode, type PortPoint,
} from './flowGeometry'

const nodes = (raw: unknown[]) => normalizeNodes(raw)
const n = (id: string, x: number, y: number, extra: Record<string, unknown> = {}): NormNode => nodes([{ id, x, y, ...extra }])[0]!

describe('normalizeNodes', () => {
  it('fills defaults and keeps text exactly as given', () => {
    const [a] = nodes([{ id: 'a', x: 1, y: 2 }])
    expect(a).toMatchObject({ id: 'a', label: 'a', x: 1, y: 2, w: 148, h: 52, shape: 'rect', tone: 'neutral', canSource: true, canTarget: true })
    expect(a!.ports.map((p) => p.id)).toEqual(['top', 'right', 'bottom', 'left'])
    expect(nodes([{ id: 'h', label: '<img src=x onerror=alert(1)>', x: 0, y: 0 }])[0]!.label).toBe('<img src=x onerror=alert(1)>')
  })
  it('skips unusable entries and repeated ids, repairs bad numbers, shapes and tones', () => {
    const list = nodes([null, 5, [], { id: '' }, { id: '  ' }, { id: 'a', x: NaN, y: 'q', width: 3, height: 99999, shape: 'blob', tone: 'pink' }, { id: 'a', x: 5, y: 5 }, { id: 'b', label: '   ', x: Infinity, y: 0 }])
    expect(list.map((x) => x.id)).toEqual(['a', 'b'])
    expect(list[0]).toMatchObject({ x: 0, y: 0, w: 148, h: 1200, shape: 'rect', tone: 'neutral' })
    expect(list[1]).toMatchObject({ x: 0, label: 'b' })
  })
  it('returns nothing for a non-array', () => {
    expect(normalizeNodes(undefined)).toEqual([])
    expect(normalizeNodes('x')).toEqual([])
  })
  it('normalises ports: defaults, repeated ids, bad values; [] means not connectable', () => {
    const [a] = nodes([{ id: 'a', x: 0, y: 0, ports: [{ id: 'in', side: 'left', type: 'target', label: 'Input' }, { id: 'in' }, { id: 'x', side: 'diagonal', type: 'weird' }, null, { id: '' }] }])
    expect(a!.ports).toEqual([
      { id: 'in', side: 'left', type: 'target', label: 'Input' },
      { id: 'x', side: 'right', type: 'both', label: '' },
    ])
    expect(a!.canSource).toBe(true)
    const [b] = nodes([{ id: 'b', x: 0, y: 0, ports: [] }])
    expect(b).toMatchObject({ ports: [], canSource: false, canTarget: false })
    const [c] = nodes([{ id: 'c', x: 0, y: 0, ports: [{ id: 'o', type: 'source' }] }])
    expect(c).toMatchObject({ canSource: true, canTarget: false })
  })
})

describe('normalizeEdges', () => {
  const ids = new Set(['a', 'b'])
  it('keeps valid edges, defaults style, counts unknown ends', () => {
    const { edges, skipped } = normalizeEdges([{ id: 'e1', from: 'a', to: 'b', label: 'x', fromPort: 'p', toPort: '', style: 'dashed' }, { id: 'e2', from: 'a', to: 'zz' }, { id: 'e3', from: 'a', to: 'b', style: 'wavy', label: 5 }], ids)
    expect(skipped).toBe(1)
    expect(edges).toEqual([
      { id: 'e1', from: 'a', to: 'b', label: 'x', fromPort: 'p', toPort: undefined, style: 'dashed' },
      { id: 'e3', from: 'a', to: 'b', label: '', fromPort: undefined, toPort: undefined, style: 'solid' },
    ])
  })
  it('ignores malformed entries and repeated ids and non-arrays', () => {
    expect(normalizeEdges([null, { id: 'e', from: 'a' }, { id: 'e', from: 'a', to: 'b' }, { id: 'e', from: 'b', to: 'a' }], ids).edges).toHaveLength(1)
    expect(normalizeEdges(undefined, ids)).toEqual({ edges: [], skipped: 0 })
  })
})

describe('ports and anchors', () => {
  it('spreads ports of one side evenly and puts them on the outline', () => {
    const a = n('a', 100, 100, { width: 200, height: 100, ports: [{ id: 'p1', side: 'right' }, { id: 'p2', side: 'right' }, { id: 't', side: 'top' }, { id: 'b', side: 'bottom' }, { id: 'l', side: 'left' }] })
    const pts = Object.fromEntries(portPoints(a).map((p) => [p.port!.id, p]))
    expect(pts.p1).toMatchObject({ x: 300, nx: 1, ny: 0 })
    expect(pts.p1!.y).toBeCloseTo(100 + 100 / 3, 5)
    expect(pts.p2!.y).toBeCloseTo(100 + 200 / 3, 5)
    expect(pts.t).toMatchObject({ x: 200, y: 100, ny: -1 })
    expect(pts.b).toMatchObject({ x: 200, y: 200, ny: 1 })
    expect(pts.l).toMatchObject({ x: 100, y: 150, nx: -1 })
  })
  it('snaps ports to the outline of round shapes', () => {
    const c = n('c', 0, 0, { width: 100, height: 100, shape: 'circle' })
    const right = portPoints(c).find((p) => p.port!.id === 'right')!
    expect(right.x).toBeCloseTo(100, 5)
    const rh = n('r', 0, 0, { width: 100, height: 100, shape: 'rhombus' })
    expect(portPoints(rh).find((p) => p.port!.id === 'top')!.y).toBeCloseTo(0, 5)
  })
  it('picks the facing ports of two nodes', () => {
    const a = n('a', 0, 0)
    const b = n('b', 400, 0)
    const { start, end } = edgeAnchors(a, b)
    expect(start.port!.id).toBe('right')
    expect(end.port!.id).toBe('left')
    const below = edgeAnchors(a, n('c', 0, 300))
    expect([below.start.port!.id, below.end.port!.id]).toEqual(['bottom', 'top'])
  })
  it('uses the named port, falls back when it does not exist, respects port types', () => {
    const a = n('a', 0, 0, { ports: [{ id: 'in', side: 'left', type: 'target' }, { id: 'out', side: 'right', type: 'source' }, { id: 'out2', side: 'bottom', type: 'source' }] })
    const b = n('b', 400, 0, { ports: [{ id: 'in', side: 'left', type: 'target' }, { id: 'out', side: 'right', type: 'source' }] })
    expect(edgeAnchors(a, b, 'out2', 'in').start.port!.id).toBe('out2')
    expect(edgeAnchors(a, b, 'missing', 'missing').start.port!.id).toBe('out')
    expect(edgeAnchors(a, b).end.port!.id).toBe('in')
    // only target ports on the source node: any port is used
    const t = n('t', 0, 0, { ports: [{ id: 'only', side: 'left', type: 'target' }] })
    expect(edgeAnchors(t, b).start.port!.id).toBe('only')
  })
  it('uses a point on the outline for a node without ports', () => {
    const lone = n('l', 0, 0, { ports: [] })
    const b = n('b', 400, 0)
    const { start } = edgeAnchors(lone, b)
    expect(start.port).toBeUndefined()
    expect(start).toMatchObject({ x: 148, nx: 1, ny: 0 })
    const below = edgeAnchors(lone, n('c', 0, 400)).start
    expect(below).toMatchObject({ ny: 1, nx: 0 })
    const same = edgeAnchors(lone, n('d', 0, 0, { ports: [] })).start
    expect(Number.isFinite(same.x)).toBe(true)
  })
})

describe('routeFlowEdge', () => {
  const p = (x: number, y: number, nx: number, ny: number): PortPoint => ({ x, y, nx, ny })
  it('draws a straight line with its midpoint', () => {
    const r = routeFlowEdge(p(0, 0, 1, 0), p(100, 40, -1, 0), 'straight')
    expect(r.d).toBe('M0,0L100,40')
    expect(r.mid).toEqual({ x: 50, y: 20 })
  })
  it('draws a curve that leaves outward', () => {
    const r = routeFlowEdge(p(0, 0, 1, 0), p(200, 100, -1, 0), 'curved')
    expect(r.d).toMatch(/^M0,0C[\d.]+,0 [\d.]+,100 200,100$/)
    expect(r.mid.x).toBeCloseTo(100, 5)
    expect(r.mid.y).toBeCloseTo(50, 5)
  })
  it('draws right angles with rounded corners for each normal combination', () => {
    const hh = routeFlowEdge(p(0, 0, 1, 0), p(200, 100, -1, 0), 'orthogonal')
    expect(hh.d).toContain('Q')
    expect(hh.points.length).toBeGreaterThan(3)
    const vv = routeFlowEdge(p(0, 0, 0, 1), p(100, 200, 0, -1), 'orthogonal')
    expect(vv.d).toContain('Q')
    const hv = routeFlowEdge(p(0, 0, 1, 0), p(200, 200, 0, -1), 'orthogonal')
    expect(hv.d).toContain('Q')
    const vh = routeFlowEdge(p(0, 0, 0, 1), p(200, 200, -1, 0), 'orthogonal')
    expect(vh.d).toContain('Q')
  })
  it('collapses to a straight line when the right-angle route has no bend', () => {
    const r = routeFlowEdge(p(0, 0, 1, 0), p(100, 0, -1, 0), 'orthogonal')
    expect(r.d).toBe('M0,0L100,0')
    expect(r.points).toHaveLength(2)
  })
  it('borrows a direction for virtual points', () => {
    const r = routeFlowEdge(p(0, 0, 0, 0), p(0, 100, 0, 0), 'curved')
    expect(r.d).toContain('C')
    const s = routeFlowEdge(p(0, 0, 0, 0), p(100, 0, 0, 0), 'orthogonal')
    expect(s.d.startsWith('M0,0')).toBe(true)
  })
  it('draws a loop at the right of a node', () => {
    const r = routeLoop(n('a', 10, 10))
    expect(r.d.startsWith('M')).toBe(true)
    expect(r.mid.x).toBeGreaterThan(158)
  })
  it('gives a node outline path with inner strokes for a subroutine', () => {
    expect(outlinePath('rect', 100, 50).d).toContain('M')
    expect(outlinePath('subroutine', 100, 50).inner).toHaveLength(2)
  })
})

describe('viewport math', () => {
  const limits = { min: 0.25, max: 2 }
  it('clamp and snap', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
    expect(snap(13, 20)).toBe(20)
    expect(snap(9, 20)).toBe(0)
    expect(snap(13, 0)).toBe(13)
  })
  it('gridStep accepts true, positive numbers and nothing else', () => {
    expect(gridStep(true)).toBe(20)
    expect(gridStep(8)).toBe(8)
    expect(gridStep(1000)).toBe(400)
    for (const bad of [false, 0, -5, NaN, 'x', undefined, null]) expect(gridStep(bad)).toBe(0)
  })
  it('zoomLimits repairs bad bounds', () => {
    expect(zoomLimits(undefined, undefined)).toEqual({ min: 0.25, max: 2 })
    expect(zoomLimits(0.1, 5)).toEqual({ min: 0.1, max: 5 })
    expect(zoomLimits(3, 0.5)).toEqual({ min: 1, max: 1 })
    expect(zoomLimits(-1, NaN)).toEqual({ min: 0.25, max: 2 })
  })
  it('zoomAt keeps the anchor point fixed and clamps', () => {
    const z = zoomAt({ x: 0, y: 0, zoom: 1 }, 2, 100, 50, limits)
    expect(z).toEqual({ zoom: 2, x: -100, y: -50 })
    expect((100 - z.x) / z.zoom).toBe(100)
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 100, 0, 0, limits).zoom).toBe(2)
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 0.001, 0, 0, limits).zoom).toBe(0.25)
  })
  it('boundsOf and fitViewport', () => {
    expect(boundsOf([])).toBeNull()
    const b = boundsOf([n('a', 0, 0), n('b', 400, 200)])!
    expect(b).toEqual({ x: 0, y: 0, width: 548, height: 252 })
    const v = fitViewport(b, 600, 300, 20, limits)
    expect(v.zoom).toBeCloseTo(Math.min(560 / 548, 260 / 252, 1), 5)
    expect(v.x + (b.x + b.width / 2) * v.zoom).toBeCloseTo(300, 5)
    expect(fitViewport(null, 600, 300, 20, limits)).toEqual({ x: 0, y: 0, zoom: 1 })
    expect(fitViewport(b, 0, 300, 20, limits)).toEqual({ x: 0, y: 0, zoom: 1 })
    // a tiny graph is not zoomed in
    expect(fitViewport({ x: 0, y: 0, width: 10, height: 10 }, 600, 300, 20, limits).zoom).toBe(1)
    // a huge one is limited by minZoom
    expect(fitViewport({ x: 0, y: 0, width: 1e6, height: 1e6 }, 600, 300, 20, limits).zoom).toBe(0.25)
  })
  it('visibleRect, intersections, rectangles', () => {
    const r = visibleRect({ x: -100, y: -50, zoom: 2 }, 400, 200, 10)
    expect(r).toEqual({ x: 40, y: 15, width: 220, height: 120 })
    expect(rectsIntersect(r, { x: 250, y: 20, width: 5, height: 5 })).toBe(true)
    expect(rectsIntersect(r, { x: 300, y: 20, width: 5, height: 5 })).toBe(false)
    expect(normRect({ x: 10, y: 20 }, { x: 4, y: 30 })).toEqual({ x: 4, y: 20, width: 6, height: 10 })
    expect(pointInRect({ x: 5, y: 5 }, { x: 0, y: 0, width: 5, height: 5 })).toBe(true)
    expect(pointInRect({ x: 6, y: 5 }, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    expect(nodeRect(n('a', 3, 4))).toEqual({ x: 3, y: 4, width: 148, height: 52 })
    expect(centerOf(n('a', 0, 0))).toEqual({ x: 74, y: 26 })
  })
  it('pick falls back', () => {
    expect(pick('b', ['a', 'b'] as const, 'a')).toBe('b')
    expect(pick('z', ['a', 'b'] as const, 'a')).toBe('a')
  })
})

describe('hit testing and focus order', () => {
  const list = [n('a', 0, 0), n('b', 400, 0), n('c', 0, 300), n('d', 400, 300)]
  it('hitPort finds the nearest port within the radius', () => {
    expect(hitPort(list, { x: 148, y: 26 }, 12)).toEqual({ nodeId: 'a', portId: 'right' })
    expect(hitPort(list, { x: 152, y: 30 }, 12)).toEqual({ nodeId: 'a', portId: 'right' })
    expect(hitPort(list, { x: 250, y: 26 }, 12)).toBeNull()
    expect(hitPort(list, { x: 74, y: 500 }, 12)).toBeNull()
  })
  it('hitNode returns the topmost node', () => {
    expect(hitNode(list, { x: 10, y: 10 })!.id).toBe('a')
    expect(hitNode(list, { x: 250, y: 100 })).toBeNull()
    expect(hitNode([n('x', 0, 0), n('y', 10, 10)], { x: 20, y: 20 })!.id).toBe('y')
  })
  it('readingOrder is top to bottom then left to right and stable', () => {
    expect(readingOrder([list[3]!, list[2]!, list[1]!, list[0]!])).toEqual(['a', 'b', 'c', 'd'])
    expect(readingOrder([n('p', 0, 0), n('q', 0, 0)])).toEqual(['p', 'q'])
  })
  it('nearestInDirection scores along plus twice the sideways distance', () => {
    const a = list[0]!
    expect(nearestInDirection(a, list, 'ArrowRight')!.id).toBe('b')
    expect(nearestInDirection(a, list, 'ArrowDown')!.id).toBe('c')
    expect(nearestInDirection(a, list, 'ArrowLeft')).toBeNull()
    expect(nearestInDirection(a, list, 'ArrowUp')).toBeNull()
    expect(nearestInDirection(list[3]!, list, 'ArrowLeft')!.id).toBe('c')
    expect(nearestInDirection(list[3]!, list, 'ArrowUp')!.id).toBe('b')
    expect(nearestInDirection(a, [a, n('far', 500, 0), n('close', 200, 100)], 'ArrowRight')!.id).toBe('close')
    expect(nearestInDirection(a, [a, n('far', 500, 0), n('off', 200, 300)], 'ArrowRight')!.id).toBe('far')
  })
  it('nearestNode', () => {
    expect(nearestNode(list[0]!, list)!.id).toBe('c')
    expect(nearestNode(list[0]!, [list[0]!])).toBeNull()
  })
})

describe('layoutPositions', () => {
  const ns = nodes([{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 0, y: 0 }, { id: 'c', x: 0, y: 0 }, { id: 'd', x: 0, y: 0 }])
  const es = normalizeEdges([{ id: '1', from: 'a', to: 'b' }, { id: '2', from: 'a', to: 'c' }, { id: '3', from: 'b', to: 'd' }], new Set(['a', 'b', 'c', 'd'])).edges
  it('layers left to right without overlap and starts at the margin', () => {
    const at = layoutPositions(ns, es, 'LR', 0)
    expect(at.get('a')!.x).toBe(40)
    expect(at.get('b')!.x).toBeGreaterThan(at.get('a')!.x + 148)
    expect(at.get('c')!.x).toBe(at.get('b')!.x)
    expect(at.get('d')!.x).toBeGreaterThan(at.get('b')!.x)
    expect(at.get('b')!.y).not.toBe(at.get('c')!.y)
  })
  it('layers top to bottom and bottom to top', () => {
    const tb = layoutPositions(ns, es, 'TB', 0)
    expect(tb.get('b')!.y).toBeGreaterThan(tb.get('a')!.y + 52)
    const bt = layoutPositions(ns, es, 'BT', 0)
    expect(bt.get('b')!.y).toBeLessThan(bt.get('a')!.y)
  })
  it('snaps to the grid', () => {
    const at = layoutPositions(ns, es, 'LR', 20)
    for (const p of at.values()) {
      expect(p.x % 20).toBe(0)
      expect(p.y % 20).toBe(0)
    }
  })
  it('handles cycles, self loops and an empty graph', () => {
    const cyc = normalizeEdges([{ id: '1', from: 'a', to: 'b' }, { id: '2', from: 'b', to: 'a' }, { id: '3', from: 'a', to: 'a' }], new Set(['a', 'b'])).edges
    expect(layoutPositions(ns.slice(0, 2), cyc, 'LR', 0).size).toBe(2)
    expect(layoutPositions([], [], 'LR', 0).size).toBe(0)
  })
})
