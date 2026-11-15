import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES, type FieldShape } from '../Field/field-variants'

/**
 * Cell sizes. A cell is a square box: 40px at `md` (the default), 44px on coarse pointers for every size below `lg`.
 * Text is 16px or more on small screens so iOS does not zoom on focus.
 */
export const PIN_INPUT_SIZES = {
  xs: 'h-8 w-8 text-md md:text-sm pointer-coarse:h-11 pointer-coarse:w-11',
  sm: 'h-9 w-9 text-md md:text-base pointer-coarse:h-11 pointer-coarse:w-11',
  md: 'h-10 w-10 text-lg pointer-coarse:h-11 pointer-coarse:w-11',
  lg: 'h-12 w-12 text-xl',
} as const

/** `pill` makes each cell a circle; the shared field pill adds horizontal padding that would squeeze the digit. */
export const PIN_INPUT_SHAPE_CLASSES: Record<FieldShape, string> = {
  rounded: '',
  pill: 'rounded-full',
  square: 'rounded-none',
}

const base = cva([fieldSurface, 'min-w-0 px-0 text-center tabular-nums'], {
  variants: {
    size: PIN_INPUT_SIZES,
    shape: PIN_INPUT_SHAPE_CLASSES,
    variant: FIELD_VARIANT_CLASSES,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
})

/**
 * Class list of ONE PinInput cell: field surface, size, variant, shape and status. Conflicting utilities are resolved
 * (later wins), so it can be put on plain `<input>` elements.
 */
export const pinInputCellVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type PinInputCellVariants = VariantProps<typeof pinInputCellVariants>
