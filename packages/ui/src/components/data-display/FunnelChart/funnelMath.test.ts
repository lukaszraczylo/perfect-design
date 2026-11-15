import { describe, expect, it } from 'vitest'
import { FUNNEL_MAX_STAGES, conversions, formatPercent, funnelGeometry, normalizeStages, stageFractions, type GeometryOptions } from './funnelMath'

describe('normalizeStages', () => {
  it('keeps labels and finite values, validates tones and numbers the stages', () => {
    const n = normalizeStages([{ label: 'A', value: 5, tone: 'danger' }, { label: 'B', value: 3, tone: 'purple' }, { label: ' ', value: Number.NaN }, { value: '7' }])
    expect(n.stages.map((s) => s.label)).toEqual(['A', 'B', 'Stage 3', 'Stage 4'])
    expect(n.stages.map((s) => s.value)).toEqual([5, 3, null, null])
    expect(n.stages.map((s) => s.tone)).toEqual(['danger', undefined, undefined, undefined])
    expect(n.stages.map((s) => s.index)).toEqual([0, 1, 2, 3])
    expect(n.total).toBe(4)
  })
  it('skips entries that are not objects and returns nothing for non-arrays', () => {
    expect(normalizeStages([null, 'x', 4, [], { label: 'ok', value: 1 }]).stages).toHaveLength(1)
    for (const bad of [undefined, null, 'x', {}, 3]) expect(normalizeStages(bad)).toEqual({ stages: [], total: 0 })
  })
  it('draws at most 50 stages and reports the real count', () => {
    const n = normalizeStages(Array.from({ length: 2000 }, (_, i) => ({ label: `S${i}`, value: i })))
    expect(n.stages).toHaveLength(FUNNEL_MAX_STAGES)
    expect(n.total).toBe(2000)
  })
})

describe('stageFractions', () => {
  it('divides by the largest value; negative, missing and zero values are 0', () => {
    expect(stageFractions([100, 50, null, -5, 0, 25])).toEqual([1, 0.5, 0, 0, 0, 0.25])
  })
  it('does not need the first stage to be the largest', () => {
    expect(stageFractions([50, 100, 25])).toEqual([0.5, 1, 0.25])
  })
  it('is all zero without a positive value', () => {
    expect(stageFractions([0, 0, null, -1])).toEqual([0, 0, 0, 0])
    expect(stageFractions([])).toEqual([])
  })
  it('stays finite for huge values', () => {
    expect(stageFractions([1e308, 5e307])).toEqual([1, 0.5])
  })
})

describe('conversions', () => {
  it('computes the percent of the previous and of the first stage', () => {
    const c = conversions([200, 100, 25])
    expect(c.previous).toEqual([null, 50, 25])
    expect(c.first).toEqual([null, 50, 12.5])
  })
  it('exceeds 100% when a stage grows', () => {
    expect(conversions([100, 50, 75]).previous).toEqual([null, 50, 150])
  })
  it('is null when a value is missing or the base is zero', () => {
    const c = conversions([100, null, 40, 0, 10])
    expect(c.previous).toEqual([null, null, null, 0, null])
    expect(c.first).toEqual([null, null, 40, 0, 10])
    expect(conversions([0, 5]).first).toEqual([null, null])
  })
  it('is null for negative values on either side', () => {
    expect(conversions([100, -5, 10]).previous).toEqual([null, null, null])
    expect(conversions([-5, 10]).first).toEqual([null, null])
  })
  it('rounds to one decimal and handles huge ratios', () => {
    expect(conversions([3, 1]).previous[1]).toBe(33.3)
    expect(conversions([1e-320, 1e300]).previous[1]).toBeNull()
  })
  it('handles an empty list and one stage', () => {
    expect(conversions([])).toEqual({ previous: [], first: [] })
    expect(conversions([5])).toEqual({ previous: [null], first: [null] })
  })
})

