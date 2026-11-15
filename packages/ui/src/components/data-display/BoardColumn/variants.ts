import { cva, type VariantProps } from '../../../lib/cva'

/** Column container. `over` is the drop-highlight state, `disabled` dims the column and blocks drops. */
export const boardColumnVariants = cva('flex min-w-0 flex-col rounded-lg border transition-[background-color,border-color,box-shadow] motion-reduce:transition-none', {
  variants: {
    variant: {
      default: 'border-border bg-muted/50',
      muted: 'border-transparent bg-muted',
      outline: 'border-border bg-transparent',
    },
    size: {
      sm: 'gap-1.5 p-1.5 text-xs',
      md: 'gap-2 p-2 text-sm',
      lg: 'gap-3 p-3 text-base',
    },
    over: {
      true: 'border-primary bg-accent/60 ring-2 ring-primary/30',
      false: '',
    },
    disabled: {
      true: 'opacity-60',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'md', over: false, disabled: false },
})

export type BoardColumnVariants = VariantProps<typeof boardColumnVariants>
export type BoardColumnVariant = NonNullable<BoardColumnVariants['variant']>
export type BoardColumnSize = NonNullable<BoardColumnVariants['size']>
