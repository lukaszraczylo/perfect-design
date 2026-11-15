import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { Affix, affixVariants } from './index'
import AffixVue from './Affix.vue'

type Entry = { isIntersecting: boolean; top: number; rootBounds?: { top: number; height: number } | null }

class FakeIO {
  static instances: FakeIO[] = []
  observed: Element[] = []
  disconnected = false
  constructor(
    public cb: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    FakeIO.instances.push(this)
  }
  observe(el: Element) {
    this.observed.push(el)
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true
  }
  takeRecords() {
    return []
  }
  /** Default viewport 0..1000; `top` is the sentinel's top relative to the viewport. */
  fire({ isIntersecting, top, rootBounds = { top: 0, height: 1000 } }: Entry) {
    const entry = { isIntersecting, boundingClientRect: { top }, rootBounds, target: this.observed[0] }
    this.cb([entry as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}
const last = () => FakeIO.instances[FakeIO.instances.length - 1]
const live = () => FakeIO.instances.filter((i) => !i.disconnected)

let wrappers: VueWrapper<any>[] = []
function make(props: Record<string, unknown> = {}, slots: Record<string, any> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(Affix, { props, slots, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}
const bar = (w: VueWrapper<any>) => w.find('[data-slot="affix"]')
const sentinel = (w: VueWrapper<any>) => w.find('[data-slot="affix-sentinel"]')

function rect(el: Element, r: Partial<DOMRect>) {
  Object.defineProperty(el, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, bottom: 0, height: 0, ...r }) as DOMRect })
}

beforeEach(() => {
  FakeIO.instances = []
  vi.stubGlobal('IntersectionObserver', FakeIO)
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Affix: good path', () => {
  it('renders sticky content with the sentinel in front and the default token z-index', () => {
    const w = make({}, { default: '<p id="c">Content</p>' })
    const b = bar(w)
    expect(b.find('#c').text()).toBe('Content')
    expect(b.classes()).toContain('sticky')
    expect(b.classes()).toContain('z-(--z-sticky)')
    expect(b.attributes('style')).toContain('top: 0px')
    expect(b.attributes('data-edge')).toBe('top')
    expect(b.attributes('data-stuck')).toBeUndefined()
    expect(sentinel(w).attributes('aria-hidden')).toBe('true')
    expect(sentinel(w).element.nextElementSibling).toBe(b.element)
    expect(last().observed[0]).toBe(sentinel(w).element)
    expect(last().options).toEqual({ root: null, rootMargin: '0px 0px 0px 0px' })
  })

  it('offsetTop becomes an inline top and shrinks the observer root', () => {
    const w = make({ offsetTop: 64 })
    expect(bar(w).attributes('style')).toContain('top: 64px')
    expect(last().options!.rootMargin).toBe('-64px 0px 0px 0px')
  })

  it('emits change when the sentinel leaves / enters, with the slot prop and data-stuck', async () => {
    const w = make({}, { default: ({ stuck }: { stuck: boolean }) => h('i', { id: 's' }, String(stuck)) })
    expect(w.find('#s').text()).toBe('false')
    last().fire({ isIntersecting: true, top: 10 })
    expect(w.emitted('change')).toBeUndefined()
    last().fire({ isIntersecting: false, top: -50 })
    await nextTick()
    expect(w.emitted('change')).toEqual([[true]])
    expect(bar(w).attributes('data-stuck')).toBe('')
    expect(w.find('#s').text()).toBe('true')
    last().fire({ isIntersecting: false, top: -80 }) // still stuck: no duplicate
    expect(w.emitted('change')).toHaveLength(1)
    last().fire({ isIntersecting: true, top: 5 })
    await nextTick()
    expect(w.emitted('change')).toEqual([[true], [false]])
    expect(bar(w).attributes('data-stuck')).toBeUndefined()
  })

  it('a sentinel that is off-screen BELOW is not stuck (top mode)', () => {
    const w = make()
    last().fire({ isIntersecting: false, top: 2000 })
    expect(w.emitted('change')).toBeUndefined()
  })

  it('handles missing rootBounds and an empty entry list', () => {
    const w = make()
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(600)
    last().fire({ isIntersecting: false, top: 100, rootBounds: null })
    expect(w.emitted('change')).toEqual([[true]])
    last().cb([], last() as unknown as IntersectionObserver)
    expect(w.emitted('change')).toHaveLength(1)
  })

  it('bottom mode: sentinel after the content, inline bottom, stuck when it is below the viewport', () => {
    const w = make({ offsetBottom: 20 })
    const b = bar(w)
    expect(b.attributes('data-edge')).toBe('bottom')
    expect(b.attributes('style')).toContain('bottom: 20px')
    expect(b.attributes('style')).not.toContain('top:')
    expect(b.element.nextElementSibling).toBe(sentinel(w).element)
    expect(last().options!.rootMargin).toBe('0px 0px -20px 0px')
    last().fire({ isIntersecting: false, top: 2000 })
    expect(w.emitted('change')).toEqual([[true]])
    last().fire({ isIntersecting: false, top: -2000 })
    expect(w.emitted('change')).toEqual([[true], [false]])
  })

  it('offsetTop and offsetBottom together apply both and track the top edge', () => {
    const w = make({ offsetTop: 10, offsetBottom: 30 })
    expect(bar(w).attributes('style')).toContain('top: 10px')
    expect(bar(w).attributes('style')).toContain('bottom: 30px')
    expect(bar(w).attributes('data-edge')).toBe('top')
  })

  it('reconnects when offsets change', async () => {
    const w = make({ offsetTop: 10 })
    const n = FakeIO.instances.length
    await w.setProps({ offsetTop: 40 })
    expect(FakeIO.instances).toHaveLength(n + 1)
    expect(FakeIO.instances[n - 1].disconnected).toBe(true)
    expect(last().options!.rootMargin).toBe('-40px 0px 0px 0px')
    await w.setProps({ offsetTop: undefined, offsetBottom: 5 })
    expect(bar(w).attributes('data-edge')).toBe('bottom')
    expect(last().observed[0]).toBe(sentinel(w).element)
    expect(live()).toHaveLength(1)
  })

  it('resolves root element and selector', () => {
    const el = document.createElement('div')
    el.id = 'scr'
    document.body.appendChild(el)
    make({ root: el })
    expect(last().options!.root).toBe(el)
    make({ root: '#scr' })
    expect(last().options!.root).toBe(el)
    make({ root: '#none' })
    expect(last().options!.root).toBeNull()
    make({ root: '::bad::' })
    expect(last().options!.root).toBeNull()
    make({ root: '' })
    expect(last().options!.root).toBeNull()
  })
})

describe('Affix: customisation', () => {
  it('numeric and string zIndex go inline and replace the token class', () => {
    const n = bar(make({ zIndex: 5 }))
    expect(n.attributes('style')).toContain('z-index: 5')
    expect(n.classes()).not.toContain('z-(--z-sticky)')
    const s = bar(make({ zIndex: 'var(--z-overlay)' }))
    expect(s.attributes('style')).toContain('z-index: var(--z-overlay)')
    const zero = bar(make({ zIndex: 0 }))
    expect(zero.attributes('style')).toContain('z-index: 0')
  })

  it('invalid zIndex values fall back to the token class', () => {
    for (const z of [NaN, Infinity, '', '   ']) {
      const b = bar(make({ zIndex: z }))
      expect(b.classes()).toContain('z-(--z-sticky)')
      expect(b.attributes('style') ?? '').not.toContain('z-index')
    }
  })

  it('variants add stuck-only classes; unknown falls back to plain', () => {
    expect(bar(make({ variant: 'elevated' })).classes()).toEqual(expect.arrayContaining(['data-[stuck]:shadow-md', 'data-[stuck]:bg-background']))
    expect(bar(make({ variant: 'bordered' })).classes()).toContain('data-[stuck]:border-b')
    expect(bar(make({ variant: 'bordered', offsetBottom: 0 })).classes()).toContain('data-[stuck]:border-t')
    const plain = bar(make({ variant: 'nope' })).classes()
    expect(plain.some((c) => c.startsWith('data-[stuck]'))).toBe(false)
    expect(affixVariants({ variant: 'elevated', class: 'x' })).toContain('x')
  })

  it('class is merged last (wins over internal z token), attrs reach the sticky element', () => {
    const w = make({ class: 'z-10 bg-card' }, {}, { id: 'bar', 'aria-label': 'Toolbar', 'data-x': '1', style: 'top: 99px' })
    const b = bar(w)
    expect(b.classes()).toEqual(expect.arrayContaining(['z-10', 'bg-card', 'sticky']))
    expect(b.classes()).not.toContain('z-(--z-sticky)')
    expect(b.attributes('id')).toBe('bar')
    expect(b.attributes('aria-label')).toBe('Toolbar')
    expect(b.attributes('data-x')).toBe('1')
    expect(b.attributes('style')).toContain('top: 99px')
    expect(AffixVue).toBe(Affix)
  })

  it('forwards listeners via attrs', async () => {
    const onClick = vi.fn()
    const w = make({}, {}, { onClick })
    await bar(w).trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('Affix: bad path', () => {
  it('NaN / Infinity offsets are ignored', () => {
    const w = make({ offsetTop: NaN, offsetBottom: Infinity })
    expect(bar(w).attributes('style')).toContain('top: 0px')
    expect(bar(w).attributes('style')).not.toContain('bottom')
    expect(bar(w).attributes('data-edge')).toBe('top')
  })

  it('negative offsets are allowed', () => {
    const w = make({ offsetTop: -10 })
    expect(bar(w).attributes('style')).toContain('top: -10px')
    expect(last().options!.rootMargin).toBe('10px 0px 0px 0px')
  })

  it('disabled renders a plain block: no sticky, no sentinel, no observer', () => {
    const w = make({ disabled: true, offsetTop: 10, zIndex: 3 })
    expect(bar(w).classes()).not.toContain('sticky')
    expect(bar(w).classes()).not.toContain('z-(--z-sticky)')
    expect(bar(w).attributes('style')).toBeUndefined()
    expect(bar(w).attributes('data-disabled')).toBe('')
    expect(sentinel(w).exists()).toBe(false)
    expect(live()).toHaveLength(0)
  })

  it('disabling while stuck resets and emits change(false); enabling observes again', async () => {
    const w = make()
    last().fire({ isIntersecting: false, top: -10 })
    expect(w.emitted('change')).toEqual([[true]])
    await w.setProps({ disabled: true })
    expect(w.emitted('change')).toEqual([[true], [false]])
    expect(live()).toHaveLength(0)
    await w.setProps({ disabled: false })
    expect(live()).toHaveLength(1)
    expect(last().observed[0]).toBe(sentinel(w).element)
  })

  it('ignores late observer callbacks after unmount', () => {
    const w = make()
    const io = last()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(io.disconnected).toBe(true)
  })
})

describe('Affix: fallback without IntersectionObserver', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', undefined)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 500, bottom: 500, height: 0 } as DOMRect)
  })

  it('top mode: tracks stuck from the sentinel rect on scroll and resize', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const w = make({ offsetTop: 50 })
    expect(add.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
    expect(w.emitted('change')).toBeUndefined()
    rect(sentinel(w).element, { top: 10 }) // 10 < 0 + 50
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('change')).toEqual([[true]])
    rect(sentinel(w).element, { top: 80 })
    window.dispatchEvent(new Event('resize'))
    expect(w.emitted('change')).toEqual([[true], [false]])
  })

  it('bottom mode: stuck when the sentinel is below viewport bottom minus the offset', () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(700)
    const w = make({ offsetBottom: 100 })
    rect(sentinel(w).element, { top: 650 }) // > 700 - 100
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('change')).toEqual([[true]])
    rect(sentinel(w).element, { top: 500 })
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('change')).toEqual([[true], [false]])
  })

