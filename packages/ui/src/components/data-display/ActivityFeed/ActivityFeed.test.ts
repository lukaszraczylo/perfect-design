import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { faCheck } from '../../../lib/icons'
import { ActivityFeed } from './index'
import { formatRelative, makeFormatters, toDate } from './format'

const NOW = '2026-03-04T12:00:00Z'
const events = [
  { id: 'e1', actor: 'Deploy bot', action: 'deployed', target: 'Orchard Mill web', time: '2026-03-04T11:42:00Z', tone: 'success' as const, details: 'Rolled out to 3 of 3.' },
  { id: 'e2', actor: 'Reviewer 1', action: 'approved', target: 'Change 128', time: '2026-03-04T10:05:00Z' },
  { id: 'e3', action: 'Window ended', time: '2026-02-20T22:00:00Z' },
]
const mk = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}): VueWrapper =>
  mount(ActivityFeed as never, { props: { label: 'Sample activity', events, now: NOW, timeZone: 'UTC', locale: 'en', ...props } as never, slots: slots as never, attachTo: document.body }) as unknown as VueWrapper
const items = (w: VueWrapper) => w.findAll('[data-slot="activity-feed-item"]')

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('ActivityFeed good path', () => {
  it('renders a named group with an ordered list of events', () => {
    const w = mk()
    expect(w.attributes('data-slot')).toBe('activity-feed')
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Sample activity')
    expect(w.find('ol').exists()).toBe(true)
    expect(items(w)).toHaveLength(3)
    expect(items(w)[0].text()).toContain('Deploy bot')
    expect(items(w)[0].text()).toContain('deployed')
    expect(items(w)[0].text()).toContain('Orchard Mill web')
  })

  it('shows relative text with the absolute date in the title and a machine value', () => {
    const t = items(mk())[0].find('time')
    expect(t.text()).toBe('18 minutes ago')
    expect(t.attributes('datetime')).toBe('2026-03-04T11:42:00.000Z')
    expect(t.attributes('title')).toBe('Mar 4, 2026, 11:42 AM')
    expect(items(mk())[1].find('time').text()).toBe('1 hour ago')
  })

  it('shows absolute text for events older than a week and when relative is off', () => {
    const w = mk()
    const old = items(w)[2].find('time')
    expect(old.text()).toBe('Feb 20, 2026, 10:00 PM')
    expect(old.attributes('title')).toBeUndefined()
    const off = mk({ relative: false })
    expect(items(off)[0].find('time').text()).toBe('Mar 4, 2026, 11:42 AM')
    expect(items(off)[0].find('time').attributes('title')).toBeUndefined()
  })

  it('formats in the given locale and time zone', () => {
    const w = mk({ locale: 'de', timeZone: 'Europe/Berlin', relative: false })
    expect(items(w)[0].find('time').text()).toContain('12:42')
    expect(w.text()).toContain('04.03.2026')
  })

  it('shows initials avatars as decorative and the actor in text', () => {
    const w = mk()
    const av = items(w)[0].find('[data-slot="activity-feed-avatar"]')
    expect(av.exists()).toBe(true)
    expect(av.text()).toBe('DB')
    expect(av.attributes('role')).toBeUndefined()
    expect(av.attributes('aria-label')).toBeUndefined()
    expect(av.find('img').exists()).toBe(false)
  })

  it('uses a marker instead of an avatar without an actor or with showAvatars off', () => {
    const w = mk()
    expect(items(w)[2].find('[data-slot="activity-feed-avatar"]').exists()).toBe(false)
    expect(items(w)[2].find('[data-slot="activity-feed-marker"]').exists()).toBe(true)
    const off = mk({ showAvatars: false })
    expect(off.find('[data-slot="activity-feed-avatar"]').exists()).toBe(false)
    expect(off.findAll('[data-slot="activity-feed-marker"]')).toHaveLength(3)
  })

  it('writes the tone as text and shows an icon, not colour alone', () => {
    const w = mk()
    const first = items(w)[0]
    expect(first.attributes('data-tone')).toBe('success')
    expect(first.find('[data-slot="activity-feed-tone"]').text()).toBe('Success.')
    expect(first.find('[data-slot="activity-feed-tone"]').classes()).toContain('sr-only')
    expect(first.find('svg').exists()).toBe(true)
    expect(items(w)[1].find('[data-slot="activity-feed-tone"]').exists()).toBe(false)
    for (const [tone, word] of [['warning', 'Warning.'], ['danger', 'Error.'], ['info', 'Info.']] as const) {
      const t = mk({ events: [{ id: 'x', actor: 'Scheduler', action: 'ran', time: NOW, tone }] })
      expect(t.find('[data-slot="activity-feed-tone"]').text()).toBe(word)
      expect(t.find('svg').exists()).toBe(true)
    }
  })

  it('a custom icon fills the marker', () => {
    const w = mk({ variant: 'timeline', events: [{ id: 'x', action: 'released', time: NOW, icon: faCheck, tone: 'primary' }] })
    expect(w.find('[data-slot="activity-feed-marker"] svg').exists()).toBe(true)
    expect(w.find('[data-slot="activity-feed-tone"]').exists()).toBe(false)
  })

  it('timeline draws a connector for every item (hidden on the last by class)', () => {
    const w = mk({ variant: 'timeline' })
    expect(w.findAll('[data-slot="activity-feed-connector"]')).toHaveLength(3)
    expect(w.find('[data-slot="activity-feed-connector"]').classes()).toContain('group-last/item:hidden')
  })

  it('compact has no lead column; its icon sits inline', () => {
    const w = mk({ variant: 'compact' })
    expect(w.find('[data-slot="activity-feed-lead"]').exists()).toBe(false)
    expect(items(w)[0].find('[data-slot="activity-feed-text"] svg').exists()).toBe(true)
  })
})

