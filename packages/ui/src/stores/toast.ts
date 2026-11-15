import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  /** Auto-dismiss delay in ms. 0 or Infinity = sticky. Default 5000. */
  duration?: number
  /** Optional action button. */
  action?: { label: string; onClick: () => void }
  /** Dedupe key: pushing a toast with an existing key replaces it instead of stacking. */
  key?: string
}

export interface Toast extends Required<Pick<ToastInput, 'title' | 'variant' | 'duration'>> {
  id: string
  description?: string
  action?: ToastInput['action']
  key?: string
}

export const DEFAULT_TOAST_DURATION = 5000
export const MAX_TOASTS = 5

let counter = 0

/** Global toast queue. Render once with `<Toaster />`; push from anywhere with `useToastStore().push(...)`. */
export const useToastStore = defineStore('pd-toasts', () => {
  const toasts = ref<Toast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function clearTimer(id: string) {
    const t = timers.get(id)
    if (t) clearTimeout(t)
    timers.delete(id)
  }

  function dismiss(id: string) {
    clearTimer(id)
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clear() {
    for (const id of [...timers.keys()]) clearTimer(id)
    toasts.value = []
  }

  function push(input: ToastInput): string {
    const title = (input.title ?? '').trim()
    if (!title) throw new Error('Toast requires a non-empty title')
    if (input.key) {
      const existing = toasts.value.find((t) => t.key === input.key)
      if (existing) dismiss(existing.id)
    }
    const id = `toast-${++counter}`
    const duration = input.duration ?? DEFAULT_TOAST_DURATION
    const toast: Toast = { id, title, description: input.description, variant: input.variant ?? 'default', duration, action: input.action, key: input.key }
    toasts.value = [...toasts.value, toast].slice(-MAX_TOASTS)
    // evicted toasts lose their timers
    for (const id of [...timers.keys()]) if (!toasts.value.some((t) => t.id === id)) clearTimer(id)
    if (duration > 0 && Number.isFinite(duration)) timers.set(id, setTimeout(() => dismiss(id), duration))
    return id
  }

  const success = (title: string, description?: string) => push({ title, description, variant: 'success' })
  const error = (title: string, description?: string) => push({ title, description, variant: 'danger' })
  const warning = (title: string, description?: string) => push({ title, description, variant: 'warning' })
  const info = (title: string, description?: string) => push({ title, description, variant: 'info' })

  return { toasts, push, dismiss, clear, success, error, warning, info }
})
