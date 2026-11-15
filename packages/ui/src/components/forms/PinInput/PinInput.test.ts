import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import PinInput from './PinInput.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
async function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  wrapper = mount(PinInput, { props, attrs, attachTo: document.body })
  await flushPromises()
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const cellsOf = (w: VueWrapper) => w.findAll('input[data-slot=pin-input-cell]')
const values = (w: VueWrapper) => cellsOf(w).map((c) => (c.element as HTMLInputElement).value)
const lastModel = (w: VueWrapper) => w.emitted('update:modelValue')?.at(-1)?.[0]

async function typeChar(w: VueWrapper, index: number, ch: string) {
  const el = cellsOf(w)[index]!.element as HTMLInputElement
  el.value = ch
  el.dispatchEvent(new InputEvent('input', { data: ch, bubbles: true }))
  await flushPromises()
}

async function paste(w: VueWrapper, index: number, text: string) {
  const ev = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
  ev.clipboardData = { getData: () => text }
  cellsOf(w)[index]!.element.dispatchEvent(ev)
  await flushPromises()
}

async function key(w: VueWrapper, index: number, k: string) {
  await cellsOf(w)[index]!.trigger('keydown', { key: k })
  await flushPromises()
}

describe('PinInput', () => {
  describe('good path', () => {
    it('renders 6 cells by default with data-slots and group role', async () => {
      const w = await make()
      expect(w.attributes('data-slot')).toBe('pin-input')
      expect(w.attributes('role')).toBe('group')
      expect(cellsOf(w)).toHaveLength(6)
    })

    it('respects length', async () => {
      expect(cellsOf(await make({ length: 4 }))).toHaveLength(4)
    })

    it('clamps nonsense length to at least 1', async () => {
      expect(cellsOf(await make({ length: 0 }))).toHaveLength(1)
      expect(cellsOf(await make({ length: -3 }))).toHaveLength(1)
      expect(cellsOf(await make({ length: NaN }))).toHaveLength(1)
    })

    it('shows the string modelValue across cells', async () => {
      const w = await make({ modelValue: '123', length: 4 })
      expect(values(w)).toEqual(['1', '2', '3', ''])
    })

    it('emits a joined string while typing', async () => {
      const w = await make({ length: 4 })
      await typeChar(w, 0, 'a')
      expect(lastModel(w)).toBe('a')
      await typeChar(w, 1, 'b')
      expect(lastModel(w)).toBe('ab')
      expect(w.emitted('complete')).toBeUndefined()
    })

    it('emits complete with the joined string when every cell is filled', async () => {
      const w = await make({ length: 3 })
      await typeChar(w, 0, '1')
      await typeChar(w, 1, '2')
      await typeChar(w, 2, '3')
      expect(w.emitted('complete')).toHaveLength(1)
      expect(w.emitted('complete')![0]).toEqual(['123'])
      expect(lastModel(w)).toBe('123')
    })

    it('number type: digits only, complete includes zeros', async () => {
      const w = await make({ length: 3, type: 'number' })
      await typeChar(w, 0, '0')
      await typeChar(w, 1, '0')
      await typeChar(w, 2, '7')
      expect(w.emitted('complete')![0]).toEqual(['007'])
    })

    it('number type: cells use numeric inputmode and pattern', async () => {
      const c = cellsOf(await make({ type: 'number' }))[0]!
      expect(c.attributes('inputmode')).toBe('numeric')
      expect(c.attributes('pattern')).toBe('[0-9]*')
    })

    it('text type uses text inputmode', async () => {
      expect(cellsOf(await make())[0]!.attributes('inputmode')).toBe('text')
    })

    it('paste fills all cells and emits complete', async () => {
      const w = await make({ length: 4 })
      await paste(w, 0, 'AB12')
      expect(values(w)).toEqual(['A', 'B', '1', '2'])
      expect(lastModel(w)).toBe('AB12')
      expect(w.emitted('complete')![0]).toEqual(['AB12'])
    })

    it('paste in number mode strips non-digits', async () => {
      const w = await make({ length: 6, type: 'number' })
      await paste(w, 0, '12-34 56')
      expect(lastModel(w)).toBe('123456')
      expect(w.emitted('complete')![0]).toEqual(['123456'])
    })

    it('paste longer than length truncates', async () => {
      const w = await make({ length: 4 })
      await paste(w, 0, 'ABCDEFGH')
      expect(lastModel(w)).toBe('ABCD')
    })

    it('shorter paste leaves later cells empty and does not complete', async () => {
      const w = await make({ length: 6 })
      await paste(w, 0, 'AB')
      expect(lastModel(w)).toBe('AB')
      expect(w.emitted('complete')).toBeUndefined()
    })

    it('Backspace clears the current cell', async () => {
      const w = await make({ modelValue: '12', length: 3 })
      await key(w, 1, 'Backspace')
      expect(lastModel(w)).toBe('1')
    })

    it('Backspace on an empty cell clears the previous one', async () => {
      const w = await make({ modelValue: '12', length: 3 })
      await key(w, 2, 'Backspace')
      expect(lastModel(w)).toBe('1')
    })

    it('Delete clears the current cell', async () => {
      const w = await make({ modelValue: '12', length: 3 })
      await key(w, 0, 'Delete')
      expect(lastModel(w)).toBe('2')
      expect(values(w)).toEqual(['', '2', ''])
    })

    it('arrow keys move focus between cells', async () => {
      const w = await make({ modelValue: '123', length: 3 })
      ;(cellsOf(w)[0]!.element as HTMLInputElement).focus()
      await key(w, 0, 'ArrowRight')
      expect(document.activeElement).toBe(cellsOf(w)[1]!.element)
      await key(w, 1, 'ArrowLeft')
      expect(document.activeElement).toBe(cellsOf(w)[0]!.element)
    })

    it('syncs when modelValue changes externally and clears with empty string', async () => {
      const w = await make({ modelValue: '12', length: 4 })
      await w.setProps({ modelValue: '9876' })
      expect(values(w)).toEqual(['9', '8', '7', '6'])
      await w.setProps({ modelValue: '' })
      expect(values(w)).toEqual(['', '', '', ''])
      await w.setProps({ modelValue: null })
      expect(values(w)).toEqual(['', '', '', ''])
    })

    it('works with a parent v-model', async () => {
      const code = ref('')
      const Host = defineComponent({
        setup: () => () =>
          h(PinInput, { modelValue: code.value, length: 3, 'onUpdate:modelValue': (v: string) => (code.value = v) }),
      })
      wrapper = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
      await flushPromises()
      await typeChar(wrapper, 0, 'x')
      await typeChar(wrapper, 1, 'y')
      expect(code.value).toBe('xy')
    })

    it('works uncontrolled', async () => {
      const w = await make({ length: 3 })
      await typeChar(w, 0, 'q')
      expect(values(w)[0]).toBe('q')
    })

    it('does not re-sync from the prop when the parent echoes our own value', async () => {
      const w = await make({ length: 3 })
      await typeChar(w, 0, 'a')
      await w.setProps({ modelValue: 'a' })
      expect(values(w)).toEqual(['a', '', ''])
    })
  })

  describe('modes and attributes', () => {
    it('otp sets autocomplete=one-time-code on the first cell only (updated: was every cell); other cells are off', async () => {
      const w = await make({ otp: true })
      expect(cellsOf(w).map((c) => c.attributes('autocomplete'))).toEqual(['one-time-code', 'off', 'off', 'off', 'off', 'off'])
    })

    it('without otp autocomplete is a valid "off" token (reka used the invalid value "false")', async () => {
      expect(cellsOf(await make())[0]!.attributes('autocomplete')).toBe('off')
    })

    it('mask renders password cells', async () => {
      expect(cellsOf(await make({ mask: true })).every((c) => c.attributes('type') === 'password')).toBe(true)
      expect(cellsOf(await make())[0]!.attributes('type')).toBe('text')
    })

    it('placeholder is forwarded to cells', async () => {
      expect(cellsOf(await make({ placeholder: '○' }))[0]!.attributes('placeholder')).toBe('○')
    })

    it('every cell has a distinct accessible name', async () => {
      const w = await make({ length: 3 })
      expect(cellsOf(w).map((c) => c.attributes('aria-label'))).toEqual(['Character 1 of 3', 'Character 2 of 3', 'Character 3 of 3'])
    })

    it('number type labels cells as Digit; cellLabel overrides', async () => {
      expect(cellsOf(await make({ type: 'number', length: 2 }))[0]!.attributes('aria-label')).toBe('Digit 1 of 2')
      expect(cellsOf(await make({ cellLabel: 'Code', length: 2 }))[1]!.attributes('aria-label')).toBe('Code 2 of 2')
    })

    it('name renders a hidden input with the joined value', async () => {
      const w = await make({ modelValue: '42', length: 3, name: 'otp' })
      const hidden = w.find('input[name=otp]')
      expect((hidden.element as HTMLInputElement).value).toBe('42')
    })

    it('invalid sets aria-invalid on every cell and data-invalid on root', async () => {
      const w = await make({ invalid: true, length: 3 })
      expect(cellsOf(w).every((c) => c.attributes('aria-invalid') === 'true')).toBe(true)
      expect(w.attributes('data-invalid')).toBeDefined()
    })

    it('valid cells have no aria-invalid', async () => {
      const w = await make()
      expect(cellsOf(w)[0]!.attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last on the root', async () => {
      const w = await make({ class: 'gap-4 custom' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-2')
    })

    it('cellClass overrides cell defaults', async () => {
      const w = await make({ cellClass: 'size-14 custom-cell' })
      const c = cellsOf(w)[0]!
      expect(c.classes()).toContain('custom-cell')
      expect(c.classes()).toContain('size-14')
      expect(c.classes()).not.toContain('w-10')
    })

    it('cells use the shared field surface', async () => {
      expect(cellsOf(await make())[0]!.classes()).toContain('border-input')
    })

    it('passes attrs to the root', async () => {
      const w = await make({}, { 'data-testid': 'otp', 'aria-label': 'Verification code' })
      expect(w.attributes('data-testid')).toBe('otp')
      expect(w.attributes('aria-label')).toBe('Verification code')
    })
  })

  describe('bad path', () => {
    it('disabled disables all cells and the root', async () => {
      const w = await make({ disabled: true, length: 3 })
      expect(cellsOf(w).every((c) => c.attributes('disabled') !== undefined)).toBe(true)
      expect(w.attributes('data-disabled')).toBeDefined()
    })

    it('number type rejects non-digit typing', async () => {
      const w = await make({ type: 'number', length: 3 })
      await typeChar(w, 0, 'a')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(values(w)[0]).toBe('')
    })

    it('number type rejects pasted letters entirely', async () => {
      const w = await make({ type: 'number', length: 4 })
      await paste(w, 0, 'abcd')
      expect(lastModel(w)).toBe('')
      expect(w.emitted('complete')).toBeUndefined()
    })

    it('number modelValue drops non-digits and overflow', async () => {
      const w = await make({ type: 'number', length: 3, modelValue: '1a2b3c4' })
      expect(values(w)).toEqual(['1', '2', '3'])
    })

    it('text modelValue longer than length is truncated', async () => {
      const w = await make({ length: 3, modelValue: 'abcdef' })
      expect(values(w)).toEqual(['a', 'b', 'c'])
    })

    it('empty paste is a no-op', async () => {
      const w = await make({ length: 3 })
      await paste(w, 0, '')
      expect(w.emitted('complete')).toBeUndefined()
    })

    it('tolerates a non-array update from reka', async () => {
      const w = await make({ length: 3, modelValue: '12' })
      w.findComponent({ name: 'PinInputRoot' }).vm.$emit('update:modelValue', undefined)
      await flushPromises()
      expect(lastModel(w)).toBe('')
    })
  })

  describe('edge cases', () => {
    it('handles unicode and emoji code points as single cells', async () => {
      const w = await make({ length: 3, modelValue: 'ż🚀ñ' })
      expect(values(w)).toEqual(['ż', '🚀', 'ñ'])
    })

    it('a gap in OTP-less mode keeps its position', async () => {
      const w = await make({ length: 3 })
      await typeChar(w, 0, 'a')
      await typeChar(w, 2, 'c')
      expect(values(w)).toEqual(['a', '', 'c'])
      expect(w.emitted('complete')).toBeUndefined()
      await typeChar(w, 1, 'b')
      expect(w.emitted('complete')![0]).toEqual(['abc'])
    })

    it('length 1 completes on the first character', async () => {
      const w = await make({ length: 1 })
      await typeChar(w, 0, 'z')
      expect(w.emitted('complete')![0]).toEqual(['z'])
    })

    it('rapid typing across all cells yields the full code once', async () => {
      const w = await make({ length: 6, type: 'number' })
      for (const [i, d] of ['1', '2', '3', '4', '5', '6'].entries()) await typeChar(w, i, d)
      expect(lastModel(w)).toBe('123456')
      expect(w.emitted('complete')).toHaveLength(1)
    })

    it('editing a completed code and completing again emits complete again', async () => {
      const w = await make({ length: 2 })
      await typeChar(w, 0, 'a')
      await typeChar(w, 1, 'b')
      await key(w, 1, 'Delete')
      await typeChar(w, 1, 'c')
      expect(w.emitted('complete')).toEqual([['ab'], ['ac']])
    })

    it('unmounts cleanly', async () => {
      const w = await make()
      expect(() => w.unmount()).not.toThrow()
      wrapper = undefined
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid and disabled from Field', async () => {
      wrapper = mount(
        defineComponent({
          components: { Field, PinInput },
          template: `<Field id="otp" hint="Hint" error="Wrong code" disabled><PinInput :length="3" /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await flushPromises()
      expect(wrapper.find('input#otp').exists()).toBe(true)
      const root = wrapper.find('[data-slot=pin-input]')
      expect(root.attributes('aria-describedby')).toContain('otp-hint')
      const cell = wrapper.find('input[data-slot=pin-input-cell]')
      expect(cell.attributes('aria-invalid')).toBe('true')
      expect(cell.attributes('disabled')).toBeDefined()
    })
  })

  describe('a11y regressions', () => {
    it('numeric mode keeps inputmode=numeric, pattern and the "Digit n of N" names on every cell', async () => {
      const w = await make({ type: 'number', length: 4, otp: true })
      for (const [i, c] of cellsOf(w).entries()) {
        expect(c.attributes('inputmode')).toBe('numeric')
        expect(c.attributes('pattern')).toBe('[0-9]*')
        expect(c.attributes('aria-label')).toBe(`Digit ${i + 1} of 4`)
      }
      expect(cellsOf(w)[0]!.attributes('autocomplete')).toBe('one-time-code')
    })

    it('paste into the first one-time-code cell fills every cell', async () => {
      const w = await make({ type: 'number', length: 4, otp: true })
      await paste(w, 0, '1 2-3 4')
      expect(values(w)).toEqual(['1', '2', '3', '4'])
      expect(w.emitted('complete')![0]).toEqual(['1234'])
    })

    it('the group is named by the Field label through aria-labelledby', async () => {
      wrapper = mount(
        defineComponent({ components: { Field, PinInput }, template: '<Field id="otp2" label="Verification code"><PinInput :length="3" /></Field>' }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await flushPromises()
      const root = wrapper.find('[data-slot=pin-input]')
      const id = root.attributes('aria-labelledby')!
      expect(document.getElementById(id)!.textContent).toContain('Verification code')
    })

    it('an own aria-label on the group still works and no aria-labelledby is set outside a Field', async () => {
      const w = await make({}, { 'aria-label': 'Code' })
      expect(w.attributes('aria-label')).toBe('Code')
      expect(w.attributes('aria-labelledby')).toBeUndefined()
    })

    it('cells are 40px, 44px on coarse pointers, shrink instead of overflowing and use 18px text', async () => {
      const w = await make()
      const c = cellsOf(w)[0]!
      expect(c.classes()).toEqual(expect.arrayContaining(['h-10', 'w-10', 'min-w-0', 'pointer-coarse:h-11', 'pointer-coarse:w-11', 'text-lg']))
      expect(w.classes()).toContain('max-w-full')
    })
  })
})
