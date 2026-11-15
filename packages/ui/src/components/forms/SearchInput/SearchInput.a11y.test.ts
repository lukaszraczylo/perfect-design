import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchInput from './SearchInput.vue'

describe('SearchInput a11y', () => {
  it('type=search with correction, capitalisation and spellcheck off', () => {
    const a = mount(SearchInput).find('input').attributes()
    expect(a).toMatchObject({ type: 'search', enterkeyhint: 'search', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false' })
  })

  it('role=search wrapper is named, and only present with `landmark`', () => {
    expect(mount(SearchInput).attributes('role')).toBeUndefined()
    expect(mount(SearchInput).attributes('aria-label')).toBeUndefined()
    const w = mount(SearchInput, { props: { landmark: true } })
    expect(w.attributes('role')).toBe('search')
    expect(w.attributes('aria-label')).toBe('Search')
    expect(mount(SearchInput, { props: { landmark: true, landmarkLabel: 'Site' } }).attributes('aria-label')).toBe('Site')
  })

  it('clear button: type=button, labelled, at least 24px and 36px on touch, logical offset', () => {
    const w = mount(SearchInput, { props: { modelValue: 'abc' } })
    const clear = w.find('[data-slot="search-input-clear"]')
    expect(clear.attributes('type')).toBe('button')
    expect(clear.attributes('aria-label')).toBe('Clear search')
    expect(clear.classes()).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:size-9', 'end-2']))
  })

  it('uses logical padding and icon offset (RTL), 16px text below md and a 44px touch height', () => {
    const w = mount(SearchInput)
    expect(w.find('input').classes()).toEqual(expect.arrayContaining(['ps-9', 'pe-9', 'text-md', 'pointer-coarse:min-h-11']))
    expect(w.find('input').classes()).not.toContain('pl-9')
    expect(w.find('[data-slot="search-input-icon"]').classes()).toContain('start-3')
    expect(w.find('[data-slot="search-input-icon"]').attributes('aria-hidden')).toBe('true')
  })
})
