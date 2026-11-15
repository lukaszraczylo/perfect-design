import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import { FIELD_SHAPE_CLASSES, FIELD_SIZE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

const CHEVRON_ROOM = 'pe-9'

/**
 * Class list of the `<select>` of `NativeSelect`: the shared field surface with `appearance-none` and end padding that leaves room
 * for the chevron. `px-2` (xs), `px-0` (underline) and `px-4` (pill) would replace that padding, so the compound entries set it again after
 * the variant classes. Reuse it on a plain `<select>` that sits next to its own chevron.
 */
export const nativeSelectVariants = cva(
  [fieldSurface, `appearance-none py-1 ${CHEVRON_ROOM} [&_option]:bg-popover [&_option]:text-popover-foreground [&_optgroup]:bg-popover [&_optgroup]:text-popover-foreground`],
  {
    variants: {
      size: FIELD_SIZE_CLASSES,
      variant: FIELD_VARIANT_CLASSES,
      shape: FIELD_SHAPE_CLASSES,
      status: FIELD_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
    compoundVariants: [
      { class: forcedInvalid },
      // `xs` sets `px-2`, which would replace the end padding, so the room is set again after it.
      { size: 'xs', class: CHEVRON_ROOM },
      { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' },
      { variant: 'underline', class: CHEVRON_ROOM },
      { shape: 'pill', class: CHEVRON_ROOM },
    ],
  },
)

export type NativeSelectVariants = VariantProps<typeof nativeSelectVariants>
