import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Eyebrow from './Eyebrow.vue'
import { eyebrowSizes, eyebrowTones, eyebrowVariantNames, eyebrowVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('Eyebrow variations', () => {
  describe('default output is unchanged', () => {
    it('keeps the original class set and adds no DOM or data attribute', () => {
      const w = mount(Eyebrow, { slots: { default: 'Label' } })
      expect(set(w.classes().join(' '))).toEqual(set('text-sm font-medium text-primary'))
      expect(set(eyebrowVariants())).toEqual(set('text-sm font-medium text-primary'))
      expect(w.element.children).toHaveLength(0)
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.html()).toMatch(/^<p data-slot="eyebrow" class="[^"]*">Label<\/p>$/)
    })
  })

  describe('size', () => {
    it.each([
      ['xs', 'text-xs'],
      ['sm', 'text-sm'],
      ['md', 'text-base'],
    ] as const)('%s uses %s and only that size class', (size, cls) => {
      const c = mount(Eyebrow, { props: { size } }).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => /^text-(xs|sm|base)$/.test(x))).toEqual([cls])
    })

    it('unknown size falls back to sm', () => {
      expect(mount(Eyebrow, { props: { size: 'huge' as never } }).classes()).toContain('text-sm')
    })

    it('the class prop wins over the size', () => {
      const c = mount(Eyebrow, { props: { size: 'md', class: 'text-2xl' } }).classes()
      expect(c).toContain('text-2xl')
      expect(c).not.toContain('text-base')
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', 'text-primary'],
      ['muted', 'text-muted-foreground'],
      ['foreground', 'text-foreground'],
    ] as const)('%s uses %s', (tone, cls) => {
      const c = mount(Eyebrow, { props: { tone } }).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => /^text-(primary|muted-foreground|foreground)$/.test(x))).toEqual([cls])
    })

    it('unknown tone falls back to primary', () => {
      expect(mount(Eyebrow, { props: { tone: 'danger' as never } }).classes()).toContain('text-primary')
    })
  })

  describe('variant', () => {
    it('rule renders a flex row with a decorative hairline after the label', () => {
      const w = mount(Eyebrow, { props: { variant: 'rule' }, slots: { default: 'Section' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'items-center', 'gap-3']))
      expect(w.attributes('data-variant')).toBe('rule')
      const kids = [...w.element.children]
      expect(kids.map((k) => k.getAttribute('data-slot'))).toEqual(['eyebrow-label', 'eyebrow-rule'])
      const rule = w.find('[data-slot="eyebrow-rule"]')
      expect(rule.attributes('aria-hidden')).toBe('true')
      expect(rule.classes()).toEqual(expect.arrayContaining(['h-px', 'flex-1', 'bg-border', 'min-w-4', 'forced-colors:bg-current']))
      expect(w.text()).toBe('Section')
    })

    it('dot renders a decorative dot before the label in the text colour', () => {
      const w = mount(Eyebrow, { props: { variant: 'dot', tone: 'muted' }, slots: { default: 'Status' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['inline-flex', 'items-center', 'gap-2', 'text-muted-foreground']))
      expect([...w.element.children].map((k) => k.getAttribute('data-slot'))).toEqual(['eyebrow-dot', 'eyebrow-label'])
      const dot = w.find('[data-slot="eyebrow-dot"]')
      expect(dot.attributes('aria-hidden')).toBe('true')
      expect(dot.classes()).toEqual(expect.arrayContaining(['size-1.5', 'rounded-full', 'bg-current']))
    })

    it('the label text is the only readable content (decorations are empty and aria-hidden)', () => {
      for (const variant of ['rule', 'dot'] as const) {
        const w = mount(Eyebrow, { props: { variant }, slots: { default: 'Area' } })
        expect(w.text()).toBe('Area')
        for (const deco of w.findAll('[data-slot="eyebrow-rule"], [data-slot="eyebrow-dot"]')) {
          expect(deco.text()).toBe('')
          expect(deco.attributes('aria-hidden')).toBe('true')
        }
      }
    })

    it('unknown variant falls back to plain', () => {
      const w = mount(Eyebrow, { props: { variant: 'underline' as never }, slots: { default: 'x' } })
      expect(w.element.children).toHaveLength(0)
      expect(w.attributes('data-variant')).toBeUndefined()
    })

    it('asChild never renders decorations and keeps plain classes', () => {
      const w = mount(Eyebrow, { props: { asChild: true, variant: 'rule' }, slots: { default: '<h6>Child</h6>' } })
      expect(w.element.tagName).toBe('H6')
      expect(w.find('[data-slot="eyebrow-rule"]').exists()).toBe(false)
      expect(w.classes()).not.toContain('flex')
      expect(w.attributes('data-variant')).toBeUndefined()
    })

    it('as="span" works with every variant', () => {
      for (const variant of eyebrowVariantNames) expect(mount(Eyebrow, { props: { as: 'span', variant } }).element.tagName).toBe('SPAN')
    })

    it('never uses uppercase or tracking in any combination (LLMSlop T4, T5)', () => {
      for (const variant of eyebrowVariantNames)
        for (const size of eyebrowSizes)
          for (const tone of eyebrowTones) {
            const c = mount(Eyebrow, { props: { variant, size, tone } }).classes()
            expect(c).not.toContain('uppercase')
            expect(c.some((x) => x.startsWith('tracking-'))).toBe(false)
          }
    })
  })

  describe('combinations and edge cases', () => {
    it('every variant x size x tone mounts, with exactly one size class and one colour class', () => {
      for (const variant of eyebrowVariantNames)
        for (const size of eyebrowSizes)
          for (const tone of eyebrowTones) {
            const c = mount(Eyebrow, { props: { variant, size, tone } }).classes()
            expect(c.filter((x) => /^text-(xs|sm|base)$/.test(x))).toHaveLength(1)
            expect(c.filter((x) => /^text-(primary|muted-foreground|foreground)$/.test(x))).toHaveLength(1)
          }
    })

    it('class prop wins on a decorated variant', () => {
      const w = mount(Eyebrow, { props: { variant: 'rule', class: 'gap-6 text-success' } })
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-3')
      expect(w.classes()).toContain('text-success')
      expect(w.classes()).not.toContain('text-primary')
    })

    it('empty slot and long text render without error in decorated variants', () => {
      expect(mount(Eyebrow, { props: { variant: 'rule' } }).text()).toBe('')
      const long = 'ÄÖÜ '.repeat(500)
      const w = mount(Eyebrow, { props: { variant: 'dot' }, slots: { default: long } })
      expect(w.text()).toBe(long.trim())
      expect(w.find('[data-slot="eyebrow-label"]').classes()).toContain('min-w-0')
    })

    it('reacts to variant changes', async () => {
      const w = mount(Eyebrow, { props: { variant: 'plain' }, slots: { default: 'x' } })
      await w.setProps({ variant: 'rule' })
      expect(w.find('[data-slot="eyebrow-rule"]').exists()).toBe(true)
      await w.setProps({ variant: 'plain' })
      expect(w.find('[data-slot="eyebrow-rule"]').exists()).toBe(false)
    })

    it('eyebrowVariants is reusable for plain elements', () => {
      expect(eyebrowVariants({ tone: 'foreground', size: 'xs', variant: 'rule' })).toEqual(expect.stringContaining('text-foreground'))
      expect(eyebrowVariants({ tone: 'foreground', size: 'xs', variant: 'rule' })).toEqual(expect.stringContaining('flex'))
    })
  })
})
