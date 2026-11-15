import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/**
 * Variant classes for a field whose surface is a `div` that holds the focus (TimeInput, NumberInput). The shared field
 * fragments react to `focus-visible` on the control itself; a wrapper surface has to react to `focus-within` instead, so these
 * add the `focus-within` equivalents that the underline and ghost variants rely on to keep the focus indicator visible.
 */
export const FIELD_WITHIN_VARIANT_CLASSES = {
  outline: FIELD_VARIANT_CLASSES.outline,
  filled: FIELD_VARIANT_CLASSES.filled,
  underline: `${FIELD_VARIANT_CLASSES.underline} focus-within:border-b-2 focus-within:ring-0`,
  ghost: `${FIELD_VARIANT_CLASSES.ghost} focus-within:bg-background`,
} as const

/**
 * Status classes for the same kind of surface: the colour of the border at rest and while focused (`focus-within`), the
 * same tested token pairs as the shared status classes. `relative` anchors the status icon.
 */
export const FIELD_WITHIN_STATUS_CLASSES = {
  default: '',
  success: 'relative border-success focus-within:border-success focus-within:ring-success/30 dark:focus-within:ring-success/40',
  warning:
    'relative border-warning-foreground focus-within:border-warning-foreground focus-within:ring-warning-foreground/30 dark:border-warning dark:focus-within:border-warning dark:focus-within:ring-warning/40',
  error: 'relative border-destructive focus-within:border-destructive focus-within:ring-destructive/30 dark:focus-within:ring-destructive/40',
} as const

/**
 * Root styling of `TimeInput` (the segmented field surface). `size`, `variant`, `shape` and `status` are the shared field looks;
 * a status adds end padding for the status icon. Pass `class` last through `cn` so it wins.
 */
export const timeInputVariants = cva(
  fieldSurface +
    ' ' +
    touchTarget +
    ' inline-flex w-auto max-w-full items-center gap-0.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-solid data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-md md:text-xs',
        sm: 'h-8 text-md md:text-sm',
        md: 'h-9 text-md md:text-base',
        lg: 'h-11 text-md',
      },
      variant: FIELD_WITHIN_VARIANT_CLASSES,
      shape: FIELD_SHAPE_CLASSES,
      status: FIELD_WITHIN_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
    compoundVariants: [
      { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' },
      { status: ['success', 'warning', 'error'], class: 'pe-9' },
    ],
  },
)

export type TimeInputVariants = VariantProps<typeof timeInputVariants>
