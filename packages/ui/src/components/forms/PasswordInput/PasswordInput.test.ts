import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import PasswordInput from './PasswordInput.vue'
import Field from '../Field/Field.vue'

const input = (w: ReturnType<typeof mount>) => w.find('input')
const toggle = (w: ReturnType<typeof mount>) => w.find('[data-slot=password-input-toggle]')

describe('PasswordInput', () => {
  describe('good path', () => {
    it('renders a password input and toggle with data-slots', () => {
      const w = mount(PasswordInput)
      expect(w.attributes('data-slot')).toBe('password-input')
      expect(input(w).attributes('data-slot')).toBe('password-input-field')
      expect(input(w).attributes('type')).toBe('password')
      expect(toggle(w).attributes('type')).toBe('button')
    })

    it('autocomplete defaults to current-password and is overridable', () => {
      expect(input(mount(PasswordInput)).attributes('autocomplete')).toBe('current-password')
      expect(input(mount(PasswordInput, { props: { autocomplete: 'new-password' } })).attributes('autocomplete')).toBe('new-password')
    })

    it('reflects modelValue and emits update:modelValue', async () => {
      const w = mount(PasswordInput, { props: { modelValue: 'secret' } })
      expect(input(w).element.value).toBe('secret')
      await input(w).setValue('hunter2')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['hunter2'])
      await w.setProps({ modelValue: 'other' })
      expect(input(w).element.value).toBe('other')
      await w.setProps({ modelValue: null })
      expect(input(w).element.value).toBe('')
    })

    it('works uncontrolled', async () => {
      const w = mount(PasswordInput)
      await input(w).setValue('abc')
      expect(input(w).element.value).toBe('abc')
    })

    it('toggle switches type, aria-pressed and aria-label, and emits update:visible', async () => {
      const w = mount(PasswordInput)
      expect(toggle(w).attributes('aria-pressed')).toBe('false')
      expect(toggle(w).attributes('aria-label')).toBe('Show password')
      await toggle(w).trigger('click')
      expect(input(w).attributes('type')).toBe('text')
      expect(toggle(w).attributes('aria-pressed')).toBe('true')
      // the name stays constant; aria-pressed carries the state
      expect(toggle(w).attributes('aria-label')).toBe('Show password')
      expect(w.emitted('update:visible')?.[0]).toEqual([true])
      await toggle(w).trigger('click')
      expect(input(w).attributes('type')).toBe('password')
      expect(w.emitted('update:visible')?.[1]).toEqual([false])
    })

    it('toggle controls the input via aria-controls', () => {
      const w = mount(PasswordInput)
      expect(input(w).attributes('id')).toBeTruthy()
      expect(toggle(w).attributes('aria-controls')).toBe(input(w).attributes('id'))
    })

    it('label is overridable and does not change with the state', async () => {
      const w = mount(PasswordInput, { props: { showLabel: 'Pokaż', hideLabel: 'Ukryj' } })
      expect(toggle(w).attributes('aria-label')).toBe('Pokaż')
      await toggle(w).trigger('click')
      expect(toggle(w).attributes('aria-label')).toBe('Pokaż')
      expect(toggle(w).attributes('aria-pressed')).toBe('true')
    })

    it('visible prop controls state (controlled) and follows changes', async () => {
      const w = mount(PasswordInput, { props: { visible: true } })
      expect(input(w).attributes('type')).toBe('text')
      await w.setProps({ visible: false })
      expect(input(w).attributes('type')).toBe('password')
      await w.setProps({ visible: undefined })
      expect(input(w).attributes('type')).toBe('password')
    })

    it('keeps typed value when toggling visibility', async () => {
      const w = mount(PasswordInput)
      await input(w).setValue('keep me')
      await toggle(w).trigger('click')
      expect(input(w).element.value).toBe('keep me')
    })
  })

  describe('bad path', () => {
    it('disabled disables input and toggle; toggle click does nothing', async () => {
      const w = mount(PasswordInput, { props: { disabled: true } })
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(toggle(w).attributes('disabled')).toBeDefined()
      await toggle(w).trigger('click')
      expect(input(w).attributes('type')).toBe('password')
      expect(w.emitted('update:visible')).toBeUndefined()
    })

    it('toggle handler is a no-op if triggered while disabled (guard)', async () => {
      const w = mount(PasswordInput, { props: { disabled: true } })
      toggle(w).element.dispatchEvent(new MouseEvent('click'))
      await w.vm.$nextTick()
      expect(w.emitted('update:visible')).toBeUndefined()
    })

    it('readonly keeps toggle usable', async () => {
      const w = mount(PasswordInput, { props: { readonly: true, modelValue: 'x' } })
      expect(input(w).attributes('readonly')).toBeDefined()
      await toggle(w).trigger('click')
      expect(input(w).attributes('type')).toBe('text')
    })

    it('invalid sets aria-invalid', () => {
      expect(input(mount(PasswordInput, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(input(mount(PasswordInput)).attributes('aria-invalid')).toBeUndefined()
    })

    it('required is forwarded', () => {
      expect(input(mount(PasswordInput, { props: { required: true } })).attributes('required')).toBeDefined()
    })
  })

  describe('field integration', () => {
    it('inside Field takes id, describedby, invalid and disabled', () => {
      const w = mount(Field, {
        props: { label: 'Password', hint: 'min 8', error: 'too short', disabled: true, id: 'pw' },
        slots: { default: () => h(PasswordInput) },
      })
      const el = w.find('input')
      expect(el.attributes('id')).toBe('pw')
      expect(el.attributes('aria-describedby')).toBe('pw-hint pw-error')
      expect(el.attributes('aria-invalid')).toBe('true')
      expect(el.attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=password-input-toggle]').attributes('aria-controls')).toBe('pw')
    })

    it('explicit id attr wins and aria-controls follows it', () => {
      const w = mount(PasswordInput, { attrs: { id: 'mine' } })
      expect(input(w).attributes('id')).toBe('mine')
      expect(toggle(w).attributes('aria-controls')).toBe('mine')
    })
  })

  describe('customisation', () => {
    it('class merges on wrapper last, inputClass on input', () => {
      const w = mount(PasswordInput, { props: { class: 'w-64 custom', inputClass: 'h-20' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('w-full')
      expect(input(w).classes()).toContain('h-20')
      expect(input(w).classes()).not.toContain('h-9')
    })

    it('sizes map to heights; unknown falls back to md', () => {
      expect(input(mount(PasswordInput, { props: { size: 'sm' } })).classes()).toContain('h-8')
      expect(input(mount(PasswordInput, { props: { size: 'lg' } })).classes()).toContain('h-11')
      // @ts-expect-error deliberately invalid
      expect(input(mount(PasswordInput, { props: { size: 'x' } })).classes()).toContain('h-9')
    })

    it('attrs land on the input', () => {
      const w = mount(PasswordInput, { attrs: { name: 'pw', placeholder: '••••', 'aria-label': 'Password' } })
      expect(input(w).attributes('name')).toBe('pw')
      expect(input(w).attributes('placeholder')).toBe('••••')
      expect(input(w).attributes('aria-label')).toBe('Password')
      expect(w.attributes('name')).toBeUndefined()
    })

    it('disables autocapitalize and spellcheck by default', () => {
      const w = mount(PasswordInput)
      expect(input(w).attributes('autocapitalize')).toBe('none')
      expect(input(w).attributes('spellcheck')).toBe('false')
    })
  })

  describe('edge cases', () => {
    it('rapid toggles end in the expected state', async () => {
      const w = mount(PasswordInput)
      for (let i = 0; i < 9; i++) await toggle(w).trigger('click')
      expect(input(w).attributes('type')).toBe('text')
      expect(w.emitted('update:visible')).toHaveLength(9)
    })

    it('handles unicode and long passwords', async () => {
      const w = mount(PasswordInput)
      const pw = 'пароль🔑密码'.repeat(300)
      await input(w).setValue(pw)
      expect(w.emitted('update:modelValue')?.[0]).toEqual([pw])
    })

    it('empty string emits empty string', async () => {
      const w = mount(PasswordInput, { props: { modelValue: 'a' } })
      await input(w).setValue('')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
    })
  })
})
