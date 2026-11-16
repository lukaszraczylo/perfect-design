import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import NotificationList from './NotificationList.vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const NOW = Date.UTC(2026, 5, 15, 12, 0, 0)
const items = [{ id: 1, title: 'Deploy finished', time: NOW - 5 * 60_000 }]

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('NotificationList time rendering', () => {
  it('first render is absolute UTC, then relative after mount', async () => {
    const ssr = await renderToString(h(NotificationList, { items, locale: 'en' }))
    expect(ssr).toContain('6/15/2026, 11:55:00 AM')
    const w = mount(NotificationList, { props: { items, locale: 'en' } })
    expect(w.find('time').text()).toBe('6/15/2026, 11:55:00 AM')
    await nextTick()
    expect(w.find('time').text()).toBe('5 minutes ago')
  })

  it('refreshes relative labels as time passes', async () => {
    const w = mount(NotificationList, { props: { items, locale: 'en' } })
    await nextTick()
    vi.advanceTimersByTime(10 * 60_000)
    await nextTick()
    expect(w.find('time').text()).toBe('15 minutes ago')
  })

  it('uses the ConfigProvider locale when the prop is absent', async () => {
    const w = mount({ render: () => h(ConfigProvider, { locale: 'pl' }, () => h(NotificationList, { items })) })
    await nextTick()
    expect(w.find('time').text()).toBe('5 minut temu')
  })
})