describe('formatPercent', () => {
  it('formats rates, n/a and huge rates', () => {
    expect(formatPercent(62.5)).toBe('62.5%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(-20)).toBe('-20%')
    expect(formatPercent(null)).toBe('n/a')
    expect(formatPercent(1200000)).toBe('1.2M%')
  })
})

describe('funnelGeometry', () => {
  const box: GeometryOptions = { variant: 'funnel', orientation: 'vertical', x0: 0, y0: 0, x1: 100, y1: 100, gap: 0 }
  it('funnel: each stage narrows to the value of the next, the last one keeps its width', () => {
    const [a, b] = funnelGeometry([1, 0.5], box)
    expect(a!.d).toBe('M0,0 L100,0 L75,50 L25,50 Z')
    expect(b!.d).toBe('M25,50 L75,50 L75,100 L25,100 Z')
    expect([a!.innerW, a!.innerH]).toEqual([50, 50])
    expect([b!.x0, b!.y0, b!.x1, b!.y1]).toEqual([25, 50, 75, 100])
  })
  it('pyramid: the same shapes stacked the other way round, the first stage at the base', () => {
    const [a, b] = funnelGeometry([1, 0.5], { ...box, variant: 'pyramid' })
    expect(a!.d).toBe('M25,50 L75,50 L100,100 L0,100 Z')
    expect(b!.d).toBe('M25,0 L75,0 L75,50 L25,50 Z')
  })
  it('steps: centred rectangles', () => {
    const [a, b] = funnelGeometry([1, 0.5], { ...box, variant: 'steps' })
    expect(a!.d).toBe('M0,0 L100,0 L100,50 L0,50 Z')
    expect(b!.d).toBe('M25,50 L75,50 L75,100 L25,100 Z')
  })
  it('bars: rectangles aligned to the start', () => {
    const [a, b] = funnelGeometry([1, 0.5], { ...box, variant: 'bars' })
    expect(a!.d).toBe('M0,0 L100,0 L100,50 L0,50 Z')
    expect(b!.d).toBe('M0,50 L50,50 L50,100 L0,100 Z')
  })
  it('horizontal: stages run along x, bars sit on the bottom edge', () => {
    const [a, b] = funnelGeometry([1, 0.5], { ...box, orientation: 'horizontal', variant: 'bars' })
    expect(a!.d).toBe('M0,0 L0,100 L50,100 L50,0 Z')
    expect(b!.d).toBe('M50,50 L50,100 L100,100 L100,50 Z')
    const [f] = funnelGeometry([1, 0.5], { ...box, orientation: 'horizontal' })
    expect(f!.d).toBe('M0,0 L0,100 L50,75 L50,25 Z')
    expect([f!.innerW, f!.innerH]).toEqual([50, 50])
  })
  it('horizontal pyramid puts the first stage at the end', () => {
    const [a] = funnelGeometry([1, 0.5], { ...box, orientation: 'horizontal', variant: 'pyramid' })
    expect([a!.x0, a!.x1]).toEqual([50, 100])
  })
  it('gap separates the stages and is limited to half a slot', () => {
    const [a, b] = funnelGeometry([1, 1], { ...box, variant: 'steps', gap: 10 })
    expect([a!.y1, b!.y0]).toEqual([45, 55])
    const [c, d] = funnelGeometry([1, 1], { ...box, variant: 'steps', gap: 1000 })
    expect(d!.y0 - c!.y1).toBeLessThanOrEqual(50)
    expect(c!.y1).toBeGreaterThan(c!.y0)
  })
  it('a stage without width has no path; non-monotone data follows the values', () => {
    const g = funnelGeometry([1, 0, 0, 0.8], { ...box, variant: 'steps' })
    expect(g.map((s) => s.d === '')).toEqual([false, true, true, false])
    const up = funnelGeometry([0.4, 1], box)
    expect(up[0]!.d).toBe('M30,0 L70,0 L100,50 L0,50 Z')
  })
  it('handles no stages, one stage and a collapsed plot', () => {
    expect(funnelGeometry([], box)).toEqual([])
    expect(funnelGeometry([1], box)[0]!.d).toBe('M0,0 L100,0 L100,100 L0,100 Z')
    const flat = funnelGeometry([1, 0.5], { ...box, y1: 0, x1: 0 })
    expect(flat.every((s) => !Number.isNaN(s.x0 + s.y0 + s.x1 + s.y1))).toBe(true)
  })
})
