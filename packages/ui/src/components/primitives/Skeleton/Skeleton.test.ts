import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from './Skeleton.vue'
import { skeletonLinesVariants, skeletonVariants } from './variants'

describe('Skeleton', () => {
  describe('good path', () => {
    it('renders an aria-hidden rect block with a pulse by default', () => {
      const w = mount(Skeleton)
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('skeleton')
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).toContain('animate-pulse')
      expect(w.classes()).toContain('h-20')
      expect(w.attributes('data-shimmer')).toBeUndefined()
    })

    it.each([
      ['text', 'h-4'],
      ['circle', 'rounded-full'],
      ['rect', 'h-20'],
    ] as const)('applies the %s shape', (shape, cls) => {
      expect(mount(Skeleton, { props: { shape } }).classes()).toContain(cls)
      expect(skeletonVariants({ shape })).toContain(cls)
    })

    it('shimmer is a deprecated alias: it pulses (no gradient) and keeps the data-shimmer hook', () => {
      const w = mount(Skeleton, { props: { shimmer: true } })
      expect(w.classes()).toContain('animate-pulse')
      expect(w.classes().some((c) => /gradient|^bg-\[/.test(c))).toBe(false)
      expect(w.attributes('data-shimmer')).toBeDefined()
    })

    it('respects reduced motion', () => {
      expect(mount(Skeleton).classes()).toContain('motion-reduce:animate-none')
      expect(mount(Skeleton, { props: { shimmer: true } }).classes()).toContain('motion-reduce:animate-none')
    })
  })

  describe('customisation', () => {
    it('class prop wins over shape size', () => {
      const w = mount(Skeleton, { props: { shape: 'circle', class: 'size-16 custom' } })
      expect(w.classes()).toContain('size-16')
      expect(w.classes()).not.toContain('size-10')
      expect(w.classes()).toContain('custom')
    })

    it('renders as another element and passes attrs', () => {
      const w = mount(Skeleton, { props: { as: 'span' }, attrs: { 'data-test': 'x' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-test')).toBe('x')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown shape falls back to rect', () => {
      const w = mount(Skeleton, { props: { shape: 'blob' as never } })
      expect(w.classes()).toContain('h-20')
      expect(w.classes()).toContain('rounded-md')
    })

    it('empty class prop is harmless', () => {
      expect(mount(Skeleton, { props: { class: '' } }).classes()).toContain('bg-muted')
    })

    it('can be toggled between pulse and shimmer', async () => {
      const w = mount(Skeleton)
      await w.setProps({ shimmer: true })
      expect(w.classes()).toContain('animate-pulse')
      await w.setProps({ shimmer: false })
      expect(w.classes()).toContain('animate-pulse')
    })
  })
})

describe('Skeleton variations', () => {
  const lines = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="skeleton-line"]')

  describe('shapes', () => {
    it.each([
      ['rounded', ['h-20', 'w-full', 'rounded-xl']],
      ['pill', ['h-6', 'w-24', 'rounded-full']],
      ['avatar', ['size-10', 'shrink-0', 'rounded-full']],
    ] as const)('%s shape has %j', (shape, cls) => {
      const w = mount(Skeleton, { props: { shape } })
      for (const c of cls) expect(w.classes()).toContain(c)
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).toContain('animate-pulse')
      expect(w.element.children).toHaveLength(0)
    })

    it('class overrides the size of the new shapes', () => {
      const w = mount(Skeleton, { props: { shape: 'avatar', class: 'size-16' } })
      expect(w.classes()).toContain('size-16')
      expect(w.classes()).not.toContain('size-10')
      const p = mount(Skeleton, { props: { shape: 'pill', class: 'w-40 h-8' } })
      expect(p.classes()).toContain('w-40')
      expect(p.classes()).not.toContain('w-24')
    })
  })

  describe('animation', () => {
    it('none disables pulse and shimmer', () => {
      const w = mount(Skeleton, { props: { animation: 'none' } })
      expect(w.classes()).not.toContain('animate-pulse')
      expect(w.classes()).not.toContain('animate-pulse')
      expect(w.classes()).toContain('bg-muted')
      expect(w.attributes('data-shimmer')).toBeUndefined()
    })

    it('pulse is explicit-able', () => {
      expect(mount(Skeleton, { props: { animation: 'pulse' } }).classes()).toContain('animate-pulse')
    })

    it('shimmer via the animation prop behaves like the shimmer flag', () => {
      const w = mount(Skeleton, { props: { animation: 'shimmer' } })
      expect(w.classes()).toContain('animate-pulse')
      expect(w.attributes('data-shimmer')).toBeDefined()
    })

    it('animation wins over the legacy shimmer flag', () => {
      expect(mount(Skeleton, { props: { shimmer: true, animation: 'none' } }).classes()).not.toContain('animate-pulse')
      expect(mount(Skeleton, { props: { shimmer: false, animation: 'shimmer' } }).classes()).toContain('animate-pulse')
    })

    it('unknown animation falls back to pulse, or shimmer when the flag is set', () => {
      expect(mount(Skeleton, { props: { animation: 'wobble' as never } }).classes()).toContain('animate-pulse')
      expect(mount(Skeleton, { props: { animation: 'wobble' as never, shimmer: true } }).classes()).toContain('animate-pulse')
    })

    it('all animations stay reduced-motion safe', () => {
      for (const animation of ['none', 'pulse', 'shimmer'] as const) {
        expect(mount(Skeleton, { props: { animation } }).classes()).toContain('motion-reduce:animate-none')
      }
    })

    it('switches animation reactively', async () => {
      const w = mount(Skeleton, { props: { animation: 'none' } })
      await w.setProps({ animation: 'shimmer' })
      expect(w.classes()).toContain('animate-pulse')
      await w.setProps({ animation: 'none' })
      expect(w.classes()).not.toContain('animate-pulse')
    })
  })

  describe('lines (paragraph)', () => {
    it('renders 3 aria-hidden lines by default in a column wrapper', () => {
      const w = mount(Skeleton, { props: { shape: 'lines' } })
      expect(w.attributes('data-slot')).toBe('skeleton')
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-2', 'w-full']))
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).not.toContain('animate-pulse')
      expect(lines(w)).toHaveLength(3)
      for (const l of lines(w)) {
        expect(l.classes()).toContain('bg-muted')
        expect(l.classes()).toContain('h-4')
        expect(l.classes()).toContain('animate-pulse')
      }
    })

    it('makes only the last line shorter', () => {
      const l = lines(mount(Skeleton, { props: { shape: 'lines', lines: 4 } }))
      expect(l.map((x) => x.classes().includes('w-3/4'))).toEqual([false, false, false, true])
      expect(l[0]!.classes()).toContain('w-full')
      expect(l[3]!.classes()).not.toContain('w-full')
    })

    it('a single line stays full width', () => {
      const l = lines(mount(Skeleton, { props: { shape: 'lines', lines: 1 } }))
      expect(l).toHaveLength(1)
      expect(l[0]!.classes()).toContain('w-full')
    })

    it('propagates shimmer / none to the lines and the wrapper flag', () => {
      const s = mount(Skeleton, { props: { shape: 'lines', animation: 'shimmer' } })
      expect(s.attributes('data-shimmer')).toBeDefined()
      expect(lines(s).every((l) => l.classes().includes('animate-pulse'))).toBe(true)
      const n = mount(Skeleton, { props: { shape: 'lines', animation: 'none' } })
      expect(lines(n).some((l) => l.classes().includes('animate-pulse'))).toBe(false)
      const legacy = mount(Skeleton, { props: { shape: 'lines', shimmer: true } })
      expect(lines(legacy).every((l) => l.classes().includes('animate-pulse'))).toBe(true)
    })

    it('class goes on the wrapper and overrides the gap', () => {
      const w = mount(Skeleton, { props: { shape: 'lines', class: 'gap-4 max-w-sm' } })
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-2')
      expect(w.classes()).toContain('max-w-sm')
    })

    it('passes attrs and `as` to the wrapper', () => {
      const w = mount(Skeleton, { props: { shape: 'lines', as: 'section' }, attrs: { 'data-test': 'p' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-test')).toBe('p')
    })

    it.each([0, -2, Number.NaN, Infinity, undefined])('lines=%s falls back to 3', (n) => {
      expect(lines(mount(Skeleton, { props: { shape: 'lines', lines: n as number } }))).toHaveLength(3)
    })

    it('floors fractions and caps at 20', () => {
      expect(lines(mount(Skeleton, { props: { shape: 'lines', lines: 2.9 } }))).toHaveLength(2)
      expect(lines(mount(Skeleton, { props: { shape: 'lines', lines: 1000 } }))).toHaveLength(20)
    })

    it('`lines` has no effect on other shapes', () => {
      const w = mount(Skeleton, { props: { shape: 'text', lines: 5 } })
      expect(lines(w)).toHaveLength(0)
    })

    it('switching shape swaps between a block and a paragraph', async () => {
      const w = mount(Skeleton, { props: { shape: 'lines' } })
      await w.setProps({ shape: 'text' })
      expect(lines(w)).toHaveLength(0)
      expect(w.classes()).toContain('bg-muted')
      await w.setProps({ shape: 'lines' })
      expect(lines(w)).toHaveLength(3)
    })
  })

  describe('variant helpers', () => {
    it('supports animation, the legacy shimmer flag and class', () => {
      expect(skeletonVariants({ animation: 'none' })).not.toContain('animate-pulse')
      expect(skeletonVariants({ shimmer: true })).toContain('animate-pulse')
      expect(skeletonVariants({ shimmer: false })).toContain('animate-pulse')
      expect(skeletonVariants({ animation: 'shimmer', shimmer: false })).toContain('animate-pulse')
      expect(skeletonVariants({ shape: 'pill', class: 'extra' })).toContain('extra')
      expect(skeletonVariants()).toContain('h-20')
    })

    it('exports the lines wrapper variant', () => {
      expect(skeletonLinesVariants()).toContain('flex-col')
    })
  })
})
