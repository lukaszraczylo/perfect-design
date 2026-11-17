import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { ChatMessage } from '../ChatMessage'
import { ChatThread } from './index'

interface Msg {
  id: number
  text: string
  at?: string
  role?: 'user' | 'assistant'
}
const msgs = (n: number, start = 1): Msg[] => Array.from({ length: n }, (_, i) => ({ id: start + i, text: `Message ${start + i}`, at: '2026-03-02T09:05:00Z', role: i % 2 ? 'assistant' : 'user' }))

/* ---- layout shims: jsdom has no layout, so scroll geometry is driven by these variables ---- */
const geo = { scrollHeight: 0, clientHeight: 0 }
const tops = new WeakMap<Element, number>()
const proto = Element.prototype
const saved: Record<string, PropertyDescriptor | undefined> = {}
let observers: { cb: () => void; disconnect: ReturnType<typeof vi.fn> }[] = []

beforeEach(() => {
  geo.scrollHeight = 0
  geo.clientHeight = 0
  for (const k of ['scrollHeight', 'clientHeight', 'scrollTop']) saved[k] = Object.getOwnPropertyDescriptor(proto, k)
  Object.defineProperty(proto, 'scrollHeight', { configurable: true, get: () => geo.scrollHeight })
  Object.defineProperty(proto, 'clientHeight', { configurable: true, get: () => geo.clientHeight })
  Object.defineProperty(proto, 'scrollTop', {
    configurable: true,
    get(this: Element) {
      return tops.get(this) ?? 0
    },
    set(this: Element, v: number) {
      tops.set(this, Math.max(0, Math.min(v, Math.max(0, this.scrollHeight - geo.clientHeight))))
    },
  })
  observers = []
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      constructor(public cb: () => void) {
        observers.push(this as never)
      }
      observe() {}
      unobserve() {}
    },
  )
})
afterEach(() => {
  for (const [k, d] of Object.entries(saved)) {
    if (d) Object.defineProperty(proto, k, d)
    else delete (proto as unknown as Record<string, unknown>)[k]
  }
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

type Props = Record<string, unknown>
const messageSlot = ({ message }: { message: Msg }) => h(ChatMessage as never, { role: message.role }, () => message.text)
function mk(props: Props = {}, slots: Record<string, unknown> = { message: messageSlot }, attrs: Props = {}) {
  return mount(ChatThread as never, { props: { label: 'Support conversation', messages: msgs(5), itemKey: 'id', ...props } as never, slots: slots as never, attrs, attachTo: document.body }) as VueWrapper
}
const logOf = (w: VueWrapper) => w.find('[data-slot="chat-thread-log"]')
const el = (w: VueWrapper) => logOf(w).element as HTMLElement
const status = (w: VueWrapper) => w.find('[data-slot="chat-thread-status"]')
const jump = (w: VueWrapper) => w.find('[data-slot="chat-thread-jump"]')
async function scrollTo(w: VueWrapper, top: number) {
  el(w).scrollTop = top
  await logOf(w).trigger('scroll')
  await nextTick()
}

describe('ChatThread', () => {
  describe('good path', () => {
    it('renders a named, focusable log with live announcements off', () => {
      const w = mk()
      const log = logOf(w)
      expect(w.attributes('data-slot')).toBe('chat-thread')
      expect(log.attributes('role')).toBe('log')
      expect(log.attributes('tabindex')).toBe('0')
      expect(log.attributes('aria-live')).toBe('off')
      expect(log.attributes('aria-label')).toBe('Support conversation')
      expect(log.classes()).toEqual(expect.arrayContaining(['overflow-y-auto', 'min-w-0', 'flex-1']))
    })

    it('renders each message through the message slot, in order, with index and id', () => {
      const seen: unknown[] = []
      const w = mk({}, { message: (p: { message: Msg; index: number; id: number }) => (seen.push([p.index, p.id]), h('i', { class: 'm' }, p.message.text)) })
      expect(w.findAll('[data-slot="chat-thread-item"]')).toHaveLength(5)
      expect(w.findAll('.m').map((n) => n.text())).toEqual(['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5'])
      expect(seen[0]).toEqual([0, 1])
      expect(w.findAll('[data-slot="chat-thread-item"]')[2].attributes('data-index')).toBe('2')
    })

    it('renders the default slot in static mode', () => {
      const w = mount(ChatThread as never, { props: { label: 'Static' } as never, slots: { default: () => [h(ChatMessage as never, null, () => 'One'), h(ChatMessage as never, null, () => 'Two')] } as never })
      expect(w.findAll('[data-slot="chat-message"]')).toHaveLength(2)
      expect(w.find('[data-slot="chat-thread-empty"]').exists()).toBe(false)
    })

    it('merges class on the root, passes attributes to the log and style to the root', () => {
      const w = mk({ class: 'h-64 custom-x' }, undefined, { id: 'thread-1', 'data-test': 'y', style: 'height: 10px' })
      expect(w.classes()).toEqual(expect.arrayContaining(['h-64', 'custom-x', 'flex-col']))
      expect(logOf(w).attributes('id')).toBe('thread-1')
      expect(logOf(w).attributes('data-test')).toBe('y')
      expect(w.attributes('id')).toBeUndefined()
      expect(w.attributes('style')).toContain('height: 10px')
    })

    it('aria-label and aria-labelledby from attributes name the log', () => {
      const w = mk({ label: undefined }, undefined, { 'aria-label': 'From attribute' })
      expect(logOf(w).attributes('aria-label')).toBe('From attribute')
      const w2 = mk({ label: undefined }, undefined, { 'aria-labelledby': 'heading-1' })
      expect(logOf(w2).attributes('aria-labelledby')).toBe('heading-1')
      expect(logOf(w2).attributes('aria-label')).toBeUndefined()
    })

    it('exposes scroll helpers and the log element', async () => {
      geo.scrollHeight = 1000
      geo.clientHeight = 200
      const w = mk()
      const vm = w.vm as unknown as { scrollToBottom: () => void; scrollToTop: () => void }
      vm.scrollToTop()
      expect(el(w).scrollTop).toBe(0)
      vm.scrollToBottom()
      expect(el(w).scrollTop).toBe(800)
    })
  })

  describe('empty state', () => {
    it('shows the default text and the empty slot', () => {
      expect(mk({ messages: [] }).find('[data-slot="chat-thread-empty"]').text()).toBe('No messages yet')
      const w = mk({ messages: [] }, { message: messageSlot, empty: () => 'Ask the first question' })
      expect(w.find('[data-slot="chat-thread-empty"]').text()).toBe('Ask the first question')
    })

    it('null messages are empty and no default slot is empty', () => {
      expect(mk({ messages: null }, { message: messageSlot }).find('[data-slot="chat-thread-empty"]').exists()).toBe(true)
      expect(mount(ChatThread as never, { props: { label: 'x' } as never }).find('[data-slot="chat-thread-empty"]').exists()).toBe(true)
    })

    it('a translated empty label is used', () => {
      expect(mk({ messages: [], labels: { empty: 'Nichts hier' } }).text()).toContain('Nichts hier')
    })
  })

  describe('keys and days', () => {
    const dated = [
      { id: 'a', text: 'a', at: '2026-03-01T23:30:00Z' },
      { id: 'b', text: 'b', at: '2026-03-02T00:10:00Z' },
      { id: 'c', text: 'c', at: '2026-03-02T09:00:00Z' },
      { id: 'd', text: 'd', at: '2026-02-20T09:00:00Z' },
    ]
    const days = (w: VueWrapper) => w.findAll('[data-slot="chat-thread-day"]')

    it('groups by calendar day, with time elements carrying the ISO day', () => {
      const w = mk({ messages: dated, itemDate: 'at', timeZone: 'UTC', locale: 'en' })
      expect(days(w).map((d) => d.find('time').attributes('datetime'))).toEqual(['2026-03-01', '2026-03-02', '2026-02-20'])
      expect(days(w).map((d) => d.text())).toEqual(['Mar 1, 2026', 'Mar 2, 2026', 'Feb 20, 2026'])
    })

    it('the time zone decides the day', () => {
      const w = mk({ messages: dated.slice(0, 2), itemDate: 'at', timeZone: 'Pacific/Auckland', locale: 'en' })
      expect(days(w)).toHaveLength(1)
    })

    it('says Today and Yesterday relative to now', () => {
      const w = mk({ messages: dated.slice(0, 3), itemDate: 'at', timeZone: 'UTC', locale: 'en', now: '2026-03-02T12:00:00Z' })
      expect(days(w).map((d) => d.text())).toEqual(['Yesterday', 'Today'])
    })

    it('uses the clock after mount when now is not given', async () => {
      vi.useFakeTimers({ now: new Date('2026-03-02T12:00:00Z') })
      const w = mk({ messages: dated.slice(2, 3), itemDate: 'at', timeZone: 'UTC', locale: 'en' })
      await nextTick()
      expect(days(w)[0].text()).toBe('Today')
    })

    it('localises the label', () => {
      const w = mk({ messages: dated.slice(2, 3), itemDate: 'at', timeZone: 'UTC', locale: 'de', now: '2026-03-02T12:00:00Z' })
      expect(days(w)[0].text()).toBe('Heute')
    })

    it('itemDate accepts a function and numbers; items without a valid date join the previous day', () => {
      const items = [{ id: 1, t: Date.UTC(2026, 2, 2, 9) }, { id: 2, t: 'nonsense' }, { id: 3, t: null }, { id: 4, t: Date.UTC(2026, 2, 3, 9) }]
      const w = mk({ messages: items, itemDate: (m: { t: unknown }) => m.t, timeZone: 'UTC', locale: 'en' })
      expect(days(w).map((d) => d.text())).toEqual(['Mar 2, 2026', 'Mar 3, 2026'])
    })

    it('no itemDate means no separators; the day slot replaces the label', () => {
      expect(days(mk({ messages: dated })).length).toBe(0)
      const w = mk({ messages: dated.slice(0, 1), itemDate: 'at', timeZone: 'UTC' }, { message: messageSlot, day: (p: { label: string; date: string }) => h('b', { class: 'dl' }, `${p.date}|${p.label}`) })
      expect(w.find('.dl').text()).toMatch(/^2026-03-01\|/)
    })

    it('keys: property, function, fallback to the index for missing or bad keys', () => {
      const withFn = mk({ messages: msgs(3), itemKey: (m: Msg) => `k${m.id}` })
      expect(withFn.findAll('[data-slot="chat-thread-item"]')).toHaveLength(3)
      const noKey = mk({ messages: msgs(3), itemKey: undefined })
      expect(noKey.findAll('[data-slot="chat-thread-item"]')).toHaveLength(3)
      const badKey = mk({ messages: [{ id: {} }, { id: null }] as never, itemKey: 'id' })
      expect(badKey.findAll('[data-slot="chat-thread-item"]')).toHaveLength(2)
      const prim = mk({ messages: ['one', 'two'] as never, itemKey: 'id' })
      expect(prim.findAll('[data-slot="chat-thread-item"]')).toHaveLength(2)
    })
  })

  describe('size and hostile content', () => {
    it('renders 10 and 1000 items', () => {
      expect(mk({ messages: msgs(10) }).findAll('[data-slot="chat-thread-item"]')).toHaveLength(10)
      const t = performance.now()
      const w = mk({ messages: msgs(1000), itemDate: 'at', timeZone: 'UTC' })
      expect(w.findAll('[data-slot="chat-thread-item"]')).toHaveLength(1000)
      expect(w.findAll('[data-slot="chat-thread-day"]')).toHaveLength(1)
      expect(performance.now() - t).toBeLessThan(15000)
    })

    it('hostile message text, labels and announcements stay text', async () => {
      vi.useFakeTimers()
      const evil = '<img src=x onerror="window.__pwn=1"><script>window.__pwn=2</script>'
      const w = mk({ messages: [{ id: 1, text: evil, role: 'user' }], labels: { typing: evil, jump: evil, loadOlder: evil, empty: evil }, typing: true, canLoadOlder: true }, { message: ({ message }: { message: Msg }) => h(ChatMessage as never, { role: message.role }, () => message.text) })
      await w.setProps({ announcement: evil })
      vi.advanceTimersByTime(1100)
      await nextTick()
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('script').exists()).toBe(false)
      expect(w.text()).toContain('<img src=x')
      expect(status(w).text()).toBe(evil)
      expect((window as unknown as { __pwn?: number }).__pwn).toBeUndefined()
    })

    it('right-to-left text and container render with logical classes only', () => {
      const w = mk({ messages: [{ id: 1, text: 'مرحبا بالعالم', at: '2026-03-02T09:00:00Z' }], itemDate: 'at', timeZone: 'UTC', locale: 'ar' })
      expect(w.text()).toContain('مرحبا')
      expect(w.html()).not.toMatch(/\b(?:ml|mr|pl|pr)-\d|text-(?:left|right)|\b(?:left|right)-\d/)
    })

    it('unknown density falls back', () => {
      expect(mk({ density: 'huge' }).html()).toBe(mk().html())
    })
  })

  describe('follow', () => {
    beforeEach(() => {
      geo.scrollHeight = 1000
      geo.clientHeight = 200
    })

    it('starts at the latest message and shows no jump button', async () => {
      const w = mk()
      expect(el(w).scrollTop).toBe(800)
      expect(jump(w).exists()).toBe(false)
      expect(w.attributes('data-following')).toBeDefined()
    })

    it('stays at the bottom when messages arrive while the reader is at the bottom', async () => {
      const w = mk()
      geo.scrollHeight = 1300
      await w.setProps({ messages: msgs(6) })
      await nextTick()
      expect(el(w).scrollTop).toBe(1100)
    })

    it('follows content that grows without a new message (streaming) through the resize observer', async () => {
      const w = mk()
      geo.scrollHeight = 1400
      observers[0].cb()
      expect(el(w).scrollTop).toBe(1200)
    })

    it('scrolling up stops following, shows the jump button and keeps the position', async () => {
      const w = mk()
      const changes = w.emitted('follow-change') ?? []
      await scrollTo(w, 100)
      expect(jump(w).exists()).toBe(true)
      expect(w.emitted('follow-change')?.at(-1)).toEqual([false])
      expect(changes.length).toBeLessThanOrEqual(1)
      geo.scrollHeight = 1300
      await w.setProps({ messages: msgs(6) })
      await nextTick()
      expect(el(w).scrollTop).toBe(100)
    })

    it('counts messages that arrive while scrolled up in the button', async () => {
      const w = mk()
      await scrollTo(w, 100)
      expect(jump(w).text()).toBe('Jump to latest')
      await w.setProps({ messages: msgs(8) })
      expect(jump(w).text()).toBe('Jump to latest (3 new)')
    })

    it('the jump button is focusable, restores following and returns focus to the log', async () => {
      const w = mk()
      await scrollTo(w, 100)
      const btn = jump(w)
      expect((btn.element as HTMLButtonElement).tabIndex).toBe(0)
      expect(btn.element.tagName).toBe('BUTTON')
      ;(btn.element as HTMLElement).focus()
      expect(document.activeElement).toBe(btn.element)
      await btn.trigger('click')
      await flushPromises()
      expect(el(w).scrollTop).toBe(800)
      expect(jump(w).exists()).toBe(false)
      expect(document.activeElement).toBe(el(w))
      expect(w.emitted('follow-change')?.at(-1)).toEqual([true])
    })

    it('reaching the bottom by hand resumes following and clears the count', async () => {
      const w = mk()
      await scrollTo(w, 100)
      await w.setProps({ messages: msgs(7) })
      await scrollTo(w, 800)
      expect(jump(w).exists()).toBe(false)
      await scrollTo(w, 100)
      expect(jump(w).text()).not.toContain('new')
    })

    it('follow off: no scrolling, no button, no state attribute', async () => {
      const w = mk({ follow: false })
      expect(el(w).scrollTop).toBe(0)
      await scrollTo(w, 100)
      expect(jump(w).exists()).toBe(false)
      expect(w.attributes('data-following')).toBeUndefined()
      geo.scrollHeight = 1300
      await w.setProps({ messages: msgs(6) })
      expect(el(w).scrollTop).toBe(100)
    })

    it('the translated jump and unread labels are used', async () => {
      const w = mk({ labels: { jump: 'Zum Ende', unread: (n: number) => `${n} neu` } })
      await scrollTo(w, 100)
      await w.setProps({ messages: msgs(6) })
      expect(jump(w).text()).toBe('Zum Ende (1 neu)')
    })

    it('Home and End move to the first and last message; modifiers and other targets are left alone', async () => {
      const w = mk()
      await logOf(w).trigger('keydown', { key: 'Home' })
      expect(el(w).scrollTop).toBe(0)
      expect(jump(w).exists()).toBe(true)
      await logOf(w).trigger('keydown', { key: 'End' })
      await nextTick()
      expect(el(w).scrollTop).toBe(800)
      expect(jump(w).exists()).toBe(false)
      el(w).scrollTop = 50
      for (const mod of [{ shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) await logOf(w).trigger('keydown', { key: 'End', ...mod })
      expect(el(w).scrollTop).toBe(50)
      await logOf(w).trigger('keydown', { key: 'PageDown' })
      expect(el(w).scrollTop).toBe(50)
      const inner = w.find('[data-slot="chat-thread-item"]')
      await inner.trigger('keydown', { key: 'End' })
      expect(el(w).scrollTop).toBe(50)
    })

    it('no layout at all (jsdom defaults) never shows the button', async () => {
      geo.scrollHeight = 0
      geo.clientHeight = 0
      const w = mk()
      await scrollTo(w, 0)
      expect(jump(w).exists()).toBe(false)
    })
  })

  describe('typing indicator', () => {
    it('shows a text label, marks the log busy and uses motion-safe pulse', () => {
      const w = mk({ typing: true })
      const ind = w.find('[data-slot="chat-thread-typing"]')
      expect(ind.text()).toBe('Replying')
      expect(logOf(w).attributes('aria-busy')).toBe('true')
      const indicator = ind.find('[data-slot="typing-indicator"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.attributes('role')).toBeUndefined()
      expect(indicator.find('[data-slot="typing-indicator-dot"]').classes()).toContain('motion-reduce:animate-none')
    })

    it('a string names who is typing, announced once, and is the last row', async () => {
      const w = mk({ typing: 'Mira', messages: msgs(2) }, { message: messageSlot })
      const ind = w.find('[data-slot="chat-thread-typing"]')
      expect(ind.text()).toBe('Mira is typing')
      expect(logOf(w).attributes('aria-busy')).toBe('true')
      expect(w.findAll('[data-slot="chat-thread-content"] > *').at(-1)?.attributes('data-slot')).toBe('chat-thread-typing')
      await w.setProps({ typing: false })
      expect(w.find('[data-slot="chat-thread-typing"]').exists()).toBe(false)
    })

    it('a blank string shows nothing and typingBy translates the name', () => {
      expect(mk({ typing: '  ' }).find('[data-slot="chat-thread-typing"]').exists()).toBe(false)
      expect(mk({ typing: 'Mira', labels: { typingBy: (n: string) => `${n} schreibt` } }).find('[data-slot="chat-thread-typing"]').text()).toBe('Mira schreibt')
    })

    it('announces the named typing label through the thread status region', async () => {
      vi.useFakeTimers()
      const w = mk()
      await w.setProps({ typing: 'Mira' })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('Mira is typing')
      w.unmount()
    })

    it('is absent when off and replaceable by the typing slot and labels', () => {
      const off = mk()
      expect(off.find('[data-slot="chat-thread-typing"]').exists()).toBe(false)
      expect(logOf(off).attributes('aria-busy')).toBeUndefined()
      expect(mk({ typing: true }, { message: messageSlot, typing: () => 'Custom typing' }).find('[data-slot="chat-thread-typing"]').text()).toBe('Custom typing')
      expect(mk({ typing: true, labels: { typing: 'Writing' } }).find('[data-slot="chat-thread-typing"]').text()).toBe('Writing')
    })
  })

  describe('older messages', () => {
    it('no control unless canLoadOlder', () => {
      expect(mk().find('[data-slot="chat-thread-older"]').exists()).toBe(false)
    })

    it('the button emits load-older once per press and shows the loading text and state', async () => {
      const w = mk({ canLoadOlder: true })
      const btn = w.find('[data-slot="chat-thread-older"] button')
      expect(btn.text()).toBe('Load older messages')
      await btn.trigger('click')
      expect(w.emitted('load-older')).toHaveLength(1)
      await w.setProps({ loadingOlder: true })
      const busy = w.find('[data-slot="chat-thread-older"] button')
      expect(busy.text()).toBe('Loading older messages')
      expect(busy.attributes('disabled')).toBeDefined()
      expect(busy.attributes('aria-busy')).toBe('true')
      await busy.trigger('click')
      expect(w.emitted('load-older')).toHaveLength(1)
    })

    it('the load-older slot gets loading and load', async () => {
      const w = mk({ canLoadOlder: true }, { message: messageSlot, 'load-older': (p: { loading: boolean; load: () => void }) => h('button', { class: 'own', onClick: p.load }, p.loading ? 'wait' : 'more') })
      await w.find('.own').trigger('click')
      expect(w.emitted('load-older')).toHaveLength(1)
    })

    it('autoLoadOlder emits once at the top and not again until the load finishes', async () => {
      geo.scrollHeight = 1000
      geo.clientHeight = 200
      const w = mk({ canLoadOlder: true, autoLoadOlder: true })
      await scrollTo(w, 300)
      expect(w.emitted('load-older')).toBeUndefined()
      await scrollTo(w, 0)
      await scrollTo(w, 0)
      await scrollTo(w, 1)
      expect(w.emitted('load-older')).toHaveLength(1)
      await w.setProps({ loadingOlder: true })
      await scrollTo(w, 0)
      expect(w.emitted('load-older')).toHaveLength(1)
      await w.setProps({ loadingOlder: false })
      await scrollTo(w, 0)
      expect(w.emitted('load-older')).toHaveLength(2)
    })

    it('autoLoadOlder does nothing without canLoadOlder or when off', async () => {
      geo.scrollHeight = 1000
      geo.clientHeight = 200
      const a = mk({ canLoadOlder: false, autoLoadOlder: true })
      await scrollTo(a, 0)
      const b = mk({ canLoadOlder: true, autoLoadOlder: false })
      await scrollTo(b, 0)
      expect(a.emitted('load-older')).toBeUndefined()
      expect(b.emitted('load-older')).toBeUndefined()
    })

    it('turning canLoadOlder off and on again allows a new automatic request', async () => {
      geo.scrollHeight = 1000
      geo.clientHeight = 200
      const w = mk({ canLoadOlder: true, autoLoadOlder: true })
      await scrollTo(w, 0)
      await w.setProps({ canLoadOlder: false })
      await w.setProps({ canLoadOlder: true })
      await scrollTo(w, 0)
      expect(w.emitted('load-older')).toHaveLength(2)
    })

    it('keeps the reader in place when older messages are prepended', async () => {
      // Content height follows the number of rendered rows (100px each), so the height changes between the two renders.
      Object.defineProperty(proto, 'scrollHeight', { configurable: true, get: function (this: Element) { return this.querySelectorAll('[data-slot="chat-thread-item"]').length * 100 } })
      geo.clientHeight = 200
      const w = mk({ messages: msgs(5, 10) })
      await scrollTo(w, 100)
      await w.setProps({ messages: [...msgs(3, 1), ...msgs(5, 10)] })
      await nextTick()
      expect(el(w).scrollTop).toBe(400)
    })

    it('appending does not shift the reader', async () => {
      Object.defineProperty(proto, 'scrollHeight', { configurable: true, get: function (this: Element) { return this.querySelectorAll('[data-slot="chat-thread-item"]').length * 100 } })
      geo.clientHeight = 200
      const w = mk({ messages: msgs(5, 10) })
      await scrollTo(w, 100)
      await w.setProps({ messages: [...msgs(5, 10), ...msgs(2, 20)] })
      await nextTick()
      expect(el(w).scrollTop).toBe(100)
    })
  })

  describe('announcements', () => {
    beforeEach(() => vi.useFakeTimers())

    it('is one polite status region outside the log', () => {
      const w = mk()
      const st = status(w)
      expect(st.attributes('role')).toBe('status')
      expect(st.classes()).toContain('sr-only')
      expect(logOf(w).element.contains(st.element)).toBe(false)
      expect(st.text()).toBe('')
    })

    it('says nothing for the first render or for older messages added at the top', async () => {
      const w = mk({ messages: msgs(5, 10) })
      vi.advanceTimersByTime(3000)
      expect(status(w).text()).toBe('')
      await w.setProps({ messages: [...msgs(3, 1), ...msgs(5, 10)] })
      vi.advanceTimersByTime(3000)
      await nextTick()
      expect(status(w).text()).toBe('')
    })

    it('announces one summary for a burst, not one per message, and never message text', async () => {
      const w = mk({ messages: [{ id: 1, text: 'Secret streamed words' }] })
      await w.setProps({ messages: msgs(2) })
      vi.advanceTimersByTime(300)
      await w.setProps({ messages: msgs(3) })
      vi.advanceTimersByTime(300)
      await w.setProps({ messages: msgs(4) })
      expect(status(w).text()).toBe('')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('3 new messages')
      expect(status(w).text()).not.toContain('Message')
    })

    it('uses the singular for one message and clears the region later so the next one is heard', async () => {
      const w = mk({ messages: msgs(1) })
      await w.setProps({ messages: msgs(2) })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('1 new message')
      vi.advanceTimersByTime(5000)
      await nextTick()
      expect(status(w).text()).toBe('')
      await w.setProps({ messages: msgs(3) })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('1 new message')
    })

    it('does not announce a replaced conversation', async () => {
      const w = mk({ messages: msgs(3) })
      await w.setProps({ messages: msgs(50, 100) })
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(status(w).text()).toBe('')
    })

    it('announces the typing label once when the indicator appears, not when it goes', async () => {
      const w = mk()
      await w.setProps({ typing: true })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('Replying')
      vi.advanceTimersByTime(5000)
      await nextTick()
      await w.setProps({ typing: false })
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(status(w).text()).toBe('')
    })

    it('a message and typing together announce the message summary', async () => {
      const w = mk({ messages: msgs(1) })
      await w.setProps({ typing: true, messages: msgs(2) })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('1 new message')
    })

    it('announcement text wins and blank text is ignored', async () => {
      const w = mk({ messages: msgs(1) })
      await w.setProps({ announcement: '   ' })
      vi.advanceTimersByTime(2000)
      expect(status(w).text()).toBe('')
      await w.setProps({ announcement: 'Reply received', messages: msgs(2) })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('Reply received')
    })

    it('newMessages can be translated', async () => {
      const w = mk({ messages: msgs(1), labels: { newMessages: (n: number) => `${n} neue` } })
      await w.setProps({ messages: msgs(3) })
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(status(w).text()).toBe('2 neue')
    })

    it('unmounting cancels pending timers and disconnects the observer', async () => {
      const w = mk({ messages: msgs(1) })
      await w.setProps({ messages: msgs(2) })
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      const ro = observers[0]
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
      expect(ro.disconnect).toHaveBeenCalled()
    })
  })
})

describe('ChatThread contract', () => {
  const errors: Error[] = []
  let wrapper: VueWrapper | undefined
  const open = async (props: Props, slots: Record<string, unknown> = {}, attrs: Props = {}) => {
    wrapper = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          const shown = ref(true)
          return () => (shown.value ? h(ChatThread as never, { ...props, ...attrs }, slots) : null)
        },
      }),
      { attachTo: document.body },
    )
    await flushPromises()
    await nextTick()
  }
  beforeEach(() => {
    errors.length = 0
    configureStrictMode('throw')
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    configureStrictMode('off')
  })

  it('throws a ContractError when the log has no accessible name', async () => {
    await open({}, { default: () => 'x' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ChatThread')
    expect(errors[0].message).toContain('accessible name')
    expect(errors[0].message).toContain('aria-labelledby')
  })

  it('accepts label, aria-label and aria-labelledby', async () => {
    await open({ label: 'Thread' }, { default: () => 'x' })
    wrapper?.unmount()
    await open({}, { default: () => 'x' }, { 'aria-label': 'Thread' })
    wrapper?.unmount()
    await open({}, { default: () => 'x' }, { 'aria-labelledby': 'h1' })
    expect(errors).toHaveLength(0)
  })

  it('throws a ContractError when messages is set without a message slot, and accepts the slot', async () => {
    await open({ label: 'Thread', messages: msgs(2) })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('needs a `message` slot')
    errors.length = 0
    wrapper?.unmount()
    await open({ label: 'Thread', messages: msgs(2) }, { message: () => 'x' })
    expect(errors).toHaveLength(0)
  })

  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({}, { default: () => 'x' })
    expect(errors).toHaveLength(0)
    expect(spy).toHaveBeenCalled()
    spy.mockClear()
    wrapper?.unmount()
    configureStrictMode('off')
    await open({}, { default: () => 'x' })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
