import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing, invalidRing } from '../../../lib/styles'
import type { IconDefinition } from '../../../lib/icons-tools'

export const RATING_SIZES = ['sm', 'md', 'lg'] as const
export type RatingSize = (typeof RATING_SIZES)[number]
/** `warning` (amber) is the default; the others reuse the choice-control tones. */
export const RATING_TONES = ['warning', 'primary', 'success', 'danger', 'neutral', 'info'] as const
export type RatingTone = (typeof RATING_TONES)[number]
export const RATING_ICONS = ['star', 'heart', 'circle'] as const
export type RatingIconName = (typeof RATING_ICONS)[number]
/** Built-in glyph name, or any FontAwesome-shaped icon definition. */
export type RatingIcon = RatingIconName | IconDefinition
/** Smallest selectable step. 1 = whole icons, 0.5 = halves, 0.25 = quarters. */
export const RATING_PRECISIONS = [1, 0.5, 0.25] as const
export type RatingPrecision = (typeof RATING_PRECISIONS)[number]

export const normalizeRatingSize = (value: unknown): RatingSize => ((RATING_SIZES as readonly unknown[]).includes(value) ? (value as RatingSize) : 'md')
export const normalizeRatingTone = (value: unknown): RatingTone => ((RATING_TONES as readonly unknown[]).includes(value) ? (value as RatingTone) : 'warning')
/** Returns the precision when it is one of 1, 0.5, 0.25, otherwise `undefined` (the caller then falls back to `allowHalf`). */
export const normalizeRatingPrecision = (value: unknown): RatingPrecision | undefined => ((RATING_PRECISIONS as readonly unknown[]).includes(Number(value)) && value !== null && value !== '' ? (Number(value) as RatingPrecision) : undefined)

/** Glyphs on a 24x24 grid, drawn as an outline when empty and solid when filled. */
export const RATING_PATHS: Record<RatingIconName, string> = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M12 20.5s-8.5-5.2-8.5-11.2C3.5 6.2 5.7 4 8.4 4c1.5 0 2.9.8 3.6 2 .7-1.2 2.1-2 3.6-2 2.7 0 4.9 2.2 4.9 5.3 0 6-8.5 11.2-8.5 11.2z',
  circle: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
}

export interface RatingGlyph {
  viewBox: string
  paths: string[]
  /** Stroke width in glyph units: 1.5 on the 24 grid, scaled for other grids so the outline looks the same. */
  stroke: number
}

/** Resolve the `icon` prop. Anything that is neither a built-in name nor a usable icon definition becomes the star. */
export function resolveRatingGlyph(icon: unknown): RatingGlyph {
  if (icon && typeof icon === 'object') {
    const data = (icon as IconDefinition).icon
    if (Array.isArray(data) && data.length >= 5) {
      const [w, h, , , path] = data
      const paths = (Array.isArray(path) ? path : [path]).filter((p): p is string => typeof p === 'string' && p.length > 0)
      if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && paths.length) {
        return { viewBox: `0 0 ${w} ${h}`, paths, stroke: Math.round((1.5 * Math.max(w, h)) / 24 * 100) / 100 }
      }
    }
  }
  const name = typeof icon === 'string' && (RATING_ICONS as readonly string[]).includes(icon) ? (icon as RatingIconName) : 'star'
  return { viewBox: '0 0 24 24', paths: [RATING_PATHS[name]], stroke: 1.5 }
}

const rootBase = cva(
  'inline-flex w-fit max-w-full flex-wrap items-center rounded-md border border-transparent align-middle select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ' +
    focusRing +
    ' ' +
    invalidRing,
  {
    variants: {
      size: {
        sm: 'gap-0.5 [&_svg]:size-4',
        md: 'gap-0.5 [&_svg]:size-5',
        lg: 'gap-1 [&_svg]:size-7',
      },
    },
    defaultVariants: { size: 'md' },
  },
)
type RootInput = NonNullable<Parameters<typeof rootBase>[0]>
/** Root styling of `Rating`; reusable for custom icon widgets. */
export const ratingVariants = (props: RootInput = {}): string => cn(rootBase(props))

/** Fill of the active part of an icon, one complete literal per tone. The ink outline stays `stroke-foreground`. */
export const ratingFillVariants = cva('max-w-none shrink-0 stroke-foreground', {
  variants: {
    tone: {
      warning: 'fill-warning',
      primary: 'fill-primary',
      success: 'fill-success',
      danger: 'fill-destructive',
      neutral: 'fill-foreground',
      info: 'fill-info',
    },
  },
  defaultVariants: { tone: 'warning' },
})

export type RatingVariants = VariantProps<typeof ratingVariants>
