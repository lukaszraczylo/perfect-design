import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberedSteps from './NumberedSteps.vue'
import { NUMBERED_STEPS_VARIANTS, numberedStepsContentVariants, numberedStepsItemVariants, numberedStepsNumberVariants, numberedStepsVariants } from './variants'

const steps = [
  { title: 'Install', description: 'Add the package' },
  { title: 'Import' },
  { title: 'Ship', description: 'Deploy' },
]

describe('NumberedSteps', () => {
  describe('good path', () => {
    it('renders an ordered list with numbers, titles and descriptions', () => {
      const w = mount(NumberedSteps, { props: { steps } })
      expect(w.element.tagName).toBe('OL')
      expect(w.attributes('data-slot')).toBe('numbered-steps')
      expect(w.findAll('li')).toHaveLength(3)
      expect(w.findAll('[data-slot="numbered-steps-number"]').map((n) => n.text())).toEqual(['1', '2', '3'])
      expect(w.findAll('h3')[0].text()).toContain('Install')
      expect(w.findAll('[data-slot="numbered-steps-description"]')).toHaveLength(2)
    })
    it('pad gives two-digit numbers', () => {
      const w = mount(NumberedSteps, { props: { steps, pad: true } })
      expect(w.find('[data-slot="numbered-steps-number"]').text()).toBe('01')
    })
    it('number is aria-hidden while the title carries a screen-reader number', () => {
      const w = mount(NumberedSteps, { props: { steps } })
      expect(w.find('[data-slot="numbered-steps-number"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('h3 .sr-only').text()).toBe('1.')
    })
    it.each([
      [1, 'grid-cols-1'],
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mount(NumberedSteps, { props: { steps, columns } }).classes()).toContain(cls)
      expect(numberedStepsVariants({ columns })).toContain(cls)
    })
    it('step slot replaces the content with scope', () => {
      const w = mount(NumberedSteps, { props: { steps, pad: true }, slots: { step: '<template #step="{ step, index, number }"><b>{{ number }}-{{ index }}-{{ step.title }}</b></template>' } })
      expect(w.findAll('b').map((b) => b.text())).toEqual(['01-0-Install', '02-1-Import', '03-2-Ship'])
    })
  })

  describe('variants', () => {
    it('default variant keeps the original card look', () => {
      const w = mount(NumberedSteps, { props: { steps } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.find('li').classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card']))
      expect(w.find('li').classes().join(' ')).not.toMatch(/shadow/)
      expect(w.find('[data-slot="numbered-steps-number"]').classes()).toContain('bg-primary')
    })
    it.each([
      ['cards', 'rounded-lg', 'sm:grid-cols-2'],
      ['minimal', 'border-t', 'sm:grid-cols-2'],
    ] as const)('%s honours columns', (variant, itemCls, colCls) => {
      const w = mount(NumberedSteps, { props: { steps, variant, columns: 4 } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toContain('lg:grid-cols-4')
      expect(w.classes()).toContain(colCls)
      expect(w.find('li').classes()).toContain(itemCls)
    })
    it('cards stacks the number above the text', () => {
      const w = mount(NumberedSteps, { props: { steps, variant: 'cards' } })
      expect(w.find('[data-slot="numbered-steps-content"]').classes()).toContain('flex-col')
      expect(w.find('[data-slot="numbered-steps-number"]').classes()).toContain('bg-primary')
    })
    it('timeline is a single column with a connector on every item but the last', () => {
      const w = mount(NumberedSteps, { props: { steps, variant: 'timeline', columns: 4 } })
      expect(w.classes()).toContain('grid-cols-1')
      expect(w.classes()).not.toContain('lg:grid-cols-4')
      expect(w.attributes('data-columns')).toBe('4')
      const li = w.find('li')
      expect(li.classes()).toEqual(expect.arrayContaining(['relative', 'before:absolute', 'last:before:hidden']))
      expect(w.find('[data-slot="numbered-steps-number"]').classes()).toContain('border-primary')
    })
    it('horizontal flows in a row from sm and draws a connector', () => {
      const w = mount(NumberedSteps, { props: { steps, variant: 'horizontal', columns: 2 } })
      expect(w.classes()).toEqual(expect.arrayContaining(['sm:grid-flow-col', 'sm:auto-cols-fr', 'sm:grid-cols-none']))
      expect(w.classes()).not.toContain('sm:grid-cols-2')
      expect(w.find('li').classes()).toEqual(expect.arrayContaining(['relative', 'sm:after:absolute', 'sm:last:after:hidden']))
      expect(w.find('[data-slot="numbered-steps-content"]').classes()).toContain('sm:flex-col')
    })
    it('minimal drops the circle and uses large bare numbers', () => {
      const w = mount(NumberedSteps, { props: { steps, variant: 'minimal', pad: true } })
      const n = w.find('[data-slot="numbered-steps-number"]')
      expect(n.classes()).toContain('text-2xl')
      expect(n.classes()).not.toContain('rounded-full')
      expect(n.text()).toBe('01')
      expect(w.classes()).toContain('gap-0')
    })
    describe('with-media', () => {
      const media = [
        { title: 'One', description: 'First', media: '/1.png', mediaAlt: 'Shot one' },
        { title: 'Two', media: '/2.png' },
        { title: 'Three' },
      ]
      it('renders a figure per step with media; alt is empty when omitted', () => {
        const w = mount(NumberedSteps, { props: { steps: media, variant: 'with-media' } })
        const figs = w.findAll('[data-slot="numbered-steps-media"]')
        expect(figs).toHaveLength(2)
        expect(figs[0].find('img').attributes('src')).toBe('/1.png')
        expect(figs[0].find('img').attributes('alt')).toBe('Shot one')
        expect(figs[1].find('img').attributes('alt')).toBe('')
        expect(w.findAll('li')[0].classes()).toContain('md:grid-cols-2')
      })
      it('a step without media collapses to one column', () => {
        const w = mount(NumberedSteps, { props: { steps: media, variant: 'with-media' } })
        const last = w.findAll('li')[2]
        expect(last.classes()).toContain('md:grid-cols-1')
        expect(last.classes()).not.toContain('md:grid-cols-2')
      })
      it('alternates the media side on odd items via a class on the figure (no arbitrary variant)', () => {
        const w = mount(NumberedSteps, { props: { steps: media, variant: 'with-media' } })
        const figs = w.findAll('figure')
        expect(figs[0].classes()).not.toContain('md:order-first')
        expect(figs[1].classes()).toContain('md:order-first')
        expect(w.find('li').classes().join(' ')).not.toContain('[')
      })
      it('media slot renders custom media even without step.media', () => {
        const w = mount(NumberedSteps, {
          props: { steps: [{ title: 'A' }, { title: 'B', media: '/x.png' }], variant: 'with-media' },
          slots: { media: '<template #media="{ step, index }"><b>{{ index }}:{{ step.title }}</b></template>' },
        })
        expect(w.findAll('b').map((b) => b.text())).toEqual(['0:A', '1:B'])
        expect(w.find('img').exists()).toBe(false)
      })
      it('a broken image hides its figure', async () => {
        const w = mount(NumberedSteps, { props: { steps: media, variant: 'with-media' } })
        await w.find('img').trigger('error')
        expect(w.findAll('[data-slot="numbered-steps-media"]')).toHaveLength(1)
      })
      it('media is ignored by other variants', () => {
        const w = mount(NumberedSteps, { props: { steps: media, variant: 'cards' }, slots: { media: '<i>m</i>' } })
        expect(w.find('[data-slot="numbered-steps-media"]').exists()).toBe(false)
        expect(w.find('i').exists()).toBe(false)
      })
    })
    it.each(NUMBERED_STEPS_VARIANTS)('%s: class merges last, attrs pass, slot still replaces content', (variant) => {
      const w = mount(NumberedSteps, {
        props: { steps, variant, class: 'gap-2 custom' },
        attrs: { id: 'x', 'data-test': 'y' },
        slots: { step: '<template #step="{ number }"><b>{{ number }}</b></template>' },
      })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.classes()).not.toContain('gap-0')
      expect(w.classes()).not.toContain('gap-8')
      expect(w.attributes('id')).toBe('x')
      expect(w.attributes('data-test')).toBe('y')
      expect(w.findAll('b').map((b) => b.text())).toEqual(['1', '2', '3'])
      expect(w.findAll('[data-slot="numbered-steps-number"]')).toHaveLength(0)
    })
    it.each(NUMBERED_STEPS_VARIANTS)('%s: headings, sr-only numbers and aria-hidden marker stay accessible', (variant) => {
      const w = mount(NumberedSteps, { props: { steps, variant, level: 2 } })
      expect(w.element.tagName).toBe('OL')
      expect(w.findAll('h2')).toHaveLength(3)
      expect(w.find('h2 .sr-only').text()).toBe('1.')
      expect(w.find('[data-slot="numbered-steps-number"]').attributes('aria-hidden')).toBe('true')
    })
    it('exposes class helpers for reuse', () => {
      expect(numberedStepsItemVariants({ variant: 'cards' })).toContain('rounded-lg')
      expect(numberedStepsNumberVariants({ variant: 'minimal' })).toContain('text-2xl')
      expect(numberedStepsContentVariants({ variant: 'horizontal' })).toContain('sm:flex-col')
      expect(numberedStepsItemVariants()).toContain('rounded-lg')
    })
  })
  describe('slop and RTL regressions', () => {
    it('no variant uses rounded-xl or larger, shadows, hover lifts or arbitrary variants', () => {
      for (const variant of NUMBERED_STEPS_VARIANTS) {
        const html = mount(NumberedSteps, { props: { steps: [{ title: 'a', media: '/x.png' }, { title: 'b' }], variant } }).html()
        expect(html).not.toMatch(/rounded-(xl|2xl|3xl)|shadow|hover:|\[&|even:/)
      }
    })
    it('connectors use logical offsets so RTL mirrors', () => {
      const t = numberedStepsItemVariants({ variant: 'timeline' })
      expect(t).toContain('before:start-5')
      expect(t).toContain('rtl:before:translate-x-1/2')
      expect(t).not.toMatch(/before:left-/)
      const h = numberedStepsItemVariants({ variant: 'horizontal' })
      expect(h).toContain('sm:after:start-13')
      expect(h).toContain('sm:after:-end-3')
      expect(h).not.toMatch(/after:(left|right|-right)-/)
    })
    it('media images decode asynchronously', () => {
      const w = mount(NumberedSteps, { props: { steps: [{ title: 'a', media: '/x.png', mediaAlt: 'x' }], variant: 'with-media' } })
      expect(w.find('img').attributes('decoding')).toBe('async')
    })
  })
  describe('customisation', () => {
    it('merges class, attrs, level', () => {
      const w = mount(NumberedSteps, { props: { steps, level: 4, class: 'gap-2 custom' }, attrs: { id: 'n' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('n')
      expect(w.findAll('h4')).toHaveLength(3)
    })
  })
  describe('bad path', () => {
    it('empty steps renders an empty list', () => {
      expect(mount(NumberedSteps, { props: { steps: [] } }).findAll('li')).toHaveLength(0)
    })
    it('unknown variant falls back to default; null/undefined too', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(NumberedSteps, { props: { steps, variant: 'bogus' } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.find('li').classes()).toContain('rounded-lg')
      // @ts-expect-error deliberately invalid
      expect(mount(NumberedSteps, { props: { steps, variant: null } }).attributes('data-variant')).toBe('default')
    })
    it.each(NUMBERED_STEPS_VARIANTS)('%s renders safely with empty steps', (variant) => {
      const w = mount(NumberedSteps, { props: { steps: [], variant } })
      expect(w.findAll('li')).toHaveLength(0)
    })
    it('invalid columns and level fall back', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(NumberedSteps, { props: { steps, columns: 8, level: 0 } })
      expect(w.attributes('data-columns')).toBe('3')
      expect(w.find('h3').exists()).toBe(true)
    })
  })
  describe('edge cases', () => {
    it('one step and 100 steps (padding stays correct past 99)', () => {
      expect(mount(NumberedSteps, { props: { steps: [steps[0]] } }).findAll('li')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ title: `S${i}` }))
      const w = mount(NumberedSteps, { props: { steps: many, pad: true } })
      expect(w.findAll('li')).toHaveLength(100)
      expect(w.findAll('[data-slot="numbered-steps-number"]')[99].text()).toBe('100')
    })
    it.each(NUMBERED_STEPS_VARIANTS)('%s: one step, 100 steps, long unicode text', (variant) => {
      expect(mount(NumberedSteps, { props: { steps: [steps[0]], variant } }).findAll('li')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ title: `S${i}`, media: `/${i}.png` }))
      const w = mount(NumberedSteps, { props: { steps: many, variant, pad: true } })
      expect(w.findAll('li')).toHaveLength(100)
      expect(w.findAll('[data-slot="numbered-steps-number"]')[99].text()).toBe('100')
      const long = mount(NumberedSteps, { props: { steps: [{ title: '手順'.repeat(500), description: '🚀'.repeat(300) }], variant } })
      expect(long.find('h3').text()).toHaveLength(1003)
    })
    it('rapid variant toggling re-renders cleanly and unmounts', async () => {
      const w = mount(NumberedSteps, { props: { steps } })
      for (let i = 0; i < 30; i++) await w.setProps({ variant: NUMBERED_STEPS_VARIANTS[i % NUMBERED_STEPS_VARIANTS.length] })
      expect(w.findAll('li')).toHaveLength(3)
      w.unmount()
    })
    it('steps shrinking after a broken image keeps rendering', async () => {
      const w = mount(NumberedSteps, { props: { steps: [{ title: 'A', media: '/a.png' }], variant: 'with-media' } })
      await w.find('img').trigger('error')
      await w.setProps({ steps: [] })
      expect(w.findAll('li')).toHaveLength(0)
    })
    it('long and unicode text', () => {
      const w = mount(NumberedSteps, { props: { steps: [{ title: '手順'.repeat(500), description: '🚀'.repeat(300) }] } })
      expect(w.find('h3').text()).toHaveLength(1003)
    })
  })
})
