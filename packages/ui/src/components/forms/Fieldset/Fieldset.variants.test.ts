import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Fieldset from './Fieldset.vue'
import Field from '../Field/Field.vue'
import Input from '../Input/Input.vue'

const m = (props: Record<string, unknown> = {}) => mount(Fieldset, { props: { legend: 'Contact', description: 'How we reach you.', ...props }, slots: { default: () => h(Field, { label: 'Email' }, () => h(Input)) } })
const legend = (w: ReturnType<typeof m>) => w.find('[data-slot="fieldset-legend"]')

describe('Fieldset variants and sizes', () => {
  it('plain md keeps the default classes', () => {
    const w = m()
    expect(w.classes()).toEqual(['m-0', 'min-w-0', 'border-0', 'p-0'])
    expect(legend(w).classes()).toEqual(expect.arrayContaining(['mb-1', 'px-0', 'text-sm', 'leading-none', 'font-semibold', 'text-foreground']))
    expect(legend(w).classes()).not.toContain('float-left')
    expect(w.find('[data-slot="fieldset-content"]').classes()).toEqual(['clear-both', 'flex', 'flex-col', 'gap-5'])
    expect(w.find('[data-slot="fieldset-description"]').classes()).toEqual(expect.arrayContaining(['text-sm', 'text-muted-foreground']))
    expect(w.attributes('data-size')).toBe('md')
  })
  it('card is unchanged and keeps the floated legend', () => {
    const w = m({ variant: 'card' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-4', 'text-card-foreground']))
    expect(legend(w).classes()).toEqual(expect.arrayContaining(['float-left', 'w-full']))
  })
  it('filled uses the secondary pair for the box, the legend and the description', () => {
    const w = m({ variant: 'filled' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'bg-secondary', 'p-4', 'text-secondary-foreground']))
    expect(w.classes()).not.toContain('border')
    expect(legend(w).classes()).toContain('text-secondary-foreground')
    expect(legend(w).classes()).toContain('float-left')
    expect(w.find('[data-slot="fieldset-description"]').classes()).toContain('text-secondary-foreground')
  })
  it('divided draws a single top rule and no box', () => {
    const w = m({ variant: 'divided' })
    expect(w.classes()).toEqual(expect.arrayContaining(['border-t', 'pt-5']))
    expect(w.classes()).not.toContain('rounded-lg')
    expect(legend(w).classes()).not.toContain('float-left')
  })
  it.each([
    ['sm', 'text-xs', 'gap-3'],
    ['lg', 'text-base', 'gap-6'],
  ])('size %s', (size, text, gap) => {
    const w = m({ size })
    expect(w.attributes('data-size')).toBe(size)
    expect(legend(w).classes()).toContain(text)
    expect(legend(w).classes()).not.toContain('text-sm')
    expect(w.find('[data-slot="fieldset-content"]').classes()).toContain(gap)
  })
  it('unknown variant and size (including inherited object keys) fall back', () => {
    for (const bad of ['neon', 'toString', 'constructor']) {
      const w = m({ variant: bad, size: bad })
      expect(w.attributes('data-variant')).toBe('plain')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toEqual(['m-0', 'min-w-0', 'border-0', 'p-0'])
    }
  })
  it('class wins over the variant', () => {
    const w = m({ variant: 'filled', class: 'bg-card p-6' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-card', 'p-6']))
    expect(w.classes()).not.toContain('bg-secondary')
    expect(w.classes()).not.toContain('p-4')
  })
  it('keeps legend, description wiring and disabled in every variant', () => {
    for (const variant of ['plain', 'card', 'filled', 'divided']) {
      const w = m({ variant, disabled: true, size: 'sm' })
      expect(w.element.tagName).toBe('FIELDSET')
      expect(w.attributes('disabled')).toBeDefined()
      expect(w.classes()).toContain('opacity-60')
      expect(w.attributes('aria-describedby')).toBe(w.find('[data-slot="fieldset-description"]').attributes('id'))
      expect(w.find('legend').exists()).toBe(true)
    }
  })
})
