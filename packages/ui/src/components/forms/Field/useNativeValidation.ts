import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useFieldContext } from './useFieldContext'

const EVENTS = ['blur', 'change', 'input', 'invalid'] as const

/**
 * Bridges the browser's `:user-invalid` state to the surrounding `Field`: once the user has interacted with a
 * control (or a submit failed) and the native constraints fail, the browser's validation message becomes the
 * Field's error text, so `aria-invalid` and `aria-describedby` are set at the same moment the error is shown.
 * Typing never raises an error; it only clears one that is already shown. Does nothing outside a `Field`.
 */
export function useNativeValidation(el: Ref<HTMLElement | null | undefined>) {
  const field = useFieldContext()
  const failing = ref(false)

  function sync(event?: Event) {
    const node = el.value as HTMLInputElement | null | undefined
    if (!node || !field?.setNativeError) return
    if (event?.type === 'input' && !failing.value) return
    let bad = false
    try {
      bad = node.matches(':user-invalid')
    } catch {
      bad = false // selector unsupported
    }
    failing.value = bad
    field.setNativeError(bad ? node.validationMessage : '')
  }

  // Re-bind when the framework replaces the element (a root swap remounts the control).
  let bound: HTMLElement | null = null
  const unbind = () => {
    if (bound) EVENTS.forEach((name) => bound!.removeEventListener(name, sync))
    bound = null
  }
  const bind = (node: HTMLElement | null | undefined) => {
    if (node === bound) return
    unbind()
    if (node) EVENTS.forEach((name) => node.addEventListener(name, sync))
    bound = node ?? null
  }
  onMounted(() => bind(el.value))
  watch(el, bind, { flush: 'post' })
  onBeforeUnmount(() => {
    unbind()
    field?.setNativeError?.('')
  })
  return { failing }
}
