/**
 * Pure number formatting for `FormattedNumber`. Never throws: every invalid input has a documented fallback.
 * No component or DOM access, so it is safe in SSR, workers and plain scripts.
 */
export const numberFormatStyles = ['decimal', 'percent', 'currency', 'unit', 'compact'] as const
export const numberNotations = ['standard', 'compact', 'scientific', 'engineering'] as const
export const numberSignDisplays = ['auto', 'always', 'never', 'exceptZero', 'negative'] as const

export type NumberFormatStyle = (typeof numberFormatStyles)[number]
export type NumberNotation = (typeof numberNotations)[number]
export type NumberSignDisplay = (typeof numberSignDisplays)[number]
export type NumberFormatInput = number | bigint | string | null | undefined

export interface FormatNumberOptions {
  /** `decimal` (default), `percent` (0.25 is 25%), `currency` (needs `currency`), `unit` (needs `unit`) or `compact` (decimal style with compact notation). */
  style?: NumberFormatStyle
  /** ISO 4217 code such as `EUR`. Three letters; case is normalised. */
  currency?: string
  /** Sanctioned Intl unit such as `kilometer` or `kilometer-per-hour`. */
  unit?: string
  /** Notation. When omitted it is `compact` for `style: 'compact'` and `standard` otherwise. */
  notation?: NumberNotation
  /** 0 to 20. Out-of-range values are clamped, non-numbers ignored. */
  minimumFractionDigits?: number
  /** 0 to 20. Raised to `minimumFractionDigits` when smaller. */
  maximumFractionDigits?: number
  signDisplay?: NumberSignDisplay
  /** BCP 47 tag. Defaults to `en` (never the runtime locale, so server and client output are identical). */
  locale?: string
  /** Text returned when `value` is not a finite number. */
  fallback?: string
}

export const DEFAULT_NUMBER_LOCALE = 'en'
export const DEFAULT_NUMBER_FALLBACK = 'n/a'
export const MAX_FRACTION_DIGITS = 20

const NUMERIC = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/
const CURRENCY = /^[A-Za-z]{3}$/
const UNIT_TEXT = /^[A-Za-z][A-Za-z-]{0,39}$/

/** The value as something `Intl.NumberFormat` can format exactly, or `null` when it is not a finite number. */
export function toFormattable(value: unknown): number | bigint | string | null {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return Number.isFinite(value) ? (Object.is(value, -0) ? 0 : value) : null
  if (typeof value === 'string') {
    const s = value.trim()
    if (!NUMERIC.test(s) || !Number.isFinite(Number(s))) return null
    return s
  }
  return null
}

const asStyle = (s: unknown): NumberFormatStyle => (numberFormatStyles as readonly unknown[]).includes(s) ? (s as NumberFormatStyle) : 'decimal'
const asNotation = (s: unknown): NumberNotation | undefined => (numberNotations as readonly unknown[]).includes(s) ? (s as NumberNotation) : undefined
const asSign = (s: unknown): NumberSignDisplay | undefined => (numberSignDisplays as readonly unknown[]).includes(s) ? (s as NumberSignDisplay) : undefined

function digits(n: unknown): number | undefined {
  const v = typeof n === 'string' && n.trim() !== '' ? Number(n) : n
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  return Math.min(MAX_FRACTION_DIGITS, Math.max(0, Math.trunc(v)))
}

/** Whether `style` is one of the five documented format styles. */
export const isNumberFormatStyle = (s: unknown): s is NumberFormatStyle => (numberFormatStyles as readonly unknown[]).includes(s)

/** Valid, upper-cased ISO 4217-shaped code, else `undefined`. */
export const normalizeCurrency = (c: unknown): string | undefined => (typeof c === 'string' && CURRENCY.test(c.trim()) ? c.trim().toUpperCase() : undefined)

