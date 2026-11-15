import { cva, type VariantProps } from '../../../lib/cva'
import { clampNumber } from '../shared/motion'
import { merged, resolveSurfaceShape, resolveSurfaceSize, resolveSurfaceTone, type SurfaceShape, type SurfaceSize, type SurfaceTone } from '../shared/surface'

export const TESTIMONIAL_VARIANTS = ['card', 'quote', 'inline', 'with-rating', 'avatar-left', 'featured'] as const
export type TestimonialVariant = (typeof TESTIMONIAL_VARIANTS)[number]

/** Unknown values fall back to `card`. */
export function resolveTestimonialVariant(value: unknown): TestimonialVariant {
  return (TESTIMONIAL_VARIANTS as readonly unknown[]).includes(value) ? (value as TestimonialVariant) : 'card'
}

/** Rating clamped to 0-5 and rounded to the nearest half. Non-numbers and non-finite numbers return `null` (no stars). */
export function normalizeRating(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.round(clampNumber(value, 0, 5, 0) * 2) / 2
}

const CARD = 'flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground'

const BOXED = ['card', 'with-rating', 'avatar-left'] as const
const TONES = ['muted', 'primary', 'inverted'] as const

const testimonialBase = cva('', {
  variants: {
    variant: {
      card: CARD,
      'with-rating': CARD,
      quote: 'flex flex-col items-center gap-8 px-4 py-6 text-center',
      inline: 'flex flex-col gap-3 border-s-2 border-border ps-4',
      'avatar-left': 'grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-3 rounded-lg border bg-card p-6 text-card-foreground',
      featured: 'flex flex-col gap-6 rounded-lg border border-primary bg-card p-8 text-card-foreground',
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
    // Padding scale of the boxed variants (`md` is the original p-6 / p-8).
    { variant: [...BOXED], size: 'sm', class: 'p-4' },
    { variant: [...BOXED], size: 'lg', class: 'p-8' },
    { variant: 'featured', size: 'sm', class: 'p-6' },
    { variant: 'featured', size: 'lg', class: 'p-10' },
    // The unboxed variants gain a box only when a tone paints a surface behind them.
    { variant: 'quote', tone: [...TONES], class: 'rounded-lg px-6 py-8' },
    { variant: 'inline', tone: [...TONES], class: 'rounded-lg border-s-0 px-4 py-3' },
    // `square` removes the radius (last, so it wins over the radius above).
    { shape: 'square', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'card', size: 'md', tone: 'default', shape: 'rounded' },
})

/** Root classes. Conflict-free output (later classes win), so it is safe on plain elements. */
export const testimonialVariants = merged(testimonialBase)

const testimonialQuoteBase = cva('', {
  variants: {
    variant: {
      card: 'text-pretty text-lg leading-relaxed',
      'with-rating': 'text-pretty text-lg leading-relaxed',
      'avatar-left': 'text-pretty text-lg leading-relaxed',
      quote: 'text-balance text-2xl font-medium leading-snug sm:text-3xl',
      inline: 'text-pretty text-base leading-relaxed',
      featured: 'text-pretty text-xl font-medium leading-relaxed sm:text-2xl',
    },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: [...BOXED], size: 'sm', class: 'text-base' },
    { variant: [...BOXED], size: 'lg', class: 'text-xl' },
    { variant: 'quote', size: 'sm', class: 'text-xl sm:text-2xl' },
    { variant: 'quote', size: 'lg', class: 'text-3xl sm:text-4xl' },
    { variant: 'inline', size: 'sm', class: 'text-sm' },
    { variant: 'inline', size: 'lg', class: 'text-lg' },
    { variant: 'featured', size: 'sm', class: 'text-lg sm:text-xl' },
    { variant: 'featured', size: 'lg', class: 'text-2xl sm:text-3xl' },
  ],
  defaultVariants: { variant: 'card', size: 'md' },
})

/** Quote text: size scale per variant. Conflict-free output. */
export const testimonialQuoteVariants = merged(testimonialQuoteBase)

export const testimonialAuthorVariants = cva('flex items-center gap-3', {
  variants: { variant: { card: '', 'with-rating': '', 'avatar-left': '', inline: '', featured: '', quote: 'justify-center text-start' } },
  defaultVariants: { variant: 'card' },
})

const testimonialAvatarBase = cva('', {
  variants: {
    variant: {
      card: 'size-10 text-sm',
      'with-rating': 'size-10 text-sm',
      inline: 'size-8 text-xs',
      quote: 'size-12 text-base',
      featured: 'size-12 text-base',
      'avatar-left': 'size-12 text-base',
    },
    tone: {
      default: '',
      muted: 'bg-background text-primary',
      primary: 'bg-background text-primary',
      inverted: 'bg-background text-foreground',
    },
    shape: { rounded: '', square: 'rounded-none' },
  },
  defaultVariants: { variant: 'card', tone: 'default', shape: 'rounded' },
})

/** Role line under the author name: muted on neutral surfaces, the surface's own text colour on filled ones. */
export const testimonialRoleVariants = cva('truncate text-sm', {
  variants: { tone: { default: 'text-muted-foreground', muted: 'text-muted-foreground', primary: 'text-primary-foreground', inverted: 'text-background' } },
  defaultVariants: { tone: 'default' },
})

/** Star glyph box (empty colour) and filled overlay colour per tone. */
export const testimonialStarVariants = cva('relative inline-block size-4', {
  variants: { tone: { default: 'text-muted-foreground/40', muted: 'text-muted-foreground/40', primary: 'text-current/40', inverted: 'text-current/40' } },
  defaultVariants: { tone: 'default' },
})
export const testimonialStarFillVariants = cva('absolute inset-y-0 start-0 overflow-hidden', {
  variants: { tone: { default: 'text-foreground', muted: 'text-foreground', primary: 'text-current', inverted: 'text-current' } },
  defaultVariants: { tone: 'default' },
})

/** Avatar box. Conflict-free output (later classes win). */
export const testimonialAvatarVariants = merged(testimonialAvatarBase)

export type TestimonialSize = SurfaceSize
export type TestimonialTone = SurfaceTone
export type TestimonialShape = SurfaceShape
export const resolveTestimonialSize = resolveSurfaceSize
export const resolveTestimonialTone = resolveSurfaceTone
export const resolveTestimonialShape = resolveSurfaceShape

export type TestimonialVariants = VariantProps<typeof testimonialVariants>