describe('ActivityFeed grouping', () => {
  it('groups by calendar day in the given time zone with named groups and headings', () => {
    const w = mk({ variant: 'grouped' })
    const groups = w.findAll('[data-slot="activity-feed-group"]')
    expect(groups).toHaveLength(2)
    const titles = w.findAll('[data-slot="activity-feed-group-title"]').map((t) => t.text())
    expect(titles).toEqual(['Wednesday, March 4, 2026', 'Friday, February 20, 2026'])
    expect(groups[0].attributes('role')).toBe('group')
    expect(groups[0].attributes('aria-labelledby')).toBe(w.find('h3').attributes('id'))
    expect(groups[0].findAll('li')).toHaveLength(2)
  })

  it('day boundaries follow the time zone', () => {
    const ev = [{ id: 'a', action: 'x', time: '2026-03-04T23:30:00Z' }]
    expect(mk({ variant: 'grouped', events: ev, timeZone: 'UTC' }).find('h3').text()).toContain('March 4')
    expect(mk({ variant: 'grouped', events: ev, timeZone: 'Asia/Tokyo' }).find('h3').text()).toContain('March 5')
  })

  it('an explicit group wins and merges equal names; undated events go to Undated', () => {
    const w = mk({
      variant: 'grouped',
      events: [
        { id: 1, action: 'a', time: NOW, group: 'Releases' },
        { id: 2, action: 'b', time: '2025-01-01T00:00:00Z', group: ' Releases ' },
        { id: 3, action: 'c', time: 'not a date' },
        { id: 4, action: 'd', time: NOW },
      ],
    })
    const titles = w.findAll('h3').map((t) => t.text())
    expect(titles).toEqual(['Releases', 'Undated', 'Wednesday, March 4, 2026'])
    expect(w.findAll('[data-slot="activity-feed-group"]')[0].findAll('li')).toHaveLength(2)
  })

  it('headingLevel sets the heading element and falls back to 3', () => {
    expect(mk({ variant: 'grouped', headingLevel: 2 }).find('h2').exists()).toBe(true)
    expect(mk({ variant: 'grouped', headingLevel: 6 }).find('h6').exists()).toBe(true)
    expect(mk({ variant: 'grouped', headingLevel: 9 }).find('h3').exists()).toBe(true)
    expect(mk({ variant: 'grouped', headingLevel: 1 }).find('h3').exists()).toBe(true)
  })

  it('non-grouped variants have no headings', () => {
    expect(mk().find('h3').exists()).toBe(false)
    expect(mk().find('[data-slot="activity-feed-group"]').exists()).toBe(false)
  })
})

