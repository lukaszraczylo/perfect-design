import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Collapsible surface.
 *
 * - `variant`: `plain` (default, no surface), `bordered` (rounded frame) or `filled` (muted surface).
 * - `size`: `sm` | `md` (default) | `lg`. It sets the inner padding of the framed variants and the text size of the content.
 */
export const collapsibleVariants = cva('', {
  variants: {
    variant: { plain: '', bordered: 'rounded-lg border', filled: 'rounded-lg bg-muted/50 text-foreground' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['bordered', 'filled'], size: 'sm', class: 'p-3' },
    { variant: ['bordered', 'filled'], size: 'md', class: 'p-4' },
    { variant: ['bordered', 'filled'], size: 'lg', class: 'p-5' },
  ],
  defaultVariants: { variant: 'plain', size: 'md' },
})

/** Text size of the revealed content. `md` adds nothing, so a plain collapsible keeps the inherited size. */
export const collapsibleContentVariants = cva(
  'overflow-hidden data-[state=closed]:animate-ds-collapse-up data-[state=open]:animate-ds-collapse-down motion-reduce:animate-none',
  {
    variants: { size: { sm: 'text-xs', md: '', lg: 'text-base' } },
    defaultVariants: { size: 'md' },
  },
)

export type CollapsibleVariants = VariantProps<typeof collapsibleVariants>
export type CollapsibleVariant = NonNullable<CollapsibleVariants['variant']>
export type CollapsibleSize = NonNullable<CollapsibleVariants['size']>
export const COLLAPSIBLE_VARIANTS: readonly CollapsibleVariant[] = ['plain', 'bordered', 'filled']
export const COLLAPSIBLE_SIZES: readonly CollapsibleSize[] = ['sm', 'md', 'lg']
