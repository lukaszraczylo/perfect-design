import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NativeSelect from './NativeSelect.vue'
import { NativeSelect as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
]
const sel = (w: VueWrapper) => w.find('select')

describe('NativeSelect', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(NativeSelect))

    it('renders a wrapper, a <select> and a chevron icon', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS } })
      expect(w.attributes('data-slot')).toBe('native-select-wrapper')
      expect(sel(w).attributes('data-slot')).toBe('native-select')
      expect(w.find('[data-slot="native-select-icon"]').exists()).toBe(true)
      expect(w.findAll('option').map((o) => o.text())).toEqual(['Alpha', 'Beta', 'Gamma'])
    })

    it('marks disabled options', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS } })
      expect(w.findAll('option')[2]!.attributes('disabled')).toBeDefined()
      expect(w.findAll('option')[0]!.attributes('disabled')).toBeUndefined()
    })

    it('reflects modelValue', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, modelValue: 'b' } })
      expect(sel(w).element.value).toBe('b')
    })

    it('emits update:modelValue on change', async () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, modelValue: 'a' } })
      await sel(w).setValue('b')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
    })

    it('works uncontrolled', async () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS } })
      await sel(w).setValue('b')
      expect(sel(w).element.value).toBe('b')
    })

    it('follows modelValue updates from the parent', async () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, modelValue: 'a' } })
      await w.setProps({ modelValue: 'b' })
      expect(sel(w).element.value).toBe('b')
      await w.setProps({ modelValue: null })
      expect(sel(w).element.value).not.toBe('b')
    })

    it('works with v-model in a parent', async () => {
      const v = ref('a')
      wrapper = mount(
        defineComponent({
          setup: () => () => h(NativeSelect, { options: OPTIONS, modelValue: v.value, 'onUpdate:modelValue': (x: string) => (v.value = x) }),
        }),
      )
      await wrapper.find('select').setValue('b')
      expect(v.value).toBe('b')
    })

    it('renders <option>/<optgroup> from the default slot', () => {
      const w = mount(NativeSelect, {
        slots: { default: '<optgroup label="G"><option value="x">X</option></optgroup><option value="y">Y</option>' },
      })
      expect(w.find('optgroup').attributes('label')).toBe('G')
      expect(w.findAll('option').map((o) => o.text())).toEqual(['X', 'Y'])
    })

    it('renders options and slot content together', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS }, slots: { default: '<option value="z">Zed</option>' } })
      expect(w.findAll('option')).toHaveLength(4)
    })

    it('slot options work with v-model and emit', async () => {
      const w = mount(NativeSelect, { props: { modelValue: 'y' }, slots: { default: '<option value="x">X</option><option value="y">Y</option>' } })
      expect(sel(w).element.value).toBe('y')
      await sel(w).setValue('x')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['x'])
    })

    it('renders a disabled hidden placeholder option selected while empty', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, placeholder: 'Choose...' } })
      const first = w.findAll('option')[0]!
      expect(first.text()).toBe('Choose...')
      expect(first.attributes('value')).toBe('')
      expect(first.attributes('disabled')).toBeDefined()
      expect(first.attributes('hidden')).toBeDefined()
      expect(sel(w).element.value).toBe('')
      expect(sel(w).attributes('data-placeholder')).toBeDefined()
      expect(sel(w).classes()).toContain('text-muted-foreground')
    })

    it('drops placeholder styling once a value is chosen', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, placeholder: 'Choose...', modelValue: 'a' } })
      expect(sel(w).attributes('data-placeholder')).toBeUndefined()
      expect(sel(w).classes()).not.toContain('text-muted-foreground')
    })

    it.each([
      ['sm', 'h-8'],
      ['md', 'h-9'],
      ['lg', 'h-11'],
    ] as const)('applies the %s size', (size, cls) => {
      expect(sel(mount(NativeSelect, { props: { size } })).classes()).toContain(cls)
    })
  })

  describe('customisation', () => {
    it('merges class onto the wrapper and lets it win', () => {
      const w = mount(NativeSelect, { props: { class: 'w-48 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-48')
      expect(w.classes()).not.toContain('w-full')
    })

    it('passes attrs to the <select>', () => {
      const w = mount(NativeSelect, { attrs: { 'aria-label': 'Fruit', name: 'fruit', 'data-x': '1' } })
      expect(sel(w).attributes('aria-label')).toBe('Fruit')
      expect(sel(w).attributes('name')).toBe('fruit')
      expect(sel(w).attributes('data-x')).toBe('1')
      expect(w.attributes('aria-label')).toBeUndefined()
    })

    it('explicit id attr wins over Field id', () => {
      wrapper = mount(Field, { props: { label: 'L', id: 'f' }, slots: { default: () => h(NativeSelect, { id: 'mine' }) } })
      expect(wrapper.find('select').attributes('id')).toBe('mine')
    })
  })

  describe('bad path', () => {
    it('disabled sets the attribute and blocks user change', () => {
      const w = mount(NativeSelect, { props: { disabled: true } })
      expect(sel(w).attributes('disabled')).toBeDefined()
    })

    it('invalid sets aria-invalid', () => {
      expect(sel(mount(NativeSelect, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(sel(mount(NativeSelect)).attributes('aria-invalid')).toBeUndefined()
    })

    it('unknown size falls back to md', () => {
      expect(sel(mount(NativeSelect, { props: { size: 'giant' as never } })).classes()).toContain('h-9')
    })

    it('modelValue not in options leaves nothing selected without crashing', () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS, modelValue: 'nope' } })
      expect(sel(w).element.value).not.toBe('nope')
    })

    it('required is reflected', () => {
      expect(sel(mount(NativeSelect, { props: { required: true } })).attributes('required')).toBeDefined()
      expect(sel(mount(NativeSelect)).attributes('required')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('renders an empty select with no options', () => {
      const w = mount(NativeSelect, { props: { options: [] } })
      expect(w.findAll('option')).toHaveLength(0)
    })

    it('placeholder without options still renders', () => {
      const w = mount(NativeSelect, { props: { placeholder: 'None' } })
      expect(w.findAll('option')).toHaveLength(1)
    })

    it('unicode and long labels render', () => {
      const w = mount(NativeSelect, {
        props: { options: [{ value: '1', label: '日本語 🍎' }, { value: '2', label: 'مرحبا' }, { value: '3', label: 'x'.repeat(400) }] },
      })
      expect(w.findAll('option').map((o) => o.text())).toEqual(['日本語 🍎', 'مرحبا', 'x'.repeat(400)])
    })

    it('rapid changes emit every value in order', async () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS } })
      for (const v of ['a', 'b', 'a', 'b']) await sel(w).setValue(v)
      expect(w.emitted('update:modelValue')?.map((e) => e[0])).toEqual(['a', 'b', 'a', 'b'])
    })

    it('options update reactively', async () => {
      const w = mount(NativeSelect, { props: { options: OPTIONS } })
      await w.setProps({ options: [{ value: 'z', label: 'Zed' }] })
      expect(w.findAll('option').map((o) => o.text())).toEqual(['Zed'])
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid, disabled, required from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Country', hint: 'Where', error: 'Required', id: 'country', disabled: true, required: true },
        slots: { default: () => h(NativeSelect) },
      })
      const s = wrapper.find('select')
      expect(s.attributes('id')).toBe('country')
      expect(s.attributes('aria-describedby')).toBe('country-hint country-error')
      expect(s.attributes('aria-invalid')).toBe('true')
      expect(s.attributes('disabled')).toBeDefined()
      expect(s.attributes('required')).toBeDefined()
    })
  })
})

describe('NativeSelect controlled rejection', () => {
  it('shows the prop value again when the parent does not accept the emitted value', async () => {
    const w = mount(NativeSelect, { props: { modelValue: 'a', 'aria-label': 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }, attachTo: document.body })
    const el = w.find('select')
    await el.setValue('b')
    await nextTick()
    await nextTick()
    expect((el.element as unknown as HTMLInputElement).value).toBe('a')
    w.unmount()
  })
  it('stays uncontrolled when modelValue is omitted', async () => {
    const w = mount(NativeSelect, { props: { 'aria-label': 'x', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }, attachTo: document.body })
    const el = w.find('select')
    await el.setValue('b')
    await nextTick()
    await nextTick()
    expect((el.element as unknown as HTMLInputElement).value).toBe('b')
    w.unmount()
  })
})
