import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Lead from './Lead.vue'
import { leadAligns, leadSizes, leadTones, leadVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

describe('Lead variations', () => {
  it('default output is unchanged', () => {
    const w = mount(Lead, { slots: { default: 'Intro' } })
    expect(set(w.classes().join(' '))).toEqual(set('text-pretty text-muted-foreground text-lg'))
    expect(set(leadVariants())).toEqual(set('text-pretty text-muted-foreground text-lg'))
    expect(w.element.tagName).toBe('P')
  })

  describe('size', () => {
    it.each([
      ['md', 'text-md'],
      ['lg', 'text-lg'],
      ['xl', 'text-xl'],
    ] as const)('%s uses only %s', (size, cls) => {
      const c = mount(Lead, { props: { size } }).classes()
      expect(c.filter((x) => /^text-(md|lg|xl)$/.test(x))).toEqual([cls])
    })
    it('unknown size falls back to lg', () => {
      expect(mount(Lead, { props: { size: 'xxl' as never } }).classes()).toContain('text-lg')
    })
  })

  describe('tone', () => {
    it('foreground replaces the muted colour', () => {
      const c = mount(Lead, { props: { tone: 'foreground' } }).classes()
      expect(c).toContain('text-foreground')
      expect(c).not.toContain('text-muted-foreground')
    })
    it('muted is the default colour', () => {
      expect(mount(Lead, { props: { tone: 'muted' } }).classes()).toContain('text-muted-foreground')
    })
    it('unknown tone falls back to muted', () => {
      const c = mount(Lead, { props: { tone: 'primary' as never } }).classes()
      expect(c).toContain('text-muted-foreground')
      expect(c).not.toContain('text-primary')
    })
  })

  describe('align', () => {
    it('center adds text-center, start adds nothing', () => {
      expect(mount(Lead, { props: { align: 'center' } }).classes()).toContain('text-center')
      expect(mount(Lead, { props: { align: 'start' } }).classes()).not.toContain('text-center')
    })
    it('unknown align falls back to start', () => {
      expect(mount(Lead, { props: { align: 'end' as never } }).classes()).not.toContain('text-center')
    })
  })

  describe('combinations', () => {
    it('every size x tone x align mounts with one size and one colour class', () => {
      for (const size of leadSizes)
        for (const tone of leadTones)
          for (const align of leadAligns) {
            const c = mount(Lead, { props: { size, tone, align } }).classes()
            expect(c.filter((x) => /^text-(md|lg|xl)$/.test(x))).toHaveLength(1)
            expect(c.filter((x) => /^text-(muted-foreground|foreground)$/.test(x))).toHaveLength(1)
            expect(c).toContain('text-pretty')
          }
    })
    it('class prop wins over tone, size and align', () => {
      const c = mount(Lead, { props: { size: 'md', tone: 'foreground', align: 'center', class: 'text-2xl text-primary text-start' } }).classes()
      expect(c).toContain('text-2xl')
      expect(c).not.toContain('text-md')
      expect(c).toContain('text-primary')
      expect(c).not.toContain('text-foreground')
      expect(c).toContain('text-start')
      expect(c).not.toContain('text-center')
    })
    it('asChild applies the variants to the child', () => {
      const w = mount(Lead, { props: { asChild: true, tone: 'foreground', align: 'center' }, slots: { default: '<div>x</div>' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.classes()).toEqual(expect.arrayContaining(['text-foreground', 'text-center']))
    })
    it('reacts to prop changes, handles empty and long content', async () => {
      const w = mount(Lead, { slots: { default: 'x'.repeat(3000) } })
      expect(w.text()).toHaveLength(3000)
      await w.setProps({ size: 'xl', tone: 'foreground' })
      expect(w.classes()).toEqual(expect.arrayContaining(['text-xl', 'text-foreground']))
      expect(mount(Lead, { props: { align: 'center' } }).text()).toBe('')
    })
    it('leadVariants is reusable', () => {
      expect(set(leadVariants({ size: 'md', tone: 'foreground', align: 'center' }))).toEqual(set('text-pretty text-md text-foreground text-center'))
    })
  })
})
