import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { Size } from '../../../lib/types'

/** Text direction: `auto` lets the browser pick from the first strong character of the content. */
export type ConfigDir = 'ltr' | 'rtl' | 'auto'
/** `user` follows the operating system; `reduce` and `no-preference` override it for components that ask. */
export type ConfigReducedMotion = 'user' | 'reduce' | 'no-preference'
export type ConfigDensity = 'default' | 'compact' | 'comfortable'

export const CONFIG_DIRS: readonly ConfigDir[] = ['ltr', 'rtl', 'auto']
export const CONFIG_REDUCED_MOTION: readonly ConfigReducedMotion[] = ['user', 'reduce', 'no-preference']
export const CONFIG_SIZES: readonly Size[] = ['xs', 'sm', 'md', 'lg', 'xl']
export const CONFIG_DENSITIES: readonly ConfigDensity[] = ['default', 'compact', 'comfortable']

/** Built-in strings a provider can translate. Keys are `<component>.<string>`. */
export type ConfigLabelKey =
  | 'pagination.nav'
  | 'pagination.first'
  | 'pagination.previous'
  | 'pagination.next'
  | 'pagination.last'
  | 'pagination.page'
  | 'pagination.summary'
  | 'datePicker.placeholder'
  | 'datePicker.clear'
  | 'datePicker.required'
  | 'datePicker.dialog'
  | 'confirmDialog.confirm'
  | 'confirmDialog.cancel'
  | 'confirmDialog.defaultTitle'
  | 'confirmDialog.error'
  | 'link.externalHint'

export type ConfigLabels = Partial<Record<ConfigLabelKey, string>> & { [key: string]: string | undefined }

/** What a `ConfigProvider` accepts. Every field is optional; invalid values are ignored. */
export interface ConfigInput {
  dir?: ConfigDir
  locale?: string
  timeZone?: string
  reducedMotion?: ConfigReducedMotion
  size?: Size
  density?: ConfigDensity
  labels?: ConfigLabels
  blurMedia?: boolean
}

/** What `useConfig()` returns: validated values merged from every surrounding provider. */
export interface ResolvedConfig {
  readonly dir: ConfigDir | undefined
  readonly locale: string | undefined
  readonly timeZone: string | undefined
  readonly reducedMotion: ConfigReducedMotion
  readonly size: Size | undefined
  readonly density: ConfigDensity | undefined
  readonly labels: Readonly<Record<string, string>>
  readonly blurMedia?: boolean
}

const noLabels: Readonly<Record<string, string>> = Object.freeze(Object.create(null) as Record<string, string>)
const EMPTY: ResolvedConfig = Object.freeze({ dir: undefined, locale: undefined, timeZone: undefined, reducedMotion: 'user', size: undefined, density: undefined, labels: noLabels, blurMedia: undefined })
const EMPTY_REF: ComputedRef<ResolvedConfig> = computed(() => EMPTY)
const KEY: InjectionKey<ComputedRef<ResolvedConfig>> = Symbol('perfect-design-config')

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): T | undefined => (typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined)

function validLocale(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    return Intl.getCanonicalLocales(value).length ? value : undefined
  } catch {
    return undefined
  }
}

function validTimeZone(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return value
  } catch {
    return undefined
  }
}

/** Own enumerable string keys with non-blank string values. Anything else (numbers, objects, functions, HTML in a non-string) is dropped. */
function validLabels(value: unknown): Record<string, string> {
  const out: Record<string, string> = Object.create(null)
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return out
  for (const [key, text] of Object.entries(value)) {
    if (typeof text === 'string' && text.trim()) out[key] = text
  }
  return out
}

/** Keeps only valid values; the result has `undefined` for everything that was missing or invalid. */
export function sanitizeConfig(input: ConfigInput | undefined): Omit<ResolvedConfig, 'reducedMotion' | 'labels'> & { reducedMotion: ConfigReducedMotion | undefined; labels: Record<string, string> } {
  return {
    dir: oneOf(CONFIG_DIRS, input?.dir),
    locale: validLocale(input?.locale),
    timeZone: validTimeZone(input?.timeZone),
    reducedMotion: oneOf(CONFIG_REDUCED_MOTION, input?.reducedMotion),
    size: oneOf(CONFIG_SIZES, input?.size),
    density: oneOf(CONFIG_DENSITIES, input?.density),
    labels: validLabels(input?.labels),
    blurMedia: typeof input?.blurMedia === 'boolean' ? input.blurMedia : undefined,
  }
}

/** Inner overrides outer per key; labels are merged per key. */
export function mergeConfig(parent: ResolvedConfig, input: ConfigInput | undefined): ResolvedConfig {
  const own = sanitizeConfig(input)
  const labels: Record<string, string> = Object.assign(Object.create(null), parent.labels, own.labels)
  return Object.freeze({
    dir: own.dir ?? parent.dir,
    locale: own.locale ?? parent.locale,
    timeZone: own.timeZone ?? parent.timeZone,
    reducedMotion: own.reducedMotion ?? parent.reducedMotion,
    size: own.size ?? parent.size,
    density: own.density ?? parent.density,
    labels: Object.freeze(labels),
    blurMedia: own.blurMedia ?? parent.blurMedia,
  })
}

/** Used by `ConfigProvider`: merges `input` into the surrounding config and provides the result to the subtree. */
export function provideConfig(input: () => ConfigInput | undefined): ComputedRef<ResolvedConfig> {
  const parent = inject(KEY, EMPTY_REF)
  const resolved = computed(() => mergeConfig(parent.value, input()))
  provide(KEY, resolved)
  return resolved
}

/**
 * The merged config of the nearest `ConfigProvider`s. Without a provider every value is `undefined`
 * (`reducedMotion` is `'user'`, `labels` is empty), so a component keeps its own defaults.
 */
export function useConfig(): ComputedRef<ResolvedConfig> {
  return inject(KEY, EMPTY_REF)
}

/**
 * Built-in strings of one component: `defaults` overlaid by the provider's `<prefix>.<name>` labels. Only keys present
 * in `defaults` are read, so a provider cannot inject extra keys. Without a provider the result equals `defaults`.
 */
export function useConfigLabels<D extends { [K in keyof D]: string }>(prefix: string, defaults: D): ComputedRef<D> {
  const config = useConfig()
  return computed(() => {
    const out: Record<string, string> = { ...defaults }
    for (const name of Object.keys(defaults)) {
      const text = config.value.labels[`${prefix}.${name}`]
      if (text !== undefined) out[name] = text
    }
    return out as D
  })
}
