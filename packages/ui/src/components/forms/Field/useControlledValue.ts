import { nextTick, watch, type Ref, type WatchSource } from 'vue'

/**
 * Returns a function to call after emitting `update:modelValue`. When the parent keeps the old value (it rejected
 * the change), the local value snaps back to the prop on the next tick. Does nothing while `modelValue` is
 * `undefined` (uncontrolled use).
 */
export function useRejectableModel<T extends string | number>(prop: () => T | null | undefined, model: Ref<T>, empty: T) {
  return function settle() {
    void nextTick(() => {
      const value = prop()
      if (value === undefined) return
      const next = value ?? empty
      if (String(next) !== String(model.value)) model.value = next
    })
  }
}

type TextControl = HTMLInputElement | HTMLTextAreaElement

/** Keeps focus and the selection when `source` changes and the framework replaces the control's element. */
export function usePreserveFocus(el: Ref<TextControl | null | undefined>, source: WatchSource) {
  let saved: { start: number | null; end: number | null; direction: 'forward' | 'backward' | 'none' | null } | null = null
  watch(
    source,
    () => {
      const node = el.value
      saved = node && document.activeElement === node ? { start: node.selectionStart, end: node.selectionEnd, direction: node.selectionDirection } : null
    },
    { flush: 'pre' },
  )
  watch(
    source,
    () => {
      const state = saved
      saved = null
      const node = el.value
      if (!state || !node) return
      node.focus()
      try {
        if (state.start !== null && state.end !== null) node.setSelectionRange(state.start, state.end, state.direction ?? undefined)
      } catch {
        /* input types without a selection (number, email) */
      }
    },
    { flush: 'post' },
  )
}
