import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Input from './Input.vue'

describe('Input a11y and mobile', () => {
  it.each(['email', 'url', 'tel'])('type=%s turns off autocorrect, autocapitalise and spellcheck', (type) => {
    const a = mount(Input, { props: { type } }).find('input').attributes()
    expect(a.autocapitalize).toBe('none')
    expect(a.autocorrect).toBe('off')
    expect(a.spellcheck).toBe('false')
  })

  it('leaves prose inputs on the browser defaults', () => {
    const a = mount(Input).find('input').attributes()
    expect(a.autocapitalize).toBeUndefined()
    expect(a.autocorrect).toBeUndefined()
    expect(a.spellcheck).toBeUndefined()
  })

  it('autocomplete, inputmode and enterkeyhint fall through to the input', () => {
    const a = mount(Input, { attrs: { autocomplete: 'email', inputmode: 'email', enterkeyhint: 'next', name: 'email' } }).find('input').attributes()
    expect(a).toMatchObject({ autocomplete: 'email', inputmode: 'email', enterkeyhint: 'next', name: 'email' })
  })

  it.each(['sm', 'md', 'lg'] as const)('size=%s uses 16px text below md (no iOS focus zoom)', (size) => {
    const cls = mount(Input, { props: { size } }).classes()
    expect(cls).toContain('text-md')
  })

  it('md and sm give touch pointers a 44px target; all sizes are at least 24px tall', () => {
    expect(mount(Input).classes()).toEqual(expect.arrayContaining(['h-9', 'pointer-coarse:min-h-11', 'md:text-base']))
    expect(mount(Input, { props: { size: 'sm' } }).classes()).toEqual(expect.arrayContaining(['h-8', 'pointer-coarse:min-h-11', 'md:text-sm']))
    expect(mount(Input, { props: { size: 'lg' } }).classes()).toContain('h-11')
  })

  it('does not overflow: full width with min-w-0', () => {
    expect(mount(Input).classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-0']))
  })

  it('has a forced-colors fallback for the invalid state (dashed border)', () => {
    expect(mount(Input).classes()).toContain('forced-colors:aria-invalid:border-dashed')
  })

  it('required: aria-invalid="false" while valid, "true" when invalid; readonly stays focusable (no disabled)', () => {
    expect(mount(Input, { props: { required: true } }).attributes('aria-invalid')).toBe('false')
    expect(mount(Input, { props: { required: true, invalid: true } }).attributes('aria-invalid')).toBe('true')
    const ro = mount(Input, { props: { readonly: true } })
    expect(ro.attributes('readonly')).toBeDefined()
    expect(ro.attributes('disabled')).toBeUndefined()
  })
})
