import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface, touchTarget } from '../../../lib/styles'
import { FIELD_SHAPE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/** Input heights; the text is 16px below `md` and 14px (12px for `xs`) from `md`, `lg` stays 16px. */
export const COMBOBOX_SIZES = {
  xs: 'h-7 px-2 text-md md:text-xs',
  sm: 'h-8 text-md md:text-sm',
  md: 'h-9 text-md md:text-sm',
  lg: 'h-11 text-md',
} as const

/**
 * End padding that keeps the text clear of the toggle button, the clear button and the status icon. It is the last variant so
 * the shape (`pill` sets `px-4`) and the underline (`px-0`) cannot override it.
 */
const PADS = {
  plain: 'pe-9',
  clearable: 'pe-16',
  status: 'pe-16 pointer-coarse:pe-20',
  'clearable-status': 'pe-24 pointer-coarse:pe-32',
} as const
export type ComboboxPad = keyof typeof PADS

const base = cva([fieldSurface, 'py-1', touchTarget], {
  variants: {
    size: COMBOBOX_SIZES,
    shape: FIELD_SHAPE_CLASSES,
    variant: FIELD_VARIANT_CLASSES,
    status: FIELD_STATUS_CLASSES,
    pad: PADS,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default', pad: 'plain' },
})

/**
 * Class list of the Combobox input: field surface, size, variant, shape, status and the end padding for the addon buttons.
 * Conflicting utilities are resolved (later wins), so it can be put on a plain `<input>`.
 */
export const comboboxVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type ComboboxVariants = VariantProps<typeof comboboxVariants>
