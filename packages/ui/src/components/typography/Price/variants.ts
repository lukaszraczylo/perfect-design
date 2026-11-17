import { cva, type VariantProps } from '../../../lib/cva'

export const PRICE_SIZES = ['sm', 'md', 'lg', 'xl'] as const
export const PRICE_TONES = ['default', 'muted', 'primary'] as const
export type PriceSize = (typeof PRICE_SIZES)[number]
export type PriceTone = (typeof PRICE_TONES)[number]

/** Price root: tabular figures always; `size` sets the amount scale, `tone` its colour. */
export const priceVariants = cva('inline-flex flex-wrap items-baseline gap-x-1.5 whitespace-nowrap tabular-nums', {
  variants: {
    size: {
      sm: 'text-base font-medium',
      md: 'text-xl font-semibold',
      lg: 'text-3xl font-semibold tracking-tight',
      xl: 'text-5xl font-semibold tracking-tight',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
    },
  },
  defaultVariants: { size: 'md', tone: 'default' },
})

/** Period and previous-price text: smaller than the amount, muted, regular weight. */
export const priceAuxVariants = cva('font-normal tracking-normal text-muted-foreground', {
  variants: {
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-lg' },
  },
  defaultVariants: { size: 'md' },
})

export type PriceVariants = VariantProps<typeof priceVariants>

export const resolvePriceSize = (v: unknown): PriceSize => ((PRICE_SIZES as readonly unknown[]).includes(v) ? (v as PriceSize) : 'md')
export const resolvePriceTone = (v: unknown): PriceTone => ((PRICE_TONES as readonly unknown[]).includes(v) ? (v as PriceTone) : 'default')
