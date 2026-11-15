/** Price helpers shared by PricingCard, PricingGrid and PricingTable. Internal (not exported from the barrel). */

export type PricingAmount = string | number
export const BILLING_VALUES = ['monthly', 'yearly'] as const
export type PricingBilling = (typeof BILLING_VALUES)[number]

/** Unknown values fall back to `monthly`. */
export function normalizeBilling(value: unknown, fallback: PricingBilling = 'monthly'): PricingBilling {
  return (BILLING_VALUES as readonly unknown[]).includes(value) ? (value as PricingBilling) : fallback
}

/** A price is present unless undefined, null, an empty string or NaN. `0` is a valid price. */
export function hasAmount(value: unknown): value is PricingAmount {
  if (typeof value === 'number') return !Number.isNaN(value)
  return typeof value === 'string' && value !== ''
}

export interface PricingSource {
  price?: PricingAmount
  period?: string
  yearlyPrice?: PricingAmount
  yearlyPeriod?: string
}

export interface ResolvedPrice {
  amount: PricingAmount | undefined
  period: string | undefined
  /** True when the yearly price is the one being shown. */
  yearly: boolean
}

/**
 * Pick what to display for the given billing period. Yearly is used only when the plan has a `yearlyPrice`;
 * plans such as "Free" or "Custom" keep their single price in both modes. `yearlyPeriod` falls back to `period`.
 */
export function resolvePrice(source: PricingSource, billing: PricingBilling): ResolvedPrice {
  if (billing === 'yearly' && hasAmount(source.yearlyPrice)) {
    return { amount: source.yearlyPrice, period: source.yearlyPeriod || source.period || undefined, yearly: true }
  }
  return { amount: hasAmount(source.price) ? source.price : undefined, period: source.period || undefined, yearly: false }
}
