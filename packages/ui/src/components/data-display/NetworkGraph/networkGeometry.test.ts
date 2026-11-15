import { describe, expect, it } from 'vitest'
import { edgeShape, edgeWidths, nodeRadii, radiusRange } from './networkGeometry'
import { normalizeGraph } from './graphData'

const nums = (s: string) => (s.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
const a = { x: 50, y: 50, r: 10 }
const b = { x: 150, y: 50, r: 10 }

describe('radiusRange', () => {
  it('is 5..14 up to 40 nodes and shrinks for dense graphs, never below 35%', () => {
    expect(radiusRange(1)).toEqual({ min: 5, max: 14 })
    expect(radiusRange(40)).toEqual({ min: 5, max: 14 })
    expect(radiusRange(160).max).toBeCloseTo(7, 6)
    expect(radiusRange(300).max).toBeLessThan(7)
    expect(radiusRange(100000).max).toBeCloseTo(14 * 0.35, 6)
  })
})

describe('nodeRadii', () => {
  it('grows with degree and stays inside the range', () => {
    const g = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }], [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }, { from: 'a', to: 'd' }], 300)
    const r = nodeRadii(g)
    expect(r[0]).toBe(14)
    expect(r[1]).toBe(5)
    expect(r.every((v) => v >= 5 && v <= 14)).toBe(true)
  })
  it('an explicit size wins over the degree', () => {
    const g = normalizeGraph([{ id: 'a', size: 1 }, { id: 'b', size: 100 }], [{ from: 'a', to: 'b' }], 300)
    expect(nodeRadii(g)).toEqual([5, 14])
  })
  it('equal values give one middle radius for all', () => {
    const r = nodeRadii(normalizeGraph([{ id: 'a' }, { id: 'b' }], [], 300))
    expect(r[0]).toBe(r[1])
    expect(r[0]).toBeGreaterThan(5)
    expect(r[0]).toBeLessThan(14)
  })
  it('huge sizes stay finite', () => {
    const r = nodeRadii(normalizeGraph([{ id: 'a', size: 1e300 }, { id: 'b', size: 1e-300 }, { id: 'c', size: 5e11 }], [], 300))
    expect(r.every(Number.isFinite)).toBe(true)
  })
})

describe('edgeWidths', () => {
  it('is 1.5 without weights, 2 for equal weights and 1..4 otherwise', () => {
    const n = [{ id: 'a' }, { id: 'b' }]
    expect(edgeWidths(normalizeGraph(n, [{ from: 'a', to: 'b' }], 300))).toEqual([1.5])
    expect(edgeWidths(normalizeGraph(n, [{ from: 'a', to: 'b', weight: 3 }, { from: 'b', to: 'a', weight: 3 }], 300))).toEqual([2, 2])
    expect(edgeWidths(normalizeGraph(n, [{ from: 'a', to: 'b', weight: 1 }, { from: 'b', to: 'a', weight: 9 }, { from: 'a', to: 'b' }], 300))).toEqual([1, 4, 1.5])
    expect(edgeWidths(normalizeGraph(n, [], 300))).toEqual([])
  })
})

describe('edgeShape', () => {
  it('a straight line stops at both node borders', () => {
    const s = edgeShape(a, b, { curved: false, directed: false, self: false })
    expect(s.d).toBe('M60,50 L140,50')
    expect(s.arrow).toBe('')
    expect(s.mid).toEqual({ x: 100, y: 50 })
  })
  it('a directed line ends short of the border and draws an arrowhead whose tip is on the border', () => {
    const s = edgeShape(a, b, { curved: false, directed: true, self: false })
    expect(s.d).toBe('M60,50 L134.4,50')
    const p = nums(s.arrow)
    expect(p.slice(0, 2)).toEqual([140, 50])
    expect(p).toHaveLength(6)
  })
  it('a curved line bends to one side and separates the reverse connection', () => {
    const ab = edgeShape(a, b, { curved: true, directed: true, self: false })
    const ba = edgeShape(b, a, { curved: true, directed: true, self: false })
    expect(ab.d).toMatch(/^M[\d.-]+,[\d.-]+ Q/)
    expect(ab.mid.y).not.toBe(50)
    expect(Math.sign(ab.mid.y - 50)).toBe(-Math.sign(ba.mid.y - 50))
  })
  it('a self loop leaves and returns to the node, above it', () => {
    const s = edgeShape(a, a, { curved: false, directed: true, self: true })
    expect(s.d).toMatch(/^M[\d.-]+,[\d.-]+ C/)
    expect(s.mid.y).toBeLessThan(40)
    expect(s.arrow.split(' ')).toHaveLength(3)
    expect(edgeShape(a, a, { curved: true, directed: false, self: true }).arrow).toBe('')
  })
  it('two nodes on the same spot give finite output', () => {
    for (const curved of [false, true]) {
      const s = edgeShape(a, a, { curved, directed: true, self: false })
      expect(`${s.d} ${s.arrow} ${s.mid.x} ${s.mid.y}`).not.toMatch(/NaN|Infinity|undefined/)
    }
  })
})
