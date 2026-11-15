import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

export const FILTER_BAR_VARIANTS = ['default', 'compact', 'inline'] as const
export const FILTER_BAR_SIZES = ['sm', 'md', 'lg'] as const
export type FilterBarVariant = (typeof FILTER_BAR_VARIANTS)[number]
export type FilterBarSize = (typeof FILTER_BAR_SIZES)[number]

export const normalizeFilterVariant = (v: unknown): FilterBarVariant => ((FILTER_BAR_VARIANTS as readonly unknown[]).includes(v) ? (v as FilterBarVariant) : 'default')
export const normalizeFilterSize = (v: unknown): FilterBarSize => ((FILTER_BAR_SIZES as readonly unknown[]).includes(v) ? (v as FilterBarSize) : 'md')

/**
 * Wrapper of the whole bar: chips, "Add filter" and "Clear all" wrap onto new lines and never overflow the container.
 * `variant` sets the gaps (`default` 8px, `compact` 4px, `inline` wider column gap), `size` the text size of the chips.
 */
export const filterBarVariants = cva('flex w-full min-w-0 flex-wrap items-center', {
  variants: {
    variant: {
      default: 'gap-2',
      compact: 'gap-1',
      inline: 'gap-x-3 gap-y-1',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** The `<ul>` holding the chips: wraps with the same gaps as the bar. */
export const filterBarListVariants = cva('flex min-w-0 max-w-full flex-wrap items-center', {
  variants: {
    variant: {
      default: 'gap-2',
      compact: 'gap-1',
      inline: 'gap-x-3 gap-y-1',
    },
  },
  defaultVariants: { variant: 'default' },
})

/**
 * One applied filter. `variant`: `default` bordered pill with a muted fill, `compact` tighter padding and smaller corners,
 * `inline` flat with only a bottom rule (for use inside a sentence or a toolbar). `size` sets the text size. The chip text
 * wraps instead of truncating so long values stay readable at 320px and at 200% zoom.
 */
export const filterChipVariants = cva('inline-flex max-w-full min-w-0 items-center border font-medium', {
  variants: {
    variant: {
      default: 'gap-1 rounded-md border-border bg-muted ps-2.5 pe-0.5 text-foreground',
      compact: 'gap-0.5 rounded-sm border-border bg-muted ps-1.5 pe-0.5 text-foreground',
      inline: 'gap-1 rounded-none border-0 border-b border-border bg-transparent ps-0 pe-0.5 text-foreground forced-colors:border-b-[ButtonText]',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** The remove button inside a chip: 24px, 32px on touch devices. */
export const filterChipRemoveVariants = cva(
  'inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground pointer-coarse:size-8 disabled:pointer-events-none disabled:opacity-50 forced-colors:hover:outline ' + focusRing,
)

export type FilterBarVariants = VariantProps<typeof filterBarVariants>
export type FilterChipVariants = VariantProps<typeof filterChipVariants>
