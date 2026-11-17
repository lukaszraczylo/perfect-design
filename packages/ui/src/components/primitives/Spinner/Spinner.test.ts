import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Spinner from './Spinner.vue'
import { SPINNER_VARIANTS } from './variants'

describe('Spinner', () => {
  it('is an indeterminate progressbar (like native <progress>) with a default label', () => {
    const w = mount(Spinner)
    expect(w.attributes('role')).toBe('progressbar')
    expect(w.attributes('aria-valuenow')).toBeUndefined()
    expect(w.attributes('aria-label')).toBe('Loading')
    expect(w.attributes('aria-hidden')).toBeUndefined()
  })
  it('decorative drops the role and name and hides it from assistive tech', () => {
    const w = mount(Spinner, { props: { decorative: true } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-label')).toBeUndefined()
    expect(w.attributes('aria-hidden')).toBe('true')
  })
  it('keeps a slower pulse for reduced motion instead of spinning', () => {
    expect(mount(Spinner).classes()).toContain('motion-reduce:animate-pulse')
  })
  it('accepts a custom label', () => {
    expect(mount(Spinner, { props: { label: 'Saving' } }).attributes('aria-label')).toBe('Saving')
  })
  it.each([['xs', 'size-3'], ['sm', 'size-4'], ['md', 'size-5'], ['lg', 'size-6'], ['xl', 'size-8']] as const)(
    'size %s -> %s',
    (size, cls) => {
      expect(mount(Spinner, { props: { size } }).classes()).toContain(cls)
    },
  )
  it('falls back to md for an unknown size (bad input)', () => {
    // @ts-expect-error deliberately invalid
    expect(mount(Spinner, { props: { size: 'huge' } }).classes()).toContain('size-5')
  })
  it('merges consumer class', () => {
    const w = mount(Spinner, { props: { class: 'text-red-500 size-10' } })
    expect(w.classes()).toContain('text-red-500')
    expect(w.classes()).toContain('size-10')
    expect(w.classes()).not.toContain('size-5')
  })

  describe('variants', () => {
    it('lists the five variants', () => {
      expect([...SPINNER_VARIANTS]).toEqual(['ring', 'dots', 'bars', 'pulse', 'orbit'])
    })
    it('ring is the default and keeps its markup without data-variant', () => {
      const w = mount(Spinner)
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('animate-spin')
      expect(w.findAll('circle')).toHaveLength(1)
      expect(w.findAll('path')).toHaveLength(1)
    })
    it.each([['dots', 3, 'animate-ds-dot'], ['bars', 4, 'animate-ds-bar'], ['pulse', 1, 'animate-ds-ping'], ['orbit', 2, 'animate-ds-spin-reverse']] as const)(
      '%s renders its animated parts and does not spin the whole svg',
      (variant, _n, anim) => {
        const w = mount(Spinner, { props: { variant } })
        expect(w.attributes('data-variant')).toBe(variant)
        expect(w.attributes('data-slot')).toBe('spinner')
        expect(w.classes()).not.toContain('animate-spin')
        expect(w.html()).toContain(anim)
      },
    )
    it('dots and bars stagger their delays', () => {
      expect(mount(Spinner, { props: { variant: 'dots' } }).findAll('circle').map((c) => c.classes().join(' ')).join('|')).toContain('[animation-delay:300ms]')
      const bars = mount(Spinner, { props: { variant: 'bars' } }).findAll('rect')
      expect(bars).toHaveLength(4)
      expect(bars[3].classes()).toContain('[animation-delay:360ms]')
    })
    it.each(SPINNER_VARIANTS)('%s keeps the progressbar semantics, label and sizes', (variant) => {
      const w = mount(Spinner, { props: { variant, size: 'xl', label: 'Syncing' } })
      expect(w.attributes('role')).toBe('progressbar')
      expect(w.attributes('aria-label')).toBe('Syncing')
      expect(w.classes()).toContain('size-8')
    })
    it.each(SPINNER_VARIANTS)('%s can be decorative', (variant) => {
      const w = mount(Spinner, { props: { variant, decorative: true } })
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
      expect(w.attributes('aria-hidden')).toBe('true')
    })
    it.each(SPINNER_VARIANTS)('%s has a reduced-motion fallback with no movement', (variant) => {
      const html = mount(Spinner, { props: { variant } }).html()
      expect(html).toMatch(/motion-reduce:animate-(pulse|none)/)
      expect(html).not.toContain('animate-bounce')
    })
    it('pulse shows a static ring under reduced motion', () => {
      expect(mount(Spinner, { props: { variant: 'pulse' } }).html()).toContain('motion-reduce:animate-none')
    })
    it('falls back to ring for an unknown variant', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Spinner, { props: { variant: 'wobble' } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('animate-spin')
    })
    it('consumer class still merges last on every variant', () => {
      for (const variant of SPINNER_VARIANTS) {
        const w = mount(Spinner, { props: { variant, class: 'text-red-500 size-10' } })
        expect(w.classes()).toContain('size-10')
        expect(w.classes()).not.toContain('size-5')
      }
    })
  })
})
