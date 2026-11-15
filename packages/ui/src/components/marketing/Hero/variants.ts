import { cva, type VariantProps } from '../../../lib/cva'

export const heroVariantNames = [
  'centered',
  'split',
  'split-reverse',
  'left',
  'minimal',
  'stacked-media',
  'announcement',
  'with-stats',
  'with-logos',
  'with-form',
  'terminal',
  'code',
  'full-bleed',
  'bento',
] as const
export type HeroVariant = (typeof heroVariantNames)[number]

export const heroSizeNames = ['sm', 'md', 'lg'] as const
export type HeroSize = (typeof heroSizeNames)[number]

/** Variants whose text sits beside the media in two columns on large screens. */
export const heroSplitVariants: readonly HeroVariant[] = ['split', 'split-reverse', 'terminal', 'code']
/** Variants whose text is left-aligned. */
export const heroLeftVariants: readonly HeroVariant[] = ['split', 'split-reverse', 'left', 'terminal', 'code']

export const heroVariants = cva('relative isolate overflow-hidden', {
  variants: {
    variant: {
      centered: 'text-center',
      split: 'text-start',
      'split-reverse': 'text-start',
      left: 'text-start',
      minimal: 'text-center',
      'stacked-media': 'text-center',
      announcement: 'text-center',
      'with-stats': 'text-center',
      'with-logos': 'text-center',
      'with-form': 'text-center',
      terminal: 'text-start',
      code: 'text-start',
      'full-bleed': 'text-center',
      bento: 'text-center',
    },
    size: {
      sm: 'px-4 py-10 sm:px-6 sm:py-14 lg:px-8',
      md: 'px-4 py-16 sm:px-6 sm:py-24 lg:px-8',
      lg: 'px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40',
    },
  },
  defaultVariants: { variant: 'left', size: 'md' },
})

export type HeroVariants = VariantProps<typeof heroVariants>

export const heroTitleVariants = cva('text-balance break-words font-semibold tracking-tight', {
  variants: {
    size: {
      sm: 'text-3xl sm:text-4xl',
      md: 'text-4xl sm:text-5xl lg:text-6xl',
      lg: 'text-5xl sm:text-6xl',
    },
    compact: { true: 'text-2xl sm:text-3xl lg:text-4xl', false: '' },
  },
  defaultVariants: { size: 'md', compact: false },
})

export const heroSubtitleVariants = cva('text-pretty', {
  variants: {
    size: { sm: 'text-base sm:text-lg', md: 'text-lg sm:text-xl', lg: 'text-xl sm:text-2xl' },
    inverted: { true: 'text-current', false: 'text-muted-foreground' },
  },
  defaultVariants: { size: 'md', inverted: false },
})

/**
 * Built-in backgrounds. `grid` and `dots` render an aria-hidden SVG pattern (stroke/fill = currentColor, so the class
 * is a text colour token); `image` is rendered as an <img> + scrim by the component. Gradient, glow and spotlight
 * were removed (LLMSlop C2/C4/M4); unknown values render no background.
 */
export const heroBackgrounds = {
  none: '',
  grid: 'text-border',
  dots: 'text-muted-foreground/30',
  image: '',
} as const

export type HeroBackground = keyof typeof heroBackgrounds
/** @deprecated alias of `heroBackgrounds`, kept for backward compatibility. */
export const heroDecorations = heroBackgrounds
export type HeroDecoration = HeroBackground
