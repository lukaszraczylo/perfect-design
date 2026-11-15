import { cva, type VariantProps } from '../../../lib/cva'
import { merged, resolveSurfaceShape, resolveSurfaceSize, resolveSurfaceTone, type SurfaceShape, type SurfaceSize, type SurfaceTone } from '../shared/surface'

export const FEATURE_CARD_VARIANTS = ['card', 'bordered', 'flat', 'icon-left', 'icon-top', 'icon-badge', 'minimal', 'highlight'] as const
export const FEATURE_CARD_ALIGNS = ['left', 'center'] as const

/** Variants that draw their own box and padding. */
const PADDED = ['card', 'bordered', 'flat', 'icon-left', 'icon-top', 'highlight'] as const
/** Variants without a box: they only get one when `tone` is not `default`. */
const UNBOXED = ['icon-badge', 'minimal'] as const

const featureCardBase = cva('relative flex text-card-foreground', {
  variants: {
    variant: {
      card: 'flex-col gap-3 rounded-lg border bg-card p-6',
      bordered: 'flex-col gap-3 rounded-lg border-2 border-border bg-transparent p-6',
      flat: 'flex-col gap-3 rounded-lg bg-muted p-6',
      'icon-left': 'flex-row items-start gap-4 rounded-lg border bg-card p-6',
      'icon-top': 'flex-col gap-4 rounded-lg border bg-card p-6',
      'icon-badge': 'flex-col gap-4 p-2',
      minimal: 'flex-col gap-2',
      highlight: 'flex-col gap-3 rounded-lg border-2 border-primary bg-card p-6',
    },
    align: {
      left: '',
      center: 'items-center text-center',
    },
    size: { sm: '', md: '', lg: '' },
    tone: {
      default: '',
      muted: 'bg-muted text-foreground',
      primary: 'bg-primary text-primary-foreground',
      inverted: 'bg-foreground text-background',
    },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    // icon-left is a row layout: "center" only centres the icon vertically, text stays at the start.
    { variant: 'icon-left', align: 'center', class: 'text-start' },
    // Padding scale for the boxed variants. `md` keeps the original `p-6`.
    { variant: [...PADDED], size: 'sm', class: 'p-4' },
    { variant: [...PADDED], size: 'lg', class: 'p-8' },
    // Unboxed variants gain a box (padding and radius) only when a tone paints a surface behind them.
    { variant: [...UNBOXED], tone: ['muted', 'primary', 'inverted'], class: 'rounded-lg p-6' },
    { variant: [...UNBOXED], tone: ['muted', 'primary', 'inverted'], size: 'sm', class: 'p-4' },
    { variant: [...UNBOXED], tone: ['muted', 'primary', 'inverted'], size: 'lg', class: 'p-8' },
    // `square` drops the radius of every variant (last, so it wins over the radius above).
    { shape: 'square', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'card', align: 'left', size: 'md', tone: 'default', shape: 'rounded' },
})

/** Same as the class-variance-authority call shape; conflicts are resolved (later classes win), so it is safe on plain elements. */
export const featureCardVariants = merged(featureCardBase)

/** Title heading. `md` is the original look. */
export const featureCardTitleVariants = cva('', {
  variants: {
    size: {
      sm: 'text-base font-semibold tracking-tight',
      md: 'text-lg font-semibold tracking-tight',
      lg: 'text-xl font-semibold tracking-tight',
    },
  },
  defaultVariants: { size: 'md' },
})

/** Description paragraph: text size by `size`, colour by `tone` (`default` and `muted` keep the muted token). */
export const featureCardDescriptionVariants = cva('', {
  variants: {
    size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' },
    tone: { default: 'text-muted-foreground', muted: 'text-muted-foreground', primary: 'text-primary-foreground', inverted: 'text-background' },
  },
  defaultVariants: { size: 'md', tone: 'default' },
})

/** Link colour override per tone: the accent colour (set by the component) on neutral surfaces, the surface's own text colour on filled ones. */
export const featureCardLinkVariants = cva('', {
  variants: {
    tone: { default: '', muted: '', primary: 'text-primary-foreground underline', inverted: 'text-background underline' },
  },
  defaultVariants: { tone: 'default' },
})

/** Wrapper around title, description and link. Grows so the link can be pinned to the bottom of equal-height cards. */
export const featureCardBodyVariants = cva('flex min-w-0 flex-1 flex-col gap-3', {
  variants: {
    variant: { card: '', bordered: '', flat: '', 'icon-left': 'gap-1.5', 'icon-top': '', 'icon-badge': '', minimal: 'gap-2', highlight: '' },
    align: { left: '', center: 'items-center' },
  },
  compoundVariants: [{ variant: 'icon-left', align: 'center', class: 'items-start' }],
  defaultVariants: { variant: 'card', align: 'left' },
})

/**
 * Icon wrapper. Every variant draws the bare icon in the accent colour; only `icon-badge` adds a tinted tile, and it is
 * opt-in (LLMSlop S8: no tinted rounded square above every card).
 */
const featureCardIconBase = cva('flex shrink-0 items-center justify-center text-primary', {
  variants: {
    variant: {
      card: '',
      bordered: '',
      flat: '',
      'icon-left': '',
      'icon-top': '',
      'icon-badge': 'size-12 rounded-md bg-primary/10',
      minimal: '',
      highlight: '',
    },
    tone: { default: '', muted: '', primary: 'text-primary-foreground', inverted: 'text-background' },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    { tone: ['primary', 'inverted'], variant: 'icon-badge', class: 'bg-transparent' },
    { shape: 'square', variant: 'icon-badge', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'card', tone: 'default', shape: 'rounded' },
})

/** Icon wrapper; conflict-free output (see `featureCardVariants`). */
export const featureCardIconVariants = merged(featureCardIconBase)

export type FeatureCardVariants = VariantProps<typeof featureCardVariants>
export type FeatureCardVariant = (typeof FEATURE_CARD_VARIANTS)[number]
export type FeatureCardAlign = (typeof FEATURE_CARD_ALIGNS)[number]
export type FeatureCardSize = SurfaceSize
export type FeatureCardTone = SurfaceTone
export type FeatureCardShape = SurfaceShape

export const featureCardIconSize: Record<FeatureCardVariant, 'lg' | 'xl'> = {
  card: 'lg',
  bordered: 'lg',
  flat: 'lg',
  'icon-left': 'lg',
  'icon-top': 'xl',
  'icon-badge': 'xl',
  minimal: 'xl',
  highlight: 'lg',
}

/** Unknown values fall back to the default `card` look. */
export function resolveFeatureCardVariant(value: unknown): FeatureCardVariant {
  return (FEATURE_CARD_VARIANTS as readonly unknown[]).includes(value) ? (value as FeatureCardVariant) : 'card'
}
/** Unknown values fall back to `left`. */
export function resolveFeatureCardAlign(value: unknown): FeatureCardAlign {
  return (FEATURE_CARD_ALIGNS as readonly unknown[]).includes(value) ? (value as FeatureCardAlign) : 'left'
}

export { resolveSurfaceShape as resolveFeatureCardShape, resolveSurfaceSize as resolveFeatureCardSize, resolveSurfaceTone as resolveFeatureCardTone }
