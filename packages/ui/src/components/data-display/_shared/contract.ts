/**
 * Helpers for the data-display contract checks. The checks themselves use `violation` / `requireText` / `requireOneOf`
 * from `lib/contract`; these only cover timing and a few shared predicates.
 */
import { nextTick, onMounted, watch, type WatchSource } from 'vue'
import { getStrictMode } from '../../../lib/contract'

/**
 * Run `check` once the DOM has settled after mount (an async mounted hook: Vue routes its errors to the error handler
 * and never throws during setup or render). Pass `sources` for data that arrives later (rows, items): the check then
 * also runs after every change of those sources.
 */
export function useMountedCheck(check: () => void, sources: WatchSource[] = []): void {
  // Strict mode 'off' makes every check a no-op, so skip the (DOM-walking) work too.
  const run = () => {
    if (getStrictMode() !== 'off') check()
  }
  onMounted(async () => {
    await nextTick()
    run()
  })
  if (sources.length > 0) watch(sources, run, { flush: 'post' })
}

/** True for a string with visible characters. */
export const hasText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Flatten a Vue `class` value (string, array, object) into one string. */
export function classText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(classText).join(' ')
  if (value && typeof value === 'object') return Object.entries(value).filter(([, on]) => on).map(([k]) => k).join(' ')
  return ''
}

/** An `aria-label` / `aria-labelledby` attribute with a value. */
export const hasAriaName = (attrs: Record<string, unknown>): boolean => hasText(attrs['aria-label']) || hasText(attrs['aria-labelledby'])
