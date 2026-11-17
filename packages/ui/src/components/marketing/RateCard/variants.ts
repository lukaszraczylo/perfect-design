import { cva, type VariantProps } from '../../../lib/cva'

export const RATE_CARD_VARIANTS = ['table', 'list'] as const
export const RATE_CARD_SIZES = ['sm', 'md', 'lg'] as const
export type RateCardVariant = (typeof RATE_CARD_VARIANTS)[number]
export type RateCardSize = (typeof RATE_CARD_SIZES)[number]

export const rateCardVariants = cva('flex w-full flex-col', {
  variants: {
    variant: { table: '', list: '' },
    size: { sm: 'gap-2 text-xs', md: 'gap-3 text-sm', lg: 'gap-4 text-base' },
  },
  defaultVariants: { variant: 'table', size: 'md' },
})

/** Table cell: padding per size. */
export const rateCardCellVariants = cva('border-b border-border align-baseline', {
  variants: { size: { sm: 'px-2 py-1.5', md: 'px-3 py-2', lg: 'px-4 py-3' } },
  defaultVariants: { size: 'md' },
})

/** One stacked row of the `list` variant. */
export const rateCardRowVariants = cva('flex flex-col border-b border-border last:border-b-0', {
  variants: { size: { sm: 'gap-0.5 py-1.5', md: 'gap-1 py-2.5', lg: 'gap-1.5 py-3.5' } },
  defaultVariants: { size: 'md' },
})

export type RateCardVariants = VariantProps<typeof rateCardVariants>

export const resolveRateCardVariant = (v: unknown): RateCardVariant => ((RATE_CARD_VARIANTS as readonly unknown[]).includes(v) ? (v as RateCardVariant) : 'table')
export const resolveRateCardSize = (v: unknown): RateCardSize => ((RATE_CARD_SIZES as readonly unknown[]).includes(v) ? (v as RateCardSize) : 'md')
