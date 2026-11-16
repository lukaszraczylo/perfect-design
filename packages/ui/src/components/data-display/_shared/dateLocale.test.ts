import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import { ActivityFeed } from '../ActivityFeed'
import { ChatMessage } from '../ChatMessage'
import { ChatThread } from '../ChatThread'
import { LogViewer } from '../LogViewer'

// A runtime zone far from UTC makes any use of the runtime default visible.
const savedTZ = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'America/Los_Angeles'
})
afterAll(() => {
  if (savedTZ === undefined) delete process.env.TZ
  else process.env.TZ = savedTZ
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

const AT = '2026-03-04T23:30:00Z'

describe('timestamps use prop, then ConfigProvider, then en and UTC', () => {
  it('ActivityFeed', () => {
    const feed = (props: Record<string, unknown> = {}) => mount(ActivityFeed as never, { props: { label: 'Sample', events: [{ id: 1, action: 'a', time: AT }], relative: false, ...props } as never })
    expect(feed().find('[data-slot="activity-feed-time"]').text()).toBe('Mar 4, 2026, 11:30 PM')
    expect(feed({ timeZone: 'Asia/Tokyo' }).find('[data-slot="activity-feed-time"]').text()).toBe('Mar 5, 2026, 8:30 AM')
    const w = mount(() => h(ConfigProvider as never, { timeZone: 'Asia/Tokyo', locale: 'de' }, () => h(ActivityFeed as never, { label: 'Sample', events: [{ id: 1, action: 'a', time: AT }], relative: false })))
    expect(w.find('[data-slot="activity-feed-time"]').text()).toContain('5.')
  })
  it('ChatMessage', () => {
    const msg = (props: Record<string, unknown> = {}) => mount(ChatMessage as never, { props: { datetime: AT, ...props } as never, slots: { default: () => 'hi' } })
    expect(msg().find('[data-slot="chat-message-time"]').text()).toBe('11:30 PM')
    expect(msg({ timeZone: 'Asia/Tokyo' }).find('[data-slot="chat-message-time"]').text()).toBe('8:30 AM')
  })
  it('LogViewer', () => {
    const log = (props: Record<string, unknown> = {}) => mount(LogViewer as never, { props: { label: 'Log', lines: [{ time: Date.parse(AT), message: 'x' }], height: 200, ...props } as never })
    expect(log().find('[data-slot="log-viewer-time"]').text()).toBe('23:30:00.000')
    expect(log({ timeZone: 'Asia/Tokyo' }).find('[data-slot="log-viewer-time"]').text()).toBe('08:30:00.000')
  })
})

describe('ChatThread clock', () => {
  const day = (w: ReturnType<typeof mount>) => w.find('[data-slot="chat-thread-day"]').text()
  it('advances so Today becomes Yesterday after midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-04T23:45:00Z'))
    const w = mount(ChatThread as never, {
      props: { label: 'Chat', messages: [{ id: 1, at: AT }], itemKey: 'id', itemDate: 'at', timeZone: 'UTC', locale: 'en' } as never,
      slots: { message: () => h(ChatMessage as never, {}, () => 'hi') },
      attachTo: document.body,
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(day(w)).toBe('Today')
    await vi.advanceTimersByTimeAsync(30 * 60_000)
    expect(day(w)).toBe('Yesterday')
    w.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useDateLocale time zone', () => {
  it('is UTC for the server-matching first render and the viewer zone after mount', async () => {
    const { defineComponent, nextTick } = await import('vue')
    const { renderToString } = await import('vue/server-renderer')
    const { createSSRApp } = await import('vue')
    const { useDateLocale } = await import('./dateLocale')
    const Probe = defineComponent({ setup: () => { const { timeZone } = useDateLocale({}); return () => h('span', String(timeZone.value)) } })
    expect(await renderToString(createSSRApp(Probe))).toBe('<span>UTC</span>')
    const w = mount(Probe)
    await nextTick()
    expect(w.text()).toBe('undefined')
    w.unmount()
  })
  it('keeps an explicit zone before and after mount', async () => {
    const { defineComponent, nextTick } = await import('vue')
    const { useDateLocale } = await import('./dateLocale')
    const Probe = defineComponent({ setup: () => { const { timeZone } = useDateLocale({ timeZone: 'Asia/Tokyo' }); return () => h('span', String(timeZone.value)) } })
    const w = mount(Probe)
    await nextTick()
    expect(w.text()).toBe('Asia/Tokyo')
    w.unmount()
  })
})
