import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import RelativeTime from './RelativeTime.vue'
import { clockStats } from './clock'
import * as barrel from '../index'
import { RelativeTime as Exported, formatRelative, relativeTimeVariants, selectUnit } from './index'

const NOW = '2025-06-15T12:00:00Z'
const NOW_MS = Date.parse(NOW)
const ws = (s: string) => s.replace(/\s/g, ' ')
const rt = (props: Record<string, unknown> = {}) => mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', now: NOW, ...props } as never })

describe('RelativeTime', () => {
  describe('good path', () => {
    it('renders a time element with datetime, data-slot and relative text', () => {
      const w = rt()
      expect(w.element.tagName).toBe('TIME')
      expect(w.attributes('data-slot')).toBe('relative-time')
      expect(w.attributes('datetime')).toBe('2025-06-15T11:57:00.000Z')
      expect(w.text()).toBe('3 minutes ago')
      expect(w.attributes('data-state')).toBe('relative')
    })
    it('future moments', () => expect(rt({ datetime: '2025-06-15T12:03:00Z' }).text()).toBe('in 3 minutes'))
    it('accepts Date, epoch ms and ISO strings for datetime and now', () => {
      expect(rt({ datetime: new Date(NOW_MS - 3_600_000), now: new Date(NOW_MS) }).text()).toBe('1 hour ago')
      expect(rt({ datetime: NOW_MS - 7_200_000, now: NOW_MS }).text()).toBe('2 hours ago')
      expect(rt({ datetime: '2025-06-13', now: NOW }).text()).toBe('2 days ago')
    })
    it('numeric, unitStyle, minUnit and maxUnit', () => {
      expect(rt({ datetime: '2025-06-14T12:00:00Z' }).text()).toBe('yesterday')
      expect(rt({ datetime: '2025-06-14T12:00:00Z', numeric: 'always' }).text()).toBe('1 day ago')
      expect(rt({ unitStyle: 'narrow' }).text()).toBe('3m ago')
      expect(rt({ unitStyle: 'short' }).text()).toBe('3 min. ago')
      expect(rt({ datetime: '2025-06-15T11:59:40Z', minUnit: 'minute' }).text()).toBe('this minute')
      expect(rt({ datetime: '2025-01-01T12:00:00Z', maxUnit: 'day' }).text()).toBe('165 days ago')
    })
    it('reacts to prop changes', async () => {
      const w = rt()
      await w.setProps({ datetime: '2025-06-15T09:00:00Z' })
      expect(w.text()).toBe('3 hours ago')
      await w.setProps({ now: '2025-06-15T13:00:00Z' })
      expect(w.text()).toBe('4 hours ago')
      await w.setProps({ locale: 'de' })
      expect(w.text()).toBe('vor 4 Stunden')
    })
    it('matches formatRelative', () => expect(rt().text()).toBe(formatRelative('2025-06-15T11:57:00Z', NOW)))
    it('does not read the clock with a pinned now', () => {
      const spy = vi.spyOn(Date, 'now')
      rt()
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('title', () => {
    it('shows the absolute date by default', () => expect(ws(rt({ timeZone: 'UTC' }).attributes('title') ?? '')).toBe('Jun 15, 2025, 11:57 AM'))
    it('showTitle false removes it', () => expect(rt({ showTitle: false }).attributes('title')).toBeUndefined())
    it('dateStyle, timeStyle and timeZone', () => {
      expect(rt({ timeZone: 'UTC', dateStyle: 'short', timeStyle: 'none' }).attributes('title')).toBe('6/15/25')
      expect(ws(rt({ timeZone: 'Asia/Tokyo' }).attributes('title') ?? '')).toBe('Jun 15, 2025, 8:57 PM')
    })
    it('a title attribute from the consumer wins', () => expect(mount(RelativeTime, { props: { datetime: NOW, now: NOW }, attrs: { title: 'Mine' } }).attributes('title')).toBe('Mine'))
    it('invalid input has no title', () => expect(rt({ datetime: 'nope' }).attributes('title')).toBeUndefined())
  })

  describe('invalid and hostile input', () => {
    it.each([
      'nope', '', '   ', 'foo 1', '<script>alert(1)</script>', 'x'.repeat(5000),
      NaN, Infinity, -Infinity, 1e20, -1e20, Number.MAX_VALUE,
      new Date(NaN), new Date(8.64e15 + 1),
      null, undefined, true, {}, [], 5n,
    ])('%s renders the fallback without throwing', (datetime) => {
      const w = rt({ datetime })
      expect(w.text()).toBe('Unknown time')
      expect(w.attributes('data-state')).toBe('invalid')
      expect(w.attributes('datetime')).toBeUndefined()
      expect(w.element.tagName).toBe('TIME')
    })
    it('custom and empty fallback', () => {
      expect(rt({ datetime: 'nope', fallback: 'No date' }).text()).toBe('No date')
      expect(rt({ datetime: 'nope', fallback: '' }).text()).toBe('')
    })
    it('escapes hostile fallback text', () => {
      const w = rt({ datetime: 'nope', fallback: '<img src=x onerror=alert(1)>' })
      expect(w.find('img').exists()).toBe(false)
      expect(w.text()).toBe('<img src=x onerror=alert(1)>')
    })
    it('an invalid now falls back to the clock after mount, not to an error', async () => {
      vi.useFakeTimers({ now: NOW_MS })
      const w = rt({ now: 'garbage' })
      await nextTick()
      expect(w.text()).toBe('3 minutes ago')
      w.unmount()
      vi.useRealTimers()
    })
    it('extreme valid dates render', () => {
      expect(rt({ datetime: 8.64e15, now: -8.64e15 }).text()).toMatch(/^in .+ years$/)
      expect(rt({ datetime: -8.64e15, now: 8.64e15 }).text()).toMatch(/ years ago$/)
    })
    it('bad locale, timezone, styles never throw', () => {
      const w = rt({ locale: 'bad_tag', timeZone: 'Mars/Base', dateStyle: 'x', timeStyle: 'y', numeric: 'z', unitStyle: 'q', minUnit: 'w', maxUnit: 'v' })
      expect(w.text()).toBe('3 minutes ago')
      expect(w.attributes('lang')).toBe('en')
    })
  })

  describe('right to left', () => {
    it('Arabic locale writes Arabic text with lang and dir=auto', () => {
      const w = rt({ locale: 'ar' })
      expect(w.text()).toMatch(/[؀-ۿ]/)
      expect(w.attributes('lang')).toBe('ar')
      expect(w.attributes('dir')).toBe('auto')
    })
    it('a consumer dir wins', () => expect(mount(RelativeTime, { props: { datetime: NOW, now: NOW }, attrs: { dir: 'rtl' } }).attributes('dir')).toBe('rtl'))
    it('works inside an rtl parent', () => {
      const Host = defineComponent({ render: () => h('div', { dir: 'rtl' }, [h(RelativeTime, { datetime: '2025-06-15T11:57:00Z', now: NOW, locale: 'he' })]) })
      expect(mount(Host).find('time').text()).toMatch(/[֐-׿]/)
    })
    it('uses no physical left/right classes', () => expect(rt({ variant: 'dotted' }).classes().join(' ')).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/))
  })

  describe('customisation', () => {
    it('class wins', () => {
      const c = rt({ class: 'tabular-nums-off text-lg', size: 'xs' }).classes()
      expect(c).toContain('text-lg')
      expect(c).not.toContain('text-xs')
    })
    it('attributes and listeners fall through', async () => {
      let n = 0
      const w = mount(RelativeTime, { props: { datetime: NOW, now: NOW }, attrs: { id: 't1', 'data-x': 'y', onClick: () => n++ } })
      expect(w.attributes('id')).toBe('t1')
      expect(w.attributes('data-x')).toBe('y')
      await w.trigger('click')
      expect(n).toBe(1)
    })
    it('has no `style` prop (the Intl style option is unitStyle)', () => {
      const props = Object.keys((RelativeTime as unknown as { props: object }).props)
      expect(props).not.toContain('style')
      expect(props).toContain('unitStyle')
    })
  })

  describe('clock, hydration and live updates', () => {
    beforeEach(() => vi.useFakeTimers({ now: NOW_MS }))
    afterEach(() => {
      expect(clockStats().subscribers).toBe(0)
      vi.useRealTimers()
    })

    const App = (props: Record<string, unknown>) => defineComponent({ render: () => h('div', [h(RelativeTime, props as never)]) })

    it('server render shows the absolute date in UTC and never reads the clock', async () => {
      const spy = vi.spyOn(Date, 'now')
      const html = await renderToString(createSSRApp(App({ datetime: '2025-06-15T11:57:00Z' })))
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
      expect(ws(html)).toContain('>Jun 15, 2025, 11:57 AM</time>')
      expect(html).toContain('data-state="absolute"')
      expect(html).toContain('datetime="2025-06-15T11:57:00.000Z"')
      expect(ws(html)).toContain('title="Jun 15, 2025, 11:57 AM"')
      expect(html).not.toContain('minutes ago')
    })

    it('server render with now is already relative and identical to the client', async () => {
      const props = { datetime: '2025-06-15T11:57:00Z', now: NOW }
      const html = await renderToString(createSSRApp(App(props)))
      expect(html).toContain('>3 minutes ago</time>')
      const w = mount(App(props))
      expect(w.find('time').text()).toBe('3 minutes ago')
    })

    it('hydrates the server markup without a mismatch, then switches to relative text', async () => {
      const props = { datetime: '2025-06-15T11:57:00Z' }
      const html = await renderToString(createSSRApp(App(props)))
      const el = document.createElement('div')
      el.innerHTML = html
      document.body.appendChild(el)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const app = createSSRApp(App(props))
      app.mount(el)
      expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => /mismatch/i.test(m))).toEqual([])
      await nextTick()
      expect(el.querySelector('time')?.textContent).toBe('3 minutes ago')
      expect(el.querySelector('time')?.getAttribute('data-state')).toBe('relative')
      warn.mockRestore()
      app.unmount()
      el.remove()
    })

    it('hydrating a pinned `now` render also matches', async () => {
      const props = { datetime: '2025-06-15T11:57:00Z', now: NOW }
      const html = await renderToString(createSSRApp(App(props)))
      const el = document.createElement('div')
      el.innerHTML = html
      document.body.appendChild(el)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const app = createSSRApp(App(props))
      app.mount(el)
      await nextTick()
      expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => /mismatch/i.test(m))).toEqual([])
      expect(el.querySelector('time')?.textContent).toBe('3 minutes ago')
      warn.mockRestore()
      app.unmount()
      el.remove()
    })

    it('without now, text turns relative after mount using the clock', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z' } })
      await nextTick()
      expect(w.text()).toBe('3 minutes ago')
      expect(w.attributes('data-state')).toBe('relative')
      w.unmount()
    })

    it('timeZone is honoured before and after mount', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', timeZone: 'Asia/Tokyo' } })
      expect(ws(w.attributes('title') ?? '')).toBe('Jun 15, 2025, 8:57 PM')
      await nextTick()
      expect(ws(w.attributes('title') ?? '')).toBe('Jun 15, 2025, 8:57 PM')
      w.unmount()
    })

    it('updateInterval 0 owns no timer; the text is not refreshed', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z' } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      vi.advanceTimersByTime(3_600_000)
      await nextTick()
      expect(w.text()).toBe('3 minutes ago')
      w.unmount()
    })

    it('updateInterval refreshes the text on the shared timer', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval: 1000 } })
      await nextTick()
      expect(w.text()).toBe('3 minutes ago')
      vi.advanceTimersByTime(120_000)
      await nextTick()
      expect(w.text()).toBe('5 minutes ago')
      expect(clockStats()).toMatchObject({ subscribers: 1, period: 1000, active: true })
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('many instances share one timer and the last unmount clears it', async () => {
      const ws_ = Array.from({ length: 10 }, () => mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval: 5000 } }))
      await nextTick()
      expect(vi.getTimerCount()).toBe(1)
      expect(clockStats().subscribers).toBe(10)
      ws_.slice(1).forEach((w) => w.unmount())
      expect(vi.getTimerCount()).toBe(1)
      ws_[0].unmount()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('changing updateInterval re-subscribes and 0 removes the timer', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval: 5000 } })
      await nextTick()
      expect(clockStats().period).toBe(5000)
      await w.setProps({ updateInterval: 2000 })
      expect(clockStats()).toMatchObject({ subscribers: 1, period: 2000 })
      expect(vi.getTimerCount()).toBe(1)
      await w.setProps({ updateInterval: 0 })
      expect(clockStats().subscribers).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
      await w.setProps({ updateInterval: 1500 })
      expect(clockStats()).toMatchObject({ subscribers: 1, period: 1500 })
      w.unmount()
    })

    it('a pinned now ignores updateInterval and drops an existing subscription', async () => {
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', now: NOW, updateInterval: 1000 } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      w.unmount()

      const live = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval: 1000 } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(1)
      await live.setProps({ now: NOW })
      expect(vi.getTimerCount()).toBe(0)
      await live.setProps({ now: undefined })
      expect(vi.getTimerCount()).toBe(1)
      live.unmount()
    })

    it('hostile updateInterval values do not create a timer or a busy loop', async () => {
      for (const updateInterval of [NaN, -1, Infinity, 'abc' as unknown as number]) {
        const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval } })
        await nextTick()
        expect(vi.getTimerCount()).toBe(0)
        w.unmount()
      }
      const w = mount(RelativeTime, { props: { datetime: '2025-06-15T11:57:00Z', updateInterval: 1 } })
      await nextTick()
      expect(clockStats().period).toBe(250)
      w.unmount()
    })

    it('instances in a v-for stop with the parent', async () => {
      const show = ref(true)
      const Host = defineComponent({
        setup: () => () => (show.value ? h('ul', [1, 2, 3].map((i) => h(RelativeTime, { key: i, datetime: '2025-06-15T11:57:00Z', updateInterval: 1000 }))) : null),
      })
      const w = mount(Host)
      await nextTick()
      expect(vi.getTimerCount()).toBe(1)
      show.value = false
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      w.unmount()
    })
  })

  describe('exports', () => {
    it('is exported from the barrels with helpers', () => {
      expect(barrel.RelativeTime).toBe(Exported)
      expect(barrel.relativeTimeVariants).toBe(relativeTimeVariants)
      expect(barrel.selectUnit).toBe(selectUnit)
    })
  })
})
