import { cva, type VariantProps } from '../../../lib/cva'

/** Layout variations. `default` keeps the original look (bordered card, number left of the text). */
export const NUMBERED_STEPS_VARIANTS = ['default', 'cards', 'timeline', 'horizontal', 'minimal', 'with-media'] as const
export const NUMBERED_STEPS_SIZES = ['sm', 'md', 'lg'] as const
/** Colour of the number marker. Every pair is a checked token pair: primary, foreground/background, success and info on their solid fills. */
export const NUMBERED_STEPS_TONES = ['primary', 'neutral', 'success', 'info'] as const
/** Shape of the marker box. `circle` is the original; the bare number of `minimal` has no box, so it ignores the shape. */
export const NUMBERED_STEPS_SHAPES = ['circle', 'rounded', 'square'] as const
/** Where the marker sits against the text: `start` (original) or `center`. Timeline and horizontal keep `start` because their connector lines are drawn from the marker position. */
export const NUMBERED_STEPS_ALIGNS = ['start', 'center'] as const

export const numberedStepsVariants = cva('grid gap-6 list-none p-0', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
    },
    variant: {
      default: '',
      cards: '',
      minimal: 'gap-0',
      timeline: 'gap-0',
      horizontal: 'sm:grid-cols-none sm:grid-flow-col sm:auto-cols-fr',
      'with-media': 'gap-8',
    },
  },
  defaultVariants: { columns: 3, variant: 'default' },
})

const BOXED = ['default', 'cards', 'with-media'] as const

