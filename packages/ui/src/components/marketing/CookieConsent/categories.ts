/** Pure helpers behind CookieConsent: category cleaning and the three choices. No Vue, no DOM, no storage. */

export interface ConsentCategory {
  /** Stable key of the category, e.g. `analytics`. Emitted in `change`. Blank and duplicate ids are dropped. */
  id: string
  /** Name shown next to the toggle. */
  label: string
  /** Plain explanation of what the category does and what it stores. */
  description?: string
  /** Always on and locked. Cannot be switched off, by the user or through `modelValue`. */
  necessary?: boolean
}

export type ConsentAction = 'accept-all' | 'reject-all' | 'save'

export interface ConsentChoice {
  /** Which button produced the choice. */
  action: ConsentAction
  /** One boolean per category id. Necessary categories are always `true`. */
  categories: Record<string, boolean>
}

/**
 * Keep only usable categories: an object with a non-blank string `id` (first one wins on duplicates). A missing or
 * non-string label falls back to the id. Anything else (null, numbers, arrays) is ignored, so hostile data cannot throw.
 */
export function cleanCategories(input: unknown): ConsentCategory[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: ConsentCategory[] = []
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const { id, label, description, necessary } = raw as Record<string, unknown>
    if (typeof id !== 'string' || id.trim() === '' || seen.has(id)) continue
    seen.add(id)
    out.push({
      id,
      label: typeof label === 'string' && label.trim() !== '' ? label : id,
      description: typeof description === 'string' ? description : undefined,
      necessary: necessary === true,
    })
  }
  return out
}

/**
 * The toggle state for `categories`: necessary categories are `true` whatever `value` says; optional ones are `true` only when
 * `value[id] === true` (nothing is pre-ticked). Unknown keys in `value` are ignored.
 */
export function resolveChoices(categories: readonly ConsentCategory[], value?: unknown): Record<string, boolean> {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return Object.fromEntries(
    categories.map((c) => [c.id, c.necessary === true || (Object.prototype.hasOwnProperty.call(source, c.id) && source[c.id] === true)]),
  )
}

/** Build the payload of `change` for an action. `current` is only read for `save`. */
export function buildChoice(action: ConsentAction, categories: readonly ConsentCategory[], current: Record<string, boolean>): ConsentChoice {
  const state =
    action === 'accept-all'
      ? Object.fromEntries(categories.map((c) => [c.id, true]))
      : action === 'reject-all'
        ? Object.fromEntries(categories.map((c) => [c.id, c.necessary === true]))
        : resolveChoices(categories, current)
  return { action, categories: state }
}
