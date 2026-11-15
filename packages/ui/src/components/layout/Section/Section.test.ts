import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Section from './Section.vue'
import { sectionTones, sectionVariants } from './variants'

describe('Section', () => {
  describe('good path', () => {
    it('renders a <section> with md padding and no tone', () => {
      const w = mount(Section, { slots: { default: 'Body' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-slot')).toBe('section')
      expect(w.text()).toBe('Body')
      expect(w.classes()).toEqual(expect.arrayContaining(['py-10', 'md:py-14']))
      expect(w.classes().some((c) => c.startsWith('bg-'))).toBe(false)
    })

    it.each([
      ['none', 'py-0'],
      ['xs', 'py-3'],
      ['sm', 'py-6'],
      ['md', 'py-10'],
      ['lg', 'py-14'],
      ['xl', 'py-20'],
    ] as const)('padding %s', (padding, cls) => {
      expect(mount(Section, { props: { padding } }).classes()).toContain(cls)
    })

    it.each([
      ['muted', 'bg-muted'],
      ['card', 'bg-card'],
      ['primary', 'bg-primary'],
    ] as const)('tone %s', (tone, cls) => {
      expect(mount(Section, { props: { tone } }).classes()).toContain(cls)
    })

    it.each(['gradient', 'pattern'])('the removed %s tone falls back to none and adds no background classes', (tone) => {
      expect(sectionTones).not.toContain(tone)
      const c = mount(Section, { props: { tone: tone as never } }).classes()
      expect(c.some((x) => /gradient|^bg-|^from-|^via-|^to-/.test(x))).toBe(false)
    })

    it.each([
      ['top', ['border-t', 'border-border'], ['border-b', 'border-y']],
      ['bottom', ['border-b', 'border-border'], ['border-t', 'border-y']],
      ['both', ['border-y', 'border-border'], ['border-t', 'border-b']],
    ] as const)('divider %s', (divider, has, hasNot) => {
      const w = mount(Section, { props: { divider } })
      expect(w.classes()).toEqual(expect.arrayContaining([...has]))
      for (const c of hasNot) expect(w.classes()).not.toContain(c)
    })

    it('divider none wins over bordered and draws no border', () => {
      const w = mount(Section, { props: { divider: 'none', bordered: true } })
      expect(w.classes().some((c) => c.startsWith('border'))).toBe(false)
    })

    it('divider takes precedence over bordered', () => {
      const w = mount(Section, { props: { divider: 'top', bordered: true } })
      expect(w.classes()).toContain('border-t')
      expect(w.classes()).not.toContain('border-y')
    })

    it('no divider by default', () => {
      expect(mount(Section).classes().some((c) => c.startsWith('border'))).toBe(false)
    })

    it('bordered adds border-y', () => {
      expect(mount(Section, { props: { bordered: true } }).classes()).toContain('border-y')
      expect(mount(Section).classes()).not.toContain('border-y')
    })

    it('exports variants', () => {
      expect(sectionVariants({ tone: 'muted' })).toContain('bg-muted')
      expect(sectionVariants({ divider: 'top' })).toContain('border-t')
      expect(sectionVariants({ tone: 'primary' })).toContain('bg-primary')
    })
  })

  describe('customisation', () => {
    it('class wins', () => {
      const w = mount(Section, { props: { padding: 'none', class: 'py-3 custom' } })
      expect(w.classes()).toContain('py-3')
      expect(w.classes()).not.toContain('py-0')
      expect(w.classes()).toContain('custom')
    })

    it('as, asChild and attrs', () => {
      expect(mount(Section, { props: { as: 'div' } }).element.tagName).toBe('DIV')
      const c = mount(Section, { props: { asChild: true }, slots: { default: '<article>a</article>' } })
      expect(c.element.tagName).toBe('ARTICLE')
      expect(c.classes()).toContain('py-10')
      expect(mount(Section, { attrs: { id: 'x', 'aria-labelledby': 'h' } }).attributes('aria-labelledby')).toBe('h')
    })
  })

  describe('bad path', () => {
    it('unknown padding falls back to md', () => {
      expect(mount(Section, { props: { padding: 'huge' as never } }).classes()).toContain('py-10')
    })

    it('unknown divider is ignored and bordered still applies', () => {
      expect(mount(Section, { props: { divider: 'left' as never } }).classes().some((c) => c.startsWith('border'))).toBe(false)
      expect(mount(Section, { props: { divider: 'left' as never, bordered: true } }).classes()).toContain('border-y')
      expect(mount(Section, { props: { divider: 'toString' as never } }).classes().some((c) => c.startsWith('border'))).toBe(false)
    })

    it('inherited-key tone / padding fall back', () => {
      const w = mount(Section, { props: { tone: 'toString' as never, padding: 'constructor' as never } })
      expect(w.classes().some((c) => c.startsWith('bg-'))).toBe(false)
      expect(w.classes()).toContain('py-10')
    })

    it('unknown tone falls back to none', () => {
      const w = mount(Section, { props: { tone: 'neon' as never } })
      expect(w.classes().some((c) => c.startsWith('bg-'))).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('renders empty', () => {
      expect(mount(Section).text()).toBe('')
    })

    it('class can override a tone and a divider colour', () => {
      const w = mount(Section, { props: { tone: 'muted', divider: 'top', class: 'bg-card border-primary' } })
      expect(w.classes()).toContain('bg-card')
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).toContain('border-primary')
      expect(w.classes()).not.toContain('border-border')
    })

    it('all options together', () => {
      const w = mount(Section, { props: { padding: 'xl', tone: 'card', bordered: true } })
      expect(w.classes()).toEqual(expect.arrayContaining(['py-20', 'bg-card', 'border-y']))
    })
  })
})
