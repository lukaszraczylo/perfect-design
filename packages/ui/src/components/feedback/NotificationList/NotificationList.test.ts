import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import NotificationList from './NotificationList.vue'
import type { NotificationItem } from './NotificationList.vue'
import { formatNotificationTime, toNotificationDate } from './time'
import { notificationItemVariants, notificationListVariants, notificationToneVariants } from './variants'

const NOW = Date.UTC(2025, 5, 15, 12, 0, 0)
const mk = (): NotificationItem[] => [
  { id: 1, title: 'Deploy finished', description: 'Build #42 is live', time: NOW - 5 * 60_000, read: false, tone: 'success', icon: faBell },
  { id: 'b', title: 'New comment', time: new Date(NOW - 3 * 3600_000), read: true },
  { id: 3, title: 'Invoice overdue', time: '2025-06-10T12:00:00Z', read: false, tone: 'danger', href: '/billing' },
]
const make = (props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => mount(NotificationList, { props: { items: mk(), now: NOW, locale: 'en', ...props }, ...opts })
const rowsOf = (w: ReturnType<typeof make>) => w.findAll('[data-slot="notification-list-item"]')

afterEach(() => vi.restoreAllMocks())

describe('NotificationList good path', () => {
  it('renders list semantics, items, dot and live count', () => {
    const w = make()
    expect(w.attributes('data-slot')).toBe('notification-list')
    expect(w.find('ul').attributes('role')).toBe('list')
    expect(rowsOf(w)).toHaveLength(3)
    expect(rowsOf(w)[0].attributes('role')).toBe('listitem')
    const count = w.find('[data-slot="notification-list-count"]')
    expect(count.text()).toBe('2 unread')
    expect(count.attributes('aria-live')).toBe('polite')
    expect(rowsOf(w)[0].attributes('data-read')).toBe('false')
    expect(rowsOf(w)[1].attributes('data-read')).toBe('true')
    expect(rowsOf(w)[0].find('[data-slot="notification-list-dot"]').classes()).toContain('bg-primary')
    expect(rowsOf(w)[1].find('[data-slot="notification-list-dot"]').classes()).toContain('bg-transparent')
    expect(rowsOf(w)[0].find('[data-slot="notification-list-icon"] svg').exists()).toBe(true)
    expect(rowsOf(w)[0].text()).toContain('Unread: Deploy finished')
    expect(rowsOf(w)[0].find('[data-slot="notification-list-description"]').text()).toBe('Build #42 is live')
  })

  it('formats relative times with datetime attr', () => {
    const t = make().findAll('time')
    expect(t[0].text()).toBe('5 minutes ago')
    expect(t[0].attributes('datetime')).toBe(new Date(NOW - 300_000).toISOString())
    expect(t[1].text()).toBe('3 hours ago')
    expect(t[2].text()).toBe('5 days ago')
  })

  it('shows provided time strings as is (no datetime)', () => {
    const w = make({ items: [{ id: 1, title: 'x', time: 'just now' }] })
    expect(w.find('time').exists()).toBe(false)
    expect(w.find('[data-slot="notification-list-time"]').text()).toBe('just now')
  })

  it('click marks as read, emits select/read/update:items', async () => {
    const w = make()
    await rowsOf(w)[0].find('[data-slot="notification-list-item-main"]').trigger('click')
    expect(w.emitted('select')![0][0]).toMatchObject({ id: 1 })
    expect(w.emitted('read')![0]).toEqual([1])
    const upd = w.emitted('update:items')![0][0] as NotificationItem[]
    expect(upd.find((i) => i.id === 1)!.read).toBe(true)
    expect(w.find('[data-slot="notification-list-count"]').text()).toBe('1 unread')
    expect(rowsOf(w)[0].attributes('data-read')).toBe('true')
  })

  it('click on a read item emits select only', async () => {
    const w = make()
    await rowsOf(w)[1].find('[data-slot="notification-list-item-main"]').trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
    expect(w.emitted('read')).toBeUndefined()
  })

  it('rows are native buttons (Enter/Space activate) or links', () => {
    const w = make()
    const mains = w.findAll('[data-slot="notification-list-item-main"]')
    expect(mains[0].element.tagName).toBe('BUTTON')
    expect(mains[0].attributes('type')).toBe('button')
    expect(mains[2].element.tagName).toBe('A')
    expect(mains[2].attributes('href')).toBe('/billing')
  })

  it('mark all as read emits ids and hides the button', async () => {
    const w = make()
    await w.find('[data-slot="notification-list-mark-all"]').trigger('click')
    expect(w.emitted('read-all')![0]).toEqual([[1, 3]])
    expect(w.find('[data-slot="notification-list-count"]').text()).toBe('All caught up')
    expect(w.find('[data-slot="notification-list-mark-all"]').exists()).toBe(false)
    expect(rowsOf(w).every((r) => r.attributes('data-read') === 'true')).toBe(true)
  })

  it('dismiss removes the row and emits', async () => {
    const w = make({ dismissible: true })
    const btn = w.findAll('[data-slot="notification-list-dismiss"]')
    expect(btn).toHaveLength(3)
    expect(btn[1].attributes('aria-label')).toBe('Dismiss: New comment')
    await btn[1].trigger('click')
    expect(w.emitted('dismiss')![0]).toEqual(['b'])
    expect(rowsOf(w)).toHaveLength(2)
    expect((w.emitted('update:items')![0][0] as NotificationItem[]).map((i) => i.id)).toEqual([1, 3])
  })

  it('groups items by `group` in order of first appearance', () => {
    const items = [
      { id: 1, title: 'a', group: 'Today' },
      { id: 2, title: 'b' },
      { id: 3, title: 'c', group: 'Today' },
      { id: 4, title: 'd', group: 'Earlier' },
    ]
    const w = make({ items })
    const groups = w.findAll('[data-slot="notification-list-group"]')
    expect(groups).toHaveLength(3)
    expect(w.findAll('[data-slot="notification-list-group-heading"]').map((h) => h.text())).toEqual(['Today', 'Earlier'])
    expect(groups[0].findAll('li')).toHaveLength(2)
    const heading = w.find('h3')
    expect(groups[0].find('ul').attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(groups[1].find('ul').attributes('aria-labelledby')).toBeUndefined()
  })

  it('maxItems collapses with Show more / Show less', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: i, title: `n${i}` }))
    const w = make({ items, maxItems: 3 })
    expect(rowsOf(w)).toHaveLength(3)
    const more = w.find('[data-slot="notification-list-more"]')
    expect(more.text()).toBe('Show more (5)')
    expect(more.attributes('aria-expanded')).toBe('false')
    await more.trigger('click')
    expect(rowsOf(w)).toHaveLength(8)
    expect(w.emitted('show-more')).toHaveLength(1)
    expect(w.find('[data-slot="notification-list-more"]').text()).toBe('Show less')
    await w.find('[data-slot="notification-list-more"]').trigger('click')
    expect(rowsOf(w)).toHaveLength(3)
    expect(w.emitted('show-more')).toHaveLength(1)
  })

  it('shows no Show more when items fit', () => {
    expect(make({ maxItems: 3 }).find('[data-slot="notification-list-more"]').exists()).toBe(false)
  })

  it('loading renders skeletons, aria-busy and hides list/header', () => {
    const w = make({ loading: true, loadingCount: 4 })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.findAll('[data-slot="notification-list-skeleton"]')).toHaveLength(4)
    expect(w.find('[data-slot="notification-list-item"]').exists()).toBe(false)
    expect(w.find('[data-slot="notification-list-header"]').exists()).toBe(false)
    expect(w.find('[data-slot="notification-list-loading"]').text()).toBe('Loading notifications')
  })

  it('empty state with default text and slot override', () => {
    const w = make({ items: [] })
    expect(w.find('[data-slot="notification-list-empty"]').text()).toBe('No notifications')
    expect(w.find('[data-slot="notification-list-count"]').text()).toBe('All caught up')
    const s = make({ items: [] }, { slots: { empty: '<em id="e">Nothing</em>' } })
    expect(s.find('#e').exists()).toBe(true)
  })

  it('icon slot receives the item', () => {
    const w = make({}, { slots: { icon: '<template #icon="{ item }"><b class="ic">{{ item.title[0] }}</b></template>' } })
    expect(w.findAll('.ic').map((n) => n.text())).toEqual(['D', 'N', 'I'])
  })

  it('compact variant', () => {
    const w = make({ variant: 'compact' })
    expect(w.attributes('data-variant')).toBe('compact')
    expect(w.classes()).toContain('text-xs')
    expect(rowsOf(w)[0].classes()).toContain('py-2')
  })
})

