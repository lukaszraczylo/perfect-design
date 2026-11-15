import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import NotificationList, { type NotificationItem } from './NotificationList.vue'
import {
  NOTIFICATION_LIST_APPEARANCES,
  NOTIFICATION_LIST_SHAPES,
  NOTIFICATION_LIST_VARIANTS,
  notificationListVariants,
  notificationToneVariants,
} from './variants'

const NOW = Date.UTC(2025, 5, 15, 12, 0, 0)
const items = (): NotificationItem[] => [
  { id: 1, title: 'Deploy finished', time: NOW - 5 * 60_000, read: false, tone: 'success', icon: faBell },
  { id: 2, title: 'Invoice overdue', time: NOW - 3600_000, read: true, tone: 'danger', icon: faBell },
]
const make = (props: Record<string, unknown> = {}) => mount(NotificationList, { props: { items: items(), now: NOW, locale: 'en', ...props } })
const icons = (w: ReturnType<typeof make>) => w.findAll('[data-slot="notification-list-icon"]')

describe('NotificationList appearance', () => {
  it('card is the default and keeps the original classes', () => {
    const w = make()
    expect(w.classes()).toEqual(['flex', 'w-full', 'flex-col', 'overflow-hidden', 'rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'text-sm'])
    expect(w.attributes('data-appearance')).toBeUndefined()
  })

  it('flush drops the border, radius and fill but keeps the row dividers', () => {
    const w = make({ appearance: 'flush' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-0', 'bg-transparent']))
    expect(w.classes()).not.toContain('rounded-lg')
    expect(w.classes()).not.toContain('bg-card')
    expect(w.attributes('data-appearance')).toBe('flush')
    expect(w.find('[data-slot="notification-list-item"]').classes()).toContain('border-b')
    expect(w.find('[data-slot="notification-list-header"]').classes()).toContain('border-b')
  })

  it('an unknown appearance falls back to card', () => {
    const w = make({ appearance: 'floating' })
    expect(w.attributes('data-appearance')).toBeUndefined()
    expect(w.classes()).toContain('rounded-lg')
  })

  it('combines with the compact density', () => {
    const w = make({ appearance: 'flush', variant: 'compact' })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-xs', 'border-0']))
    expect(notificationListVariants({ variant: 'compact', appearance: 'flush' })).toContain('rounded-none')
  })

  it('class prop wins', () => {
    const w = make({ appearance: 'flush', class: 'bg-muted mine' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-muted', 'mine']))
    expect(w.classes()).not.toContain('bg-transparent')
  })
})

describe('NotificationList shape', () => {
  it('circle is the default bubble', () => {
    const w = make()
    for (const i of icons(w)) expect(i.classes()).toEqual(expect.arrayContaining(['rounded-full', 'size-8']))
    expect(w.attributes('data-shape')).toBeUndefined()
  })

  it('square uses the control radius, keeps the tone and the size', () => {
    const w = make({ shape: 'square' })
    const [success, danger] = icons(w)
    expect(success.classes()).toEqual(expect.arrayContaining(['rounded-md', 'bg-success/15', 'text-success', 'size-8']))
    expect(success.classes()).not.toContain('rounded-full')
    expect(danger.classes()).toEqual(expect.arrayContaining(['rounded-md', 'bg-destructive/10', 'text-destructive']))
    expect(w.attributes('data-shape')).toBe('square')
  })

  it('square applies to the loading skeleton and the compact size', () => {
    const w = make({ shape: 'square', loading: true, loadingCount: 2, variant: 'compact' })
    const bubbles = w.findAll('[data-slot="notification-list-skeleton"] span.animate-pulse')
    expect(bubbles.length).toBeGreaterThan(0)
    expect(bubbles[0].classes()).toEqual(expect.arrayContaining(['rounded-md', 'size-6']))
    expect(notificationToneVariants({ shape: 'square', variant: 'compact' })).toContain('rounded-md')
  })

  it('an unknown shape falls back to circle', () => {
    const w = make({ shape: 'hexagon' })
    expect(w.attributes('data-shape')).toBeUndefined()
    expect(icons(w)[0].classes()).toContain('rounded-full')
  })
})

describe('NotificationList combinations and accessibility', () => {
  const cross = NOTIFICATION_LIST_VARIANTS.flatMap((v) => NOTIFICATION_LIST_APPEARANCES.flatMap((a) => NOTIFICATION_LIST_SHAPES.map((s) => [v, a, s] as const)))
  it.each(cross)('%s + %s + %s keeps the named region, the count and the rows', (variant, appearance, shape) => {
    const w = make({ variant, appearance, shape, label: 'Inbox' })
    expect(w.attributes('role')).toBe('region')
    expect(w.attributes('aria-label')).toBe('Inbox')
    expect(w.find('[data-slot="notification-list-count"]').attributes('aria-live')).toBe('polite')
    expect(w.findAll('[data-slot="notification-list-item"]')).toHaveLength(2)
    expect(w.find('[data-slot="notification-list-item-main"]').element.tagName).toBe('BUTTON')
  })

  it('the empty state keeps its status role in the flush appearance', () => {
    const w = make({ appearance: 'flush', items: [] })
    expect(w.find('[data-slot="notification-list-empty"]').attributes('role')).toBe('status')
  })
})
