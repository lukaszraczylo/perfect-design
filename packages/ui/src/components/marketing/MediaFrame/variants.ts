import { cva, type VariantProps } from '../../../lib/cva'

export const mediaFrameVariantNames = ['browser', 'window', 'phone', 'plain'] as const
export const mediaFrameSizeNames = ['sm', 'md', 'lg'] as const
export const mediaFrameShapeNames = ['rounded', 'square'] as const
export const mediaFrameAppearanceNames = ['bordered', 'borderless'] as const

export type MediaFrameVariant = (typeof mediaFrameVariantNames)[number]
export type MediaFrameSize = (typeof mediaFrameSizeNames)[number]
export type MediaFrameShape = (typeof mediaFrameShapeNames)[number]
export type MediaFrameAppearance = (typeof mediaFrameAppearanceNames)[number]

/**
 * The frame. `shape` sets the corners (`rounded` is rounded-lg, rounded-xl for the phone bezel), `appearance` the outline
 * of the browser, window and plain frames (the phone keeps its 8px bezel: it is the device, not an outline) and `size`
 * the width of the phone (14rem, 18rem, 20rem). A borderless frame still draws a border in forced-colors mode, where
 * the card surface would otherwise vanish into the page.
 */
export const mediaFrameVariants = cva('relative flex min-w-0 flex-col overflow-hidden bg-card text-card-foreground', {
  variants: {
    variant: {
      browser: '',
      window: '',
      phone: 'mx-auto w-full border-8 border-foreground',
      plain: '',
    },
    shape: { rounded: '', square: '' },
    appearance: { bordered: '', borderless: '' },
    size: { sm: '', md: '', lg: '' },
    elevated: {
      true: 'shadow-md',
      false: '',
    },
  },
  compoundVariants: [
    { variant: ['browser', 'window', 'plain'], shape: 'rounded', class: 'rounded-lg' },
    { variant: 'phone', shape: 'rounded', class: 'rounded-xl' },
    { shape: 'square', class: 'rounded-none' },
    { variant: ['browser', 'window', 'plain'], appearance: 'bordered', class: 'border' },
    { variant: ['browser', 'window', 'plain'], appearance: 'borderless', class: 'forced-colors:border' },
    { variant: 'phone', size: 'sm', class: 'max-w-56' },
    { variant: 'phone', size: 'md', class: 'max-w-72' },
    { variant: 'phone', size: 'lg', class: 'max-w-80' },
  ],
  defaultVariants: { variant: 'browser', shape: 'rounded', appearance: 'bordered', size: 'md', elevated: false },
})

export type MediaFrameVariants = VariantProps<typeof mediaFrameVariants>

/** Chrome bar of the browser and window variants. */
export const mediaFrameBarVariants = cva('flex items-center gap-3 border-b bg-muted', {
  variants: { size: { sm: 'px-2 py-1.5', md: 'px-3 py-2', lg: 'px-4 py-3' } },
  defaultVariants: { size: 'md' },
})

/** One of the three decorative dots in the chrome bar. */
export const mediaFrameDotVariants = cva('rounded-full bg-muted-foreground/40', {
  variants: { size: { sm: 'size-2', md: 'size-2.5', lg: 'size-3' } },
  defaultVariants: { size: 'md' },
})

/** Address pill (browser) or centred file name (window) in the chrome bar. */
export const mediaFrameTitleVariants = cva('min-w-0 flex-1 truncate text-muted-foreground', {
  variants: {
    variant: {
      browser: 'rounded-md border bg-background px-3 py-1 text-center',
      window: 'text-center font-mono',
      phone: '',
      plain: '',
    },
    size: { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' },
  },
  defaultVariants: { variant: 'browser', size: 'md' },
})

/** Notch of the phone variant. */
export const mediaFrameNotchVariants = cva('absolute inset-x-0 top-0 z-10 mx-auto rounded-b-lg bg-foreground', {
  variants: { size: { sm: 'h-4 w-20', md: 'h-5 w-24', lg: 'h-6 w-28' } },
  defaultVariants: { size: 'md' },
})
