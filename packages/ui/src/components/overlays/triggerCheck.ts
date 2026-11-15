/**
 * Contract checks shared by the overlay triggers (Popover, DropdownMenu, ContextMenu, HoverCard, Tooltip): the element a
 * trigger renders must have an accessible name and, where hover or focus opens the overlay, must be reachable by keyboard.
 * Runs from `onMounted`, so a broken trigger never fails during render.
 */
import { nextTick, onMounted } from 'vue'
import { accessibleName, violation } from '../../lib/contract'

const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex],[contenteditable=""],[contenteditable="true"]'

/** Reachable with the Tab key: a native control or an element with a non-negative tabindex. */
export const isFocusable = (el: Element): boolean => el.matches(FOCUSABLE) && el.getAttribute('tabindex') !== '-1'

/** An accessible name, also accepting a labelled icon or image inside the element (`<Icon label>`, `<img alt>`) and plain text. */
export const hasName = (el: Element): boolean =>
  !!accessibleName(el) ||
  !!el.querySelector('[aria-label]:not([aria-hidden="true"]):not(:empty), img[alt]:not([alt=""]), svg[aria-label], [role="img"][aria-label]') ||
  !!el.textContent?.trim()

/** Resolve a template ref (a component instance or an element) to the element it renders. */
export function triggerElement(target: unknown): Element | null {
  const el = (target as { $el?: unknown } | null)?.$el ?? target
  return el instanceof Element ? el : null
}

export interface TriggerRules {
  /** Require a keyboard-focusable element (hover and focus triggers). */
  focusable?: boolean
  /** Require an accessible name (default true). Context menu areas are not controls, so they skip it. */
  name?: boolean
  /** Skip every check (for example a tooltip that is disabled). */
  when?: () => boolean
}

/**
 * In a trigger component: after mount, the rendered element must satisfy `rules`.
 * `target` is a getter returning the template ref of the reka trigger.
 */
export function useCheckedTrigger(component: string, target: () => unknown, hint: string, rules: TriggerRules = {}) {
  onMounted(async () => {
    await nextTick()
    if (rules.when && !rules.when()) return
    const el = triggerElement(target())
    if (!el) {
      violation(component, 'requires-trigger-element', `needs a single element to attach to, but rendered none. ${hint}`)
      return
    }
    if (rules.focusable && !isFocusable(el)) {
      violation(component, 'requires-focusable', `needs a focusable element, but \`<${el.localName}>\` cannot be reached with the keyboard. Use a button or a link with \`href\`, or add \`tabindex="0"\`.`)
    }
    if (rules.name !== false && !hasName(el)) {
      violation(component, 'requires-accessible-name', `needs an accessible name. ${hint}`)
    }
  })
}
