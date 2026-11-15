import { cva, type VariantProps } from '../../../lib/cva'

export const sectionVariants = cva('', {
  variants: {
    padding: {
      none: 'py-0',
      xs: 'py-3 md:py-4',
      sm: 'py-6 md:py-8',
      md: 'py-10 md:py-14',
      lg: 'py-14 md:py-20',
      xl: 'py-20 md:py-28',
    },
    tone: {
      none: '',
      muted: 'bg-muted text-foreground',
      card: 'bg-card text-card-foreground',
      primary: 'bg-primary text-primary-foreground',
    },
    /** Border on the top, bottom or both edges. Takes precedence over `bordered`. */
    divider: {
      none: '',
      top: 'border-t border-border',
      bottom: 'border-b border-border',
      both: 'border-y border-border',
    },
    bordered: { true: 'border-y border-border', false: '' },
  },
  defaultVariants: { padding: 'md', tone: 'none', bordered: false },
})

export type SectionVariants = VariantProps<typeof sectionVariants>
export type SectionPadding = NonNullable<SectionVariants['padding']>
export type SectionTone = NonNullable<SectionVariants['tone']>
export type SectionDivider = NonNullable<SectionVariants['divider']>

export const sectionPaddings: readonly string[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl']
export const sectionTones: readonly string[] = ['none', 'muted', 'card', 'primary']
export const sectionDividers: readonly string[] = ['none', 'top', 'bottom', 'both']
