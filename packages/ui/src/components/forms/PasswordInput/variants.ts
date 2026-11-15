import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import { FIELD_SHAPE_CLASSES, FIELD_SIZE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/**
 * Class list of the inner `<input>` of `PasswordInput`: the shared field surface plus end padding that leaves room for the
 * show/hide toggle. Variant, shape and status are the shared field looks; `status` adds the room for the status icon through
 * the component (it sits left of the toggle). Reuse it on a plain `<input>` that has its own toggle button.
 */
const TOGGLE_ROOM = 'pe-10 pointer-coarse:pe-12'

export const passwordInputVariants = cva([fieldSurface, `py-1 ${TOGGLE_ROOM}`], {
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
    { size: 'xs', class: TOGGLE_ROOM },
    { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' },
    // `px-0` (underline) and `px-4` (pill) replace the end padding the toggle needs, so it is set again after them.
    { variant: 'underline', class: TOGGLE_ROOM },
    { shape: 'pill', class: TOGGLE_ROOM },
  ],
})

export type PasswordInputVariants = VariantProps<typeof passwordInputVariants>
