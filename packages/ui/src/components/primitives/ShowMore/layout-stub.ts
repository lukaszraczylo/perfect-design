/**
 * jsdom has no layout. These helpers (shared by the ShowMore tests) fake what the component measures:
 * `scrollHeight` is the full content height, `clientHeight` the visible height, which is the clamp while a clamp class
 * is applied and the full height once it is not. They also replace ResizeObserver with one the test can fire.
 */
import { vi } from 'vitest'

export const heights = { full: 200, visible: 60 }

export class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element[] = []
  disconnected = false
  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this)
  }
  observe(el: Element) {
    this.observed.push(el)
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true
  }
  fire() {
    this.callback([], this as unknown as ResizeObserver)
  }
}

const isContent = (el: Element) => el.getAttribute('data-slot') === 'show-more-content'
const isClamped = (el: Element) => [...el.classList].some((c) => /^(line-clamp-|max-h-)/.test(c))

export function installLayout(next: { full: number; visible: number } = { full: 200, visible: 60 }) {
  heights.full = next.full
  heights.visible = next.visible
  FakeResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
    return isContent(this) ? heights.full : 0
  })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    if (!isContent(this)) return 0
    return isClamped(this) ? Math.min(heights.full, heights.visible) : heights.full
  })
}

export function uninstallLayout() {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  FakeResizeObserver.instances = []
}

/** Fire every live observer, like the browser does after a resize. */
export const fireResize = () => FakeResizeObserver.instances.filter((o) => !o.disconnected).forEach((o) => o.fire())
