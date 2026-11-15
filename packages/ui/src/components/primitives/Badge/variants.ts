import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Badge styling.
 *
 * - `variant` picks the look. The first group (`default` ... `info`) are the original fixed-colour variants.
 *   `soft`, `solid` and `outline` are TONE-aware: combine them with `tone` (`neutral` | `primary` | `success` |
 *   `warning` | `danger` | `info`). `soft` and `solid` without a tone are neutral; `outline` without a tone is the
 *   plain outline.
 * - Tone classes are emitted AFTER the variant classes so they win. Wrap the result in `cn()` when you use
 *   `badgeVariants` outside the component so tailwind-merge drops the overridden neutral classes.
 */
export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap border font-medium [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',
        info: 'border-transparent bg-info/15 text-info',
        soft: 'border-transparent bg-muted text-muted-foreground',
        solid: 'border-transparent bg-foreground text-background',
      },
      tone: {
        neutral: '',
        primary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        sm: 'px-1.5 py-0 text-2xs [&>svg]:size-2.5',
        md: 'px-2 py-0.5 text-xs [&>svg]:size-3',
        lg: 'px-2.5 py-1 text-sm [&>svg]:size-3.5',
      },
      /** Corner radius. `full` makes a pill. */
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
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
    defaultVariants: { variant: 'default', size: 'md', rounded: 'default' },
  },
)

/** Dot indicator shown before the label (`dot` prop). Inherits the badge text colour. */
export const badgeDotVariants = cva('inline-block shrink-0 rounded-full bg-current', {
  variants: {
    size: {
      sm: 'size-1',
      md: 'size-1.5',
      lg: 'size-2',
    },
  },
  defaultVariants: { size: 'md' },
})

export type BadgeVariants = VariantProps<typeof badgeVariants>
export type BadgeVariant = NonNullable<BadgeVariants['variant']>
export type BadgeTone = NonNullable<BadgeVariants['tone']>
export type BadgeSize = NonNullable<BadgeVariants['size']>
export type BadgeRounded = NonNullable<BadgeVariants['rounded']>
