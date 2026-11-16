import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import StaleNotice from './StaleNotice.vue'

const NOW = new Date('2026-06-15T12:00:00Z').getTime()
const MIN = 60_000

enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('StaleNotice', () => {
  describe('good path', () => {
    it('shows a fresh relative time with status role', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
      await nextTick()
      expect(w.attributes('data-slot')).toBe('stale-notice')
      expect(w.attributes('role')).toBe('status')
      expect(w.attributes('data-stale')).toBeUndefined()
      expect(w.text()).toBe('Last updated 2 minutes ago')
    })

    it('exposes a machine-readable <time>', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
      await nextTick()
      const t = w.find('time')
      expect(t.attributes('datetime')).toBe(new Date(NOW - 2 * MIN).toISOString())
      expect(t.attributes('title')).toBeTruthy()
    })

    it('becomes stale past staleAfter (boundary exclusive)', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 5 * MIN, interval: 1000 } })
      await nextTick()
      expect(w.attributes('data-stale')).toBeUndefined()
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(w.attributes('data-stale')).toBe('')
      expect(w.text()).toContain('Data may be out of date.')
    })

    it('ticks so the relative time keeps moving', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval: 30_000, staleAfter: Infinity } })
      await nextTick()
      expect(w.text()).toContain('just now')
      vi.advanceTimersByTime(2 * MIN)
      await nextTick()
      expect(w.text()).toContain('2 minutes ago')
    })

    it('refresh button emits refresh', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, refreshable: true } })
      await nextTick()
      await w.find('[data-slot="stale-notice-refresh"]').trigger('click')
      expect(w.emitted('refresh')).toHaveLength(1)
    })

    it('no refresh button by default', async () => {
      expect(mount(StaleNotice, { props: { timestamp: NOW } }).find('[data-slot="stale-notice-refresh"]').exists()).toBe(false)
    })

    it('refreshing disables the button and blocks refresh', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, refreshable: true, refreshing: true } })
      await nextTick()
      const b = w.find('[data-slot="stale-notice-refresh"]')
      expect(b.attributes('disabled')).toBeDefined()
      await b.trigger('click')
      expect(w.emitted('refresh')).toBeUndefined()
    })

    it('hideWhenFresh renders nothing until stale', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, hideWhenFresh: true, staleAfter: MIN, interval: 1000 } })
      await nextTick()
      expect(w.find('[data-slot="stale-notice"]').exists()).toBe(false)
      vi.advanceTimersByTime(MIN + 1000)
      await nextTick()
      expect(w.find('[data-slot="stale-notice"]').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('custom labels, locale and class merge', async () => {
      const w = mount(StaleNotice, {
        props: { timestamp: NOW - 10 * MIN, label: 'Synced', staleLabel: 'Old!', locale: 'pl', class: 'py-4 mine', refreshable: true, refreshLabel: 'Reload' },
        attrs: { id: 'sn' },
      })
      await nextTick()
      expect(w.text()).toContain('Old!')
      expect(w.text()).toContain('Synced')
      expect(w.text()).toContain('10 minut temu')
      expect(w.text()).toContain('Reload')
      expect(w.classes()).toContain('mine')
      expect(w.classes()).not.toContain('py-2')
      expect(w.attributes('id')).toBe('sn')
    })
  })

  describe('bad path', () => {
    it.each([undefined, null, 'garbage', Number.NaN, new Date('x')])('invalid timestamp %s shows unknown and counts as stale', async (timestamp) => {
      const w = mount(StaleNotice, { props: { timestamp: timestamp as never } })
      await nextTick()
      expect(w.text()).toBe('Last updated unknown')
      expect(w.attributes('data-stale')).toBe('')
      expect(w.find('time').exists()).toBe(false)
    })

    it('future timestamps are not stale and read as "in ..."', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW + 10 * MIN } })
      await nextTick()
      expect(w.attributes('data-stale')).toBeUndefined()
      expect(w.text()).toContain('in 10 minutes')
    })
  })

  describe('timers', () => {
    it('clears its interval on unmount', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })

    it.each([0, -1, Number.NaN])('interval=%s never starts a timer', async (interval) => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval } })
      await nextTick()
      expect(vi.getTimerCount()).toBe(0)
      w.unmount()
    })

    it('restarts the timer when interval changes', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval: 1000 } })
      await nextTick()
      await w.setProps({ interval: 0 })
      expect(vi.getTimerCount()).toBe(0)
      await w.setProps({ interval: 5000 })
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
    })
  })

  describe('edge cases', () => {
    it('very old timestamps (years) and unicode labels', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 3 * 365 * 24 * 60 * MIN, label: '更新 ' + 'x'.repeat(2000) } })
      await nextTick()
      expect(w.text()).toContain('3 years ago')
      expect(w.text()).toContain('更新')
    })
  })

describe('StaleNotice figures', () => {
  it('sets the relative time in tabular figures', async () => {
    const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
      await nextTick()
    expect(w.find('time').classes()).toContain('tabular-nums')
  })
})

  describe('server render', () => {
    it('first render is the absolute UTC time and not stale, then goes live', async () => {
      const ssr = await renderToString(h(StaleNotice, { timestamp: NOW - 10 * MIN, locale: 'en' }))
      expect(ssr).toContain('6/15/2026, 11:50:00 AM')
      expect(ssr).not.toContain('data-stale')
      const w = mount(StaleNotice, { props: { timestamp: NOW - 10 * MIN } })
      expect(w.text()).toContain('11:50:00')
      await nextTick()
      expect(w.text()).toContain('10 minutes ago')
      expect(w.attributes('data-stale')).toBe('')
    })

    it('locale comes from ConfigProvider when the prop is absent', async () => {
      const w = mount({ render: () => h(ConfigProvider, { locale: 'pl' }, () => h(StaleNotice, { timestamp: NOW - 10 * MIN })) })
      await nextTick()
      expect(w.text()).toContain('10 minut temu')
    })
  })
})
