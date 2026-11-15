import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'

const base = cva('flex flex-col gap-6 rounded-xl py-6 text-card-foreground', {
  variants: {
    /** Padding and gap. `md` is the original `py-6 gap-6`. Listed first so the surface and layout classes below still win (`pt-0`, `py-0`). */
    size: {
      sm: 'gap-4 py-4',
      md: '',
      lg: 'gap-8 py-8',
    },
    variant: {
      default: 'border bg-card shadow-sm',
      outline: 'border bg-transparent',
      elevated: 'border border-transparent bg-card shadow-lg',
      interactive: [
        'cursor-pointer border bg-card shadow-sm transition-[box-shadow,border-color] hover:border-ring/50 hover:shadow-md',
        focusRing,
      ],
      /** No surface at all: keeps the border box (transparent) so it aligns with bordered cards. */
      ghost: 'border border-transparent bg-transparent',
      /** Muted flat surface, no shadow. */
      filled: 'border border-transparent bg-muted',
      /** Flush image on top: no top padding and overflow clipped so the media follows the rounded corners. */
      'with-image-header': 'overflow-hidden border bg-card pt-0 shadow-sm',
    },
    layout: {
      vertical: '',
      /** Stacks on mobile, media + body side by side from `sm`. Put the content in `CardBody`. */
      horizontal: 'gap-0 overflow-hidden py-0 sm:flex-row sm:items-stretch',
    },
    selectable: {
      true: [
        'cursor-pointer transition-[box-shadow,border-color]',
        'hover:border-ring/50 data-[state=checked]:border-primary data-[state=checked]:ring-2 data-[state=checked]:ring-primary/30',
        // A checked card already has a primary ring and border that outrank the focus ring, so focus adds a solid outline.
        'data-[state=checked]:focus-visible:outline-solid data-[state=checked]:focus-visible:outline-2 data-[state=checked]:focus-visible:outline-offset-2 data-[state=checked]:focus-visible:outline-ring',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        focusRing,
      ],
      false: '',
    },
  },
  defaultVariants: { size: 'md', variant: 'default', layout: 'vertical', selectable: false },
})

/** Surface classes for a Card (also usable on non-Card elements). Conflicting utilities are resolved with tailwind-merge. */
export const cardVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type CardVariants = VariantProps<typeof base>
export type CardVariant = NonNullable<CardVariants['variant']>
export type CardLayout = NonNullable<CardVariants['layout']>
export type CardSize = NonNullable<CardVariants['size']>
export const CARD_SIZES = ['sm', 'md', 'lg'] as const
