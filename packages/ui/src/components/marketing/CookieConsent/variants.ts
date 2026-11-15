import { cva, type VariantProps } from '../../../lib/cva'

/**
 * Root of the `banner` and `inline` looks. `banner` is a full-width bar (place it with `class`, e.g. `fixed inset-x-0 bottom-0`);
 * `inline` is a bordered card inside the page. `modal` renders inside a Dialog, so its root adds no surface of its own.
 */
export const cookieConsentVariants = cva('', {
  variants: {
    variant: {
      banner: 'flex w-full flex-col gap-4 border-y bg-card p-4 text-card-foreground sm:p-6',
      inline: 'flex w-full flex-col gap-5 rounded-lg border bg-card p-4 text-card-foreground sm:p-6',
      modal: 'flex flex-col gap-5',
    },
  },
  defaultVariants: { variant: 'banner' },
})

/** The three action buttons: stacked below `sm`, one wrapping row from `sm`. */
export const cookieConsentActionsVariants = cva('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center')

export type CookieConsentVariants = VariantProps<typeof cookieConsentVariants>
export type CookieConsentVariant = NonNullable<CookieConsentVariants['variant']>
export const COOKIE_CONSENT_VARIANTS: readonly CookieConsentVariant[] = ['banner', 'modal', 'inline']
