import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Text for a visually hidden `role="status"` element. Setting the same message twice in a row is
 * announced twice: the text is cleared first and written again on the next tick.
 */
export function useAnnouncer() {
  const message = ref('')
  let alive = true
  onBeforeUnmount(() => (alive = false))
  function announce(text: string) {
    message.value = ''
    void nextTick(() => {
      if (alive) message.value = text
    })
  }
  function clear() {
    message.value = ''
  }
  return { message, announce, clear }
}

/**
 * Id of the `<label for="id">` a surrounding `Field` renders. A native label cannot name a non-labelable
 * element (span, div), so the caller points `aria-labelledby` at the returned id. Assigns an id to the label
 * when it has none. Resolves after mount, because the label is rendered before the control.
 */
export function useFieldLabelId(controlId: () => string | undefined, host: Ref<HTMLElement | null>) {
  const labelId = ref<string>()
  onMounted(() => {
    const id = controlId()
    const el = host.value
    if (!id || !el) return
    const scope = el.getRootNode() as ParentNode
    const label = Array.from(scope.querySelectorAll('label[for]')).find((l) => l.getAttribute('for') === id)
    if (!label) return
    if (!label.id) label.id = `${id}-label`
    labelId.value = label.id
  })
  return labelId
}
