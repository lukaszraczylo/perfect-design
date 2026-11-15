import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormSection from './FormSection.vue'
import { formSectionFieldsVariants, formSectionVariants } from './variants'

const m = (props: Record<string, unknown> = {}) => mount(FormSection, { props: { title: 'Profile', description: 'Shown publicly.', ...props }, slots: { default: '<div>a</div><div>b</div>' } })
const fields = (w: ReturnType<typeof m>) => w.find('[data-slot="form-section-fields"]')
const title = (w: ReturnType<typeof m>) => w.find('[data-slot="form-section-title"]')

describe('FormSection card variant and size', () => {
  it('defaults are unchanged', () => {
    expect(formSectionVariants()).toBe('grid gap-6')
    expect(formSectionFieldsVariants()).toBe('grid grid-cols-1 gap-x-6 gap-y-4')
    const w = m()
    expect(w.attributes('class')).toBe('grid gap-6')
    expect(w.attributes('data-size')).toBe('md')
    expect(title(w).classes()).toEqual(['text-base', 'leading-snug', 'font-semibold'])
  })
  it('card draws a bordered padded panel on the card surface', () => {
    const w = m({ variant: 'card' })
    expect(w.attributes('data-variant')).toBe('card')
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-4', 'sm:p-6', 'text-card-foreground']))
    expect(fields(w).classes()).not.toContain('lg:col-span-2')
    expect(w.classes()).not.toContain('lg:grid-cols-3')
  })
  it('card combines with divider and columns', () => {
    const w = m({ variant: 'card', divider: true, columns: 2 })
    expect(w.classes()).toEqual(expect.arrayContaining(['border', 'border-b', 'pb-8']))
    expect(fields(w).classes()).toContain('sm:grid-cols-2')
  })
  it.each([
    ['sm', 'gap-4', 'text-sm', ['gap-x-4', 'gap-y-3']],
    ['lg', 'gap-8', 'text-lg', ['gap-x-8', 'gap-y-6']],
  ])('size %s', (size, gap, text, fieldGaps) => {
    const w = m({ size })
    expect(w.attributes('data-size')).toBe(size)
    expect(w.classes()).toContain(gap)
    expect(w.classes()).not.toContain('gap-6')
    expect(title(w).classes()).toContain(text)
    expect(title(w).classes()).not.toContain('text-base')
    expect(fields(w).classes()).toEqual(expect.arrayContaining(fieldGaps))
  })
  it('unknown variant and size fall back', () => {
    const w = m({ variant: 'neon', size: 'huge' })
    expect(w.attributes('data-variant')).toBe('stacked')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.attributes('class')).toBe('grid gap-6')
  })
  it('split and size combine; class wins', () => {
    const w = m({ variant: 'split', size: 'sm', class: 'gap-2' })
    expect(w.classes()).toEqual(expect.arrayContaining(['lg:grid-cols-3', 'gap-2']))
    expect(w.classes()).not.toContain('gap-4')
    expect(fields(w).classes()).toContain('lg:col-span-2')
  })
  it('keeps the landmark wiring in every variant', () => {
    for (const variant of ['stacked', 'split', 'card']) {
      const w = m({ variant, level: 2 })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('aria-labelledby')).toBe(title(w).attributes('id'))
      expect(title(w).element.tagName).toBe('H2')
    }
  })
})
