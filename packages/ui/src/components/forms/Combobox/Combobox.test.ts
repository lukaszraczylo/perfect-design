import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import Combobox from './Combobox.vue'
import { Combobox as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
]

async function flush() {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}

function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const model = ref<string | undefined>((props.modelValue as string | undefined) ?? undefined)
  const useModel = !('defaultValue' in props) && !props.uncontrolled
  const { uncontrolled: _u, ...rest } = props
  void _u
  const Host = defineComponent({
    setup: () => () =>
      h(Combobox, {
        options: OPTIONS,
        ...rest,
        ...(useModel ? { modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v) } : {}),
        ...attrs,
      }),
  })
  wrapper = mount(Host, { attachTo: document.body })
  return { model }
}

const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => Array.from(document.body.querySelectorAll(s)) as HTMLElement[]
const input = () => q('input[data-slot="combobox-input"]') as HTMLInputElement
const options = () => qa('[role="option"]')

async function type(text: string) {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
async function open() {
  input().focus()
  await flush()
}

describe('Combobox', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(Combobox))

    it('renders a root, an input with role=combobox, placeholder and a toggle', () => {
      make({ placeholder: 'Pick fruit' })
      expect(q('[data-slot="combobox"]')).not.toBeNull()
      expect(input().getAttribute('role')).toBe('combobox')
      expect(input().getAttribute('placeholder')).toBe('Pick fruit')
      expect(q('[data-slot="combobox-trigger"]')).not.toBeNull()
      expect(q('[data-slot="combobox-content"]')).toBeNull()
    })

    it('opens on focus and lists every option', async () => {
      make()
      await open()
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(options().map((o) => o.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry'])
    })

    it('opens on click', async () => {
      make()
      input().click()
      await flush()
      expect(options()).toHaveLength(3)
    })

    it('opens via the toggle button', async () => {
      make()
      q('[data-slot="combobox-trigger"]')!.click()
      await flush()
      expect(options().length).toBeGreaterThan(0)
    })

    it('filters options as the user types (case-insensitive)', async () => {
      make()
      await open()
      await type('BAN')
      expect(options().map((o) => o.textContent?.trim())).toEqual(['Banana'])
    })

    it('selecting an option updates v-model and displays its label', async () => {
      const { model } = make()
      await open()
      await type('ban')
      options()[0]!.click()
      await flush()
      expect(model.value).toBe('b')
      expect(input().value).toBe('Banana')
      expect(options()).toHaveLength(0)
    })

    it('displays the label for an initial modelValue', async () => {
      make({ modelValue: 'a' })
      await flush()
      expect(input().value).toBe('Apple')
    })

    it('shows a check indicator on the selected option', async () => {
      make({ modelValue: 'b' })
      await open()
      const selected = options().find((o) => o.getAttribute('aria-selected') === 'true')!
      expect(selected.textContent).toContain('Banana')
      expect(selected.querySelector('svg')).not.toBeNull()
      expect(options().find((o) => o.textContent?.includes('Apple'))!.querySelector('svg')).toBeNull()
    })

    it('works uncontrolled with defaultValue and emits', async () => {
      const seen: string[] = []
      make({ defaultValue: 'a' }, { 'onUpdate:modelValue': (v: string) => seen.push(v) })
      await flush()
      expect(input().value).toBe('Apple')
      await open()
      options()[1]!.click()
      await flush()
      expect(seen).toEqual(['b'])
      expect(input().value).toBe('Banana')
    })

    it('emits update:open', async () => {
      const seen: boolean[] = []
      make({}, { 'onUpdate:open': (v: boolean) => seen.push(v) })
      await open()
      expect(seen[0]).toBe(true)
    })

    it('controlled open prop opens the list', async () => {
      make({ open: true })
      await flush()
      expect(options()).toHaveLength(3)
    })

    it('Escape closes the list', async () => {
      make()
      await open()
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(input().getAttribute('aria-expanded')).toBe('false')
    })

    it('ArrowDown highlights options (keyboard navigation from reka)', async () => {
      make()
      await open()
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      await flush()
      expect(qa('[data-highlighted]').length).toBeGreaterThan(0)
    })

    it('renders the option slot with the option', async () => {
      const Host = defineComponent({
        setup: () => () => h(Combobox, { options: OPTIONS, open: true }, { option: ({ option }: { option: { label: string } }) => h('b', `#${option.label}`) }),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(options().map((o) => o.textContent?.trim())).toEqual(['#Apple', '#Banana', '#Cherry'])
    })

    it.each([
      ['sm', 'h-8'],
      ['md', 'h-9'],
      ['lg', 'h-11'],
    ])('applies the %s size to the input', (size, cls) => {
      make({ size })
      expect(input().classList.contains(cls)).toBe(true)
    })

    it('forwards name to a hidden input inside a form', async () => {
      const Host = defineComponent({ setup: () => () => h('form', null, [h(Combobox, { options: OPTIONS, name: 'fruit', modelValue: 'a' })]) })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(document.body.querySelector('input[name="fruit"]')).not.toBeNull()
    })
  })

  describe('empty state', () => {
    it('shows "No results" when nothing matches', async () => {
      make()
      await open()
      await type('zzz')
      expect(options()).toHaveLength(0)
      expect(q('[data-slot="combobox-empty"]')!.textContent?.trim()).toBe('No results')
    })

    it('custom emptyText', async () => {
      make({ emptyText: 'Nothing here' })
      await open()
      await type('zzz')
      expect(q('[data-slot="combobox-empty"]')!.textContent?.trim()).toBe('Nothing here')
    })

    it('empty slot overrides the text', async () => {
      const Host = defineComponent({
        setup: () => () => h(Combobox, { options: OPTIONS, open: true }, { empty: () => h('i', 'Add it?') }),
      })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      input().value = 'zzz'
      input().dispatchEvent(new Event('input', { bubbles: true }))
      await flush()
      expect(q('[data-slot="combobox-empty"] i')!.textContent).toBe('Add it?')
    })

    it('empty options array shows the empty message when opened', async () => {
      make({ options: [] })
      await open()
      expect(options()).toHaveLength(0)
      expect(q('[data-slot="combobox-empty"]')).not.toBeNull()
    })
  })

  describe('clearable', () => {
    it('no clear button unless clearable and a value is set', async () => {
      make({ modelValue: 'a' })
      await flush()
      expect(q('[data-slot="combobox-clear"]')).toBeNull()
    })

    it('hides the clear button while empty', async () => {
      make({ clearable: true })
      await flush()
      expect(q('[data-slot="combobox-clear"]')).toBeNull()
    })

    it('clear resets the value to an empty string and empties the input', async () => {
      const { model } = make({ clearable: true, modelValue: 'a' })
      await flush()
      expect(q('[data-slot="combobox-clear"]')!.getAttribute('aria-label')).toBe('Clear selection')
      q('[data-slot="combobox-clear"]')!.click()
      await flush()
      expect(model.value).toBe('')
      expect(input().value).toBe('')
      expect(q('[data-slot="combobox-clear"]')).toBeNull()
    })

    it('reserves extra end padding for the clear button', () => {
      make({ clearable: true })
      expect(input().classList.contains('pe-16')).toBe(true)
      document.body.innerHTML = ''
      make({})
      expect(input().classList.contains('pe-9')).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class onto the root and lets it win', () => {
      make({ class: 'w-64 custom' })
      const root = q('[data-slot="combobox"]')!
      expect(root.classList.contains('custom')).toBe(true)
      expect(root.classList.contains('w-64')).toBe(true)
      expect(root.classList.contains('w-full')).toBe(false)
    })

    it('passes attrs to the input', () => {
      make({}, { 'aria-label': 'Fruit', 'data-x': '1' })
      expect(input().getAttribute('aria-label')).toBe('Fruit')
      expect(input().getAttribute('data-x')).toBe('1')
    })

    it('id prop lands on the input', () => {
      make({ id: 'fruit-input' })
      expect(input().id).toBe('fruit-input')
    })

    it('id prop beats the Field id', () => {
      wrapper = mount(Field, {
        props: { label: 'L', id: 'f' },
        slots: { default: () => h(Combobox, { options: OPTIONS, id: 'mine' }) },
        attachTo: document.body,
      })
      expect(input().id).toBe('mine')
    })
  })

  describe('bad path', () => {
    it('disabled disables the input and the toggle and never opens', async () => {
      make({ disabled: true, clearable: true, modelValue: 'a' })
      expect(input().disabled).toBe(true)
      expect(q('[data-slot="combobox-clear"]')).toBeNull()
      input().click()
      await flush()
      expect(options()).toHaveLength(0)
    })

    it('disabled options cannot be selected', async () => {
      const { model } = make()
      await open()
      const cherry = options().find((o) => o.textContent?.includes('Cherry'))!
      expect(cherry.hasAttribute('data-disabled')).toBe(true)
      cherry.click()
      await flush()
      expect(model.value).toBeUndefined()
    })

    it('invalid sets aria-invalid on the input', () => {
      make({ invalid: true })
      expect(input().getAttribute('aria-invalid')).toBe('true')
    })

    it('not invalid by default', () => {
      make()
      expect(input().hasAttribute('aria-invalid')).toBe(false)
    })

    it('unknown size falls back to md', () => {
      make({ size: 'xxl' })
      expect(input().classList.contains('h-9')).toBe(true)
    })

    it('modelValue not in options shows an empty input (no crash)', async () => {
      make({ modelValue: 'unknown' })
      await flush()
      expect(input().value).toBe('')
    })

    it('null modelValue is treated as empty', async () => {
      make({ modelValue: null, uncontrolled: true })
      await flush()
      expect(input().value).toBe('')
    })

    it('required is reflected on the input', () => {
      make({ required: true })
      expect(input().required).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('unicode, RTL and very long labels filter and render', async () => {
      make({
        options: [
          { value: 'jp', label: '日本語 🍎' },
          { value: 'ar', label: 'مرحبا بالعالم' },
          { value: 'long', label: 'x'.repeat(300) },
        ],
      })
      await open()
      expect(options()).toHaveLength(3)
      await type('日本')
      expect(options().map((o) => o.textContent?.trim())).toEqual(['日本語 🍎'])
    })

    it('rapid typing leaves a consistent filtered list', async () => {
      make()
      await open()
      for (const t of ['a', 'ap', 'app', 'ban', 'b', '']) await type(t)
      expect(options()).toHaveLength(3)
    })

    it('options update reactively', async () => {
      const opts = ref([{ value: 'a', label: 'Apple' }])
      const Host = defineComponent({ setup: () => () => h(Combobox, { options: opts.value, open: true }) })
      wrapper = mount(Host, { attachTo: document.body })
      await flush()
      expect(options()).toHaveLength(1)
      opts.value = [...opts.value, { value: 'b', label: 'Banana' }]
      await flush()
      expect(options()).toHaveLength(2)
    })

    it('typing then blurring resets to the selected label', async () => {
      make({ modelValue: 'a' })
      await open()
      await type('xyz')
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      await flush()
      expect(input().value).toBe('Apple')
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid, disabled, required from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Fruit', hint: 'Pick', error: 'Required', id: 'fruit', disabled: true, required: true },
        slots: { default: () => h(Combobox, { options: OPTIONS }) },
        attachTo: document.body,
      })
      expect(input().id).toBe('fruit')
      expect(input().getAttribute('aria-describedby')).toBe('fruit-hint fruit-error')
      expect(input().getAttribute('aria-invalid')).toBe('true')
      expect(input().disabled).toBe(true)
      expect(input().required).toBe(true)
    })
  })
  describe('accessibility (regressions)', () => {
    it('input uses mobile-safe text size and the coarse-pointer min height', () => {
      make({})
      expect(input().classList.contains('text-md')).toBe(true)
      expect(input().classList.contains('md:text-sm')).toBe(true)
      expect(input().classList.contains('pointer-coarse:min-h-11')).toBe(true)
    })

    it('lg size keeps text-md without a md downsize', () => {
      make({ size: 'lg' })
      expect(input().classList.contains('md:text-sm')).toBe(false)
    })

    it('toggle and clear buttons are 24px with larger coarse targets, named and visibly focusable', async () => {
      make({ clearable: true, defaultValue: 'a' })
      await flush()
      for (const slot of ['combobox-clear', 'combobox-trigger']) {
        const el = q(`[data-slot="${slot}"]`)!
        expect(el.classList.contains('size-6')).toBe(true)
        expect(el.classList.contains('pointer-coarse:size-9')).toBe(true)
        expect(el.classList.contains('focus-visible:ring-3')).toBe(true)
        expect(el.getAttribute('aria-label')).toBeTruthy()
        expect(el.getAttribute('tabindex')).toBe('-1')
      }
    })

    it('uses logical properties for the button cluster and item padding (RTL)', async () => {
      make({})
      expect(q('[data-slot="combobox-anchor"] > div')!.classList.contains('end-2')).toBe(true)
      await open()
      const item = options()[0]!
      expect(item.classList.contains('pe-8')).toBe(true)
      expect(item.classList.contains('ps-2')).toBe(true)
      expect(item.className).not.toMatch(/\b(pr|pl)-/)
    })

    it('highlighted option has a forced-colors outline fallback and a coarse-pointer height', async () => {
      make({})
      await open()
      const item = options()[0]!
      expect(item.className).toContain('forced-colors:data-[highlighted]:outline')
      expect(item.classList.contains('pointer-coarse:min-h-11')).toBe(true)
    })

    it('empty state is a polite status message and content is capped to the available width', async () => {
      make({})
      await open()
      await type('zzz')
      const empty = q('[data-slot="combobox-empty"]')!
      expect(empty.getAttribute('role')).toBe('status')
      expect(empty.getAttribute('aria-live')).toBe('polite')
      expect(q('[data-slot="combobox-content"]')!.className).toContain('max-w-(--reka-combobox-content-available-width)')
    })

    it('input exposes combobox semantics: expanded, controls and listbox', async () => {
      make({})
      expect(input().getAttribute('aria-expanded')).toBe('false')
      await open()
      expect(input().getAttribute('aria-expanded')).toBe('true')
      const listbox = q('[role="listbox"]')!
      expect(input().getAttribute('aria-controls')).toBe(listbox.id)
      expect(input().getAttribute('autocomplete')).toBe('off')
    })
  })
})
