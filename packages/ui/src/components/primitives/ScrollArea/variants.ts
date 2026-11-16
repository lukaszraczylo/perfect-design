import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Scrollbar classes (the track element of `ScrollBar`).
 *
 * - `size` is the bar thickness: `sm` 6px, `md` 10px (default), `lg` 16px.
 * - `variant` is the look: `default` (transparent track, `bg-input` thumb: the form-control border colour, at least 3:1 against the
 *   background and card surfaces in light and dark, covered by contrast.test.ts; it darkens to the muted foreground on hover), `track` (visible muted track behind a solid thumb)
 *   or `solid` (solid thumb on a transparent track). Solid thumbs use the muted foreground colour, which has at least 4.5:1
 *   against the background, card and muted surfaces. `track` and `solid` thumbs keep a border in forced-colors mode, where
 *   background colours are replaced.
 * - Wrap the result in `cn()` when you use these helpers outside the component, so tailwind-merge drops the
 *   overridden defaults.
 */
export const scrollBarVariants = cva('flex touch-none select-none p-px transition-colors', {
  variants: {
    orientation: {
      vertical: 'h-full border-s border-s-transparent',
      horizontal: 'w-full flex-col border-t border-t-transparent',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    variant: {
      default: '',
      track: 'rounded-full bg-muted',
      solid: '',
    },
  },
  compoundVariants: [
    { orientation: 'vertical', size: 'sm', class: 'w-1.5' },
    { orientation: 'vertical', size: 'md', class: 'w-2.5' },
    { orientation: 'vertical', size: 'lg', class: 'w-4' },
    { orientation: 'horizontal', size: 'sm', class: 'h-1.5' },
    { orientation: 'horizontal', size: 'md', class: 'h-2.5' },
    { orientation: 'horizontal', size: 'lg', class: 'h-4' },
  ],
  defaultVariants: { orientation: 'vertical', size: 'md', variant: 'default' },
})

/** The draggable thumb inside the bar. */
export const scrollThumbVariants = cva('relative flex-1 rounded-full', {
  variants: {
    variant: {
      default: 'bg-input hover:bg-muted-foreground',
      track: 'bg-muted-foreground hover:bg-foreground forced-colors:border',
      solid: 'bg-muted-foreground hover:bg-foreground forced-colors:border',
    },
  },
  defaultVariants: { variant: 'default' },
})

export type ScrollBarVariants = VariantProps<typeof scrollBarVariants>
export type ScrollBarSize = NonNullable<ScrollBarVariants['size']>
export type ScrollBarVariant = NonNullable<ScrollBarVariants['variant']>
