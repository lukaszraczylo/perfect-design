import { onScopeDispose, readonly, ref, type Ref } from 'vue'

/** Debounce a function; the returned function has `.cancel()`. Timer is cleared when the scope is disposed. */
export function useDebounceFn<A extends unknown[]>(fn: (...args: A) => void, ms: number | (() => number) = 200) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = (...args: A) => {
    clearTimeout(timer)
    const delay = typeof ms === 'function' ? ms() : ms
    if (!(delay > 0)) return void fn(...args) // 0 / negative / NaN: run synchronously
    timer = setTimeout(() => fn(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timer)
  onScopeDispose(debounced.cancel, true)
  return debounced
}

export interface UseClipboardOptions {
  /** How long `copied` stays true (ms). */
  copiedDuring?: number
  /** Fall back to document.execCommand('copy') when the async Clipboard API is unavailable or rejects. */
  legacy?: boolean
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy')
    ta.remove()
    return !!ok
  } catch {
    return false
  }
}

/** Copy text via the async Clipboard API (optional legacy fallback); `copied` flips true for `copiedDuring` ms. Never throws. */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { copiedDuring = 1500, legacy = false } = options
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy(text: string): Promise<boolean> {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = legacy ? legacyCopy(text) : false
    }
    clearTimeout(timer)
    copied.value = ok
    if (ok) timer = setTimeout(() => (copied.value = false), copiedDuring)
    return ok
  }
  onScopeDispose(() => clearTimeout(timer), true)
  return { copy, copied: readonly(copied) as Readonly<Ref<boolean>> }
}

/** Reactive navigator.onLine. */
export function useOnline(): Readonly<Ref<boolean>> {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  if (typeof window !== 'undefined') {
    const on = () => (online.value = true)
    const off = () => (online.value = false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    onScopeDispose(() => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }, true)
  }
  return readonly(online) as Readonly<Ref<boolean>>
}

/** Reactive window scroll offsets (passive listener). */
export function useWindowScroll() {
  const x = ref(typeof window === 'undefined' ? 0 : window.scrollX)
  const y = ref(typeof window === 'undefined' ? 0 : window.scrollY)
  if (typeof window !== 'undefined') {
    const on = () => {
      x.value = window.scrollX
      y.value = window.scrollY
    }
    window.addEventListener('scroll', on, { passive: true })
    onScopeDispose(() => window.removeEventListener('scroll', on), true)
  }
  return { x, y }
}
