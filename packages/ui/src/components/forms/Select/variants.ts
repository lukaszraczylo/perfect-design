import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/** Trigger heights. The label sizes mirror the other text fields; `md` keeps the 14px text from the `md` breakpoint. */
export const SELECT_TRIGGER_SIZES = {
  xs: 'h-7 px-2 text-md md:text-xs',
  sm: 'h-8 text-md md:text-sm',
  md: 'h-9 text-md md:text-sm',
  lg: 'h-11 text-md',
} as const

const base = cva(
  [
    fieldSurface,
    'flex items-center justify-between gap-2 py-1 text-start whitespace-nowrap select-none',
    touchTarget,
    'data-[placeholder]:text-muted-foreground',
    '*:data-[slot=select-value]:line-clamp-1 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      size: SELECT_TRIGGER_SIZES,
      shape: FIELD_SHAPE_CLASSES,
      variant: FIELD_VARIANT_CLASSES,
      status: FIELD_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  },
)

/**
 * Class list of the Select trigger: field surface, size, variant, shape and status. Conflicting utilities are resolved
 * (later wins), so it can be put on a plain element: `<button :class="selectTriggerVariants({ variant: 'filled' })">`.
 */
export const selectTriggerVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>
