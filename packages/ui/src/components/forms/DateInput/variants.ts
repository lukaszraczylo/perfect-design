import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import { FIELD_SHAPE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/**
 * Class list of the native input of `DateInput`. The text is 14px from `md` (a date reads wider than prose), so the sizes are
 * not the shared `FIELD_SIZE_CLASSES`; variant, shape and status are the shared field looks. `dark:scheme-dark` keeps the
 * native picker readable in dark mode. Reuse it on a plain `<input type="date">`.
 */
export const dateInputVariants = cva([fieldSurface, touchTarget], {
  variants: {
    size: {
      xs: 'h-7 px-2 py-1 text-md md:text-xs dark:scheme-dark',
      sm: 'h-8 py-1 text-md md:text-sm dark:scheme-dark',
      md: 'h-9 py-1 text-md md:text-sm dark:scheme-dark',
      lg: 'h-11 py-1 text-md dark:scheme-dark',
    },
    variant: FIELD_VARIANT_CLASSES,
    shape: FIELD_SHAPE_CLASSES,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  compoundVariants: [{ class: forcedInvalid }, { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' }],
})

export type DateInputVariants = VariantProps<typeof dateInputVariants>