  it('uses a custom root element for events and geometry', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    rect(root, { top: 100, bottom: 500 })
    const add = vi.spyOn(root, 'addEventListener')
    const w = make({ root, offsetTop: 10 })
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    rect(sentinel(w).element, { top: 105 }) // < 100 + 10
    root.dispatchEvent(new Event('scroll'))
    expect(w.emitted('change')).toEqual([[true]])
  })

  it('checks once on mount (already stuck)', () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ top: -5, bottom: -5, height: 0 } as DOMRect)
    const w = make({ offsetTop: 0 })
    expect(w.emitted('change')).toEqual([[true]])
  })

  it('removes listeners on unmount, on disable and on reconnect', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = make()
    await w.setProps({ offsetTop: 5 })
    expect(remove.mock.calls.filter((c) => c[0] === 'scroll').length).toBe(1)
    await w.setProps({ disabled: true })
    expect(remove.mock.calls.filter((c) => c[0] === 'scroll').length).toBe(2)
    await w.setProps({ disabled: false })
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(remove.mock.calls.filter((c) => c[0] === 'resize').length).toBe(3)
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('change')).toBeUndefined()
  })

  it('falls back when the IntersectionObserver constructor throws', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          throw new Error('nope')
        }
      },
    )
    const add = vi.spyOn(window, 'addEventListener')
    make()
    expect(add.mock.calls.map((c) => c[0])).toContain('scroll')
  })
})

describe('Affix forced-colors fallback', () => {
  it('the elevated variant adds a border while stuck in forced-colors mode (shadows vanish there)', () => {
    expect(affixVariants({ variant: 'elevated' })).toContain('forced-colors:data-[stuck]:border')
  })
})
