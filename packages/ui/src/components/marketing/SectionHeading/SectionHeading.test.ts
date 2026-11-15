import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionHeading from './SectionHeading.vue'
import {
  sectionHeadingActionsVariants,
  sectionHeadingDescriptionVariants,
  sectionHeadingEyebrowVariants,
  sectionHeadingTitleClass,
  sectionHeadingTitleVariants,
  sectionHeadingVariants,
} from './variants'

describe('SectionHeading', () => {
  describe('good path', () => {
    it('renders eyebrow, title, description with data-slots', () => {
      const w = mount(SectionHeading, { props: { eyebrow: 'Features', title: 'Everything', description: 'All of it' } })
      expect(w.attributes('data-slot')).toBe('section-heading')
      expect(w.find('[data-slot="section-heading-eyebrow"]').text()).toBe('Features')
      expect(w.find('[data-slot="section-heading-title"]').element.tagName).toBe('H2')
      expect(w.find('[data-slot="section-heading-description"]').text()).toBe('All of it')
    })
    it.each([
      ['left', 'items-start'],
      ['center', 'text-center'],
      ['right', 'text-end'],
    ] as const)('aligns %s', (align, cls) => {
      expect(mount(SectionHeading, { props: { align, title: 'x' } }).classes()).toContain(cls)
      expect(sectionHeadingVariants({ align })).toContain(cls)
    })
    it('level changes the heading tag', () => {
      expect(mount(SectionHeading, { props: { title: 'x', level: 1 } }).find('h1').exists()).toBe(true)
      expect(mount(SectionHeading, { props: { title: 'x', level: 4 } }).find('h4').exists()).toBe(true)
    })
    it('renders slots and actions', () => {
      const w = mount(SectionHeading, {
        slots: { eyebrow: '<b>E</b>', title: '<i>T</i>', description: '<u>D</u>', default: '<button>Go</button>' },
      })
      expect(w.find('b').exists() && w.find('i').exists() && w.find('u').exists()).toBe(true)
      expect(w.find('[data-slot="section-heading-actions"] button').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(SectionHeading, { props: { title: 'x', class: 'max-w-none custom' }, attrs: { id: 'h' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('max-w-none')
      expect(w.classes()).not.toContain('max-w-2xl')
      expect(w.attributes('id')).toBe('h')
    })
    it('renders as another element', () => {
      expect(mount(SectionHeading, { props: { as: 'header', title: 'x' } }).element.tagName).toBe('HEADER')
    })
  })

  describe('bad path', () => {
    it('renders only the root when nothing is provided', () => {
      const w = mount(SectionHeading)
      expect(w.element.children).toHaveLength(0)
    })
    it('invalid level falls back to h2', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SectionHeading, { props: { title: 'x', level: 9 } })
      expect(w.find('h2').exists()).toBe(true)
    })
    it('omits the actions wrapper without default slot', () => {
      expect(mount(SectionHeading, { props: { title: 'x' } }).find('[data-slot="section-heading-actions"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles very long and unicode text', () => {
      const long = 'x'.repeat(5000)
      const w = mount(SectionHeading, { props: { title: long, description: 'مرحبا 🌍 こんにちは' } })
      expect(w.find('h2').text()).toHaveLength(5000)
      expect(w.text()).toContain('🌍')
    })
  })
})

describe('SectionHeading variations', () => {
  describe('alignment', () => {
    it.each([
      ['left', 'justify-start', 'items-start'],
      ['center', 'justify-center', 'items-center'],
      ['right', 'justify-end', 'items-end'],
    ] as const)('%s aligns text, block and actions', (align, justify, items) => {
      const w = mount(SectionHeading, { props: { align, title: 'x' }, slots: { default: '<button>a</button>' } })
      expect(w.attributes('data-align')).toBe(align)
      expect(w.classes()).toContain(items)
      expect(w.find('[data-slot="section-heading-actions"]').classes()).toContain(justify)
      expect(sectionHeadingActionsVariants({ align })).toContain(justify)
    })
    it('unknown align falls back to left', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SectionHeading, { props: { align: 'diagonal', title: 'x' } })
      expect(w.attributes('data-align')).toBe('left')
      expect(w.classes()).toContain('text-start')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'max-w-xl', 'text-2xl', 'text-sm'],
      ['md', 'max-w-2xl', 'text-3xl', 'text-base'],
      ['lg', 'max-w-3xl', 'text-4xl', 'text-lg'],
      ['full', 'max-w-none', 'text-3xl', 'text-base'],
    ] as const)('%s sets width, title and description scale', (size, width, title, desc) => {
      const w = mount(SectionHeading, { props: { size, title: 'x', description: 'd' } })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(width)
      expect(w.find('h2').classes()).toContain(title)
      expect(w.find('[data-slot="section-heading-description"]').classes()).toContain(desc)
      expect(sectionHeadingTitleVariants({ size })).toContain(title)
      expect(sectionHeadingDescriptionVariants({ size })).toContain(desc)
    })
    it('unknown size falls back to md and md keeps the legacy title scale', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SectionHeading, { props: { size: 'xxl', title: 'x' } })
      expect(w.classes()).toContain('max-w-2xl')
      expect(sectionHeadingTitleClass).toContain('text-3xl')
    })
  })

  describe('eyebrow style', () => {
    it('text is the default plain label', () => {
      const w = mount(SectionHeading, { props: { eyebrow: 'Features' } })
      const e = w.find('[data-slot="section-heading-eyebrow"]')
      expect(e.attributes('data-style')).toBe('text')
      expect(e.classes()).toContain('text-sm')
      expect(e.classes()).not.toContain('rounded-full')
    })
    it('pill adds a bordered rounded-md badge (rounded-full is for avatars and dots)', () => {
      const w = mount(SectionHeading, { props: { eyebrow: 'New', eyebrowStyle: 'pill' } })
      const e = w.find('[data-slot="section-heading-eyebrow"]')
      expect(e.attributes('data-style')).toBe('pill')
      expect(e.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border']))
      expect(sectionHeadingEyebrowVariants({ style: 'pill' })).not.toContain('rounded-full')
    })
    it('unknown style falls back to text; eyebrow slot works with pill', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(SectionHeading, { props: { eyebrow: 'x', eyebrowStyle: 'neon' } })
      expect(w.find('[data-slot="section-heading-eyebrow"]').attributes('data-style')).toBe('text')
      const s = mount(SectionHeading, { props: { eyebrowStyle: 'pill' }, slots: { eyebrow: '<b id="e">E</b>' } })
      expect(s.find('[data-slot="section-heading-eyebrow"] #e').exists()).toBe(true)
    })
  })

  describe('divider', () => {
    it('renders an aria-hidden rule between title and description', () => {
      const w = mount(SectionHeading, { props: { title: 'T', description: 'D', divider: true } })
      const d = w.find('[data-slot="section-heading-divider"]')
      expect(d.attributes('aria-hidden')).toBe('true')
      const html = w.html()
      expect(html.indexOf('section-heading-title')).toBeLessThan(html.indexOf('section-heading-divider'))
      expect(html.indexOf('section-heading-divider')).toBeLessThan(html.indexOf('section-heading-description'))
    })
    it('is absent by default', () => {
      expect(mount(SectionHeading, { props: { title: 'T' } }).find('[data-slot="section-heading-divider"]').exists()).toBe(false)
    })
    it('works with no title or description', () => {
      expect(mount(SectionHeading, { props: { divider: true } }).find('[data-slot="section-heading-divider"]').exists()).toBe(true)
    })
  })

  describe('actions', () => {
    it('named actions slot renders in the actions row', () => {
      const w = mount(SectionHeading, { slots: { actions: '<button id="a">Go</button>' } })
      expect(w.find('[data-slot="section-heading-actions"] #a').exists()).toBe(true)
    })
    it('actions and default slots can be combined in order', () => {
      const w = mount(SectionHeading, { slots: { actions: '<i id="one" />', default: '<i id="two" />' } })
      const html = w.html()
      expect(html.indexOf('id="one"')).toBeLessThan(html.indexOf('id="two"'))
    })
  })

  describe('slop and RTL regressions', () => {
    it('eyebrow is sentence case with no uppercase or tracking in either style', () => {
      for (const eyebrowStyle of ['text', 'pill'] as const) {
        const cls = mount(SectionHeading, { props: { eyebrow: 'Docs', eyebrowStyle } }).find('[data-slot="section-heading-eyebrow"]').classes().join(' ')
        expect(cls).not.toMatch(/uppercase|tracking-wider/)
        expect(sectionHeadingEyebrowVariants({ style: eyebrowStyle })).not.toMatch(/uppercase|tracking/)
      }
    })
    it('right alignment uses logical properties (ms-auto, text-end), not ml-auto / text-right', () => {
      const cls = sectionHeadingVariants({ align: 'right' })
      expect(cls).toContain('ms-auto')
      expect(cls).toContain('text-end')
      expect(cls).not.toMatch(/ml-auto|text-right/)
      expect(sectionHeadingVariants({ align: 'left' })).not.toContain('text-left')
    })
    it('divider is a flat aria-hidden rule, not a rounded-full pill', () => {
      const d = mount(SectionHeading, { props: { divider: true } }).find('[data-slot="section-heading-divider"]')
      expect(d.attributes('aria-hidden')).toBe('true')
      expect(d.classes()).not.toContain('rounded-full')
    })
    it('long words in the title wrap instead of overflowing at 320px', () => {
      expect(mount(SectionHeading, { props: { title: 'x' } }).find('h2').classes()).toContain('break-words')
    })
  })

  describe('customisation and edge cases', () => {
    it('class overrides size and alignment utilities', () => {
      const w = mount(SectionHeading, { props: { align: 'center', size: 'sm', class: 'max-w-5xl text-left' } })
      expect(w.classes()).toContain('max-w-5xl')
      expect(w.classes()).not.toContain('max-w-xl')
      expect(w.classes()).not.toContain('text-center')
    })
    it('all options together with long unicode text', () => {
      const long = 'ß'.repeat(4000)
      const w = mount(SectionHeading, {
        props: { align: 'right', size: 'lg', eyebrowStyle: 'pill', divider: true, eyebrow: long, title: long, description: long },
        slots: { actions: '<b>x</b>' },
      })
      expect(w.find('h2').text()).toHaveLength(4000)
      expect(w.find('[data-slot="section-heading-eyebrow"]').text()).toHaveLength(4000)
    })
    it('rapid prop switching ends in the last state', async () => {
      const w = mount(SectionHeading, { props: { title: 'x' } })
      for (const a of ['center', 'right', 'left', 'center'] as const) await w.setProps({ align: a })
      for (const s of ['sm', 'lg', 'full'] as const) await w.setProps({ size: s })
      expect(w.attributes('data-align')).toBe('center')
      expect(w.attributes('data-size')).toBe('full')
    })
    it('variant helper exposes defaults', () => {
      expect(sectionHeadingVariants()).toContain('items-start')
      expect(sectionHeadingVariants()).toContain('max-w-2xl')
    })
  })
})
