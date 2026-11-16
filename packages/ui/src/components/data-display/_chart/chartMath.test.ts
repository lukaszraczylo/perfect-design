import { describe, expect, it } from 'vitest'
import {
  areaPath, clamp, extent, formatCompact, formatNumber, isFiniteNumber, isolatedPoints, linePath, niceTicks, r2, runs, scaleLinear,
} from './chartMath'
import { CHART_TONES, seriesTone, toneClasses } from './tones'

describe('niceTicks', () => {
  it('covers the range with ascending nice steps', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100])
    expect(niceTicks(0, 10, 6)).toEqual([0, 2, 4, 6, 8, 10])
  })
  it('extends outwards to nice bounds', () => {
    const t = niceTicks(3, 97, 5)
    expect(t[0]).toBeLessThanOrEqual(3)
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(97)
  })
  it('handles negative and mixed ranges', () => {
    const t = niceTicks(-37, 52)
    expect(t[0]).toBeLessThanOrEqual(-37)
    expect(t).toContain(0)
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(52)
  })
  it('has no floating point noise for fractional steps', () => {
    expect(niceTicks(0, 0.3, 4)).toEqual([0, 0.2, 0.4])
    expect(niceTicks(0, 1, 11)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
  })
  it('swaps min > max', () => {
    expect(niceTicks(100, 0, 5)).toEqual(niceTicks(0, 100, 5))
  })
  it('pads a flat range (min === max)', () => {
    const t = niceTicks(5, 5)
    expect(t.length).toBeGreaterThan(1)
    expect(t[0]).toBeLessThan(5)
    expect(t[t.length - 1]).toBeGreaterThan(5)
    expect(niceTicks(0, 0)).toEqual([0, 1])
    const neg = niceTicks(-5, -5)
    expect(neg[0]).toBeLessThan(-5)
  })
  it('falls back for NaN / Infinity', () => {
    expect(niceTicks(NaN, NaN)).toEqual([0, 1])
    expect(niceTicks(Infinity, -Infinity)).toEqual([0, 1])
    expect(niceTicks(NaN, 50)).toEqual(niceTicks(50, 50))
    expect(niceTicks(10, NaN)).toEqual(niceTicks(10, 10))
  })
  it('clamps count (0, 1, negative, NaN, huge)', () => {
    for (const c of [0, 1, -3, NaN, 1e9, 2.7]) {
      const t = niceTicks(0, 100, c)
      expect(t.length).toBeGreaterThanOrEqual(2)
      expect(t.length).toBeLessThanOrEqual(101)
    }
  })
  it('handles huge and tiny magnitudes', () => {
    const big = niceTicks(0, 1e15)
    expect(big[big.length - 1]).toBeGreaterThanOrEqual(1e15)
    const huge = niceTicks(0, Number.MAX_VALUE)
    expect(huge.every((v) => Number.isFinite(v) || v === Infinity)).toBe(true)
    const tiny = niceTicks(0, 1e-9)
    expect(tiny[tiny.length - 1]).toBeGreaterThanOrEqual(1e-9)
    expect(niceTicks(0, 5e-324).length).toBeGreaterThan(0)
  })
  it('never emits -0', () => {
    expect(niceTicks(-10, 10).some((v) => Object.is(v, -0))).toBe(false)
  })
})

describe('scalars', () => {
  it('isFiniteNumber', () => {
    expect(isFiniteNumber(1)).toBe(true)
    for (const v of [NaN, Infinity, -Infinity, '1', null, undefined]) expect(isFiniteNumber(v)).toBe(false)
  })
  it('r2 rounds and normalises -0', () => {
    expect(r2(1.005 + 0.001)).toBe(1.01)
    expect(Object.is(r2(-0.001), 0)).toBe(true)
  })
  it('clamp', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-5, 0, 3)).toBe(0)
    expect(clamp(2, 0, 3)).toBe(2)
  })
  it('extent ignores non-finite and returns null when empty', () => {
    expect(extent([3, NaN, -2, Infinity, 7, 'x', null])).toEqual([-2, 7])
    expect(extent([])).toBeNull()
    expect(extent([NaN, undefined])).toBeNull()
    expect(extent([4])).toEqual([4, 4])
  })
  it('scaleLinear maps and handles zero width domain', () => {
    const s = scaleLinear(0, 10, 100, 0)
    expect(s(0)).toBe(100)
    expect(s(10)).toBe(0)
    expect(s(5)).toBe(50)
    expect(scaleLinear(3, 3, 0, 10)(3)).toBe(5)
  })
  it('formatCompact / formatNumber', () => {
    expect(formatCompact(1200)).toBe('1.2K')
    expect(formatCompact(0)).toBe('0')
    expect(formatCompact(-0)).toBe('0')
    expect(formatCompact(NaN)).toBe('–')
    expect(formatNumber(1234.5678)).toBe('1,234.57')
    expect(formatNumber(Infinity)).toBe('–')
    expect(formatNumber(-0)).toBe('0')
  })
})

describe('paths', () => {
  const p = (x: number, y: number) => ({ x, y })
  it('runs splits at gaps', () => {
    expect(runs([p(0, 0), p(1, 1), null, p(3, 3)])).toEqual([[p(0, 0), p(1, 1)], [p(3, 3)]])
    expect(runs([])).toEqual([])
    expect(runs([null, null])).toEqual([])
  })
  it('linePath builds M/L segments and breaks at gaps', () => {
    expect(linePath([p(0, 0), p(10, 5.123)])).toBe('M0,0 L10,5.12')
    expect(linePath([p(0, 0), null, p(2, 2), p(3, 3)])).toBe('M0,0 M2,2 L3,3')
    expect(linePath([])).toBe('')
  })
  it('areaPath closes to the baseline and skips single-point runs', () => {
    expect(areaPath([p(0, 5), p(10, 2)], 10)).toBe('M0,10 L0,5 L10,2 L10,10 Z')
    expect(areaPath([p(0, 5)], 10)).toBe('')
    expect(areaPath([], 10)).toBe('')
  })
  it('isolatedPoints returns lonely points only', () => {
    expect(isolatedPoints([p(0, 0), null, p(2, 2), p(3, 3), null, p(5, 5)])).toEqual([p(0, 0), p(5, 5)])
  })
})

describe('tones', () => {
  it('cycles chart-1..5 and honours explicit tones', () => {
    expect(seriesTone(0)).toBe('chart-1')
    expect(seriesTone(5)).toBe('chart-1')
    expect(seriesTone(7)).toBe('chart-3')
    expect(seriesTone(1, 'success')).toBe('success')
  })
  it('falls back for invalid tone / index', () => {
    expect(seriesTone(1, 'nope' as never)).toBe('chart-2')
    expect(seriesTone(NaN)).toBe('chart-1')
    expect(seriesTone(-2)).toBe('chart-3')
    expect(seriesTone(0, null)).toBe('chart-1')
  })
  it('every chart tone has literal classes', () => {
    for (const t of CHART_TONES) expect(toneClasses[t].stroke).toBe(`stroke-${t}`)
  })
})

describe('negative zero', () => {
  it('formatCompact and formatNumber never print -0', () => {
    for (const n of [-0, -0.0001, -0.004]) {
      expect(formatNumber(n)).toBe('0')
      expect(formatCompact(n)).toBe('0')
    }
    expect(formatCompact(-0.04)).toBe('0')
    expect(formatNumber(-0.01)).toBe('-0.01')
    expect(formatCompact(-1200)).toBe('-1.2K')
  })
})