/** `Intl.NumberFormatOptions` for the given options, with every invalid or incomplete choice repaired. */
export function buildNumberFormatOptions(options: FormatNumberOptions = {}): Intl.NumberFormatOptions {
  let style = asStyle(options.style)
  const out: Intl.NumberFormatOptions = {}
  const notation = asNotation(options.notation)
  if (style === 'compact') {
    style = 'decimal'
    out.notation = notation ?? 'compact'
  } else if (notation) out.notation = notation

  const currency = normalizeCurrency(options.currency)
  const unit = typeof options.unit === 'string' ? options.unit.trim() : ''
  if (style === 'currency' && !currency) style = 'decimal'
  if (style === 'unit' && !unit) style = 'decimal'
  out.style = style
  if (style === 'currency') out.currency = currency
  if (style === 'unit') out.unit = unit

  const min = digits(options.minimumFractionDigits)
  let max = digits(options.maximumFractionDigits)
  if (min !== undefined) out.minimumFractionDigits = min
  if (max !== undefined) {
    if (min !== undefined && max < min) max = min
    out.maximumFractionDigits = max
  }
  const sign = asSign(options.signDisplay)
  // `Intl.NumberFormatOptions['signDisplay']` is `keyof NumberFormatOptionsSignDisplayRegistry`, a mapped type the
  // `NumberSignDisplay` union does not match directly even though the values are the same strings.
  if (sign) out.signDisplay = sign as Intl.NumberFormatOptions['signDisplay']
  return out
}

const cache = new Map<string, Intl.NumberFormat>()

function formatter(locale: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat | null {
  const key = `${locale}|${JSON.stringify(opts)}`
  let f = cache.get(key)
  if (f) return f
  try {
    f = new Intl.NumberFormat(locale, opts)
  } catch {
    return null
  }
  if (cache.size >= 200) cache.clear()
  cache.set(key, f)
  return f
}

/** Resolve a usable locale: the canonical form of the given tag when it is well formed, else `en`. */
export function resolveNumberLocale(locale: unknown): string {
  if (typeof locale !== 'string' || !locale.trim()) return DEFAULT_NUMBER_LOCALE
  try {
    return Intl.getCanonicalLocales(locale.trim())[0] ?? DEFAULT_NUMBER_LOCALE
  } catch {
    return DEFAULT_NUMBER_LOCALE
  }
}

/** Plain-decimal fallback used when the requested options are rejected by the runtime (for example an unknown unit). */
function plain(formattable: number | bigint | string, locale: string, opts: Intl.NumberFormatOptions): string {
  const { notation, minimumFractionDigits, maximumFractionDigits } = opts
  const base: Intl.NumberFormatOptions = { notation, minimumFractionDigits, maximumFractionDigits }
  const f = formatter(locale, base) ?? formatter(locale, {}) ?? formatter('en', {})
  return f ? f.format(formattable as number) : String(formattable)
}

/**
 * Format `value` with `Intl.NumberFormat`. Returns `options.fallback` (default `n/a`) for anything that is not a finite
 * number (NaN, Infinity, blank, non-numeric strings, objects). Bigints and numeric strings are formatted exactly.
 * A currency style without a valid `currency`, a unit style without `unit`, a bad locale, a bad currency code and
 * out-of-range fraction digits never throw: see `buildNumberFormatOptions` for the repairs. An unknown unit renders the
 * plain number followed by the unit text.
 */
export function formatNumber(value: NumberFormatInput | unknown, options: FormatNumberOptions = {}): string {
  const fallback = options.fallback ?? DEFAULT_NUMBER_FALLBACK
  const formattable = toFormattable(value)
  if (formattable === null) return fallback
  const locale = resolveNumberLocale(options.locale)
  const opts = buildNumberFormatOptions(options)
  const f = formatter(locale, opts)
  if (f) return f.format(formattable as number)
  // The runtime rejected the combination (unknown unit, signDisplay unsupported on an old engine...).
  if (opts.style === 'unit' && opts.unit && UNIT_TEXT.test(opts.unit)) return `${plain(formattable, locale, opts)} ${opts.unit}`
  const { signDisplay: _drop, ...rest } = opts
  const retry = formatter(locale, rest)
  return retry ? retry.format(formattable as number) : plain(formattable, locale, opts)
}
