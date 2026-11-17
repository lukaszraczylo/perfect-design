import { formatNumber, normalizeCurrency, resolveNumberLocale } from '../FormattedNumber/format'

export const DEFAULT_PRICE_CURRENCY = 'USD'
export const DEFAULT_PRICE_LOCALE = 'en-US'
export const DEFAULT_PRICE_FALLBACK = '—'
export const MAX_PRICE_DIGITS = 6

export interface FormatPriceOptions {
  /** ISO 4217 code. Invalid codes render a plain number. Default `USD`. */
  currency?: string
  /** BCP 47 tag. Default `en-US`, never the runtime locale. */
  locale?: string
  notation?: 'standard' | 'compact'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** Text for an amount of exactly 0. Unset formats the zero. */
  freeLabel?: string
  /** Text for null, undefined, NaN and Infinity. */
  fallback?: string
}

/** Whether `amount` can be shown as a price (a finite number). */
export const isPriceAmount = (amount: unknown): amount is number => typeof amount === 'number' && Number.isFinite(amount)

/**
 * Fewest fraction digits (between `min` and `max`) that show `amount` exactly, for metered rates such as 0.0004.
 * Falls back to `max` when the amount needs more.
 */
export function significantFractionDigits(amount: number, min = 2, max = MAX_PRICE_DIGITS): number {
  if (!Number.isFinite(amount)) return min
  for (let d = min; d < max; d++) if (Number(amount.toFixed(d)) === amount) return d
  return max
}

/** The locale `Price` actually uses for `locale`: well-formed tag, else `en-US`. */
export const resolvePriceLocale = (locale: unknown): string =>
  typeof locale === 'string' && locale.trim() ? resolveNumberLocale(locale) : DEFAULT_PRICE_LOCALE

function digitsFor(amount: number, o: FormatPriceOptions): Pick<Intl.NumberFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> {
  const hasMin = typeof o.minimumFractionDigits === 'number' && Number.isFinite(o.minimumFractionDigits)
  const hasMax = typeof o.maximumFractionDigits === 'number' && Number.isFinite(o.maximumFractionDigits)
  if (o.notation === 'compact' && !hasMin && !hasMax) return {}
  const base = Number.isInteger(amount) ? 0 : 2
  const min = hasMin ? o.minimumFractionDigits! : hasMax ? Math.min(base, Math.max(0, Math.trunc(o.maximumFractionDigits!))) : base
  const max = hasMax ? o.maximumFractionDigits! : Math.max(base, min)
  return { minimumFractionDigits: min, maximumFractionDigits: max }
}

/**
 * Format a price with `Intl.NumberFormat`. Never throws: an invalid amount returns `fallback`, an invalid currency
 * renders a plain number, a bad locale falls back to `en-US`. Whole amounts show no fraction digits, others show 2,
 * unless digits are given.
 */
export function formatPrice(amount: number | null | undefined, options: FormatPriceOptions = {}): string {
  const fallback = options.fallback ?? DEFAULT_PRICE_FALLBACK
  if (!isPriceAmount(amount)) return fallback
  if (amount === 0 && options.freeLabel) return options.freeLabel
  const code = normalizeCurrency(options.currency ?? DEFAULT_PRICE_CURRENCY)
  return formatNumber(amount, {
    style: code ? 'currency' : 'decimal',
    currency: code,
    locale: resolvePriceLocale(options.locale),
    notation: options.notation === 'compact' ? 'compact' : undefined,
    ...digitsFor(amount, options),
    fallback,
  })
}
