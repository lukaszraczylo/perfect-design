import { describe, expect, it } from 'vitest'
import { axisTicks, bubbleRadius, describeRegression, linearRegression, normalizePoints, trendSegment } from './scatterMath'

describe('normalizePoints', () => {
  it('groups points by series in first-seen order and keeps the input index', () => {
    const n = normalizePoints([
      { x: 1, y: 2, series: 'B' }, { x: 2, y: 3, series: 'A' }, { x: 3, y: 4, series: 'B', label: 'Third' },
    ])
    expect(n.series.map((s) => s.name)).toEqual(['B', 'A'])
    expect(n.series[0]!.points.map((p) => p.index)).toEqual([0, 2])
    expect(n.series[0]!.points[1]!.label).toBe('Third')
    expect(n.count).toBe(3)
    expect(n.skipped).toBe(0)
  })
  it('puts points without a series (or with a blank one) into "Points"', () => {
    const n = normalizePoints([{ x: 1, y: 1 }, { x: 2, y: 2, series: '  ' }, { x: 3, y: 3, series: 7 as never }])
    expect(n.series).toHaveLength(1)
    expect(n.series[0]!.name).toBe('Points')
    expect(n.count).toBe(3)
  })
  it('cycles chart tones and lets a tone map win', () => {
    const n = normalizePoints([{ x: 0, y: 0, series: 'a' }, { x: 0, y: 0, series: 'b' }, { x: 0, y: 0, series: 'c' }], { b: 'danger' })
    expect(n.series.map((s) => s.tone)).toEqual(['chart-1', 'danger', 'chart-3'])
  })
  it('skips and counts entries that are not usable points', () => {
    const n = normalizePoints([null, 'x', [], { x: Number.NaN, y: 1 }, { x: 1, y: Number.POSITIVE_INFINITY }, { x: '1', y: 2 }, { x: 4, y: 5 }])
    expect(n.count).toBe(1)
    expect(n.skipped).toBe(6)
  })
  it('keeps only finite, non-negative sizes and reports whether any exists', () => {
    const n = normalizePoints([{ x: 1, y: 1, size: -2 }, { x: 2, y: 2, size: Number.NaN }, { x: 3, y: 3, size: 0 }, { x: 4, y: 4 }])
    expect(n.series[0]!.points.map((p) => p.size)).toEqual([null, null, 0, null])
    expect(n.hasSize).toBe(true)
    expect(normalizePoints([{ x: 1, y: 1 }]).hasSize).toBe(false)
  })
  it('returns an empty result for non-arrays', () => {
    for (const bad of [undefined, null, 'x', 4, {}]) expect(normalizePoints(bad)).toEqual({ series: [], count: 0, skipped: 0, hasSize: false })
  })
  it('handles 2000 points', () => {
    const pts = Array.from({ length: 2000 }, (_, i) => ({ x: i, y: i % 7, series: `s${i % 3}` }))
    expect(normalizePoints(pts).count).toBe(2000)
  })
})

describe('linearRegression', () => {
  it('fits an exact line', () => {
    const r = linearRegression([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }])!
    expect(r.slope).toBeCloseTo(2)
    expect(r.intercept).toBeCloseTo(1)
    expect(r.r2).toBeCloseTo(1)
  })
  it('has R squared below 1 for scattered data and a negative slope when y falls', () => {
    const r = linearRegression([{ x: 0, y: 5 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 0 }])!
    expect(r.slope).toBeLessThan(0)
    expect(r.r2).toBeGreaterThan(0)
    expect(r.r2).toBeLessThan(1)
  })
  it('gives a flat line R squared 1', () => {
    expect(linearRegression([{ x: 0, y: 4 }, { x: 5, y: 4 }])).toEqual({ slope: 0, intercept: 4, r2: 1 })
  })
  it('has no line for fewer than two points or a single x', () => {
    expect(linearRegression([])).toBeNull()
    expect(linearRegression([{ x: 1, y: 1 }])).toBeNull()
    expect(linearRegression([{ x: 2, y: 1 }, { x: 2, y: 9 }])).toBeNull()
  })
  it('stays finite for huge coordinates and returns null when the sums overflow', () => {
    const r = linearRegression([{ x: 1e150, y: 1e150 }, { x: 2e150, y: 3e150 }])
    expect(r === null || Number.isFinite(r.slope)).toBe(true)
    expect(linearRegression([{ x: -1e308, y: 0 }, { x: 1e308, y: 1 }])).toBeNull()
  })
})

