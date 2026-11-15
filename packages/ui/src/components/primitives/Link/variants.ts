import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Link styling.
 *
 * - `variant`: `default` (primary, underline on hover), `underline` (primary, always underlined), `muted`, `subtle`
 *   (foreground, always underlined), `plain` (inherits the surrounding text colour, always underlined) and
 *   `destructive` (destructive colour, always underlined).
 * - `size`: `inherit` (default) keeps the size of the surrounding text; `sm`, `md` and `lg` set 14px, 16px and 18px.
 * - Inline links are exempt from the 24px target size (WCAG 2.5.8), so no minimum height is set.
 */
export const linkVariants = cva(
  ['rounded-sm font-medium underline-offset-4 transition-colors', 'aria-disabled:pointer-events-none aria-disabled:opacity-50', focusRing],
  {
    variants: {
      variant: {
        default: 'text-primary hover:underline',
        underline: 'text-primary underline hover:text-primary/80',
        muted: 'text-muted-foreground hover:text-foreground hover:underline',
        subtle: 'text-foreground underline decoration-border hover:decoration-foreground',
        plain: 'text-inherit underline hover:decoration-2',
        destructive: 'text-destructive underline hover:decoration-2',
      },
      size: {
        inherit: '',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'inherit' },
  },
)

export type LinkVariants = VariantProps<typeof linkVariants>
export type LinkVariant = NonNullable<LinkVariants['variant']>
export type LinkSize = NonNullable<LinkVariants['size']>

export const LINK_VARIANTS: readonly LinkVariant[] = ['default', 'underline', 'muted', 'subtle', 'plain', 'destructive']
export const LINK_SIZES: readonly LinkSize[] = ['inherit', 'sm', 'md', 'lg']