describe('NotificationList controlled usage', () => {
  it('prop changes replace local state', async () => {
    const w = make()
    await rowsOf(w)[0].find('[data-slot="notification-list-item-main"]').trigger('click')
    await w.setProps({ items: [{ id: 9, title: 'Fresh', read: false }] })
    expect(rowsOf(w)).toHaveLength(1)
    expect(rowsOf(w)[0].text()).toContain('Fresh')
  })

  it('in-place mutation of items is picked up (deep)', async () => {
    const items = mk()
    const w = make({ items })
    await w.setProps({ items: [...items] })
    items.push({ id: 'z', title: 'Pushed' })
    await nextTick()
    expect(rowsOf(w)).toHaveLength(3)
  })

  it('markReadOnSelect=false keeps unread', async () => {
    const w = make({ markReadOnSelect: false })
    await rowsOf(w)[0].find('[data-slot="notification-list-item-main"]').trigger('click')
    expect(w.emitted('select')).toHaveLength(1)
    expect(w.emitted('read')).toBeUndefined()
  })

  it('showMarkAll=false hides the button', () => {
    expect(make({ showMarkAll: false }).find('[data-slot="notification-list-mark-all"]').exists()).toBe(false)
  })

  it('does not mutate the items prop', async () => {
    const items = mk()
    const w = make({ items })
    await w.find('[data-slot="notification-list-mark-all"]').trigger('click')
    expect(items.filter((i) => !i.read)).toHaveLength(2)
  })
})

