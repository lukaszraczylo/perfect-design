/**
 * Contract enforcement: things a component documents as REQUIRED (a DialogTitle inside a dialog, a name on an icon-only
 * button, a legend on a fieldset...) fail loudly when they are missing, instead of shipping an inaccessible or broken
 * control that nobody notices.
 *
 * How it surfaces: the checks run in `onMounted`, and Vue re-throws unhandled errors from lifecycle hooks in development
 * (and logs them in production, where a mounted hook can never take the page down). Apps can route them with
 * `app.config.errorHandler`. Control the behaviour with `configureStrictMode`:
 *   'throw' (default)  throw a ContractError
 *   'warn'             console.error the message, do not throw
 *   'off'              do nothing (the unit tests of individual components use this so they can mount partial trees)
 */
import { defineComponent, inject, nextTick, onBeforeUnmount, onMounted, provide, type InjectionKey } from 'vue'

export type StrictMode = 'throw' | 'warn' | 'off'

/** Thrown (or logged) when a documented requirement of a component is not met. `message` says what to add. */
export class ContractError extends Error {
  readonly component: string
  readonly rule: string
  constructor(component: string, rule: string, message: string) {
    super(`[perfect-design] ${component}: ${message}`)
    this.name = 'ContractError'
    this.component = component
    this.rule = rule
  }
}

let mode: StrictMode = 'throw'
export const configureStrictMode = (next: StrictMode) => {
  mode = next
}
export const getStrictMode = (): StrictMode => mode

/** Report a broken requirement according to the current strict mode. */
export function violation(component: string, rule: string, message: string): void {
  if (mode === 'off') return
  const error = new ContractError(component, rule, message)
  if (mode === 'warn') {
    console.error(error.message)
    return
  }
  throw error
}

/* ------------------------------------------------------------------ required parts (compound components) */

interface PartRegistry {
  register(part: string): void
  unregister(part: string): void
  has(part: string): boolean
}

const keys = new Map<string, InjectionKey<PartRegistry>>()
const keyFor = (owner: string): InjectionKey<PartRegistry> => {
  let key = keys.get(owner)
  if (!key) keys.set(owner, (key = Symbol(`pd:parts:${owner}`) as InjectionKey<PartRegistry>))
  return key
}

export interface RequiredPart {
  /** Component name of the part, e.g. `DialogTitle`. */
  part: string
  /** Attributes on the owner that satisfy the requirement instead of the part, e.g. `['aria-label', 'aria-labelledby']`. */
  orAttrs?: string[]
  /** What to do when it is missing; appended to the message. */
  hint?: string
}

interface CheckableRegistry extends PartRegistry {
  check(): void
}

/**
 * In the owner component (`DialogContent`): declare which parts must be rendered somewhere inside it, then render
 * `<RequiredPartsProbe owner="DialogContent" />` INSIDE the content that is only mounted when the owner is really shown
 * (a closed dialog renders nothing and must not be checked). Pass `attrs` (from `useAttrs()`) when an attribute can stand
 * in for a part.
 */
