import { cva, type VariantProps } from '../../../lib/cva'
import { floatingSurface } from '../../../lib/styles'

export const hoverCardSizes = ['sm', 'md', 'lg', 'xl', 'auto'] as const
export const hoverCardVariantNames = ['neutral', 'inverted'] as const

export type HoverCardSize = (typeof hoverCardSizes)[number]
export type HoverCardVariant = (typeof hoverCardVariantNames)[number]

/**
 * Hover card surface styling.
 *
 * - `size` sets the width and padding: `sm` w-52, `md` w-64 (default), `lg` w-80, `xl` w-96, `auto` fits its content.
 *   Every size is capped to the viewport width.
 * - `variant`: `neutral` (default) popover surface, or `inverted` foreground-coloured surface.
 * Wrap the result in `cn()` when you use `hoverCardContentVariants` outside the component.
 */
export const hoverCardContentVariants = cva(
  floatingSurface +
    ' z-(--z-modal) max-h-(--reka-popper-available-height) max-w-[calc(100vw-2rem)] overflow-y-auto outline-hidden data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
  {
    variants: {
      size: {
        sm: 'w-52 p-3',
        md: 'w-64 p-4',
        lg: 'w-80 p-4',
        xl: 'w-96 p-5',
        auto: 'w-auto p-4',
      },
      variant: {
        neutral: '',
        inverted: 'border-foreground bg-foreground text-background',
      },
    },
    defaultVariants: { size: 'md', variant: 'neutral' },
  },
)

/** Arrow fill matching the surface variant. */
export const hoverCardArrowVariants = cva('', {
  variants: {
    variant: {
      neutral: 'fill-popover stroke-border',
      inverted: 'fill-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export type HoverCardContentVariants = VariantProps<typeof hoverCardContentVariants>
