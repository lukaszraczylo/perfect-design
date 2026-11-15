import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordInput from './PasswordInput.vue'

const toggle = (w: ReturnType<typeof mount>) => w.find('[data-slot="password-input-toggle"]')

describe('PasswordInput a11y', () => {
  it('toggle is type=button with a constant name, aria-pressed and a described-by warning', async () => {
    const w = mount(PasswordInput, { attrs: { id: 'pw' } })
    const t = toggle(w)
    expect(t.attributes('type')).toBe('button')
    expect(t.attributes('aria-label')).toBe('Show password')
    expect(t.attributes('aria-pressed')).toBe('false')
    expect(t.attributes('aria-controls')).toBe('pw')
    const warning = w.find(`#${t.attributes('aria-describedby')}`)
    expect(warning.text()).toBe('Shows the password as plain text on screen.')
    expect(warning.classes()).toContain('sr-only')
    await t.trigger('click')
    expect(t.attributes('aria-pressed')).toBe('true')
    expect(t.attributes('aria-label')).toBe('Show password')
  })

  it('revealWarning is localisable', () => {
    const w = mount(PasswordInput, { props: { revealWarning: 'Pokazuje hasło' } })
    expect(w.find('[data-slot="password-input-warning"]').text()).toBe('Pokazuje hasło')
  })

  it('input turns off autocapitalize, autocorrect and spellcheck, and keeps autocomplete', () => {
    const a = mount(PasswordInput, { props: { autocomplete: 'new-password' } }).find('input').attributes()
    expect(a).toMatchObject({ autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', autocomplete: 'new-password' })
  })

  it('uses logical offsets and a larger toggle on touch pointers; text is 16px below md', () => {
    const w = mount(PasswordInput)
    expect(toggle(w).classes()).toEqual(expect.arrayContaining(['end-2', 'size-6', 'pointer-coarse:size-9']))
    expect(toggle(w).classes()).not.toContain('right-2')
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['pe-10', 'pointer-coarse:pe-12', 'text-md', 'pointer-coarse:min-h-11']))
    expect(w.find('input').classes()).not.toContain('pr-10')
  })

  it('required: aria-invalid false while valid', () => {
    expect(mount(PasswordInput, { props: { required: true } }).find('input').attributes('aria-invalid')).toBe('false')
  })
})
