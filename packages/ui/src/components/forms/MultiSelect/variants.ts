import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/** Trigger heights. The trigger grows with its chips, so these are minimum heights. */
export const MULTI_SELECT_SIZES = {
  xs: 'min-h-7 px-2 py-0.5 text-md md:text-xs',
  sm: 'min-h-8 px-2.5 py-1 text-md md:text-sm',
  md: 'min-h-9 px-3 py-1.5 text-md md:text-sm',
  lg: 'min-h-10 px-4 py-2 text-md',
} as const

const base = cva(
  'flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent text-start shadow-xs transition-[color,box-shadow] motion-reduce:transition-none dark:bg-input/30 ' +
    'outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 ' +
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    touchTarget,
  {
    variants: {
      size: MULTI_SELECT_SIZES,
      shape: FIELD_SHAPE_CLASSES,
      variant: FIELD_VARIANT_CLASSES,
      status: FIELD_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  },
)

/**
 * Trigger styling: field surface, size, variant, shape and status. Conflicting utilities are resolved (later wins), so it
 * can be put on a plain `<button>`: `<button :class="multiSelectTriggerVariants({ variant: 'filled' })">`.
 */
export const multiSelectTriggerVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type MultiSelectTriggerVariants = VariantProps<typeof multiSelectTriggerVariants>
