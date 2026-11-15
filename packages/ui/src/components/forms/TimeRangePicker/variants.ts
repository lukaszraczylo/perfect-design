import { cva, type VariantProps } from '../../../lib/cva'
import { datePickerVariants } from '../DatePicker/variants'

export const TIME_RANGE_VARIANTS = ['popover', 'inline', 'segmented'] as const
/** `popover` is a trigger button that opens a dropdown, `inline` shows the presets and the custom range in a bordered panel, `segmented` is a compact row of presets with the custom range below it. */
export type TimeRangeVariant = (typeof TIME_RANGE_VARIANTS)[number]

export const normalizeTimeRangeVariant = (value: unknown): TimeRangeVariant => ((TIME_RANGE_VARIANTS as readonly unknown[]).includes(value) ? (value as TimeRangeVariant) : 'popover')

/**
 * Root of `TimeRangePicker`. `status` colours the border of the `inline` panel only: the other variants show the status on their
 * own controls. Reuse it on a plain element to match the panel look.
 */
export const timeRangePickerVariants = cva('min-w-0 w-full', {
  variants: {
    variant: {
      popover: 'relative',
      inline: 'flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground forced-colors:border-[CanvasText]',
      segmented: 'flex flex-col gap-3',
    },
    status: {
      default: '',
      success: '',
      warning: '',
      error: '',
    },
  },
  compoundVariants: [
    { variant: 'inline', status: 'success', class: 'border-success' },
    { variant: 'inline', status: 'warning', class: 'border-warning-foreground dark:border-warning' },
    { variant: 'inline', status: 'error', class: 'border-destructive' },
  ],
  defaultVariants: { variant: 'popover', status: 'default' },
})

/** The trigger button of the `popover` variant: the shared date picker trigger (size, variant, shape, status). */
export const timeRangeTriggerVariants = datePickerVariants

export type TimeRangePickerVariants = VariantProps<typeof timeRangePickerVariants>