/** Classes of each `<li>`. Flat surfaces: border instead of shadow, `rounded-lg` at most. Connector lines use logical offsets so RTL mirrors and move with `size`. */
export const numberedStepsItemVariants = cva('min-w-0', {
  variants: {
    variant: {
      default: 'rounded-lg border bg-card text-card-foreground',
      cards: 'rounded-lg border bg-card text-card-foreground',
      timeline: 'relative last:pb-0 before:absolute before:w-px before:-translate-x-1/2 before:bg-border rtl:before:translate-x-1/2 last:before:hidden',
      horizontal: 'relative sm:after:absolute sm:after:-end-3 sm:after:h-px sm:after:bg-border sm:last:after:hidden',
      minimal: 'border-t',
      'with-media': 'grid rounded-lg border bg-card text-card-foreground md:grid-cols-2 md:items-center',
    },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { variant: [...BOXED], size: 'sm', class: 'p-4' },
    { variant: [...BOXED], size: 'md', class: 'p-6' },
    { variant: [...BOXED], size: 'lg', class: 'p-8' },
    { variant: 'with-media', size: 'sm', class: 'gap-4' },
    { variant: 'with-media', size: 'md', class: 'gap-6' },
    { variant: 'with-media', size: 'lg', class: 'gap-8' },
    { variant: 'minimal', size: 'sm', class: 'py-4' },
    { variant: 'minimal', size: 'md', class: 'py-6' },
    { variant: 'minimal', size: 'lg', class: 'py-8' },
    { variant: 'timeline', size: 'sm', class: 'pb-8 before:start-4 before:top-9 before:bottom-1' },
    { variant: 'timeline', size: 'md', class: 'pb-10 before:start-5 before:top-11 before:bottom-1' },
    { variant: 'timeline', size: 'lg', class: 'pb-12 before:start-6 before:top-13 before:bottom-1' },
    { variant: 'horizontal', size: 'sm', class: 'sm:after:start-11 sm:after:top-4' },
    { variant: 'horizontal', size: 'md', class: 'sm:after:start-13 sm:after:top-5' },
    { variant: 'horizontal', size: 'lg', class: 'sm:after:start-15 sm:after:top-6' },
  ],
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Wrapper around number + text inside the `<li>`. `align="center"` centres the marker against the text (row layouts) or the whole step (column layouts). */
export const numberedStepsContentVariants = cva('flex min-w-0', {
  variants: {
    variant: {
      default: '',
      cards: 'flex-col',
      timeline: '',
      horizontal: 'sm:flex-col',
      minimal: '',
      'with-media': '',
    },
    size: { sm: 'gap-3', md: 'gap-4', lg: 'gap-5' },
    align: { start: '', center: 'items-center' },
  },
  compoundVariants: [
    { variant: 'horizontal', size: 'sm', class: 'sm:gap-2' },
    { variant: 'horizontal', size: 'md', class: 'sm:gap-3' },
    { variant: 'horizontal', size: 'lg', class: 'sm:gap-4' },
    { variant: 'cards', align: 'center', class: 'text-center' },
  ],
  defaultVariants: { variant: 'default', size: 'md', align: 'start' },
})

const SOLID = ['default', 'cards', 'horizontal', 'with-media'] as const
const BOX_SHAPED = ['default', 'cards', 'timeline', 'horizontal', 'with-media'] as const

/** The numbered marker: size, shape and tone are separate dimensions. */
export const numberedStepsNumberVariants = cva('flex shrink-0 items-center justify-center font-semibold tabular-nums', {
  variants: {
    variant: {
      default: '',
      cards: '',
      timeline: 'relative z-10 border-2',
      horizontal: '',
      minimal: '',
      'with-media': '',
    },
    size: { sm: '', md: '', lg: '' },
    tone: { primary: '', neutral: '', success: '', info: '' },
    shape: { circle: '', rounded: '', square: '' },
  },
  compoundVariants: [
    { variant: [...BOX_SHAPED], size: 'sm', class: 'size-8 text-xs' },
    { variant: [...BOX_SHAPED], size: 'md', class: 'size-10 text-sm' },
    { variant: [...BOX_SHAPED], size: 'lg', class: 'size-12 text-base' },
    { variant: 'minimal', size: 'sm', class: 'w-8 text-xl' },
    { variant: 'minimal', size: 'md', class: 'w-10 text-2xl' },
    { variant: 'minimal', size: 'lg', class: 'w-12 text-3xl' },
    { variant: [...BOX_SHAPED], shape: 'circle', class: 'rounded-full' },
    { variant: [...BOX_SHAPED], shape: 'rounded', class: 'rounded-md' },
    { variant: [...BOX_SHAPED], shape: 'square', class: 'rounded-none' },
    // Filled marker: the tone's solid fill with its foreground.
    { variant: [...SOLID], tone: 'primary', class: 'bg-primary text-primary-foreground' },
    { variant: [...SOLID], tone: 'neutral', class: 'bg-foreground text-background' },
    { variant: [...SOLID], tone: 'success', class: 'bg-success text-success-foreground' },
    { variant: [...SOLID], tone: 'info', class: 'bg-info text-info-foreground' },
    // Outlined marker (timeline): tone border and text on the page background.
    { variant: 'timeline', tone: 'primary', class: 'border-primary bg-background text-primary' },
    { variant: 'timeline', tone: 'neutral', class: 'border-foreground bg-background text-foreground' },
    { variant: 'timeline', tone: 'success', class: 'border-success bg-background text-success' },
    { variant: 'timeline', tone: 'info', class: 'border-info bg-background text-info' },
    // Bare number (minimal).
    { variant: 'minimal', tone: 'primary', class: 'text-primary' },
    { variant: 'minimal', tone: 'neutral', class: 'text-foreground' },
    { variant: 'minimal', tone: 'success', class: 'text-success' },
    { variant: 'minimal', tone: 'info', class: 'text-info' },
  ],
  defaultVariants: { variant: 'default', size: 'md', tone: 'primary', shape: 'circle' },
})

/** Step title: 14px, 16px (original) or 18px. */
export const numberedStepsTitleVariants = cva('', {
  variants: { size: { sm: 'text-sm font-semibold', md: 'text-base font-semibold', lg: 'text-lg font-semibold' } },
  defaultVariants: { size: 'md' },
})

/** Step description: 14px, 16px at `lg`. */
export const numberedStepsDescriptionVariants = cva('mt-1 text-muted-foreground', {
  variants: { size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } },
  defaultVariants: { size: 'md' },
})

export type NumberedStepsVariants = VariantProps<typeof numberedStepsVariants>
export type NumberedStepsColumns = NonNullable<NumberedStepsVariants['columns']>
export type NumberedStepsVariant = (typeof NUMBERED_STEPS_VARIANTS)[number]
export type NumberedStepsSize = (typeof NUMBERED_STEPS_SIZES)[number]
export type NumberedStepsTone = (typeof NUMBERED_STEPS_TONES)[number]
export type NumberedStepsShape = (typeof NUMBERED_STEPS_SHAPES)[number]
export type NumberedStepsAlign = (typeof NUMBERED_STEPS_ALIGNS)[number]