describe('trendSegment', () => {
  const reg = { slope: 2, intercept: 0, r2: 1 }
  it('spans the x range when it stays inside the value range', () => {
    expect(trendSegment(reg, 1, 4, 0, 10)).toEqual([1, 2, 4, 8])
  })
  it('cuts the line where it leaves the value range', () => {
    expect(trendSegment(reg, 0, 10, 0, 10)).toEqual([0, 0, 5, 10])
  })
  it('accepts reversed x and works for a falling line', () => {
    expect(trendSegment({ slope: -1, intercept: 10, r2: 1 }, 8, 2, 0, 10)).toEqual([2, 8, 8, 2])
  })
  it('keeps a flat line only when it is inside the range', () => {
    expect(trendSegment({ slope: 0, intercept: 5, r2: 1 }, 0, 3, 0, 10)).toEqual([0, 5, 3, 5])
    expect(trendSegment({ slope: 0, intercept: 50, r2: 1 }, 0, 3, 0, 10)).toBeNull()
    expect(trendSegment({ slope: 0, intercept: -1, r2: 1 }, 0, 3, 0, 10)).toBeNull()
  })
  it('is null when the line never enters the range', () => {
    expect(trendSegment(reg, 20, 30, 0, 10)).toBeNull()
  })
})

describe('describeRegression', () => {
  const fmt = (n: number) => String(Math.round(n * 100) / 100)
  it('writes the equation with the sign of the intercept', () => {
    expect(describeRegression({ slope: 0.5, intercept: 2, r2: 0.912 }, fmt)).toBe('y = 0.5x + 2 (R squared 0.91)')
    expect(describeRegression({ slope: -1, intercept: -3, r2: 1 }, fmt)).toBe('y = -1x - 3 (R squared 1)')
  })
})

describe('bubbleRadius', () => {
  it('is area proportional between the bounds', () => {
    expect(bubbleRadius(100, 100, 2, 20)).toBe(20)
    expect(bubbleRadius(25, 100, 2, 20)).toBeCloseTo(10)
    expect(bubbleRadius(1, 100, 2, 20)).toBe(2)
  })
  it('uses the smallest radius without a size or without a positive maximum', () => {
    expect(bubbleRadius(null, 100, 3, 12)).toBe(3)
    expect(bubbleRadius(5, 0, 3, 12)).toBe(3)
    expect(bubbleRadius(500, 100, 3, 12)).toBe(12)
  })
})

describe('axisTicks', () => {
  it('covers the data with round steps and little slack', () => {
    expect(axisTicks(12, 63, 4)).toEqual([0, 20, 40, 60, 80])
    expect(axisTicks(1, 7, 4)).toEqual([0, 2, 4, 6, 8])
  })
  it('handles negative ranges and removes floating point noise', () => {
    expect(axisTicks(-7, 8, 4)).toEqual([-10, -5, 0, 5, 10])
    expect(axisTicks(0.1, 0.35, 4)).toEqual([0.1, 0.2, 0.3, 0.4])
  })
  it('falls back to padded nice ticks for degenerate or non-finite input', () => {
    expect(axisTicks(5, 5, 4).length).toBeGreaterThan(1)
    expect(axisTicks(0, 0, 4)).toEqual([0, 1])
    expect(axisTicks(Number.NaN, Number.NaN, 4)).toEqual([0, 1])
    expect(axisTicks(-1e308, 1e308, 4).length).toBeGreaterThan(0)
  })
  it('clamps the tick count', () => {
    expect(axisTicks(0, 100, 0).length).toBeLessThanOrEqual(4)
    expect(axisTicks(0, 100, 999).length).toBeGreaterThan(5)
  })
})
