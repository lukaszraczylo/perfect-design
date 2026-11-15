import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Lead paragraph styling.
 * - `size`: `md` (16px), `lg` (default, 18px), `xl` (20px).
 * - `tone`: `muted` (default) or `foreground` (full-contrast text for a lead that carries the argument).
 * - `align`: `start` (default) or `center` (short display leads only; LLMSlop L7).
 */
export const leadVariants = cva('text-pretty', {
  variants: {
    size: {
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tone: {
      muted: 'text-muted-foreground',
      foreground: 'text-foreground',
    },
    align: {
      start: '',
      center: 'text-center',
    },
  },
  defaultVariants: { size: 'lg', tone: 'muted', align: 'start' },
})

export type LeadVariants = VariantProps<typeof leadVariants>
export type LeadSize = NonNullable<LeadVariants['size']>
export type LeadTone = NonNullable<LeadVariants['tone']>
export type LeadAlign = NonNullable<LeadVariants['align']>
export const leadSizes: readonly LeadSize[] = ['md', 'lg', 'xl']
export const leadTones: readonly LeadTone[] = ['muted', 'foreground']
export const leadAligns: readonly LeadAlign[] = ['start', 'center']
