import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SplitLayout from './SplitLayout.vue'

const slots = { start: '<p id="s">Start</p>', end: '<p id="e">End</p>' }

describe('SplitLayout', () => {
  describe('good path', () => {
    it('renders two panes with slot content, equal split, stacked below md', () => {
      const w = mount(SplitLayout, { slots })
      expect(w.attributes('data-slot')).toBe('split-layout')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-1', 'md:grid-cols-2']))
      expect(w.find('[data-slot="split-layout-start"] #s').text()).toBe('Start')
      expect(w.find('[data-slot="split-layout-end"] #e').text()).toBe('End')
      expect(w.attributes('style')).toBeUndefined()
    })

    it.each([
      ['equal', 'md:grid-cols-2'],
      ['1/3', 'md:grid-cols-(--split-cols)'],
      ['2/3', 'md:grid-cols-(--split-cols)'],
      ['fixed-start', 'md:grid-cols-(--split-cols)'],
      ['fixed-end', 'md:grid-cols-(--split-cols)'],
    ] as const)('ratio %s (md)', (ratio, cls) => {
      const w = mount(SplitLayout, { props: { ratio } })
      expect(w.classes()).toContain(cls)
      expect(w.attributes('data-ratio')).toBe(ratio)
    })

    it('stackBelow lg uses lg: classes', () => {
      const w = mount(SplitLayout, { props: { stackBelow: 'lg', ratio: 'fixed-start', divider: true } })
      expect(w.classes()).toContain('lg:grid-cols-(--split-cols)')
      expect(w.classes().some((c) => c.startsWith('md:'))).toBe(false)
      expect(w.find('[data-slot="split-layout-end"]').classes()).toContain('lg:border-s')
    })

    it('ratios other than 1:1 set the --split-cols template and use no arbitrary-value classes', () => {
      const w = mount(SplitLayout, { props: { ratio: '1:3' } })
      expect(w.attributes('style')).toContain('--split-cols: 1fr 3fr')
      expect(w.classes().some((c) => c.includes('[') || c.includes(']'))).toBe(false)
      expect(mount(SplitLayout, { props: { ratio: 'equal' } }).attributes('style')).toBeUndefined()
      expect(mount(SplitLayout, { props: { ratio: 'fixed-end' } }).attributes('style')).toContain('--split-cols: 1fr var(--split-fixed)')
    })

    it('fixed ratios set the --split-fixed variable (default 16rem, or fixedWidth)', () => {
      expect(mount(SplitLayout, { props: { ratio: 'fixed-start' } }).attributes('style')).toContain('--split-fixed: 16rem')
      expect(mount(SplitLayout, { props: { ratio: 'fixed-end', fixedWidth: '320px' } }).attributes('style')).toContain('--split-fixed: 320px')
    })

    it('non-fixed ratios do not set the variable even with fixedWidth', () => {
      const style = mount(SplitLayout, { props: { ratio: '1/3', fixedWidth: '10rem' } }).attributes('style')
      expect(style).not.toContain('--split-fixed')
      expect(style).toContain('--split-cols: 1fr 2fr')
    })

    it('divider draws a border on the end pane', () => {
      const w = mount(SplitLayout, { props: { divider: true }, slots })
      const end = w.find('[data-slot="split-layout-end"]')
      expect(end.classes()).toEqual(expect.arrayContaining(['border-t', 'md:border-t-0', 'md:border-s']))
      expect(w.attributes('data-divider')).toBeDefined()
      expect(mount(SplitLayout, { slots }).find('[data-slot="split-layout-end"]').classes()).not.toContain('border-t')
    })

    it.each([
      ['1:1', 'md:grid-cols-2'],
      ['1:2', 'md:grid-cols-(--split-cols)'],
      ['2:1', 'md:grid-cols-(--split-cols)'],
      ['1:3', 'md:grid-cols-(--split-cols)'],
      ['3:1', 'md:grid-cols-(--split-cols)'],
    ] as const)('a:b ratio %s (md)', (ratio, cls) => {
      const w = mount(SplitLayout, { props: { ratio } })
      expect(w.classes()).toContain(cls)
      expect(w.attributes('data-ratio')).toBe(ratio)
    })

    it.each([
      ['1:1', 'lg:grid-cols-2'],
      ['1:2', 'lg:grid-cols-(--split-cols)'],
      ['2:1', 'lg:grid-cols-(--split-cols)'],
      ['1:3', 'lg:grid-cols-(--split-cols)'],
      ['3:1', 'lg:grid-cols-(--split-cols)'],
    ] as const)('a:b ratio %s (lg)', (ratio, cls) => {
      expect(mount(SplitLayout, { props: { ratio, stackBelow: 'lg' } }).classes()).toContain(cls)
    })

    it('not sticky and not reversed by default', () => {
      const w = mount(SplitLayout, { slots })
      expect(w.attributes('data-sticky')).toBeUndefined()
      expect(w.attributes('data-reverse-mobile')).toBeUndefined()
      expect(w.attributes('style')).toBeUndefined()
      expect(w.find('[data-slot="split-layout-start"]').classes()).toEqual(['min-w-0'])
      expect(w.find('[data-slot="split-layout-end"]').classes()).toEqual(['min-w-0'])
    })

    it.each([
      ['start', 'split-layout-start', 'split-layout-end'],
      ['end', 'split-layout-end', 'split-layout-start'],
    ] as const)('sticky %s pins only that pane', (sticky, pinned, other) => {
      const w = mount(SplitLayout, { props: { sticky }, slots })
      expect(w.find(`[data-slot="${pinned}"]`).classes()).toEqual(
        expect.arrayContaining(['md:sticky', 'md:top-(--split-sticky-top)', 'md:self-start']),
      )
      expect(w.find(`[data-slot="${other}"]`).classes()).not.toContain('md:sticky')
      expect(w.attributes('data-sticky')).toBe(sticky)
      expect(w.attributes('style')).toContain('--split-sticky-top: 1rem')
    })

    it('stickyOffset sets the variable; stackBelow lg uses lg: classes', () => {
      const w = mount(SplitLayout, { props: { sticky: 'end', stickyOffset: '4rem', stackBelow: 'lg' }, slots })
      expect(w.attributes('style')).toContain('--split-sticky-top: 4rem')
      expect(w.find('[data-slot="split-layout-end"]').classes()).toContain('lg:sticky')
    })

    it('stickyOffset without sticky sets no variable', () => {
      expect(mount(SplitLayout, { props: { stickyOffset: '4rem' } }).attributes('style')).toBeUndefined()
    })

    it('sticky and fixed ratio set both variables', () => {
      const style = mount(SplitLayout, { props: { ratio: 'fixed-start', fixedWidth: '10rem', sticky: 'start' } }).attributes('style')
      expect(style).toContain('--split-fixed: 10rem')
      expect(style).toContain('--split-sticky-top: 1rem')
    })

    it('reverseOnMobile shows the end pane first when stacked, DOM order unchanged', () => {
      const w = mount(SplitLayout, { props: { reverseOnMobile: true }, slots })
      expect(w.find('[data-slot="split-layout-end"]').classes()).toContain('max-md:order-first')
      expect(w.find('[data-slot="split-layout-start"]').classes()).not.toContain('max-md:order-first')
      expect(w.attributes('data-reverse-mobile')).toBeDefined()
      expect(w.html().indexOf('Start')).toBeLessThan(w.html().indexOf('End'))
    })

    it('reverseOnMobile follows stackBelow', () => {
      expect(mount(SplitLayout, { props: { reverseOnMobile: true, stackBelow: 'lg' } }).find('[data-slot="split-layout-end"]').classes()).toContain(
        'max-lg:order-first',
      )
    })

    it('reverseOnMobile moves the divider under the (first) end pane', () => {
      const end = mount(SplitLayout, { props: { reverseOnMobile: true, divider: true } }).find('[data-slot="split-layout-end"]')
      expect(end.classes()).toEqual(expect.arrayContaining(['border-b', 'md:border-b-0', 'md:border-s']))
      expect(end.classes()).not.toContain('border-t')
      const lg = mount(SplitLayout, { props: { reverseOnMobile: true, divider: true, stackBelow: 'lg' } }).find('[data-slot="split-layout-end"]')
      expect(lg.classes()).toContain('lg:border-b-0')
    })

    it('gap', () => {
      expect(mount(SplitLayout, { props: { gap: 6 } }).classes()).toContain('gap-6')
      expect(mount(SplitLayout).classes()).toContain('gap-0')
    })
  })

  describe('customisation', () => {
    it('class wins; attrs and as pass through', () => {
      const w = mount(SplitLayout, { props: { class: 'gap-2 custom', as: 'section' }, attrs: { id: 'sl' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-0')
      expect(w.classes()).toContain('custom')
      expect(w.attributes('id')).toBe('sl')
    })
  })

  describe('bad path', () => {
    it('unknown ratio falls back to equal', () => {
      const w = mount(SplitLayout, { props: { ratio: 'wat' as never } })
      expect(w.classes()).toContain('md:grid-cols-2')
      expect(w.attributes('data-ratio')).toBe('equal')
      expect(mount(SplitLayout, { props: { ratio: 'toString' as never } }).attributes('data-ratio')).toBe('equal')
    })

    it('unknown stackBelow falls back to md', () => {
      expect(mount(SplitLayout, { props: { stackBelow: 'xl' as never } }).classes()).toContain('md:grid-cols-2')
    })

    it('blank fixedWidth falls back to 16rem', () => {
      const w = mount(SplitLayout, { props: { ratio: 'fixed-start', fixedWidth: '   ' } })
      expect(w.attributes('style')).toContain('--split-fixed: 16rem')
    })

    it('unknown sticky is ignored', () => {
      const w = mount(SplitLayout, { props: { sticky: 'middle' as never }, slots })
      expect(w.attributes('data-sticky')).toBeUndefined()
      expect(w.attributes('style')).toBeUndefined()
      expect(w.find('[data-slot="split-layout-start"]').classes()).not.toContain('md:sticky')
      expect(w.find('[data-slot="split-layout-end"]').classes()).not.toContain('md:sticky')
    })

    it('blank stickyOffset falls back to 1rem', () => {
      expect(mount(SplitLayout, { props: { sticky: 'start', stickyOffset: '  ' } }).attributes('style')).toContain('--split-sticky-top: 1rem')
    })

    it('invalid gap falls back to gap-0', () => {
      expect(mount(SplitLayout, { props: { gap: 99 as never } }).classes()).toContain('gap-0')
    })
  })

  describe('edge cases', () => {
    it('renders both panes with no slots', () => {
      const w = mount(SplitLayout)
      expect(w.find('[data-slot="split-layout-start"]').exists()).toBe(true)
      expect(w.find('[data-slot="split-layout-end"]').exists()).toBe(true)
    })

    it('panes can shrink (min-w-0) so wide content does not overflow', () => {
      const w = mount(SplitLayout, { slots })
      expect(w.find('[data-slot="split-layout-start"]').classes()).toContain('min-w-0')
      expect(w.find('[data-slot="split-layout-end"]').classes()).toContain('min-w-0')
    })

    it('class can override sticky positioning on the root and attrs reach it', () => {
      const w = mount(SplitLayout, { props: { sticky: 'end', class: 'items-start' }, attrs: { 'data-x': '1' } })
      expect(w.classes()).toContain('items-start')
      expect(w.attributes('data-x')).toBe('1')
    })

    it('sticky, reverse, divider and ratio combine', () => {
      const w = mount(SplitLayout, { props: { ratio: '1:3', sticky: 'start', reverseOnMobile: true, divider: true, gap: 6 } })
      expect(w.classes()).toEqual(expect.arrayContaining(['md:grid-cols-(--split-cols)', 'gap-6']))
      expect(w.find('[data-slot="split-layout-start"]').classes()).toContain('md:sticky')
      expect(w.find('[data-slot="split-layout-end"]').classes()).toEqual(expect.arrayContaining(['max-md:order-first', 'border-b']))
    })

    it('accepts complex CSS lengths', () => {
      const w = mount(SplitLayout, { props: { ratio: 'fixed-start', fixedWidth: 'clamp(12rem, 30%, 24rem)' } })
      expect(w.attributes('style')).toContain('clamp(12rem, 30%, 24rem)')
    })
  })
})
