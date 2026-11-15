import { computed, ref, type ComputedRef, type Ref } from 'vue'

/**
 * Controlled / uncontrolled state helper. When `model()` returns `undefined` the internal value is used,
 * otherwise the parent owns the value. `notify` is called on every user change.
 */
export function useControllable<T>(model: () => T | undefined, initial: T, notify: (value: T) => void): { value: ComputedRef<T>; set: (value: T) => void } {
  const inner = ref(initial) as Ref<T>
  const value = computed<T>(() => {
    const m = model()
    return m === undefined ? inner.value : m
  })
  function set(next: T) {
    inner.value = next
    notify(next)
  }
  return { value, set }
}
