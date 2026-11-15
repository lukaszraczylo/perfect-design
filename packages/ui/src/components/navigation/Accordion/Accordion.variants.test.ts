import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { cn } from '../../../lib/cn'
import {
  ACCORDION_ICON_POSITIONS,
  ACCORDION_SIZES,
  ACCORDION_VARIANTS,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  accordionContentInnerVariants,
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerVariants,
  accordionVariants,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, triggerSlots?: Record<string, () => unknown>) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Accordion, { type: 'single', defaultValue: 'a', ...rootProps }, () => [
        h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, null, triggerSlots ?? (() => 'Alpha')), h(AccordionContent, null, () => 'Body A')]),
        h(AccordionItem, { value: 'b' }, () => [h(AccordionTrigger, null, () => 'Beta'), h(AccordionContent, null, () => 'Body B')]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const root = () => document.body.querySelector<HTMLElement>('[data-slot="accordion"]')!
const items = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="accordion-item"]')]
const trigger = (i = 0) => document.body.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')[i]
const content = () => document.body.querySelector<HTMLElement>('[data-slot="accordion-content"]')!
const inner = () => content().firstElementChild as HTMLElement
const cleanup = () => {
  wrapper?.unmount()
  document.body.innerHTML = ''
}

describe('Accordion variations', () => {
  describe('variant', () => {
    it('flush is the default and keeps today\'s classes', () => {
      make()
      expect(root().dataset.variant).toBe('flush')
      expect(root().className).toBe('w-full')
      expect(items()[0].className).toBe('border-b last:border-b-0')
      expect(accordionVariants()).toBe('w-full')
      expect(accordionItemVariants()).toBe('border-b last:border-b-0')
    })

    it('bordered puts one rounded frame around the dividers', () => {
      make({ variant: 'bordered' })
      expect(root().className).toContain('rounded-lg')
      expect(root().className).toContain('border')
      expect(root().className).toContain('px-4')
      expect(items()[0].className).toBe('border-b last:border-b-0')
    })

    it('separated gives every item its own bordered card on the card surface', () => {
      make({ variant: 'separated' })
      expect(root().className).toContain('flex-col')
      expect(root().className).toContain('gap-2')
      const cls = items()[0].className
      expect(cls).toContain('rounded-lg')
      expect(cls).toContain('bg-card')
      expect(cls).toContain('text-card-foreground')
      expect(cls).toContain('last:border-b')
      expect(cls).not.toContain('last:border-b-0')
      expect(cls).not.toMatch(/(^|\s)border-b(\s|$)/)
      expect(cls).toMatch(/(^|\s)border(\s|$)/)
    })

    it('filled puts each item on a muted surface without borders', () => {
      make({ variant: 'filled' })
      expect(root().className).toContain('gap-1.5')
      const cls = items()[0].className
      expect(cls).toContain('bg-muted/50')
      expect(cls).toContain('rounded-lg')
      expect(cls).toContain('border-b-0')
      expect(cls).not.toMatch(/(^|\s)border-b(\s|$)/)
    })

    it('every variant renders different markup', () => {
      const seen = new Set<string>()
      for (const variant of ACCORDION_VARIANTS) {
        make({ variant })
        seen.add(`${root().className}|${items()[0].className}`)
        cleanup()
      }
      expect(seen.size).toBe(4)
    })

    it('an unknown variant falls back to flush', () => {
      make({ variant: 'neon' })
      expect(root().dataset.variant).toBe('flush')
      expect(root().className).toBe('w-full')
      expect(items()[0].className).toBe('border-b last:border-b-0')
    })

    it('class on the root and items still wins', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Accordion, { variant: 'separated', class: 'gap-6 max-w-sm' }, () => [
            h(AccordionItem, { value: 'a', class: 'bg-red-500 px-1' }, () => [h(AccordionTrigger, null, () => 'T'), h(AccordionContent, null, () => 'C')]),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(root().className).toContain('gap-6')
      expect(root().className).not.toContain('gap-2')
      expect(items()[0].className).toContain('bg-red-500')
      expect(items()[0].className).not.toContain('bg-card')
      expect(items()[0].className).toContain('px-1')
      expect(items()[0].className).not.toContain('px-4')
    })
  })

  describe('size', () => {
    it('md is the default and changes nothing', () => {
      make()
      expect(root().dataset.size).toBe('md')
      expect(trigger().className).toBe(accordionTriggerVariants())
      expect(trigger().className).toContain('py-4')
      expect(trigger().className).toContain('text-sm')
      expect(content().className).toBe(accordionContentVariants())
      expect(inner().className).toBe('pb-4')
      expect(accordionTriggerVariants({ size: 'md' })).toBe(accordionTriggerVariants())
    })

    it('sm tightens the trigger and the content', () => {
      make({ size: 'sm' })
      expect(root().dataset.size).toBe('sm')
      expect(trigger().className).toContain('py-2')
      expect(trigger().className).toContain('text-xs')
      expect(trigger().className).not.toContain('py-4')
      expect(trigger().className).not.toMatch(/\btext-sm\b/)
      expect(content().className).toContain('text-xs')
      expect(inner().className).toBe('pb-2')
    })

    it('lg loosens the trigger and the content', () => {
      make({ size: 'lg' })
      expect(trigger().className).toContain('py-5')
      expect(trigger().className).toContain('text-base')
      expect(content().className).toContain('text-base')
      expect(inner().className).toBe('pb-5')
    })

    it('keeps the coarse-pointer height and 24px minimum even at sm', () => {
      make({ size: 'sm' })
      expect(trigger().className).toContain('pointer-coarse:min-h-11')
      expect(trigger().className).toContain('py-2')
    })

    it('unknown size falls back to md and every size differs', () => {
      make({ size: 'tiny' })
      expect(root().dataset.size).toBe('md')
      expect(trigger().className).toBe(accordionTriggerVariants())
      cleanup()
      const seen = new Set<string>()
      for (const size of ACCORDION_SIZES) {
        make({ size })
        seen.add(`${trigger().className}|${inner().className}|${content().className}`)
        cleanup()
      }
      expect(seen.size).toBe(3)
    })

    it('class on the trigger and content wins over the size', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Accordion, { size: 'lg', defaultValue: 'a' }, () => [
            h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, { class: 'py-1' }, () => 'T'), h(AccordionContent, { class: 'pb-9' }, () => 'C')]),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(trigger().className).toContain('py-1')
      expect(trigger().className).not.toContain('py-5')
      expect(inner().className).toContain('pb-9')
      expect(inner().className).not.toContain('pb-5')
    })
  })

  describe('iconPosition', () => {
    const icon = () => trigger().querySelector('svg')!
    it('end is the default: title first, chevron last, spaced apart', () => {
      make()
      expect(root().dataset.iconPosition).toBe('end')
      expect(trigger().className).toContain('justify-between')
      expect(trigger().innerHTML.indexOf('Alpha')).toBeLessThan(trigger().innerHTML.indexOf('<svg'))
    })

    it('start puts the chevron before the title and packs them together', () => {
      make({ iconPosition: 'start' })
      expect(root().dataset.iconPosition).toBe('start')
      expect(trigger().innerHTML.indexOf('<svg')).toBeLessThan(trigger().innerHTML.indexOf('Alpha'))
      expect(trigger().className).toContain('justify-start')
      expect(trigger().className).not.toContain('justify-between')
      expect(trigger().textContent).toBe('Alpha')
    })

    it('start moves a custom icon slot too, and keeps the chevron rotation hook', () => {
      make({ iconPosition: 'start' }, { default: () => 'Alpha', icon: () => h('i', { class: 'mine' }) } as never)
      expect(trigger().firstElementChild?.className).toBe('mine')
      cleanup()
      make({ iconPosition: 'start' })
      expect(icon().getAttribute('class')).toContain('group-data-[state=open]:rotate-180')
    })

    it('unknown position falls back to end and both values differ', () => {
      make({ iconPosition: 'middle' })
      expect(root().dataset.iconPosition).toBe('end')
      expect(trigger().innerHTML.indexOf('Alpha')).toBeLessThan(trigger().innerHTML.indexOf('<svg'))
      cleanup()
      const seen = new Set<string>()
      for (const iconPosition of ACCORDION_ICON_POSITIONS) {
        make({ iconPosition })
        seen.add(trigger().outerHTML.replace(/id="[^"]*"|aria-controls="[^"]*"|data-reka-[a-z-]+="[^"]*"/g, ''))
        cleanup()
      }
      expect(seen.size).toBe(2)
    })
  })

  describe('combinations and behaviour', () => {
    it.each([
      ['bordered', 'sm', 'start'],
      ['separated', 'lg', 'end'],
      ['filled', 'sm', 'start'],
      ['flush', 'lg', 'start'],
    ])('%s + %s + icon %s keep every dimension', (variant, size, iconPosition) => {
      make({ variant, size, iconPosition })
      expect(root().dataset.variant).toBe(variant)
      expect(root().dataset.size).toBe(size)
      expect(root().dataset.iconPosition).toBe(iconPosition)
      expect(trigger().className).toContain(size === 'sm' ? 'text-xs' : 'text-base')
      expect(trigger().className).toContain(iconPosition === 'start' ? 'justify-start' : 'justify-between')
    })

    it.each(ACCORDION_VARIANTS)('%s keeps the heading, aria-expanded wiring and region role', async (variant) => {
      make({ variant, size: 'sm', iconPosition: 'start' })
      expect(document.body.querySelector('h3[data-slot="accordion-header"]')).not.toBeNull()
      expect(trigger(0).getAttribute('aria-expanded')).toBe('true')
      expect(trigger(1).getAttribute('aria-expanded')).toBe('false')
      expect(content().getAttribute('role')).toBe('region')
      trigger(1).click()
      await new Promise((r) => setTimeout(r, 0))
      expect(trigger(1).getAttribute('aria-expanded')).toBe('true')
      expect(trigger(0).getAttribute('aria-expanded')).toBe('false')
    })

    it('keeps the focus ring, reduced-motion handling and start-aligned text in every variant', () => {
      for (const variant of ACCORDION_VARIANTS) {
        make({ variant })
        expect(trigger().className, variant).toContain('focus-visible:ring-3')
        expect(trigger().className, variant).toContain('text-start')
        expect(content().className, variant).toContain('motion-reduce:animate-none')
        cleanup()
      }
    })

    it('works in multiple mode and with a disabled item', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Accordion, { type: 'multiple', variant: 'separated', defaultValue: ['a'] }, () => [
            h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, null, () => 'T'), h(AccordionContent, null, () => 'C')]),
            h(AccordionItem, { value: 'b', disabled: true }, () => [h(AccordionTrigger, null, () => 'U'), h(AccordionContent, null, () => 'D')]),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(items()).toHaveLength(2)
      expect(trigger(1).hasAttribute('disabled')).toBe(true)
      expect(trigger(1).className).toContain('disabled:opacity-50')
    })

    it('exported variants merge through cn() and keep the default when no option is given', () => {
      expect(cn(accordionTriggerVariants({ size: 'lg', iconPosition: 'start' }))).toContain('justify-start')
      expect(cn(accordionTriggerVariants({ size: 'lg' }))).not.toContain('py-4')
      expect(accordionContentInnerVariants({ size: 'lg' })).toBe('pb-4 pb-5')
      expect(cn(accordionContentInnerVariants({ size: 'lg' }))).toBe('pb-5')
    })

    it('handles very long titles without breaking the layout', () => {
      const long = 'A very long section title that keeps going '.repeat(8).trim()
      const Comp = defineComponent({
        setup: () => () =>
          h(Accordion, { variant: 'filled', iconPosition: 'start' }, () => [h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, null, () => long), h(AccordionContent, null, () => '')])]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(trigger().textContent).toBe(long)
      expect(trigger().className).toContain('flex-1')
    })
  })
})
