import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/** Card surface used inside a `BoardColumn`. Exported so non-component elements can reuse the look. */
export const boardCardVariants = cva(
  'relative flex flex-col gap-1 rounded-md text-card-foreground transition-[box-shadow,opacity,border-color] motion-reduce:transition-none ' + focusRing,
  {
    variants: {
      variant: {
        default: 'border bg-card shadow-xs',
        outline: 'border border-dashed bg-transparent',
        flat: 'bg-secondary text-secondary-foreground',
      },
      size: {
        sm: 'p-2 text-xs',
        md: 'p-3 text-sm',
        lg: 'p-4 text-base',
      },
      draggable: {
        true: 'cursor-grab active:cursor-grabbing',
        false: 'cursor-default',
      },
      dragging: {
        true: 'opacity-50 shadow-md ring-2 ring-ring/40',
        false: 'hover:shadow-sm',
      },
      disabled: {
        true: 'opacity-60',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', draggable: true, dragging: false, disabled: false },
  },
)

export type BoardCardVariants = VariantProps<typeof boardCardVariants>
export type BoardCardVariant = NonNullable<BoardCardVariants['variant']>
export type BoardCardSize = NonNullable<BoardCardVariants['size']>
