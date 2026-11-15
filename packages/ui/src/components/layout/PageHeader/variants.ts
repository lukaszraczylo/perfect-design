import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Root classes. `variant` comes after `sticky` on purpose: its classes are applied later and win over the
 * `pb-4` / sticky padding through tailwind-merge (the component passes the result through `cn`).
 */
export const pageHeaderVariants = cva('flex flex-col gap-3', {
  variants: {
    sticky: {
      true: 'sticky top-0 z-(--z-sticky) border-b border-border bg-background px-4 py-3 sm:px-6',
      false: 'pb-4',
    },
    variant: {
      default: '',
      centered: 'items-center text-center',
      compact: 'gap-2',
      hero: 'isolate overflow-hidden rounded-lg border border-border px-6 py-10 sm:px-10 sm:py-14',
    },
    /** Hero only (the component ignores it for other variants). */
    background: {
      muted: 'bg-muted',
      primary: 'border-transparent bg-primary text-primary-foreground',
      image: 'bg-muted',
    },
  },
  compoundVariants: [
    { variant: 'compact', sticky: false, class: 'pb-2' },
    { variant: 'compact', sticky: true, class: 'py-2' },
    // sticky already positions the element, so only non-sticky heroes need `relative` to anchor the background layers
    { variant: 'hero', sticky: false, class: 'relative' },
  ],
  defaultVariants: { sticky: false, variant: 'default' },
})

export const pageHeaderTitleVariants = cva('text-2xl font-semibold tracking-tight text-balance', {
  variants: {
    variant: {
      default: '',
      centered: '',
      compact: 'text-lg',
      hero: 'text-3xl sm:text-4xl',
    },
  },
  defaultVariants: { variant: 'default' },
})

export type PageHeaderVariants = VariantProps<typeof pageHeaderVariants>
export type PageHeaderVariant = NonNullable<PageHeaderVariants['variant']>
export type PageHeaderBackground = NonNullable<PageHeaderVariants['background']>
export type PageHeaderAlign = 'start' | 'center'

export const pageHeaderVariantNames: readonly string[] = ['default', 'centered', 'compact', 'hero']
export const pageHeaderBackgrounds: readonly string[] = ['muted', 'primary', 'image']
