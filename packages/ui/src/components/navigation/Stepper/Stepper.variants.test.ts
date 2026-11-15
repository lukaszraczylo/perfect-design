import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faTruck } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../lib/cn'
import Stepper, { type StepperStep } from './Stepper.vue'
import { STEPPER_SIZES, STEPPER_VARIANTS, stepperBarVariants, stepperConnectorVariants, stepperIndicatorVariants, stepperTextVariants, stepperTitleVariants } from './index'

const steps: StepperStep[] = [{ title: 'Account', description: 'Create login' }, { title: 'Profile', icon: faTruck }, { title: 'Plan' }, { title: 'Done' }]
const make = (props: Record<string, unknown> = {}) => mount(Stepper, { props: { steps, current: 1, ...props } })
const ind = (w: ReturnType<typeof make>) => w.findAll('[data-slot="stepper-indicator"]')
const sep = (w: ReturnType<typeof make>) => w.findAll('[data-slot="stepper-separator"]')
const cls = (el: { classes: () => string[] }) => el.classes().join(' ')

describe('Stepper variants', () => {
  describe('default output is unchanged', () => {
    it('keeps the numbered, md classes of every part', () => {
      const w = make()
      expect(w.attributes('data-variant')).toBe('numbered')
      expect(w.attributes('data-size')).toBe('md')
      expect(new Set(ind(w)[0].classes())).toEqual(new Set('inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium tabular-nums motion-safe:transition-colors border-primary bg-primary text-primary-foreground'.split(' ')))
      expect(new Set(sep(w)[0].classes())).toEqual(new Set('bg-primary mx-1 mt-4 h-0.5 min-w-3 flex-1 sm:mx-3 sm:min-w-6'.split(' ')))
      expect(stepperIndicatorVariants()).toBe('inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium tabular-nums motion-safe:transition-colors')
      expect(stepperTextVariants()).toBe('flex min-w-0 flex-col pt-1')
      expect(stepperTitleVariants()).toBe('text-sm leading-5 font-medium')
      expect(w.get('[data-slot="stepper-text"]').classes()).toContain('pt-1')
      expect(w.text()).toContain('3')
    })

    it('keeps the vertical connector classes', () => {
      const w = make({ orientation: 'vertical' })
      expect(new Set(sep(w)[0].classes())).toEqual(new Set('shrink-0 bg-primary my-1 ms-3.75 min-h-6 w-0.5'.split(' ')))
    })
  })

  describe('variant dots', () => {
    it('renders smaller markers with no numbers and ignores custom icons', () => {
      const w = make({ variant: 'dots' })
      expect(w.attributes('data-variant')).toBe('dots')
      expect(ind(w)[2].text()).toBe('')
      expect(ind(w)[1].find('svg').exists()).toBe(false)
      expect(cls(ind(w)[1])).toContain('size-5')
      expect(cls(ind(w)[1])).not.toContain('size-8')
      expect(w.text()).not.toMatch(/[0-9]/)
    })

    it('marks complete with a check and error with a cross, so state is not colour alone', () => {
      const w = make({ variant: 'dots', steps: [{ title: 'A' }, { title: 'B', status: 'error' }, { title: 'C' }], current: 2 })
      expect(ind(w)[0].find('svg').exists()).toBe(true)
      expect(ind(w)[1].find('svg').exists()).toBe(true)
      expect(ind(w)[2].find('svg').exists()).toBe(false)
      expect(cls(ind(w)[1])).toContain('border-destructive')
      expect(cls(ind(w)[2])).toContain('border-primary')
      expect(w.text()).toContain('Error:')
      expect(w.text()).toContain('Completed:')
    })

    it('uses connector offsets that centre on the smaller marker', () => {
      expect(cls(sep(make({ variant: 'dots' }))[0])).toContain('mt-2.5')
      expect(cls(sep(make({ variant: 'dots', orientation: 'vertical' }))[0])).toContain('ms-2.25')
      expect(cls(sep(make({ variant: 'dots', size: 'sm' }))[0])).toContain('mt-2')
      expect(cls(sep(make({ variant: 'dots', size: 'lg', orientation: 'vertical' }))[0])).toContain('ms-2.75')
    })

    it('text sits flush with the marker (no top padding)', () => {
      expect(make({ variant: 'dots' }).get('[data-slot="stepper-text"]').classes()).toContain('pt-0')
    })
  })

  describe('variant bar', () => {
    it('renders one segment per step and no connectors', () => {
      const w = make({ variant: 'bar' })
      expect(w.attributes('data-variant')).toBe('bar')
      expect(ind(w)).toHaveLength(4)
      expect(sep(w)).toHaveLength(0)
      expect(cls(ind(w)[0])).toContain('h-1.5')
      expect(cls(ind(w)[0])).toContain('w-full')
      expect(cls(ind(w)[0])).not.toContain('size-8')
      expect(cls(ind(w)[0])).not.toContain('border-2')
    })

    it('fills complete and current segments and leaves upcoming ones muted', () => {
      const w = make({ variant: 'bar', steps: [...steps.slice(0, 3), { title: 'Fail', status: 'error' }], current: 1 })
      expect(cls(ind(w)[0])).toContain('bg-primary')
      expect(cls(ind(w)[1])).toContain('bg-primary')
      expect(cls(ind(w)[2])).toContain('bg-border')
      expect(cls(ind(w)[3])).toContain('bg-destructive')
    })

    it('puts a check before complete titles and a cross before error titles', () => {
      const w = make({ variant: 'bar', steps: [{ title: 'A' }, { title: 'B', status: 'error' }, { title: 'C' }], current: 2 })
      const titles = w.findAll('[data-slot="stepper-text"] > span:not(.sr-only)').filter((t) => t.text() !== '')
      expect(titles[0].find('svg').exists()).toBe(true)
      expect(titles[1].find('svg').exists()).toBe(true)
      expect(titles[2].find('svg').exists()).toBe(false)
      expect(w.text()).toContain('Current step:')
    })

    it('stacks the segment above the title when horizontal and beside it when vertical', () => {
      const h = make({ variant: 'bar' })
      expect(h.get('[data-slot="stepper-trigger"]').classes()).toEqual(expect.arrayContaining(['flex-col', 'w-full']))
      expect(h.classes()).toContain('gap-2')
      expect(h.get('[data-slot="stepper-step"]').classes()).toContain('flex-1')
      const v = make({ variant: 'bar', orientation: 'vertical' })
      expect(v.get('[data-slot="stepper-trigger"]').classes()).toContain('items-stretch')
      expect(v.get('[data-slot="stepper-trigger"]').classes()).not.toContain('flex-col')
      expect(cls(ind(v)[0])).toContain('w-1.5')
      expect(cls(ind(v)[0])).toContain('self-stretch')
      expect(v.classes()).toContain('gap-3')
    })

    it('sizes the bar thickness', () => {
      expect(cls(ind(make({ variant: 'bar', size: 'sm' }))[0])).toContain('h-1')
      expect(cls(ind(make({ variant: 'bar', size: 'lg' }))[0])).toContain('h-2')
      expect(stepperBarVariants({ orientation: 'vertical', size: 'lg' })).toContain('w-2')
      expect(stepperBarVariants({ orientation: 'vertical', size: 'sm' })).toContain('w-1')
    })

    it('clickable bars stay real buttons with focus rings', async () => {
      const w = make({ variant: 'bar', clickable: true })
      const buttons = w.findAll('button[data-slot="stepper-trigger"]')
      expect(buttons).toHaveLength(4)
      expect(buttons[0].classes().join(' ')).toContain('focus-visible:ring-3')
      await buttons[3].trigger('click')
      expect(w.emitted('update:current')).toEqual([[3]])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'size-6', 'text-xs', 'mt-3', 'pt-0.5'],
      ['md', 'size-8', 'text-sm', 'mt-4', 'pt-1'],
      ['lg', 'size-10', 'text-base', 'mt-5', 'pt-2'],
    ])('numbered %s scales marker, text and connector', (size, marker, text, mt, pt) => {
      const w = make({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(cls(ind(w)[0])).toContain(marker)
      expect(cls(ind(w)[0])).toContain(text)
      expect(cls(sep(w)[0])).toContain(mt)
      expect(w.get('[data-slot="stepper-text"]').classes()).toContain(pt)
    })

    it('scales the title text and the vertical offsets', () => {
      const sm = make({ size: 'sm', orientation: 'vertical' })
      expect(cls(sep(sm)[0])).toContain('ms-2.75')
      expect(sm.get('[data-slot="stepper-text"] .font-medium').classes()).toContain('text-xs')
      const lg = make({ size: 'lg', orientation: 'vertical' })
      expect(cls(sep(lg)[0])).toContain('ms-4.75')
      expect(lg.get('[data-slot="stepper-text"] .font-medium').classes()).toContain('text-base')
      expect(lg.get('[data-slot="stepper-text"] .font-medium').classes()).not.toContain('text-sm')
    })

    it('unknown size and variant fall back to the defaults', () => {
      const w = make({ size: 'xl', variant: 'rings' })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-variant')).toBe('numbered')
      expect(w.html()).toBe(make().html())
      expect(cls(ind(w)[0])).toContain('size-8')
    })

    it('every size and variant renders different markup', () => {
      expect(new Set(STEPPER_SIZES.map((size) => make({ size }).html())).size).toBe(3)
      expect(new Set(STEPPER_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(3)
    })

    it('exported variants merge through cn()', () => {
      expect(cn(stepperIndicatorVariants({ size: 'lg' }))).toContain('size-10')
      expect(cn(stepperIndicatorVariants({ size: 'lg' }))).not.toContain('size-8')
      expect(cn(stepperConnectorVariants({ variant: 'bar' }))).toContain('hidden')
      expect(cn(stepperConnectorVariants({ orientation: 'vertical', size: 'lg' }))).toContain('ms-4.75')
    })
  })

  describe('combinations and behaviour', () => {
    it.each(STEPPER_VARIANTS.flatMap((v) => (['horizontal', 'vertical'] as const).map((o) => [v, o] as const)))('%s %s keeps the list semantics', (variant, orientation) => {
      const w = make({ variant, orientation, size: 'sm', label: 'Flow' })
      expect(w.element.tagName).toBe('OL')
      expect(w.attributes('aria-label')).toBe('Flow')
      expect(w.findAll('li')).toHaveLength(4)
      expect(w.findAll('[aria-current="step"]')).toHaveLength(1)
      expect(w.findAll('[data-slot="stepper-indicator"]').every((i) => i.attributes('aria-hidden') === 'true')).toBe(true)
      expect(w.text()).toContain('Current step:')
    })

    it('horizontal variants still hide non-current titles below sm but keep them readable', () => {
      for (const variant of STEPPER_VARIANTS) {
        const w = make({ variant })
        const texts = w.findAll('[data-slot="stepper-text"]')
        expect(texts[0].classes(), variant).toContain('max-sm:sr-only')
        expect(texts[1].classes(), variant).not.toContain('max-sm:sr-only')
        expect(texts[0].text(), variant).toContain('Account')
      }
    })

    it('vertical variants keep every title visible', () => {
      for (const variant of STEPPER_VARIANTS) {
        for (const t of make({ variant, orientation: 'vertical' }).findAll('[data-slot="stepper-text"]')) expect(t.classes()).not.toContain('max-sm:sr-only')
      }
    })

    it('the step slot and class prop work in every variant', () => {
      const w = mount(Stepper, {
        props: { steps, current: 0, variant: 'dots', class: 'max-w-xl' },
        slots: { step: '<template #step="{ step }"><b class="custom">{{ step.title }}</b></template>' },
      })
      expect(w.findAll('.custom')).toHaveLength(4)
      expect(w.classes()).toContain('max-w-xl')
    })

    it('handles empty step lists, very long titles and one step in every variant', () => {
      const long = 'A very long step title '.repeat(10).trim()
      for (const variant of STEPPER_VARIANTS) {
        expect(mount(Stepper, { props: { steps: [], variant } }).findAll('li')).toHaveLength(0)
        const one = mount(Stepper, { props: { steps: [{ title: long }], variant } })
        expect(one.text()).toContain(long)
        expect(one.findAll('[data-slot="stepper-separator"]')).toHaveLength(0)
      }
    })
  })
})
