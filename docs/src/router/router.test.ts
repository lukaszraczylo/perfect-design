import { describe, expect, it } from 'vitest'
import { pageMeta } from './index'

describe('pageMeta (WCAG 2.4.2 page titles)', () => {
  it('gives every route kind a unique, descriptive title', () => {
    const titles = [
      pageMeta('/', {}), pageMeta('/components', {}), pageMeta('/components/forms', { group: 'forms' }),
      pageMeta('/components/primitives/button', { group: 'primitives', slug: 'button' }),
      pageMeta('/foundations/colors', { topic: 'colors' }), pageMeta('/guides/llm', { topic: 'llm' }), pageMeta('/nope', {}),
    ].map((m) => m.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const t of titles) expect(t).toContain('Perfect Design')
  })
  it('uses the component summary as the description and falls back for unknown components', () => {
    expect(pageMeta('/components/primitives/button', { group: 'primitives', slug: 'button' }).description).toMatch(/action/i)
    expect(pageMeta('/components/x/none', { group: 'x', slug: 'none' }).title).toContain('Component')
  })
  it('keeps descriptions non-empty', () => {
    for (const m of [pageMeta('/', {}), pageMeta('/zzz', {}), pageMeta('/guides/getting-started', { topic: 'getting-started' })]) expect(m.description.length).toBeGreaterThan(20)
  })
})
