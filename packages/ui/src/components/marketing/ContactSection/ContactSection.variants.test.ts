import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import ContactSection from './ContactSection.vue'
import {
  CONTACT_ALIGNS,
  CONTACT_SIZES,
  CONTACT_TONES,
  CONTACT_VARIANTS,
  contactSectionContentVariants,
  contactSectionDetailsVariants,
  contactSectionFormVariants,
  contactSectionIntroVariants,
  contactSectionVariants,
} from './variants'

const heading = { eyebrow: 'Contact', title: 'Ask about the library', description: 'We reply within a day.' }
const slots = { form: '<form id="f" action="/x"><input aria-label="Email" /></form>', details: '<p id="d">name@example.com</p>' }
const section = (props: Record<string, unknown> = {}, s: Record<string, unknown> = slots) => mount(ContactSection, { props: { ...heading, ...props }, slots: s as never })
const tokens = (x: string) => x.split(' ').sort()
const order = (w: ReturnType<typeof section>) => Array.from((w.element as Element).querySelectorAll('[data-slot]')).map((n) => n.getAttribute('data-slot'))

describe('ContactSection variations', () => {
  describe('defaults keep the original output', () => {
    it('every original layout keeps its original class set', () => {
      expect(section().classes().sort()).toEqual(tokens('w-full grid items-start gap-10 lg:grid-cols-2 lg:gap-16'))
      expect(tokens(contactSectionVariants({ variant: 'centered' }))).toEqual(tokens('w-full flex flex-col items-center gap-10'))
      expect(tokens(contactSectionVariants({ variant: 'card' }))).toEqual(tokens('w-full grid items-start gap-10 rounded-lg border bg-card p-6 text-card-foreground sm:p-10 lg:grid-cols-2 lg:gap-16'))
      expect(tokens(contactSectionIntroVariants({ variant: 'centered' }))).toEqual(tokens('flex min-w-0 flex-col gap-8 items-center text-center'))
      expect(tokens(contactSectionIntroVariants())).toEqual(tokens('flex min-w-0 flex-col gap-8'))
      expect(tokens(contactSectionDetailsVariants({ variant: 'centered' }))).toEqual(tokens('flex min-w-0 flex-col gap-3 text-sm items-center text-center'))
      expect(tokens(contactSectionFormVariants({ variant: 'centered' }))).toEqual(tokens('min-w-0 w-full max-w-xl'))
    })
    it('the heading keeps the lg size and left alignment', () => {
      const w = section()
      expect(w.find('[data-slot="section-heading"]').attributes('data-size')).toBe('lg')
      expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('left')
    })
    it('reports the default dimensions as data attributes', () => {
      const w = section()
      expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-align')]).toEqual(['md', 'default', 'start'])
    })
  })

  describe('inline layout', () => {
    it('is a compact row from lg: heading left, one content block with the form and the details right', () => {
      const w = section({ variant: 'inline' })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'lg:flex-row', 'lg:justify-between', 'gap-6', 'lg:gap-10']))
      expect(w.classes()).not.toContain('lg:grid-cols-2')
      const kids = Array.from((w.element as Element).children).map((c) => c.getAttribute('data-slot'))
      expect(kids).toEqual(['contact-section-intro', 'contact-section-content'])
      const content = w.find('[data-slot="contact-section-content"]')
      expect(content.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'lg:max-w-lg', 'lg:flex-1']))
      expect(Array.from(content.element.children).map((c) => c.getAttribute('data-slot'))).toEqual(['contact-section-form', 'contact-section-details'])
      expect(w.find('[data-slot="contact-section-intro"]').classes()).toEqual(expect.arrayContaining(['lg:flex-1', 'lg:max-w-xl']))
    })
    it('details stay out of the intro column and the heading uses a smaller step', () => {
      const w = section({ variant: 'inline' })
      expect(w.find('[data-slot="contact-section-intro"] [data-slot="contact-section-details"]').exists()).toBe(false)
      expect(w.find('[data-slot="section-heading"]').attributes('data-size')).toBe('sm')
      expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('left')
    })
    it('keeps the reading order heading, form, details', () => {
      const names = order(section({ variant: 'inline' }))
      expect(names.indexOf('contact-section-intro')).toBeLessThan(names.indexOf('contact-section-form'))
      expect(names.indexOf('contact-section-form')).toBeLessThan(names.indexOf('contact-section-details'))
    })
    it('works with only a form, only details, only a heading and nothing at all', () => {
      const formOnly = mount(ContactSection, { props: { variant: 'inline' }, slots: { form: '<div id="f" />' } })
      expect(formOnly.find('[data-slot="contact-section-intro"]').exists()).toBe(false)
      expect(formOnly.find('[data-slot="contact-section-content"] #f').exists()).toBe(true)
      expect(formOnly.find('[data-slot="contact-section-form"]').classes()).not.toContain('lg:col-span-2')
      const detailsOnly = mount(ContactSection, { props: { variant: 'inline' }, slots: { details: '<p id="d" />' } })
      expect(detailsOnly.find('[data-slot="contact-section-intro"]').exists()).toBe(false)
      expect(detailsOnly.find('[data-slot="contact-section-content"] #d').exists()).toBe(true)
      expect(detailsOnly.find('[data-slot="contact-section-form"]').exists()).toBe(false)
      const headingOnly = mount(ContactSection, { props: { variant: 'inline', ...heading } })
      expect(headingOnly.find('[data-slot="contact-section-content"]').exists()).toBe(false)
      expect(mount(ContactSection, { props: { variant: 'inline' } }).element.children).toHaveLength(0)
    })
    it('align is ignored: the layout stays start-aligned', () => {
      const w = section({ variant: 'inline', align: 'center' })
      expect(w.attributes('data-align')).toBe('start')
      expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('left')
      expect(w.find('[data-slot="contact-section-intro"]').classes()).not.toContain('text-center')
    })
    it('slots added after mount switch between the inline branches without duplicating the form', async () => {
      const w = section({ variant: 'inline' })
      for (const v of ['split', 'inline', 'centered', 'inline', 'card'] as const) {
        await w.setProps({ variant: v })
        expect(w.findAll('[data-slot="contact-section-form"]')).toHaveLength(1)
        expect(w.findAll('[data-slot="contact-section-details"]')).toHaveLength(1)
      }
    })
  })

  describe('size', () => {
    it.each([
      ['split', 'sm', ['gap-6', 'lg:gap-10']],
      ['split', 'md', ['gap-10', 'lg:gap-16']],
      ['split', 'lg', ['gap-12', 'lg:gap-24']],
      ['centered', 'sm', ['gap-6']],
      ['centered', 'lg', ['gap-14']],
      ['card', 'sm', ['gap-6', 'p-4', 'sm:p-6', 'lg:gap-10']],
      ['card', 'lg', ['gap-12', 'p-8', 'sm:p-14', 'lg:gap-24']],
      ['inline', 'sm', ['gap-4', 'lg:gap-8']],
      ['inline', 'lg', ['gap-8', 'lg:gap-14']],
    ] as const)('%s at %s', (variant, size, cls) => {
      const w = section({ variant, size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(w.classes().filter((c) => /^gap-\d/.test(c))).toHaveLength(1)
    })
    it('the intro gap, the details text and the heading scale follow the size', () => {
      expect(section({ size: 'sm' }).find('[data-slot="contact-section-intro"]').classes()).toContain('gap-6')
      expect(section({ size: 'lg' }).find('[data-slot="contact-section-intro"]').classes()).toContain('gap-10')
      expect(section({ size: 'lg' }).find('[data-slot="contact-section-details"]').classes()).toContain('text-base')
      expect(section({ size: 'sm' }).find('[data-slot="contact-section-details"]').classes()).toContain('text-sm')
      expect(section({ size: 'sm' }).find('[data-slot="section-heading"]').attributes('data-size')).toBe('md')
      expect(section({ size: 'lg' }).find('[data-slot="section-heading"]').attributes('data-size')).toBe('lg')
      expect(section({ variant: 'inline', size: 'lg' }).find('[data-slot="section-heading"]').attributes('data-size')).toBe('md')
      expect(contactSectionContentVariants({ size: 'lg' })).toContain('gap-8')
    })
    it('unknown values fall back to md', () => {
      for (const size of ['xl', '', 'SM', 1, null]) {
        const w = section({ size })
        expect(w.attributes('data-size')).toBe('md')
        expect(w.classes()).toContain('gap-10')
      }
    })
  })

  describe('tone', () => {
    it('default leaves split, centered and inline without a surface and card on bg-card', () => {
      for (const variant of ['split', 'centered', 'inline'] as const) expect(section({ variant, tone: 'default' }).classes().some((c) => /^bg-/.test(c))).toBe(false)
      expect(section({ variant: 'card', tone: 'default' }).classes()).toEqual(expect.arrayContaining(['bg-card', 'text-card-foreground']))
    })
    it('muted adds a bordered secondary surface to every layout', () => {
      for (const variant of CONTACT_VARIANTS) {
        const w = section({ variant, tone: 'muted' })
        expect(w.attributes('data-tone')).toBe('muted')
        expect(w.classes(), variant).toEqual(expect.arrayContaining(['border', 'rounded-lg', 'bg-secondary', 'text-secondary-foreground']))
        expect(w.classes(), variant).not.toContain('bg-card')
        expect(w.classes().filter((c) => /^bg-/.test(c))).toHaveLength(1)
      }
    })
    it('muted pads the frameless layouts with the size scale and never doubles the card padding', () => {
      expect(section({ tone: 'muted', size: 'sm' }).classes()).toEqual(expect.arrayContaining(['p-4', 'sm:p-6']))
      expect(section({ tone: 'muted', size: 'lg' }).classes()).toEqual(expect.arrayContaining(['p-8', 'sm:p-14']))
      expect(section({ variant: 'card', tone: 'muted' }).classes().filter((c) => /^p-\d/.test(c))).toEqual(['p-6'])
      expect(section({ variant: 'inline', tone: 'muted' }).classes().filter((c) => /^p-\d/.test(c))).toEqual(['p-6'])
    })
    it('unknown values fall back to default', () => {
      const w = section({ tone: 'dark' })
      expect(w.attributes('data-tone')).toBe('default')
      expect(w.classes().some((c) => /^bg-/.test(c))).toBe(false)
      expect(CONTACT_TONES).toEqual(['default', 'muted'])
    })
  })

  describe('align', () => {
    it('center centres the heading and the details of split and card', () => {
      for (const variant of ['split', 'card'] as const) {
        const w = section({ variant, align: 'center' })
        expect(w.attributes('data-align')).toBe('center')
        expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('center')
        expect(w.find('[data-slot="contact-section-intro"]').classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
        expect(w.find('[data-slot="contact-section-details"]').classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
      }
    })
    it('start keeps the left-aligned original', () => {
      const w = section({ align: 'start' })
      expect(w.find('[data-slot="contact-section-intro"]').classes()).not.toContain('text-center')
      expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('left')
    })
    it('centered is always centred whatever the value', () => {
      for (const align of CONTACT_ALIGNS) {
        const w = section({ variant: 'centered', align })
        expect(w.attributes('data-align')).toBe('center')
        expect(w.find('[data-slot="section-heading"]').attributes('data-align')).toBe('center')
      }
    })
    it('unknown values fall back to start', () => {
      for (const align of ['end', 'middle', '', 3]) expect(section({ align }).attributes('data-align')).toBe('start')
    })
    it('the form stays in the grid column and centred text does not move it', () => {
      const w = section({ align: 'center' })
      expect(w.find('[data-slot="contact-section-form"]').classes()).not.toContain('text-center')
    })
  })

  describe('combinations, overrides and a11y', () => {
    it('variant x size x tone x align keeps one form, one details block and one heading', () => {
      for (const variant of CONTACT_VARIANTS)
        for (const size of CONTACT_SIZES)
          for (const tone of CONTACT_TONES)
            for (const align of CONTACT_ALIGNS) {
              const w = section({ variant, size, tone, align })
              expect(w.findAll('form'), `${variant}/${size}/${tone}/${align}`).toHaveLength(1)
              expect(w.findAll('[data-slot="contact-section-details"]')).toHaveLength(1)
              expect(w.findAll('h2')).toHaveLength(1)
              expect(w.classes().filter((c) => /^bg-/.test(c)).length).toBeLessThanOrEqual(1)
              expect(w.classes().filter((c) => /^rounded-/.test(c)).length).toBeLessThanOrEqual(1)
            }
    })
    it('the class prop wins over variant classes', () => {
      const w = section({ variant: 'card', tone: 'muted', size: 'lg', class: 'p-2 bg-card custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['p-2', 'bg-card', 'custom']))
      expect(w.classes()).not.toContain('bg-secondary')
      expect(w.classes()).not.toContain('p-8')
    })
    it('stays an unnamed section with the heading level setting in every layout', () => {
      for (const variant of CONTACT_VARIANTS) {
        const w = section({ variant, level: 3 })
        expect(w.element.tagName).toBe('SECTION')
        expect(w.attributes('aria-label')).toBeUndefined()
        expect(w.find('h3').exists()).toBe(true)
      }
    })
    it('uses only logical offsets and no shadow, gradient or hover effect in any layout', () => {
      for (const variant of CONTACT_VARIANTS) {
        const html = section({ variant, tone: 'muted' }).html()
        expect(html).not.toMatch(/shadow|gradient|hover:|\b(ml|mr|pl|pr|left|right)-\d/)
      }
    })
    it('long text still renders in the inline layout', () => {
      const long = 'x'.repeat(2000)
      const w = mount(ContactSection, { props: { variant: 'inline', title: long }, slots: { form: () => h('form', { action: '/x' }) } })
      expect(w.find('h2').text()).toHaveLength(2000)
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a form without a submit handler still throws in the inline layout and with a muted tone', async () => {
      await t.mount(() => el(ContactSection, { variant: 'inline', tone: 'muted', size: 'sm' }, { form: () => h('form') }))
      expect(t.errors).toHaveLength(1)
      expect(t.errors[0].message).toContain('ContactSection: requires a submit handler')
      t.reset()
      await t.mount(() => el(ContactSection, { variant: 'inline' }, { form: () => h('form', { onSubmit: () => {} }) }))
      expect(t.errors).toEqual([])
    })
  })
})
