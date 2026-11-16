import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'
import type { DataGridDensity, DataGridSize, DataGridVariant } from './types'

// Cells sit in clipped scroll areas, so the ring is inset; `outline-hidden` sets the outline style to none, so a plain `focus-visible:outline-2` draws nothing.
export const GRID_FOCUS = `${focusRing} focus-visible:ring-inset forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:-outline-offset-2 forced-colors:focus-visible:outline-[Highlight]`

export const DATA_GRID_VARIANTS = ['bordered', 'striped', 'borderless'] as const
export const DATA_GRID_SIZES = ['sm', 'md', 'lg'] as const
export const DATA_GRID_DENSITIES = ['compact', 'default', 'comfortable'] as const

/** Row height in px per density. Rows have a fixed height so the window maths stays exact. */
export const DATA_GRID_ROW_HEIGHTS: Record<DataGridDensity, number> = { compact: 28, default: 36, comfortable: 48 }
/** Row height on a coarse pointer (touch): never below this. */
export const DATA_GRID_TOUCH_ROW_HEIGHT = 44

/**
 * Grid root. `bordered` frames the grid and rules the columns, `striped` frames it and tints every second row, `borderless`
 * drops the frame and the column rules (row rules stay). `size` sets the text size; `density` is carried as an attribute and
 * sets the row height and cell padding.
 */
export const dataGridVariants = cva('group/grid relative isolate flex min-w-0 flex-col bg-background text-foreground', {
  variants: {
    variant: {
      bordered: 'rounded-md border border-border',
      striped: 'rounded-md border border-border',
      borderless: '',
    },
    size: { sm: 'text-xs', md: 'text-sm', lg: 'text-base' },
    density: { compact: '', default: '', comfortable: '' },
  },
  defaultVariants: { variant: 'bordered', size: 'md', density: 'default' },
})

export type DataGridVariants = VariantProps<typeof dataGridVariants>

export const normalizeVariant = (v: unknown): DataGridVariant => ((DATA_GRID_VARIANTS as readonly unknown[]).includes(v) ? (v as DataGridVariant) : 'bordered')
export const normalizeSize = (v: unknown): DataGridSize => ((DATA_GRID_SIZES as readonly unknown[]).includes(v) ? (v as DataGridSize) : 'md')
export const normalizeDensity = (v: unknown): DataGridDensity => ((DATA_GRID_DENSITIES as readonly unknown[]).includes(v) ? (v as DataGridDensity) : 'default')

/** Cell padding per density (logical, so it flips in right-to-left). */
export const DENSITY_PADDING: Record<DataGridDensity, string> = { compact: 'px-2', default: 'px-3', comfortable: 'px-4' }

/** Editor text: 16px below `md` so mobile browsers do not zoom the page, then the grid's own size. */
export const EDITOR_TEXT: Record<DataGridSize, string> = { sm: 'text-base md:text-xs', md: 'text-base md:text-sm', lg: 'text-base' }
