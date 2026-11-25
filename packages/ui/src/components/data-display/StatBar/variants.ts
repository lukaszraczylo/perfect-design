import { cva, type VariantProps } from '../../../lib/cva'

export const statBarMarkerVariants = cva('absolute inset-y-0 w-0.5', {
  variants: {
    tone: {
      neutral: 'bg-foreground',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      primary: 'bg-primary',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export type StatBarMarkerVariants = VariantProps<typeof statBarMarkerVariants>
