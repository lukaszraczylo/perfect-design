import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/** Input-like trigger button shared by DatePicker and DateRangePicker. `variant`, `shape` and `status` are the shared text-field fragments. */
export const datePickerVariants = cva(
  fieldSurface + ' ' + touchTarget + ' flex cursor-pointer items-center justify-between gap-2 py-1 text-start whitespace-nowrap select-none data-[placeholder]:text-muted-foreground',
  {
    variants: {
      size: { xs: 'h-7 px-2 text-md md:text-xs', sm: 'h-8 text-md md:text-sm', md: 'h-9 text-md md:text-sm', lg: 'h-11 text-md' },
      variant: FIELD_VARIANT_CLASSES,
      shape: FIELD_SHAPE_CLASSES,
      status: FIELD_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
    compoundVariants: [{ variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' }],
  },
)

export type DatePickerVariants = VariantProps<typeof datePickerVariants>
export type DatePickerSize = NonNullable<DatePickerVariants['size']>
export const DATE_PICKER_SIZES: readonly DatePickerSize[] = ['xs', 'sm', 'md', 'lg']
