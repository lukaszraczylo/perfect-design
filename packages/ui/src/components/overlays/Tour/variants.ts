import { cva, type VariantProps } from '../../../lib/cva'

export const tourSizes = ['sm', 'md', 'lg'] as const
export const tourVariantNames = ['default', 'compact', 'dots'] as const

export type TourSize = (typeof tourSizes)[number]
export type TourVariant = (typeof tourVariantNames)[number]

/**
 * Tour popover card surface.
 *
 * - `size` sets the width (`sm` w-64, `md` w-80, `lg` w-96).
 * - `variant`: `default`; `compact` tightens the padding and gap and sets the description in small text; `dots` is the
 *   default layout with the "2 / 5" text replaced by one dot per step (the text stays for screen readers).
 * Wrap the result in `cn()` when you use `tourCardVariants` outside the component.
 */
export const tourCardVariants = cva(
  'fixed z-(--z-overlay) grid max-w-[calc(100vw-1rem)] gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-hidden focus-visible:ring-3 focus-visible:ring-ring/40 motion-safe:animate-ds-pop-in',
  {
    variants: {
      size: { sm: 'w-64', md: 'w-80', lg: 'w-96' },
      variant: {
        default: '',
        compact: 'gap-2 p-3 [&_[data-slot=tour-description]]:text-xs',
        dots: '',
      },
    },
    defaultVariants: { size: 'md', variant: 'default' },
  },
)

export type TourCardVariants = VariantProps<typeof tourCardVariants>
