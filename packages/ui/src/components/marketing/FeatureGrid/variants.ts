import { cva, type VariantProps } from '../../../lib/cva'
import type { FeatureCardVariant } from '../FeatureCard/variants'
import { merged, resolveSurfaceGap, type SurfaceGap } from '../shared/surface'

export const FEATURE_GRID_LAYOUTS = ['grid', 'list', 'alternating', 'bento', 'centered', 'with-heading'] as const
export const FEATURE_GRID_ALIGNS = ['left', 'center'] as const

/** Layouts that arrange items in CSS columns (the `columns` prop applies to these). */
const COLUMN_LAYOUTS = ['grid', 'bento', 'centered', 'with-heading'] as const

const featureGridBase = cva('', {
  variants: {
    layout: {
      grid: 'grid gap-6',
      list: 'flex flex-col gap-4',
      alternating: 'flex flex-col gap-16 md:gap-24',
      bento: 'grid auto-rows-fr gap-4 md:gap-6',
      centered: 'grid gap-8',
      'with-heading': 'grid gap-6',
    },
    columns: {
      2: '',
      3: '',
      4: '',
    },
    gap: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    // `gap: md` keeps each layout's own spacing; sm and lg scale it.
    { layout: ['grid', 'with-heading'], gap: 'sm', class: 'gap-4' },
    { layout: ['grid', 'with-heading'], gap: 'lg', class: 'gap-8' },
    { layout: 'list', gap: 'sm', class: 'gap-2' },
    { layout: 'list', gap: 'lg', class: 'gap-6' },
    { layout: 'alternating', gap: 'sm', class: 'gap-10 md:gap-16' },
    { layout: 'alternating', gap: 'lg', class: 'gap-20 md:gap-32' },
    { layout: 'bento', gap: 'sm', class: 'gap-3 md:gap-4' },
    { layout: 'bento', gap: 'lg', class: 'gap-6 md:gap-8' },
    { layout: 'centered', gap: 'sm', class: 'gap-6' },
    { layout: 'centered', gap: 'lg', class: 'gap-12' },
    { layout: [...COLUMN_LAYOUTS], columns: 2, class: 'sm:grid-cols-2' },
    { layout: [...COLUMN_LAYOUTS], columns: 3, class: 'sm:grid-cols-2 lg:grid-cols-3' },
    { layout: [...COLUMN_LAYOUTS], columns: 4, class: 'sm:grid-cols-2 lg:grid-cols-4' },
  ],
  defaultVariants: { layout: 'grid', columns: 3, gap: 'md' },
})

/** Item container classes; conflict-free output (later classes win). */
export const featureGridVariants = merged(featureGridBase)

export type FeatureGridGap = SurfaceGap
export const resolveFeatureGridGap = resolveSurfaceGap

/** Wrapper used when a heading is rendered above the items. */
export const featureGridWrapperVariants = cva('flex flex-col gap-10')

/** Row of the `alternating` layout (text + media). */
export const featureGridRowVariants = cva('grid items-center gap-8', {
  variants: { media: { true: 'md:grid-cols-2 md:gap-12', false: '' } },
  defaultVariants: { media: false },
})

export type FeatureGridVariants = VariantProps<typeof featureGridBase>
export type FeatureGridColumns = NonNullable<FeatureGridVariants['columns']>
export type FeatureGridLayout = (typeof FEATURE_GRID_LAYOUTS)[number]
export type FeatureGridAlign = (typeof FEATURE_GRID_ALIGNS)[number]
export type FeatureGridSpan = 1 | 2 | 3 | 4

export function resolveFeatureGridLayout(value: unknown): FeatureGridLayout {
  return (FEATURE_GRID_LAYOUTS as readonly unknown[]).includes(value) ? (value as FeatureGridLayout) : 'grid'
}
export function resolveFeatureGridAlign(value: unknown): FeatureGridAlign {
  return (FEATURE_GRID_ALIGNS as readonly unknown[]).includes(value) ? (value as FeatureGridAlign) : 'left'
}

/** Default card look per layout when the consumer does not pass `variant`. */
export const featureGridDefaultCardVariant: Record<FeatureGridLayout, FeatureCardVariant> = {
  grid: 'card',
  list: 'icon-left',
  alternating: 'minimal',
  bento: 'card',
  centered: 'minimal',
  'with-heading': 'card',
}

const SPAN_CLASSES: Record<FeatureGridSpan, string> = {
  1: '',
  2: 'sm:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
  4: 'sm:col-span-2 lg:col-span-4',
}

/** Class for a bento tile spanning `span` columns, clamped to `1..columns`. Invalid / NaN spans mean 1. */
export function bentoSpanClass(span: unknown, columns: number): string {
  const n = typeof span === 'number' && Number.isInteger(span) ? span : 1
  const clamped = Math.min(Math.max(n, 1), columns, 4) as FeatureGridSpan
  return SPAN_CLASSES[clamped]
}
