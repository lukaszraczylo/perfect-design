import { cva, type VariantProps } from '../../../lib/cva'

export const TREND_BADGE_VARIANTS = ['soft', 'solid', 'ghost', 'outline'] as const
export const TREND_BADGE_SHAPES = ['rounded', 'pill', 'square'] as const
export const TREND_BADGE_SIZES = ['sm', 'md', 'lg'] as const

export const trendBadgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md font-medium tabular-nums [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        soft: '',
        solid: '',
        ghost: 'px-0',
        outline: 'border bg-transparent',
      },
      tone: {
        good: '',
        bad: '',
        neutral: '',
      },
      /** Corner radius. `rounded` keeps the base `rounded-md`; wrap the result in `cn()` outside the component so `pill` / `square` replace it. */
      shape: {
        rounded: '',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-xs [&_svg]:size-3',
        md: 'px-2 py-0.5 text-sm [&_svg]:size-3.5',
        lg: 'px-2.5 py-1 text-base [&_svg]:size-4',
      },
    },
    compoundVariants: [
      { variant: 'soft', tone: 'good', class: 'bg-success/10 text-success' },
      { variant: 'soft', tone: 'bad', class: 'bg-destructive/10 text-destructive' },
      { variant: 'soft', tone: 'neutral', class: 'bg-muted text-muted-foreground' },
      { variant: 'solid', tone: 'good', class: 'bg-success text-success-foreground' },
      { variant: 'solid', tone: 'bad', class: 'bg-destructive text-destructive-foreground' },
      { variant: 'solid', tone: 'neutral', class: 'bg-muted-foreground text-background' },
      { variant: 'ghost', tone: 'good', class: 'text-success' },
      { variant: 'ghost', tone: 'bad', class: 'text-destructive' },
      { variant: 'ghost', tone: 'neutral', class: 'text-muted-foreground' },
      { variant: 'outline', tone: 'good', class: 'border-success/50 text-success' },
      { variant: 'outline', tone: 'bad', class: 'border-destructive/50 text-destructive' },
      { variant: 'outline', tone: 'neutral', class: 'border-border text-muted-foreground' },
    ],
    defaultVariants: { variant: 'soft', tone: 'neutral', shape: 'rounded', size: 'md' },
  },
)

export type TrendBadgeVariants = VariantProps<typeof trendBadgeVariants>
export type TrendBadgeVariant = NonNullable<TrendBadgeVariants['variant']>
export type TrendBadgeTone = NonNullable<TrendBadgeVariants['tone']>
export type TrendBadgeShape = NonNullable<TrendBadgeVariants['shape']>
export type TrendBadgeSize = NonNullable<TrendBadgeVariants['size']>
