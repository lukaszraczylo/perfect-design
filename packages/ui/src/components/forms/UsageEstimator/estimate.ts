/** Pure pricing maths for `UsageEstimator`. Nothing here rounds: round only when a number is displayed. */

export interface UsageTier {
  /** Upper bound of the tier in billable units (after `included`); `null` means no upper bound. */
  upTo: number | null
  /** Price per `per` units inside this tier. */
  rate: number
}

export interface UsageDimension {
  id: string
  label: string
  unit: string
  /** Singular unit for the rate hint when `per` is 1 ("$5 / seat"); `unit` is used when it is missing or empty. */
  unitSingular?: string
  /** Price per `per` units. Ignored when `tiers` is a non-empty array. */
  rate: number
  /** The rate applies per this many units (default 1). Partial blocks are charged pro rata. */
  per?: number
  /** Free units. Only the quantity above this is billed. */
  included?: number
  min?: number
  max: number
  step?: number
  tiers?: UsageTier[]
}

const finiteOr = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
const nonNegative = (value: unknown): number => Math.max(0, finiteOr(value, 0))

/** Block size of the rate: a missing, zero, negative or non-finite `per` means 1. */
export function unitsPer(dimension: Pick<UsageDimension, 'per'>): number {
  const per = finiteOr(dimension.per, 1)
  return per > 0 ? per : 1
}

/** Lower bound of the control: `min` when finite and not negative, else 0. */
export function lowerBound(dimension: Pick<UsageDimension, 'min'>): number {
  return nonNegative(dimension.min)
}

/**
 * Quantity the estimate uses: NaN, non-numbers and negatives become 0, then the value is held between `min` and `max`
 * (Infinity lands on `max`). A `max` that is not a number leaves the top open and a non-finite result becomes 0.
 */
export function clampQuantity(dimension: Pick<UsageDimension, 'min' | 'max'>, quantity: unknown): number {
  let q = typeof quantity === 'number' && !Number.isNaN(quantity) ? Math.max(0, quantity) : 0
  q = Math.max(q, lowerBound(dimension))
  if (typeof dimension.max === 'number' && !Number.isNaN(dimension.max)) q = Math.min(q, dimension.max)
  return Number.isFinite(q) ? q : 0
}

/** Cost of one dimension at `quantity`: included units are free, tiers are graduated, `per` blocks are pro rata. */
export function lineCost(dimension: UsageDimension, quantity: unknown): number {
  const billable = Math.max(0, clampQuantity(dimension, quantity) - nonNegative(dimension.included))
  if (billable === 0) return 0
  const per = unitsPer(dimension)
  const tiers = Array.isArray(dimension.tiers) ? dimension.tiers : []
  if (tiers.length === 0) return (billable / per) * nonNegative(dimension.rate)
  let cost = 0
  let from = 0
  let lastRate = 0
  for (const tier of tiers) {
    const to = tier?.upTo === null || tier?.upTo === undefined ? Infinity : finiteOr(tier.upTo, from)
    if (to <= from) continue
    lastRate = nonNegative(tier?.rate)
    cost += ((Math.min(billable, to) - from) / per) * lastRate
    from = to
    if (billable <= to) return cost
  }
  // Units above the last bounded tier are billed at that tier's rate.
  return cost + ((billable - from) / per) * lastRate
}

/** Sum of every dimension's `lineCost`. Missing values count as the dimension's `min` (or 0). */
export function estimateTotal(dimensions: UsageDimension[], values: Record<string, number> | undefined): number {
  if (!Array.isArray(dimensions)) return 0
  let total = 0
  for (const d of dimensions) {
    if (!d || typeof d !== 'object') continue
    total += lineCost(d, values?.[d.id] ?? lowerBound(d))
  }
  return Number.isFinite(total) ? total : 0
}
