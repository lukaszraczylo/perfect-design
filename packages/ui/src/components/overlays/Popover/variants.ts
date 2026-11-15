import { cva, type VariantProps } from '../../../lib/cva'
import { floatingSurface } from '../../../lib/styles'

export const popoverSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'auto'] as const

export const popoverVariantNames = ['neutral', 'inverted'] as const

export type PopoverSize = (typeof popoverSizes)[number]
export type PopoverVariant = (typeof popoverVariantNames)[number]

/**
 * Popover surface styling.
 *
 * `size` sets the width and padding: `xs` w-48, `sm` w-60, `md` w-72 (default), `lg` w-96, `xl` w-lg (32rem),
 * `auto` fits its content. Every size is capped to the viewport width.
 * `variant` sets the colours: `neutral` (default) is the popover surface; `inverted` is a foreground-coloured surface with
 * background-coloured text, like the default tooltip, for short hints and summaries.
 * Wrap the result in `cn()` when you use `popoverContentVariants` outside the component.
 */
export const popoverContentVariants = cva(
  floatingSurface +
    ' z-(--z-modal) max-h-(--reka-popper-available-height) max-w-[calc(100vw-2rem)] overflow-y-auto outline-hidden data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
  {
    variants: {
      variant: {
        neutral: '',
        inverted: 'border-foreground bg-foreground text-background',
      },
      size: {
        xs: 'w-48 p-3',
        sm: 'w-60 p-3',
        md: 'w-72 p-4',
        lg: 'w-96 p-4',
        xl: 'w-lg p-5',
        auto: 'w-auto p-4',
      },
    },
    defaultVariants: { size: 'md', variant: 'neutral' },
  },
)

/** Arrow fill matching the surface variant. */
export const popoverArrowVariants = cva('', {
  variants: {
    variant: {
      neutral: 'fill-popover stroke-border',
      inverted: 'fill-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export type PopoverContentVariants = VariantProps<typeof popoverContentVariants>
