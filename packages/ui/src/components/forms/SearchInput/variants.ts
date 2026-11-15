import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import { FIELD_SHAPE_CLASSES, FIELD_SIZE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

const BASE = 'py-1 ps-9 pe-9 pointer-coarse:pe-12 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'

/**
 * Class list of the inner `<input>` of `SearchInput`: the shared field surface with start padding for the search icon and end
 * padding for the clear button. `px-2` (xs), `px-0` (underline) and `px-4` (pill) would replace those paddings, so the compound entries set
 * them again after the variant classes. Reuse it on a plain `<input type="search">` that has its own icon and clear button.
 */
export const searchInputVariants = cva([fieldSurface, BASE], {
  variants: {
    size: FIELD_SIZE_CLASSES,
    variant: FIELD_VARIANT_CLASSES,
    shape: FIELD_SHAPE_CLASSES,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  compoundVariants: [
    { class: forcedInvalid },
    // `xs` sets `px-2`, which would replace the icon and button room, so it is set again after it.
    { size: 'xs', class: 'ps-9 pe-9 pointer-coarse:pe-12' },
    { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' },
    { variant: 'underline', class: 'ps-7 pe-9 pointer-coarse:pe-12' },
    { shape: 'pill', class: 'ps-10 pe-9 pointer-coarse:pe-12' },
    // Underline wins over a pill shape, so its padding is set last.
    { variant: 'underline', shape: 'pill', class: 'ps-7' },
  ],
})

export type SearchInputVariants = VariantProps<typeof searchInputVariants>