describe('ActivityFeed details', () => {
  it('toggles with aria-expanded and a controlled panel, by click and keyboard', async () => {
    const w = mk()
    const btn = () => items(w)[0].find('button[data-slot="activity-feed-toggle"]')
    expect(items(w)[1].find('button').exists()).toBe(false)
    expect(btn().attributes('aria-expanded')).toBe('false')
    expect(btn().attributes('aria-controls')).toBeUndefined()
    expect(btn().text()).toContain('Show details')
    expect(btn().text()).toContain('for Deploy bot deployed Orchard Mill web')
    expect(w.find('[data-slot="activity-feed-details"]').exists()).toBe(false)
    await btn().trigger('click')
    expect(btn().attributes('aria-expanded')).toBe('true')
    expect(btn().text()).toContain('Hide details')
    const panel = w.find('[data-slot="activity-feed-details"]')
    expect(panel.text()).toBe('Rolled out to 3 of 3.')
    expect(btn().attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(items(w)[0].attributes('data-expanded')).toBe('')
    expect(w.emitted('toggle')![0]).toEqual([{ id: 'e1', expanded: true }])
    expect(w.emitted('update:expanded')![0]).toEqual([['e1']])
    await btn().trigger('keydown', { key: 'Enter' })
    await btn().trigger('click')
    expect(btn().attributes('aria-expanded')).toBe('false')
    expect(w.emitted('toggle')![1]).toEqual([{ id: 'e1', expanded: false }])
  })

  it('is a native button, reachable and activatable from the keyboard', () => {
    const w = mk()
    const btn = items(w)[0].find('button')
    expect(btn.element.tagName).toBe('BUTTON')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('tabindex')).toBeUndefined()
    expect(btn.classes()).toContain('min-h-6')
    expect(btn.classes()).toContain('pointer-coarse:min-h-11')
  })

  it('is controlled by `expanded` and emits without changing itself', async () => {
    const w = mk({ expanded: ['e1'] })
    expect(w.find('[data-slot="activity-feed-details"]').exists()).toBe(true)
    await items(w)[0].find('button').trigger('click')
    expect(w.emitted('update:expanded')![0]).toEqual([[]])
    expect(w.find('[data-slot="activity-feed-details"]').exists()).toBe(true)
    await w.setProps({ expanded: [] })
    expect(w.find('[data-slot="activity-feed-details"]').exists()).toBe(false)
  })

  it('the details slot gives every event a button and receives the event', async () => {
    const w = mk({}, { details: ({ event }: { event: { id: string } }) => h('em', `Detail for ${event.id}`) })
    expect(w.findAll('button[data-slot="activity-feed-toggle"]')).toHaveLength(3)
    await items(w)[1].find('button').trigger('click')
    expect(w.find('[data-slot="activity-feed-details"] em').text()).toBe('Detail for e2')
  })
})

describe('ActivityFeed load more', () => {
  it('shows the button only with hasMore, emits, and disables while loading', async () => {
    expect(mk().find('[data-slot="activity-feed-load-more"]').exists()).toBe(false)
    const w = mk({ hasMore: true })
    const btn = w.find('[data-slot="activity-feed-load-more"]')
    expect(btn.text()).toBe('Load more activity')
    await btn.trigger('click')
    expect(w.emitted('load-more')).toHaveLength(1)
    await w.setProps({ loading: true, loadMoreLabel: 'More' })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('[data-slot="activity-feed-load-more"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-slot="activity-feed-status"]').text()).toBe('Loading more activity.')
    expect(w.find('[data-slot="activity-feed-status"]').attributes('role')).toBe('status')
    await w.setProps({ loading: false })
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(w.find('[data-slot="activity-feed-status"]').text()).toBe('')
  })

  it('does not emit when clicked while loading', async () => {
    const w = mk({ hasMore: true, loading: true })
    await w.find('[data-slot="activity-feed-load-more"]').trigger('click')
    expect(w.emitted('load-more')).toBeUndefined()
  })

  it('the load-more slot replaces the button and gets the loading state', () => {
    const w = mk({ hasMore: true, loading: true }, { 'load-more': (p: { loading: boolean }) => h('a', { href: '/older' }, `Older ${p.loading}`) })
    expect(w.find('[data-slot="activity-feed-load-more"]').exists()).toBe(false)
    expect(w.find('a').text()).toBe('Older true')
  })
})

