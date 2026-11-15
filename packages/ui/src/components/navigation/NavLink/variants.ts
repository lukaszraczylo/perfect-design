import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * NavLink styling. `variant` picks the active treatment, `size` the height (`xs` 24px to `lg` 44px) and `shape` the corners.
 * Shape and size classes override the variant radius and text size: pass the result through `cn()` (NavLink does).
 */
export const navLinkVariants = cva(
  [
    'relative inline-flex min-w-0 items-center gap-2 text-sm font-medium motion-safe:transition-colors select-none',
    // Forced colours drop backgrounds, so the current page also gets an underline.
    'forced-colors:aria-[current=page]:underline',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default: 'rounded-md text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground',
        pill: 'rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground',
        sidebar:
          'w-full rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground',
        underline:
          'rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground',
        /** Reads as body text: no hover fill, the current page is bold (and underlined in forced colors). */
        plain: 'rounded-md font-normal text-foreground underline-offset-4 hover:underline aria-[current=page]:font-semibold',
        /** The current page is a solid primary chip. */
        solid:
          'rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:hover:bg-primary aria-[current=page]:hover:text-primary-foreground',
        /** The current page gets a border and the page surface; the others stay borderless. */
        outline:
          'rounded-md border border-transparent text-muted-foreground hover:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-background aria-[current=page]:text-foreground',
      },
      size: {
        xs: 'h-6 px-2 text-xs pointer-coarse:min-h-10',
        sm: 'h-8 px-2.5 pointer-coarse:min-h-10',
        md: 'h-9 px-3 pointer-coarse:min-h-11',
        lg: 'h-11 px-4 text-base',
      },
      /** Corner style. `rounded` keeps the variant's own radius. Ignored by `underline`, which has no corners. */
      shape: {
        rounded: '',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', shape: 'rounded' },
  },
)

export type NavLinkVariants = VariantProps<typeof navLinkVariants>
export type NavLinkVariant = NonNullable<NavLinkVariants['variant']>
export type NavLinkSize = NonNullable<NavLinkVariants['size']>
export type NavLinkShape = NonNullable<NavLinkVariants['shape']>

export const NAV_LINK_VARIANTS: readonly NavLinkVariant[] = ['default', 'pill', 'sidebar', 'underline', 'plain', 'solid', 'outline']
export const NAV_LINK_SIZES: readonly NavLinkSize[] = ['xs', 'sm', 'md', 'lg']
export const NAV_LINK_SHAPES: readonly NavLinkShape[] = ['rounded', 'pill', 'square']
