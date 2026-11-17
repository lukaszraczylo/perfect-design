import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'

export const USAGE_ESTIMATOR_VARIANTS = ['card', 'plain'] as const
export const USAGE_ESTIMATOR_SIZES = ['sm', 'md', 'lg'] as const
export const USAGE_ESTIMATOR_INPUTS = ['slider', 'number', 'both'] as const
export type UsageEstimatorVariant = (typeof USAGE_ESTIMATOR_VARIANTS)[number]
export type UsageEstimatorSize = (typeof USAGE_ESTIMATOR_SIZES)[number]
export type UsageEstimatorInput = (typeof USAGE_ESTIMATOR_INPUTS)[number]

const pick = <T extends string>(list: readonly T[], value: unknown, fallback: T): T => ((list as readonly unknown[]).includes(value) ? (value as T) : fallback)
export const normalizeUsageEstimatorVariant = (value: unknown) => pick(USAGE_ESTIMATOR_VARIANTS, value, 'card')
export const normalizeUsageEstimatorSize = (value: unknown) => pick(USAGE_ESTIMATOR_SIZES, value, 'md')
export const normalizeUsageEstimatorInput = (value: unknown) => pick(USAGE_ESTIMATOR_INPUTS, value, 'both')

const rootBase = cva('flex min-w-0 flex-col', {
  variants: {
    variant: { card: 'rounded-lg border bg-card text-card-foreground', plain: '' },
    size: { sm: 'gap-4 text-sm', md: 'gap-5', lg: 'gap-6 text-base' },
  },
  compoundVariants: [
    { variant: 'card', size: 'sm', class: 'p-3' },
    { variant: 'card', size: 'md', class: 'p-4' },
    { variant: 'card', size: 'lg', class: 'p-5' },
  ],
  defaultVariants: { variant: 'card', size: 'md' },
})

/** Root class string of the estimator. */
export function usageEstimatorVariants(props: NonNullable<Parameters<typeof rootBase>[0]> = {}): string {
  return cn(rootBase(props))
}

const rowBase = cva('grid min-w-0 gap-2', {
  variants: { size: { sm: 'gap-1.5', md: '', lg: 'gap-3' } },
  defaultVariants: { size: 'md' },
})

/** One metered dimension: heading line (label and cost) above its controls. */
export function usageEstimatorRowVariants(props: NonNullable<Parameters<typeof rowBase>[0]> = {}): string {
  return cn(rowBase(props))
}

const totalBase = cva('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-4', {
  variants: { size: { sm: 'pt-3', md: '', lg: 'pt-5' } },
  defaultVariants: { size: 'md' },
})

/** Footer line with the estimated total. */
export function usageEstimatorTotalVariants(props: NonNullable<Parameters<typeof totalBase>[0]> = {}): string {
  return cn(totalBase(props))
}

export type UsageEstimatorVariants = VariantProps<typeof rootBase>
