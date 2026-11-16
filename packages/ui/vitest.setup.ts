// Global test environment shims for jsdom. Components built on reka-ui need these.
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= RO as unknown as typeof ResizeObserver

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
globalThis.IntersectionObserver ??= IO as unknown as typeof IntersectionObserver

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

Element.prototype.scrollIntoView ??= function () {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
window.HTMLElement.prototype.scrollTo ??= () => {}

// Component unit tests mount partial trees on purpose (a DialogContent without a title, an icon button without a label).
// Contract enforcement is off by default here; the contract tests and the docs-example harnesses switch it on explicitly.
import { configureStrictMode } from './src/lib/contract'
import { filterKnownTestWarnings } from './src/lib/console-filter'
configureStrictMode('off')
filterKnownTestWarnings()
