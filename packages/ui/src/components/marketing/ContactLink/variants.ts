import { cva, type VariantProps } from '../../../lib/cva'

/** `inline` text link, `button` (filled), `outline` (bordered button), `ghost` (borderless button, fill on hover) and `card` (bordered block with an icon). */
export const CONTACT_LINK_VARIANTS = ['inline', 'button', 'outline', 'ghost', 'card'] as const
export const CONTACT_LINK_SIZES = ['sm', 'md', 'lg'] as const
/** `primary` (the original accent), `neutral` (foreground) or `muted` (muted-foreground, or the secondary surface for `button`). */
export const CONTACT_LINK_TONES = ['primary', 'neutral', 'muted'] as const
/** Corner shape: `rounded` (the original radius of each variant), `pill` or `square`. */
export const CONTACT_LINK_SHAPES = ['rounded', 'pill', 'square'] as const

const BUTTONS = ['button', 'outline', 'ghost'] as const

/** Layout of the link itself (applies to the non-link fallback span too). */
export const contactLinkVariants = cva('items-center font-medium', {
  variants: {
    variant: {
      inline: 'inline-flex min-h-6 pointer-coarse:min-h-11',
      button: 'inline-flex justify-center pointer-coarse:min-h-11',
      outline: 'inline-flex justify-center pointer-coarse:min-h-11',
      ghost: 'inline-flex justify-center pointer-coarse:min-h-11',
      card: 'flex w-full border bg-card text-card-foreground',
    },
    size: { sm: 'gap-1.5 text-xs', md: 'gap-2 text-sm', lg: 'gap-2.5 text-base' },
    shape: { rounded: '', pill: '', square: '' },
  },
  compoundVariants: [
    { variant: 'inline', shape: 'rounded', class: 'rounded-sm' },
    { variant: [...BUTTONS], shape: 'rounded', class: 'rounded-md' },
    { variant: 'card', shape: 'rounded', class: 'rounded-lg' },
    { shape: 'pill', class: 'rounded-full' },
    { shape: 'square', class: 'rounded-none' },
    { variant: [...BUTTONS], size: 'sm', class: 'min-h-8 px-3' },
    { variant: [...BUTTONS], size: 'md', class: 'min-h-9 px-4' },
    { variant: [...BUTTONS], size: 'lg', class: 'min-h-11 px-6' },
    { variant: 'card', size: 'sm', class: 'gap-2.5 p-3' },
    { variant: 'card', size: 'md', class: 'gap-3 p-4' },
    { variant: 'card', size: 'lg', class: 'gap-4 p-5' },
  ],
  defaultVariants: { variant: 'inline', size: 'md', shape: 'rounded' },
})

/**
 * Extra classes only applied when the element is a real link. Every tone uses a checked token pair: primary, foreground and
 * muted-foreground on the page background; primary-foreground on primary; background on foreground; secondary-foreground on secondary.
 * The `inline` link in neutral and muted tones is underlined because its colour alone would not set it apart from the text around it.
 */
export const contactLinkInteractiveVariants = cva('', {
  variants: {
    variant: {
      inline: '',
      button: '',
      outline: 'border bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground forced-colors:border',
      card: 'transition-colors hover:bg-accent hover:text-accent-foreground',
    },
    tone: { primary: '', neutral: '', muted: '' },
  },
  compoundVariants: [
    { variant: 'inline', tone: 'primary', class: 'text-primary hover:underline' },
    { variant: 'inline', tone: 'neutral', class: 'text-foreground underline underline-offset-4 hover:text-primary' },
    { variant: 'inline', tone: 'muted', class: 'text-muted-foreground underline underline-offset-4 hover:text-foreground' },
    { variant: 'button', tone: 'primary', class: 'bg-primary text-primary-foreground hover:bg-primary/90' },
    { variant: 'button', tone: 'neutral', class: 'bg-foreground text-background hover:underline' },
    { variant: 'button', tone: 'muted', class: 'bg-secondary text-secondary-foreground hover:underline' },
    { variant: 'outline', tone: 'primary', class: 'border-primary text-primary' },
    { variant: 'outline', tone: 'neutral', class: 'border-input text-foreground' },
    { variant: 'outline', tone: 'muted', class: 'text-muted-foreground' },
    { variant: 'ghost', tone: 'primary', class: 'text-primary' },
    { variant: 'ghost', tone: 'neutral', class: 'text-foreground' },
    { variant: 'ghost', tone: 'muted', class: 'text-muted-foreground' },
  ],
  defaultVariants: { variant: 'inline', tone: 'primary' },
})

/** Icon box of the `card` variant: a bare accent icon, no tinted tile. `tone` colours the icon. */
export const contactLinkIconTileVariants = cva('flex shrink-0 items-center justify-center', {
  variants: {
    tone: { primary: 'text-primary', neutral: 'text-foreground', muted: 'text-muted-foreground' },
    size: { sm: 'size-8', md: 'size-10', lg: 'size-12' },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
})

export type ContactLinkVariants = VariantProps<typeof contactLinkVariants>
export type ContactLinkVariant = (typeof CONTACT_LINK_VARIANTS)[number]
export type ContactLinkSize = (typeof CONTACT_LINK_SIZES)[number]
export type ContactLinkTone = (typeof CONTACT_LINK_TONES)[number]
export type ContactLinkShape = (typeof CONTACT_LINK_SHAPES)[number]
