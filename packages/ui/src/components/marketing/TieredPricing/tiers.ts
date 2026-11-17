export type PricingMode = 'graduated' | 'volume'

export interface PricingTier {
  /** Highest unit count the tier covers (inclusive). `null` means "and above". */
  upTo: number | null
  /** Price per unit. */
  rate: number
  /** Fixed amount charged once when the tier applies. */
  flat?: number
}

export interface NormalizedTier extends PricingTier {
  /** Exclusive lower bound: the previous tier's `upTo`, or 0. */
  from: number
  /** Index in the array the caller passed. */
  source: number
}

const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

export const resolvePricingMode = (m: unknown): PricingMode => (m === 'volume' ? 'volume' : 'graduated')

/**
 * Valid tiers sorted by `upTo` (open-ended tier last). Dropped: entries without a finite `rate`, a non-null `upTo` that
 * is not a finite number above 0, a second open-ended tier. Equal `upTo` values keep their input order.
 */
export function normalizeTiers(tiers: readonly PricingTier[] | null | undefined): NormalizedTier[] {
  if (!Array.isArray(tiers)) return []
  const valid = tiers
    .map((t, source) => ({ t, source }))
    .filter(({ t }) => t && isNum(t.rate) && (t.upTo === null || (isNum(t.upTo) && t.upTo > 0)))
    .sort((a, b) => (a.t.upTo === null ? Infinity : a.t.upTo!) - (b.t.upTo === null ? Infinity : b.t.upTo!) || a.source - b.source)
  const out: NormalizedTier[] = []
  let from = 0
  for (const { t, source } of valid) {
    if (t.upTo === null && out.some((o) => o.upTo === null)) continue
    out.push({ upTo: t.upTo, rate: t.rate, ...(isNum(t.flat) ? { flat: t.flat } : {}), from, source })
    if (t.upTo !== null) from = t.upTo
  }
  return out
}

const cleanUsage = (usage: unknown): number => (isNum(usage) && usage > 0 ? usage : 0)

/** Units billed in each tier (graduated). The last tier is open-ended even when its `upTo` is finite. */
export function tierUnits(tiers: readonly NormalizedTier[], usage: unknown): number[] {
  const u = cleanUsage(usage)
  return tiers.map((t, i) => {
    const top = t.upTo === null || i === tiers.length - 1 ? Infinity : t.upTo
    return Math.min(Math.max(u - t.from, 0), top - t.from)
  })
}

/** Index of the tier a total usage reaches (volume), or -1 for no usage or no tiers. */
function reachedIndex(tiers: readonly NormalizedTier[], usage: number): number {
  if (usage <= 0 || tiers.length === 0) return -1
  const i = tiers.findIndex((t) => t.upTo === null || usage <= t.upTo)
  return i === -1 ? tiers.length - 1 : i
}

/** Indexes of the tiers a usage touches: one for `volume`, every tier with units for `graduated`. Empty for no usage. */
export function activeTierIndexes(tiers: readonly NormalizedTier[], usage: unknown, mode: PricingMode): number[] {
  const u = cleanUsage(usage)
  if (mode === 'volume') {
    const i = reachedIndex(tiers, u)
    return i === -1 ? [] : [i]
  }
  return tierUnits(tiers, u).flatMap((units, i) => (units > 0 ? [i] : []))
}

const round = (n: number) => Number(n.toFixed(10))

/**
 * Total price for `usage` units.
 *
 * - `graduated`: each tier's units cost that tier's `rate`; a tier's `flat` is added once when it has units.
 * - `volume`: every unit costs the `rate` of the tier the total reaches, plus that tier's `flat`.
 *
 * `upTo` is inclusive (usage equal to `upTo` is in that tier). Usage that is 0, negative or not finite costs 0. Tiers are
 * sorted first and invalid ones dropped (see `normalizeTiers`). Usage above the last tier continues at the last tier's rate.
 */
export function tierTotal(tiers: readonly PricingTier[] | null | undefined, usage: unknown, mode: PricingMode = 'graduated'): number {
  const sorted = normalizeTiers(tiers)
  const u = cleanUsage(usage)
  if (u === 0 || sorted.length === 0) return 0
  if (mode === 'volume') {
    const t = sorted[reachedIndex(sorted, u)]
    return round(u * t.rate + (t.flat ?? 0))
  }
  const units = tierUnits(sorted, u)
  return round(sorted.reduce((sum, t, i) => sum + units[i] * t.rate + (units[i] > 0 ? (t.flat ?? 0) : 0), 0))
}
