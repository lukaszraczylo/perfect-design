import { cva, type VariantProps } from '../../../lib/cva'
import { merged, resolveSurfaceGap, resolveSurfaceShape, resolveSurfaceSize, type SurfaceGap, type SurfaceShape, type SurfaceSize } from '../shared/surface'

export const STAT_GRID_VARIANTS = ['cards', 'divided', 'inline', 'plain', 'with-icons'] as const
export type StatGridVariant = (typeof STAT_GRID_VARIANTS)[number]
export type StatGridAlign = 'left' | 'center'
export const STAT_TRENDS = ['up', 'down', 'flat'] as const
export type StatTrend = (typeof STAT_TRENDS)[number]
export const STAT_GRID_TONES = ['default', 'primary'] as const
export type StatGridTone = (typeof STAT_GRID_TONES)[number]
export type StatGridSize = SurfaceSize
export type StatGridGap = SurfaceGap
export type StatGridShape = SurfaceShape

export const resolveStatGridSize = resolveSurfaceSize
export const resolveStatGridGap = resolveSurfaceGap
export const resolveStatGridShape = resolveSurfaceShape
/** Unknown values fall back to `default`. */
export function resolveStatGridTone(value: unknown): StatGridTone {
  return (STAT_GRID_TONES as readonly unknown[]).includes(value) ? (value as StatGridTone) : 'default'
}

/** Unknown values fall back to `plain` (the original look). */
export function resolveStatGridVariant(value: unknown): StatGridVariant {
  return (STAT_GRID_VARIANTS as readonly unknown[]).includes(value) ? (value as StatGridVariant) : 'plain'
}

/** Text alignment used when `align` is not set. */
export const DEFAULT_ALIGN: Record<StatGridVariant, StatGridAlign> = {
  plain: 'center',
  divided: 'center',
  inline: 'center',
  cards: 'left',
  'with-icons': 'left',
}

const GRIDDED = ['plain', 'cards', 'divided', 'with-icons'] as const

const statGridBase = cva('', {
  variants: {
    variant: {
      plain: 'grid grid-cols-1 gap-8',
      cards: 'grid grid-cols-1 gap-4',
      divided: 'grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border',
      inline: 'flex flex-wrap items-baseline justify-center gap-x-10 gap-y-4',
      'with-icons': 'grid grid-cols-1 gap-8',
    },
    align: { left: 'text-start', center: 'text-center' },
    columns: { 2: '', 3: '', 4: '' },
    gap: { sm: '', md: '', lg: '' },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    // `gap: md` keeps each variant's own spacing. `divided` draws its cell borders with a 1px gap, so it ignores `gap`.
    { variant: ['plain', 'with-icons'], gap: 'sm', class: 'gap-4' },
    { variant: ['plain', 'with-icons'], gap: 'lg', class: 'gap-12' },
    { variant: 'cards', gap: 'sm', class: 'gap-2' },
    { variant: 'cards', gap: 'lg', class: 'gap-6' },
    { variant: 'inline', gap: 'sm', class: 'gap-x-6 gap-y-2' },
    { variant: 'inline', gap: 'lg', class: 'gap-x-16 gap-y-6' },
    { variant: 'divided', shape: 'square', class: 'rounded-none' },
    { variant: [...GRIDDED], columns: 2, class: 'sm:grid-cols-2' },
    { variant: [...GRIDDED], columns: 3, class: 'sm:grid-cols-3' },
    { variant: [...GRIDDED], columns: 4, class: 'sm:grid-cols-2 lg:grid-cols-4' },
  ],
  defaultVariants: { variant: 'plain', align: 'center', columns: 4, gap: 'md', shape: 'rounded' },
})

/** Container classes. Conflict-free output (later classes win). */
export const statGridVariants = merged(statGridBase)

const statGridItemBase = cva('', {
  variants: {
    variant: {
      plain: 'flex flex-col-reverse gap-1',
      cards: 'flex flex-col-reverse gap-1 rounded-lg border bg-card p-6 text-card-foreground',
      divided: 'flex flex-col-reverse gap-1 bg-card p-6 text-card-foreground',
      inline: 'flex flex-row-reverse items-baseline gap-2',
      'with-icons': 'flex flex-col-reverse gap-1',
    },
    size: { sm: '', md: '', lg: '' },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    { variant: ['cards', 'divided'], size: 'sm', class: 'p-4' },
    { variant: ['cards', 'divided'], size: 'lg', class: 'p-8' },
    { variant: 'cards', shape: 'square', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'plain', size: 'md', shape: 'rounded' },
})

/** One stat cell. Conflict-free output (later classes win). */
export const statGridItemVariants = merged(statGridItemBase)

const statGridValueBase = cva('m-0 font-semibold tracking-tight tabular-nums', {
  variants: {
    variant: { plain: 'text-4xl', cards: 'text-4xl', divided: 'text-4xl', 'with-icons': 'text-4xl', inline: 'text-2xl' },
    size: { sm: '', md: '', lg: '' },
    tone: { default: '', primary: 'text-primary' },
  },
  compoundVariants: [
    { variant: ['plain', 'cards', 'divided', 'with-icons'], size: 'sm', class: 'text-2xl' },
    { variant: ['plain', 'cards', 'divided', 'with-icons'], size: 'lg', class: 'text-5xl' },
    { variant: 'inline', size: 'sm', class: 'text-xl' },
    { variant: 'inline', size: 'lg', class: 'text-3xl' },
  ],
  defaultVariants: { variant: 'plain', size: 'md', tone: 'default' },
})

/** Figure. `tone: primary` colours it with the accent (text-primary on the page and card surfaces is covered by the contrast test). */
export const statGridValueVariants = merged(statGridValueBase)

export const statGridTrendVariants = cva('mt-1 flex items-center gap-1 text-sm font-medium tracking-normal', {
  variants: {
    trend: { up: 'text-success', down: 'text-destructive', flat: 'text-muted-foreground', none: 'text-muted-foreground' },
    // A block row, so the trend sits under the figure whatever its width; `center` keeps it under a centred figure.
    align: { left: '', center: 'justify-center' },
  },
  defaultVariants: { trend: 'none', align: 'left' },
})

export type StatGridVariants = VariantProps<typeof statGridBase>
export type StatGridColumns = NonNullable<StatGridVariants['columns']>