describe('NotificationList customisation', () => {
  it('merges class last, passes attrs, custom labels and unreadLabel', () => {
    const w = make(
      { class: 'custom rounded-none', markAllLabel: 'Clear', unreadLabel: (n: number) => `${n} nuevos`, dismissible: true, dismissLabel: 'Cerrar' },
      { attrs: { 'data-testid': 'nl', 'aria-label': 'Inbox' } },
    )
    expect(w.classes()).toContain('custom')
    expect(w.classes()).toContain('rounded-none')
    expect(w.classes()).not.toContain('rounded-lg')
    expect(w.attributes('data-testid')).toBe('nl')
    expect(w.attributes('aria-label')).toBe('Inbox')
    expect(w.find('[data-slot="notification-list-mark-all"]').text()).toBe('Clear')
    expect(w.find('[data-slot="notification-list-count"]').text()).toBe('2 nuevos')
    expect(w.find('[data-slot="notification-list-dismiss"]').attributes('aria-label')).toBe('Cerrar: Deploy finished')
  })

  it('exposes cva variants', () => {
    expect(notificationListVariants({ variant: 'compact' })).toContain('text-xs')
    expect(notificationItemVariants({ read: false })).toContain('bg-primary/5')
    expect(notificationToneVariants({ tone: 'danger' })).toContain('text-destructive')
  })

  it('tone bubble classes follow tone', () => {
    const w = make()
    expect(rowsOf(w)[0].find('[data-slot="notification-list-icon"]').classes()).toContain('text-success')
  })
})

