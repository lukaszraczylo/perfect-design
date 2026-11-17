import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Count badge styling.
 *
 * - `appearance`: `solid` (filled), `soft` (tinted fill) and `outline` (border on the page background, so it stays
 *   readable when anchored over another element). Colours come from `tone` through compound variants and reuse the
 *   token pairs `Badge` already uses.
 * - `size`: `sm` 16px, `md` 20px (default), `lg` 28px tall. In `dot` mode the same steps give a 6px, 8px or 10px dot.
 * - `shape`: `pill` (default, grows with the text), `circle` (round for one or two digits, widens for `99+`) and
 *   `square` (rounded-md corners, the radius used for controls).
 * - `dot`: a small marker without a number. Width and height are set by `size`, padding is removed.
 * - Some classes override each other (`border-transparent` and `border-current`), so wrap the result in `cn()` when you
 *   use `countBadgeVariants` outside the component, as the component does.
 */
export const countBadgeVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center border font-medium whitespace-nowrap tabular-nums select-none forced-colors:border-current',
  {
    variants: {
      appearance: {
        solid: 'border-transparent',
        soft: 'border-transparent',
        outline: 'bg-background text-foreground',
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
        sm: 'text-2xs leading-none',
        md: 'text-xs leading-none',
        lg: 'text-base leading-none',
      },
      shape: {
        pill: 'rounded-full',
        circle: 'rounded-full',
        square: '',
      },
      dot: {
        true: 'p-0',
        false: '',
      },
    },
    compoundVariants: [
      // Number mode: height, minimum width and padding per size and shape.
      { dot: false, size: 'sm', class: 'h-4 min-w-4' },
      { dot: false, size: 'md', class: 'h-5 min-w-5' },
      { dot: false, size: 'lg', class: 'h-7 min-w-7' },
      { dot: false, shape: ['pill', 'square'], size: 'sm', class: 'px-1' },
      { dot: false, shape: ['pill', 'square'], size: 'md', class: 'px-1.5' },
      { dot: false, shape: ['pill', 'square'], size: 'lg', class: 'px-2.5' },
      { dot: false, shape: 'circle', class: 'px-0.5' },
      { dot: false, shape: 'square', class: 'rounded-md' },
      // Dot mode: a fixed square box.
      { dot: true, size: 'sm', class: 'size-1.5' },
      { dot: true, size: 'md', class: 'size-2' },
      { dot: true, size: 'lg', class: 'size-2.5' },
      { dot: true, shape: 'square', class: 'rounded-xs' },
      // A tinted dot this small needs an outline in its own colour to stay visible.
      { dot: true, appearance: 'soft', class: 'border-current' },

      { appearance: 'solid', tone: 'neutral', class: 'bg-foreground text-background' },
      { appearance: 'solid', tone: 'primary', class: 'bg-primary text-primary-foreground' },
      { appearance: 'solid', tone: 'success', class: 'bg-success text-success-foreground' },
      { appearance: 'solid', tone: 'warning', class: 'bg-warning text-warning-foreground' },
      { appearance: 'solid', tone: 'danger', class: 'bg-destructive text-destructive-foreground' },
      { appearance: 'solid', tone: 'info', class: 'bg-info text-info-foreground' },
      { appearance: 'soft', tone: 'neutral', class: 'bg-muted text-muted-foreground' },
      { appearance: 'soft', tone: 'primary', class: 'bg-primary/10 text-primary' },
      { appearance: 'soft', tone: 'success', class: 'bg-success/15 text-success' },
      { appearance: 'soft', tone: 'warning', class: 'bg-warning/20 text-warning-foreground dark:text-warning' },
      { appearance: 'soft', tone: 'danger', class: 'bg-destructive/10 text-destructive' },
      { appearance: 'soft', tone: 'info', class: 'bg-info/15 text-info' },
      { appearance: 'outline', tone: 'neutral', class: 'border-border text-muted-foreground' },
      { appearance: 'outline', tone: 'primary', class: 'border-primary/50 text-primary' },
      { appearance: 'outline', tone: 'success', class: 'border-success/50 text-success' },
      { appearance: 'outline', tone: 'warning', class: 'border-warning text-warning-foreground dark:text-warning' },
      { appearance: 'outline', tone: 'danger', class: 'border-destructive/50 text-destructive' },
      { appearance: 'outline', tone: 'info', class: 'border-info/50 text-info' },
    ],
    defaultVariants: { appearance: 'solid', tone: 'primary', size: 'md', shape: 'pill', dot: false },
  },
)

export type CountBadgeVariants = VariantProps<typeof countBadgeVariants>
export type CountBadgeAppearance = 'solid' | 'soft' | 'outline'
export type CountBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
export type CountBadgeSize = 'sm' | 'md' | 'lg'
export type CountBadgeShape = 'pill' | 'circle' | 'square'
export type CountBadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'

export const COUNT_BADGE_APPEARANCES: readonly CountBadgeAppearance[] = ['solid', 'soft', 'outline']
export const COUNT_BADGE_TONES: readonly CountBadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
export const COUNT_BADGE_SIZES: readonly CountBadgeSize[] = ['sm', 'md', 'lg']
export const COUNT_BADGE_SHAPES: readonly CountBadgeShape[] = ['pill', 'circle', 'square']
export const COUNT_BADGE_PLACEMENTS: readonly CountBadgePlacement[] = ['top-end', 'top-start', 'bottom-end', 'bottom-start']

/**
 * Where `CountBadgeAnchor` puts the badge: centred on a corner of the anchored element. Offsets use the logical
 * `start` / `end` insets, and the horizontal shift is flipped for right-to-left text, so no physical left or right.
 */
export const countBadgePlacement: Record<CountBadgePlacement, string> = {
  'top-end': 'top-0 end-0 -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2',
  'top-start': 'top-0 start-0 -translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2',
  'bottom-end': 'bottom-0 end-0 translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2',
  'bottom-start': 'bottom-0 start-0 translate-y-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2',
}

/** Classes for a placement; an unknown value falls back to `top-end`. */
export const countBadgePlacementClasses = (placement: unknown): string =>
  countBadgePlacement[(COUNT_BADGE_PLACEMENTS as readonly unknown[]).includes(placement) ? (placement as CountBadgePlacement) : 'top-end']
