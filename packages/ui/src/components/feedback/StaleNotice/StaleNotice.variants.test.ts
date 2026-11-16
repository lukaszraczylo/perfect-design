import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StaleNotice from './StaleNotice.vue'
import { STALE_NOTICE_TONES, STALE_NOTICE_VARIANTS, staleNoticeIconVariants, staleNoticeVariants } from './variants'

const NOW = Date.UTC(2026, 0, 10, 12, 0, 0)
const MIN = 60_000
enableAutoUnmount(afterEach)
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

const fresh = NOW - 1 * MIN
const stale = NOW - 20 * MIN
const make = async (props: Record<string, unknown> = {}) => {
  const w = mount(StaleNotice, { props: { timestamp: fresh, ...props } })
  await nextTick()
  return w
}

describe('StaleNotice variant', () => {
  it('default keeps the original classes in both states', async () => {
    expect((await make()).classes()).toEqual(['flex', 'flex-wrap', 'items-center', 'gap-x-2', 'gap-y-1', 'rounded-md', 'border', 'px-3', 'py-2', 'text-sm', 'bg-muted/40', 'text-muted-foreground'])
    const s = (await make({ timestamp: stale }))
    expect(s.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'border-warning/50', 'bg-warning/15', 'text-foreground', 'px-3', 'py-2']))
    expect(s.find('svg').classes()).toEqual(expect.arrayContaining(['text-warning-foreground', 'dark:text-warning']))
    expect((await make()).attributes('data-variant')).toBeUndefined()
    expect((await make()).attributes('data-tone')).toBeUndefined()
  })

  it('inline has no box', async () => {
    const w = (await make({ variant: 'inline', timestamp: stale }))
    expect(w.classes()).toEqual(expect.arrayContaining(['text-sm', 'text-foreground', 'bg-transparent']))
    expect(w.classes()).not.toContain('rounded-md')
    expect(w.classes()).not.toContain('px-3')
    expect(w.classes()).not.toContain('border-warning/50')
    expect(w.attributes('data-variant')).toBe('inline')
    expect((await make({ variant: 'inline' })).classes()).toContain('text-muted-foreground')
  })

  it('banner is a full-width strip with top and bottom borders only', async () => {
    const w = (await make({ variant: 'banner', timestamp: stale }))
    expect(w.classes()).toEqual(expect.arrayContaining(['w-full', 'border-y', 'px-4', 'py-2', 'bg-warning/15']))
    expect(w.classes()).not.toContain('rounded-md')
    expect(w.attributes('data-variant')).toBe('banner')
  })

  it('pill is a small rounded chip', async () => {
    const w = (await make({ variant: 'pill' }))
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-full', 'w-fit', 'max-w-full', 'px-3', 'py-1', 'text-xs']))
    expect(w.classes()).not.toContain('text-sm')
  })

  it('an unknown variant falls back to default', async () => {
    const w = (await make({ variant: 'ribbon' }))
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.classes()).toContain('rounded-md')
  })

  it('every variant renders different classes', async () => {
    const htmls = await Promise.all(STALE_NOTICE_VARIANTS.map(async (variant) => (await make({ variant })).html()))
    expect(new Set(htmls).size).toBe(STALE_NOTICE_VARIANTS.length)
  })
})

describe('StaleNotice tone', () => {
  it.each([
    ['neutral', 'bg-muted/40', 'text-muted-foreground'],
    ['info', 'bg-info/15', 'text-foreground'],
    ['success', 'bg-success/15', 'text-foreground'],
    ['warning', 'bg-warning/15', 'text-foreground'],
    ['danger', 'bg-destructive/10', 'text-foreground'],
  ] as const)('%s forces its surface even when the data is fresh', async (tone, bg, fg) => {
    const w = (await make({ tone }))
    expect(w.classes()).toEqual(expect.arrayContaining([bg, fg]))
    expect(w.attributes('data-tone')).toBe(tone)
  })

  it('a forced tone does not hide the stale wording', async () => {
    const w = (await make({ tone: 'danger', timestamp: stale }))
    expect(w.attributes('data-stale')).toBe('')
    expect(w.text()).toContain('Data may be out of date.')
    expect(w.classes()).toContain('bg-destructive/10')
    expect(w.find('svg').classes()).toContain('text-destructive')
  })

  it('a forced neutral tone keeps the stale wording but not the warning colour', async () => {
    const w = (await make({ tone: 'neutral', timestamp: stale }))
    expect(w.text()).toContain('Data may be out of date.')
    expect(w.classes()).not.toContain('bg-warning/15')
  })

  it('auto follows the data age, and an unknown tone is auto', async () => {
    expect((await make({ tone: 'auto', timestamp: stale })).classes()).toContain('bg-warning/15')
    expect((await make({ tone: 'auto' })).classes()).toContain('bg-muted/40')
    const w = (await make({ tone: 'rainbow', timestamp: stale }))
    expect(w.classes()).toContain('bg-warning/15')
    expect(w.attributes('data-tone')).toBeUndefined()
  })

  it('icon colour per tone', async () => {
    expect(staleNoticeIconVariants({ tone: 'info' })).toBe('text-info')
    expect(staleNoticeIconVariants({ tone: 'success' })).toBe('text-success')
    expect(staleNoticeIconVariants({ tone: 'neutral' })).toBe('')
    expect(staleNoticeVariants()).toContain('bg-muted/40')
  })
})

describe('StaleNotice cross product and accessibility', () => {
  it.each(STALE_NOTICE_VARIANTS.flatMap((v) => STALE_NOTICE_TONES.map((t) => [v, t] as const)))('variant %s + tone %s keeps role, time and icon', async (variant, tone) => {
    const w = (await make({ variant, tone, timestamp: stale, refreshable: true }))
    expect(w.attributes('role')).toBe('status')
    expect(w.find('time').attributes('datetime')).toBe(new Date(stale).toISOString())
    expect(w.find('svg').exists()).toBe(true)
    expect(w.find('[data-slot="stale-notice-refresh"]').text()).toBe('Refresh')
    expect(w.find('[data-slot="stale-notice-text"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
  })

  it('class prop wins over the variant padding', async () => {
    const w = (await make({ variant: 'banner', class: 'px-1 mine' }))
    expect(w.classes()).toEqual(expect.arrayContaining(['px-1', 'mine']))
    expect(w.classes()).not.toContain('px-4')
  })

  it('hideWhenFresh still hides every variant until stale', async () => {
    for (const variant of STALE_NOTICE_VARIANTS) {
      expect((await make({ variant, hideWhenFresh: true })).find('[data-slot="stale-notice"]').exists()).toBe(false)
      expect((await make({ variant, hideWhenFresh: true, timestamp: stale })).find('[data-slot="stale-notice"]').exists()).toBe(true)
    }
  })
})