describe('NotificationList bad path', () => {
  it('ignores invalid items, missing ids and duplicate ids', () => {
    const items = [null, 5, { title: 'no id' }, { id: {}, title: 'obj id' }, { id: 1, title: 'ok' }, { id: 1, title: 'dup' }, { id: '1', title: 'string one' }] as unknown as NotificationItem[]
    const w = make({ items })
    expect(rowsOf(w).map((r) => r.find('[data-slot="notification-list-title"]').text())).toEqual(['Unread: ok', 'Unread: string one'])
  })

  it('non-array items render the empty state', () => {
    expect(make({ items: null }).find('[data-slot="notification-list-empty"]').exists()).toBe(true)
    expect(make({ items: 'x' }).find('[data-slot="notification-list-empty"]').exists()).toBe(true)
  })

  it('invalid times render nothing; NaN / invalid Date / garbage ISO', () => {
    const items = [
      { id: 1, title: 'a', time: NaN },
      { id: 2, title: 'b', time: new Date('nope') },
      { id: 3, title: 'c', time: '2025-99-99' },
      { id: 4, title: 'd', time: '  ' },
      { id: 5, title: 'e', time: {} as never },
      { id: 6, title: 'f', time: Infinity },
    ]
    const w = make({ items })
    expect(w.find('[data-slot="notification-list-time"]').exists()).toBe(false)
  })

  it('javascript: and empty hrefs are ignored', () => {
    const w = make({ items: [{ id: 1, title: 'a', href: 'javascript:alert(1)' }, { id: 2, title: 'b', href: '  ' }, { id: 3, title: 'c', href: 42 as never }] })
    const mains = w.findAll('[data-slot="notification-list-item-main"]')
    expect(mains.every((m) => m.element.tagName === 'BUTTON')).toBe(true)
  })

  it('unknown tone falls back to neutral; unknown variant to default', () => {
    const w = make({ items: [{ id: 1, title: 'a', icon: faBell, tone: 'weird' }], variant: 'huge' })
    expect(w.find('[data-slot="notification-list-icon"]').classes()).toContain('bg-muted')
    expect(w.attributes('data-variant')).toBeUndefined()
  })

  it.each([NaN, 0, -3, Infinity, undefined])('maxItems %s means unlimited', (maxItems) => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: i, title: `n${i}` }))
    const w = make({ items, maxItems })
    expect(rowsOf(w)).toHaveLength(5)
    expect(w.find('[data-slot="notification-list-more"]').exists()).toBe(false)
  })

  it('maxItems fractional is floored', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: i, title: `n${i}` }))
    expect(rowsOf(make({ items, maxItems: 2.9 }))).toHaveLength(2)
  })

  it('missing title and description tolerated', () => {
    const w = make({ items: [{ id: 1 } as unknown as NotificationItem] })
    expect(rowsOf(w)).toHaveLength(1)
    expect(w.find('[data-slot="notification-list-description"]').exists()).toBe(false)
  })

  it('loadingCount is clamped', () => {
    expect(make({ loading: true, loadingCount: -2 }).findAll('[data-slot="notification-list-skeleton"]')).toHaveLength(0)
    expect(make({ loading: true, loadingCount: NaN }).findAll('[data-slot="notification-list-skeleton"]')).toHaveLength(0)
    expect(make({ loading: true, loadingCount: 9999 }).findAll('[data-slot="notification-list-skeleton"]')).toHaveLength(50)
  })

  it('invalid now falls back to current time', async () => {
    const w = make({ now: NaN, items: [{ id: 1, title: 'a', time: Date.now() }] })
    await nextTick()
    expect(w.find('time').text()).toBe('now')
  })

  it('Date `now` is accepted', () => {
    const w = make({ now: new Date(NOW), items: [{ id: 1, title: 'a', time: NOW - 2 * 86400_000 }] })
    expect(w.find('time').text()).toBe('2 days ago')
  })

  it('mark all is a no-op when nothing is unread (called via rapid clicks)', async () => {
    const w = make()
    const btn = w.find('[data-slot="notification-list-mark-all"]')
    await btn.trigger('click')
    await btn.trigger('click')
    expect(w.emitted('read-all')).toHaveLength(1)
  })

  it('keeps non-object entries untouched when marking and dismissing', async () => {
    const items = [null, { id: 1, title: 'a' }] as unknown as NotificationItem[]
    const w = make({ items, dismissible: true })
    await w.find('[data-slot="notification-list-item-main"]').trigger('click')
    await w.find('[data-slot="notification-list-mark-all"]').exists()
    await w.find('[data-slot="notification-list-dismiss"]').trigger('click')
    expect(rowsOf(w)).toHaveLength(0)
    const w2 = make({ items: [null, { id: 1, title: 'a' }, { id: 2, title: 'b' }] as unknown as NotificationItem[] })
    await w2.find('[data-slot="notification-list-mark-all"]').trigger('click')
    expect((w2.emitted('update:items')![0][0] as unknown[])[0]).toBeNull()
  })
})

