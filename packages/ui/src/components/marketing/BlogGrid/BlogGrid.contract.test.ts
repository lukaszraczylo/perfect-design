import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import BlogCard from '../BlogCard/BlogCard.vue'
import BlogGrid from './BlogGrid.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

const good = { title: 'Post', image: '/c.jpg', imageAlt: '' }
describe('BlogGrid contract', () => {
  it('reports the first failing post once, by index, not once per card', async () => {
    await t.mount(() => el(BlogGrid, { items: [good, { excerpt: 'no title' }, { image: '/x.jpg' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('BlogGrid: items[1] requires a non-empty `title`')
  })
  it('surfaces the imageAlt rule of BlogCard', async () => {
    await t.mount(() => el(BlogGrid, { items: [good, { title: 'Second', image: '/x.jpg' }] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('BlogGrid: items[1] requires an `imageAlt` string')
  })
  it('passes for complete posts and an empty list', async () => {
    await t.mount(() => el(BlogGrid, { items: [good, { title: 'Second' }], layout: 'featured' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(BlogGrid, { items: [] }))
    expect(t.errors).toEqual([])
  })
  it('slot cards check themselves', async () => {
    await t.mount(() => el(BlogGrid, null, { default: () => [el(BlogCard, { title: 'Fine' }), el(BlogCard, { excerpt: 'No title' })] }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('BlogCard: requires a non-empty `title`')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(BlogGrid, { items: [{ excerpt: 'x' }] }))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('BlogGrid: items[0]'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(BlogGrid, { items: [{ excerpt: 'x' }] }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
