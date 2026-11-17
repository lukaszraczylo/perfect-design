export { default as TieredPricing } from './TieredPricing.vue'
export type { TieredPricingProps } from './TieredPricing.vue'
export { tierTotal, normalizeTiers, activeTierIndexes, tierUnits } from './tiers'
export type { PricingTier, PricingMode, NormalizedTier } from './tiers'
export {
  tieredPricingVariants,
  tieredPricingCellVariants,
  tieredPricingStepVariants,
  TIERED_PRICING_VARIANTS,
  TIERED_PRICING_SIZES,
  resolveTieredPricingVariant,
  resolveTieredPricingSize,
} from './variants'
export type { TieredPricingVariants, TieredPricingVariant, TieredPricingSize } from './variants'
