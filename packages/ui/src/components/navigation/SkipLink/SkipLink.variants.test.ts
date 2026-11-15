import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import SkipLink from './SkipLink.vue'
import { SKIP_LINK_SIZES, SKIP_LINK_VARIANTS, skipLinkVariants } from './index'

const settle = () => new Promise((r) => setTimeout(r, 5))
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
const make = (props: Record<string, unknown> = {}) => mount(SkipLink, { props })

describe('SkipLink variations', () => {
  it('solid md is the default and keeps today\'s classes', () => {
    const w = make()
    expect(w.attributes('data-variant')).toBe('solid')
    expect(w.attributes('data-size')).toBe('md')
    expect(new Set(w.classes())).toEqual(
      new Set(
        'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-(--z-toast) focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'.split(' '),
      ),
    )
    expect(w.text()).toBe('Skip to main content')
  })

  describe('variant', () => {
    it('outline uses the page surface with a border', () => {
      const cls = make({ variant: 'outline' }).classes()
      expect(cls).toEqual(expect.arrayContaining(['focus:border', 'focus:border-input', 'focus:bg-background', 'focus:text-foreground']))
      expect(cls).not.toContain('focus:bg-primary')
      expect(cls).not.toContain('focus:text-primary-foreground')
    })

    it('inverted fills with the foreground colour', () => {
      const cls = make({ variant: 'inverted' }).classes()
      expect(cls).toEqual(expect.arrayContaining(['focus:bg-foreground', 'focus:text-background']))
      expect(cls).not.toContain('focus:bg-primary')
    })

    it('every variant stays hidden until focused and keeps the focus ring and edge position', () => {
      for (const variant of SKIP_LINK_VARIANTS) {
        const cls = make({ variant }).classes()
        expect(cls, variant).toEqual(expect.arrayContaining(['sr-only', 'focus:not-sr-only', 'focus:start-3', 'focus:top-3', 'focus-visible:ring-3']))
      }
    })

    it('unknown variant falls back to solid; every variant differs', () => {
      expect(make({ variant: 'ghost' }).attributes('data-variant')).toBe('solid')
      expect(make({ variant: 'ghost' }).classes()).toContain('focus:bg-primary')
      expect(new Set(SKIP_LINK_VARIANTS.map((variant) => make({ variant }).classes().join(' '))).size).toBe(3)
    })
  })

  describe('size', () => {
    it('sm is compact but keeps a 24px height (text-xs plus py-1)', () => {
      const cls = make({ size: 'sm' }).classes()
      expect(cls).toEqual(expect.arrayContaining(['focus:px-3', 'focus:py-1', 'focus:text-xs']))
      expect(cls).not.toContain('focus:px-4')
      expect(cls).not.toContain('focus:text-sm')
    })

    it('lg is roomier', () => {
      const cls = make({ size: 'lg' }).classes()
      expect(cls).toEqual(expect.arrayContaining(['focus:px-5', 'focus:py-3', 'focus:text-base']))
      expect(cls).not.toContain('focus:py-2')
    })

    it('unknown size falls back to md; every size differs', () => {
      expect(make({ size: 'xl' }).attributes('data-size')).toBe('md')
      expect(make({ size: 'xl' }).classes()).toContain('focus:px-4')
      expect(new Set(SKIP_LINK_SIZES.map((size) => make({ size }).classes().join(' '))).size).toBe(3)
    })
  })

  it('combinations and class overrides do not conflict', () => {
    const w = make({ variant: 'outline', size: 'lg', class: 'focus:absolute focus:px-8' })
    expect(w.classes()).toEqual(expect.arrayContaining(['focus:absolute', 'focus:px-8', 'focus:border-input', 'focus:text-base']))
    expect(w.classes()).not.toContain('focus:fixed')
    expect(w.classes()).not.toContain('focus:px-5')
  })

  it('still skips to the target, in every variant', async () => {
    for (const variant of SKIP_LINK_VARIANTS) {
      document.body.innerHTML = ''
      const main = document.createElement('main')
      main.id = 'main-content'
      document.body.appendChild(main)
      vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
      const w = mount(SkipLink, { props: { variant, size: 'sm' }, attachTo: document.body })
      await settle()
      w.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(document.activeElement, variant).toBe(main)
      expect(w.attributes('href')).toBe('#main-content')
      w.unmount()
    }
  })

  it('custom text and exported variants merge through cn()', () => {
    const w = mount(SkipLink, { props: { variant: 'inverted' }, slots: { default: 'Skip to documentation' } })
    expect(w.text()).toBe('Skip to documentation')
    expect(cn(skipLinkVariants({ variant: 'outline', size: 'sm' }))).toContain('focus:px-3')
    expect(cn(skipLinkVariants({ size: 'lg' }))).not.toContain('focus:px-4')
  })
})
