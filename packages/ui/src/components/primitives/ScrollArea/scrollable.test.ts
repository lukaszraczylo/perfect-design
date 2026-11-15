import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { isScrollable, toElement, useFocusableScrollers, useScrollable } from './scrollable'

type RO = { cb: () => void; observed: Element[]; disconnected: boolean }
let observers: RO[] = []

beforeEach(() => {
  observers = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      state: RO
      constructor(cb: () => void) {
        this.state = { cb, observed: [], disconnected: false }
        observers.push(this.state)
      }
      observe(el: Element) {
        this.state.observed.push(el)
      }
      disconnect() {
        this.state.disconnected = true
      }
    },
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function size(el: Element, v: { scrollWidth?: number; clientWidth?: number; scrollHeight?: number; clientHeight?: number }) {
  for (const [k, val] of Object.entries(v)) Object.defineProperty(el, k, { configurable: true, value: val })
}

describe('isScrollable / toElement', () => {
  it('compares scroll and client size on both axes with a 1px tolerance', () => {
    const el = document.createElement('div')
    size(el, { scrollWidth: 100, clientWidth: 100, scrollHeight: 100, clientHeight: 100 })
    expect(isScrollable(el)).toBe(false)
    size(el, { scrollWidth: 101 })
    expect(isScrollable(el)).toBe(false)
    size(el, { scrollWidth: 102 })
    expect(isScrollable(el)).toBe(true)
    size(el, { scrollWidth: 100, scrollHeight: 150 })
    expect(isScrollable(el)).toBe(true)
  })

  it('toElement unwraps component instances and rejects everything else', () => {
    const el = document.createElement('div')
    expect(toElement(el)).toBe(el)
    expect(toElement({ $el: el })).toBe(el)
    expect(toElement({ $el: document.createComment('fragment'), viewportElement: el })).toBe(el)
    expect(toElement(null)).toBeNull()
    expect(toElement({ $el: 'text' })).toBeNull()
    expect(toElement('x')).toBeNull()
  })
})

describe('useScrollable', () => {
  const Comp = defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null)
      const scrollable = useScrollable(el)
      return () => h('div', { ref: el, 'data-scrollable': String(scrollable.value) }, [h('span')])
    },
  })

  it('is false at mount when nothing overflows and flips when the observer reports overflow', async () => {
    const w = mount(Comp, { attachTo: document.body })
    expect(w.attributes('data-scrollable')).toBe('false')
    expect(observers[0]!.observed).toHaveLength(2) // the element and its first child
    size(w.element, { scrollHeight: 300, clientHeight: 100 })
    observers[0]!.cb()
    await nextTick()
    expect(w.attributes('data-scrollable')).toBe('true')
    size(w.element, { scrollHeight: 100 })
    observers[0]!.cb()
    await nextTick()
    expect(w.attributes('data-scrollable')).toBe('false')
    w.unmount()
    expect(observers[0]!.disconnected).toBe(true)
  })

  it('works without ResizeObserver (still evaluates once on mount)', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const w = mount(Comp, { attachTo: document.body })
    expect(w.attributes('data-scrollable')).toBe('false')
    w.unmount()
  })
})

describe('useFocusableScrollers', () => {
  const Comp = defineComponent({
    props: { selector: { type: String, default: undefined } },
    setup(props) {
      const root = ref<HTMLElement | null>(null)
      useFocusableScrollers(root, props.selector)
      return () =>
        h('div', { ref: root }, [h('pre', { id: 'a' }, 'code'), h('pre', { id: 'b', tabindex: '-1' }, 'code'), h('p', { id: 'c' }, 'text')])
    },
  })

  it('adds tabindex=0 to overflowing pre blocks, removes it again, and never touches existing tabindex values', async () => {
    const w = mount(Comp, { attachTo: document.body })
    const a = w.find('#a').element
    const b = w.find('#b').element
    expect(a.hasAttribute('tabindex')).toBe(false)
    size(a, { scrollWidth: 500, clientWidth: 100 })
    size(b, { scrollWidth: 500, clientWidth: 100 })
    observers[0]!.cb()
    expect(a.getAttribute('tabindex')).toBe('0')
    expect(b.getAttribute('tabindex')).toBe('-1') // author-set value is left alone
    size(a, { scrollWidth: 100 })
    observers[0]!.cb()
    expect(a.hasAttribute('tabindex')).toBe(false)
    expect(b.getAttribute('tabindex')).toBe('-1')
    w.unmount()
  })

  it('supports a custom selector', () => {
    const w = mount(Comp, { props: { selector: 'p' }, attachTo: document.body })
    const c = w.find('#c').element
    size(c, { scrollHeight: 400, clientHeight: 100 })
    observers[0]!.cb()
    expect(c.getAttribute('tabindex')).toBe('0')
    w.unmount()
  })
})
