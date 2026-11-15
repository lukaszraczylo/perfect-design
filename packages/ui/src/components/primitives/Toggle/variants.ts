import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Toggle styling.
 *
 * - `variant`: `default` (flat), `outline` (bordered), `soft` (muted fill, primary tint when pressed) and `filled`
 *   (secondary fill, solid primary when pressed).
 * - `tone` recolours the PRESSED state: tinted for `default`, `outline` and `soft`, solid for `filled`. Unset keeps the
 *   neutral accent (or primary for `soft` and `filled`). Wrap the result in `cn()` when you use it outside the component
 *   so tailwind-merge drops the overridden classes.
 * - `size`: `xs` 28px, `sm` 32px, `md` 36px (default), `lg` 40px, `xl` 44px. Coarse pointers raise them to 40px or 44px.
 * - `shape`: `rounded` (default), `pill`, `square`.
 * - A pressed toggle gets a 2px border in forced-colors mode, where fills are dropped; `soft` and `filled` keep a 1px
 *   border there when not pressed.
 */
export const toggleVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,box-shadow] select-none',
    'hover:bg-muted hover:text-muted-foreground',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground forced-colors:data-[state=on]:border-2',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground data-[state=on]:border-foreground',
        soft:
          'bg-muted text-muted-foreground forced-colors:border hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:hover:bg-primary/10 data-[state=on]:hover:text-primary',
        filled:
          'bg-secondary text-secondary-foreground forced-colors:border hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground',
      },
      tone: {
        primary: '',
        success: '',
        warning: '',
        danger: '',
        info: '',
      },
      size: {
        xs: 'h-7 min-w-7 px-1.5 text-xs pointer-coarse:min-h-10 pointer-coarse:min-w-10',
        sm: 'h-8 min-w-8 px-2 pointer-coarse:min-h-10 pointer-coarse:min-w-10',
        md: 'h-9 min-w-9 px-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        lg: 'h-10 min-w-10 px-3 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        xl: 'h-11 min-w-11 px-4 text-base',
      },
      /** Corner radius. `pill` is fully round. */
      shape: {
        rounded: 'rounded-md',
        pill: 'rounded-full',
        square: 'rounded-none',
      },
    },
    compoundVariants: [
      { variant: ['default', 'outline', 'soft'], tone: 'primary', class: 'data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:hover:bg-primary/10 data-[state=on]:hover:text-primary' },
      { variant: ['default', 'outline', 'soft'], tone: 'success', class: 'data-[state=on]:bg-success/15 data-[state=on]:text-success data-[state=on]:hover:bg-success/15 data-[state=on]:hover:text-success' },
      {
        variant: ['default', 'outline', 'soft'],
        tone: 'warning',
        class:
          'data-[state=on]:bg-warning/20 data-[state=on]:text-warning-foreground dark:data-[state=on]:text-warning data-[state=on]:hover:bg-warning/20 data-[state=on]:hover:text-warning-foreground dark:data-[state=on]:hover:text-warning',
      },
      { variant: ['default', 'outline', 'soft'], tone: 'danger', class: 'data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive data-[state=on]:hover:bg-destructive/10 data-[state=on]:hover:text-destructive' },
      { variant: ['default', 'outline', 'soft'], tone: 'info', class: 'data-[state=on]:bg-info/15 data-[state=on]:text-info data-[state=on]:hover:bg-info/15 data-[state=on]:hover:text-info' },
      { variant: 'filled', tone: 'primary', class: 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground' },
      { variant: 'filled', tone: 'success', class: 'data-[state=on]:bg-success data-[state=on]:text-success-foreground data-[state=on]:hover:bg-success/90 data-[state=on]:hover:text-success-foreground' },
      { variant: 'filled', tone: 'warning', class: 'data-[state=on]:bg-warning data-[state=on]:text-warning-foreground data-[state=on]:hover:bg-warning/90 data-[state=on]:hover:text-warning-foreground' },
      { variant: 'filled', tone: 'danger', class: 'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:hover:bg-destructive/90 data-[state=on]:hover:text-destructive-foreground' },
      { variant: 'filled', tone: 'info', class: 'data-[state=on]:bg-info data-[state=on]:text-info-foreground data-[state=on]:hover:bg-info/90 data-[state=on]:hover:text-info-foreground' },
    ],
    defaultVariants: { variant: 'default', size: 'md', shape: 'rounded' },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>
export type ToggleVariant = NonNullable<ToggleVariants['variant']>
export type ToggleTone = NonNullable<ToggleVariants['tone']>
export type ToggleSize = NonNullable<ToggleVariants['size']>
export type ToggleShape = NonNullable<ToggleVariants['shape']>

export const TOGGLE_VARIANTS: readonly ToggleVariant[] = ['default', 'outline', 'soft', 'filled']
export const TOGGLE_TONES: readonly ToggleTone[] = ['primary', 'success', 'warning', 'danger', 'info']
export const TOGGLE_SIZES: readonly ToggleSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
export const TOGGLE_SHAPES: readonly ToggleShape[] = ['rounded', 'pill', 'square']
