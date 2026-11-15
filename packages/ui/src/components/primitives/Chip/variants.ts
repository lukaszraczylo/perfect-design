import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

export const chipVariants = cva(
  [
    'inline-flex w-fit max-w-full items-center gap-1 border font-medium whitespace-nowrap transition-colors',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    'data-selectable:cursor-pointer data-selected:ring-2 data-selected:ring-primary/60',
    'data-disabled:pointer-events-none data-disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default: 'border-transparent bg-muted text-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'bg-background text-foreground',
        primary: 'border-transparent bg-primary text-primary-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        info: 'border-transparent bg-info/15 text-info',
        soft: 'border-transparent bg-muted text-muted-foreground',
        solid: 'border-transparent bg-foreground text-background',
      },
      /** Semantic colour for the tone-aware variants `soft`, `solid` and `outline`. Ignored by the others. */
      tone: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        sm: 'px-2 py-0 text-2xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      rounded: {
        full: 'rounded-full',
        md: 'rounded-md',
        none: 'rounded-none',
      },
    },
    compoundVariants: [
      { variant: 'soft', tone: 'neutral', class: 'bg-muted text-muted-foreground' },
      { variant: 'soft', tone: 'primary', class: 'bg-primary/10 text-primary' },
      { variant: 'soft', tone: 'success', class: 'bg-success/15 text-success' },
      { variant: 'soft', tone: 'warning', class: 'bg-warning/20 text-warning-foreground dark:text-warning' },
      { variant: 'soft', tone: 'danger', class: 'bg-destructive/10 text-destructive' },
      { variant: 'soft', tone: 'info', class: 'bg-info/15 text-info' },
      { variant: 'solid', tone: 'neutral', class: 'bg-foreground text-background' },
      { variant: 'solid', tone: 'primary', class: 'bg-primary text-primary-foreground' },
      { variant: 'solid', tone: 'success', class: 'bg-success text-success-foreground' },
      { variant: 'solid', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      { variant: 'solid', tone: 'danger', class: 'bg-destructive text-destructive-foreground' },
      { variant: 'solid', tone: 'info', class: 'bg-info text-info-foreground' },
      { variant: 'outline', tone: 'neutral', class: 'border-border text-muted-foreground' },
      { variant: 'outline', tone: 'primary', class: 'border-primary/50 text-primary' },
      { variant: 'outline', tone: 'success', class: 'border-success/50 text-success' },
      { variant: 'outline', tone: 'warning', class: 'border-warning text-warning-foreground dark:text-warning' },
      { variant: 'outline', tone: 'danger', class: 'border-destructive/50 text-destructive' },
      { variant: 'outline', tone: 'info', class: 'border-info/50 text-info' },
    ],
    defaultVariants: { variant: 'default', size: 'md', rounded: 'full' },
  },
)

export type ChipVariants = VariantProps<typeof chipVariants>
export type ChipVariant = NonNullable<ChipVariants['variant']>
export type ChipTone = NonNullable<ChipVariants['tone']>
export type ChipSize = NonNullable<ChipVariants['size']>
export type ChipRounded = NonNullable<ChipVariants['rounded']>
