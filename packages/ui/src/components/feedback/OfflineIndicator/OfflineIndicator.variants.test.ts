import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import OfflineIndicator from './OfflineIndicator.vue'
import { OFFLINE_INDICATOR_VARIANTS, offlineIndicatorIconVariants, offlineIndicatorVariants } from './variants'

let w: VueWrapper | undefined
const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => (w = mount(OfflineIndicator, { props: { offline: true, ...props }, slots }))
afterEach(() => {
  w?.unmount()
  w = undefined
})

describe('OfflineIndicator variant', () => {
  it('default keeps the original class string', () => {
    expect(offlineIndicatorVariants()).toBe('flex items-center gap-2 rounded-md border border-warning/50 bg-warning/15 px-3 py-2 text-sm text-foreground')
    const m = make()
    expect(m.classes()).toEqual(['flex', 'items-center', 'gap-2', 'rounded-md', 'border', 'border-warning/50', 'bg-warning/15', 'px-3', 'py-2', 'text-sm', 'text-foreground'])
    expect(m.attributes('data-variant')).toBeUndefined()
    expect(m.find('svg').classes()).toEqual(expect.arrayContaining(['text-warning-foreground', 'dark:text-warning']))
  })

  it('banner is a full-width filled strip with the warning foreground token', () => {
    const m = make({ variant: 'banner' })
    expect(m.classes()).toEqual(expect.arrayContaining(['w-full', 'justify-center', 'border-y', 'border-warning', 'bg-warning', 'text-warning-foreground', 'text-center']))
    expect(m.classes()).not.toContain('rounded-md')
    expect(m.find('svg').classes()).toContain('text-current')
    expect(m.attributes('data-variant')).toBe('banner')
  })

  it('pill is a small rounded chip that never overflows', () => {
    const m = make({ variant: 'pill' })
    expect(m.classes()).toEqual(expect.arrayContaining(['inline-flex', 'w-fit', 'max-w-full', 'rounded-full', 'border', 'bg-warning/15', 'px-3', 'py-1', 'text-xs']))
    expect(m.attributes('data-variant')).toBe('pill')
  })

  it('inline has no border and no fill', () => {
    const m = make({ variant: 'inline' })
    expect(m.classes()).toEqual(expect.arrayContaining(['inline-flex', 'max-w-full', 'gap-1.5', 'text-sm', 'text-foreground']))
    expect(m.classes().some((c) => c.startsWith('bg-') || c.startsWith('border'))).toBe(false)
    expect(offlineIndicatorIconVariants({ variant: 'inline' })).toContain('text-warning-foreground')
  })

  it('an unknown variant falls back to default', () => {
    const m = make({ variant: 'toast' })
    expect(m.attributes('data-variant')).toBeUndefined()
    expect(m.classes()).toContain('rounded-md')
  })

  it('every variant renders different markup', () => {
    expect(new Set(OFFLINE_INDICATOR_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(OFFLINE_INDICATOR_VARIANTS.length)
  })
})

describe('OfflineIndicator across variants', () => {
  it.each(OFFLINE_INDICATOR_VARIANTS)('%s keeps the live region, the icon and the text', (variant) => {
    const m = make({ variant })
    expect(m.attributes('role')).toBe('status')
    expect(m.attributes('aria-live')).toBe('polite')
    expect(m.attributes('data-state')).toBe('offline')
    expect(m.find('svg').attributes('aria-hidden')).toBe('true')
    expect(m.find('[data-slot="offline-indicator-message"]').text()).toBe('You are offline. Changes may not be saved.')
    expect(m.find('[data-slot="offline-indicator-message"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
  })

  it.each(OFFLINE_INDICATOR_VARIANTS)('%s renders no box while online (the live region stays mounted)', (variant) => {
    const m = make({ variant, offline: false })
    expect(m.classes()).toEqual(['contents'])
    expect(m.attributes('role')).toBe('status')
    expect(m.text()).toBe('')
  })

  it.each(OFFLINE_INDICATOR_VARIANTS)('%s: class prop wins, slot and icon override work, long text is allowed', (variant) => {
    const m = make({ variant, icon: faBan, class: 'px-9 mine' }, { default: 'x'.repeat(400) })
    expect(m.classes()).toEqual(expect.arrayContaining(['px-9', 'mine']))
    expect(m.find('svg path').attributes('d')).toBe(faBan.icon[4])
    expect(m.find('[data-slot="offline-indicator-message"]').text()).toHaveLength(400)
  })
})
