import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import FeatureCard from '../FeatureCard/FeatureCard.vue'
import FeatureGrid from './FeatureGrid.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const items = [{ title: 'One', description: 'First' }, { title: 'Two', image: '/two.png', imageAlt: 'Screenshot of two' }]
describe('FeatureGrid contract', () => {
  it('reports the first item without a title once, by index', async () => {
    await t.mount(() => el(FeatureGrid, { items: [{ title: 'One' }, { title: '' }, { description: 'no title' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('FeatureGrid: items[1] requires a non-empty `title`')
  })
  it('alternating layout: an image needs an imageAlt string (empty is decorative)', async () => {
    await t.mount(() => el(FeatureGrid, { layout: 'alternating', items: [{ title: 'One', image: '/one.png' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('FeatureGrid: items[0] requires an `imageAlt` string')
    t.reset()
    await t.mount(() => el(FeatureGrid, { layout: 'alternating', items }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(FeatureGrid, { layout: 'alternating', items: [{ title: 'One', image: '/one.png', imageAlt: '' }] }))
    expect(t.errors).toEqual([])
  })
  it('does not ask for imageAlt when the image is never rendered or a media slot replaces it', async () => {
    await t.mount(() => el(FeatureGrid, { layout: 'grid', items: [{ title: 'One', image: '/one.png' }] }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(FeatureGrid, { layout: 'alternating', items: [{ title: 'One', image: '/one.png' }] }, { media: () => h('div') }))
    expect(t.errors).toEqual([])
  })
  it('normal usage with a heading passes; slot cards check themselves', async () => {
    await t.mount(() => el(FeatureGrid, { title: 'Features', items }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(FeatureGrid, null, { default: () => [el(FeatureCard, { title: 'Fine' }), el(FeatureCard, { description: 'No title' })] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('FeatureCard: requires a non-empty `title`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(FeatureGrid, { items: [{ description: 'x' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FeatureGrid: items[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(FeatureGrid, { items: [{ description: 'x' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
