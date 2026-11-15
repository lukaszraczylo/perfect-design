import { cva, type VariantProps } from '../../../lib/cva'

/** Root styling. `size` sets the `--calendar-cell` custom property that sizes every day cell and nav button. */
export const calendarVariants = cva('inline-block select-none', {
  variants: {
    variant: {
      default: 'rounded-md border bg-card p-3 text-card-foreground shadow-xs',
      ghost: 'bg-transparent p-0',
      outline: 'rounded-md border bg-transparent p-3',
    },
    size: {
      xs: 'text-xs [--calendar-cell:calc(var(--spacing)*6)]',
      sm: 'text-xs [--calendar-cell:calc(var(--spacing)*7)]',
      md: 'text-sm [--calendar-cell:calc(var(--spacing)*9)]',
      lg: 'text-base [--calendar-cell:calc(var(--spacing)*9)] sm:[--calendar-cell:calc(var(--spacing)*11)]',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

/** Months laid out side by side (wrapping) or stacked. */
export const calendarMonthsVariants = cva('flex', {
  variants: {
    orientation: { horizontal: 'flex-wrap gap-x-4 gap-y-2', vertical: 'flex-col gap-y-4' },
  },
  defaultVariants: { orientation: 'horizontal' },
})

/** Corner shape of a day button. Range ends keep their flat inner edge in every shape. */
export const CALENDAR_DAY_SHAPES = { rounded: '', pill: 'rounded-full', square: 'rounded-none' } as const

export type CalendarVariants = VariantProps<typeof calendarVariants>
export type CalendarVariant = NonNullable<CalendarVariants['variant']>
export type CalendarSize = NonNullable<CalendarVariants['size']>

export type CalendarShape = keyof typeof CALENDAR_DAY_SHAPES
export type CalendarOrientation = NonNullable<VariantProps<typeof calendarMonthsVariants>['orientation']>

export const CALENDAR_VARIANTS: readonly CalendarVariant[] = ['default', 'ghost', 'outline']
export const CALENDAR_SIZES: readonly CalendarSize[] = ['xs', 'sm', 'md', 'lg']
