import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import {
  FIELD_SHAPE_CLASSES_MULTILINE,
  FIELD_STATUS_CLASSES,
  FIELD_VARIANT_CLASSES,
} from '../Field/field-variants'

/**
 * Class list of a multi-line text field. The base is the `fieldSurface` with `min-h-16 py-2` (the `md` size); `size` changes the
 * minimum height, text size and padding, `variant`, `shape` and `status` are the shared field looks. A `pill` is `rounded-xl`
 * here because a full pill would clip the text of several lines. Pass `class` last through `cn` so it wins.
 * `<textarea :class="textareaVariants({ variant: 'filled' })" />` reuses the look on a plain element.
 */
export const textareaVariants = cva([fieldSurface, 'min-h-16 py-2 text-md md:text-base', forcedInvalid], {
  variants: {
    size: {
      xs: 'min-h-12 px-2 py-1 md:text-xs',
      sm: 'min-h-14 py-1.5 md:text-sm',
      md: '',
      lg: 'min-h-20 md:text-md',
    },
    variant: FIELD_VARIANT_CLASSES,
    shape: FIELD_SHAPE_CLASSES_MULTILINE,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  compoundVariants: [{ variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' }],
})

export type TextareaVariants = VariantProps<typeof textareaVariants>
