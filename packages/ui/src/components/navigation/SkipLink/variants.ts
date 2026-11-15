import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * SkipLink looks. The link is visually hidden until it is focused; `variant` and `size` only style that focused state.
 *
 * - `variant`: `solid` (default, primary fill), `outline` (page surface with a border) or `inverted` (foreground fill).
 * - `size`: `sm` | `md` (default) | `lg`.
 * - Size classes conflict with the base on purpose: pass the result through `cn()` (the component does).
 */
export const skipLinkVariants = cva(
  [
    'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-(--z-toast) focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg',
    focusRing,
  ],
  {
    variants: {
      variant: {
        solid: 'focus:bg-primary focus:text-primary-foreground',
        outline: 'focus:border focus:border-input focus:bg-background focus:text-foreground',
        inverted: 'focus:bg-foreground focus:text-background',
      },
      size: {
        sm: 'focus:px-3 focus:py-1 focus:text-xs',
        md: '',
        lg: 'focus:px-5 focus:py-3 focus:text-base',
      },
    },
    defaultVariants: { variant: 'solid', size: 'md' },
  },
)

export type SkipLinkVariants = VariantProps<typeof skipLinkVariants>
export type SkipLinkVariant = NonNullable<SkipLinkVariants['variant']>
export type SkipLinkSize = NonNullable<SkipLinkVariants['size']>
export const SKIP_LINK_VARIANTS: readonly SkipLinkVariant[] = ['solid', 'outline', 'inverted']
export const SKIP_LINK_SIZES: readonly SkipLinkSize[] = ['sm', 'md', 'lg']
