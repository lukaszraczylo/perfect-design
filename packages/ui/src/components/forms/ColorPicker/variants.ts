import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'

export const COLOR_PICKER_SIZES = ['sm', 'md', 'lg'] as const
export type ColorPickerSize = (typeof COLOR_PICKER_SIZES)[number]
export const COLOR_PICKER_SHAPES = ['rounded', 'square', 'circle'] as const
/** Swatch outline: `rounded` (default, the radius of other controls), `square` or `circle`. */
export type ColorPickerShape = (typeof COLOR_PICKER_SHAPES)[number]
export const COLOR_PICKER_LAYOUTS = ['stacked', 'inline', 'compact'] as const
/** `stacked` puts the hex field under the swatches, `inline` puts both on one row, `compact` is `inline` with tighter spacing and a narrower field. */
export type ColorPickerLayout = (typeof COLOR_PICKER_LAYOUTS)[number]

export const normalizeColorPickerSize = (value: unknown): ColorPickerSize => ((COLOR_PICKER_SIZES as readonly unknown[]).includes(value) ? (value as ColorPickerSize) : 'md')
export const normalizeColorPickerShape = (value: unknown): ColorPickerShape => ((COLOR_PICKER_SHAPES as readonly unknown[]).includes(value) ? (value as ColorPickerShape) : 'rounded')
export const normalizeColorPickerLayout = (value: unknown): ColorPickerLayout => ((COLOR_PICKER_LAYOUTS as readonly unknown[]).includes(value) ? (value as ColorPickerLayout) : 'stacked')

const rootBase = cva('inline-flex w-full max-w-xs flex-col gap-3', {
  variants: {
    size: { sm: 'text-sm', md: '', lg: 'text-md' },
    layout: {
      stacked: '',
      inline: 'max-w-lg flex-row flex-wrap items-center',
      compact: 'max-w-md flex-row flex-wrap items-center gap-2',
    },
  },
  defaultVariants: { size: 'md', layout: 'stacked' },
})
type RootInput = NonNullable<Parameters<typeof rootBase>[0]>
/** Root layout of `ColorPicker`. */
export const colorPickerVariants = (props: RootInput = {}): string => cn(rootBase(props))

const swatchBase = cva(
  'relative shrink-0 border border-border shadow-xs outline-hidden transition-shadow forced-color-adjust-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-checked:ring-2 aria-checked:ring-ring aria-checked:ring-offset-2 aria-checked:ring-offset-background aria-checked:focus-visible:ring-4 forced-colors:aria-checked:outline-2 forced-colors:aria-checked:outline-solid forced-colors:aria-checked:outline-offset-2 forced-colors:aria-checked:outline-foreground forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-foreground motion-reduce:transition-none pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  {
    variants: {
      size: { sm: 'size-6', md: 'size-8', lg: 'size-10' },
      shape: { rounded: 'rounded-md', square: 'rounded-none', circle: 'rounded-full' },
    },
    defaultVariants: { size: 'md', shape: 'rounded' },
  },
)
type SwatchInput = NonNullable<Parameters<typeof swatchBase>[0]>
/** Single swatch button (also the preview chip). */
export const colorPickerSwatchVariants = (props: SwatchInput = {}): string => cn(swatchBase(props))

/** The swatch radiogroup: tighter gap in the compact layout. */
const swatchListBase = cva('flex flex-wrap gap-2', {
  variants: { layout: { stacked: '', inline: '', compact: 'gap-1' } },
  defaultVariants: { layout: 'stacked' },
})
type SwatchListInput = NonNullable<Parameters<typeof swatchListBase>[0]>
export const colorPickerSwatchListVariants = (props: SwatchListInput = {}): string => cn(swatchListBase(props))
/** The hex field wrapper: grows beside the swatches when inline, fixed and narrow when compact. */
const fieldBase = cva('min-w-0', {
  variants: { layout: { stacked: '', inline: 'min-w-40 flex-1', compact: 'w-32 shrink-0' } },
  defaultVariants: { layout: 'stacked' },
})
type FieldInput = NonNullable<Parameters<typeof fieldBase>[0]>
export const colorPickerFieldVariants = (props: FieldInput = {}): string => cn(fieldBase(props))

export type ColorPickerVariants = VariantProps<typeof colorPickerVariants>
