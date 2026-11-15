import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StaleNotice from './StaleNotice.vue'

const NOW = new Date('2026-06-15T12:00:00Z').getTime()
const MIN = 60_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('StaleNotice', () => {
  describe('good path', () => {
    it('shows a fresh relative time with status role', () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
      expect(w.attributes('data-slot')).toBe('stale-notice')
      expect(w.attributes('role')).toBe('status')
      expect(w.attributes('data-stale')).toBeUndefined()
      expect(w.text()).toBe('Last updated 2 minutes ago')
    })

    it('exposes a machine-readable <time>', () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
      const t = w.find('time')
      expect(t.attributes('datetime')).toBe(new Date(NOW - 2 * MIN).toISOString())
      expect(t.attributes('title')).toBeTruthy()
    })

    it('becomes stale past staleAfter (boundary exclusive)', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 5 * MIN, interval: 1000 } })
      expect(w.attributes('data-stale')).toBeUndefined()
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(w.attributes('data-stale')).toBe('')
      expect(w.text()).toContain('Data may be out of date.')
    })

    it('ticks so the relative time keeps moving', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval: 30_000, staleAfter: Infinity } })
      expect(w.text()).toContain('just now')
      vi.advanceTimersByTime(2 * MIN)
      await nextTick()
      expect(w.text()).toContain('2 minutes ago')
    })

    it('refresh button emits refresh', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, refreshable: true } })
      await w.find('[data-slot="stale-notice-refresh"]').trigger('click')
      expect(w.emitted('refresh')).toHaveLength(1)
    })

    it('no refresh button by default', () => {
      expect(mount(StaleNotice, { props: { timestamp: NOW } }).find('[data-slot="stale-notice-refresh"]').exists()).toBe(false)
    })

    it('refreshing disables the button and blocks refresh', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, refreshable: true, refreshing: true } })
      const b = w.find('[data-slot="stale-notice-refresh"]')
      expect(b.attributes('disabled')).toBeDefined()
      await b.trigger('click')
      expect(w.emitted('refresh')).toBeUndefined()
    })

    it('hideWhenFresh renders nothing until stale', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, hideWhenFresh: true, staleAfter: MIN, interval: 1000 } })
      expect(w.find('[data-slot="stale-notice"]').exists()).toBe(false)
      vi.advanceTimersByTime(MIN + 1000)
      await nextTick()
      expect(w.find('[data-slot="stale-notice"]').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('custom labels, locale and class merge', () => {
      const w = mount(StaleNotice, {
        props: { timestamp: NOW - 10 * MIN, label: 'Synced', staleLabel: 'Old!', locale: 'pl', class: 'py-4 mine', refreshable: true, refreshLabel: 'Reload' },
        attrs: { id: 'sn' },
      })
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
    it.each([undefined, null, 'garbage', Number.NaN, new Date('x')])('invalid timestamp %s shows unknown and counts as stale', (timestamp) => {
      const w = mount(StaleNotice, { props: { timestamp: timestamp as never } })
      expect(w.text()).toBe('Last updated unknown')
      expect(w.attributes('data-stale')).toBe('')
      expect(w.find('time').exists()).toBe(false)
    })

    it('future timestamps are not stale and read as "in ..."', () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW + 10 * MIN } })
      expect(w.attributes('data-stale')).toBeUndefined()
      expect(w.text()).toContain('in 10 minutes')
    })
  })

  describe('timers', () => {
    it('clears its interval on unmount', () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW } })
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })

    it.each([0, -1, Number.NaN])('interval=%s never starts a timer', (interval) => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval } })
      expect(vi.getTimerCount()).toBe(0)
      w.unmount()
    })

    it('restarts the timer when interval changes', async () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW, interval: 1000 } })
      await w.setProps({ interval: 0 })
      expect(vi.getTimerCount()).toBe(0)
      await w.setProps({ interval: 5000 })
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
    })
  })

  describe('edge cases', () => {
    it('very old timestamps (years) and unicode labels', () => {
      const w = mount(StaleNotice, { props: { timestamp: NOW - 3 * 365 * 24 * 60 * MIN, label: '更新 ' + 'x'.repeat(2000) } })
      expect(w.text()).toContain('3 years ago')
      expect(w.text()).toContain('更新')
    })
  })

describe('StaleNotice figures', () => {
  it('sets the relative time in tabular figures', () => {
    const w = mount(StaleNotice, { props: { timestamp: NOW - 2 * MIN } })
    expect(w.find('time').classes()).toContain('tabular-nums')
  })
})
})
