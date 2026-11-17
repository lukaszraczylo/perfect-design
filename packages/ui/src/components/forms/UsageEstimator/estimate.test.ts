import { describe, expect, it } from 'vitest'
import { clampQuantity, estimateTotal, lineCost, lowerBound, unitsPer, type UsageDimension } from './estimate'

const requests: UsageDimension = { id: 'requests', label: 'Requests', unit: 'requests', rate: 0.4, per: 1000, included: 10000, max: 1000000 }
const tiered: UsageDimension = { id: 'storage', label: 'Storage', unit: 'GB', rate: 9, tiers: [{ upTo: 100, rate: 0.1 }, { upTo: 1000, rate: 0.05 }, { upTo: null, rate: 0.02 }], max: 5000 }
const seats: UsageDimension = { id: 'seats', label: 'Seats', unit: 'seats', rate: 5, included: 3, min: 1, max: 50 }

describe('lineCost: flat rate', () => {
  it('is free up to and including the included units', () => {
    expect(lineCost(requests, 0)).toBe(0)
    expect(lineCost(requests, 5000)).toBe(0)
    expect(lineCost(requests, 10000)).toBe(0)
  })
  it('bills only the units above included, pro rata per block', () => {
    expect(lineCost(requests, 11000)).toBeCloseTo(0.4, 10)
    expect(lineCost(requests, 12500)).toBeCloseTo(1, 10)
    expect(lineCost(requests, 1000000)).toBeCloseTo(396, 10)
  })
  it('prices per unit when `per` is missing, zero, negative or not finite', () => {
    for (const per of [undefined, 0, -5, NaN, Infinity]) expect(lineCost({ ...seats, per }, 13)).toBeCloseTo(50, 10)
    expect(unitsPer({ per: 1000 })).toBe(1000)
    expect(unitsPer({})).toBe(1)
  })
  it('treats a bad or negative rate as 0', () => {
    expect(lineCost({ ...seats, rate: NaN }, 10)).toBe(0)
    expect(lineCost({ ...seats, rate: -3 }, 10)).toBe(0)
  })
  it('ignores a bad or negative `included`', () => {
    expect(lineCost({ ...seats, included: -4 }, 10)).toBe(50)
    expect(lineCost({ ...seats, included: NaN }, 10)).toBe(50)
  })
})

describe('lineCost: graduated tiers', () => {
  it('bills exactly at a tier boundary with the lower tier only', () => {
    expect(lineCost(tiered, 100)).toBeCloseTo(10, 10)
    expect(lineCost(tiered, 1000)).toBeCloseTo(55, 10)
  })
  it('bills the first unit above a boundary at the next tier rate', () => {
    expect(lineCost(tiered, 101)).toBeCloseTo(10.05, 10)
    expect(lineCost(tiered, 1001)).toBeCloseTo(55.02, 10)
  })
  it('replaces the flat rate and reaches the open last tier', () => {
    expect(lineCost(tiered, 5000)).toBeCloseTo(135, 10)
    expect(lineCost(tiered, 50)).toBeCloseTo(5, 10)
  })
  it('counts tier bounds after the included units', () => {
    expect(lineCost({ ...tiered, included: 50 }, 150)).toBeCloseTo(10, 10)
    expect(lineCost({ ...tiered, included: 50 }, 40)).toBe(0)
  })
  it('bills units above the last bounded tier at that tier rate', () => {
    const bounded: UsageDimension = { ...tiered, tiers: [{ upTo: 100, rate: 0.1 }, { upTo: 200, rate: 0.05 }] }
    expect(lineCost(bounded, 300)).toBeCloseTo(10 + 5 + 5, 10)
  })
  it('applies `per` inside tiers', () => {
    expect(lineCost({ ...tiered, per: 10, tiers: [{ upTo: 100, rate: 1 }] }, 100)).toBeCloseTo(10, 10)
  })
  it('falls back to the flat rate for an empty tier list and skips zero-width tiers', () => {
    expect(lineCost({ ...seats, included: 0, tiers: [] }, 10)).toBe(50)
    expect(lineCost({ ...tiered, tiers: [{ upTo: 0, rate: 99 }, { upTo: null, rate: 2 }] }, 10)).toBe(20)
  })
})

describe('clampQuantity and bad input', () => {
  it('maps NaN, negatives and non-numbers to 0', () => {
    for (const bad of [NaN, -1, -Infinity, 'abc', null, undefined, {}]) expect(clampQuantity({ max: 10 }, bad)).toBe(0)
  })
  it('holds the value between min and max, and lands Infinity on max', () => {
    expect(clampQuantity(seats, 0)).toBe(1)
    expect(clampQuantity(seats, NaN)).toBe(1)
    expect(clampQuantity(seats, 51)).toBe(50)
    expect(clampQuantity(seats, Infinity)).toBe(50)
    expect(clampQuantity(seats, 7)).toBe(7)
  })
  it('keeps huge values below max exact and leaves an open max alone', () => {
    expect(clampQuantity({ max: 1e15 }, 1e12)).toBe(1e12)
    expect(clampQuantity({ max: NaN }, 5)).toBe(5)
  })
  it('clamps before pricing', () => {
    expect(lineCost(seats, 1000)).toBeCloseTo((50 - 3) * 5, 10)
    expect(lineCost(seats, -9)).toBe(0)
    expect(lineCost(requests, NaN)).toBe(0)
  })
  it('uses 0 for a negative or missing min', () => {
    expect(lowerBound({ min: -3 })).toBe(0)
    expect(lowerBound({})).toBe(0)
    expect(lowerBound({ min: 4 })).toBe(4)
  })
})

describe('estimateTotal', () => {
  it('sums the cost of every dimension', () => {
    expect(estimateTotal([requests, tiered, seats], { requests: 12500, storage: 1000, seats: 5 })).toBeCloseTo(1 + 55 + 10, 10)
  })
  it('counts a missing value as the dimension min', () => {
    expect(estimateTotal([requests, seats], {})).toBeCloseTo(0, 10)
    expect(estimateTotal([{ ...seats, included: 0 }], undefined)).toBe(5)
  })
  it('ignores unknown ids and bad dimensions, and returns 0 for no dimensions', () => {
    expect(estimateTotal([seats], { other: 99 })).toBe(0)
    expect(estimateTotal([], {})).toBe(0)
    expect(estimateTotal(null as unknown as UsageDimension[], {})).toBe(0)
    expect(estimateTotal([null as unknown as UsageDimension, seats], { seats: 4 })).toBe(5)
  })
  it('does not round: the raw sum is returned', () => {
    expect(estimateTotal([{ ...seats, included: 0, rate: 0.1 }], { seats: 3 })).toBeCloseTo(0.3, 12)
    expect(estimateTotal([{ ...seats, included: 0, rate: 0.001, min: 0 }], { seats: 7 })).toBeCloseTo(0.007, 12)
  })
})