export function useRequiredParts(owner: string, required: RequiredPart[], attrs?: Record<string, unknown>) {
  const present = new Map<string, number>()
  const registry: CheckableRegistry = {
    register: (p) => present.set(p, (present.get(p) ?? 0) + 1),
    unregister: (p) => present.set(p, Math.max(0, (present.get(p) ?? 1) - 1)),
    has: (p) => (present.get(p) ?? 0) > 0,
    check() {
      for (const r of required) {
        if (registry.has(r.part)) continue
        if (r.orAttrs?.some((a) => attrs && attrs[a] !== undefined && attrs[a] !== '')) continue
        const alt = r.orAttrs?.length ? ` (or set ${r.orAttrs.map((a) => `\`${a}\``).join(' / ')} on ${owner})` : ''
        violation(owner, `requires-${r.part}`, `requires a ${r.part}${alt}.${r.hint ? ` ${r.hint}` : ''}`)
      }
    },
  }
  provide(keyFor(owner), registry)
  return registry
}

/** Renders nothing. Mount it inside the owner's real content; once the DOM has settled it runs the owner's checks. */
export const RequiredPartsProbe = defineComponent({
  name: 'RequiredPartsProbe',
  props: { owner: { type: String, required: true } },
  setup(props) {
    const registry = inject(keyFor(props.owner), null) as CheckableRegistry | null
    onMounted(async () => {
      // Headless libraries (reka-ui Presence) render slots a tick after their parent; wait for the tree to settle.
      // An async hook's rejection is still routed through Vue's error handling.
      await nextTick()
      await nextTick()
      registry?.check()
    })
    return () => null
  },
})

/** In the part (`DialogTitle`): tell the nearest owner that it is present. Safe to call outside an owner. */
export function useRegisterPart(owner: string, part: string) {
  const registry = inject(keyFor(owner), null)
  if (!registry) return
  registry.register(part)
  onBeforeUnmount(() => registry.unregister(part))
}

/* ------------------------------------------------------------------ props */

/** A required string prop that must be present and not blank. */
export function requireText(component: string, prop: string, value: unknown, hint = ''): void {
  if (typeof value !== 'string' || value.trim() === '') {
    violation(component, `requires-${prop}`, `requires a non-empty \`${prop}\`.${hint ? ` ${hint}` : ''}`)
  }
}

/** Require at least one of several props/attributes to be set (e.g. `label` or `aria-label`). */
export function requireOneOf(component: string, values: Record<string, unknown>, hint = ''): void {
  const ok = Object.values(values).some((v) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== false))
  if (!ok) violation(component, `requires-${Object.keys(values).join('-or-')}`, `requires ${Object.keys(values).map((k) => `\`${k}\``).join(' or ')}.${hint ? ` ${hint}` : ''}`)
}

/* ------------------------------------------------------------------ accessible name */

const textOf = (el: Element): string => {
  let out = ''
  for (const node of el.childNodes) {
    if (node.nodeType === 3) out += node.textContent ?? ''
    else if (node.nodeType === 1) {
      const e = node as Element
      if (e.getAttribute('aria-hidden') === 'true' || e.hasAttribute('hidden')) continue
      if (e.matches('img')) out += e.getAttribute('alt') ?? ''
      else out += textOf(e)
    }
  }
  return out.replace(/\s+/g, ' ').trim()
}

const NAME_FROM_CONTENT = new Set(['button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'switch', 'checkbox', 'radio', 'heading', 'cell', 'treeitem'])

/**
 * A pragmatic accessible-name check (aria-label, aria-labelledby, associated <label>, text content for roles that take
 * their name from content, alt on images). Good enough to catch "no name at all", which is the failure that matters.
 * Returns the name found ('' when none).
 */
export function accessibleName(el: Element): string {
  const label = el.getAttribute('aria-label')?.trim()
  if (label) return label
  const by = el.getAttribute('aria-labelledby')
  if (by) {
    const text = by.split(/\s+/).map((id) => el.ownerDocument.getElementById(id)).filter((n): n is HTMLElement => !!n).map((n) => textOf(n) || n.getAttribute('aria-label') || '').join(' ').trim()
    if (text) return text
  }
  const labels = (el as HTMLInputElement).labels
  if (labels && labels.length) {
    const text = [...labels].map((l) => textOf(l)).join(' ').trim()
    if (text) return text
  }
  if (el.matches('img')) return el.getAttribute('alt')?.trim() ?? ''
  if (el.matches('input[type=button],input[type=submit],input[type=reset]')) return (el as HTMLInputElement).value
  const role = el.getAttribute('role') ?? el.localName
  if (NAME_FROM_CONTENT.has(role) || el.matches('button,a[href],summary')) return textOf(el)
  return ''
}

/** In a component: the element must have an accessible name once mounted. `el` is a getter so refs work. */
export function useRequireAccessibleName(component: string, el: () => Element | null | undefined, hint = '', when: () => boolean = () => true) {
  onMounted(async () => {
    await nextTick()
    const node = el()
    if (!node || !when()) return
    if (!accessibleName(node)) {
      violation(component, 'requires-accessible-name', `needs an accessible name. ${hint || 'Provide visible text, `aria-label`, `aria-labelledby`, or wrap the control in `Field` with a label.'}`)
    }
  })
}
