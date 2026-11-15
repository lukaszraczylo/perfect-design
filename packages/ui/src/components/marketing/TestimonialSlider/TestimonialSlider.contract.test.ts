import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import Testimonial from '../Testimonial/Testimonial.vue'
import TestimonialSlider from './TestimonialSlider.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const good = { quote: 'Works well.', author: 'Person One' }
describe('TestimonialSlider contract', () => {
  it('throws when the label is an empty string; the default label passes', async () => {
    await t.mount(() => el(TestimonialSlider, { items: [good], label: '' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('TestimonialSlider: requires a non-empty `label`')
    t.reset()
    await t.mount(() => el(TestimonialSlider, { items: [good] }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(TestimonialSlider, { items: [good], label: 'Customer quotes' }))
    expect(t.errors).toEqual([])
  })
  it('throws when the control labels are empty, unless controls are off', async () => {
    await t.mount(() => el(TestimonialSlider, { items: [good], prevLabel: '' }))
    expect(t.text()).toContain('requires a non-empty `prevLabel`')
    t.reset()
    await t.mount(() => el(TestimonialSlider, { items: [good], nextLabel: '' }))
    expect(t.text()).toContain('requires a non-empty `nextLabel`')
    t.reset()
    await t.mount(() => el(TestimonialSlider, { items: [good], controls: false, prevLabel: '', nextLabel: '' }))
    expect(t.errors).toEqual([])
  })
  it('throws once for the first item without a quote or author, naming the index', async () => {
    await t.mount(() => el(TestimonialSlider, { items: [good, { author: 'No quote' }, { quote: 'x' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('TestimonialSlider: items[1] requires a non-empty `quote`')
    t.reset()
    await t.mount(() => el(TestimonialSlider, { items: [good, { quote: 'Unattributed' }] }))
    expect(t.errors[0].message).toContain('items[1] requires a non-empty `author`')
  })
  it('slot slides check themselves; complete items and an empty list pass', async () => {
    await t.mount(() => el(TestimonialSlider, { perView: 2, items: [good, good] }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(TestimonialSlider))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(TestimonialSlider, null, { default: () => [el(Testimonial, good), el(Testimonial, { author: 'No quote' })] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('Testimonial: requires a non-empty `quote`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(TestimonialSlider, { label: '' }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('TestimonialSlider: requires a non-empty `label`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(TestimonialSlider, { label: '' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
