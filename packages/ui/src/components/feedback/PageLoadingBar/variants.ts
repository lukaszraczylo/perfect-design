import { cva, type VariantProps } from '../../../lib/cva'

/** Fixed strip at the top of the viewport; it never takes pointer input. */
export const pageLoadingBarVariants = cva('pointer-events-none fixed inset-x-0 top-0 z-(--z-toast) overflow-hidden', {
  variants: {
    size: { xs: 'h-0.5', sm: 'h-1', md: 'h-1.5' },
  },
  defaultVariants: { size: 'sm' },
})

/** The moving fill. */
export const pageLoadingBarFillVariants = cva('bg-primary', {
  variants: {
    tone: {
      neutral: 'bg-muted-foreground',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      info: 'bg-info',
    },
  },
  defaultVariants: { tone: 'primary' },
})

export type PageLoadingBarSize = NonNullable<VariantProps<typeof pageLoadingBarVariants>['size']>
export type PageLoadingBarTone = NonNullable<VariantProps<typeof pageLoadingBarFillVariants>['tone']>
export const PAGE_LOADING_BAR_SIZES: readonly PageLoadingBarSize[] = ['xs', 'sm', 'md']
export const PAGE_LOADING_BAR_TONES: readonly PageLoadingBarTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
