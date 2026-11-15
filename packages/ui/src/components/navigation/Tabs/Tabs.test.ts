import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, opts: { extraTrigger?: Record<string, unknown>; listProps?: Record<string, unknown> } = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Tabs, rootProps, () => [
        h(TabsList, { 'aria-label': 'Sections', ...(opts.listProps ?? {}) }, () => [
          h(TabsTrigger, { value: 'a' }, () => 'Alpha'),
          h(TabsTrigger, { value: 'b', ...(opts.extraTrigger ?? {}) }, () => 'Beta'),
          h(TabsTrigger, { value: 'c', disabled: true }, () => 'Gamma'),
        ]),
        h(TabsContent, { value: 'a' }, () => 'Panel A'),
        h(TabsContent, { value: 'b' }, () => 'Panel B'),
        h(TabsContent, { value: 'c' }, () => 'Panel C'),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const triggers = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')]
const activate = async (el: HTMLElement) => {
  el.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
  await flushPromises()
}

describe('Tabs', () => {
  describe('good path', () => {
    it('renders roles and data-slots, shows the default tab', () => {
      make({ defaultValue: 'a' })
      expect(document.body.querySelector('[data-slot="tabs"]')).not.toBeNull()
      expect(document.body.querySelector('[role="tablist"]')?.getAttribute('data-slot')).toBe('tabs-list')
      expect(triggers().map((t) => t.getAttribute('role'))).toEqual(['tab', 'tab', 'tab'])
      expect(triggers()[0].getAttribute('aria-selected')).toBe('true')
      expect(document.body.textContent).toContain('Panel A')
      expect(document.body.textContent).not.toContain('Panel B')
    })

    it('switches tab on activation (uncontrolled)', async () => {
      make({ defaultValue: 'a' })
      await activate(triggers()[1])
      expect(triggers()[1].getAttribute('data-state')).toBe('active')
      expect(document.body.textContent).toContain('Panel B')
      expect(document.body.querySelector('[role="tabpanel"]')?.getAttribute('data-slot')).toBe('tabs-content')
    })

    it('supports v-model and emits update:modelValue', async () => {
      const model = ref<string | number>('a')
      make({ modelValue: model.value, 'onUpdate:modelValue': (v: string | number) => (model.value = v) })
      await activate(triggers()[1])
      expect(model.value).toBe('b')
    })

    it('uses the line variant by default and pill when asked', () => {
      make({ defaultValue: 'a' })
      expect(document.body.querySelector('[data-slot="tabs"]')?.getAttribute('data-variant')).toBe('line')
      expect(document.body.querySelector('[data-slot="tabs-list"]')?.className).toContain('border-b')
      wrapper!.unmount()
      make({ defaultValue: 'a', variant: 'pill' })
      expect(document.body.querySelector('[data-slot="tabs-list"]')?.className).toContain('bg-muted')
      expect(triggers()[0].className).toContain('rounded-md')
    })

    it('navigates with arrow keys', async () => {
      make({ defaultValue: 'a' })
      await flushPromises()
      triggers()[0].focus()
      triggers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await flushPromises()
      expect(document.activeElement).toBe(triggers()[1])
    })

    it('vertical orientation is reflected and uses ArrowDown', async () => {
      make({ defaultValue: 'a', orientation: 'vertical' })
      expect(document.body.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe('vertical')
      expect(document.body.querySelector('[data-slot="tabs"]')?.getAttribute('data-orientation')).toBe('vertical')
      await flushPromises()
      triggers()[0].focus()
      triggers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await flushPromises()
      expect(document.activeElement).toBe(triggers()[1])
    })

    it('manual activation mode does not activate on focus', async () => {
      make({ defaultValue: 'a', activationMode: 'manual' })
      await flushPromises()
      triggers()[0].focus()
      triggers()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await nextTick()
      expect(triggers()[1].getAttribute('data-state')).toBe('inactive')
    })
  })

  describe('customisation', () => {
    it('merges class on every part and lets it override', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Tabs, { defaultValue: 'a', class: 'root-x' }, () => [
            h(TabsList, { class: 'list-x bg-red-500' }, () => h(TabsTrigger, { value: 'a', class: 'trigger-x' }, () => 'A')),
            h(TabsContent, { value: 'a', class: 'content-x' }, () => 'A body'),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(document.body.querySelector('[data-slot="tabs"]')?.className).toContain('root-x')
      const list = document.body.querySelector('[data-slot="tabs-list"]')!
      expect(list.className).toContain('list-x')
      expect(list.className).toContain('bg-red-500')
      expect(triggers()[0].className).toContain('trigger-x')
      expect(document.body.querySelector('[data-slot="tabs-content"]')?.className).toContain('content-x')
    })

    it('passes aria and data attributes through', () => {
      make({ defaultValue: 'a', 'data-test': 'root' }, { listProps: { 'aria-label': 'Custom label' } })
      expect(document.body.querySelector('[data-test="root"]')).not.toBeNull()
      expect(document.body.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Custom label')
    })

    it('exports variants for reuse', () => {
      expect(tabsListVariants({ variant: 'pill' })).toContain('bg-muted')
      expect(tabsTriggerVariants({ variant: 'line' })).toContain('border-b-2')
    })

    it('supports asChild on a trigger', async () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Tabs, { defaultValue: 'a' }, () => [
            h(TabsList, null, () => h(TabsTrigger, { value: 'a', asChild: true }, () => h('a', { href: '#x' }, 'Link tab'))),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(triggers()[0].tagName).toBe('A')
    })
  })

  describe('bad path', () => {
    it('disabled tab cannot be activated', async () => {
      make({ defaultValue: 'a' })
      expect(triggers()[2].hasAttribute('disabled')).toBe(true)
      await activate(triggers()[2])
      expect(triggers()[2].getAttribute('data-state')).toBe('inactive')
      expect(document.body.textContent).not.toContain('Panel C')
    })

    it('unknown variant falls back to line', () => {
      make({ defaultValue: 'a', variant: 'nope' })
      expect(document.body.querySelector('[data-slot="tabs"]')?.getAttribute('data-variant')).toBe('line')
    })

    it('value with no matching content renders no panel without throwing', () => {
      make({ defaultValue: 'zzz' })
      expect(document.body.textContent).not.toContain('Panel')
    })

    it('trigger/list used outside Tabs variant context still render with defaults', () => {
      const w = mount(
        defineComponent({
          setup: () => () => h(Tabs, { defaultValue: 'a' }, () => h(TabsList, null, () => h(TabsTrigger, { value: 'a' }, () => 'A'))),
        }),
      )
      expect(w.find('[data-slot="tabs-trigger"]').exists()).toBe(true)
      w.unmount()
    })
  })

  describe('edge cases', () => {
    it('empty tab list renders', () => {
      wrapper = mount(Tabs, { slots: { default: () => h(TabsList) }, attachTo: document.body })
      expect(document.body.querySelector('[role="tablist"]')).not.toBeNull()
    })

    it('very long and unicode labels render intact', () => {
      const long = 'Ä'.repeat(300) + ' שלום'
      const w = mount(Tabs, {
        props: { defaultValue: 'a', dir: 'rtl' },
        slots: { default: () => h(TabsList, null, () => h(TabsTrigger, { value: 'a' }, () => long)) },
      })
      expect(w.find('[data-slot="tabs-trigger"]').text()).toBe(long)
      expect(w.attributes('dir')).toBe('rtl')
      w.unmount()
    })

    it('rapid activation ends on the last tab', async () => {
      make({ defaultValue: 'a' })
      for (let i = 0; i < 10; i++) await activate(triggers()[i % 2])
      expect(triggers()[1].getAttribute('data-state')).toBe('active')
      expect(triggers()[0].getAttribute('data-state')).toBe('inactive')
      expect(document.body.textContent).toContain('Panel B')
    })

    it('numeric values work', async () => {
      const w = mount(Tabs, {
        props: { defaultValue: 1 },
        slots: { default: () => [h(TabsList, null, () => [h(TabsTrigger, { value: 1 }, () => 'One'), h(TabsTrigger, { value: 2 }, () => 'Two')]), h(TabsContent, { value: 1 }, () => 'P1')] },
        attachTo: document.body,
      })
      expect(w.text()).toContain('P1')
      w.unmount()
    })
  })
})
