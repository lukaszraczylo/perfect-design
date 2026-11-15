import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Section frame.
 *  - `variant`: `split` (heading and details left, form right), `centered`, `card` (split inside a bordered surface) and
 *    `inline` (compact: heading and description left, the form and details in one block on the right).
 *  - `size`: gaps (and the padding of a surface). `md` is the original.
 *  - `tone`: `default` (no fill; the `card` variant keeps its card surface) or `muted` (secondary surface with secondary-foreground text).
 *  - `align`: `center` centres the text of `split` and `card`. `centered` is always centred and `inline` always start-aligned.
 */
export const contactSectionVariants = cva('w-full', {
  variants: {
    variant: {
      split: 'grid items-start lg:grid-cols-2',
      centered: 'flex flex-col items-center',
      card: 'grid items-start rounded-lg border lg:grid-cols-2',
      inline: 'flex flex-col lg:flex-row lg:items-start lg:justify-between',
    },
    size: { sm: '', md: '', lg: '' },
    tone: { default: '', muted: '' },
  },
  compoundVariants: [
    { variant: 'split', size: 'sm', class: 'gap-6 lg:gap-10' },
    { variant: 'split', size: 'md', class: 'gap-10 lg:gap-16' },
    { variant: 'split', size: 'lg', class: 'gap-12 lg:gap-24' },
    { variant: 'card', size: 'sm', class: 'gap-6 p-4 sm:p-6 lg:gap-10' },
    { variant: 'card', size: 'md', class: 'gap-10 p-6 sm:p-10 lg:gap-16' },
    { variant: 'card', size: 'lg', class: 'gap-12 p-8 sm:p-14 lg:gap-24' },
    { variant: 'centered', size: 'sm', class: 'gap-6' },
    { variant: 'centered', size: 'md', class: 'gap-10' },
    { variant: 'centered', size: 'lg', class: 'gap-14' },
    { variant: 'inline', size: 'sm', class: 'gap-4 lg:gap-8' },
    { variant: 'inline', size: 'md', class: 'gap-6 lg:gap-10' },
    { variant: 'inline', size: 'lg', class: 'gap-8 lg:gap-14' },
    { variant: 'card', tone: 'default', class: 'bg-card text-card-foreground' },
    { variant: 'card', tone: 'muted', class: 'bg-secondary text-secondary-foreground' },
    // A muted surface on the frameless layouts is a bordered panel (the border also marks it in forced-colors mode).
    { variant: ['split', 'centered', 'inline'], tone: 'muted', class: 'rounded-lg border bg-secondary text-secondary-foreground' },
    { variant: ['split', 'centered', 'inline'], tone: 'muted', size: 'sm', class: 'p-4 sm:p-6' },
    { variant: ['split', 'centered', 'inline'], tone: 'muted', size: 'md', class: 'p-6 sm:p-10' },
    { variant: ['split', 'centered', 'inline'], tone: 'muted', size: 'lg', class: 'p-8 sm:p-14' },
  ],
  defaultVariants: { variant: 'split', size: 'md', tone: 'default' },
})

export const contactSectionIntroVariants = cva('flex min-w-0 flex-col', {
  variants: {
    variant: {
      split: '',
      centered: 'items-center text-center',
      card: '',
      inline: 'lg:max-w-xl lg:flex-1',
    },
    size: { sm: 'gap-6', md: 'gap-8', lg: 'gap-10' },
    align: { start: '', center: '' },
  },
  compoundVariants: [{ variant: ['split', 'card'], align: 'center', class: 'items-center text-center' }],
  defaultVariants: { variant: 'split', size: 'md', align: 'start' },
})

export const contactSectionFormVariants = cva('min-w-0', {
  variants: {
    variant: {
      split: '',
      centered: 'w-full max-w-xl',
      card: '',
      inline: 'w-full',
    },
  },
  defaultVariants: { variant: 'split' },
})

/** `inline` puts the form and the details in one block on the right of the heading. */
export const contactSectionContentVariants = cva('flex w-full min-w-0 flex-col lg:max-w-lg lg:flex-1', {
  variants: {
    size: { sm: 'gap-4', md: 'gap-6', lg: 'gap-8' },
  },
  defaultVariants: { size: 'md' },
})

export const contactSectionDetailsVariants = cva('flex min-w-0 flex-col gap-3', {
  variants: {
    variant: {
      split: '',
      centered: 'items-center text-center',
      card: '',
      inline: '',
    },
    size: { sm: 'text-sm', md: 'text-sm', lg: 'text-base' },
    align: { start: '', center: '' },
  },
  compoundVariants: [{ variant: ['split', 'card'], align: 'center', class: 'items-center text-center' }],
  defaultVariants: { variant: 'split', size: 'md', align: 'start' },
})

export type ContactSectionVariants = VariantProps<typeof contactSectionVariants>
export type ContactSectionVariant = NonNullable<ContactSectionVariants['variant']>
export type ContactSectionSize = NonNullable<ContactSectionVariants['size']>
export type ContactSectionTone = NonNullable<ContactSectionVariants['tone']>
export type ContactSectionAlign = NonNullable<VariantProps<typeof contactSectionIntroVariants>['align']>

export const CONTACT_VARIANTS: readonly ContactSectionVariant[] = ['split', 'centered', 'card', 'inline']
export const CONTACT_SIZES: readonly ContactSectionSize[] = ['sm', 'md', 'lg']
export const CONTACT_TONES: readonly ContactSectionTone[] = ['default', 'muted']
export const CONTACT_ALIGNS: readonly ContactSectionAlign[] = ['start', 'center']
