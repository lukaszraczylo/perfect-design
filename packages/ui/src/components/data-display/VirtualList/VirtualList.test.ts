import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import VirtualList from './VirtualList.vue'

const makeItems = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id-${i}`, name: `Row ${i}` }))

let rafCbs: FrameRequestCallback[] = []
let clientHeight = 200
let roCallbacks: (() => void)[] = []
const disconnect = vi.fn()

async function mountList(props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) {
  const w = mount(VirtualList as never, {
    props: { items: makeItems(10000), itemHeight: 20, ...props } as never,
    slots: { default: ({ item, index }: { item: { name: string } | null; index: number }) => h('span', { class: 'cell' }, `${index}:${item?.name}`) },
    ...opts,
  }) as ReturnType<typeof mount> & { vm: { scrollToIndex: (i: number, a?: string) => void } }
  await nextTick() // onMounted measured the viewport
  return w
}
const rows = (w: Awaited<ReturnType<typeof mountList>>) => w.findAll('[data-slot="virtual-list-item"]')
async function scrollTo(w: Awaited<ReturnType<typeof mountList>>, top: number) {
  ;(w.element as HTMLElement).scrollTop = top
  await w.trigger('scroll')
  flushRaf()
  await nextTick()
}
function flushRaf() {
  const cbs = rafCbs
  rafCbs = []
  cbs.forEach((cb) => cb(0))
}

beforeEach(() => {
  rafCbs = []
  clientHeight = 200
  roCallbacks = []
  disconnect.mockClear()
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => clientHeight)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => rafCbs.push(cb))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCbs[id - 1] = () => {}
  })
  class RO {
    constructor(cb: () => void) {
      roCallbacks.push(cb)
    }
    observe() {}
    unobserve() {}
    disconnect = disconnect
  }
  vi.stubGlobal('ResizeObserver', RO)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('VirtualList', () => {
  describe('good path', () => {
    it('windows 10 000 rows: renders only visible + overscan', async () => {
      const w = await mountList()
      // viewport 200 / 20 = 10 rows visible, + overscan 4 below (none above at top)
      expect(rows(w).length).toBe(14)
      expect(rows(w)[0].text()).toBe('0:Row 0')
      expect(w.find('[data-slot="virtual-list-spacer"]').attributes('style')).toContain('height: 200000px')
      w.unmount()
    })

    it('has list semantics with setsize/posinset', async () => {
      const w = await mountList({ label: 'People' })
      expect(w.attributes('role')).toBe('list')
      expect(w.attributes('aria-label')).toBe('People')
      expect(w.attributes('tabindex')).toBe('0')
      const r = rows(w)[3]
      expect(r.attributes('role')).toBe('listitem')
      expect(r.attributes('aria-setsize')).toBe('10000')
      expect(r.attributes('aria-posinset')).toBe('4')
      expect(r.attributes('style')).toContain('top: 60px')
      expect(r.attributes('style')).toContain('height: 20px')
    })

    it('updates the window on scroll (rAF throttled)', async () => {
      const w = await mountList()
      await scrollTo(w, 2000)
      const idx = rows(w).map((r) => Number(r.attributes('data-index')))
      expect(idx[0]).toBe(100 - 4)
      expect(idx[idx.length - 1]).toBe(110 + 4 - 1)
      expect(w.emitted('scroll')?.[0]).toEqual([2000])
    })

    it('collapses many scroll events in one frame into one update', async () => {
      const w = await mountList()
      const el = w.element as HTMLElement
      for (let i = 1; i <= 50; i++) {
        el.scrollTop = i * 20
        await w.trigger('scroll')
      }
      expect(rafCbs.length).toBe(1)
      flushRaf()
      expect(w.emitted('scroll')?.length).toBe(1)
      expect(w.emitted('scroll')?.[0]).toEqual([1000])
    })

    it('emits range initially and when the window moves', async () => {
      const w = await mountList()
      expect(w.emitted('range')?.[0]).toEqual([{ start: 0, end: 4 }]) // before measuring
      expect(w.emitted('range')?.at(-1)).toEqual([{ start: 0, end: 14 }])
      await scrollTo(w, 400)
      const last = w.emitted('range')!.at(-1)![0] as { start: number; end: number }
      expect(last.start).toBe(16)
      // scrolling within the same window does not re-emit
      const n = w.emitted('range')!.length
      await scrollTo(w, 400)
      expect(w.emitted('range')!.length).toBe(n)
    })

    it('uses itemKey (property and function) for stable keys', async () => {
      const a = await mountList({ itemKey: 'id' })
      expect(rows(a).length).toBe(14)
      const b = await mountList({ itemKey: (item: { id: string }, i: number) => `${item.id}-${i}` })
      expect(rows(b).length).toBe(14)
      const c = await mountList({ items: [{ id: 1 }, { id: 'a' }, { id: {} }, null], itemKey: 'id' })
      expect(rows(c).length).toBe(4)
    })

    it('scrollToIndex positions rows for each alignment', async () => {
      const w = await mountList()
      const el = w.element as HTMLElement
      w.vm.scrollToIndex(500)
      expect(el.scrollTop).toBe(10000)
      await nextTick()
      expect(rows(w)[0].attributes('data-index')).toBe('496')
      w.vm.scrollToIndex(500, 'end')
      expect(el.scrollTop).toBe(10000 + 20 - 200)
      w.vm.scrollToIndex(500, 'center')
      expect(el.scrollTop).toBe(10000 - 90)
      // auto: already visible -> unchanged; above -> top; below -> bottom
      el.scrollTop = 9910
      w.vm.scrollToIndex(500, 'auto')
      expect(el.scrollTop).toBe(9910)
      w.vm.scrollToIndex(100, 'auto')
      expect(el.scrollTop).toBe(2000)
      w.vm.scrollToIndex(300, 'auto')
      expect(el.scrollTop).toBe(6000 + 20 - 200)
    })

    it('uses a numeric height prop as viewport and style', async () => {
      clientHeight = 0
      const w = await mountList({ height: 100 })
      expect(w.attributes('style')).toContain('height: 100px')
      expect(rows(w).length).toBe(5 + 4)
    })

    it('applies string heights and measures the viewport', async () => {
      const w = await mountList({ height: '50vh' })
      expect(w.attributes('style')).toContain('height: 50vh')
      expect(rows(w).length).toBe(14)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', async () => {
      const w = await mountList({ class: 'h-96 overflow-hidden' }, { attrs: { id: 'vl', 'data-x': '1' } })
      expect(w.classes()).toContain('h-96')
      expect(w.classes()).toContain('overflow-hidden')
      expect(w.classes()).not.toContain('overflow-auto')
      expect(w.attributes('id')).toBe('vl')
      expect(w.attributes('data-x')).toBe('1')
      expect(w.attributes('data-slot')).toBe('virtual-list')
    })

    it('respects overscan', async () => {
      expect(rows(await mountList({ overscan: 0 })).length).toBe(10)
      expect(rows(await mountList({ overscan: 20 })).length).toBe(30)
      expect(rows(await mountList({ overscan: -3 })).length).toBe(10)
      expect(rows(await mountList({ overscan: NaN })).length).toBe(10)
    })
  })

  describe('0 / 1 items', () => {
    it('renders the empty state for 0 items', async () => {
      const w = await mountList({ items: [] })
      expect(rows(w).length).toBe(0)
      expect(w.find('[data-slot="virtual-list-empty"]').text()).toBe('No items')
      expect(w.attributes('data-count')).toBe('0')
      w.vm.scrollToIndex(5) // no throw
    })

    it('renders custom empty slot', async () => {
      const w = await mountList({ items: [] }, { slots: { empty: 'Nothing here' } })
      expect(w.find('[data-slot="virtual-list-empty"]').text()).toBe('Nothing here')
    })

    it('renders a single item', async () => {
      const w = await mountList({ items: makeItems(1) })
      expect(rows(w).length).toBe(1)
      expect(rows(w)[0].attributes('aria-setsize')).toBe('1')
      w.vm.scrollToIndex(0)
      expect((w.element as HTMLElement).scrollTop).toBe(0)
    })
  })

  describe('bad path', () => {
    it.each([0, -5, NaN, Infinity])('falls back to 32px rows for itemHeight=%s', async (itemHeight) => {
      const w = await mountList({ itemHeight, items: makeItems(100) })
      expect(rows(w)[1].attributes('style')).toContain('top: 32px')
    })

    it('clamps scrollToIndex with out-of-range and NaN indexes', async () => {
      const w = await mountList({ items: makeItems(100) })
      const el = w.element as HTMLElement
      w.vm.scrollToIndex(9999)
      expect(el.scrollTop).toBe(2000 - 200) // max scroll
      w.vm.scrollToIndex(-10)
      expect(el.scrollTop).toBe(0)
      w.vm.scrollToIndex(NaN)
      expect(el.scrollTop).toBe(0)
      w.vm.scrollToIndex(2.9)
      expect(el.scrollTop).toBe(40)
    })

    it('survives items shrinking below the scroll offset', async () => {
      const w = await mountList()
      await scrollTo(w, 100000)
      await w.setProps({ items: makeItems(5) })
      expect(rows(w).length).toBeLessThanOrEqual(5)
      await w.setProps({ items: null as never })
      expect(w.attributes('data-count')).toBe('0')
    })

    it('ignores a late frame after unmount (element gone)', async () => {
      const w = await mountList()
      ;(w.element as HTMLElement).scrollTop = 50
      await w.trigger('scroll')
      const pending = rafCbs.slice()
      w.unmount()
      pending.forEach((cb) => cb(0)) // cancelled; must not throw
    })
  })

  describe('viewport resize and cleanup', () => {
    it('re-measures on ResizeObserver callback', async () => {
      const w = await mountList()
      expect(rows(w).length).toBe(14)
      clientHeight = 400
      roCallbacks.forEach((cb) => cb())
      await nextTick()
      expect(rows(w).length).toBe(24)
    })

    it('disconnects the observer and cancels a pending frame on unmount', async () => {
      const w = await mountList()
      await w.trigger('scroll')
      expect(rafCbs.filter(Boolean).length).toBe(1)
      w.unmount()
      expect(disconnect).toHaveBeenCalled()
      rafCbs.forEach((cb) => cb(0))
      expect(w.emitted('scroll')).toBeUndefined()
    })

    it('works without ResizeObserver / requestAnimationFrame (SSR-ish)', async () => {
      vi.stubGlobal('ResizeObserver', undefined)
      vi.stubGlobal('requestAnimationFrame', undefined)
      const w = await mountList()
      ;(w.element as HTMLElement).scrollTop = 600
      await w.trigger('scroll')
      expect(w.emitted('scroll')?.[0]).toEqual([600])
      w.unmount()
    })
  })

  it('stays fast with 10 000 rapid scroll events', async () => {
    const w = await mountList({ items: makeItems(10000) })
    const el = w.element as HTMLElement
    for (let i = 0; i < 10000; i++) {
      el.scrollTop = i * 7
      el.dispatchEvent(new Event('scroll'))
    }
    expect(rafCbs.length).toBe(1)
    flushRaf()
    await nextTick()
    expect(rows(w).length).toBeLessThanOrEqual(20)
    expect(rows(w).length).toBeGreaterThan(0)
  })

  describe('semantics', () => {
    it('a list with items is a focusable role=list with positioned listitems', async () => {
      const w = await mountList({ items: makeItems(50), itemHeight: 20, height: 100, label: 'Rows' })
      expect(w.attributes('role')).toBe('list')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('aria-label')).toBe('Rows')
      expect(rows(w)[0]!.attributes('aria-setsize')).toBe('50')
      expect(rows(w)[0]!.attributes('aria-posinset')).toBe('1')
    })

    it('an empty list drops role=list (axe aria-required-children) and the tab stop', async () => {
      const w = await mountList({ items: [], itemHeight: 20, height: 100, label: 'Rows' })
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('tabindex')).toBeUndefined()
      expect(w.attributes('aria-label')).toBe('Rows')
      expect(w.find('[role="listitem"]').exists()).toBe(false)
      expect(w.find('[data-slot="virtual-list-empty"]').text()).toBe('No items')
    })

    it('becomes a list again when items arrive', async () => {
      const w = await mountList({ items: [], itemHeight: 20, height: 100 })
      await w.setProps({ items: makeItems(3) } as never)
      expect(w.attributes('role')).toBe('list')
      expect(w.attributes('tabindex')).toBe('0')
    })

    it('uses the shared focus ring (forced-colors safe) instead of removing the outline', async () => {
      const w = await mountList({ items: makeItems(3), itemHeight: 20, height: 100 })
      expect(w.classes()).toContain('outline-hidden')
      expect(w.classes()).not.toContain('focus-visible:outline-none')
      expect(w.classes().join(' ')).toContain('focus-visible:ring-3')
    })
  })
})
