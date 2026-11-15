import { ref, type Ref } from 'vue'

export interface Disclosure {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
  toggle: () => void
  set: (value: boolean) => void
}

/** Boolean open/close state with named actions. Pairs with `v-model:open` on Dialog, Sheet, Popover… */
export function useDisclosure(initial = false): Disclosure {
  const isOpen = ref(!!initial)
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
    toggle: () => (isOpen.value = !isOpen.value),
    set: (v: boolean) => (isOpen.value = !!v),
  }
}
