import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import ColorPicker from './ColorPicker.vue'
import Field from '../Field/Field.vue'
import { COLOR_PICKER_SWATCHES, normalizeColorPickerHex } from './color'
import { colorPickerSwatchVariants, colorPickerVariants } from './variants'

type W = ReturnType<typeof mount>
const input = (w: W) => w.find('input[data-slot=color-picker-input]')
const swatches = (w: W) => w.findAll('[data-slot=color-picker-swatch]')
const emitted = (w: W) => w.emitted('update:modelValue')?.map((e) => e[0])
const typeHex = (w: W, v: string) => input(w).setValue(v)

describe('normalizeColorPickerHex', () => {
  it.each([
    ['#abc', '#aabbcc'],
    ['ABC', '#aabbcc'],
    ['#AbCdEf', '#abcdef'],
    ['  #123456  ', '#123456'],
    ['#12345678', '#12345678'],
    ['#abcd', '#aabbccdd'],
    ['fff', '#ffffff'],
  ])('%s -> %s', (i, o) => expect(normalizeColorPickerHex(i)).toBe(o))

  it.each(['', '#', '#12', '#12345', '#1234567', '#123456789', '#ggg', 'red', 'rgb(0,0,0)', '##fff', '#ff ff', null, undefined, 12, {}])(
    'rejects %j',
    (i) => expect(normalizeColorPickerHex(i)).toBeNull(),
  )
})

