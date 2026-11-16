import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import TableOfContents, { type TocItem } from './TableOfContents.vue'

class FakeIO {
  static instances: FakeIO[] = []
  observed: Element[] = []
  disconnected = false
  constructor(
    public cb: (entries: Partial<IntersectionObserverEntry>[]) => void,
    public opts?: IntersectionObserverInit,
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
  fire(ids: Record<string, boolean>) {
    this.cb(Object.entries(ids).map(([id, isIntersecting]) => ({ target: document.getElementById(id)!, isIntersecting })))
  }
}

let wrapper: VueWrapper | undefined
const items: TocItem[] = [
  { id: 'intro', label: 'Intro', level: 2 },
  { id: 'setup', label: 'Setup', level: 2 },
  { id: 'deep', label: 'Deep dive', level: 3 },
  { id: 'end', label: 'The end', level: 2 },
]
function addHeadings(ids = items.map((i) => i.id)) {
  for (const id of ids) {
    const h = document.createElement('h2')
    h.id = id
    document.body.appendChild(h)
  }
}
async function make(props: Record<string, unknown> = {}) {
  wrapper = mount(TableOfContents, { props: { items, ...props }, attachTo: document.body })
  await flushPromises()
  return wrapper
}
const nav = () => document.body.querySelector('[data-slot="table-of-contents"]')!
const links = () => [...document.body.querySelectorAll<HTMLAnchorElement>('[data-slot="table-of-contents-link"]')]
const active = () => links().filter((l) => l.getAttribute('aria-current') === 'location').map((l) => l.textContent)

beforeEach(() => {
  FakeIO.instances = []
  vi.stubGlobal('IntersectionObserver', FakeIO)
  history.replaceState(null, '', '/')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('TableOfContents', () => {
  describe('good path', () => {
    it('renders a labelled nav with a heading and one link per item', async () => {
      addHeadings()
      await make()
      expect(nav().tagName).toBe('NAV')
      expect(nav().getAttribute('aria-label')).toBe('On this page')
      expect(document.body.querySelector('[data-slot="table-of-contents-title"]')?.textContent).toBe('On this page')
      expect(links().map((l) => l.getAttribute('href'))).toEqual(['#intro', '#setup', '#deep', '#end'])
    })

    it('indents deeper levels relative to the shallowest one', async () => {
      await make()
      expect(links().map((l) => l.className.match(/ps-\d+/)![0])).toEqual(['ps-3', 'ps-3', 'ps-6', 'ps-3'])
    })

    it('tracks the active section with IntersectionObserver', async () => {
      addHeadings()
      await make()
      const io = FakeIO.instances.at(-1)!
      expect(io.observed).toHaveLength(4)
      expect(io.opts?.rootMargin).toBe('-80px 0px -60% 0px')
      io.fire({ setup: true })
      await flushPromises()
      expect(active()).toEqual(['Setup'])
      expect(wrapper!.emitted('update:modelValue')!.at(-1)).toEqual(['setup'])
    })

    it('with several visible sections the first in document order wins; leaving all keeps the last active', async () => {
      addHeadings()
      await make()
      const io = FakeIO.instances.at(-1)!
      io.fire({ deep: true, setup: true })
      await flushPromises()
      expect(active()).toEqual(['Setup'])
      io.fire({ setup: false })
      await flushPromises()
      expect(active()).toEqual(['Deep dive'])
      io.fire({ deep: false })
      await flushPromises()
      expect(active()).toEqual(['Deep dive'])
    })

    it('click scrolls to the target, updates the hash, activates and emits select', async () => {
      addHeadings()
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      await make()
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
      links()[1].dispatchEvent(ev)
      await flushPromises()
      expect(ev.defaultPrevented).toBe(true)
      expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(location.hash).toBe('#setup')
      expect(active()).toEqual(['Setup'])
      expect(wrapper!.emitted('select')![0]).toEqual(['setup'])
    })

    it('uses instant scrolling when smooth=false or the user prefers reduced motion', async () => {
      addHeadings()
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      await make({ smooth: false })
      links()[0].click()
      expect(spy).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' })
      wrapper!.unmount()
      const mm = vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ matches: true }) as MediaQueryList)
      await make()
      links()[0].click()
      expect(spy).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'start' })
      mm.mockRestore()
    })

    it('reads the initial active section from the URL hash', async () => {
      addHeadings()
      history.replaceState(null, '', '/#deep')
      await make()
      expect(active()).toEqual(['Deep dive'])
    })

    it('controlled modelValue wins over tracked state', async () => {
      addHeadings()
      await make({ modelValue: 'end' })
      expect(active()).toEqual(['The end'])
      FakeIO.instances.at(-1)!.fire({ intro: true })
      await flushPromises()
      expect(active()).toEqual(['The end'])
      await wrapper!.setProps({ modelValue: 'intro' })
      expect(active()).toEqual(['Intro'])
    })
  })

  describe('customisation', () => {
    it('merges class and passes attrs', async () => {
      await make({ class: 'w-64 custom-x' })
      expect(nav().className).toContain('custom-x')
      wrapper!.unmount()
      wrapper = mount(TableOfContents, { props: { items }, attrs: { id: 'toc' }, attachTo: document.body })
      expect(document.getElementById('toc')).not.toBeNull()
    })

    it('custom title; empty title hides it and falls back for aria-label', async () => {
      await make({ title: 'Contents' })
      expect(nav().getAttribute('aria-label')).toBe('Contents')
      wrapper!.unmount()
      await make({ title: '' })
      expect(document.body.querySelector('[data-slot="table-of-contents-title"]')).toBeNull()
      expect(nav().getAttribute('aria-label')).toBe('Table of contents')
    })

    it('offset feeds the observer root margin', async () => {
      addHeadings()
      await make({ offset: 120 })
      expect(FakeIO.instances.at(-1)!.opts?.rootMargin).toBe('-120px 0px -60% 0px')
    })
  })

  describe('bad path', () => {
    it('empty, missing or invalid items render an empty list', async () => {
      await make({ items: [] })
      expect(links()).toHaveLength(0)
      wrapper!.unmount()
      await make({ items: null })
      expect(links()).toHaveLength(0)
    })

    it('skips items with missing/empty ids or non-string labels', async () => {
      await make({ items: [null, { label: 'no id' }, { id: '', label: 'empty' }, { id: 'a', label: 5 }, { id: 'ok', label: 'OK' }] })
      expect(links().map((l) => l.textContent)).toEqual(['OK'])
    })

    it('headings that do not exist in the page: no observer, click falls through to native navigation', async () => {
      await make()
      expect(FakeIO.instances).toHaveLength(0)
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
      links()[0].dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      await flushPromises()
      expect(active()).toEqual(['Intro'])
    })

    it('invalid levels count as the shallowest level', async () => {
      await make({ items: [{ id: 'a', label: 'A', level: 99 }, { id: 'b', label: 'B', level: 'x' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D', level: 2 }] })
      expect(links().every((l) => l.className.includes('ps-3'))).toBe(true)
    })

    it('follows hashchange, emits update:modelValue and stops listening after unmount', async () => {
      addHeadings()
      history.replaceState(null, '', '/')
      const w = await make()
      history.replaceState(null, '', '/#setup')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      await flushPromises()
      expect(active()).toEqual(['Setup'])
      expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['setup'])
      const remove = vi.spyOn(window, 'removeEventListener')
      w.unmount()
      wrapper = undefined
      expect(remove.mock.calls.some(([type]) => type === 'hashchange')).toBe(true)
    })

    it('a malformed percent escape in the hash does not throw', async () => {
      history.replaceState(null, '', '/#%E0%A4%A')
      await expect(make()).resolves.toBeDefined()
    })

    it('hash pointing at an unknown id is ignored', async () => {
      history.replaceState(null, '', '/#nope')
      await make()
      expect(active()).toEqual([])
    })
  })

  describe('graceful fallback', () => {
    it('works without IntersectionObserver', async () => {
      vi.stubGlobal('IntersectionObserver', undefined)
      addHeadings()
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      await make()
      expect(active()).toEqual([])
      links()[2].click()
      await flushPromises()
      expect(active()).toEqual(['Deep dive'])
      expect(spy).toHaveBeenCalled()
    })

    it('survives history.replaceState throwing', async () => {
      addHeadings()
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      vi.spyOn(history, 'replaceState').mockImplementation(() => {
        throw new Error('sandboxed')
      })
      await make()
      links()[0].click()
      await flushPromises()
      expect(active()).toEqual(['Intro'])
    })
  })

  describe('edge cases', () => {
    it('unmount disconnects the observer', async () => {
      addHeadings()
      await make()
      const io = FakeIO.instances.at(-1)!
      wrapper!.unmount()
      wrapper = undefined
      expect(io.disconnected).toBe(true)
    })

    it('changing items re-creates the observer and disconnects the old one', async () => {
      addHeadings()
      await make()
      const first = FakeIO.instances.at(-1)!
      await wrapper!.setProps({ items: items.slice(0, 2) })
      await flushPromises()
      expect(first.disconnected).toBe(true)
      expect(FakeIO.instances.at(-1)!.observed).toHaveLength(2)
    })

    it('rapid clicks end on the last clicked item', async () => {
      addHeadings()
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      await make()
      for (const i of [0, 1, 2, 3, 1]) links()[i].click()
      await flushPromises()
      expect(active()).toEqual(['Setup'])
    })

    it('very long labels and 1000 items render', async () => {
      const long = 'Ж'.repeat(400)
      const many = Array.from({ length: 1000 }, (_, i) => ({ id: `s${i}`, label: i === 0 ? long : `S${i}`, level: 2 + (i % 3) }))
      await make({ items: many })
      expect(links()).toHaveLength(1000)
      expect(links()[0].textContent).toBe(long)
    })

    it('negative offset is treated as 0', async () => {
      addHeadings()
      await make({ offset: -50 })
      expect(FakeIO.instances.at(-1)!.opts?.rootMargin).toBe('-0px 0px -60% 0px')
    })
  })
})
