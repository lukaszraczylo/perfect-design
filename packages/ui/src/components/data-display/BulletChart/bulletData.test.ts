import { describe, expect, it } from 'vitest'
import { BAND_FILLS, MAX_ABS, MAX_RANGES, TRACK_FILL, bandFill, bandHatch, bulletDomain, normalizeBullets } from './bulletData'

describe('normalizeBullets', () => {
  it('returns an empty list for anything that is not an array', () => {
    for (const bad of [undefined, null, 5, 'x', {}, true]) expect(normalizeBullets(bad)).toEqual([])
  })
  it('skips entries that are not objects', () => {
    expect(normalizeBullets([null, 3, 'x', [], undefined, { label: 'Kept', value: 1 }])).toHaveLength(1)
  })
  it('keeps a valid bullet unchanged', () => {
    expect(normalizeBullets([{ label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100], max: 120, tone: 'success', unit: 'k' }])).toEqual([
      { label: 'Orders', value: 70, target: 80, ranges: [50, 75, 100], max: 120, tone: 'success', unit: 'k' },
    ])
  })
  it('names a measure without a label by its position', () => {
    const out = normalizeBullets([{ value: 1 }, { label: '   ', value: 2 }, { label: 3, value: 3 }])
    expect(out.map((b) => b.label)).toEqual(['Measure 1', 'Measure 2', 'Measure 3'])
  })
  it('turns non-finite numbers into null', () => {
    const [b] = normalizeBullets([{ label: 'A', value: Number.NaN, target: Infinity, max: -Infinity }])
    expect(b).toMatchObject({ value: null, target: null, max: null })
    const [c] = normalizeBullets([{ label: 'A', value: '5', target: null }])
    expect(c).toMatchObject({ value: null, target: null })
  })
  it('clamps huge numbers so later maths cannot overflow', () => {
    const [b] = normalizeBullets([{ label: 'A', value: 1e300, target: -1e300, ranges: [1e308] }])
    expect(b!.value).toBe(MAX_ABS)
    expect(b!.target).toBe(-MAX_ABS)
    expect(b!.ranges).toEqual([MAX_ABS])
  })
  it('sorts ranges ascending, drops duplicates and invalid bounds, keeps at most five', () => {
    const [b] = normalizeBullets([{ label: 'A', value: 1, ranges: [75, 50, 50, Number.NaN, 'x', 100, 10, 20, 30, 40] }])
    expect(b!.ranges).toEqual([10, 20, 30, 40, 50])
    expect(b!.ranges).toHaveLength(MAX_RANGES)
    expect(normalizeBullets([{ label: 'A', value: 1, ranges: 'nope' }])[0]!.ranges).toEqual([])
  })
  it('accepts negative ranges and values', () => {
    const [b] = normalizeBullets([{ label: 'A', value: -5, ranges: [10, -10] }])
    expect(b).toMatchObject({ value: -5, ranges: [-10, 10] })
  })
  it('ignores an unknown tone and a non-string unit', () => {
    expect(normalizeBullets([{ label: 'A', value: 1, tone: 'pink', unit: 3 }])[0]).toMatchObject({ tone: null, unit: '' })
  })
  it('does not mutate the input', () => {
    const input = [{ label: 'A', value: 1, ranges: [3, 1, 2] }]
    normalizeBullets(input)
    expect(input[0]!.ranges).toEqual([3, 1, 2])
  })
})

describe('bulletDomain', () => {
  const bullet = (over: Record<string, unknown> = {}) => normalizeBullets([{ label: 'A', value: 70, ...over }])
  it('always contains zero and ends on a nice tick above the data', () => {
    const d = bulletDomain(bullet({ target: 80, ranges: [50, 75, 100] }))
    expect(d.lo).toBe(0)
    expect(d.hi).toBe(100)
    expect(d.ticks[0]).toBe(0)
    expect(d.ticks[d.ticks.length - 1]).toBe(100)
  })
  it('extends below zero for negative values', () => {
    const d = bulletDomain(bullet({ value: -30, ranges: [10] }))
    expect(d.lo).toBeLessThanOrEqual(-30)
    expect(d.ticks).toContain(0)
  })
  it('gives [0, 1] when everything is zero or missing', () => {
    expect(bulletDomain(bullet({ value: 0 }))).toMatchObject({ lo: 0, hi: 1 })
    expect(bulletDomain(normalizeBullets([{ label: 'A', value: Number.NaN }]))).toMatchObject({ lo: 0, hi: 1 })
    expect(bulletDomain([])).toMatchObject({ lo: 0, hi: 1 })
  })
  it('ends exactly at an explicit max when every bullet has one', () => {
    const d = bulletDomain(bullet({ max: 90, value: 70 }))
    expect(d.hi).toBe(90)
    expect(d.ticks.every((t) => t >= d.lo && t <= 90)).toBe(true)
  })
  it('uses the largest max across bullets, and a nice end when one bullet has none', () => {
    const two = normalizeBullets([{ label: 'A', value: 10, max: 50 }, { label: 'B', value: 20, max: 80 }])
    expect(bulletDomain(two).hi).toBe(80)
    const mixed = normalizeBullets([{ label: 'A', value: 10, max: 50 }, { label: 'B', value: 62 }])
    expect(bulletDomain(mixed).hi).toBeGreaterThanOrEqual(62)
  })
  it('ignores a max that is not above the lower end', () => {
    expect(bulletDomain(bullet({ max: -5, value: 70 })).hi).toBeGreaterThanOrEqual(70)
    expect(bulletDomain(bullet({ max: 0, value: 0 }))).toMatchObject({ hi: 1 })
  })
  it('falls back to the end points when an explicit max leaves one tick', () => {
    const d = bulletDomain(normalizeBullets([{ label: 'A', value: 0.3, max: 0.4 }]))
    expect(d.ticks.length).toBeGreaterThan(1)
    expect(d.hi).toBe(0.4)
  })
  it('stays finite for huge values', () => {
    const d = bulletDomain(normalizeBullets([{ label: 'A', value: 1e300, ranges: [1e308] }, { label: 'B', value: -1e300 }]))
    expect([d.lo, d.hi, ...d.ticks].every(Number.isFinite)).toBe(true)
  })
})

describe('band styling', () => {
  it('has a literal class set for 1 to 5 bands, darkest first', () => {
    for (let n = 1; n <= 5; n++) expect(BAND_FILLS[n]).toHaveLength(n)
    expect(bandFill(0, 3)).toBe('fill-muted-foreground/30')
    expect(bandFill(2, 3)).toBe('fill-muted-foreground/10')
    expect(TRACK_FILL).toBe('fill-muted-foreground/10')
  })
  it('clamps out-of-range indexes and counts', () => {
    expect(bandFill(9, 3)).toBe(bandFill(2, 3))
    expect(bandFill(-1, 3)).toBe(bandFill(0, 3))
    expect(bandFill(0, 0)).toBe(BAND_FILLS[1]![0])
    expect(bandFill(4, 99)).toBe(BAND_FILLS[5]![4])
  })
  it('hatches the two darkest bands only, and never a single band', () => {
    expect(bandHatch(0, 1)).toBeNull()
    expect(bandHatch(0, 2)).toBe('dense')
    expect(bandHatch(1, 2)).toBeNull()
    expect(bandHatch(0, 3)).toBe('dense')
    expect(bandHatch(1, 3)).toBe('sparse')
    expect(bandHatch(2, 3)).toBeNull()
  })
})
