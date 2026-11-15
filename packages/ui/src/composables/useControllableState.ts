import { computed, ref, type Ref } from 'vue'

/**
 * Controlled/uncontrolled helper for v-model components.
 * If the parent supplies a value (not `undefined`) it is the source of truth; otherwise local state is used.
 * `getProp` must read the prop reactively; `onChange` should emit `update:modelValue`.
 */
export function useControllableState<T>(getProp: () => T | undefined, defaultValue: T, onChange: (value: T) => void): Ref<T> {
  const local = ref(defaultValue) as Ref<T>
  return computed<T>({
    get: () => {
      const p = getProp()
      return p === undefined ? local.value : p
    },
    set: (v: T) => {
      if (getProp() === undefined) local.value = v
      onChange(v)
    },
  })
}
