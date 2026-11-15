import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, contentProps: Record<string, unknown> = {}, triggerProps: Record<string, unknown> = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Collapsible, rootProps, () => [h(CollapsibleTrigger, triggerProps, () => 'Toggle'), h(CollapsibleContent, contentProps, () => 'Hidden body')]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const trigger = () => document.body.querySelector<HTMLElement>('[data-slot="collapsible-trigger"]')!

describe('Collapsible', () => {
  describe('good path', () => {
    it('is closed by default, with aria-expanded=false', () => {
      make()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.body.textContent).not.toContain('Hidden body')
      expect(document.body.querySelector('[data-slot="collapsible"]')).not.toBeNull()
    })

    it('opens and closes on click', async () => {
      make()
      trigger().click()
      await flushPromises()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(document.body.textContent).toContain('Hidden body')
      expect(document.body.querySelector('[data-slot="collapsible-content"]')?.getAttribute('data-state')).toBe('open')
      trigger().click()
      await flushPromises()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('supports defaultOpen', () => {
      make({ defaultOpen: true })
      expect(document.body.textContent).toContain('Hidden body')
    })

    it('supports v-model:open', async () => {
      const open = ref(false)
      make({ open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) })
      trigger().click()
      await flushPromises()
      expect(open.value).toBe(true)
    })

    it('exposes open state to the default slot', () => {
      const w = mount(Collapsible, {
        props: { defaultOpen: true },
        slots: { default: '<template #default="{ open }"><span class="state">{{ open }}</span></template>' },
      })
      expect(w.find('.state').text()).toBe('true')
      w.unmount()
    })
  })

  describe('customisation', () => {
    it('merges classes on parts', () => {
      make({ class: 'root-x', defaultOpen: true }, { class: 'content-x' }, { class: 'trigger-x' })
      expect(document.body.querySelector('[data-slot="collapsible"]')?.className).toContain('root-x')
      expect(trigger().className).toContain('trigger-x')
      expect(document.body.querySelector('[data-slot="collapsible-content"]')?.className).toContain('content-x')
    })

    it('class overrides the default overflow utility', () => {
      make({ defaultOpen: true }, { class: 'overflow-visible' })
      const cls = document.body.querySelector('[data-slot="collapsible-content"]')!.className
      expect(cls).toContain('overflow-visible')
      expect(cls).not.toContain('overflow-hidden')
    })

    it('trigger asChild renders the consumer element', () => {
      const w = mount(Collapsible, {
        slots: { default: () => h(CollapsibleTrigger, { asChild: true }, () => h('a', { href: '#x', class: 'mine' }, 'Link')) },
      })
      expect(w.find('a.mine').attributes('data-slot')).toBe('collapsible-trigger')
      w.unmount()
    })
  })

  describe('bad path', () => {
    it('disabled collapsible does not open', async () => {
      make({ disabled: true })
      trigger().click()
      await flushPromises()
      expect(document.body.textContent).not.toContain('Hidden body')
      expect(trigger().hasAttribute('disabled')).toBe(true)
    })

    it('unmountOnHide removes content when closed', async () => {
      make({ defaultOpen: true, unmountOnHide: true })
      trigger().click()
      await flushPromises()
      expect(document.body.textContent).not.toContain('Hidden body')
    })
  })

  describe('edge cases', () => {
    it('forceMount keeps closed content in the DOM', () => {
      make({}, { forceMount: true })
      expect(document.body.querySelector('[data-slot="collapsible-content"]')).not.toBeNull()
    })

    it('rapid toggles end in a consistent state', async () => {
      make()
      for (let i = 0; i < 9; i++) {
        trigger().click()
        await flushPromises()
      }
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
    })

    it('no slots renders', () => {
      wrapper = mount(Collapsible, { attachTo: document.body })
      expect(document.body.querySelector('[data-slot="collapsible"]')).not.toBeNull()
    })
  })
})