describe('ActivityFeed empty and bad input', () => {
  it('renders an empty state for no events, null and non-arrays', () => {
    for (const ev of [[], null, undefined, 'x', 5]) {
      const w = mk({ events: ev })
      expect(w.find('[data-slot="activity-feed-empty"]').text()).toBe('No activity yet.')
      expect(w.find('ol').exists()).toBe(false)
    }
  })
  it('the empty slot replaces the text; hasMore still offers the button', () => {
    const w = mk({ events: [], hasMore: true }, { empty: () => 'Nothing here' })
    expect(w.find('[data-slot="activity-feed-empty"]').text()).toBe('Nothing here')
    expect(w.find('[data-slot="activity-feed-load-more"]').exists()).toBe(true)
  })
  it('shows an invalid time as given, without datetime, and does not throw', () => {
    const w = mk({ events: [{ id: 1, action: 'a', time: 'last Tuesday' }, { id: 2, action: 'b', time: new Date('nope') }, { id: 3, action: 'c', time: '' }, { id: 4, action: 'd', time: 12345678901234567890 }] })
    const t = w.findAll('time')
    expect(t[0].text()).toBe('last Tuesday')
    expect(t[0].attributes('datetime')).toBeUndefined()
    expect(t[1].exists()).toBe(true)
    expect(w.findAll('li')).toHaveLength(4)
    expect(items(w)[2].find('time').exists()).toBe(false)
  })
  it('accepts Date objects and epoch milliseconds', () => {
    const w = mk({ events: [{ id: 1, action: 'a', time: new Date('2026-03-04T11:00:00Z') }, { id: 2, action: 'b', time: Date.parse('2026-03-04T09:00:00Z') }], now: new Date(NOW) })
    expect(w.findAll('time').map((t) => t.text())).toEqual(['1 hour ago', '3 hours ago'])
  })
  it('skips non-object events and survives unknown tones', () => {
    const w = mk({ events: [null, 5, { id: 'ok', action: 'fine', time: NOW, tone: 'purple' }] })
    expect(w.findAll('li')).toHaveLength(1)
    expect(w.find('li').attributes('data-tone')).toBeUndefined()
  })
  it('duplicate ids still render every event', () => {
    const w = mk({ events: [{ id: 'a', action: 'one', time: NOW }, { id: 'a', action: 'two', time: NOW }] })
    expect(w.findAll('li')).toHaveLength(2)
  })
  it('an unknown locale or time zone falls back instead of throwing', () => {
    const w = mk({ locale: 'xx-INVALID-zz-', timeZone: 'Mars/Base', relative: false })
    expect(items(w)).toHaveLength(3)
    expect(items(w)[0].find('time').text().length).toBeGreaterThan(3)
  })
})

describe('ActivityFeed hostile and unusual text', () => {
  const hostile = '<script>window.__x = 1</script><img src=x onerror="window.__x=1">'
  it('renders markup as text everywhere', () => {
    const w = mk({ events: [{ id: '<b>1</b>', actor: hostile, action: hostile, target: hostile, time: NOW, group: hostile, details: hostile }], variant: 'grouped', expanded: ['<b>1</b>'] })
    expect(w.element.querySelector('script')).toBeNull()
    expect(w.element.querySelector('img')).toBeNull()
    expect(w.find('[data-slot="activity-feed-details"]').text()).toBe(hostile)
    expect(w.find('h3').text()).toBe(hostile)
    expect(w.find('[data-slot="activity-feed-actor"]').text()).toBe(hostile)
    expect((window as unknown as { __x?: number }).__x).toBeUndefined()
  })
  it('long unbroken text can wrap and RTL, unicode and emoji text pass through', () => {
    const long = 'x'.repeat(5000)
    const w = mk({ events: [{ id: 1, actor: 'شخص', action: 'نشر الإصدار', target: long, time: NOW }, { id: 2, actor: '田中', action: '公開しました', time: NOW }] })
    expect(w.find('[data-slot="activity-feed-text"]').classes()).toEqual(expect.arrayContaining(['break-words', 'min-w-0']))
    expect(w.find('[data-slot="activity-feed-target"]').text()).toHaveLength(5000)
    expect(w.find('bdi').exists()).toBe(true)
    expect(items(w)[1].find('[data-slot="activity-feed-avatar"]').text()).toBe('田')
    expect(w.text()).toContain('نشر الإصدار')
  })
  it('whitespace-only actor or target counts as absent', () => {
    const w = mk({ events: [{ id: 1, actor: '   ', action: 'ran', target: '', time: NOW }] })
    expect(w.find('[data-slot="activity-feed-actor"]').exists()).toBe(false)
    expect(w.find('[data-slot="activity-feed-target"]').exists()).toBe(false)
    expect(w.find('[data-slot="activity-feed-avatar"]').exists()).toBe(false)
  })
})

