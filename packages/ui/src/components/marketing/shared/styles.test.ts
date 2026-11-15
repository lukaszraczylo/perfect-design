import { describe, expect, it } from 'vitest'
import { insetFocus } from './styles'
import { sampleImage } from './sample'

describe('marketing shared styles and samples', () => {
  it('insetFocus draws an inset outline so frames never clip it', () => {
    expect(insetFocus).toContain('focus-visible:outline-2')
    expect(insetFocus).toContain('-outline-offset-2')
  })
  it('insetFocus restores outline-style: outline-hidden sets it to none in Tailwind v4, so outline-solid is required', () => {
    const tokens = insetFocus.split(' ')
    expect(tokens).toContain('outline-hidden')
    expect(tokens).toContain('focus-visible:outline-solid')
    // the style must be set under the same variant as the width, otherwise the ring is invisible
    expect(tokens.filter((t) => /^focus-visible:outline-(2|solid)$/.test(t))).toHaveLength(2)
    expect(tokens).toContain('focus-visible:outline-ring')
  })
  it('sampleImage returns an offline flat svg data uri for each ratio and falls back for unknown ones', () => {
    for (const r of ['16/9', '4/3', '1/1'] as const) {
      const uri = sampleImage(r)
      expect(uri.startsWith('data:image/svg+xml;utf8,<svg')).toBe(true)
      expect(uri).not.toMatch(/gradient|http:\/\/(?!www\.w3\.org)/)
    }
    // @ts-expect-error deliberately invalid
    expect(sampleImage('2/1')).toBe(sampleImage('16/9'))
    expect(sampleImage()).toBe(sampleImage('16/9'))
  })
})
