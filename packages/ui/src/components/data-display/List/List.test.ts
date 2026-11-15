import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { List, ListItem, listVariants } from './index'

describe('List', () => {
  describe('good path', () => {
    it('renders ul[role=list] with li items and dividers', () => {
      const w = mount({ components: { List, ListItem }, template: '<List><ListItem>A</ListItem><ListItem>B</ListItem></List>' })
      const ul = w.find('ul')
      expect(w.element.tagName).toBe('UL')
      expect(ul.attributes('role')).toBe('list')
      expect(ul.attributes('data-slot')).toBe('list')
      expect(ul.classes()).toContain('divide-y')
      const items = w.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0]!.attributes('data-slot')).toBe('list-item')
    })

    it('divided=false and bordered', () => {
      expect(mount(List, { props: { divided: false } }).classes()).not.toContain('divide-y')
      expect(mount(List, { props: { bordered: true } }).classes()).toContain('border')
    })

    it('renders as ol', () => {
      expect(mount(List, { props: { as: 'ol' } }).element.tagName).toBe('OL')
    })

    it('ListItem renders leading, default, description and trailing slots', () => {
      const w = mount(ListItem, { slots: { leading: '<i>L</i>', default: 'Title', description: 'Desc', trailing: '<b>T</b>' } })
      expect(w.find('[data-slot="list-item-leading"] i').text()).toBe('L')
      expect(w.find('[data-slot="list-item-content"]').text()).toContain('Title')
      expect(w.find('[data-slot="list-item-description"]').text()).toBe('Desc')
      expect(w.find('[data-slot="list-item-trailing"] b').text()).toBe('T')
    })

    it('omits empty slot wrappers', () => {
      const w = mount(ListItem, { slots: { default: 'x' } })
      expect(w.find('[data-slot="list-item-leading"]').exists()).toBe(false)
      expect(w.find('[data-slot="list-item-trailing"]').exists()).toBe(false)
      expect(w.find('[data-slot="list-item-description"]').exists()).toBe(false)
    })
  })

  describe('interactive', () => {
    it('is focusable, styled and activates with Enter and Space', async () => {
      let clicks = 0
      const w = mount(ListItem, { props: { interactive: true }, slots: { default: 'x' } })
      w.element.addEventListener('click', () => clicks++) // native: Vue skips same-millisecond bubble invokers after a capture invoker
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.classes()).toContain('cursor-pointer')
      expect(w.attributes('data-interactive')).toBeDefined()
      await w.trigger('keydown', { key: 'Enter' })
      await w.trigger('keydown', { key: ' ' })
      await w.trigger('keydown', { key: 'a' })
      expect(clicks).toBe(2)
      await w.trigger('click')
      expect(clicks).toBe(3)
    })

    it('ignores keydown bubbling from inner controls', async () => {
      let clicks = 0
      const w = mount(ListItem, { props: { interactive: true }, attrs: { onClick: () => clicks++ }, slots: { trailing: '<button id="b">x</button>' } })
      await w.find('#b').trigger('keydown', { key: 'Enter' })
      expect(clicks).toBe(0)
    })

    it('native a / button need no tabindex or manual key handling', async () => {
      let clicks = 0
      const w = mount(ListItem, { props: { as: 'button', interactive: true }, attrs: { onClick: () => clicks++ } })
      expect(w.attributes('tabindex')).toBeUndefined()
      await w.trigger('keydown', { key: 'Enter' })
      expect(clicks).toBe(0)
    })

    it('non-interactive item has no tabindex and ignores keys', async () => {
      let clicks = 0
      const w = mount(ListItem, { attrs: { onClick: () => clicks++ } })
      expect(w.attributes('tabindex')).toBeUndefined()
      await w.trigger('keydown', { key: 'Enter' })
      expect(clicks).toBe(0)
    })

    it('selected highlights and sets aria-current', () => {
      const w = mount(ListItem, { props: { selected: true } })
      expect(w.attributes('aria-current')).toBe('true')
      expect(w.attributes('data-state')).toBe('selected')
      expect(w.classes()).toContain('bg-accent')
    })
  })

  describe('bad path', () => {
    it('disabled blocks clicks and keys, removes tabindex', async () => {
      let clicks = 0
      const w = mount(ListItem, { props: { interactive: true, disabled: true }, attrs: { onClick: () => clicks++ } })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('tabindex')).toBeUndefined()
      expect(w.classes()).toContain('opacity-50')
      await w.trigger('click')
      await w.trigger('keydown', { key: 'Enter' })
      expect(clicks).toBe(0)
    })
  })

  describe('customisation', () => {
    it('merges classes, passes attrs, supports as and asChild', () => {
      const w = mount(ListItem, { props: { class: 'px-8 custom' }, attrs: { 'data-test': 'z' } })
      expect(w.classes()).toContain('px-8')
      expect(w.classes()).not.toContain('px-3')
      expect(w.attributes('data-test')).toBe('z')
      expect(mount(List, { props: { class: 'gap-2' } }).classes()).toContain('gap-2')
      expect(mount(ListItem, { props: { as: 'div' } }).element.tagName).toBe('DIV')
      const child = mount(ListItem, { props: { asChild: true }, slots: { default: '<a href="/x">x</a>' } })
      expect(child.element.tagName).toBe('A')
      expect(child.classes()).toContain('flex')
    })
  })

  describe('edge cases', () => {
    it('empty list and empty item render', () => {
      expect(mount(List).text()).toBe('')
      expect(mount(ListItem).text()).toBe('')
    })
    it('long unicode text keeps min-w-0 for truncation', () => {
      const w = mount(ListItem, { slots: { default: 'ж'.repeat(5000) } })
      expect(w.find('[data-slot="list-item-content"]').classes()).toContain('min-w-0')
      expect(w.text()).toHaveLength(5000)
    })
  })

  describe('variants', () => {
    const wrap = (variant: string | undefined, itemAttrs = '') =>
      mount({
        components: { List, ListItem },
        template: `<List ${variant ? `variant="${variant}"` : ''}><ListItem ${itemAttrs}><template #leading><i id="lead">A</i></template>Title<template #description>Desc</template></ListItem><ListItem>B</ListItem></List>`,
      })

    it('default output is unchanged', () => {
      const w = mount(List)
      expect(w.classes().join(' ')).toBe('flex flex-col divide-y divide-border')
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(mount(List, { props: { divided: false, bordered: true } }).classes().join(' ')).toBe('flex flex-col overflow-hidden rounded-lg border')
      const item = mount(ListItem)
      expect(item.classes().join(' ')).toBe('flex items-center gap-3 px-3 py-2.5 text-sm')
      expect(listVariants()).toBe('flex flex-col divide-y divide-border')
    })

    it('plain has no dividers and ignores divided', () => {
      const w = mount(List, { props: { variant: 'plain', divided: true } })
      expect(w.classes()).not.toContain('divide-y')
      expect(w.attributes('data-variant')).toBe('plain')
    })

    it('divided variant wins over divided=false', () => {
      expect(mount(List, { props: { variant: 'divided', divided: false } }).classes()).toContain('divide-y')
    })

    it('card gives each row its own surface and spaces them', () => {
      const w = wrap('card')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('divide-y')
      const li = w.find('li')
      for (const c of ['rounded-lg', 'border', 'bg-card', 'shadow-xs']) expect(li.classes(), c).toContain(c)
    })

    it('card + selected: selected background wins', () => {
      const w = mount({ components: { List, ListItem }, template: '<List variant="card"><ListItem selected>A</ListItem></List>' })
      const li = w.find('li')
      expect(li.classes()).toContain('bg-accent')
      expect(li.classes()).not.toContain('bg-card')
    })

    it('interactive makes every row focusable, styled and keyboard-activatable', async () => {
      let clicks = 0
      const w = mount({
        components: { List, ListItem },
        template: '<List variant="interactive"><ListItem>A</ListItem><ListItem :interactive="false">B</ListItem><ListItem disabled>C</ListItem></List>',
      })
      const [a, b, c] = w.findAll('li')
      a!.element.addEventListener('click', () => clicks++)
      expect(a!.attributes('tabindex')).toBe('0')
      expect(a!.classes()).toContain('cursor-pointer')
      expect(a!.attributes('data-interactive')).toBeDefined()
      await a!.trigger('keydown', { key: 'Enter' })
      expect(clicks).toBe(1)
      expect(b!.attributes('tabindex')).toBeUndefined()
      expect(b!.attributes('data-interactive')).toBeUndefined()
      expect(c!.attributes('tabindex')).toBeUndefined()
      expect(w.find('ul').classes()).toContain('divide-y')
    })

    it('with-avatar enlarges spacing, unmutes the leading slot and emphasises the title', () => {
      const w = wrap('with-avatar')
      const li = w.find('li')
      expect(li.classes()).toContain('gap-4')
      expect(li.classes()).toContain('py-3')
      expect(li.classes()).not.toContain('gap-3')
      expect(w.find('[data-slot="list-item-leading"]').classes()).toContain('text-foreground')
      expect(w.find('[data-slot="list-item-leading"]').classes()).not.toContain('text-muted-foreground')
      expect(w.find('[data-slot="list-item-content"]').classes()).toContain('font-medium')
      expect(w.find('[data-slot="list-item-description"]').classes()).toContain('font-normal')
      expect(w.find('ul').classes()).toContain('divide-y')
    })

    it('other variants keep the muted leading slot and plain content', () => {
      const w = wrap('divided')
      expect(w.find('[data-slot="list-item-leading"]').classes()).toContain('text-muted-foreground')
      expect(w.find('[data-slot="list-item-content"]').classes()).not.toContain('font-medium')
      expect(w.find('li').classes()).not.toContain('bg-card')
    })

    it('unknown variant falls back to the legacy divided behaviour', () => {
      const w = mount(List, { props: { variant: 'wobbly' as never } })
      expect(w.classes()).toContain('divide-y')
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(mount(List, { props: { variant: 'wobbly' as never, divided: false } }).classes()).not.toContain('divide-y')
      const item = mount({ components: { List, ListItem }, template: '<List variant="wobbly"><ListItem>A</ListItem></List>' }).find('li')
      expect(item.classes()).not.toContain('bg-card')
    })

    it('variant composes with bordered and class override', () => {
      const w = mount(List, { props: { variant: 'plain', bordered: true, class: 'rounded-none' } })
      expect(w.classes()).toContain('border')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })

    it('ListItem used outside a List behaves as before', () => {
      const w = mount(ListItem, { props: { interactive: true } })
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.classes()).not.toContain('bg-card')
    })

    it('empty list renders for every variant', () => {
      for (const variant of ['plain', 'divided', 'card', 'interactive', 'with-avatar'] as const) expect(mount(List, { props: { variant } }).text()).toBe('')
    })
  })
})
