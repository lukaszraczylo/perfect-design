import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import { CHOICE_TONES, normalizeChoiceTone, type ChoiceTone } from '../Checkbox/tones'

export const SLIDER_SIZES = ['sm', 'md', 'lg'] as const
export type SliderSize = (typeof SLIDER_SIZES)[number]
export const normalizeSliderSize = (value: unknown): SliderSize => ((SLIDER_SIZES as readonly unknown[]).includes(value) ? (value as SliderSize) : 'md')
export const normalizeSliderOrientation = (value: unknown): 'horizontal' | 'vertical' => (value === 'vertical' ? 'vertical' : 'horizontal')
export { CHOICE_TONES as SLIDER_TONES, normalizeChoiceTone as normalizeSliderTone }
export type SliderTone = ChoiceTone

/** Root. Reserves room for the value bubble (above or beside the thumb) and the tick marks (below or beside the track). */
const rootBase = cva('relative flex touch-none items-center select-none data-disabled:opacity-50', {
  variants: {
    orientation: {
      horizontal: 'min-h-6 w-full pointer-coarse:min-h-11',
      vertical: 'h-full min-h-44 w-auto flex-col pointer-coarse:min-w-11',
    },
    bubble: { true: '', false: '' },
    marks: { true: '', false: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', bubble: true, class: 'pt-8' },
    { orientation: 'horizontal', marks: true, class: 'pb-5' },
    { orientation: 'vertical', bubble: true, class: 'ps-12' },
    { orientation: 'vertical', marks: true, class: 'pe-12' },
  ],
  defaultVariants: { orientation: 'horizontal', bubble: false, marks: false },
})
type RootInput = NonNullable<Parameters<typeof rootBase>[0]>
export function sliderVariants(props: RootInput = {}): string {
  return cn(rootBase(props))
}

/** Track thickness by size (the thumb stays at least 24px so the target size rule holds). */
const trackBase = cva('relative grow overflow-hidden rounded-full bg-muted forced-color-adjust-none', {
  variants: {
    orientation: { horizontal: 'w-full', vertical: 'h-full' },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', size: 'sm', class: 'h-1' },
    { orientation: 'horizontal', size: 'md', class: 'h-1.5' },
    { orientation: 'horizontal', size: 'lg', class: 'h-2.5' },
    { orientation: 'vertical', size: 'sm', class: 'w-1' },
    { orientation: 'vertical', size: 'md', class: 'w-1.5' },
    { orientation: 'vertical', size: 'lg', class: 'w-2.5' },
  ],
  defaultVariants: { orientation: 'horizontal', size: 'md' },
})
type TrackInput = NonNullable<Parameters<typeof trackBase>[0]>
export const sliderTrackVariants = (props: TrackInput = {}): string => cn(trackBase(props))

/** Filled part of the track, one complete literal per tone. */
const rangeBase = cva('absolute forced-color-adjust-none', {
  variants: {
    orientation: { horizontal: 'h-full', vertical: 'w-full' },
    tone: {
      primary: 'bg-primary',
      success: 'bg-success',
      danger: 'bg-destructive',
      neutral: 'bg-foreground',
      info: 'bg-info',
    },
  },
  defaultVariants: { orientation: 'horizontal', tone: 'primary' },
})
type RangeInput = NonNullable<Parameters<typeof rangeBase>[0]>
export const sliderRangeVariants = (props: RangeInput = {}): string => cn(rangeBase(props))

const thumbBase = cva(
  'block shrink-0 rounded-full border-2 bg-background shadow-sm transition-shadow forced-color-adjust-none hover:ring-4 hover:ring-ring/30 disabled:pointer-events-none data-disabled:cursor-not-allowed ' + focusRing + ' focus-visible:ring-4',
  {
    variants: {
      size: { sm: 'size-6', md: 'size-6', lg: 'size-7' },
      tone: {
        primary: 'border-primary',
        success: 'border-success',
        danger: 'border-destructive',
        neutral: 'border-foreground',
        info: 'border-info',
      },
    },
    defaultVariants: { size: 'md', tone: 'primary' },
  },
)
type ThumbInput = NonNullable<Parameters<typeof thumbBase>[0]>
export const sliderThumbVariants = (props: ThumbInput = {}): string => cn(thumbBase(props))

/** Tick mark group and the value bubble. Colours are the covered pairs: muted-foreground on background, background on foreground. */
export const sliderMarksVariants = cva('pointer-events-none absolute', {
  variants: {
    orientation: {
      horizontal: 'inset-x-3 bottom-0 h-5',
      vertical: 'inset-y-3 end-0 w-12',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})
export const sliderMarkVariants = cva('absolute flex items-center text-muted-foreground', {
  variants: {
    orientation: {
      horizontal: 'top-0 flex-col -translate-x-1/2',
      vertical: 'translate-y-1/2 flex-row gap-1.5',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})
export const sliderBubbleVariants = cva(
  'pointer-events-none absolute rounded-md bg-foreground px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-background tabular-nums',
  {
    variants: {
      orientation: {
        horizontal: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
        vertical: 'end-full top-1/2 me-2 -translate-y-1/2',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

export type SliderVariants = VariantProps<typeof sliderVariants>
