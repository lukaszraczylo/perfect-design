import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Root. `variant` is the layout (`split` puts the copy left and the form right from `lg`); `size` sets the gap and a card's padding.
 * Below `lg` the split layout is one column in the DOM order: copy, form, messages.
 */
export const newsletterSignupVariants = cva('', {
  variants: {
    variant: {
      inline: 'flex flex-col w-full',
      stacked: 'flex flex-col mx-auto w-full max-w-md items-center text-center',
      card: 'flex flex-col w-full rounded-lg border bg-card text-card-foreground',
      split: 'grid w-full items-start lg:grid-cols-2 lg:gap-x-10',
    },
    size: { sm: 'gap-3', md: 'gap-4', lg: 'gap-5' },
  },
  compoundVariants: [
    { variant: 'card', size: 'sm', class: 'p-4 sm:p-6' },
    { variant: 'card', size: 'md', class: 'p-6 sm:p-8' },
    { variant: 'card', size: 'lg', class: 'p-8 sm:p-10' },
  ],
  defaultVariants: { variant: 'inline', size: 'md' },
})

export const newsletterSignupFormVariants = cva('flex w-full gap-2', {
  variants: {
    variant: {
      inline: 'flex-col sm:flex-row sm:items-start',
      stacked: 'flex-col',
      card: 'flex-col',
      split: 'flex-col sm:flex-row sm:items-start',
    },
  },
  defaultVariants: { variant: 'inline' },
})

/** Title and description block. In `split` it spans the rows of the form column. */
export const newsletterSignupHeaderVariants = cva('flex flex-col gap-2', {
  variants: {
    variant: { inline: '', stacked: '', card: '', split: 'lg:col-start-1 lg:row-span-3 lg:row-start-1' },
  },
  defaultVariants: { variant: 'inline' },
})

/** Form, error and status messages: the right column of `split` when there is a heading block on the left. */
export const newsletterSignupSideVariants = cva('', {
  variants: {
    variant: { inline: '', stacked: '', card: '', split: '' },
    header: { true: '', false: '' },
  },
  compoundVariants: [{ variant: 'split', header: true, class: 'lg:col-start-2' }],
  defaultVariants: { variant: 'inline', header: false },
})

export const newsletterSignupTitleVariants = cva('text-balance font-semibold tracking-tight', {
  variants: { size: { sm: 'text-lg sm:text-xl', md: 'text-xl sm:text-2xl', lg: 'text-2xl sm:text-3xl' } },
  defaultVariants: { size: 'md' },
})

export const newsletterSignupDescriptionVariants = cva('text-pretty text-muted-foreground', {
  variants: { size: { sm: 'text-sm', md: 'text-sm sm:text-base', lg: 'text-base sm:text-lg' } },
  defaultVariants: { size: 'md' },
})

/**
 * The email field. The shape changes the radius only: the field keeps its border, its 16px text and its focus ring.
 * `pill` also widens the inline padding so text stays off the curve.
 */
export const newsletterSignupFieldVariants = cva('min-w-0 text-start', {
  variants: {
    /** Row layouts let the field grow; a column keeps its own height (a grown field collapses to its content). */
    variant: { inline: 'flex-1', stacked: '', card: '', split: 'flex-1' },
    size: { sm: '', md: '', lg: 'h-12' },
    shape: { rounded: '', pill: 'rounded-full px-5', square: 'rounded-none' },
  },
  defaultVariants: { variant: 'inline', size: 'md', shape: 'rounded' },
})

/** The submit button (the shape is the Button `rounded` prop). */
export const newsletterSignupButtonVariants = cva('shrink-0', {
  variants: { size: { sm: '', md: '', lg: 'h-12' } },
  defaultVariants: { size: 'md' },
})

export type NewsletterSignupVariants = VariantProps<typeof newsletterSignupVariants>
export type NewsletterSignupVariant = NonNullable<NewsletterSignupVariants['variant']>
export type NewsletterSignupSize = NonNullable<NewsletterSignupVariants['size']>
export type NewsletterSignupShape = NonNullable<VariantProps<typeof newsletterSignupFieldVariants>['shape']>
export type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error'

export const NEWSLETTER_VARIANTS: readonly NewsletterSignupVariant[] = ['inline', 'stacked', 'card', 'split']
export const NEWSLETTER_SIZES: readonly NewsletterSignupSize[] = ['sm', 'md', 'lg']
export const NEWSLETTER_SHAPES: readonly NewsletterSignupShape[] = ['rounded', 'pill', 'square']
export const NEWSLETTER_STATUSES: readonly NewsletterStatus[] = ['idle', 'loading', 'success', 'error']

/**
 * Size to control size. `md` keeps the original `lg` controls (44px); `sm` steps down to the `md` controls (36px; both have a 44px
 * minimum on touch pointers and 16px text on small screens); `lg` keeps the `lg` controls and adds `h-12`.
 */
export const NEWSLETTER_CONTROL_SIZES = { sm: 'md', md: 'lg', lg: 'lg' } as const
/** Shape to the Button `rounded` prop. */
export const NEWSLETTER_BUTTON_ROUNDED = { rounded: 'default', pill: 'full', square: 'none' } as const
