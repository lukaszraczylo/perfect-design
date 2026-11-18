import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/** BrandLink root: `size` sets the name's text size. Use it on any element that should look like the brand link. */
export const brandLinkVariants = cva(
  ['inline-flex min-h-6 min-w-0 items-center rounded-md font-semibold text-foreground pointer-coarse:min-h-11', focusRing],
  {
    variants: {
      size: {
        sm: 'gap-1.5 text-base',
        md: 'gap-2 text-lg',
        lg: 'gap-2.5 text-xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/** The logo box: icon and slotted logo share one square so the name never shifts. */
export const brandLinkLogoVariants = cva('inline-flex shrink-0 items-center justify-center text-primary [&>img]:size-full [&>svg]:size-full', {
  variants: {
    size: {
      sm: 'size-5',
      md: 'size-6',
      lg: 'size-8',
    },
  },
  defaultVariants: { size: 'md' },
})

export type BrandLinkVariants = VariantProps<typeof brandLinkVariants>
export type BrandLinkSize = NonNullable<BrandLinkVariants['size']>

export const BRAND_LINK_SIZES: readonly BrandLinkSize[] = ['sm', 'md', 'lg']
