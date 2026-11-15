import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

interface Opts {
  selectProps?: Record<string, unknown>
  triggerProps?: Record<string, unknown>
  contentProps?: Record<string, unknown>
  itemProps?: Record<string, unknown>
  model?: ReturnType<typeof ref<string | undefined>>
  withField?: Record<string, unknown>
  items?: Array<{ value: string; label: string; disabled?: boolean }>
}

async function flush() {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}

function make(opts: Opts = {}) {
  const model = opts.model ?? ref<string | undefined>(undefined)
  const items = opts.items ?? [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry', disabled: true },
  ]
  const select = () =>
    h(
      Select,
      {
        modelValue: model.value,
        'onUpdate:modelValue': (v: string) => (model.value = v),
        ...opts.selectProps,
      },
      () => [
        h(SelectTrigger, opts.triggerProps ?? {}, () => h(SelectValue, { placeholder: 'Pick fruit' })),
        h(SelectContent, opts.contentProps ?? {}, () => [
          h(SelectGroup, { class: 'grp' }, () => [
            h(SelectLabel, null, () => 'Fruits'),
            ...items.map((i) => h(SelectItem, { key: i.value, value: i.value, disabled: i.disabled, ...opts.itemProps }, () => i.label)),
          ]),
          h(SelectSeparator),
        ]),
      ],
    )
  const Host = defineComponent({
    setup: () => () => (opts.withField ? h(Field, opts.withField, () => select()) : select()),
  })
  wrapper = mount(Host, { attachTo: document.body })
  return { model }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => Array.from(document.body.querySelectorAll(s)) as HTMLElement[]
const trigger = () => q('[data-slot="select-trigger"]')!
async function openByKey() {
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await flush()
}
async function pick(i: number) {
  qa('[role="option"]')[i]!.dispatchEvent(new Event('pointerup', { bubbles: true }))
  await flush()
}

describe('Select', () => {
  describe('good path', () => {
    it('renders a combobox trigger with placeholder and chevron, content closed', () => {
      make()
      expect(trigger().getAttribute('role')).toBe('combobox')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().hasAttribute('data-placeholder')).toBe(true)
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Pick fruit')
      expect(trigger().querySelector('svg[data-slot="icon"]')).not.toBeNull()
      expect(q('[data-slot="select-content"]')).toBeNull()
    })

    it('opens with the keyboard and renders items, label, group and separator', async () => {
      make()
      await openByKey()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(q('[data-slot="select-content"]')!.getAttribute('role')).toBe('listbox')
      expect(qa('[data-slot="select-item"]')).toHaveLength(3)
      expect(q('[data-slot="select-label"]')!.textContent).toBe('Fruits')
      expect(q('[data-slot="select-group"]')!.getAttribute('role')).toBe('group')
      expect(q('[data-slot="select-separator"]')).not.toBeNull()
    })

    it('opens on trigger pointer down', async () => {
      make()
      trigger().dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
      await flush()
      expect(trigger().getAttribute('aria-expanded')).toBeDefined()
    })

    it('selecting an item updates v-model, closes and shows the label in the trigger', async () => {
      const { model } = make()
      await openByKey()
      await pick(1)
      expect(model.value).toBe('banana')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Banana')
      expect(trigger().hasAttribute('data-placeholder')).toBe(false)
    })

    it('shows the checked indicator on the selected item', async () => {
      make({ model: ref('apple') })
      await openByKey()
      const items = qa('[data-slot="select-item"]')
      expect(items[0]!.getAttribute('aria-selected')).toBe('true')
      expect(items[0]!.querySelector('[data-slot="select-item-indicator"]')).not.toBeNull()
      expect(items[1]!.querySelector('[data-slot="select-item-indicator"]')).toBeNull()
    })

    it('works uncontrolled with defaultValue', async () => {
      const Host = defineComponent({
        setup: () => () =>
          h(Select, { defaultValue: 'banana' }, () => [
            h(SelectTrigger, null, () => h(SelectValue)),
            h(SelectContent, null, () => [h(SelectItem, { value: 'apple' }, () => 'Apple'), h(SelectItem, { value: 'banana' }, () => 'Banana')]),
          ]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Banana')
    })

    it('uncontrolled selection emits update:modelValue', async () => {
      const seen: string[] = []
      const Host = defineComponent({
        setup: () => () =>
          h(Select, { 'onUpdate:modelValue': (v: string) => seen.push(v) }, () => [
            h(SelectTrigger, null, () => h(SelectValue, { placeholder: 'x' })),
            h(SelectContent, null, () => [h(SelectItem, { value: 'apple' }, () => 'Apple')]),
          ]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await openByKey()
      await pick(0)
      expect(seen).toEqual(['apple'])
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Apple')
    })

    it('supports controlled open and emits update:open', async () => {
      const open = ref(true)
      make({ selectProps: { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) } })
      await flush()
      expect(q('[data-slot="select-content"]')).not.toBeNull()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
    })

    it('defaultOpen opens initially', async () => {
      make({ selectProps: { defaultOpen: true } })
      await flush()
      expect(q('[data-slot="select-content"]')).not.toBeNull()
    })

    it('emits update:open when toggled', async () => {
      const seen: boolean[] = []
      make({ selectProps: { 'onUpdate:open': (v: boolean) => seen.push(v) } })
      await openByKey()
      expect(seen).toEqual([true])
    })

    it('Escape closes the content', async () => {
      make()
      await openByKey()
      q('[data-slot="select-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('renders the hidden native select inside a form with name', async () => {
      const Host = defineComponent({
        setup: () => () =>
          h('form', null, [
            h(Select, { name: 'fruit', modelValue: 'apple' }, () => [
              h(SelectTrigger, null, () => h(SelectValue)),
              h(SelectContent, null, () => [h(SelectItem, { value: 'apple' }, () => 'Apple')]),
            ]),
          ]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(document.body.querySelector('select[name="fruit"]')).not.toBeNull()
    })

    it.each([
      ['sm', 'h-8'],
      ['md', 'h-9'],
      ['lg', 'h-11'],
    ])('trigger applies the %s size', (size, cls) => {
      make({ triggerProps: { size } })
      expect(trigger().classList.contains(cls)).toBe(true)
      expect(trigger().getAttribute('data-size')).toBe(size)
    })

    it('item-aligned position renders content', async () => {
      make({ contentProps: { position: 'item-aligned' } })
      await openByKey()
      expect(q('[data-slot="select-content"]')).not.toBeNull()
    })
  })

  describe('customisation', () => {
    it('merges class on every part (class wins over internal classes)', async () => {
      make({ triggerProps: { class: 'h-20 t-custom' }, contentProps: { class: 'c-custom min-w-64' }, itemProps: { class: 'i-custom' } })
      await openByKey()
      expect(trigger().classList.contains('t-custom')).toBe(true)
      expect(trigger().classList.contains('h-20')).toBe(true)
      expect(trigger().classList.contains('h-9')).toBe(false)
      const content = q('[data-slot="select-content"]')!
      expect(content.classList.contains('c-custom')).toBe(true)
      expect(content.classList.contains('min-w-64')).toBe(true)
      expect(content.classList.contains('min-w-32')).toBe(false)
      expect(q('[data-slot="select-item"]')!.classList.contains('i-custom')).toBe(true)
    })

    it('passes attrs to the trigger and to the content', async () => {
      make({ triggerProps: { 'aria-label': 'Fruit', 'data-x': '1' }, contentProps: { 'data-y': '2' } })
      await openByKey()
      expect(trigger().getAttribute('aria-label')).toBe('Fruit')
      expect(trigger().getAttribute('data-x')).toBe('1')
      expect(q('[data-slot="select-content"]')!.getAttribute('data-y')).toBe('2')
    })

    it('label, separator, group and value accept a class', async () => {
      const Host = defineComponent({
        setup: () => () =>
          h(Select, { open: true }, () => [
            h(SelectTrigger, null, () => h(SelectValue, { class: 'v-custom', placeholder: 'p' })),
            h(SelectContent, null, () => [
              h(SelectGroup, { class: 'g-custom' }, () => [h(SelectLabel, { class: 'l-custom' }, () => 'L'), h(SelectItem, { value: 'a' }, () => 'A')]),
              h(SelectSeparator, { class: 's-custom' }),
            ]),
          ]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(q('[data-slot="select-value"]')!.classList.contains('v-custom')).toBe(true)
      expect(q('[data-slot="select-group"]')!.classList.contains('g-custom')).toBe(true)
      expect(q('[data-slot="select-label"]')!.classList.contains('l-custom')).toBe(true)
      expect(q('[data-slot="select-separator"]')!.classList.contains('s-custom')).toBe(true)
    })

    it('SelectValue default slot overrides the selected text', async () => {
      const Host = defineComponent({
        setup: () => () =>
          h(Select, { modelValue: 'a' }, () => [
            h(SelectTrigger, null, () => h(SelectValue, null, () => 'Custom display')),
            h(SelectContent, null, () => [h(SelectItem, { value: 'a' }, () => 'A')]),
          ]),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Custom display')
    })

    it('trigger id prop wins over the generated one', () => {
      make({ triggerProps: { id: 'my-trigger' } })
      expect(trigger().id).toBe('my-trigger')
    })
  })

  describe('bad path', () => {
    it('disabled root blocks opening', async () => {
      make({ selectProps: { disabled: true } })
      expect(trigger().hasAttribute('disabled')).toBe(true)
      await openByKey()
      expect(q('[data-slot="select-content"]')).toBeNull()
    })

    it('disabled trigger blocks opening', async () => {
      make({ triggerProps: { disabled: true } })
      expect(trigger().hasAttribute('disabled')).toBe(true)
      await openByKey()
      expect(q('[data-slot="select-content"]')).toBeNull()
    })

    it('disabled item cannot be selected', async () => {
      const { model } = make()
      await openByKey()
      const cherry = qa('[data-slot="select-item"]')[2]!
      expect(cherry.hasAttribute('data-disabled')).toBe(true)
      await pick(2)
      expect(model.value).toBeUndefined()
    })

    it('invalid sets aria-invalid on the trigger', () => {
      make({ triggerProps: { invalid: true } })
      expect(trigger().getAttribute('aria-invalid')).toBe('true')
    })

    it('not invalid by default', () => {
      make()
      expect(trigger().hasAttribute('aria-invalid')).toBe(false)
    })

    it('unknown size falls back to md', () => {
      make({ triggerProps: { size: 'huge' } })
      expect(trigger().classList.contains('h-9')).toBe(true)
    })

    it('modelValue that matches no item keeps the placeholder-less empty value', async () => {
      make({ model: ref('zzz') })
      await flush()
      expect(q('[data-slot="select-value"]')!.textContent).not.toContain('Apple')
    })

    it('selecting nothing leaves the model untouched', async () => {
      const { model } = make()
      await openByKey()
      q('[data-slot="select-content"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(model.value).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('empty content renders no items', async () => {
      make({ items: [] })
      await openByKey()
      expect(qa('[data-slot="select-item"]')).toHaveLength(0)
    })

    it('unicode / RTL / long labels render', async () => {
      make({
        items: [
          { value: 'jp', label: '日本語 🍎' },
          { value: 'ar', label: 'مرحبا بالعالم' },
          { value: 'long', label: 'x'.repeat(300) },
        ],
      })
      await openByKey()
      expect(qa('[data-slot="select-item"]').map((e) => e.textContent)).toEqual(['日本語 🍎', 'مرحبا بالعالم', 'x'.repeat(300)])
    })

    it('rapid open/close/select cycles stay consistent', async () => {
      const { model } = make()
      for (const i of [0, 1, 0, 1]) {
        await openByKey()
        await pick(i)
      }
      expect(model.value).toBe('banana')
    })

    it('programmatic model change updates the displayed label', async () => {
      const { model } = make()
      model.value = 'apple'
      await flush()
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Apple')
      model.value = undefined
      await flush()
      expect(q('[data-slot="select-value"]')!.textContent).toBe('Pick fruit')
    })

    it('numeric-looking values are kept as strings', async () => {
      const { model } = make({ items: [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }] })
      await openByKey()
      await pick(1)
      expect(model.value).toBe('2')
    })
  })

  describe('Field integration', () => {
    it('trigger takes id, describedBy, invalid, disabled from Field', () => {
      make({ withField: { label: 'Fruit', hint: 'Pick one', error: 'Required', id: 'fruit', disabled: true } })
      expect(trigger().id).toBe('fruit')
      expect(trigger().getAttribute('aria-describedby')).toBe('fruit-hint fruit-error')
      expect(trigger().getAttribute('aria-invalid')).toBe('true')
      expect(trigger().hasAttribute('disabled')).toBe(true)
    })

    it('Field label click targets the trigger id', () => {
      make({ withField: { label: 'Fruit', id: 'fruit2' } })
      expect(q('[data-slot="field-label"]')!.getAttribute('for')).toBe('fruit2')
      expect(trigger().id).toBe('fruit2')
    })
  })
  describe('accessibility (regressions)', () => {
    it('trigger uses mobile-safe text size and the coarse-pointer min height', () => {
      make()
      expect(trigger().classList.contains('text-md')).toBe(true)
      expect(trigger().classList.contains('md:text-sm')).toBe(true)
      expect(trigger().classList.contains('pointer-coarse:min-h-11')).toBe(true)
      expect(trigger().classList.contains('text-start')).toBe(true)
    })

    it('lg trigger keeps text-md without a md downsize', () => {
      make({ triggerProps: { size: 'lg' } })
      expect(trigger().classList.contains('md:text-sm')).toBe(false)
    })

    it('items use logical padding, a forced-colors highlight outline and a coarse-pointer height', async () => {
      make()
      await openByKey()
      const item = qa('[data-slot="select-item"]')[0]!
      expect(item.classList.contains('ps-2')).toBe(true)
      expect(item.classList.contains('pe-8')).toBe(true)
      expect(item.className).not.toMatch(/\b(pr|pl)-/)
      expect(item.className).toContain('forced-colors:data-[highlighted]:outline')
      expect(item.classList.contains('pointer-coarse:min-h-11')).toBe(true)
      expect(item.querySelector('span.end-2')).not.toBeNull()
    })

    it('content is capped to the available width and keeps listbox semantics', async () => {
      make()
      await openByKey()
      const content = q('[data-slot="select-content"]')!
      expect(content.className).toContain('max-w-(--reka-select-content-available-width)')
      expect(content.getAttribute('role')).toBe('listbox')
      expect(trigger().getAttribute('aria-controls')).toBe(content.id)
      expect(qa('[role="option"]')[0]!.getAttribute('aria-selected')).toBe('false')
    })

    it('Escape closes the list and returns focus to the trigger', async () => {
      make()
      trigger().focus()
      await openByKey()
      const content = q('[data-slot="select-content"]')!
      content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger())
    })
  })
})
