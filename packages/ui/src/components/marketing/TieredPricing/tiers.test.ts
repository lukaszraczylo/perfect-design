import { describe, expect, it } from 'vitest'
import { activeTierIndexes, normalizeTiers, tierTotal, tierUnits, type PricingTier } from './tiers'

const A: PricingTier[] = [
  { upTo: 1000, rate: 0.5 },
  { upTo: 10000, rate: 0.4 },
  { upTo: null, rate: 0.3 },
]
const FLAT: PricingTier[] = [
  { upTo: 10, rate: 5, flat: 20 },
  { upTo: 50, rate: 4, flat: 20 },
  { upTo: null, rate: 3, flat: 20 },
]

describe('tierTotal graduated (hand-computed)', () => {
  it.each([
    [0, 0],
    [500, 250], // 500 * 0.5
    [1000, 500], // exactly the first boundary
    [1001, 500.4], // 1000 * 0.5 + 1 * 0.4
    [10000, 4100], // 500 + 9000 * 0.4
    [10001, 4100.3], // + 1 * 0.3
    [12500, 4850], // 4100 + 2500 * 0.3
  ])('usage %d costs %d', (usage, expected) => expect(tierTotal(A, usage, 'graduated')).toBe(expected))
  it('defaults to graduated', () => expect(tierTotal(A, 12500)).toBe(4850))
  it('adds a flat fee once for each tier that holds units', () => {
    expect(tierTotal(FLAT, 5)).toBe(45) // 5 * 5 + 20
    expect(tierTotal(FLAT, 10)).toBe(70) // 10 * 5 + 20
    expect(tierTotal(FLAT, 30)).toBe(170) // (10 * 5 + 20) + (20 * 4 + 20)
    expect(tierTotal(FLAT, 60)).toBe(70 + 180 + 30 + 20) // third tier: 10 * 3 + 20
  })
})

describe('tierTotal volume (hand-computed)', () => {
  it.each([
    [0, 0],
    [500, 250], // 500 * 0.5
    [1000, 500], // boundary stays in the first tier
    [1001, 400.4], // 1001 * 0.4
    [10000, 4000],
    [10001, 3000.3], // 10001 * 0.3
    [12500, 3750],
  ])('usage %d costs %d', (usage, expected) => expect(tierTotal(A, usage, 'volume')).toBe(expected))
  it('adds the flat fee of the tier reached', () => {
    expect(tierTotal(FLAT, 5, 'volume')).toBe(45)
    expect(tierTotal(FLAT, 30, 'volume')).toBe(140) // 30 * 4 + 20
    expect(tierTotal(FLAT, 60, 'volume')).toBe(200) // 60 * 3 + 20
  })
})

describe('tierTotal edge cases', () => {
  it.each([-1, -0.5, Number.NaN, Infinity, -Infinity, undefined, null, '5', {}])('unusable usage %s costs 0', (u) => {
    expect(tierTotal(A, u, 'graduated')).toBe(0)
    expect(tierTotal(A, u, 'volume')).toBe(0)
  })
  it('empty, missing and malformed tier lists cost 0', () => {
    expect(tierTotal([], 10)).toBe(0)
    expect(tierTotal(undefined, 10)).toBe(0)
    expect(tierTotal(null, 10)).toBe(0)
    expect(tierTotal('x' as never, 10)).toBe(0)
  })
  it('sorts unsorted tiers with the open tier last', () => {
    const shuffled: PricingTier[] = [A[2], A[1], A[0]]
    expect(tierTotal(shuffled, 12500)).toBe(4850)
    expect(tierTotal(shuffled, 12500, 'volume')).toBe(3750)
  })
  it('does not mutate the input', () => {
    const shuffled: PricingTier[] = [A[2], A[1], A[0]]
    const copy = JSON.stringify(shuffled)
    tierTotal(shuffled, 5)
    expect(JSON.stringify(shuffled)).toBe(copy)
  })
  it('continues at the last tier rate above the last finite tier', () => {
    const closed: PricingTier[] = [{ upTo: 100, rate: 2 }, { upTo: 200, rate: 1 }]
    expect(tierTotal(closed, 300)).toBe(400) // 100 * 2 + 200 * 1
    expect(tierTotal(closed, 300, 'volume')).toBe(300) // 300 * 1
  })
  it('handles a single open tier', () => {
    expect(tierTotal([{ upTo: null, rate: 0.3 }], 7)).toBe(2.1)
    expect(tierTotal([{ upTo: null, rate: 0.3 }], 7, 'volume')).toBe(2.1)
  })
  it('skips invalid tiers and a second open tier', () => {
    const bad = [{ upTo: -1, rate: 1 }, { upTo: Number.NaN, rate: 1 }, { upTo: 0, rate: 1 }, { upTo: 10, rate: Number.NaN }, null, { upTo: 10, rate: 2 }] as unknown as PricingTier[]
    expect(tierTotal(bad, 5)).toBe(10)
    expect(tierTotal([{ upTo: null, rate: 1 }, { upTo: null, rate: 9 }], 10)).toBe(10)
  })
  it('removes float noise', () => expect(tierTotal([{ upTo: null, rate: 0.1 }], 3)).toBe(0.3))
  it('handles huge usage', () => {
    expect(tierTotal(A, 1e12, 'volume')).toBe(3e11)
    expect(tierTotal(A, 1e12)).toBeCloseTo(4100 + (1e12 - 10000) * 0.3, 0)
  })
  it('fractional usage', () => expect(tierTotal(A, 0.5)).toBe(0.25))
  it('ignores a non-numeric flat', () => expect(tierTotal([{ upTo: null, rate: 1, flat: Number.NaN }], 2)).toBe(2))
})

describe('normalizeTiers, tierUnits, activeTierIndexes', () => {
  it('computes lower bounds and keeps the source index', () => {
    const n = normalizeTiers([A[2], A[0], A[1]])
    expect(n.map((t) => [t.from, t.upTo, t.source])).toEqual([[0, 1000, 1], [1000, 10000, 2], [10000, null, 0]])
  })
  it('units per tier', () => {
    const n = normalizeTiers(A)
    expect(tierUnits(n, 12500)).toEqual([1000, 9000, 2500])
    expect(tierUnits(n, 1000)).toEqual([1000, 0, 0])
    expect(tierUnits(n, -3)).toEqual([0, 0, 0])
  })
  it('graduated marks every tier with units, volume only the one reached', () => {
    const n = normalizeTiers(A)
    expect(activeTierIndexes(n, 12500, 'graduated')).toEqual([0, 1, 2])
    expect(activeTierIndexes(n, 1000, 'graduated')).toEqual([0])
    expect(activeTierIndexes(n, 1001, 'graduated')).toEqual([0, 1])
    expect(activeTierIndexes(n, 12500, 'volume')).toEqual([2])
    expect(activeTierIndexes(n, 1000, 'volume')).toEqual([0])
    expect(activeTierIndexes(n, 1001, 'volume')).toEqual([1])
    expect(activeTierIndexes(n, 0, 'volume')).toEqual([])
    expect(activeTierIndexes(n, Number.NaN, 'graduated')).toEqual([])
    expect(activeTierIndexes([], 5, 'volume')).toEqual([])
  })
  it('volume above the last finite tier marks the last tier', () => {
    expect(activeTierIndexes(normalizeTiers([{ upTo: 10, rate: 1 }]), 50, 'volume')).toEqual([0])
  })
})
