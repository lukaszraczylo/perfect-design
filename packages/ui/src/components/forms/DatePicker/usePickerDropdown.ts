import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface PickerCalendarHandle {
  focus: () => unknown
}

export interface PickerDropdownOptions {
  /** Controlled open state (`undefined` = uncontrolled). */
  open: () => boolean | undefined
  /** False while disabled/readonly: the dropdown can neither open nor stay open. */
  canOpen: () => boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Open/close logic shared by DatePicker and DateRangePicker: absolutely positioned dropdown that closes on
 * outside pointer-down, Escape (focus returns to the trigger) and focus leaving the component, and moves focus
 * into the calendar when it opens. Document listeners exist only while open and are removed on unmount.
 */
export function usePickerDropdown(opts: PickerDropdownOptions) {
  const rootRef = ref<HTMLElement | null>(null)
  const triggerRef = ref<HTMLElement | null>(null)
  const calendarRef = ref<PickerCalendarHandle | null>(null)
  const internal = ref(false)
  const isOpen = computed(() => (opts.open() ?? internal.value) && opts.canOpen())

  function setOpen(next: boolean, restoreFocus = false) {
    if (next && !opts.canOpen()) return
    if (next === isOpen.value) return
    internal.value = next
    opts.onOpenChange(next)
    if (next) void nextTick(() => calendarRef.value?.focus())
    else if (restoreFocus) void nextTick(() => triggerRef.value?.focus())
  }

  function toggle() {
    setOpen(!isOpen.value, true)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !isOpen.value) return
    e.preventDefault()
    e.stopPropagation()
    setOpen(false, true)
  }

  function onFocusout(e: FocusEvent) {
    const next = e.relatedTarget
    if (isOpen.value && next instanceof Node && rootRef.value && !rootRef.value.contains(next)) setOpen(false)
  }

  function onDocumentPointerDown(e: Event) {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) setOpen(false)
  }
  function listen(on: boolean) {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
    if (on) document.addEventListener('pointerdown', onDocumentPointerDown, true)
  }
  // Not immediate and registered in onMounted: nothing touches `document` during SSR.
  onMounted(() => listen(isOpen.value))
  watch(isOpen, listen)
  onBeforeUnmount(() => listen(false))

  return { rootRef, triggerRef, calendarRef, isOpen, setOpen, toggle, onKeydown, onFocusout }
}
