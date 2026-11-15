import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DESCRIPTION_LIST_DENSITIES, DESCRIPTION_LIST_SIZES, DescriptionItem, DescriptionList, DetailField, descriptionItemVariants, descriptionListVariants } from './index'

const BODY = '<DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem>'
const make = (props: Record<string, unknown> = {}, body = BODY) =>
  mount({ components: { DescriptionList, DescriptionItem }, props: ['p'], template: `<DescriptionList v-bind="p">${body}</DescriptionList>` }, { props: { p: props } })
const item = (w: ReturnType<typeof make>, i = 0) => w.findAll('[data-slot=description-item]')[i]!

const DEFAULT_LIST = 'group/dl flex flex-col text-sm gap-3'
const DEFAULT_ITEM = 'grid gap-0.5 group-data-[divided=true]/dl:py-2 group-data-[orientation=horizontal]/dl:sm:grid-cols-[minmax(8rem,12rem)_1fr] group-data-[orientation=horizontal]/dl:sm:gap-4'

describe('DescriptionList variations', () => {
  describe('default output is unchanged', () => {
    it('keeps today\'s exact list and item classes and adds no attributes', () => {
      const w = make()
      expect(w.attributes('class')).toBe(DEFAULT_LIST)
      expect(item(w).attributes('class')).toBe(DEFAULT_ITEM)
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.attributes('data-density')).toBeUndefined()
      expect(mount(DetailField, { props: { label: 'Plan', value: 'x' } }).attributes('class')).toBe('flex flex-col gap-0.5 text-sm')
      expect(mount(DetailField, { props: { label: 'Plan', value: 'x' } }).find('dt').attributes('class')).toBe('text-xs font-medium text-muted-foreground')
    })
    it('explicit md and default are the same as unset for every variant', () => {
      for (const variant of ['stacked', 'inline', 'grid', 'striped']) {
        expect(make({ variant, size: 'md', density: 'default' }).attributes('class'), variant).toBe(make({ variant }).attributes('class'))
        expect(item(make({ variant, size: 'md', density: 'default' })).attributes('class'), variant).toBe(item(make({ variant })).attributes('class'))
      }
    })
    it('exports the value lists and the class helpers', () => {
      expect(DESCRIPTION_LIST_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(DESCRIPTION_LIST_DENSITIES).toEqual(['compact', 'default', 'comfortable'])
      expect(descriptionListVariants()).toBe(DEFAULT_LIST)
      expect(descriptionListVariants({ size: 'lg' })).toContain('text-base')
      expect(descriptionItemVariants({ density: 'comfortable' })).toContain('py-3')
    })
  })

  describe('size', () => {
    it('sm and lg replace the text size on the list', () => {
      const sm = make({ size: 'sm' })
      expect(sm.attributes('data-size')).toBe('sm')
      expect(sm.classes()).toContain('text-xs')
      expect(sm.classes()).not.toContain('text-sm')
      const lg = make({ size: 'lg' })
      expect(lg.attributes('data-size')).toBe('lg')
      expect(lg.classes()).toContain('text-base')
      expect(lg.classes()).not.toContain('text-sm')
    })
    it('unknown sizes fall back to md', () => {
      const w = make({ size: 'huge' })
      expect(w.attributes('class')).toBe(DEFAULT_LIST)
      expect(w.attributes('data-size')).toBeUndefined()
    })
    it('class wins over the size', () => {
      const w = make({ size: 'lg', class: 'text-xs' })
      expect(w.classes()).toContain('text-xs')
      expect(w.classes()).not.toContain('text-base')
    })
    it('applies in every variant and keeps the dl structure and copy button', () => {
      for (const variant of ['stacked', 'inline', 'grid', 'striped']) {
        const w = make({ variant, size: 'lg' }, '<DescriptionItem term="Key" copyable>abc</DescriptionItem>')
        expect(w.element.tagName).toBe('DL')
        expect(w.classes(), variant).toContain('text-base')
        expect(w.find('dt').text()).toBe('Key')
        expect(w.find('button').attributes('aria-label')).toBe('Copy Key')
      }
    })
  })

  describe('density', () => {
    it('compact and comfortable change the gap between stacked and inline items', () => {
      for (const variant of ['stacked', 'inline']) {
        expect(make({ variant, density: 'compact' }).classes(), variant).toContain('gap-1.5')
        expect(make({ variant, density: 'compact' }).classes(), variant).not.toContain('gap-3')
        expect(make({ variant, density: 'comfortable' }).classes(), variant).toContain('gap-5')
      }
    })
    it('compact and comfortable change the row gap of the grid', () => {
      expect(make({ variant: 'grid', density: 'compact' }).classes()).toEqual(expect.arrayContaining(['gap-y-2', 'gap-x-6']))
      expect(make({ variant: 'grid', density: 'comfortable' }).classes()).toEqual(expect.arrayContaining(['gap-y-6', 'gap-x-6']))
      expect(make({ variant: 'grid', density: 'comfortable' }).classes()).not.toContain('gap-y-4')
    })
    it('changes the padding of divided items', () => {
      const compact = make({ divided: true, density: 'compact' })
      expect(compact.classes()).toContain('divide-y')
      expect(item(compact).classes()).toContain('group-data-[divided=true]/dl:py-1')
      expect(item(compact).classes()).not.toContain('group-data-[divided=true]/dl:py-2')
      expect(item(make({ divided: true, density: 'comfortable' })).classes()).toContain('group-data-[divided=true]/dl:py-3')
    })
    it('does not add a gap to divided lists, which are separated by their rules', () => {
      const w = make({ divided: true, density: 'comfortable' })
      expect(w.classes()).not.toContain('gap-5')
      expect(w.classes()).not.toContain('gap-3')
    })
    it('changes the padding of striped items', () => {
      const c = item(make({ variant: 'striped', density: 'compact' }))
      expect(c.classes()).toEqual(expect.arrayContaining(['px-3', 'py-1', 'odd:bg-muted/50']))
      expect(c.classes()).not.toContain('py-2')
      expect(item(make({ variant: 'striped', density: 'comfortable' })).classes()).toContain('py-3')
    })
    it('reflects the density in a data attribute and falls back for unknown values', () => {
      expect(make({ density: 'compact' }).attributes('data-density')).toBe('compact')
      const w = make({ density: 'tight' })
      expect(w.attributes('data-density')).toBeUndefined()
      expect(w.attributes('class')).toBe(DEFAULT_LIST)
      expect(item(w).attributes('class')).toBe(DEFAULT_ITEM)
    })
    it('class on the item wins over the density padding', () => {
      const w = make({ variant: 'striped', density: 'comfortable' }, '<DescriptionItem term="A" class="py-8">x</DescriptionItem>')
      expect(item(w).classes()).toContain('py-8')
      expect(item(w).classes()).not.toContain('py-3')
    })
    it('items outside a list keep the default padding', () => {
      expect(mount(DescriptionItem, { props: { term: 'x' } }).attributes('class')).toBe(DEFAULT_ITEM)
    })
  })

  describe('combinations', () => {
    it('size, density, variant and orientation together', () => {
      const w = make({ variant: 'striped', orientation: 'horizontal', size: 'sm', density: 'compact' })
      expect(w.classes()).toEqual(expect.arrayContaining(['text-xs', 'rounded-md', 'border']))
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(item(w).classes()).toEqual(expect.arrayContaining(['py-1', 'group-data-[orientation=horizontal]/dl:sm:grid-cols-[minmax(8rem,12rem)_1fr]']))
    })
    it('grid columns still apply with a larger size and comfortable density', () => {
      const w = make({ variant: 'grid', columns: 2, size: 'lg', density: 'comfortable' })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid-cols-1', 'sm:grid-cols-2', 'text-base', 'gap-y-6']))
    })
  })

  describe('DetailField size', () => {
    it('sm uses 12px for label and value', () => {
      const w = mount(DetailField, { props: { label: 'Plan', value: 'x', size: 'sm' } })
      expect(w.attributes('data-size')).toBe('sm')
      expect(w.classes()).toContain('text-xs')
      expect(w.find('dt').classes()).toContain('text-xs')
    })
    it('lg uses 16px for the value and 14px for the label', () => {
      const w = mount(DetailField, { props: { label: 'Plan', value: 'x', size: 'lg' } })
      expect(w.classes()).toContain('text-base')
      expect(w.classes()).not.toContain('text-sm')
      expect(w.find('dt').classes()).toContain('text-sm')
      expect(w.find('dt').classes()).not.toContain('text-xs')
    })
    it('md and unknown sizes are the default', () => {
      for (const size of ['md', 'huge']) {
        const w = mount(DetailField, { props: { label: 'Plan', value: 'x', size: size as never } })
        expect(w.attributes('class')).toBe('flex flex-col gap-0.5 text-sm')
        expect(w.attributes('data-size')).toBeUndefined()
      }
    })
    it('class wins and the copy button and empty text still work', () => {
      const w = mount(DetailField, { props: { label: 'ID', value: 'abc', copyable: true, size: 'lg' }, attrs: { class: 'text-xs' } })
      expect(w.classes()).toContain('text-xs')
      expect(w.classes()).not.toContain('text-base')
      expect(w.find('button').attributes('aria-label')).toBe('Copy ID')
      expect(mount(DetailField, { props: { label: 'Notes', value: null, size: 'lg' } }).text()).toContain('–')
    })
  })

  describe('edge cases', () => {
    it('renders an empty list at every size and density', () => {
      for (const size of ['sm', 'md', 'lg']) for (const density of ['compact', 'default', 'comfortable']) expect(make({ size, density }, '').findAll('dt')).toHaveLength(0)
    })
    it('keeps long unbroken values wrapping', () => {
      const w = make({ size: 'lg' }, `<DescriptionItem term="Hash">${'a'.repeat(300)}</DescriptionItem>`)
      expect(w.find('dd').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
    })
  })
})
