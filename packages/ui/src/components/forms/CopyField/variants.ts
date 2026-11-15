import { cva, type VariantProps } from '../../../lib/cva'
import { fieldSurface } from '../../../lib/styles'
import { forcedInvalid } from '../Field/field-styles'
import { FIELD_SHAPE_CLASSES, FIELD_SIZE_CLASSES, FIELD_STATUS_CLASSES, FIELD_VARIANT_CLASSES } from '../Field/field-variants'

/**
 * Class list of the read-only input of `CopyField`. The end corners are square because the copy button is joined to it; a
 * `pill` shape rounds only the start. Text is 14px from `md` (a mono value reads wider than prose).
 */
export const copyFieldVariants = cva([fieldSurface, 'rounded-e-none py-1 font-mono'], {
  variants: {
    size: {
      xs: FIELD_SIZE_CLASSES.xs,
      sm: 'h-8 text-md pointer-coarse:min-h-11 md:text-sm',
      md: 'h-9 text-md pointer-coarse:min-h-11 md:text-sm',
      lg: 'h-11 text-md md:text-sm',
    },
    variant: FIELD_VARIANT_CLASSES,
    shape: FIELD_SHAPE_CLASSES,
    status: FIELD_STATUS_CLASSES,
  },
  defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
  compoundVariants: [
    { class: forcedInvalid },
    { variant: 'underline', shape: ['pill', 'square'], class: 'rounded-none px-0' },
    // `rounded-full` would round the end that touches the button, so it is squared again after the shape.
    { shape: 'pill', class: 'rounded-e-none' },
  ],
})

/**
 * Class list of the joined copy button of `CopyField`. It follows the same `variant`, `shape`, `size` and `status` as the input so
 * the two read as one control: `outline` and `filled` keep the secondary button, `underline` and `ghost` make it a text button on
 * the same line or border. The copied and failed text colours are added by the component.
 */
export const copyFieldButtonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-e-md border border-s-0 border-input bg-secondary px-3 text-sm font-medium whitespace-nowrap text-secondary-foreground transition-colors outline-hidden hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs pointer-coarse:min-h-11',
        sm: 'h-8 pointer-coarse:min-h-11',
        md: 'h-9 pointer-coarse:min-h-11',
        lg: 'h-11',
      },
      variant: {
        outline: '',
        filled: '',
        underline:
          'rounded-none border-0 border-b bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:border-b-2 focus-visible:ring-0 forced-colors:border-b-[ButtonText]',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground forced-colors:border-[ButtonText]',
      },
      shape: { rounded: '', pill: 'rounded-e-full pe-4', square: 'rounded-e-none' },
      status: FIELD_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', shape: 'rounded', status: 'default' },
    // Underline squares its own corners; a shape would fight it.
    compoundVariants: [{ variant: 'underline', class: 'rounded-none' }],
  },
)

export type CopyFieldVariants = VariantProps<typeof copyFieldVariants>
export type CopyFieldButtonVariants = VariantProps<typeof copyFieldButtonVariants>
