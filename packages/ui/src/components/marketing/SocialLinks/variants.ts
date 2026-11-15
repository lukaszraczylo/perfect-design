import { cva, type VariantProps } from '../../../lib/cva'

export const SOCIAL_LINKS_VARIANTS = ['plain', 'outline', 'filled', 'ghost'] as const
export const SOCIAL_LINKS_SIZES = ['sm', 'md', 'lg'] as const
export const SOCIAL_LINKS_ALIGNS = ['start', 'center', 'end'] as const
export const SOCIAL_LINKS_ORIENTATIONS = ['horizontal', 'vertical'] as const

/** List layout. Align maps to `justify-*` in rows and `items-*` in columns. */
export const socialLinksVariants = cva('flex gap-2', {
  variants: {
    orientation: { horizontal: 'flex-row flex-wrap items-center', vertical: 'flex-col' },
    align: { start: '', center: '', end: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', align: 'start', class: 'justify-start' },
    { orientation: 'horizontal', align: 'center', class: 'justify-center' },
    { orientation: 'horizontal', align: 'end', class: 'justify-end' },
    { orientation: 'vertical', align: 'start', class: 'items-start' },
    { orientation: 'vertical', align: 'center', class: 'items-center' },
    { orientation: 'vertical', align: 'end', class: 'items-end' },
  ],
  defaultVariants: { orientation: 'horizontal', align: 'start' },
})

/**
 * Each link. `ghost` (default) is the original look: muted icon, accent background on hover. `plain` has no
 * background at all, `outline` a border, `filled` a solid primary background.
 */
export const socialLinksLinkVariants = cva('inline-flex items-center justify-center rounded-md transition-colors', {
  variants: {
    variant: {
      ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      plain: 'text-muted-foreground hover:text-foreground',
      outline: 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
      filled: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    size: { sm: 'size-8 pointer-coarse:size-11', md: 'size-10 pointer-coarse:size-11', lg: 'size-12' },
  },
  defaultVariants: { variant: 'ghost', size: 'md' },
})

export type SocialLinksVariants = VariantProps<typeof socialLinksVariants>
export type SocialLinksVariant = (typeof SOCIAL_LINKS_VARIANTS)[number]
export type SocialLinksSize = (typeof SOCIAL_LINKS_SIZES)[number]
export type SocialLinksAlign = (typeof SOCIAL_LINKS_ALIGNS)[number]
export type SocialLinksOrientation = (typeof SOCIAL_LINKS_ORIENTATIONS)[number]
