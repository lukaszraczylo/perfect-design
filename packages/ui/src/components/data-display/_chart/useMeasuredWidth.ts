import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * Tracks the content width (px) of an element with a ResizeObserver. Charts use it as their viewBox width so one
 * SVG unit is one CSS pixel: axis text keeps its real size on a 320px phone instead of shrinking with the viewBox.
 * Stays `0` until measured, and always in environments without ResizeObserver (callers then use their `width` prop).
 */
export function useMeasuredWidth(el: Ref<HTMLElement | null>): Ref<number> {
  const width = ref(0)
  let ro: ResizeObserver | undefined
  const stop = () => {
    ro?.disconnect()
    ro = undefined
  }
  watch(
    el,
    (node) => {
      stop()
      if (!node) return
      width.value = Math.round(node.clientWidth)
      if (typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0)
        if (w > 0) width.value = w
      })
      ro.observe(node)
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(stop)
  return width
}