describe('NotificationList edge cases', () => {
  it('handles 0, 1 and 10 000 items', () => {
    expect(make({ items: [] }).findAll('li')).toHaveLength(0)
    expect(make({ items: [{ id: 1, title: 'one' }] }).findAll('[data-slot="notification-list-item"]')).toHaveLength(1)
    const many = Array.from({ length: 10000 }, (_, i) => ({ id: i, title: `n${i}`, read: i % 2 === 0 }))
    const w = make({ items: many, maxItems: 20 })
    expect(rowsOf(w)).toHaveLength(20)
    expect(w.find('[data-slot="notification-list-count"]').text()).toBe('5000 unread')
  })

  it('unicode / RTL / long text render safely as text', () => {
    const w = make({ items: [{ id: 1, title: 'مرحبا 👋 <b>bold</b>', description: 'שלום'.repeat(200) }] })
    expect(w.find('[data-slot="notification-list-title"]').text()).toContain('<b>bold</b>')
    expect(w.find('b').exists()).toBe(false)
  })

  it('numeric 0 id works', async () => {
    const w = make({ items: [{ id: 0, title: 'zero' }] })
    await w.find('[data-slot="notification-list-item-main"]').trigger('click')
    expect(w.emitted('read')![0]).toEqual([0])
  })

  it('future times and unit boundaries', () => {
    const f = (ms: number) => formatNotificationTime(NOW + ms, NOW, 'en').text
    expect(f(0)).toBe('now')
    expect(f(30_000)).toBe('in 30 seconds')
    expect(f(-59_000)).toBe('59 seconds ago')
    expect(f(-60_000)).toBe('1 minute ago')
    expect(f(-3600_000)).toBe('1 hour ago')
    expect(f(-86400_000)).toBe('yesterday')
    expect(f(86400_000 * 14)).toBe('in 2 weeks')
    expect(f(-86400_000 * 40)).toBe('last month')
    expect(f(-86400_000 * 800)).toBe('2 years ago')
  })

  it('time helpers: bad locale falls back, missing Intl formatter gives ISO date, non-date toNotificationDate', () => {
    expect(formatNotificationTime(NOW - 120_000, NOW, 'not_a_locale_@@').text).toMatch(/2 minutes ago/)
    expect(formatNotificationTime(NOW, NaN).iso).toBe(new Date(NOW).toISOString())
    const spy = vi.spyOn(Date.prototype, 'toLocaleString').mockImplementationOnce(() => {
      throw new RangeError('bad')
    })
    expect(formatNotificationTime(NOW, NOW, 'en').title).toBeTruthy()
    spy.mockRestore()
    const orig = Intl.RelativeTimeFormat
    Object.defineProperty(Intl, 'RelativeTimeFormat', { value: undefined, configurable: true, writable: true })
    expect(formatNotificationTime(NOW, NOW).text).toBe('2025-06-15')
    Object.defineProperty(Intl, 'RelativeTimeFormat', { value: orig, configurable: true, writable: true })
    expect(toNotificationDate(null)).toBeNull()
    expect(toNotificationDate('hello')).toBeNull()
    expect(toNotificationDate(' 2025-01-01 ')).toBeInstanceOf(Date)
    expect(formatNotificationTime(undefined).text).toBe('')
  })

  it('rapid mark-read clicks emit once per unread row', async () => {
    const w = make()
    const btn = rowsOf(w)[0].find('[data-slot="notification-list-item-main"]')
    await btn.trigger('click')
    await btn.trigger('click')
    await btn.trigger('click')
    expect(w.emitted('read')).toHaveLength(1)
    expect(w.emitted('select')).toHaveLength(3)
  })

  it('registers no global listeners or timers and unmounts cleanly', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const addDoc = vi.spyOn(document, 'addEventListener')
    const timers = vi.spyOn(globalThis, 'setInterval')
    const w = make({}, { attachTo: document.body })
    w.unmount()
    expect(add).not.toHaveBeenCalledWith('resize', expect.anything())
    expect(addDoc).not.toHaveBeenCalledWith('keydown', expect.anything())
    expect(timers).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-slot="notification-list"]')).toBeNull()
  })

describe('NotificationList accessibility and slop rules', () => {
  it('the region name is configurable so several lists on a page stay distinguishable', () => {
    expect(make().attributes('aria-label')).toBe('Notifications')
    expect(make({ label: 'Build alerts' }).attributes('aria-label')).toBe('Build alerts')
  })

  it('group headings are sentence case, counts and times use tabular figures, targets are larger on touch', () => {
    const w = make({ dismissible: true, items: [{ id: 1, title: 'A', group: 'Today', time: NOW - 60_000 }] })
    expect(w.find('[data-slot="notification-list-group-heading"]').classes()).not.toContain('uppercase')
    expect(w.find('[data-slot="notification-list-count"]').classes()).toContain('tabular-nums')
    expect(w.find('[data-slot="notification-list-time"]').classes()).toContain('tabular-nums')
    expect(w.find('[data-slot="notification-list-dismiss"]').classes()).toEqual(expect.arrayContaining(['size-7', 'pointer-coarse:size-10']))
    expect(w.find('[data-slot="notification-list-item-main"]').classes()).toContain('text-start')
  })
})
})
