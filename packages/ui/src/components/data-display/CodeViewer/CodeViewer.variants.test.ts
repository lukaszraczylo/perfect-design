import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import GoViewer from '../GoViewer/GoViewer.vue'
import YamlViewer from '../YamlViewer/YamlViewer.vue'
import { CODE_VIEWER_SIZES, CODE_VIEWER_VARIANTS, CodeViewer, codeViewerVariants } from './index'

const mounted: VueWrapper[] = []
function mk(props: Record<string, unknown> = {}, C: unknown = CodeViewer) {
  const w = mount(C as never, { props: { source: 'a: 1', language: 'yaml', filename: 'a.yaml', ...props } as never })
  mounted.push(w)
  return w
}
afterEach(() => mounted.splice(0).forEach((w) => w.unmount()))

describe('CodeViewer variant and size dimensions', () => {
  it('keeps the default class strings', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('flex min-w-0 max-w-full flex-col overflow-hidden text-sm rounded-md border bg-card text-card-foreground')
    expect(w.attributes('data-variant')).toBe('bordered')
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.find('[data-slot="code-viewer-code"]').attributes('class')).toBe('py-2 font-mono leading-6 [tab-size:4] w-max min-w-full')
  })

  it('exports the value lists', () => {
    expect([...CODE_VIEWER_VARIANTS]).toEqual(['bordered', 'plain', 'flush'])
    expect([...CODE_VIEWER_SIZES]).toEqual(['sm', 'md', 'lg'])
  })

  it('flush is full-bleed with top and bottom rules only', () => {
    const w = mk({ variant: 'flush' })
    expect(w.attributes('data-variant')).toBe('flush')
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-x-0', 'border-y', 'bg-card']))
    expect(w.classes()).not.toContain('rounded-md')
  })

  it('plain keeps the rounded header and no frame', () => {
    const w = mk({ variant: 'plain' })
    expect(w.classes()).not.toContain('border')
    expect(w.find('[data-slot="code-viewer-header"]').classes()).toContain('rounded-t-md')
  })

  it.each([
    ['sm', 'text-xs', 'leading-6'],
    ['lg', 'text-base', 'leading-7'],
  ])('size=%s sets %s and %s on the rows', (size, text, leading) => {
    const w = mk({ size })
    expect(w.classes()).toContain(text)
    expect(w.classes()).not.toContain('text-sm')
    expect(w.attributes('data-size')).toBe(size)
    expect(w.find('[data-slot="code-viewer-code"]').classes()).toContain(leading)
  })

  it('unknown variant and size fall back to the default output', () => {
    expect(mk({ variant: 'neon', size: 'huge' }).html()).toBe(mk().html())
  })

  it('combines variant and size and lets class win', () => {
    const w = mk({ variant: 'flush', size: 'sm', class: 'text-lg rounded-lg' })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-lg', 'rounded-lg', 'border-y']))
    expect(w.classes()).not.toContain('text-xs')
    expect(w.classes()).not.toContain('rounded-none')
  })

  it.each(CODE_VIEWER_VARIANTS)('%s keeps the focusable named region and fold buttons', (variant) => {
    const w = mk({ variant, source: 'a:\n  b: 1\n  c: 2\n' })
    const region = w.find('[data-slot="code-viewer-scroll"]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBe('a.yaml')
    expect(w.find('[data-slot="code-viewer-fold"]').attributes('aria-label')).toMatch(/^Fold lines/)
  })

  it('exposes the helper with both dimensions', () => {
    expect(codeViewerVariants({ variant: 'flush', size: 'lg' })).toContain('text-base')
    expect(codeViewerVariants()).toContain('rounded-md')
  })

  it('handles an empty source at every size', () => {
    for (const size of CODE_VIEWER_SIZES) expect(() => mk({ size, source: '' })).not.toThrow()
  })

  describe.each([
    ['YamlViewer', YamlViewer, 'yaml-viewer'],
    ['GoViewer', GoViewer, 'go-viewer'],
  ])('%s forwards variant and size', (_n, C, slot) => {
    it('flush + lg reach the root', () => {
      const w = mk({ variant: 'flush', size: 'lg', language: undefined }, C)
      expect(w.attributes('data-slot')).toBe(slot)
      expect(w.attributes('data-variant')).toBe('flush')
      expect(w.attributes('data-size')).toBe('lg')
      expect(w.classes()).toContain('text-base')
    })
    it('defaults stay bordered and md', () => {
      const w = mk({ language: undefined }, C)
      expect(w.attributes('data-variant')).toBe('bordered')
      expect(w.attributes('data-size')).toBeUndefined()
    })
  })
})
