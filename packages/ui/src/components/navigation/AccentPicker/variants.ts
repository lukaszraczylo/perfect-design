import { cva, type VariantProps } from '../../../lib/cva'

/**
 * AccentPicker looks.
 *
 * - `shape`: `circle` (default), `rounded` or `square` swatches.
 * - `size`: `md` (24px, default), `lg` (32px) or `xl` (40px). There is no smaller size: the swatches are the click targets
 *   and must stay at least 24px. Coarse pointers always get a bigger target.
 * - `layout`: `inline` (default, a wrapping row), `grid` (three columns) or `list` (a column of rows, each with the visible
 *   preset name and a check on the chosen one).
 * - Size and shape classes conflict with the base on purpose: pass the result through `cn()` (the component does).
 */
export const accentSwatchVariants = cva('size-6 shrink-0 rounded-full ring-offset-2 ring-offset-background pointer-coarse:size-8', {
  variants: {
    shape: { circle: '', rounded: 'rounded-md', square: 'rounded-none' },
    size: { md: '', lg: 'size-8 pointer-coarse:size-10', xl: 'size-10 pointer-coarse:size-11' },
  },
  defaultVariants: { shape: 'circle', size: 'md' },
})

export const accentPickerVariants = cva('', {
  variants: {
    layout: {
      inline: 'flex flex-wrap items-center gap-2',
      grid: 'grid w-fit grid-cols-3 gap-2',
      list: 'flex flex-col gap-1',
    },
  },
  defaultVariants: { layout: 'inline' },
})

/** A row of the `list` layout: the radio holds a swatch, the preset name and a check when chosen. */
export const ACCENT_ROW =
  'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-start text-sm text-foreground hover:bg-accent hover:text-accent-foreground aria-checked:bg-accent aria-checked:text-accent-foreground pointer-coarse:min-h-11 forced-colors:aria-checked:underline'

export type AccentSwatchVariants = VariantProps<typeof accentSwatchVariants>
export type AccentPickerShape = NonNullable<AccentSwatchVariants['shape']>
export type AccentPickerSize = NonNullable<AccentSwatchVariants['size']>
export type AccentPickerLayout = NonNullable<VariantProps<typeof accentPickerVariants>['layout']>
export const ACCENT_PICKER_SHAPES: readonly AccentPickerShape[] = ['circle', 'rounded', 'square']
export const ACCENT_PICKER_SIZES: readonly AccentPickerSize[] = ['md', 'lg', 'xl']
export const ACCENT_PICKER_LAYOUTS: readonly AccentPickerLayout[] = ['inline', 'grid', 'list']
