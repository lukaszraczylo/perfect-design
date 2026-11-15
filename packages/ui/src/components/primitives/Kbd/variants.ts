import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Key chip styling.
 *
 * - `variant` picks the surface: `default` (muted fill, border, shadow), `outline` (border only), `ghost` (no border or
 *   fill) and `solid` (inverted: foreground fill, background text).
 * - `size` is the chip height: `xs` 16px, `sm` 20px, `md` 24px (default), `lg` 28px.
 * - `ghost` and `solid` keep a `forced-colors` border because their fill is dropped by forced-colors mode.
 * - Colour classes live in `variant`, so wrapping the result in `cn()` is only needed to add your own overrides.
 */
export const kbdVariants = cva(
  'inline-flex w-fit shrink-0 select-none items-center justify-center rounded-sm border font-mono font-medium [&_svg:not([class*="size-"])]:size-3',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-muted-foreground shadow-xs',
        outline: 'border-border bg-transparent text-muted-foreground',
        ghost: 'border-transparent bg-transparent text-muted-foreground forced-colors:border-current',
        solid: 'border-transparent bg-foreground text-background forced-colors:border-current',
      },
      size: {
        xs: 'h-4 min-w-4 px-1 text-2xs [&_svg:not([class*="size-"])]:size-2.5',
        sm: 'h-5 min-w-5 px-1 text-2xs',
        md: 'h-6 min-w-6 px-1.5 text-xs',
        lg: 'h-7 min-w-7 px-2 text-sm [&_svg:not([class*="size-"])]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

/**
 * Container for several keys. `gap` is the space between chips (and separators): `none` 0, `sm` 2px, `md` 4px (default),
 * `lg` 8px.
 */
export const kbdGroupVariants = cva('inline-flex items-center', {
  variants: {
    gap: {
      none: 'gap-0',
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-2',
    },
  },
  defaultVariants: { gap: 'md' },
})

/** Separator text between keys, scaled with the chip size. */
export const kbdSeparatorVariants = cva('text-muted-foreground', {
  variants: {
    size: {
      xs: 'text-2xs',
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },
  defaultVariants: { size: 'md' },
})

export type KbdVariants = VariantProps<typeof kbdVariants>
export type KbdVariant = NonNullable<KbdVariants['variant']>
export type KbdSize = NonNullable<KbdVariants['size']>
export type KbdGroupVariants = VariantProps<typeof kbdGroupVariants>
export type KbdGroupGap = NonNullable<KbdGroupVariants['gap']>

export const KBD_VARIANTS: readonly KbdVariant[] = ['default', 'outline', 'ghost', 'solid']
export const KBD_SIZES: readonly KbdSize[] = ['xs', 'sm', 'md', 'lg']
export const KBD_GAPS: readonly KbdGroupGap[] = ['none', 'sm', 'md', 'lg']
