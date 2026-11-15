import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import BlogCard from './BlogCard.vue'

const t = strictMount()
beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  t.reset()
  configureStrictMode('off')
})

describe('BlogCard contract', () => {
  it('throws when the title is missing or blank', async () => {
    await t.mount(() => el(BlogCard, { excerpt: 'Only a teaser' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].name).toBe('ContractError')
    expect(t.errors[0].message).toContain('BlogCard: requires a non-empty `title`')
    t.reset()
    await t.mount(() => el(BlogCard, { title: '   ' }))
    expect(t.errors).toHaveLength(1)
  })
  it('throws when an image has no imageAlt string', async () => {
    await t.mount(() => el(BlogCard, { title: 'Post', image: '/cover.jpg' }))
    expect(t.errors).toHaveLength(1)
    expect(t.errors[0].message).toContain('BlogCard: requires an `imageAlt` string')
  })
  it('accepts a description, an empty imageAlt (decorative) and the image slot', async () => {
    await t.mount(() => el(BlogCard, { title: 'Post', image: '/cover.jpg', imageAlt: 'A flat grey cover' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(BlogCard, { title: 'Post', image: '/cover.jpg', imageAlt: '' }))
    expect(t.errors).toEqual([])
    t.reset()
    await t.mount(() => el(BlogCard, { title: 'Post', image: '/cover.jpg' }, { image: () => h('picture') }))
    expect(t.errors).toEqual([])
  })
  it('does not ask for an imageAlt without an image; normal usage passes', async () => {
    await t.mount(() => el(BlogCard, { title: 'Post', excerpt: 'Teaser', href: '/post', category: 'Guide', date: '2024-03-01' }))
    expect(t.errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await t.mount(() => el(BlogCard))
    expect(t.errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('BlogCard: requires a non-empty `title`'))).toBe(true)
    spy.mockClear()
    t.reset()
    configureStrictMode('off')
    await t.mount(() => el(BlogCard))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
