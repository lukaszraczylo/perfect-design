import { cva, type VariantProps } from '../../../lib/cva'
import { merged, resolveSurfaceShape, resolveSurfaceSize, type SurfaceShape, type SurfaceSize } from '../shared/surface'

export const ctaBandVariantNames = ['band', 'card', 'split', 'inline', 'newsletter'] as const
export type CtaBandVariant = (typeof ctaBandVariantNames)[number]

export const ctaBandToneNames = ['primary', 'muted', 'inverted'] as const

const ctaBandBase = cva('', {
  variants: {
    variant: {
      band: 'w-full px-4 py-16 sm:px-6 lg:px-8',
      card: 'rounded-lg px-6 py-12 sm:px-12 sm:py-16',
      split: 'rounded-lg px-6 py-10 sm:px-12 sm:py-14',
      inline: 'rounded-lg px-5 py-4',
      newsletter: 'rounded-lg px-6 py-12 sm:px-12 sm:py-16',
    },
    tone: {
      primary: 'bg-primary text-primary-foreground',
      muted: 'bg-muted text-foreground',
      inverted: 'bg-foreground text-background',
    },
    size: { sm: '', md: '', lg: '' },
    shape: { rounded: '', square: '' },
  },
  compoundVariants: [
    // `md` keeps the original padding of each layout.
    { variant: 'band', size: 'sm', class: 'px-4 py-10 sm:px-6 lg:px-8' },
    { variant: 'band', size: 'lg', class: 'px-4 py-24 sm:px-6 lg:px-8' },
    { variant: ['card', 'newsletter'], size: 'sm', class: 'px-5 py-8 sm:px-8 sm:py-10' },
    { variant: ['card', 'newsletter'], size: 'lg', class: 'px-6 py-16 sm:px-16 sm:py-24' },
    { variant: 'split', size: 'sm', class: 'px-5 py-8 sm:px-8 sm:py-10' },
    { variant: 'split', size: 'lg', class: 'px-6 py-14 sm:px-16 sm:py-20' },
    { variant: 'inline', size: 'sm', class: 'px-4 py-3' },
    { variant: 'inline', size: 'lg', class: 'px-6 py-6' },
    // `square` removes the radius of the boxed layouts (`band` is full width and has none).
    { shape: 'square', class: 'rounded-none' },
  ],
  defaultVariants: { variant: 'card', tone: 'primary', size: 'md', shape: 'rounded' },
})

/** Root classes. Conflict-free output (later classes win). */
export const ctaBandVariants = merged(ctaBandBase)

export type CtaBandVariants = VariantProps<typeof ctaBandBase>
export type CtaBandSize = SurfaceSize
export type CtaBandShape = SurfaceShape
export const resolveCtaBandSize = resolveSurfaceSize
export const resolveCtaBandShape = resolveSurfaceShape
export type CtaBandTone = (typeof ctaBandToneNames)[number]

export const ctaBandInnerVariants = cva('mx-auto w-full', {
  variants: {
    variant: {
      band: 'flex max-w-3xl flex-col items-center gap-4 text-center',
      card: 'flex max-w-3xl flex-col items-center gap-4 text-center',
      newsletter: 'flex max-w-2xl flex-col items-center gap-4 text-center',
      split: 'grid max-w-6xl items-center gap-x-10 gap-y-4 text-start lg:grid-cols-2',
      inline: 'flex max-w-6xl flex-col gap-3 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-6',
    },
  },
  defaultVariants: { variant: 'card' },
})

/** Groups headline and subtext. `contents` keeps them direct grid/flex items in every layout except `inline`, where it is a column. */
export const ctaBandTextVariants = cva('', {
  variants: { variant: { band: 'contents', card: 'contents', newsletter: 'contents', split: 'contents', inline: 'flex min-w-0 flex-col gap-1' } },
  defaultVariants: { variant: 'card' },
})

const ctaBandHeadlineBase = cva('text-balance break-words font-semibold tracking-tight', {
  variants: {
    variant: {
      band: 'text-3xl sm:text-4xl',
      card: 'text-3xl sm:text-4xl',
      newsletter: 'text-3xl sm:text-4xl',
      split: 'text-3xl sm:text-4xl lg:col-start-1',
      inline: 'text-lg',
    },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: ['band', 'card', 'newsletter', 'split'], size: 'sm', class: 'text-2xl sm:text-3xl' },
    { variant: ['band', 'card', 'newsletter', 'split'], size: 'lg', class: 'text-4xl sm:text-5xl' },
    { variant: 'inline', size: 'sm', class: 'text-base' },
    { variant: 'inline', size: 'lg', class: 'text-xl' },
  ],
  defaultVariants: { variant: 'card', size: 'md' },
})

/** Headline. Conflict-free output (later classes win). */
export const ctaBandHeadlineVariants = merged(ctaBandHeadlineBase)

export const ctaBandSubtextVariants = cva('text-pretty', {
  variants: {
    variant: {
      band: 'text-lg',
      card: 'text-lg',
      newsletter: 'text-lg',
      split: 'text-lg lg:col-start-1',
      inline: 'text-sm',
    },
  },
  defaultVariants: { variant: 'card' },
})

export const ctaBandActionsVariants = cva('flex flex-wrap gap-3', {
  variants: {
    variant: {
      band: 'mt-2 justify-center',
      card: 'mt-2 justify-center',
      newsletter: 'justify-center',
      split: 'mt-2 justify-start lg:col-start-1',
      inline: 'sm:shrink-0 sm:justify-end',
    },
  },
  defaultVariants: { variant: 'card' },
})
