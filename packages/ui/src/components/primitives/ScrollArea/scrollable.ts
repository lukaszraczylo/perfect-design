import { onBeforeUnmount, onMounted, onUpdated, ref, type Ref } from 'vue'

/** Accepts a DOM element or a component instance (template ref on a component, e.g. a reka-ui part that exposes `viewportElement`) and returns its element. */
export function toElement(value: unknown): HTMLElement | null {
  const exposed = value && typeof value === 'object' && 'viewportElement' in value ? (value as { viewportElement: unknown }).viewportElement : undefined
  const el = exposed ?? (value && typeof value === 'object' && '$el' in value ? (value as { $el: unknown }).$el : value)
  return el instanceof HTMLElement ? el : null
}

/** True when the element's content is larger than its box on either axis (1px tolerance for sub-pixel rounding). */
export function isScrollable(el: Element): boolean {
  return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1
}

/**
 * Observes `targets()` and calls `onChange` after mount, after every update and whenever one of them (or its
 * first child) resizes. With `root`, elements added or removed under it later are picked up too. Cleans up on unmount. ResizeObserver is optional (older test DOMs).
 */
function observeTargets(targets: () => Element[], onChange: () => void, root?: () => Element | null) {
  let observer: ResizeObserver | undefined
  const attach = () => {
    observer?.disconnect()
    if (typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(onChange)
    for (const el of targets()) {
      observer.observe(el)
      if (el.firstElementChild) observer.observe(el.firstElementChild)
    }
  }
  let mutations: MutationObserver | undefined
  onMounted(() => {
    attach()
    onChange()
    const node = root?.()
    if (node && typeof MutationObserver !== 'undefined') {
      mutations = new MutationObserver(() => {
        attach()
        onChange()
      })
      mutations.observe(node, { childList: true, subtree: true })
    }
  })
  onUpdated(onChange)
  onBeforeUnmount(() => {
    observer?.disconnect()
    mutations?.disconnect()
  })
}

/**
 * Reactive "is this element scrolling" flag. A scrollable region must be reachable by keyboard
 * (WCAG 2.1.1, axe `scrollable-region-focusable`), so callers add `tabindex="0"` while it is true.
 */
export function useScrollable(el: Ref<unknown>): Ref<boolean> {
  const scrollable = ref(false)
  observeTargets(
    () => [toElement(el.value)].filter((e): e is HTMLElement => !!e),
    () => {
      const node = toElement(el.value)
      scrollable.value = !!node && isScrollable(node)
    },
  )
  return scrollable
}

const AUTO = 'data-auto-tabindex'

/**
 * Gives every matching scrolling descendant (default `pre`) `tabindex="0"` while it overflows, for content
 * the library does not render itself (Markdown, CMS HTML). Elements that already carry a `tabindex` are left alone.
 */
export function useFocusableScrollers(root: Ref<unknown>, selector = 'pre') {
  const nodes = () => Array.from(toElement(root.value)?.querySelectorAll<HTMLElement>(selector) ?? [])
  observeTargets(
    nodes,
    () => {
      for (const node of nodes()) {
        const auto = node.hasAttribute(AUTO)
        if (isScrollable(node)) {
          if (!node.hasAttribute('tabindex')) {
            node.setAttribute('tabindex', '0')
            node.setAttribute(AUTO, '')
          }
        } else if (auto) {
          node.removeAttribute('tabindex')
          node.removeAttribute(AUTO)
        }
      }
    },
    () => toElement(root.value),
  )
}
