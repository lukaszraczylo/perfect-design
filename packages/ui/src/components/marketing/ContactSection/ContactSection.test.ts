import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ContactSection from './ContactSection.vue'
import { contactSectionVariants } from './variants'

const heading = { eyebrow: 'Contact', title: 'Get in touch', description: 'We reply within a day.' }
const slots = { form: '<form id="f"><input /></form>', details: '<p id="d">hello@example.com</p>' }

describe('ContactSection', () => {
  describe('good path', () => {
    it('renders heading, form and details', () => {
      const w = mount(ContactSection, { props: heading, slots })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-slot')).toBe('contact-section')
      expect(w.find('[data-slot="section-heading-eyebrow"]').text()).toBe('Contact')
      expect(w.find('h2').text()).toBe('Get in touch')
      expect(w.find('[data-slot="section-heading-description"]').text()).toBe('We reply within a day.')
      expect(w.find('[data-slot="contact-section-form"] #f').exists()).toBe(true)
      expect(w.find('[data-slot="contact-section-details"] #d').exists()).toBe(true)
      expect(w.attributes('aria-label')).toBeUndefined() // was the title: a labelled section becomes a region landmark, which is noise and fails landmark-unique when repeated
    })
    it('split (default): two columns, heading and details in the intro column', () => {
      const w = mount(ContactSection, { props: heading, slots })
      expect(w.attributes('data-variant')).toBe('split')
      expect(w.classes()).toContain('lg:grid-cols-2')
      const intro = w.find('[data-slot="contact-section-intro"]')
      expect(intro.find('[data-slot="section-heading"]').exists()).toBe(true)
      expect(intro.find('[data-slot="contact-section-details"]').exists()).toBe(true)
      expect(intro.find('[data-slot="contact-section-form"]').exists()).toBe(false)
    })
    it('centered: heading centred, form then details below', () => {
      const w = mount(ContactSection, { props: { ...heading, variant: 'centered' }, slots })
      expect(w.attributes('data-variant')).toBe('centered')
      expect(w.classes()).toContain('items-center')
      expect(w.classes()).not.toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="section-heading"]').classes()).toContain('text-center')
      const kids = Array.from(w.element.children as HTMLCollection).map((c) => c.getAttribute('data-slot'))
      expect(kids).toEqual(['contact-section-intro', 'contact-section-form', 'contact-section-details'])
      expect(w.find('[data-slot="contact-section-form"]').classes()).toContain('max-w-xl')
    })
    it('card: bordered surface with two columns', () => {
      const w = mount(ContactSection, { props: { ...heading, variant: 'card' }, slots })
      expect(w.classes()).toEqual(expect.arrayContaining(['border', 'bg-card', 'lg:grid-cols-2']))
      expect(contactSectionVariants({ variant: 'card' })).toContain('bg-card')
    })
    it('level changes the heading element', () => {
      expect(mount(ContactSection, { props: { ...heading, level: 3 } }).find('h3').exists()).toBe(true)
    })
    it('works with no slots', () => {
      const w = mount(ContactSection, { props: heading })
      expect(w.find('[data-slot="contact-section-form"]').exists()).toBe(false)
      expect(w.find('[data-slot="contact-section-details"]').exists()).toBe(false)
      expect(w.find('h2').exists()).toBe(true)
    })
    it('works with only a form', () => {
      const w = mount(ContactSection, { slots: { form: '<div id="f" />' } })
      expect(w.find('[data-slot="contact-section-intro"]').exists()).toBe(false)
      expect(w.find('[data-slot="contact-section-form"]').classes()).toContain('lg:col-span-2')
      expect(w.attributes('aria-label')).toBeUndefined()
    })
    it('works with only details (split) and only details (centered)', () => {
      const split = mount(ContactSection, { slots: { details: '<p id="d" />' } })
      expect(split.find('[data-slot="contact-section-intro"] #d').exists()).toBe(true)
      const centered = mount(ContactSection, { props: { variant: 'centered' }, slots: { details: '<p id="d" />' } })
      expect(centered.find('[data-slot="contact-section-intro"]').exists()).toBe(false)
      expect(centered.find('[data-slot="contact-section-details"] #d').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs (aria-label wins)', () => {
      const w = mount(ContactSection, { props: { ...heading, class: 'gap-4 custom' }, attrs: { id: 'c', 'data-x': '1', 'aria-label': 'Custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-10')
      expect(w.attributes('id')).toBe('c')
      expect(w.attributes('data-x')).toBe('1')
      expect(w.attributes('aria-label')).toBe('Custom')
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to split', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(ContactSection, { props: { ...heading, variant: 'fancy' }, slots })
      expect(w.attributes('data-variant')).toBe('split')
      expect(w.classes()).toContain('lg:grid-cols-2')
    })
    it('invalid heading level falls back to h2', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(ContactSection, { props: { ...heading, level: 12 } }).find('h2').exists()).toBe(true)
    })
    it('renders an empty section with no props and no slots', () => {
      const w = mount(ContactSection)
      expect(w.element.children).toHaveLength(0)
      expect(w.attributes('aria-label')).toBeUndefined()
    })
    it('empty strings render no heading', () => {
      const w = mount(ContactSection, { props: { eyebrow: '', title: '', description: '' } })
      expect(w.find('[data-slot="section-heading"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles very long and unicode text', () => {
      const long = 'x'.repeat(5000)
      const w = mount(ContactSection, { props: { title: long, description: '联系我们 مرحبا 😀' } })
      expect(w.find('h2').text()).toHaveLength(5000)
      expect(w.find('[data-slot="section-heading-description"]').text()).toBe('联系我们 مرحبا 😀')
    })
    it('escapes HTML in text props', () => {
      const w = mount(ContactSection, { props: { title: '<b>x</b>' } })
      expect(w.find('h2 b').exists()).toBe(false)
    })
    it('slots appearing later and variant toggles update the layout', async () => {
      const w = mount(ContactSection, { props: heading, slots })
      for (const v of ['centered', 'card', 'split', 'centered'] as const) {
        await w.setProps({ variant: v })
        expect(w.attributes('data-variant')).toBe(v)
        expect(w.findAll('[data-slot="contact-section-details"]')).toHaveLength(1)
      }
      expect(() => w.unmount()).not.toThrow()
    })
    it('mounts the real form content untouched', async () => {
      const w = mount(ContactSection, { slots: { form: '<input id="name" value="a" />' } })
      expect((w.find('#name').element as HTMLInputElement).value).toBe('a')
    })
  })

  describe('accessibility and slop regressions', () => {
    it('is an unnamed section by default (not a region landmark) but a consumer aria-label / aria-labelledby still applies', () => {
      expect(mount(ContactSection, { props: heading, slots }).attributes('aria-label')).toBeUndefined()
      expect(mount(ContactSection, { props: heading, attrs: { 'aria-labelledby': 'h' } }).attributes('aria-labelledby')).toBe('h')
    })
    it('the card variant is a flat rounded-lg panel: no shadow, no rounded-xl', () => {
      const w = mount(ContactSection, { props: { ...heading, variant: 'card' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card']))
      expect(w.classes().join(' ')).not.toMatch(/shadow|rounded-xl/)
    })
    it('the heading level is configurable and every layout stays within a single column on phones', () => {
      expect(mount(ContactSection, { props: { ...heading, level: 3 } }).find('h3').exists()).toBe(true)
      for (const variant of ['split', 'centered', 'card'] as const) expect(mount(ContactSection, { props: { ...heading, variant }, slots }).classes().join(' ')).not.toMatch(/(^| )grid-cols-[2-9]/)
    })
  })
})
