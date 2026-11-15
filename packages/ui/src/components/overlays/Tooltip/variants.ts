import { cva, type VariantProps } from '../../../lib/cva'

export const tooltipVariantNames = ['dark', 'light'] as const
export const tooltipSizes = ['sm', 'md', 'lg'] as const

export type TooltipVariant = (typeof tooltipVariantNames)[number]
export type TooltipSize = (typeof tooltipSizes)[number]

/**
 * Tooltip bubble styling.
 *
 * - `variant`: `dark` inverted bubble (foreground background, the default); `light` popover-coloured bubble with
 *   a border and shadow, for dark-on-light or rich content.
 * - `size`: `sm` compact label, `md` default, `lg` roomier text for longer hints.
 * Wrap the result in `cn()` when you use `tooltipVariants` outside the component.
 */
export const tooltipVariants = cva(
  'z-(--z-toast) w-fit rounded-md text-balance data-[state=delayed-open]:animate-ds-pop-in data-[state=instant-open]:animate-ds-fade-in data-[state=closed]:animate-ds-fade-out',
  {
    variants: {
      variant: {
        dark: 'bg-foreground text-background forced-colors:border',
        light: 'border bg-popover text-popover-foreground shadow-md',
      },
      size: {
        sm: 'max-w-2xs px-2 py-1 text-2xs',
        md: 'max-w-xs px-3 py-1.5 text-xs',
        lg: 'max-w-sm px-4 py-2 text-sm',
      },
    },
    defaultVariants: { variant: 'dark', size: 'md' },
  },
)

/** Arrow fill matching the bubble variant. */
export const tooltipArrowVariants = cva('', {
  variants: {
    variant: {
      dark: 'fill-foreground',
      light: 'fill-popover stroke-border',
    },
  },
  defaultVariants: { variant: 'dark' },
})

export type TooltipVariants = VariantProps<typeof tooltipVariants>
