import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_WITHIN_STATUS_CLASSES, FIELD_WITHIN_VARIANT_CLASSES } from '../TimeInput/variants'

/**
 * Root styling of `NumberInput`: the field surface that holds the steppers and the input. The surface is a wrapper, so
 * focus and status colours use `focus-within`. `size` sets the height (the stepper width and text size follow in the
 * component), `variant` and `status` are the shared field looks. A `pill` is fully rounded and clips the steppers to it.
 */
export const numberInputVariants = cva(
  [
    fieldSurface,
    touchTarget +
      ' flex h-9 items-stretch overflow-hidden px-0 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-solid data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  ],
  {
    variants: {
      size: { xs: 'h-7', sm: 'h-8', md: '', lg: 'h-11' },
      variant: FIELD_WITHIN_VARIANT_CLASSES,
      shape: { rounded: '', pill: 'rounded-full', square: 'rounded-none' },
      status: FIELD_WITHIN_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
    compoundVariants: [{ variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none' }],
  },
)

export type NumberInputVariants = VariantProps<typeof numberInputVariants>
