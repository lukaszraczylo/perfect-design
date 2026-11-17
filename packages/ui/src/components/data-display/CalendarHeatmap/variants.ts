import { cva, type VariantProps } from '../../../lib/cva'

/** Root of a calendar heatmap. `size` sets the gap between the title, the grid and the notes. */
export const calendarHeatmapVariants = cva('flex w-full min-w-0 flex-col', {
  variants: {
    size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' },
    shape: { square: '', circle: '' },
    gap: { sm: '', md: '', lg: '' },
  },
  defaultVariants: { size: 'md', shape: 'square', gap: 'md' },
})

export type CalendarHeatmapVariants = VariantProps<typeof calendarHeatmapVariants>
export type CalendarHeatmapSize = NonNullable<CalendarHeatmapVariants['size']>
export type CalendarHeatmapShape = NonNullable<CalendarHeatmapVariants['shape']>
export type CalendarHeatmapGap = NonNullable<CalendarHeatmapVariants['gap']>
export const CALENDAR_SIZES: readonly CalendarHeatmapSize[] = ['sm', 'md', 'lg']
export const CALENDAR_SHAPES: readonly CalendarHeatmapShape[] = ['square', 'circle']
export const CALENDAR_GAPS: readonly CalendarHeatmapGap[] = ['sm', 'md', 'lg']

/** Side of a day cell in px per `size`. */
export const CELL_SIZE: Record<CalendarHeatmapSize, number> = { sm: 10, md: 12, lg: 16 }
/** Space between cells in px per `gap`. */
export const CELL_GAP: Record<CalendarHeatmapGap, number> = { sm: 1, md: 2, lg: 4 }
/** `fit` mode: the cell side stays between these px values; below the minimum the grid scrolls. */
export const CALENDAR_FIT_MIN_CELL = 8
export const CALENDAR_FIT_MAX_CELL = 40
