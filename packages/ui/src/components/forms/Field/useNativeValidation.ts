import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
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

  onMounted(() => EVENTS.forEach((name) => el.value?.addEventListener(name, sync)))
  onBeforeUnmount(() => {
    EVENTS.forEach((name) => el.value?.removeEventListener(name, sync))
    field?.setNativeError?.('')
  })
  return { failing }
}
