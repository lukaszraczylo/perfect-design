/**
 * Helpers shared by the navigation components for contract checks that need more than "part X is present":
 * pairing and uniqueness of values (tab triggers and contents, accordion items, menu values), listener detection and
 * the Pinia requirement. `lib/contract.ts` provides the primitives (`violation`, required parts, accessible names).
 */
import { getCurrentInstance, inject, nextTick, onBeforeUnmount, onMounted, provide, type InjectionKey } from 'vue'
import { getActivePinia } from 'pinia'
import { violation } from '../../lib/contract'

export interface RegistryEntry {
  kind: string
  /** Read lazily so a value that changes before the check is seen as it is at that moment. */
  value: () => unknown
}

interface EntryRegistry {
  add(entry: RegistryEntry): void
  remove(entry: RegistryEntry): void
}

const keys = new Map<string, InjectionKey<EntryRegistry>>()
const keyFor = (owner: string): InjectionKey<EntryRegistry> => {
  let key = keys.get(owner)
  if (!key) keys.set(owner, (key = Symbol(`pd:entries:${owner}`) as InjectionKey<EntryRegistry>))
  return key
}

/**
 * In the owner (`Tabs`): collect the entries its parts register, then run `check` once the tree has settled after mount.
 * Nothing runs when the owner was unmounted before that.
 */
export function useEntryRegistry(owner: string, check: (entries: readonly RegistryEntry[]) => void) {
  const entries: RegistryEntry[] = []
  let gone = false
  provide(keyFor(owner), {
    add: (e) => entries.push(e),
    remove: (e) => {
      const i = entries.indexOf(e)
      if (i >= 0) entries.splice(i, 1)
    },
  })
  onBeforeUnmount(() => (gone = true))
  onMounted(async () => {
    // Headless libraries render some slots a tick after their parent: let the tree settle before looking.
    await nextTick()
    await nextTick()
    if (!gone) check(entries)
  })
}

/** In a part (`TabsTrigger`): tell the nearest owner about this entry. Safe to call outside an owner; returns whether there was one. */
export function useEntry(owner: string, kind: string, value: () => unknown): boolean {
  const registry = inject(keyFor(owner), null)
  if (!registry) return false
  const entry: RegistryEntry = { kind, value }
  registry.add(entry)
  onBeforeUnmount(() => registry.remove(entry))
  return true
}

/** Values that appear more than once (blank ones are ignored). */
export function duplicates(values: readonly unknown[]): string[] {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const v of values) {
    const key = String(v)
    if (key === '') continue
    if (seen.has(key)) dup.add(key)
    seen.add(key)
  }
  return [...dup]
}

export const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

/** True when the parent passed a listener for `event` (`'navigate'` for `@navigate`, `'update:open'` for `v-model:open`). */
export function hasListener(event: string): boolean {
  const props = getCurrentInstance()?.vnode.props
  return !!props && `on${event.charAt(0).toUpperCase()}${event.slice(1)}` in props
}

/** True when the parent passed `name` (camelCase or kebab-case) as a prop or attribute, even as `undefined`. */
export function hasProp(name: string): boolean {
  const props = getCurrentInstance()?.vnode.props
  if (!props) return false
  const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return name in props || kebab in props
}

/**
 * ThemeToggle / AccentPicker read the Pinia theme store. Without an active Pinia the store throws a message that does not
 * say which component needs it: when it throws and no Pinia is installed on the app, report a ContractError first.
 * Call it inside `setup` (the store would throw there anyway). In `warn` / `off` mode the original error still propagates.
 */
export function withPinia<T>(component: string, useStore: () => T): T {
  try {
    return useStore()
  } catch (error) {
    // `piniaSymbol` is internal to Pinia and is not exported by its runtime entry; `getActivePinia` is public.
    if (!getActivePinia()) {
      violation(component, 'requires-pinia', 'requires an active Pinia instance. Install it before mounting (`app.use(createPinia())`), or call `setActivePinia(createPinia())` in tests.')
    }
    throw error
  }
}

const hasTarget = (item: { href?: unknown; to?: unknown }): boolean =>
  !isBlank(item.href) || (typeof item.to === 'string' ? !isBlank(item.to) : !!item.to && typeof item.to === 'object')

/** An item with no `href`/`to` that is not disabled can only be an action (an `@navigate` handler), so it is a button, not an anchor. */
export const isActionItem = (item: { href?: unknown; to?: unknown; disabled?: boolean }): boolean => !hasTarget(item) && !item.disabled

/**
 * SidebarNav / DocsSidebar items: each needs a label and either a target (`href` / `to`), children, or an action
 * (`hasAction`: the parent has an `@navigate` handler). Disabled items need no target.
 */
export function checkNavItems(component: string, items: readonly unknown[], where: string, hasAction: boolean): void {
  items.forEach((raw, i) => {
    const at = `${where} item ${i + 1}`
    if (!raw || typeof raw !== 'object') {
      violation(component, 'requires-item', `requires every item to be an object \`{ label, href | to }\` (${at} is not).`)
      return
    }
    const item = raw as { label?: unknown; href?: unknown; to?: unknown; disabled?: boolean; children?: unknown }
    if (typeof item.label !== 'string' || item.label.trim() === '') {
      violation(component, 'requires-label', `requires a non-empty \`label\` on every item (${at} has none). The label is the link's accessible name.`)
      return
    }
    if (Array.isArray(item.children) && item.children.length) {
      checkNavItems(component, item.children, `${at} ("${item.label}") child`, hasAction)
      return
    }
    if (isActionItem(item) && !hasAction) {
      violation(component, 'requires-target', `requires \`href\` or \`to\` on ${at} ("${item.label}"), or an \`@navigate\` handler for an item that only runs an action. An item with neither does nothing.`)
    }
  })
}