describe('ActivityFeed customisation', () => {
  it('class wins, attributes fall through, aria-label can replace label', () => {
    const w = mk({ class: 'max-w-sm text-lg', id: 'feed', 'data-test': 'x', label: undefined, 'aria-label': 'Custom name' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('text-lg')
    expect(w.classes()).not.toContain('text-sm')
    expect(w.attributes('id')).toBe('feed')
    expect(w.attributes('data-test')).toBe('x')
    expect(w.attributes('aria-label')).toBe('Custom name')
  })
  it('has a data-slot on every part', () => {
    const w = mk({ hasMore: true, variant: 'timeline', expanded: ['e1'] })
    for (const slot of ['activity-feed', 'activity-feed-list', 'activity-feed-item', 'activity-feed-lead', 'activity-feed-marker', 'activity-feed-connector', 'activity-feed-body', 'activity-feed-text', 'activity-feed-actor', 'activity-feed-action', 'activity-feed-target', 'activity-feed-time', 'activity-feed-toggle', 'activity-feed-details', 'activity-feed-more', 'activity-feed-load-more', 'activity-feed-status', 'activity-feed-section', 'activity-feed-tone']) {
      expect(w.find(`[data-slot="${slot}"]`).exists(), slot).toBe(true)
    }
    expect(mk({ events: [] }).find('[data-slot="activity-feed-empty"]').exists()).toBe(true)
    expect(mk({ variant: 'grouped' }).find('[data-slot="activity-feed-group-title"]').exists()).toBe(true)
    expect(mk({ showAvatars: true }).find('[data-slot="activity-feed-avatar"]').exists()).toBe(true)
  })
})

describe('ActivityFeed time without `now`', () => {
  it('renders absolute text first, then relative text after mount, and refreshes every minute', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    const w = mount(ActivityFeed as never, { props: { label: 'x', events: [{ id: 1, action: 'a', time: '2026-03-04T11:50:00Z' }], timeZone: 'UTC', locale: 'en' } as never })
    await nextTick()
    expect(w.find('time').text()).toBe('10 minutes ago')
    vi.setSystemTime(new Date('2026-03-04T12:20:00Z'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(w.find('time').text()).toBe('31 minutes ago')
    w.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('server render shows absolute text', async () => {
    const { renderToString } = await import('vue/server-renderer')
    const html = await renderToString(h(ActivityFeed as never, { label: 'x', events: [{ id: 1, action: 'a', time: '2026-03-04T11:50:00Z' }], timeZone: 'UTC', locale: 'en' }))
    expect(html).toContain('Mar 4, 2026, 11:50 AM')
    expect(html).not.toContain('ago')
  })
  it('no timer is started when `now` is given', () => {
    vi.useFakeTimers()
    const w = mk()
    expect(vi.getTimerCount()).toBe(0)
    w.unmount()
  })
  it('an invalid `now` shows absolute text', () => {
    const w = mk({ now: 'garbage' })
    expect(items(w)[0].find('time').text()).toBe('Mar 4, 2026, 11:42 AM')
  })
})

describe('format helpers', () => {
  const rf = makeFormatters('en').relative
  const base = new Date(NOW)
  const at = (ms: number) => new Date(base.getTime() + ms)
  it('picks the unit and sign', () => {
    expect(formatRelative(at(-20_000), base, rf)).toBe('now')
    expect(formatRelative(at(-90_000), base, rf)).toBe('1 minute ago')
    expect(formatRelative(at(3 * 60_000), base, rf)).toBe('in 3 minutes')
    expect(formatRelative(at(-5 * 3600_000), base, rf)).toBe('5 hours ago')
    expect(formatRelative(at(-86400_000), base, rf)).toBe('yesterday')
    expect(formatRelative(at(-6 * 86400_000), base, rf)).toBe('6 days ago')
    expect(formatRelative(at(-8 * 86400_000), base, rf)).toBeNull()
    expect(formatRelative(at(8 * 86400_000), base, rf)).toBeNull()
  })
  it('toDate rejects non-dates', () => {
    for (const v of [null, undefined, '', true, {}, [], 'nope', Number.NaN, new Date('x')]) expect(toDate(v)).toBeNull()
    expect(toDate(0)?.getTime()).toBe(0)
  })
  it('makeFormatters falls back for bad locale and zone', () => {
    expect(() => makeFormatters('not a locale!', 'Nowhere/Land')).not.toThrow()
    expect(makeFormatters('en', 'Nowhere/Land').absolute.format(base).length).toBeGreaterThan(3)
  })
})
