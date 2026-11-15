import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBullhorn } from '@fortawesome/free-solid-svg-icons'
import Banner from './Banner.vue'
import { BANNER_LAYOUTS, BANNER_SIZES, bannerVariants } from './variants'

const make = (props: Record<string, unknown> = {}, text = 'Maintenance tonight') => mount(Banner, { props, slots: { default: text } })

describe('Banner size', () => {
  it('md is the default and keeps the original class string', () => {
    expect(bannerVariants()).toBe('relative flex w-full items-center gap-3 px-4 py-2.5 text-sm bg-primary text-primary-foreground')
    const w = make()
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-3', 'px-4', 'py-2.5', 'text-sm']))
    expect(w.attributes('data-size')).toBeUndefined()
  })

  it.each([
    ['sm', ['gap-2', 'px-3', 'py-1.5', 'text-xs']],
    ['lg', ['gap-4', 'px-6', 'py-4', 'text-base']],
  ] as const)('%s changes padding, gap and type', (size, classes) => {
    const w = make({ size })
    expect(w.classes()).toEqual(expect.arrayContaining([...classes]))
    expect(w.classes()).not.toContain('px-4')
    expect(w.attributes('data-size')).toBe(size)
  })

  it('an unknown size falls back to md', () => {
    const w = make({ size: 'giant' })
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.classes()).toContain('py-2.5')
  })

  it('keeps the dismiss button named and sized at every size', () => {
    for (const size of BANNER_SIZES) {
      const btn = make({ size, dismissible: true }).find('[data-slot="banner-dismiss"]')
      expect(btn.attributes('aria-label')).toBe('Dismiss')
      expect(btn.classes()).toEqual(expect.arrayContaining(['size-7', 'pointer-coarse:size-10']))
    }
  })
})

describe('Banner layout', () => {
  it('default adds nothing', () => {
    const w = make()
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.classes()).not.toContain('text-center')
  })

  it('centered centres text and actions', () => {
    const w = make({ layout: 'centered', actionLabel: 'View status' })
    expect(w.classes()).toEqual(expect.arrayContaining(['justify-center', 'text-center']))
    expect(w.attributes('data-layout')).toBe('centered')
    expect(w.find('[data-slot="banner-cta"]').text()).toBe('View status')
  })

  it('an unknown layout falls back to default', () => {
    expect(make({ layout: 'diagonal' }).attributes('data-layout')).toBeUndefined()
  })

  it('every layout renders different markup', () => {
    expect(new Set(BANNER_LAYOUTS.map((layout) => make({ layout }).html())).size).toBe(BANNER_LAYOUTS.length)
  })
})

describe('Banner combinations', () => {
  it.each(BANNER_SIZES.flatMap((s) => BANNER_LAYOUTS.map((l) => [s, l] as const)))('size %s + layout %s keeps tone, role and a single padding', (size, layout) => {
    const w = make({ size, layout, variant: 'warning', appearance: 'soft', placement: 'inline', icon: faBullhorn })
    expect(w.attributes('role')).toBe('alert')
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-warning/15', 'rounded-lg']))
    expect(w.classes().filter((c) => /^px-/.test(c))).toHaveLength(1)
    expect(w.find('[data-slot="banner-icon"] svg').exists()).toBe(true)
  })

  it('class prop wins over size and layout', () => {
    const w = make({ size: 'lg', layout: 'centered', class: 'px-1 justify-start text-left' })
    expect(w.classes()).toEqual(expect.arrayContaining(['px-1', 'justify-start', 'text-left']))
    expect(w.classes()).not.toContain('px-6')
    expect(w.classes()).not.toContain('text-center')
  })

  it('handles long unbroken text in the centred layout', () => {
    const w = make({ layout: 'centered', size: 'sm' }, 'x'.repeat(500))
    expect(w.find('[data-slot="banner-content"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
  })
})
