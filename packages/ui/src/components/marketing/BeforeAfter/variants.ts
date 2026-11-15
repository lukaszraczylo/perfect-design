import { cva, type VariantProps } from '../../../lib/cva'

export const BEFORE_AFTER_ORIENTATIONS = ['horizontal', 'vertical'] as const
export const BEFORE_AFTER_SIZES = ['sm', 'md', 'lg'] as const
export const BEFORE_AFTER_SHAPES = ['rounded', 'square'] as const
export const BEFORE_AFTER_TONES = ['default', 'primary', 'neutral'] as const
export const BEFORE_AFTER_APPEARANCES = ['knob', 'bar', 'line'] as const
export const BEFORE_AFTER_VARIANTS = ['overlay', 'bar', 'none'] as const

export type BeforeAfterOrientation = (typeof BEFORE_AFTER_ORIENTATIONS)[number]
export type BeforeAfterSize = (typeof BEFORE_AFTER_SIZES)[number]
export type BeforeAfterShape = (typeof BEFORE_AFTER_SHAPES)[number]
export type BeforeAfterTone = (typeof BEFORE_AFTER_TONES)[number]
export type BeforeAfterAppearance = (typeof BEFORE_AFTER_APPEARANCES)[number]
export type BeforeAfterVariant = (typeof BEFORE_AFTER_VARIANTS)[number]

/** Root frame; the cursor and the touch axis follow the drag direction. `shape` rounds or squares the corners. */
export const beforeAfterVariants = cva('relative w-full select-none overflow-hidden border bg-muted', {
  variants: {
    orientation: {
      horizontal: 'touch-pan-y',
      vertical: 'touch-pan-x',
    },
    shape: {
      rounded: 'rounded-lg',
      square: 'rounded-none',
    },
    dragging: {
      true: 'cursor-grabbing',
      false: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', dragging: false, class: 'cursor-ew-resize' },
    { orientation: 'vertical', dragging: false, class: 'cursor-ns-resize' },
  ],
  defaultVariants: { orientation: 'horizontal', shape: 'rounded', dragging: false },
})

/**
 * The draggable divider (hit area). `size` widens it (2rem, 2.5rem, 3rem), always above the 24px target size. Focus is an
 * inset 2px outline on the whole hit area (visible in forced-colors mode too); the grip adds its own ring. `outline-hidden`
 * sets the outline style to none, so the focus outline names `outline-solid` as well.
 */
export const beforeAfterHandleVariants = cva('group absolute outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring', {
  variants: {
    orientation: {
      horizontal: 'inset-y-0 -translate-x-1/2',
      vertical: 'inset-x-0 -translate-y-1/2',
    },
    size: { sm: '', md: '', lg: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', size: 'sm', class: 'w-8' },
    { orientation: 'horizontal', size: 'md', class: 'w-10' },
    { orientation: 'horizontal', size: 'lg', class: 'w-12' },
    { orientation: 'vertical', size: 'sm', class: 'h-8' },
    { orientation: 'vertical', size: 'md', class: 'h-10' },
    { orientation: 'vertical', size: 'lg', class: 'h-12' },
  ],
  defaultVariants: { orientation: 'horizontal', size: 'md' },
})

/** The visible divider line. The `line` appearance draws it twice as thick because it is the only visible part of the handle. */
export const beforeAfterLineVariants = cva('absolute', {
  variants: {
    orientation: {
      horizontal: 'inset-y-0 left-1/2 -translate-x-1/2',
      vertical: 'inset-x-0 top-1/2 -translate-y-1/2',
    },
    tone: {
      default: 'bg-background',
      primary: 'bg-primary',
      neutral: 'bg-foreground',
    },
    appearance: { knob: '', bar: '', line: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', appearance: ['knob', 'bar'], class: 'w-0.5' },
    { orientation: 'horizontal', appearance: 'line', class: 'w-1' },
    { orientation: 'vertical', appearance: ['knob', 'bar'], class: 'h-0.5' },
    { orientation: 'vertical', appearance: 'line', class: 'h-1' },
  ],
  defaultVariants: { orientation: 'horizontal', tone: 'default', appearance: 'knob' },
})

const GRIP_FOCUS =
  'group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/40 forced-colors:group-focus-visible:outline-2 forced-colors:group-focus-visible:outline-offset-2'

/**
 * The grip drawn on the line: a round `knob` with two chevrons (default) or a short rounded `bar`. Tone pairs are
 * foreground/background, primary-foreground/primary and background/foreground.
 */
export const beforeAfterKnobVariants = cva(`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border ${GRIP_FOCUS}`, {
  variants: {
    appearance: {
      knob: 'gap-0.5 rounded-full',
      bar: 'rounded-full',
      line: 'hidden',
    },
    size: { sm: '', md: '', lg: '' },
    tone: {
      default: 'bg-background text-foreground',
      primary: 'border-primary bg-primary text-primary-foreground',
      neutral: 'border-foreground bg-foreground text-background',
    },
    orientation: { horizontal: '', vertical: '' },
  },
  compoundVariants: [
    { appearance: 'knob', size: 'sm', class: 'size-7' },
    { appearance: 'knob', size: 'md', class: 'size-9' },
    { appearance: 'knob', size: 'lg', class: 'size-11' },
    { appearance: 'knob', orientation: 'vertical', class: 'flex-col' },
    { appearance: 'bar', orientation: 'horizontal', size: 'sm', class: 'h-6 w-2' },
    { appearance: 'bar', orientation: 'horizontal', size: 'md', class: 'h-8 w-2' },
    { appearance: 'bar', orientation: 'horizontal', size: 'lg', class: 'h-10 w-2.5' },
    { appearance: 'bar', orientation: 'vertical', size: 'sm', class: 'h-2 w-6' },
    { appearance: 'bar', orientation: 'vertical', size: 'md', class: 'h-2 w-8' },
    { appearance: 'bar', orientation: 'vertical', size: 'lg', class: 'h-2.5 w-10' },
  ],
  defaultVariants: { appearance: 'knob', size: 'md', tone: 'default', orientation: 'horizontal' },
})

/** Corner label chips (`overlay`). Physical sides on purpose: they stay on the image they describe, which does not flip in RTL. */
export const beforeAfterLabelVariants = cva('pointer-events-none absolute border bg-background px-2 py-0.5 font-medium text-foreground', {
  variants: {
    side: {
      'horizontal-before': 'left-3 top-3',
      'horizontal-after': 'right-3 top-3',
      'vertical-before': 'left-3 top-3',
      'vertical-after': 'bottom-3 left-3',
    },
    size: { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' },
    shape: { rounded: 'rounded-md', square: 'rounded-none' },
  },
  defaultVariants: { side: 'horizontal-before', size: 'md', shape: 'rounded' },
})

/** Docked caption strip (`bar`): one opaque row along the bottom edge holding both labels. Not blurred, not translucent. */
export const beforeAfterCaptionVariants = cva('pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t bg-background font-medium text-foreground', {
  variants: {
    size: { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-xs', lg: 'px-4 py-1.5 text-sm' },
  },
  defaultVariants: { size: 'md' },
})

export type BeforeAfterVariants = VariantProps<typeof beforeAfterVariants>
