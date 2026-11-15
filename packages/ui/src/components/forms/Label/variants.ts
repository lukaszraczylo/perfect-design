import { cva, type VariantProps } from '../../../lib/cva'

/** Form label. The default (`md`, `default`) is the label every Field has always rendered. */
export const labelVariants = cva('inline-flex items-baseline gap-1', {
  variants: {
    size: {
      sm: 'text-xs leading-snug font-medium select-none',
      md: 'text-sm leading-snug font-medium select-none',
      lg: 'text-base leading-snug font-medium select-none',
    },
    /** `muted` suits secondary labels next to a stronger heading; it uses the tested muted-foreground on background pair. */
    variant: {
      default: '',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: { size: 'md', variant: 'default' },
})

export type LabelVariants = VariantProps<typeof labelVariants>
export type LabelSize = NonNullable<LabelVariants['size']>
export type LabelVariant = NonNullable<LabelVariants['variant']>
