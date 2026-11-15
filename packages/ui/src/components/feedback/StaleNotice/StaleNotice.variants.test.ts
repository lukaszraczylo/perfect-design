import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StaleNotice from './StaleNotice.vue'
import { STALE_NOTICE_TONES, STALE_NOTICE_VARIANTS, staleNoticeIconVariants, staleNoticeVariants } from './variants'

const NOW = Date.UTC(2026, 0, 10, 12, 0, 0)
const MIN = 60_000
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

const fresh = NOW - 1 * MIN
const stale = NOW - 20 * MIN
const make = (props: Record<string, unknown> = {}) => mount(StaleNotice, { props: { timestamp: fresh, ...props } })

describe('StaleNotice variant', () => {
  it('default keeps the original classes in both states', () => {
    expect(make().classes()).toEqual(['flex', 'flex-wrap', 'items-center', 'gap-x-2', 'gap-y-1', 'rounded-md', 'border', 'px-3', 'py-2', 'text-sm', 'bg-muted/40', 'text-muted-foreground'])
    const s = make({ timestamp: stale })
    expect(s.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'border-warning/50', 'bg-warning/15', 'text-foreground', 'px-3', 'py-2']))
    expect(s.find('svg').classes()).toEqual(expect.arrayContaining(['text-warning-foreground', 'dark:text-warning']))
    expect(make().attributes('data-variant')).toBeUndefined()
    expect(make().attributes('data-tone')).toBeUndefined()
  })

  it('inline has no box', () => {
    const w = make({ variant: 'inline', timestamp: stale })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-sm', 'text-foreground', 'bg-transparent']))
    expect(w.classes()).not.toContain('rounded-md')
    expect(w.classes()).not.toContain('px-3')
    expect(w.classes()).not.toContain('border-warning/50')
    expect(w.attributes('data-variant')).toBe('inline')
    expect(make({ variant: 'inline' }).classes()).toContain('text-muted-foreground')
  })

  it('banner is a full-width strip with top and bottom borders only', () => {
    const w = make({ variant: 'banner', timestamp: stale })
    expect(w.classes()).toEqual(expect.arrayContaining(['w-full', 'border-y', 'px-4', 'py-2', 'bg-warning/15']))
    expect(w.classes()).not.toContain('rounded-md')
    expect(w.attributes('data-variant')).toBe('banner')
  })

  it('pill is a small rounded chip', () => {
    const w = make({ variant: 'pill' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-full', 'w-fit', 'max-w-full', 'px-3', 'py-1', 'text-xs']))
    expect(w.classes()).not.toContain('text-sm')
  })

  it('an unknown variant falls back to default', () => {
    const w = make({ variant: 'ribbon' })
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.classes()).toContain('rounded-md')
  })

  it('every variant renders different classes', () => {
    expect(new Set(STALE_NOTICE_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(STALE_NOTICE_VARIANTS.length)
  })
})

describe('StaleNotice tone', () => {
  it.each([
    ['neutral', 'bg-muted/40', 'text-muted-foreground'],
    ['info', 'bg-info/15', 'text-foreground'],
    ['success', 'bg-success/15', 'text-foreground'],
    ['warning', 'bg-warning/15', 'text-foreground'],
    ['danger', 'bg-destructive/10', 'text-foreground'],
  ] as const)('%s forces its surface even when the data is fresh', (tone, bg, fg) => {
    const w = make({ tone })
    expect(w.classes()).toEqual(expect.arrayContaining([bg, fg]))
    expect(w.attributes('data-tone')).toBe(tone)
  })

  it('a forced tone does not hide the stale wording', () => {
    const w = make({ tone: 'danger', timestamp: stale })
    expect(w.attributes('data-stale')).toBe('')
    expect(w.text()).toContain('Data may be out of date.')
    expect(w.classes()).toContain('bg-destructive/10')
    expect(w.find('svg').classes()).toContain('text-destructive')
  })

  it('a forced neutral tone keeps the stale wording but not the warning colour', () => {
    const w = make({ tone: 'neutral', timestamp: stale })
    expect(w.text()).toContain('Data may be out of date.')
    expect(w.classes()).not.toContain('bg-warning/15')
  })

  it('auto follows the data age, and an unknown tone is auto', () => {
    expect(make({ tone: 'auto', timestamp: stale }).classes()).toContain('bg-warning/15')
    expect(make({ tone: 'auto' }).classes()).toContain('bg-muted/40')
    const w = make({ tone: 'rainbow', timestamp: stale })
    expect(w.classes()).toContain('bg-warning/15')
    expect(w.attributes('data-tone')).toBeUndefined()
  })

  it('icon colour per tone', () => {
    expect(staleNoticeIconVariants({ tone: 'info' })).toBe('text-info')
    expect(staleNoticeIconVariants({ tone: 'success' })).toBe('text-success')
    expect(staleNoticeIconVariants({ tone: 'neutral' })).toBe('')
    expect(staleNoticeVariants()).toContain('bg-muted/40')
  })
})

describe('StaleNotice cross product and accessibility', () => {
  it.each(STALE_NOTICE_VARIANTS.flatMap((v) => STALE_NOTICE_TONES.map((t) => [v, t] as const)))('variant %s + tone %s keeps role, time and icon', (variant, tone) => {
    const w = make({ variant, tone, timestamp: stale, refreshable: true })
    expect(w.attributes('role')).toBe('status')
    expect(w.find('time').attributes('datetime')).toBe(new Date(stale).toISOString())
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('[data-slot="stale-notice-refresh"]').text()).toBe('Refresh')
    expect(w.find('[data-slot="stale-notice-text"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
  })

  it('class prop wins over the variant padding', () => {
    const w = make({ variant: 'banner', class: 'px-1 mine' })
    expect(w.classes()).toEqual(expect.arrayContaining(['px-1', 'mine']))
    expect(w.classes()).not.toContain('px-4')
  })

  it('hideWhenFresh still hides every variant until stale', () => {
    for (const variant of STALE_NOTICE_VARIANTS) {
      expect(make({ variant, hideWhenFresh: true }).find('[data-slot="stale-notice"]').exists()).toBe(false)
      expect(make({ variant, hideWhenFresh: true, timestamp: stale }).find('[data-slot="stale-notice"]').exists()).toBe(true)
    }
  })
})
