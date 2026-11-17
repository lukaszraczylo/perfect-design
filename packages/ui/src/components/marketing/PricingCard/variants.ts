import { cva, type VariantProps } from '../../../lib/cva'
import { merged, resolveSurfaceShape, resolveSurfaceSize, type SurfaceShape, type SurfaceSize } from '../shared/surface'

export const PRICING_CARD_VARIANTS = ['default', 'highlighted', 'outline', 'minimal', 'compact'] as const

const pricingCardBase = cva('relative flex flex-col text-card-foreground', {
  variants: {
    variant: {
      default: 'gap-6 rounded-lg border bg-card p-6 text-card-foreground',
      highlighted: 'gap-6 rounded-lg border bg-card p-6 text-card-foreground',
      outline: 'gap-6 rounded-lg border-2 border-border bg-transparent p-6',
      minimal: 'gap-5 py-2',
      compact: 'gap-4 rounded-lg border bg-card p-4 text-sm text-card-foreground',
    },
    highlighted: {
      true: 'border-primary ring-1 ring-primary',
      false: '',
    },
    size: { sm: '', md: '', lg: '' },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    // `variant: 'highlighted'` carries the emphasis itself so the exported cva works standalone. A solid primary border
    // plus a 1px ring of the same colour: no glow, no coloured shadow, and it survives forced-colors mode as a border.
    { variant: 'highlighted', class: 'border-primary ring-1 ring-primary' },
    // minimal has no frame of its own: when emphasised it gets one.
    { variant: 'minimal', highlighted: true, class: 'rounded-lg border bg-card p-6 text-card-foreground' },
    // `md` keeps the original padding and gap of every variant.
    { variant: ['default', 'highlighted', 'outline'], size: 'sm', class: 'gap-4 p-4' },
    { variant: ['default', 'highlighted', 'outline'], size: 'lg', class: 'gap-8 p-8' },
    { variant: 'minimal', size: 'sm', class: 'gap-4' },
    { variant: 'minimal', size: 'lg', class: 'gap-7' },
    { variant: 'minimal', highlighted: true, size: 'sm', class: 'p-4' },
    { variant: 'minimal', highlighted: true, size: 'lg', class: 'p-8' },
    { variant: 'compact', size: 'sm', class: 'gap-3 p-3' },
    { variant: 'compact', size: 'lg', class: 'gap-5 p-6' },
    // `square` removes the radius (last, so it also wins over the frame `minimal` gains when emphasised).
    { shape: 'square', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'default', highlighted: false, size: 'md', shape: 'rounded' },
})

/** Card root. Conflict-free output (later classes win), so it is safe on plain elements. */
export const pricingCardVariants = merged(pricingCardBase)

const pricingCardAmountBase = cva('font-bold tracking-tight', {
  variants: {
    variant: { default: 'text-4xl', highlighted: 'text-4xl', outline: 'text-4xl', minimal: 'text-4xl', compact: 'text-2xl' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['default', 'highlighted', 'outline', 'minimal'], size: 'sm', class: 'text-3xl' },
    { variant: ['default', 'highlighted', 'outline', 'minimal'], size: 'lg', class: 'text-5xl' },
    { variant: 'compact', size: 'sm', class: 'text-xl' },
    { variant: 'compact', size: 'lg', class: 'text-3xl' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Price figure. Conflict-free output (later classes win). */
export const pricingCardAmountVariants = merged(pricingCardAmountBase)

export const pricingCardFeaturesVariants = cva('flex flex-col text-sm', {
  variants: { variant: { default: 'gap-2.5', highlighted: 'gap-2.5', outline: 'gap-2.5', minimal: 'gap-2.5', compact: 'gap-1.5 text-xs' } },
  defaultVariants: { variant: 'default' },
})

export type PricingCardVariants = VariantProps<typeof pricingCardBase>
export type PricingCardSize = SurfaceSize
export type PricingCardShape = SurfaceShape
export const resolvePricingCardSize = resolveSurfaceSize
export const resolvePricingCardShape = resolveSurfaceShape
export type PricingCardVariant = (typeof PRICING_CARD_VARIANTS)[number]

/** Unknown values fall back to `default`. */
export function resolvePricingCardVariant(value: unknown): PricingCardVariant {
  return (PRICING_CARD_VARIANTS as readonly unknown[]).includes(value) ? (value as PricingCardVariant) : 'default'
}
