import { describe, expect, it } from 'vitest'
import { computeLayout, constrainSize, isCollapsedSize, isValidSize, normalizeConfigs, pairRange, resizePair, roundSize } from './layout'

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)

describe('computeLayout', () => {
  it('0 panels -> [], 1 panel -> [100]', () => {
    expect(computeLayout([])).toEqual([])
    expect(computeLayout([{ defaultSize: 30 }])).toEqual([100])
  })

  it('splits equally without defaults', () => {
    const out = computeLayout([{}, {}, {}, {}])
    expect(out).toEqual([25, 25, 25, 25])
  })

  it('honours defaults and shares the remainder between unset panels', () => {
    const out = computeLayout([{ defaultSize: 20 }, {}, {}])
    expect(out[0]).toBeCloseTo(20)
    expect(out[1]).toBeCloseTo(40)
    expect(sum(out)).toBeCloseTo(100)
  })

  it('normalises a sum != 100', () => {
    const out = computeLayout([{ defaultSize: 30 }, { defaultSize: 30 }])
    expect(out).toEqual([50, 50])
    const big = computeLayout([{ defaultSize: 90 }, { defaultSize: 90 }, { defaultSize: 20 }])
    expect(sum(big)).toBeCloseTo(100)
  })

  it('treats NaN / negative / Infinity as unset', () => {
    const out = computeLayout([{ defaultSize: NaN }, { defaultSize: -5 }, { defaultSize: Infinity }])
    expect(out.every((v) => Math.abs(v - 100 / 3) < 1e-9)).toBe(true)
    expect(computeLayout([{}, {}], [Number.NaN, -1])).toEqual([50, 50])
    expect(computeLayout([{}, {}], ['x', null])).toEqual([50, 50])
  })

  it('all-zero request falls back to an equal split', () => {
    expect(computeLayout([{}, {}], [0, 0])).toEqual([50, 50])
  })

  it('requested sizes override defaults', () => {
    const out = computeLayout([{ defaultSize: 10 }, { defaultSize: 90 }], [70, 30])
    expect(out[0]).toBeCloseTo(70)
  })

  it('clamps to min/max and redistributes the difference', () => {
    const out = computeLayout([{ minSize: 40 }, { defaultSize: 90 }, { maxSize: 20, defaultSize: 5 }], [10, 80, 10])
    expect(out[0]).toBeGreaterThanOrEqual(40 - 1e-9)
    expect(out[2]).toBeLessThanOrEqual(20 + 1e-9)
    expect(sum(out)).toBeCloseTo(100)
  })

  it('relaxes impossible bounds (sum of mins > 100, sum of maxes < 100)', () => {
    expect(sum(computeLayout([{ minSize: 80 }, { minSize: 80 }]))).toBeCloseTo(100)
    const out = computeLayout([{ maxSize: 30 }, { maxSize: 30 }])
    expect(sum(out)).toBeCloseTo(100)
  })

  it('keeps collapsed panels collapsed and relaxes only when impossible', () => {
    const cfg = [{ collapsible: true, minSize: 20, collapsedSize: 0 }, { maxSize: 80 }]
    const out = computeLayout(cfg, [0, 100])
    expect(sum(out)).toBeCloseTo(100)
    expect(out[1]).toBeCloseTo(80)
    expect(out[0]).toBeCloseTo(20)
  })

  it('stays collapsed when the others can absorb', () => {
    const out = computeLayout([{ collapsible: true, minSize: 20 }, {}, {}], [0, 50, 50])
    expect(out[0]).toBe(0)
    expect(sum(out)).toBeCloseTo(100)
  })
})

describe('normalizeConfigs / constrainSize', () => {
  it('sanitises invalid and reversed bounds', () => {
    const [c] = normalizeConfigs([{ minSize: 50, maxSize: 20, defaultSize: 500, collapsible: true, collapsedSize: 99 }, { maxSize: 100 }])
    expect(c.min).toBe(50)
    expect(c.max).toBe(50)
    expect(c.defaultSize).toBe(100)
    expect(c.collapsedSize).toBe(50)
    const [d] = normalizeConfigs([{ minSize: NaN, maxSize: -3, collapsedSize: 5 }])
    expect(d).toMatchObject({ min: 0, max: 100, collapsedSize: 0, collapsible: false })
  })

  it('constrainSize clamps and snaps collapsible panels', () => {
    const [plain] = normalizeConfigs([{ minSize: 10, maxSize: 50 }, {}, {}])
    expect(plain.max).toBe(50)
    expect(constrainSize(5, plain)).toBe(10)
    expect(constrainSize(70, plain)).toBe(50)
    const [col] = normalizeConfigs([{ minSize: 20, collapsible: true }])
    expect(constrainSize(5, col)).toBe(0)
    expect(constrainSize(15, col)).toBe(20)
    expect(isCollapsedSize(0, col)).toBe(true)
    expect(isCollapsedSize(20, col)).toBe(false)
    expect(isCollapsedSize(0, plain)).toBe(false)
  })

  it('isValidSize / roundSize', () => {
    expect(isValidSize(0)).toBe(true)
    expect(isValidSize(-1)).toBe(false)
    expect(isValidSize(NaN)).toBe(false)
    expect(isValidSize('5')).toBe(false)
    expect(roundSize(33.33333)).toBe(33.33)
  })
})

describe('resizePair / pairRange', () => {
  const cfg = [{ minSize: 10, maxSize: 80 }, { minSize: 20 }, {}]

  it('moves the boundary and keeps the sum', () => {
    const out = resizePair([40, 30, 30], cfg, 0, 10)
    expect(out).toEqual([50, 20, 30])
  })

  it('clamps by either neighbour', () => {
    expect(resizePair([40, 30, 30], cfg, 0, 500)).toEqual([50, 20, 30])
    expect(resizePair([40, 30, 30], cfg, 0, -500)).toEqual([10, 60, 30])
  })

  it('returns the input when nothing moves or input is invalid', () => {
    const base = [40, 30, 30]
    expect(resizePair(base, cfg, 0, 0)).toBe(base)
    expect(resizePair(base, cfg, 0, NaN)).toBe(base)
    expect(resizePair(base, cfg, 5, 1)).toBe(base)
    expect(resizePair(base, cfg, -1, 1)).toBe(base)
    expect(resizePair(base, cfg, 2, 1)).toBe(base)
    const maxed = [80, 20, 0]
    expect(resizePair(maxed, cfg, 0, 5)).toBe(maxed)
  })

  it('collapses below half of min and restores at min', () => {
    const c = [{ collapsible: true, minSize: 20 }, {}]
    expect(resizePair([30, 70], c, 0, -25)).toEqual([0, 100])
    expect(resizePair([30, 70], c, 0, -15)).toEqual([20, 80])
    const closed = [0, 100]
    expect(resizePair(closed, c, 0, 3)).toBe(closed)
    expect(resizePair([0, 100], c, 0, 12)).toEqual([20, 80])
  })

  it('refuses a move that would leave the neighbour in the forbidden gap', () => {
    const c = [{ collapsible: true, minSize: 20 }, { maxSize: 90 }]
    const base = [10, 90]
    expect(resizePair(base, c, 0, -10)).toBe(base)
  })

  it('pairRange reports the reachable range of the preceding panel', () => {
    expect(pairRange([40, 30, 30], cfg, 0)).toEqual([10, 50])
    expect(pairRange([40, 30, 30], cfg, 1)).toEqual([20, 60])
    const c = [{ collapsible: true, minSize: 20 }, {}]
    expect(pairRange([30, 70], c, 0)).toEqual([0, 100])
  })
})
