import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Trigger / top-level link look. Exported so plain `<a>` elements can reuse it:
 * `<a :class="navigationMenuTriggerStyle({ variant: 'ghost' })">`.
 */
export const navigationMenuTriggerStyle = cva(
  [
    'group/trigger inline-flex h-9 w-max items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap motion-safe:transition-[color,box-shadow,background-color] select-none',
    'disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 pointer-coarse:min-h-11',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default:
          'bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent/50 data-[active]:bg-accent/50',
        ghost:
          'bg-transparent text-muted-foreground hover:text-foreground focus:text-foreground data-[state=open]:text-foreground data-[active]:text-foreground',
        outline:
          'border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent/50 data-[active]:bg-accent/50',
      },
      /** Height and text size: `sm` 32px, `md` 36px (default), `lg` 44px. Conflicts with the base on purpose: use `cn()`. */
      size: {
        sm: 'h-8 px-3 text-xs',
        md: '',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

/** Link rows inside mega-menu content. `plain` drops the block padding for custom layouts. */
export const navigationMenuLinkVariants = cva(
  [
    'flex flex-col gap-1 rounded-sm text-sm transition-colors outline-hidden',
    'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    'data-[active]:bg-accent/50 data-[active]:text-accent-foreground',
    'focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-1 focus-visible:outline-ring',
    "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        content: 'p-2',
        card: 'p-3',
        plain: '',
      },
    },
    defaultVariants: { variant: 'content' },
  },
)

export type NavigationMenuTriggerVariants = VariantProps<typeof navigationMenuTriggerStyle>
export type NavigationMenuTriggerVariant = NonNullable<NavigationMenuTriggerVariants['variant']>
export type NavigationMenuSize = NonNullable<NavigationMenuTriggerVariants['size']>
export const NAVIGATION_MENU_SIZES: readonly NavigationMenuSize[] = ['sm', 'md', 'lg']
export type NavigationMenuLinkVariants = VariantProps<typeof navigationMenuLinkVariants>
export type NavigationMenuLinkVariant = NonNullable<NavigationMenuLinkVariants['variant']>
