import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { LIST_GAPS, LIST_SIZES, List, ListItem, listGaps, listItemSizes } from './index'

const make = (props: Record<string, unknown> = {}, item = '<ListItem>A</ListItem><ListItem>B</ListItem>') =>
  mount({ components: { List, ListItem }, props: ['p'], template: `<List v-bind="p">${item}</List>` }, { props: { p: props } })
const li = (w: ReturnType<typeof make>, i = 0) => w.findAll('li')[i]!

const DEFAULT_ITEM = 'flex items-center gap-3 px-3 py-2.5 text-sm'

describe('List variations', () => {
  describe('default output is unchanged', () => {
    it('keeps today\'s list and row class strings and adds no attributes', () => {
      const w = make()
      expect(w.attributes('class')).toBe('flex flex-col divide-y divide-border')
      expect(li(w).attributes('class')).toBe(DEFAULT_ITEM)
      expect(w.attributes('data-size')).toBeUndefined()
      expect(mount(ListItem).attributes('class')).toBe(DEFAULT_ITEM)
    })
    it('every variant keeps its list string when size and gap are not set', () => {
      expect(make({ variant: 'card' }).attributes('class')).toBe('flex flex-col gap-2')
      expect(make({ variant: 'plain' }).attributes('class')).toBe('flex flex-col')
    })
    it('exports the value lists', () => {
      expect(LIST_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(LIST_GAPS).toEqual(['none', 'sm', 'md', 'lg'])
      expect(listItemSizes.md).toBe('px-3 py-2.5 text-sm')
      expect(listGaps.md).toBe('gap-2')
    })
  })

  describe('size', () => {
    it('sm tightens rows and uses 12px text, passed down to every item', () => {
      const w = make({ size: 'sm' })
      expect(w.attributes('data-size')).toBe('sm')
      for (const i of [0, 1]) expect(li(w, i).classes()).toEqual(expect.arrayContaining(['px-3', 'py-1.5', 'text-xs']))
      expect(li(w).classes()).not.toContain('py-2.5')
      expect(li(w).classes()).not.toContain('text-sm')
    })
    it('lg roomier rows, 16px text and a larger description', () => {
      const w = make({ size: 'lg' }, '<ListItem>A<template #description>Desc</template></ListItem>')
      expect(w.attributes('data-size')).toBe('lg')
      expect(li(w).classes()).toEqual(expect.arrayContaining(['px-4', 'py-3.5', 'text-base']))
      expect(w.find('[data-slot=list-item-description]').classes()).toContain('text-sm')
      expect(w.find('[data-slot=list-item-description]').classes()).not.toContain('text-xs')
    })
    it('md equals the default and unknown values fall back to it', () => {
      expect(li(make({ size: 'md' })).attributes('class')).toBe(DEFAULT_ITEM)
      const w = make({ size: 'huge' })
      expect(li(w).attributes('class')).toBe(DEFAULT_ITEM)
      expect(w.attributes('data-size')).toBeUndefined()
    })
    it('keeps sm and md descriptions at 12px', () => {
      for (const size of ['sm', 'md']) {
        const w = make({ size }, '<ListItem>A<template #description>D</template></ListItem>')
        expect(w.find('[data-slot=list-item-description]').classes()).toContain('text-xs')
      }
    })
    it('class on the row wins over the size', () => {
      const w = make({ size: 'lg' }, '<ListItem class="py-1 text-xs">A</ListItem>')
      expect(li(w).classes()).toEqual(expect.arrayContaining(['py-1', 'text-xs']))
      expect(li(w).classes()).not.toContain('py-3.5')
      expect(li(w).classes()).not.toContain('text-base')
    })
    it('combines with the with-avatar and card variants', () => {
      const avatar = make({ size: 'lg', variant: 'with-avatar' }, '<ListItem><template #leading>L</template>Name</ListItem>')
      expect(li(avatar).classes()).toEqual(expect.arrayContaining(['gap-4', 'py-3', 'text-base']))
      expect(li(avatar).classes()).not.toContain('py-3.5')
      const card = make({ size: 'sm', variant: 'card' })
      expect(li(card).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'py-1.5', 'text-xs']))
    })
    it('keeps interactive rows keyboard operable and at least 24px high at sm', () => {
      const w = make({ size: 'sm', variant: 'interactive' })
      expect(li(w).attributes('tabindex')).toBe('0')
      // py-1.5 (12px) plus a 16px line of 12px text is 28px
      expect(li(w).classes()).toContain('py-1.5')
      expect(li(w).classes()).toContain('text-xs')
    })
    it('a row outside a list keeps the default size', () => {
      expect(mount(ListItem, { slots: { default: 'x' } }).classes()).toEqual(expect.arrayContaining(['py-2.5', 'text-sm']))
    })
  })

  describe('gap', () => {
    it.each([
      ['none', 'gap-0'],
      ['sm', 'gap-1'],
      ['md', 'gap-2'],
      ['lg', 'gap-4'],
    ])('%s gives %s on card lists', (gap, cls) => {
      const w = make({ variant: 'card', gap })
      expect(w.classes()).toContain(cls)
      if (cls !== 'gap-2') expect(w.classes()).not.toContain('gap-2')
    })
    it('spaces the rows of plain lists', () => {
      expect(make({ variant: 'plain', gap: 'lg' }).classes()).toContain('gap-4')
      expect(make({ divided: false, gap: 'sm' }).classes()).toContain('gap-1')
    })
    it('is ignored by divided variants, where rules separate rows', () => {
      for (const variant of ['divided', 'interactive', 'with-avatar']) expect(make({ variant, gap: 'lg' }).classes(), variant).not.toContain('gap-4')
      expect(make({ gap: 'lg' }).attributes('class')).toBe('flex flex-col divide-y divide-border')
    })
    it('unknown values behave as unset', () => {
      expect(make({ variant: 'card', gap: 'huge' }).attributes('class')).toBe('flex flex-col gap-2')
      expect(make({ variant: 'plain', gap: 'huge' }).attributes('class')).toBe('flex flex-col')
    })
    it('class wins over the gap', () => {
      const w = make({ variant: 'card', gap: 'lg', class: 'gap-1.5' })
      expect(w.classes()).toContain('gap-1.5')
      expect(w.classes()).not.toContain('gap-4')
    })
    it('combines with size and bordered', () => {
      const w = make({ variant: 'plain', gap: 'sm', size: 'lg', bordered: true })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-1', 'border', 'rounded-lg']))
      expect(li(w).classes()).toContain('text-base')
    })
  })

  describe('a11y and edge cases', () => {
    it('keeps list semantics in every size', () => {
      for (const size of ['sm', 'md', 'lg']) {
        const w = make({ size, as: 'ol' })
        expect(w.element.tagName).toBe('OL')
        expect(w.attributes('role')).toBe('list')
        expect(w.findAll('li')).toHaveLength(2)
      }
    })
    it('selected rows keep aria-current in every size', () => {
      const w = make({ size: 'lg' }, '<ListItem selected>A</ListItem>')
      expect(li(w).attributes('aria-current')).toBe('true')
      expect(li(w).classes()).toContain('bg-accent')
    })
    it('renders an empty list and long unbroken text', () => {
      expect(make({ size: 'lg', gap: 'lg', variant: 'card' }, '').findAll('li')).toHaveLength(0)
      const w = make({ size: 'sm' }, `<ListItem>${'x'.repeat(300)}</ListItem>`)
      expect(w.find('[data-slot=list-item-content]').classes()).toContain('min-w-0')
    })
    it('asChild rows do not break the size context', () => {
      const w = mount({ components: { List, ListItem }, template: '<List size="lg"><ListItem as-child><a href="/x" class="block">Go</a></ListItem></List>' })
      expect(w.find('a').exists()).toBe(true)
      expect(w.find('a').classes()).toContain('text-base')
    })
  })
})
