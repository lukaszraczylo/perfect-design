/**
 * Keeps `scroll-padding-top` of the page equal to the height a sticky header occupies, so a focused element scrolled
 * into view is never hidden behind the header (WCAG 2.4.11 Focus Not Obscured). Returns a cleanup that restores the
 * previous inline value. Safe without ResizeObserver (measures once) and during SSR (no-op).
 */
export function trackStickyOffset(el: HTMLElement | null | undefined): () => void {
  if (!el || typeof document === 'undefined') return () => {}
  const root = document.documentElement
  const previous = root.style.scrollPaddingTop
  const measure = () => {
    const top = Number.parseFloat(getComputedStyle(el).top)
    const offset = Math.ceil(el.getBoundingClientRect().height + (Number.isFinite(top) ? top : 0))
    root.style.scrollPaddingTop = `${offset}px`
  }
  measure()
  let observer: ResizeObserver | undefined
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(el)
  }
  return () => {
    observer?.disconnect()
    root.style.scrollPaddingTop = previous
  }
}
