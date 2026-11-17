/** Key suffixes for the plural categories of `Intl.PluralRules`. The bare key holds the `other` form. */
export const PLURAL_SUFFIXES = ['Zero', 'One', 'Two', 'Few', 'Many'] as const

export type PluralSuffix = (typeof PLURAL_SUFFIXES)[number]

/** A labels shape with a required `other` form under `K` and optional forms for the other plural categories. */
export type PluralLabel<K extends string> = { [P in K]: string } & { [P in `${K}${PluralSuffix}`]?: string }

/** The bare key and every category key of one plural label. */
export function pluralKeys(name: string): string[] {
  return [name, ...PLURAL_SUFFIXES.map((suffix) => `${name}${suffix}`)]
}

function category(count: number, locale?: string): string {
  try {
    return new Intl.PluralRules(locale).select(count)
  } catch {
    return new Intl.PluralRules('en').select(count)
  }
}

function formatValue(value: string | number, locale?: string): string {
  if (typeof value !== 'number') return value
  try {
    return new Intl.NumberFormat(locale).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Overlays `override` on `base` per key, except plural labels: when `override` sets any form of a name in `plurals`,
 * it replaces every category form of that name, so a translated `results` never mixes with an English `resultsOne`.
 * The bare (`other`) key keeps the base value only when the override omits it. Blank override values are skipped.
 */
export function mergeLabels<T extends Record<string, string | undefined>>(base: T, override: Record<string, string | undefined> | undefined, plurals: readonly string[] = []): T & Record<string, string | undefined> {
  const out: Record<string, string | undefined> = { ...base }
  if (!override) return out as T & Record<string, string | undefined>
  const given = (key: string) => typeof override[key] === 'string' && override[key]!.trim() !== ''
  for (const name of plurals) {
    const keys = pluralKeys(name)
    if (keys.some(given)) for (const key of keys) out[key] = given(key) ? override[key] : key === name ? base[key] : undefined
  }
  const grouped = new Set(plurals.flatMap(pluralKeys))
  for (const key of Object.keys(override)) if (!grouped.has(key) && given(key)) out[key] = override[key]
  return out as T & Record<string, string | undefined>
}

/** Replaces each `{name}` in `template` with its value; numbers are formatted for `locale`. Unknown names stay. */
export function fillTemplate(template: string, values: Record<string, string | number>, locale?: string): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? formatValue(values[name]!, locale) : match))
}

/**
 * Text of a plural label for `count`: the form for the locale's plural category (`resultsOne`, `resultsFew`), else the
 * `other` form under the bare key. `{count}` and any `values` are filled in.
 */
export function pluralText(labels: Record<string, string | undefined>, name: string, count: number, locale?: string, values: Record<string, string | number> = {}): string {
  const cat = category(count, locale)
  const suffix = cat === 'other' ? '' : cat.charAt(0).toUpperCase() + cat.slice(1)
  const own = labels[`${name}${suffix}`]
  const template = own && own.trim() ? own : (labels[name] ?? '')
  return fillTemplate(template, { ...values, count }, locale)
}