describe('ColorPicker', () => {
  it('renders default palette as a radiogroup plus a hex input', () => {
    const w = mount(ColorPicker)
    expect(w.find('[data-slot=color-picker]').exists()).toBe(true)
    const group = w.find('[data-slot=color-picker-swatches]')
    expect(group.attributes('role')).toBe('radiogroup')
    expect(swatches(w)).toHaveLength(COLOR_PICKER_SWATCHES.length)
    expect(swatches(w)[0].attributes('role')).toBe('radio')
    expect(swatches(w)[0].attributes('aria-label')).toBe(COLOR_PICKER_SWATCHES[0])
    expect(input(w).exists()).toBe(true)
    expect(w.find('[data-slot=color-picker-preview]').attributes('data-empty')).toBeDefined()
  })

  it('marks the swatch matching modelValue checked and shows it in the input and preview', () => {
    const w = mount(ColorPicker, { props: { swatches: ['#f00', '#00f'], modelValue: '#0000FF' } })
    expect(swatches(w).map((s) => s.attributes('aria-checked'))).toEqual(['false', 'true'])
    expect((input(w).element as HTMLInputElement).value).toBe('#0000ff')
    expect(w.find('[data-slot=color-picker-preview]').attributes('data-empty')).toBeUndefined()
  })

  it('click on a swatch emits the normalised hex', async () => {
    const w = mount(ColorPicker, { props: { swatches: ['#F00', '#0000ff'] } })
    await swatches(w)[0].trigger('click')
    expect(emitted(w)).toEqual(['#ff0000'])
    expect((input(w).element as HTMLInputElement).value).toBe('#ff0000')
    expect(swatches(w)[0].attributes('aria-checked')).toBe('true')
  })

  it('clicking the already selected swatch does not re-emit', async () => {
    const w = mount(ColorPicker, { props: { swatches: ['#f00'], modelValue: '#ff0000' } })
    await swatches(w)[0].trigger('click')
    expect(emitted(w)).toBeUndefined()
  })

  it('syncs input and selection when modelValue changes', async () => {
    const w = mount(ColorPicker, { props: { swatches: ['#f00', '#00f'], modelValue: '#f00' } })
    await w.setProps({ modelValue: '#00f' })
    expect((input(w).element as HTMLInputElement).value).toBe('#0000ff')
    await w.setProps({ modelValue: null })
    expect((input(w).element as HTMLInputElement).value).toBe('')
    await w.setProps({ modelValue: 'banana' })
    expect((input(w).element as HTMLInputElement).value).toBe('')
  })

  describe('hex input', () => {
    it.each([
      ['#abc', '#aabbcc'],
      ['#A1B2C3', '#a1b2c3'],
      ['#11223344', '#11223344'],
      ['0f0', '#00ff00'],
    ])('typing %s emits %s', async (typed, hex) => {
      const w = mount(ColorPicker)
      await typeHex(w, typed)
      expect(emitted(w)).toEqual([hex])
      expect(input(w).attributes('aria-invalid')).toBeUndefined()
    })

    it('invalid hex sets aria-invalid and does not emit; typing on recovers', async () => {
      const w = mount(ColorPicker, { props: { modelValue: '#ff0000' } })
      await typeHex(w, '#12')
      expect(input(w).attributes('aria-invalid')).toBe('true')
      expect(emitted(w)).toBeUndefined()
      await typeHex(w, '#12345')
      expect(input(w).attributes('aria-invalid')).toBe('true')
      await typeHex(w, '#123456')
      expect(input(w).attributes('aria-invalid')).toBeUndefined()
      expect(emitted(w)).toEqual(['#123456'])
    })

    it('blur reverts an invalid draft to the current value', async () => {
      const w = mount(ColorPicker, { props: { modelValue: '#ff0000' } })
      await typeHex(w, 'zzz')
      await input(w).trigger('blur')
      expect((input(w).element as HTMLInputElement).value).toBe('#ff0000')
      expect(input(w).attributes('aria-invalid')).toBeUndefined()
    })

    it('blur normalises a valid draft (#abc -> #aabbcc)', async () => {
      const w = mount(ColorPicker)
      await typeHex(w, '#abc')
      await input(w).trigger('blur')
      expect((input(w).element as HTMLInputElement).value).toBe('#aabbcc')
    })

    it('emptying the input clears the colour (null) once', async () => {
      const w = mount(ColorPicker, { props: { modelValue: '#ff0000' } })
      await typeHex(w, '')
      expect(emitted(w)).toEqual([null])
      await typeHex(w, '  ')
      expect(emitted(w)).toEqual([null])
      expect(input(w).attributes('aria-invalid')).toBeUndefined()
    })

    it('showInput=false hides the field', () => {
      const w = mount(ColorPicker, { props: { showInput: false } })
      expect(input(w).exists()).toBe(false)
      expect(w.find('[data-slot=color-picker-preview]').exists()).toBe(false)
    })

    it('typing the same colour again does not re-emit', async () => {
      const w = mount(ColorPicker, { props: { modelValue: '#ff0000' } })
      await typeHex(w, '#F00')
      expect(emitted(w)).toBeUndefined()
    })
  })

  describe('swatch list handling', () => {
    it('drops invalid entries, dedupes, tolerates non-arrays', () => {
      const w = mount(ColorPicker, { props: { swatches: ['#f00', '#FF0000', 'nope', '', '#00f'] } })
      expect(swatches(w).map((s) => s.attributes('aria-label'))).toEqual(['#ff0000', '#0000ff'])
      const none = mount(ColorPicker, { props: { swatches: [] } })
      expect(none.find('[data-slot=color-picker-swatches]').exists()).toBe(false)
      expect(input(none).exists()).toBe(true)
      const weird = mount(ColorPicker, { props: { swatches: null as unknown as string[] } })
      expect(swatches(weird)).toHaveLength(0)
    })

    it('handles 10 000 swatches', () => {
      const many = Array.from({ length: 10000 }, (_, i) => '#' + i.toString(16).padStart(6, '0'))
      expect(swatches(mount(ColorPicker, { props: { swatches: many } }))).toHaveLength(10000)
    })

    it('swatch background comes from the data via style', () => {
      const w = mount(ColorPicker, { props: { swatches: ['#123456'] } })
      expect((swatches(w)[0].element as HTMLElement).style.backgroundColor).toBe('rgb(18, 52, 86)')
    })
  })

  describe('keyboard', () => {
    const pal = ['#111111', '#222222', '#333333']
    it('roving tabindex: checked swatch (or first) is tabbable', async () => {
      const w = mount(ColorPicker, { props: { swatches: pal } })
      expect(swatches(w).map((s) => s.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
      await w.setProps({ modelValue: '#333333' })
      expect(swatches(w).map((s) => s.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    })

    it('arrows move focus + selection with wrap; Home/End jump', async () => {
      const w = mount(ColorPicker, { props: { swatches: pal }, attachTo: document.body })
      const k = (i: number, key: string) => swatches(w)[i].trigger('keydown', { key })
      await k(0, 'ArrowRight')
      expect(emitted(w)).toEqual(['#222222'])
      expect(document.activeElement).toBe(swatches(w)[1].element)
      await k(1, 'ArrowDown')
      await k(2, 'ArrowRight') // wraps to first
      expect(emitted(w)).toEqual(['#222222', '#333333', '#111111'])
      await k(0, 'ArrowLeft') // wraps to last
      expect(emitted(w)?.at(-1)).toBe('#333333')
      await k(2, 'ArrowUp')
      expect(emitted(w)?.at(-1)).toBe('#222222')
      await k(1, 'End')
      expect(emitted(w)?.at(-1)).toBe('#333333')
      await k(2, 'Home')
      expect(emitted(w)?.at(-1)).toBe('#111111')
      const n = emitted(w)?.length
      await k(0, 'x')
      expect(emitted(w)).toHaveLength(n as number)
      w.unmount()
    })
  })

  describe('disabled / readonly', () => {
    it('disabled disables everything', async () => {
      const w = mount(ColorPicker, { props: { disabled: true, swatches: ['#f00'] } })
      expect(swatches(w)[0].attributes('disabled')).toBeDefined()
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=color-picker-swatches]').attributes('aria-disabled')).toBe('true')
      await swatches(w)[0].trigger('click')
      expect(emitted(w)).toBeUndefined()
    })

    it('readonly blocks changes and snaps the input back', async () => {
      const w = mount(ColorPicker, { props: { readonly: true, swatches: ['#f00'], modelValue: '#00f' } })
      expect(input(w).attributes('readonly')).toBeDefined()
      await swatches(w)[0].trigger('click')
      await swatches(w)[0].trigger('keydown', { key: 'ArrowRight' })
      await typeHex(w, '#123456')
      expect(emitted(w)).toBeUndefined()
      expect((input(w).element as HTMLInputElement).value).toBe('#0000ff')
    })
  })

  describe('customisation', () => {
    it('merges class last; forwards attrs; sizes', () => {
      const w = mount(ColorPicker, { props: { class: 'max-w-lg', size: 'lg' }, attrs: { id: 'cp', 'data-x': '1' } })
      const root = w.find('[data-slot=color-picker]')
      expect(root.classes()).toContain('max-w-lg')
      expect(root.classes()).not.toContain('max-w-xs')
      expect(root.attributes('id')).toBe('cp')
      expect(swatches(w)[0].classes()).toContain('size-10')
      expect(input(w).classes()).toContain('h-11')
      expect(colorPickerSwatchVariants({ size: 'sm' })).toContain('size-6')
      expect(colorPickerVariants()).toContain('flex-col')
      expect(input(mount(ColorPicker, { props: { size: 'sm' } })).classes()).toContain('h-8')
    })

    it('name / placeholder / labels', () => {
      const w = mount(ColorPicker, { props: { name: 'brand', placeholder: '#fff', inputLabel: 'Hex', swatchesLabel: 'Palette' } })
      expect(input(w).attributes('name')).toBeUndefined()
      expect(w.find('input[type=hidden]').attributes('name')).toBe('brand')
      expect(input(w).attributes('placeholder')).toBe('#fff')
      expect(input(w).attributes('aria-label')).toBe('Hex')
      expect(w.find('[data-slot=color-picker-swatches]').attributes('aria-label')).toBe('Palette')
    })

    it('submits the committed value through a hidden input, never the draft', async () => {
      const w = mount(ColorPicker, { props: { name: 'brand', modelValue: '#112233' } })
      const hidden = () => w.find('input[type=hidden][name=brand]').element as HTMLInputElement
      expect(hidden().value).toBe('#112233')
      await typeHex(w, '#12')
      expect(hidden().value).toBe('#112233')
      await typeHex(w, '#abc')
      expect(hidden().value).toBe('#aabbcc')
    })

    it('the hidden input exists without the text input', () => {
      const w = mount(ColorPicker, { props: { name: 'brand', modelValue: '#112233', showInput: false } })
      expect((w.find('input[type=hidden][name=brand]').element as HTMLInputElement).value).toBe('#112233')
    })

    it('labels come from the ConfigProvider', () => {
      const labels = { 'colorPicker.swatches': 'Farben', 'colorPicker.input': 'Hex-Wert', 'colorPicker.invalid': 'Ungültig' }
      const w = mount(defineComponent({ render: () => h(ConfigProvider, { labels }, () => h(ColorPicker)) }))
      expect(w.find('[data-slot=color-picker-swatches]').attributes('aria-label')).toBe('Farben')
      expect(input(w).attributes('aria-label')).toBe('Hex-Wert')
    })

    it('invalid prop sets aria-invalid; Field wiring', () => {
      expect(input(mount(ColorPicker, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      const w = mount({ components: { Field, ColorPicker }, template: '<Field label="Brand" error="Bad" required disabled><ColorPicker /></Field>' })
      const i = input(w)
      expect(i.attributes('id')).toBeTruthy()
      expect(i.attributes('aria-invalid')).toBe('true')
      expect(i.attributes('disabled')).toBeDefined()
      expect(i.attributes('required')).toBeDefined()
    })
  })

  describe('a11y regressions', () => {
    it('aria-readonly sits on the radiogroup, never on the radio buttons', () => {
      const w = mount(ColorPicker, { props: { readonly: true, swatches: ['#f00', '#00f'] } })
      expect(w.find('[data-slot=color-picker-swatches]').attributes('aria-readonly')).toBe('true')
      for (const s of swatches(w)) expect(s.attributes('aria-readonly')).toBeUndefined()
      expect(w.find('[data-slot=color-picker-swatches]').attributes('aria-readonly')).toBe('true')
      expect(mount(ColorPicker).find('[data-slot=color-picker-swatches]').attributes('aria-readonly')).toBeUndefined()
    })

    it('an unparsable draft is announced through a status message linked by aria-describedby', async () => {
      const w = mount(ColorPicker, { props: { modelValue: '#ff0000' } })
      const msg = w.find('[data-slot=color-picker-error]')
      expect(msg.attributes('role')).toBe('status')
      expect(msg.text()).toBe('')
      expect(input(w).attributes('aria-describedby')).toBeUndefined()
      await typeHex(w, '#12')
      expect(msg.text()).toContain('Not a valid hex colour')
      expect(input(w).attributes('aria-invalid')).toBe('true')
      expect(input(w).attributes('aria-describedby')).toBe(msg.attributes('id'))
      await input(w).trigger('blur')
      expect(msg.text()).toBe('')
      expect(input(w).attributes('aria-describedby')).toBeUndefined()
    })

    it('has no hover scale, uses forced-colors outlines and keeps colours in forced-colors mode', () => {
      const cls = colorPickerSwatchVariants()
      expect(cls).not.toContain('hover:scale')
      expect(cls).toContain('forced-color-adjust-none')
      expect(cls).toContain('forced-colors:aria-checked:outline-2')
      expect(cls).not.toMatch(/-\[/)
    })

    it('swatches and input reach 44px on coarse pointers; input is 16px on mobile', () => {
      const w = mount(ColorPicker, { props: { size: 'sm' } })
      expect(swatches(w)[0].classes()).toContain('pointer-coarse:min-h-11')
      expect(swatches(w)[0].classes()).toContain('pointer-coarse:min-w-11')
      expect(input(w).classes()).toContain('pointer-coarse:min-h-11')
      expect(input(w).classes()).toContain('text-md')
      expect(input(w).classes()).toContain('md:text-sm')
    })

    it('hex input hints: no autocapitalise or autocorrect', () => {
      const i = input(mount(ColorPicker))
      expect(i.attributes('autocapitalize')).toBe('off')
      expect(i.attributes('autocorrect')).toBe('off')
      expect(i.attributes('autocomplete')).toBe('off')
    })

    it('the own aria-label is dropped when a Field label names the input (label in name)', async () => {
      const w = mount({ components: { Field, ColorPicker }, template: '<Field label="Brand colour"><ColorPicker /></Field>' }, { attachTo: document.body })
      await w.vm.$nextTick()
      expect(input(w).attributes('aria-label')).toBeUndefined()
      expect(document.querySelector('label')!.getAttribute('for')).toBe(input(w).attributes('id'))
      w.unmount()
    })

    it('arrow keys follow the writing direction in RTL', async () => {
      const w = mount(ColorPicker, { props: { swatches: ['#111111', '#222222', '#333333'] }, attachTo: document.body })
      w.element.setAttribute('dir', 'rtl')
      await swatches(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(emitted(w)).toEqual(['#222222'])
      await swatches(w)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(emitted(w)).toEqual(['#222222', '#111111'])
      w.unmount()
    })
  })
})
