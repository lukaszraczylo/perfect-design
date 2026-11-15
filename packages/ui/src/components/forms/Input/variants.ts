import type { VariantProps } from '../../../lib/cva'
import { fieldVariants } from '../Field/field-variants'

/**
 * Class list of a single-line text field: surface, size (`xs` to `lg`), variant, shape and status. It is the shared
 * `fieldVariants`, so a plain element can look like an Input: `<input :class="inputVariants({ variant: 'filled' })" />`.
 * With the defaults it is exactly the class string `Input` always rendered.
 */
export const inputVariants = fieldVariants

export type InputVariants = VariantProps<typeof inputVariants>
