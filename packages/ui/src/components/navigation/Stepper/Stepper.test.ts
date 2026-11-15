import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import Stepper, { type StepperStep } from './Stepper.vue'

const steps: StepperStep[] = [
  { title: 'Account', description: 'Create login' },
  { title: 'Profile' },
  { title: 'Confirm', optional: true },
]
const statuses = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="stepper-step"]').map((s) => s.attributes('data-status'))
const triggers = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="stepper-trigger"]')

describe('Stepper', () => {
  describe('good path', () => {
    it('renders an ordered list with a step per entry and data-slots', () => {
      const w = mount(Stepper, { props: { steps, current: 0 } })
      expect(w.element.tagName).toBe('OL')
      expect(w.attributes('data-slot')).toBe('stepper')
      expect(w.attributes('aria-label')).toBe('Progress')
      expect(w.findAll('[data-slot="stepper-step"]')).toHaveLength(3)
      expect(w.findAll('[data-slot="stepper-separator"]')).toHaveLength(2)
      expect(w.text()).toContain('Create login')
      expect(w.text()).toContain('Optional')
    })

    it('derives complete / current / upcoming from the current index', () => {
      expect(statuses(mount(Stepper, { props: { steps, current: 1 } }))).toEqual(['complete', 'current', 'upcoming'])
      expect(statuses(mount(Stepper, { props: { steps, current: 0 } }))).toEqual(['current', 'upcoming', 'upcoming'])
    })

    it('marks the current step with aria-current="step" and the number/check indicators', () => {
      const w = mount(Stepper, { props: { steps, current: 1 } })
      expect(triggers(w).map((t) => t.attributes('aria-current'))).toEqual([undefined, 'step', undefined])
      const ind = w.findAll('[data-slot="stepper-indicator"]')
      expect(ind[0].find('svg').exists()).toBe(true)
      expect(ind[1].text()).toBe('2')
      expect(ind[2].text()).toBe('3')
    })

    it('respects explicit statuses including error', () => {
      const w = mount(Stepper, { props: { steps: [{ title: 'A', status: 'complete' }, { title: 'B', status: 'error' }, { title: 'C' }], current: 2 } })
      expect(statuses(w)).toEqual(['complete', 'error', 'current'])
      expect(w.findAll('[data-slot="stepper-indicator"]')[1].find('svg').exists()).toBe(true)
      expect(w.findAll('[data-slot="stepper-indicator"]')[1].classes().join(' ')).toContain('border-destructive')
    })

    it('announces status to screen readers', () => {
      const w = mount(Stepper, { props: { steps, current: 1 } })
      const sr = w.findAll('.sr-only').map((s) => s.text())
      expect(sr).toEqual(['Completed:', 'Current step:', 'Upcoming:'])
    })

    it('supports vertical orientation', () => {
      const w = mount(Stepper, { props: { steps, current: 0, orientation: 'vertical' } })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(w.classes()).toContain('flex-col')
      expect(w.find('[data-slot="stepper-separator"]').classes().join(' ')).toContain('w-0.5')
    })

    it('shows a custom icon for non-complete steps', () => {
      const w = mount(Stepper, { props: { steps: [{ title: 'A', icon: faUser }, { title: 'B' }], current: 0 } })
      expect(w.find('[data-slot="stepper-indicator"] svg').exists()).toBe(true)
    })

    it('step slot replaces the text content', () => {
      const w = mount(Stepper, {
        props: { steps, current: 1 },
        slots: { step: '<template #step="{ step, status }"><b class="custom">{{ step.title }}-{{ status }}</b></template>' },
      })
      expect(w.findAll('.custom').map((c) => c.text())).toEqual(['Account-complete', 'Profile-current', 'Confirm-upcoming'])
    })

    it('connector after a complete step is primary-coloured', () => {
      const w = mount(Stepper, { props: { steps, current: 2 } })
      const seps = w.findAll('[data-slot="stepper-separator"]')
      expect(seps.every((s) => s.classes().includes('bg-primary'))).toBe(true)
    })
  })

  describe('clickable', () => {
    it('steps are not buttons by default', async () => {
      const w = mount(Stepper, { props: { steps, current: 0 } })
      expect(triggers(w)[1].element.tagName).toBe('DIV')
      await triggers(w)[1].trigger('click')
      expect(w.emitted('update:current')).toBeUndefined()
    })

    it('clickable steps are buttons and emit update:current', async () => {
      const w = mount(Stepper, { props: { steps, current: 0, clickable: true } })
      expect(triggers(w)[2].element.tagName).toBe('BUTTON')
      expect(triggers(w)[2].attributes('type')).toBe('button')
      await triggers(w)[2].trigger('click')
      expect(w.emitted('update:current')![0]).toEqual([2])
    })

    it('controlled: current stays until the parent updates', async () => {
      const w = mount(Stepper, { props: { steps, current: 0, clickable: true } })
      await triggers(w)[1].trigger('click')
      expect(statuses(w)[0]).toBe('current')
      await w.setProps({ current: 1 })
      expect(statuses(w)).toEqual(['complete', 'current', 'upcoming'])
    })

    it('uncontrolled: moves on click', async () => {
      const w = mount(Stepper, { props: { steps, defaultCurrent: 0, clickable: true } })
      await triggers(w)[1].trigger('click')
      expect(statuses(w)).toEqual(['complete', 'current', 'upcoming'])
    })

    it('disabled steps are not clickable and clicking the current step is a no-op', async () => {
      const w = mount(Stepper, { props: { steps: [{ title: 'A' }, { title: 'B', disabled: true }, { title: 'C' }], current: 0, clickable: true } })
      expect(triggers(w)[1].element.tagName).toBe('DIV')
      await triggers(w)[1].trigger('click')
      await triggers(w)[0].trigger('click')
      expect(w.emitted('update:current')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class and passes attrs', () => {
      const w = mount(Stepper, { props: { steps, class: 'max-w-xl custom-x' }, attrs: { id: 'st' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.attributes('id')).toBe('st')
    })

    it('custom label and status labels', () => {
      const w = mount(Stepper, { props: { steps, current: 0, label: 'Checkout', labels: { current: 'Aktuell', optional: 'Optional (de)' } } })
      expect(w.attributes('aria-label')).toBe('Checkout')
      expect(w.text()).toContain('Aktuell')
      expect(w.text()).toContain('Optional (de)')
    })
  })

  describe('bad path', () => {
    it('unknown status is ignored and derived from the index', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(Stepper, { props: { steps: [{ title: 'A', status: 'bogus' }, { title: 'B' }], current: 1 } })
      expect(statuses(w)).toEqual(['complete', 'current'])
    })

    it('empty or missing steps render an empty list', () => {
      expect(mount(Stepper, { props: { steps: [] } }).findAll('li')).toHaveLength(0)
      // @ts-expect-error deliberately invalid
      expect(mount(Stepper, { props: { steps: null } }).findAll('li')).toHaveLength(0)
    })

    it('skips malformed entries', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(Stepper, { props: { steps: [null, 'x', { title: 'Ok' }], current: 0 } }).findAll('li')).toHaveLength(1)
    })

    it('clamps out-of-range, negative, NaN and fractional current', () => {
      expect(statuses(mount(Stepper, { props: { steps, current: 99 } }))).toEqual(['complete', 'complete', 'current'])
      expect(statuses(mount(Stepper, { props: { steps, current: -3 } }))).toEqual(['current', 'upcoming', 'upcoming'])
      expect(statuses(mount(Stepper, { props: { steps, current: Number.NaN } }))).toEqual(['current', 'upcoming', 'upcoming'])
      expect(statuses(mount(Stepper, { props: { steps, current: 1.8 } }))).toEqual(['complete', 'current', 'upcoming'])
    })
  })

  describe('edge cases', () => {
    it('a single step has no separator', () => {
      const w = mount(Stepper, { props: { steps: [{ title: 'Only' }], current: 0 } })
      expect(w.find('[data-slot="stepper-separator"]').exists()).toBe(false)
    })

    it('very long titles and many steps render', () => {
      const long = 'Ä'.repeat(300)
      const many = Array.from({ length: 200 }, (_, i) => ({ title: i === 0 ? long : `s${i}`, id: `id${i}` }))
      const w = mount(Stepper, { props: { steps: many, current: 100 } })
      expect(w.findAll('li')).toHaveLength(200)
      expect(w.text()).toContain(long)
      expect(statuses(w)[100]).toBe('current')
    })

    it('rapid updates of current keep a single current step', async () => {
      const w = mount(Stepper, { props: { steps, current: 0 } })
      for (let i = 0; i < 6; i++) await w.setProps({ current: i % 3 })
      expect(statuses(w).filter((s) => s === 'current')).toHaveLength(1)
    })

    it('duplicate ids do not break rendering', () => {
      const w = mount(Stepper, { props: { steps: [{ title: 'A', id: 1 }, { title: 'B', id: 2 }], current: 0 } })
      expect(w.findAll('li')).toHaveLength(2)
    })
  })
})
