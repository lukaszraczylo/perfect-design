import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import Testimonial from '../Testimonial/Testimonial.vue'
import TestimonialGrid from './TestimonialGrid.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const good = { quote: 'Works well.', author: 'Person One' }
describe('TestimonialGrid contract', () => {
  it('throws once for the first item without a quote, naming the index', async () => {
    await t.mount(() => el(TestimonialGrid, { items: [good, { author: 'No quote' }, { quote: '' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('TestimonialGrid: items[1] requires a non-empty `quote`')
  })
  it('throws for an item without an author', async () => {
    await t.mount(() => el(TestimonialGrid, { items: [good, { quote: 'Unattributed' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('TestimonialGrid: items[1] requires a non-empty `author`')
  })
  it('passes for complete items and an empty list; slot testimonials check themselves', async () => {
    await t.mount(() => el(TestimonialGrid, { items: [good, { ...good, rating: 5 }], layout: 'masonry' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(TestimonialGrid))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(TestimonialGrid, null, { default: () => [el(Testimonial, good), el(Testimonial, { quote: 'No author' })] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('Testimonial: requires a non-empty `author`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(TestimonialGrid, { items: [{ author: 'x' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TestimonialGrid: items[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(TestimonialGrid, { items: [{ author: 'x' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
