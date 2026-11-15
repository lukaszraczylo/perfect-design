import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, itemProps: Record<string, unknown> = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Accordion, rootProps, () => [
        h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, null, () => 'Alpha'), h(AccordionContent, null, () => 'Body A')]),
        h(AccordionItem, { value: 'b', ...itemProps }, () => [h(AccordionTrigger, null, () => 'Beta'), h(AccordionContent, null, () => 'Body B')]),
        h(AccordionItem, { value: 'c' }, () => [h(AccordionTrigger, null, () => 'Gamma'), h(AccordionContent, null, () => 'Body C')]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const triggers = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="accordion-trigger"]')]
const open = () => triggers().filter((t) => t.getAttribute('data-state') === 'open').map((t) => t.textContent?.trim())
const click = async (el: HTMLElement) => {
  el.click()
  await flushPromises()
}

describe('Accordion', () => {
  describe('good path', () => {
    it('renders items, headers and triggers with aria-expanded', () => {
      make()
      expect(document.body.querySelector('[data-slot="accordion"]')).not.toBeNull()
      expect(document.body.querySelectorAll('[data-slot="accordion-item"]')).toHaveLength(3)
      expect(document.body.querySelectorAll('h3[data-slot="accordion-header"]')).toHaveLength(3)
      expect(triggers().every((t) => t.getAttribute('aria-expanded') === 'false')).toBe(true)
    })

    it('single mode keeps one item open', async () => {
      make({ type: 'single' })
      await click(triggers()[0])
      expect(open()).toEqual(['Alpha'])
      expect(document.body.textContent).toContain('Body A')
      await click(triggers()[1])
      expect(open()).toEqual(['Beta'])
    })

    it('multiple mode keeps several open', async () => {
      make({ type: 'multiple' })
      await click(triggers()[0])
      await click(triggers()[2])
      expect(open()).toEqual(['Alpha', 'Gamma'])
    })

    it('is collapsible by default and can be made non-collapsible', async () => {
      make({ defaultValue: 'a' })
      expect(open()).toEqual(['Alpha'])
      await click(triggers()[0])
      expect(open()).toEqual([])
      wrapper!.unmount()
      make({ defaultValue: 'a', collapsible: false })
      await click(triggers()[0])
      expect(open()).toEqual(['Alpha'])
    })

    it('v-model emits update:modelValue', async () => {
      const model = ref<string | string[] | undefined>('a')
      make({ modelValue: model.value, 'onUpdate:modelValue': (v: string | string[]) => (model.value = v) })
      await click(triggers()[1])
      expect(model.value).toBe('b')
    })

    it('content links to its trigger via aria-labelledby and role=region', async () => {
      make({ defaultValue: 'a' })
      const content = document.body.querySelector('[data-slot="accordion-content"]')!
      expect(content.getAttribute('role')).toBe('region')
      expect(content.getAttribute('aria-labelledby')).toBe(triggers()[0].id)
    })

    it('arrow keys move focus between triggers', async () => {
      make()
      await flushPromises()
      triggers()[0].focus()
      triggers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await flushPromises()
      expect(document.activeElement).toBe(triggers()[1])
    })
  })

  describe('customisation', () => {
    it('merges classes on every part', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Accordion, { class: 'root-x', defaultValue: 'a' }, () =>
            h(AccordionItem, { value: 'a', class: 'item-x' }, () => [
              h(AccordionTrigger, { class: 'trigger-x' }, () => 'T'),
              h(AccordionContent, { class: 'content-x' }, () => 'C'),
            ]),
          ),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(document.body.querySelector('[data-slot="accordion"]')?.className).toContain('root-x')
      expect(document.body.querySelector('[data-slot="accordion-item"]')?.className).toContain('item-x')
      expect(triggers()[0].className).toContain('trigger-x')
      expect(document.body.querySelector('[data-slot="accordion-content"] > div')?.className).toContain('content-x')
    })

    it('class overrides default padding on the trigger', () => {
      const w = mount(Accordion, {
        slots: { default: () => h(AccordionItem, { value: 'a' }, () => h(AccordionTrigger, { class: 'py-1' }, () => 'T')) },
      })
      const cls = w.find('[data-slot="accordion-trigger"]').classes()
      expect(cls).toContain('py-1')
      expect(cls).not.toContain('py-4')
      w.unmount()
    })

    it('icon slot replaces the chevron', () => {
      const w = mount(Accordion, {
        slots: { default: () => h(AccordionItem, { value: 'a' }, () => h(AccordionTrigger, null, { default: () => 'T', icon: () => h('i', { class: 'mine' }) })) },
      })
      expect(w.find('.mine').exists()).toBe(true)
      expect(w.find('svg').exists()).toBe(false)
      w.unmount()
    })

    it('passes attributes through', () => {
      make({ 'data-test': 'acc' })
      expect(document.body.querySelector('[data-test="acc"]')).not.toBeNull()
    })
  })

  describe('bad path', () => {
    it('disabled root blocks interaction', async () => {
      make({ disabled: true })
      await click(triggers()[0])
      expect(open()).toEqual([])
      expect(triggers()[0].hasAttribute('disabled')).toBe(true)
    })

    it('disabled item blocks only that item', async () => {
      make({}, { disabled: true })
      await click(triggers()[1])
      expect(open()).toEqual([])
      await click(triggers()[0])
      expect(open()).toEqual(['Alpha'])
    })

    it('unknown type falls back to single', async () => {
      make({ type: 'weird' })
      await click(triggers()[0])
      await click(triggers()[1])
      expect(open()).toEqual(['Beta'])
    })

    it('defaultValue that matches no item opens nothing', () => {
      make({ defaultValue: 'zzz' })
      expect(open()).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('empty accordion renders', () => {
      wrapper = mount(Accordion, { attachTo: document.body })
      expect(document.body.querySelector('[data-slot="accordion"]')).not.toBeNull()
    })

    it('rapid toggling ends in the expected state', async () => {
      make()
      for (let i = 0; i < 7; i++) await click(triggers()[0])
      expect(open()).toEqual(['Alpha'])
    })

    it('very long unicode trigger text is intact', async () => {
      const long = 'Ünï'.repeat(300)
      const w = mount(Accordion, {
        slots: { default: () => h(AccordionItem, { value: 'a' }, () => [h(AccordionTrigger, null, () => long), h(AccordionContent, null, () => 'x')]) },
      })
      expect(w.find('[data-slot="accordion-trigger"]').text()).toBe(long)
      w.unmount()
    })

    it('multiple with array defaultValue', () => {
      make({ type: 'multiple', defaultValue: ['a', 'c'] })
      expect(open()).toEqual(['Alpha', 'Gamma'])
    })
  })
})
