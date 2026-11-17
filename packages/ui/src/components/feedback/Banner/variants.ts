import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'

const bannerRoot = cva('relative flex w-full items-center gap-3 px-4 py-2.5 text-sm', {
  variants: {
    /** Tone. */
    variant: {
      default: 'bg-primary text-primary-foreground',
      info: 'bg-info text-info-foreground',
      success: 'bg-success text-success-foreground',
      warning: 'bg-warning text-warning-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    },
    /** `top` is the original full-width strip and adds no classes. */
    placement: {
      top: '',
      bottom: 'border-t border-foreground/10',
      floating: 'flex-wrap fixed top-auto bottom-4 left-1/2 z-(--z-sticky) w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-lg shadow-lg',
      inline: 'flex-wrap rounded-lg',
    },
    /** `solid` is the original filled look and adds no classes. */
    appearance: {
      solid: '',
      soft: 'border border-foreground/10',
    },
    sticky: {
      true: 'sticky top-0 z-(--z-sticky)',
      false: '',
    },
    /** Padding, gap and type scale. `md` is the original size and adds no classes. */
    size: {
      sm: 'gap-2 px-3 py-1.5 text-xs',
      md: '',
      lg: 'gap-4 px-6 py-4 text-base',
    },
    /** `default` keeps the message at the start of the row; `centered` centres the text and the actions. */
    layout: {
      default: '',
      centered: 'justify-center text-center',
    },
  },
  compoundVariants: [
    { sticky: true, placement: 'bottom', class: 'top-auto bottom-0' },
    { appearance: 'soft', variant: 'default', class: 'border-border bg-muted text-foreground' },
    { appearance: 'soft', variant: 'info', class: 'border-info/40 bg-info/10 text-foreground' },
    { appearance: 'soft', variant: 'success', class: 'border-success/40 bg-success/10 text-foreground' },
    { appearance: 'soft', variant: 'warning', class: 'border-warning/50 bg-warning/15 text-foreground' },
    { appearance: 'soft', variant: 'destructive', class: 'border-destructive/40 bg-destructive/10 text-foreground' },
  ],
  defaultVariants: { variant: 'default', placement: 'top', appearance: 'solid', sticky: false, size: 'md', layout: 'default' },
})

/** Banner root classes. Conflicting classes are resolved (later wins), so it is safe to use standalone. */
export const bannerVariants = (props?: Parameters<typeof bannerRoot>[0]): string => cn(bannerRoot(props))

export type BannerVariants = VariantProps<typeof bannerVariants>
export type BannerVariant = NonNullable<BannerVariants['variant']>
export type BannerPlacement = NonNullable<BannerVariants['placement']>
export type BannerAppearance = NonNullable<BannerVariants['appearance']>
export type BannerSize = NonNullable<BannerVariants['size']>
export type BannerLayout = NonNullable<BannerVariants['layout']>

export const BANNER_SIZES = ['sm', 'md', 'lg'] as const
export const BANNER_LAYOUTS = ['default', 'centered'] as const
