import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { violation } from '../../../lib/contract'
import type { AlertDialogSize, AlertDialogVariant } from '../../overlays/AlertDialog'
import type { OverlayTone } from '../../overlays/overlayTone'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** Tone of the prompt (`neutral`, `danger`, `warning`, `success`, `info`). */
  tone?: OverlayTone
  /** Panel width (`xs`, `sm`, `md`, `lg`). */
  size?: AlertDialogSize
  /** `default` or `centered`. */
  variant?: AlertDialogVariant
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number
}

export const DEFAULT_CONFIRM_TITLE = 'Are you sure?'

let counter = 0

/**
 * Promise-based confirmation queue. Mount `<ConfirmHost />` once; call `useConfirm().confirm(...)` from anywhere.
 * Concurrent requests queue up and are shown one after another.
 */
export const useConfirmStore = defineStore('pd-confirm', () => {
  const queue = ref<ConfirmRequest[]>([])
  /** Number of mounted `ConfirmHost`s. Without one, `confirm()` can never settle. */
  const hosts = ref(0)
  // Resolvers are functions, so they live outside reactive state.
  const resolvers = new Map<number, (value: boolean) => void>()

  /** The request currently shown, or null. */
  const current = computed(() => queue.value[0] ?? null)

  function confirm(options: ConfirmOptions): Promise<boolean> {
    if (hosts.value === 0) {
      violation('useConfirm', 'requires-ConfirmHost', 'requires a <ConfirmHost /> mounted once near the app root, otherwise the returned promise never settles.')
    }
    const id = ++counter
    const given = (options?.title ?? '').trim()
    if (!given) violation('useConfirm', 'requires-title', 'requires a non-empty `title` naming the action, for example "Delete 3 invoices?".')
    const title = given || DEFAULT_CONFIRM_TITLE
    return new Promise<boolean>((resolve) => {
      resolvers.set(id, resolve)
      queue.value = [...queue.value, { ...options, title, id }]
    })
  }

  function settle(result: boolean) {
    const head = queue.value[0]
    if (!head) return
    queue.value = queue.value.slice(1)
    const resolve = resolvers.get(head.id)
    resolvers.delete(head.id)
    resolve?.(result)
  }

  /** Resolve the current request with `true`. */
  const accept = () => settle(true)
  /** Resolve the current request with `false`. */
  const cancel = () => settle(false)

  /** Cancel every pending request (e.g. on route change). */
  function clear() {
    while (queue.value.length) settle(false)
  }

  return { queue, hosts, current, confirm, accept, cancel, clear }
})

/** `const { confirm } = useConfirm(); if (await confirm({ title: 'Delete?', destructive: true })) ...` */
export function useConfirm() {
  const store = useConfirmStore()
  return { confirm: store.confirm }
}
