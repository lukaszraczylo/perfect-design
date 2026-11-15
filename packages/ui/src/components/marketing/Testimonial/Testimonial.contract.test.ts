import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import Testimonial from './Testimonial.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('Testimonial contract', () => {
  it('throws without a quote', async () => {
    await t.mount(() => el(Testimonial, { author: 'Person' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('Testimonial: requires a non-empty `quote`')
  })
  it('throws without an author', async () => {
    await t.mount(() => el(Testimonial, { quote: 'Works well.' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('Testimonial: requires a non-empty `author`')
    t.reset()
    await t.mount(() => el(Testimonial, { quote: 'Works well.', author: '  ' }))
    expect(t.errors).toHaveLength(1)
  })
  it('accepts the props, or the default and author slots', async () => {
    await t.mount(() => el(Testimonial, { quote: 'Works well.', author: 'Person', role: 'Maintainer', rating: 4.5 }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(Testimonial, null, { default: () => 'Works well.', author: () => h('p', 'Person, Maintainer') }))
    expect(t.errors).toEqual([])
  })
  it('passes in every variant', async () => {
    for (const variant of ['card', 'quote', 'inline', 'with-rating', 'avatar-left', 'featured']) {
      await t.mount(() => el(Testimonial, { variant, quote: 'Works well.', author: 'Person' }))
      expect(t.errors).toEqual([])
      t.reset()
    }
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(Testimonial))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Testimonial: requires a non-empty `quote`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(Testimonial))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
