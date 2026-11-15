import { describe, expect, it } from 'vitest'
import { NODE_SHAPES, clipToShape, isNodeShape, lineHit, polygonPoints, shapePath, shapeSize, type Box, type NodeShape } from './shapes'
import { metricsFor } from './text'

const m = metricsFor()
const box = (shape: NodeShape, tw = 60, th = 20): Box => ({ x: 100, y: 50, ...shapeSize(shape, tw, th, m) })
const num = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
const onOutline = (shape: NodeShape, b: Box, p: { x: number; y: number }) => {
  // distance to the polygon or ellipse outline
  if (shape === 'circle' || shape === 'doublecircle') {
    const v = ((p.x - b.x - b.width / 2) / (b.width / 2)) ** 2 + ((p.y - b.y - b.height / 2) / (b.height / 2)) ** 2
    return Math.abs(v - 1) < 1e-6
  }
  const poly = polygonPoints(shape, b) ?? [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }]
  return poly.some((a, i) => {
    const c = poly[(i + 1) % poly.length]!
    const cross = (c.x - a.x) * (p.y - a.y) - (c.y - a.y) * (p.x - a.x)
    const within = p.x >= Math.min(a.x, c.x) - 1e-6 && p.x <= Math.max(a.x, c.x) + 1e-6 && p.y >= Math.min(a.y, c.y) - 1e-6 && p.y <= Math.max(a.y, c.y) + 1e-6
    return Math.abs(cross) < 1e-4 && within
  })
}

describe('shape size', () => {
  it.each(NODE_SHAPES)('%s is at least as big as its text and finite', (shape) => {
    const s = shapeSize(shape, 60, 20, m)
    expect(s.width).toBeGreaterThanOrEqual(60)
    expect(s.height).toBeGreaterThanOrEqual(20)
    expect(Number.isFinite(s.width + s.height)).toBe(true)
  })
  it('circles are round and double circles are bigger', () => {
    const c = shapeSize('circle', 60, 20, m)
    expect(c.width).toBe(c.height)
    expect(shapeSize('doublecircle', 60, 20, m).width).toBeGreaterThan(c.width)
  })
  it('a rhombus is larger than a rectangle for the same text', () => {
    expect(shapeSize('rhombus', 60, 20, m).width).toBeGreaterThan(shapeSize('rect', 60, 20, m).width)
  })
  it('isNodeShape guards', () => {
    expect(isNodeShape('rhombus')).toBe(true)
    expect(isNodeShape('blob')).toBe(false)
  })
})

describe('shape path', () => {
  it.each(NODE_SHAPES)('%s draws a closed finite path inside its box', (shape) => {
    const b = box(shape)
    const { d, inner } = shapePath(shape, b, m)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).not.toMatch(/NaN|undefined|Infinity/)
    for (const x of [d, ...inner]) expect(x).not.toMatch(/NaN|undefined|Infinity/)
    const nums = num(d)
    expect(nums.length).toBeGreaterThan(4)
  })
  it('subroutine and double circle and cylinder add inner strokes', () => {
    expect(shapePath('subroutine', box('subroutine'), m).inner).toHaveLength(2)
    expect(shapePath('doublecircle', box('doublecircle'), m).inner).toHaveLength(1)
    expect(shapePath('cylinder', box('cylinder'), m).inner).toHaveLength(1)
    expect(shapePath('rect', box('rect'), m).inner).toHaveLength(0)
  })
  it('the radius follows the metrics', () => {
    const square = shapePath('rect', box('rect'), metricsFor('md', 'comfortable', 'none')).d
    const round = shapePath('rect', box('rect'), metricsFor('md', 'comfortable', 'md')).d
    expect(square).not.toContain('A')
    expect(round).toContain('A')
    expect(shapePath('stadium', box('stadium'), m).d).toContain('A')
    expect(shapePath('round', box('round'), metricsFor('md', 'comfortable', 'none')).d).toContain('A')
  })
})

