import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  ACTIVITY_FEED_DENSITIES, ACTIVITY_FEED_SIZES, ACTIVITY_FEED_TONES, ACTIVITY_FEED_VARIANTS, ActivityFeed,
  activityFeedItemVariants, activityFeedMarkerVariants, activityFeedToneIconVariants, activityFeedVariants,
} from './index'

const events = [
  { id: 'a', actor: 'Deploy bot', action: 'deployed', time: '2026-03-04T11:42:00Z', tone: 'success' as const },
  { id: 'b', actor: 'Reviewer 1', action: 'approved', time: '2026-03-03T10:00:00Z' },
]
const mk = (props: Record<string, unknown> = {}) => mount(ActivityFeed as never, { props: { label: 'Sample', events, now: '2026-03-04T12:00:00Z', timeZone: 'UTC', locale: 'en', ...props } as never })
const item = (w: ReturnType<typeof mk>) => w.find('[data-slot="activity-feed-item"]')

describe('ActivityFeed variations', () => {
  it('lists the values', () => {
    expect([...ACTIVITY_FEED_VARIANTS]).toEqual(['list', 'timeline', 'compact', 'grouped'])
    expect([...ACTIVITY_FEED_SIZES]).toEqual(['sm', 'md', 'lg'])
    expect([...ACTIVITY_FEED_DENSITIES]).toEqual(['comfortable', 'compact'])
    expect([...ACTIVITY_FEED_TONES]).toEqual(['neutral', 'primary', 'success', 'warning', 'danger', 'info'])
  })

  it('default output is stable and carries no data attributes', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('flex min-w-0 max-w-full flex-col text-foreground text-sm')
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.attributes('data-density')).toBeUndefined()
    expect(item(w).attributes('class')).toBe('group/item relative flex min-w-0 gap-3 border-b last:border-b-0 py-3')
  })

  it.each([['timeline', 'pb-5'], ['compact', 'gap-2'], ['grouped', 'gap-3']])('variant %s', (variant, cls) => {
    const w = mk({ variant })
    expect(w.attributes('data-variant')).toBe(variant)
    expect(item(w).classes()).toContain(cls)
    expect(mk({ variant }).html()).not.toBe(mk().html())
  })

  it('grouped adds a gap that follows density', () => {
    expect(mk({ variant: 'grouped' }).classes()).toContain('gap-6')
    expect(mk({ variant: 'grouped', density: 'compact' }).classes()).toContain('gap-3')
  })

  it.each([['sm', 'text-xs'], ['lg', 'text-base']])('size %s', (size, cls) => {
    const w = mk({ size })
    expect(w.attributes('data-size')).toBe(size)
    expect(w.classes()).toContain(cls)
    expect(w.classes()).not.toContain('text-sm')
  })

  it('size scales the avatar and the marker', () => {
    expect(mk({ size: 'sm' }).find('[data-slot="activity-feed-avatar"]').classes()).toContain('size-6')
    expect(mk().find('[data-slot="activity-feed-avatar"]').classes()).toContain('size-8')
    expect(mk({ size: 'lg' }).find('[data-slot="activity-feed-avatar"]').classes()).toContain('size-10')
    expect(mk({ size: 'lg', showAvatars: false }).find('[data-slot="activity-feed-marker"]').classes()).toContain('size-8')
    expect(mk({ size: 'sm', showAvatars: false }).find('[data-slot="activity-feed-marker"]').classes()).toContain('size-5')
  })

  it('density compact tightens every variant', () => {
    expect(item(mk({ density: 'compact' })).classes()).toContain('py-1.5')
    expect(item(mk({ density: 'compact' })).classes()).not.toContain('py-3')
    expect(mk({ density: 'compact' }).attributes('data-density')).toBe('compact')
    expect(item(mk({ variant: 'timeline', density: 'compact' })).classes()).toContain('pb-2.5')
    expect(item(mk({ variant: 'compact', density: 'compact' })).classes()).toContain('py-1')
    expect(item(mk({ variant: 'grouped', density: 'compact' })).classes()).toContain('py-1.5')
  })

  it('unknown values fall back to the defaults', () => {
    const base = mk()
    const w = mk({ variant: 'fancy', size: 'huge', density: 'dense' })
    expect(w.html()).toBe(base.html())
  })

  it('combinations of the three dimensions render without conflict', () => {
    for (const variant of ACTIVITY_FEED_VARIANTS)
      for (const size of ACTIVITY_FEED_SIZES)
        for (const density of ACTIVITY_FEED_DENSITIES) {
          const w = mk({ variant, size, density })
          expect(w.findAll('li')).toHaveLength(2)
          expect(w.attributes('data-variant') ?? 'list').toBe(variant)
        }
  })

  it('exports class helpers for plain elements', () => {
    expect(activityFeedVariants({ size: 'lg' })).toContain('text-base')
    expect(activityFeedItemVariants({ variant: 'timeline' })).toContain('pb-5')
    expect(activityFeedMarkerVariants({ tone: 'warning' })).toContain('text-warning-foreground')
    expect(activityFeedMarkerVariants({ tone: 'warning' })).toContain('dark:text-warning')
    expect(activityFeedToneIconVariants({ tone: 'danger' })).toContain('text-destructive')
    for (const tone of ACTIVITY_FEED_TONES) expect(activityFeedMarkerVariants({ tone })).toContain('border')
  })

  it('uses logical properties only (no physical left/right spacing)', () => {
    const html = mk({ variant: 'timeline', expanded: ['a'] }).html()
    expect(html).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r)-/)
  })

  it('keeps forced-colors and reflow hooks: bordered markers, wrapping text', () => {
    const w = mk({ variant: 'timeline', showAvatars: false })
    expect(w.find('[data-slot="activity-feed-marker"]').classes()).toContain('border')
    expect(w.find('[data-slot="activity-feed-text"]').classes()).toContain('break-words')
    expect(w.classes()).toContain('min-w-0')
  })
})
