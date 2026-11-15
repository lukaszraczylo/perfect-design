import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing, invalidRing } from '../../../lib/styles'

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all select-none',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    focusRing,
    invalidRing,
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30',
        success: 'bg-success text-success-foreground shadow-xs hover:bg-success/90 focus-visible:ring-success/30',
        soft: 'bg-primary/10 text-primary hover:bg-primary/20',
      },
      size: {
        xs: 'h-6 gap-1 px-2 text-xs [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-8 gap-1.5 px-3 pointer-coarse:min-h-10',
        md: 'h-9 px-4 py-2 pointer-coarse:min-h-11',
        lg: 'h-11 px-6 text-base',
        icon: 'size-9 pointer-coarse:size-11',
        'icon-xs': 'size-6 [&_svg:not([class*="size-"])]:size-3',
        'icon-sm': 'size-8 pointer-coarse:size-10',
        'icon-lg': 'size-11',
      },
      /** Corner radius. `default` is rounded-md; `full` makes a pill (or a circle for icon sizes). */
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
        none: 'rounded-none',
      },
      /** Full-width button. */
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', rounded: 'default', block: false },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
export type ButtonVariant = NonNullable<ButtonVariants['variant']>
export type ButtonSize = NonNullable<ButtonVariants['size']>
export type ButtonRounded = NonNullable<ButtonVariants['rounded']>
