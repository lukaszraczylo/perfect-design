import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { InfiniteScroll } from './index'
import InfiniteScrollVue from './InfiniteScroll.vue'

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
  fire(isIntersecting = true) {
    this.cb([{ isIntersecting, target: this.observed[0] } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}
const live = () => FakeIO.instances.filter((i) => !i.disconnected)
const last = () => FakeIO.instances[FakeIO.instances.length - 1]

let wrappers: VueWrapper<any>[] = []
function make(props: Record<string, unknown> = {}, slots: Record<string, any> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(InfiniteScroll, { props, slots, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}

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

describe('InfiniteScroll: good path', () => {
  it('renders content and a hidden sentinel, observes it with the default margin', () => {
    const w = make({}, { default: '<p id="item">Item</p>' })
    expect(w.attributes('data-slot')).toBe('infinite-scroll')
    expect(w.attributes('data-state')).toBe('idle')
    expect(w.find('#item').text()).toBe('Item')
    const s = w.find('[data-slot="infinite-scroll-sentinel"]')
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(live()).toHaveLength(1)
    expect(last().observed[0]).toBe(s.element)
    expect(last().options).toEqual({ root: null, rootMargin: '200px' })
    expect(w.find('[data-slot="infinite-scroll-status"]').attributes('role')).toBe('status')
  })

  it('emits load when the sentinel intersects, not otherwise', () => {
    const w = make()
    last().fire(false)
    expect(w.emitted('load')).toBeUndefined()
    last().cb([], last() as unknown as IntersectionObserver)
    expect(w.emitted('load')).toBeUndefined()
    last().fire(true)
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('shows the loading slot (default and custom) and blocks load while loading', async () => {
    const w = make({ loading: true })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.attributes('data-state')).toBe('loading')
    expect(w.find('[data-slot="infinite-scroll-loading"]').text()).toContain('Loading')
    expect(live()).toHaveLength(0)
    await w.setProps({ loading: false })
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(live()).toHaveLength(1)
    const custom = make({ loading: true }, { loading: '<b id="spin">wait</b>' })
    expect(custom.find('#spin').exists()).toBe(true)
  })

  it('re-observes after loading finishes so a still-visible sentinel loads again', async () => {
    const w = make()
    last().fire()
    await w.setProps({ loading: true })
    expect(live()).toHaveLength(0)
    await w.setProps({ loading: false })
    expect(live()).toHaveLength(1)
    last().fire()
    expect(w.emitted('load')).toHaveLength(2)
  })

  it('works end to end with a parent that appends pages', async () => {
    const items = ref<number[]>([])
    const loading = ref(false)
    const finished = ref(false)
    const Host = defineComponent({
      setup: () => () =>
        h(
          InfiniteScroll,
          {
            loading: loading.value,
            finished: finished.value,
            onLoad: async () => {
              loading.value = true
              await Promise.resolve()
              items.value.push(...Array.from({ length: 5 }, (_, i) => items.value.length + i))
              loading.value = false
              if (items.value.length >= 10) finished.value = true
            },
          },
          { default: () => items.value.map((i) => h('li', { class: 'row' }, i)), end: () => 'Done' },
        ),
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    last().fire()
    last().fire()
    await vi.waitFor(() => expect(items.value).toHaveLength(5))
    await nextTick()
    last().fire()
    await vi.waitFor(() => expect(items.value).toHaveLength(10))
    await nextTick()
    expect(w.findAll('.row')).toHaveLength(10)
    expect(w.text()).toContain('Done')
    expect(live()).toHaveLength(0)
  })

  it('finished shows the end slot (default / custom), stops observing, and never loads', async () => {
    const w = make({ finished: true })
    expect(w.attributes('data-state')).toBe('finished')
    expect(w.find('[data-slot="infinite-scroll-end"]').text()).toBe('No more results.')
    expect(live()).toHaveLength(0)
    const custom = make({ finished: true }, { end: '<i id="end">The end</i>' })
    expect(custom.find('#end').exists()).toBe(true)
    await w.setProps({ finished: false })
    expect(live()).toHaveLength(1)
    expect(w.find('[data-slot="infinite-scroll-end"]').exists()).toBe(false)
  })

  it('passes root element and rootMargin to the observer', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    make({ root: el, rootMargin: '0px 0px 50px 0px' })
    expect(last().options).toEqual({ root: el, rootMargin: '0px 0px 50px 0px' })
  })

  it('resolves a root selector after mount; unknown or invalid selectors mean the viewport', () => {
    const el = document.createElement('div')
    el.id = 'scroller'
    document.body.appendChild(el)
    make({ root: '#scroller' })
    expect(last().options!.root).toBe(el)
    make({ root: '#missing' })
    expect(last().options!.root).toBeNull()
    make({ root: '!!!bad' })
    expect(last().options!.root).toBeNull()
    make({ root: '' })
    expect(last().options!.root).toBeNull()
  })

  it('reconnects when root, rootMargin, disabled change', async () => {
    const w = make()
    const before = FakeIO.instances.length
    await w.setProps({ rootMargin: '10px' })
    expect(FakeIO.instances).toHaveLength(before + 1)
    expect(FakeIO.instances[before - 1].disconnected).toBe(true)
    expect(last().options!.rootMargin).toBe('10px')
  })
})

describe('InfiniteScroll: customisation', () => {
  it('merges class last and passes attrs', () => {
    const w = make({ class: 'h-64 overflow-auto relative-none' }, {}, { id: 'list', 'data-x': '1', 'aria-label': 'Results' })
    expect(w.classes()).toEqual(expect.arrayContaining(['h-64', 'overflow-auto']))
    expect(w.attributes('id')).toBe('list')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('aria-label')).toBe('Results')
    expect(InfiniteScrollVue).toBe(InfiniteScroll)
  })

  it('class override wins over internal relative', () => {
    expect(make({ class: 'absolute' }).classes()).not.toContain('relative')
  })
})

describe('InfiniteScroll: dedupe and rapid events', () => {
  it('rapid intersect events in one tick emit once', () => {
    const w = make()
    for (let i = 0; i < 20; i++) last().fire()
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('a parent that never sets loading can load again on the next tick', async () => {
    const w = make()
    last().fire()
    await nextTick()
    await nextTick()
    last().fire()
    expect(w.emitted('load')).toHaveLength(2)
  })

  it('stays latched while the parent keeps loading=true', async () => {
    const w = make()
    last().fire()
    await w.setProps({ loading: true })
    await nextTick()
    // an observer that survived (e.g. user code kept a reference) must still not re-emit
    FakeIO.instances[0].fire()
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('disabled neither observes nor emits; enabling resumes', async () => {
    const w = make({ disabled: true })
    expect(live()).toHaveLength(0)
    expect(w.emitted('load')).toBeUndefined()
    await w.setProps({ disabled: false })
    expect(live()).toHaveLength(1)
    last().fire()
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('an intersect event arriving after disable is ignored', async () => {
    const w = make()
    const io = last()
    await w.setProps({ disabled: true })
    io.fire()
    expect(w.emitted('load')).toBeUndefined()
  })

  it('0 / 10 000 children render fine', () => {
    expect(make({}, { default: '' }).findAll('li')).toHaveLength(0)
    const big = make({}, { default: () => Array.from({ length: 10_000 }, (_, i) => h('li', i)) })
    expect(big.findAll('li')).toHaveLength(10_000)
  })
})

describe('InfiniteScroll: error and retry', () => {
  it('shows the default message and a retry button that emits retry then load', async () => {
    const w = make({ error: true })
    expect(w.attributes('data-state')).toBe('error')
    expect(w.find('[data-slot="infinite-scroll-error"]').attributes('role')).toBe('alert')
    expect(w.text()).toContain('Something went wrong.')
    expect(live()).toHaveLength(0)
    await w.find('[data-slot="infinite-scroll-retry"]').trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('shows a string error as the message', () => {
    expect(make({ error: 'Network down' }).text()).toContain('Network down')
  })

  it('error slot receives retry and the error', async () => {
    const w = make({ error: 'boom' }, { error: `<template #error="{ retry, error }"><button id="r" @click="retry">{{ error }}</button></template>` })
    await w.find('#r').trigger('click')
    expect(w.emitted('load')).toHaveLength(1)
    expect(w.find('#r').text()).toBe('boom')
  })

  it('error hides the end slot even when finished; loading hides the error', async () => {
    const w = make({ error: true, finished: true })
    expect(w.find('[data-slot="infinite-scroll-end"]').exists()).toBe(false)
    await w.setProps({ loading: true })
    expect(w.find('[data-slot="infinite-scroll-error"]').exists()).toBe(false)
    expect(w.find('[data-slot="infinite-scroll-loading"]').exists()).toBe(true)
  })

  it('retry is blocked while disabled and rapid double clicks emit once', async () => {
    const w = make({ error: true, disabled: true })
    const btn = w.find('[data-slot="infinite-scroll-retry"]')
    expect(btn.attributes('disabled')).toBeDefined()
    await btn.trigger('click')
    expect(w.emitted('load')).toBeUndefined()
    const enabled = make({ error: true })
    const b = enabled.find('[data-slot="infinite-scroll-retry"]')
    void b.trigger('click')
    await b.trigger('click')
    expect(enabled.emitted('load')).toHaveLength(1)
  })

  it('retry via slot while disabled / loading does nothing', async () => {
    let retry: (() => void) | undefined
    const w = mount(InfiniteScroll, {
      props: { error: true, disabled: true },
      slots: { error: (p: { retry: () => void }) => ((retry = p.retry), 'x') },
    })
    wrappers.push(w)
    retry!()
    expect(w.emitted('load')).toBeUndefined()
    await w.setProps({ disabled: false })
    retry!()
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('clearing the error resumes observation', async () => {
    const w = make({ error: true })
    await w.setProps({ error: false })
    expect(live()).toHaveLength(1)
  })
})

describe('InfiniteScroll: fallback without IntersectionObserver', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', undefined)
    // sentinel far below the viewport unless a test says otherwise
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 99999, bottom: 99999, height: 0 } as DOMRect)
  })

  const sentinelOf = (w: VueWrapper<any>) => w.find('[data-slot="infinite-scroll-sentinel"]').element

  it('checks on mount and on window scroll / resize', async () => {
    const spy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    const add = vi.spyOn(window, 'addEventListener')
    const proto = vi.mocked(HTMLElement.prototype.getBoundingClientRect)
    proto.mockReturnValue({ top: 2000, bottom: 2001, height: 1 } as DOMRect)
    const w = make()
    expect(w.emitted('load')).toBeUndefined()
    expect(add.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
    proto.mockReturnValue({ top: 900, bottom: 901, height: 1 } as DOMRect) // within 800 + 200
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('load')).toHaveLength(1)
    await nextTick()
    window.dispatchEvent(new Event('resize'))
    expect(w.emitted('load')).toHaveLength(2)
    spy.mockRestore()
  })

  it('loads immediately on mount when the sentinel is already in range', () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ top: 10, bottom: 11, height: 1 } as DOMRect)
    const w = make()
    expect(w.emitted('load')).toHaveLength(1)
  })

  it('uses the custom root element for scroll and geometry', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const add = vi.spyOn(root, 'addEventListener')
    rect(root, { bottom: 300, height: 300 })
    const w = make({ root, rootMargin: '0px' })
    rect(sentinelOf(w), { top: 1000 })
    root.dispatchEvent(new Event('scroll'))
    expect(w.emitted('load')).toBeUndefined()
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    rect(sentinelOf(w), { top: 299 })
    root.dispatchEvent(new Event('scroll'))
    expect(w.emitted('load')).toHaveLength(1)
  })

  it.each([
    ['percent', '0px 0px 50% 0px', 1000, 400, 1201, false],
    ['percent in range', '0px 0px 50% 0px', 1000, 400, 1199, true],
    ['single value', '100px', 1000, 400, 1099, true],
    ['two values (top/bottom)', '0px 20px', 1000, 400, 1010 + 1, false],
    ['invalid margin counts as zero', 'banana', 1000, 400, 1001, false],
    ['unitless number', '30', 1000, 400, 1029, true],
    ['empty margin', '', 1000, 400, 1001, false],
  ])('rootMargin parsing: %s', (_n, margin, bottom, height, top, expected) => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    rect(root, { bottom, height })
    const w = make({ root, rootMargin: margin })
    rect(sentinelOf(w), { top })
    root.dispatchEvent(new Event('scroll'))
    expect(w.emitted('load')?.length ?? 0).toBe(expected ? 1 : 0)
  })

  it('removes scroll / resize listeners on unmount, when finished, and when disabled', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const w = make()
    await w.setProps({ finished: true })
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
    remove.mockClear()
    await w.setProps({ finished: false })
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
  })

  it('does not emit after unmount even if a stray scroll arrives', () => {
    const w = make()
    const handler = vi.spyOn(window, 'removeEventListener')
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(handler).toHaveBeenCalled()
    window.dispatchEvent(new Event('scroll'))
    expect(w.emitted('load')).toBeUndefined()
  })

  it('falls back when the IntersectionObserver constructor throws (bad rootMargin)', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor() {
          throw new SyntaxError('bad rootMargin')
        }
      },
    )
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({ top: 0, bottom: 0, height: 0 } as DOMRect)
    const w = make({ rootMargin: 'nope' })
    expect(w.emitted('load')).toHaveLength(1)
  })
})

describe('InfiniteScroll: cleanup', () => {
  it('disconnects the observer on unmount and ignores late callbacks', () => {
    const w = make()
    const io = last()
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(io.disconnected).toBe(true)
    io.fire()
    expect(w.emitted('load')).toBeUndefined()
  })

  it('exposes check() to re-observe on demand', () => {
    const w = make()
    const n = FakeIO.instances.length
    ;(w.vm as unknown as { check(): void }).check()
    expect(FakeIO.instances).toHaveLength(n + 1)
    expect(FakeIO.instances[n - 1].disconnected).toBe(true)
  })

  it('SSR-ish: no window means nothing is observed', () => {
    const w = make()
    expect(w.exists()).toBe(true)
  })
})

describe('InfiniteScroll retry button target size and focus', () => {
  it('is at least 24px high, 44px on coarse pointers, and uses the shared focus ring', () => {
    const w = mount(InfiniteScroll, { props: { error: true } })
    const classes = w.find('[data-slot="infinite-scroll-retry"]').classes()
    expect(classes).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11', 'focus-visible:ring-3']))
    expect(classes).not.toContain('outline-none')
  })
})
