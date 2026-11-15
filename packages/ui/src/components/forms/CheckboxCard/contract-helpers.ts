/**
 * Contract helpers shared by the choice controls of the forms group (cards, segmented control, comboboxes).
 * Everything here reports through `violation` from a mounted hook, never during setup or render.
 */
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { accessibleName, useRequireAccessibleName, violation } from '../../../lib/contract'

/**
 * Option values must be non-empty, unique strings: an empty value usually means "nothing selected", and a repeated
 * value selects both entries at once. Reports the first problem found.
 */
export function checkOptionValues(component: string, noun: string, values: unknown[]): void {
  const seen = new Set<string>()
  for (const v of values) {
    if (typeof v !== 'string' || v.trim() === '') {
      violation(component, 'requires-value', `requires a non-empty string \`value\` on every ${noun}. Give each ${noun} its own value (an empty value is reserved for "nothing selected").`)
      return
    }
    if (seen.has(v)) {
      violation(component, 'unique-value', `requires a unique \`value\` on every ${noun}, but "${v}" is used more than once. Give each ${noun} its own value.`)
      return
    }
    seen.add(v)
  }
}

/** True when an ancestor `fieldset` (or a named `role=group`) already names the group, e.g. `Fieldset` with a legend. */
function namedByAncestor(el: Element | null | undefined): boolean {
  const group = el?.parentElement?.closest('fieldset,[role=group]')
  if (!group) return false
  return !!accessibleName(group) || !!group.querySelector(':scope > legend')?.textContent?.trim()
}

/**
 * A group control (radiogroup, group) needs a name from a Field label, `aria-label`, `aria-labelledby`, or a surrounding
 * `Fieldset` legend. `el` is a getter so component refs work.
 */
export function useRequireGroupName(component: string, el: () => Element | null | undefined, hint: string): void {
  useRequireAccessibleName(component, el, hint, () => !namedByAncestor(el()))
}

/**
 * Like `useRequireAccessibleName`, for a button-like control that shows its own value or placeholder (a select trigger):
 * that text is not a name, so only `aria-label`, `aria-labelledby` and `<label>` (Field, `for`, wrapping) count.
 */
export function useRequireControlName(component: string, el: () => Element | null | undefined, hint: string): void {
  onMounted(async () => {
    await nextTick()
    const node = el()
    if (!node) return
    const by = node.getAttribute('aria-labelledby')?.split(/\s+/) ?? []
    const named =
      !!node.getAttribute('aria-label')?.trim() ||
      by.some((id) => node.ownerDocument.getElementById(id)?.textContent?.trim()) ||
      [...((node as HTMLButtonElement).labels ?? [])].some((l) => l.textContent?.trim())
    if (!named) violation(component, 'requires-accessible-name', `needs an accessible name. ${hint}`)
  })
}

export interface ValueClaim {
  /** True when an earlier sibling already claimed the same value (only the later one reports). */
  duplicate(): boolean
  release(): void
}

/** Registry a card group provides so its cards can detect duplicate values. */
export function createValueRegistry() {
  const claims = new Map<string, symbol[]>()
  return {
    claim(value: string): ValueClaim {
      const token = Symbol(value)
      let released = false
      claims.set(value, [...(claims.get(value) ?? []), token])
      return {
        duplicate: () => !released && claims.get(value)![0] !== token,
        release() {
          released = true
          const rest = (claims.get(value) ?? []).filter((t) => t !== token)
          if (rest.length) claims.set(value, rest)
          else claims.delete(value)
        },
      }
    },
  }
}

/** In a card inside a group: the `value` must be a non-empty string, unique among the group's cards. */
export function useGroupedCardValue(component: string, groupName: string, group: { claim(value: string): ValueClaim } | null, value: () => unknown): void {
  let claim: ValueClaim | undefined
  onMounted(async () => {
    if (!group) return
    const v = value()
    if (typeof v !== 'string' || v.trim() === '') {
      violation(component, 'requires-value', `requires a non-empty string \`value\` inside ${groupName}. Without it the card is not part of the group's \`v-model\`; give each card its own value.`)
      return
    }
    // Sibling cards claim their value in their own mounted hook, so after a tick every claim is in.
    claim = group.claim(v)
    await nextTick()
    if (claim.duplicate()) {
      violation(component, 'unique-value', `requires a unique \`value\` inside ${groupName}, but "${v}" is used by another card. Give each card its own value.`)
    }
  })
  onBeforeUnmount(() => claim?.release())
}