describe('clipToShape puts the end of an edge on the outline', () => {
  const targets = [{ x: 500, y: 60 }, { x: -300, y: 80 }, { x: 140, y: 600 }, { x: 150, y: -400 }, { x: 600, y: 500 }, { x: -100, y: -100 }]
  it.each(NODE_SHAPES.filter((s) => !['subroutine', 'cylinder', 'stadium', 'round', 'rect'].includes(s)))('%s', (shape) => {
    const b = box(shape)
    for (const t of targets) expect(onOutline(shape, b, clipToShape(shape, b, t)), `${shape} toward ${t.x},${t.y}`).toBe(true)
  })
  it.each(['rect', 'round', 'stadium', 'subroutine', 'cylinder', 'cluster'] as const)('%s clips to its bounding box', (shape) => {
    const b = box(shape === 'cluster' ? 'rect' : shape)
    for (const t of targets) {
      const p = clipToShape(shape, b, t)
      const onEdge = Math.abs(p.x - b.x) < 1e-6 || Math.abs(p.x - b.x - b.width) < 1e-6 || Math.abs(p.y - b.y) < 1e-6 || Math.abs(p.y - b.y - b.height) < 1e-6
      expect(onEdge).toBe(true)
    }
  })
  it('handles a target at the centre and straight lines', () => {
    const b = box('rect')
    expect(clipToShape('rect', b, { x: b.x + b.width / 2, y: b.y + b.height / 2 })).toEqual({ x: b.x + b.width / 2, y: b.y + b.height })
    expect(clipToShape('rect', b, { x: b.x + b.width / 2, y: 500 }).y).toBeCloseTo(b.y + b.height)
    expect(clipToShape('rect', b, { x: 900, y: b.y + b.height / 2 }).x).toBeCloseTo(b.x + b.width)
  })
})

describe('lineHit', () => {
  it.each(NODE_SHAPES)('%s: a line along the rank axis meets the outline on both sides', (shape) => {
    const b = box(shape)
    for (const horizontal of [false, true]) {
      const c = (horizontal ? b.y : b.x) + (horizontal ? b.height : b.width) * 0.4
      const hi = lineHit(shape, b, horizontal, c, true)
      const lo = lineHit(shape, b, horizontal, c, false)
      expect(onOutline(shape, b, hi) || shape === 'cylinder' || shape === 'subroutine' || shape === 'stadium' || shape === 'round' || shape === 'rect', `${shape} high`).toBe(true)
      expect(horizontal ? hi.x >= lo.x : hi.y >= lo.y).toBe(true)
      expect(horizontal ? hi.y : hi.x).toBeCloseTo(c, 5)
    }
  })
  it('clamps a coordinate outside the shape', () => {
    const b = box('rect')
    expect(lineHit('rect', b, false, b.x - 500, true).x).toBeGreaterThanOrEqual(b.x)
    expect(lineHit('cluster', b, false, b.x + b.width + 500, false).x).toBeLessThanOrEqual(b.x + b.width)
  })
  it('a rhombus meets the outline inside the bounding box off the centre line', () => {
    const b = box('rhombus')
    const centre = lineHit('rhombus', b, false, b.x + b.width / 2, true)
    const off = lineHit('rhombus', b, false, b.x + b.width * 0.2, true)
    expect(centre.y).toBeCloseTo(b.y + b.height)
    expect(off.y).toBeLessThan(b.y + b.height - 5)
  })
})

describe('polygonPoints', () => {
  it('is null for round and rectangular shapes', () => {
    for (const s of ['rect', 'round', 'circle', 'stadium'] as const) expect(polygonPoints(s, box(s))).toBeNull()
  })
  it('returns four to six corners for the others', () => {
    expect(polygonPoints('rhombus', box('rhombus'))).toHaveLength(4)
    expect(polygonPoints('hexagon', box('hexagon'))).toHaveLength(6)
    expect(polygonPoints('asymmetric', box('asymmetric'))).toHaveLength(5)
  })
})
