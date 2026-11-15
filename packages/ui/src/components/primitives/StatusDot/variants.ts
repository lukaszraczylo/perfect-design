import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Status dot styling.
 *
 * - `variant`: `solid` (filled, the default), `ring` (filled with an outline and a gap), `outline` (hollow, a border
 *   only) and `soft` (tinted fill with a border). `ring`, `outline` and `soft` draw a border or outline, which stays
 *   visible in forced-colors mode where a fill alone would be dropped.
 * - `size`: `xs` 4px, `sm` 6px, `md` 8px (default), `lg` 10px, `xl` 12px.
 * - Colours live in compound variants, so the result needs no `cn()` merge for the built-in looks.
 */
export const statusDotVariants = cva('relative inline-flex shrink-0 rounded-full align-middle', {
  variants: {
    variant: {
      solid: '',
      ring: 'outline-1 outline-offset-1',
      outline: 'bg-transparent',
      soft: 'border',
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
      xs: 'size-1',
      sm: 'size-1.5',
      md: 'size-2',
      lg: 'size-2.5',
      xl: 'size-3',
    },
  },
  compoundVariants: [
    { variant: 'solid', tone: 'neutral', class: 'bg-muted-foreground' },
    { variant: 'solid', tone: 'primary', class: 'bg-primary' },
    { variant: 'solid', tone: 'success', class: 'bg-success' },
    { variant: 'solid', tone: 'warning', class: 'bg-warning' },
    { variant: 'solid', tone: 'danger', class: 'bg-destructive' },
    { variant: 'solid', tone: 'info', class: 'bg-info' },
    { variant: 'ring', tone: 'neutral', class: 'bg-muted-foreground outline-muted-foreground' },
    { variant: 'ring', tone: 'primary', class: 'bg-primary outline-primary' },
    { variant: 'ring', tone: 'success', class: 'bg-success outline-success' },
    { variant: 'ring', tone: 'warning', class: 'bg-warning outline-warning' },
    { variant: 'ring', tone: 'danger', class: 'bg-destructive outline-destructive' },
    { variant: 'ring', tone: 'info', class: 'bg-info outline-info' },
    { variant: 'outline', tone: 'neutral', class: 'border-muted-foreground' },
    { variant: 'outline', tone: 'primary', class: 'border-primary' },
    { variant: 'outline', tone: 'success', class: 'border-success' },
    { variant: 'outline', tone: 'warning', class: 'border-warning' },
    { variant: 'outline', tone: 'danger', class: 'border-destructive' },
    { variant: 'outline', tone: 'info', class: 'border-info' },
    { variant: 'soft', tone: 'neutral', class: 'border-muted-foreground bg-muted-foreground/30' },
    { variant: 'soft', tone: 'primary', class: 'border-primary bg-primary/30' },
    { variant: 'soft', tone: 'success', class: 'border-success bg-success/30' },
    { variant: 'soft', tone: 'warning', class: 'border-warning bg-warning/30' },
    { variant: 'soft', tone: 'danger', class: 'border-destructive bg-destructive/30' },
    { variant: 'soft', tone: 'info', class: 'border-info bg-info/30' },
    // A 2px border leaves no hole on the two smallest dots, so they get a 1px border.
    { variant: 'outline', size: ['xs', 'sm'], class: 'border' },
    { variant: 'outline', size: ['md', 'lg', 'xl'], class: 'border-2' },
  ],
  defaultVariants: { variant: 'solid', tone: 'neutral', size: 'md' },
})

/** The animated halo behind a pulsing dot. It copies the dot's fill (or, for `outline`, its border colour). */
export const statusDotHaloVariants = cva('absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none', {
  variants: {
    variant: {
      solid: 'bg-inherit',
      ring: 'bg-inherit',
      outline: 'border-2 border-inherit',
      soft: 'bg-inherit',
    },
  },
  defaultVariants: { variant: 'solid' },
})

export type StatusDotVariants = VariantProps<typeof statusDotVariants>
export type StatusDotVariant = NonNullable<StatusDotVariants['variant']>
export type StatusDotTone = NonNullable<StatusDotVariants['tone']>
export type StatusDotSize = NonNullable<StatusDotVariants['size']>

export const STATUS_DOT_VARIANTS: readonly StatusDotVariant[] = ['solid', 'ring', 'outline', 'soft']
export const STATUS_DOT_TONES: readonly StatusDotTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
export const STATUS_DOT_SIZES: readonly StatusDotSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
