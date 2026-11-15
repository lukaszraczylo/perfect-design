import { cva, type VariantProps } from '../../../lib/cva'

/**
 * BackToTop looks. `variant`: `button` (default, an icon-only circle) or `pill` (the arrow plus the visible label in a
 * rounded-full pill). `size` scales either one. Size classes conflict with the Button sizes on purpose: pass the result
 * through `cn()` (the component does).
 */
export type BackToTopVariant = 'button' | 'pill'
export type BackToTopSize = 'sm' | 'md' | 'lg'
export const BACK_TO_TOP_VARIANTS: readonly BackToTopVariant[] = ['button', 'pill']
export const BACK_TO_TOP_SIZES: readonly BackToTopSize[] = ['sm', 'md', 'lg']

/** Button size per variant and size. `md` of `button` is the original 44px circle. */
export const BACK_TO_TOP_BUTTON_SIZE = {
  button: { sm: 'icon', md: 'icon-lg', lg: 'icon-lg' },
  pill: { sm: 'sm', md: 'md', lg: 'lg' },
} as const

/** Position and look shared by every variant. The largest circle grows past the Button sizes. */
export const backToTopVariants = cva('fixed end-6 bottom-6 z-(--z-sticky) rounded-full shadow-lg animate-ds-fade-in motion-reduce:animate-none', {
  variants: {
    variant: { button: '', pill: 'pointer-coarse:min-h-11' },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [{ variant: 'button', size: 'lg', class: 'size-14' }],
  defaultVariants: { variant: 'button', size: 'md' },
})

export type BackToTopVariants = VariantProps<typeof backToTopVariants>
