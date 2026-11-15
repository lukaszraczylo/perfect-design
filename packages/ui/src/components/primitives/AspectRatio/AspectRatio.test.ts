import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AspectRatio from './AspectRatio.vue'

// reka renders an outer sizing wrapper and an inner absolutely positioned content element.
const wrapperEl = (w: ReturnType<typeof mount>) => w.find('[data-reka-aspect-ratio-wrapper]')
const inner = (w: ReturnType<typeof mount>) => w.find('[data-slot="aspect-ratio"]')

describe('AspectRatio', () => {
  describe('good path', () => {
    it('renders slot content inside a sized wrapper, defaulting to 16/9', () => {
      const w = mount(AspectRatio, { slots: { default: '<img alt="x" src="a.png">' } })
      expect(inner(w).exists()).toBe(true)
      expect(inner(w).find('img').exists()).toBe(true)
      expect(wrapperEl(w).attributes('style')).toContain('padding-bottom: 56.25%')
    })

    it.each([
      [1, '100%'],
      [2, '50%'],
      [4 / 3, '75%'],
      [0.5, '200%'],
    ])('ratio %f gives padding-bottom %s', (ratio, pad) => {
      expect(wrapperEl(mount(AspectRatio, { props: { ratio } })).attributes('style')).toContain(`padding-bottom: ${pad}`)
    })

    it('content is absolutely positioned to fill the box', () => {
      const style = inner(mount(AspectRatio)).attributes('style')
      expect(style).toContain('position: absolute')
      expect(style).toContain('inset: 0')
    })

    it('reacts to ratio changes', async () => {
      const w = mount(AspectRatio, { props: { ratio: 1 } })
      await w.setProps({ ratio: 2 })
      expect(wrapperEl(w).attributes('style')).toContain('padding-bottom: 50%')
    })
  })

  describe('customisation', () => {
    it('merges class on the content element', () => {
      const w = mount(AspectRatio, { props: { class: 'overflow-hidden rounded-lg custom-x' } })
      expect(inner(w).classes()).toEqual(expect.arrayContaining(['overflow-hidden', 'rounded-lg', 'custom-x']))
    })

    it('passes attributes through', () => {
      const w = mount(AspectRatio, { attrs: { id: 'ar', 'data-test': 'x', role: 'img', 'aria-label': 'Hero' } })
      expect(inner(w).attributes('id')).toBe('ar')
      expect(inner(w).attributes('data-test')).toBe('x')
      expect(inner(w).attributes('role')).toBe('img')
      expect(inner(w).attributes('aria-label')).toBe('Hero')
    })

    it('`as` renders another element', () => {
      expect(inner(mount(AspectRatio, { props: { as: 'figure' } })).element.tagName).toBe('FIGURE')
    })

    it('asChild applies content styles to the child', () => {
      const w = mount(AspectRatio, { props: { asChild: true, class: 'custom-x' }, slots: { default: '<img alt="x" src="a.png">' } })
      const img = w.find('img')
      expect(img.attributes('data-slot')).toBe('aspect-ratio')
      expect(img.classes()).toContain('custom-x')
    })
  })

  describe('bad path', () => {
    it.each([0, -1, Number.NaN, Infinity, -Infinity])('invalid ratio %s falls back to 16/9', (ratio) => {
      expect(wrapperEl(mount(AspectRatio, { props: { ratio } })).attributes('style')).toContain('padding-bottom: 56.25%')
    })
  })

  describe('edge cases', () => {
    it('renders with an empty slot', () => {
      const w = mount(AspectRatio)
      expect(inner(w).exists()).toBe(true)
      expect(inner(w).text()).toBe('')
    })

    it('very wide and very tall ratios stay finite', () => {
      expect(wrapperEl(mount(AspectRatio, { props: { ratio: 1000 } })).attributes('style')).toMatch(/padding-bottom: 0\.1%/)
      expect(wrapperEl(mount(AspectRatio, { props: { ratio: 0.001 } })).attributes('style')).toMatch(/padding-bottom: 100000%/)
    })

    it('handles unicode slot text', () => {
      expect(inner(mount(AspectRatio, { slots: { default: '日本語 ✓' } })).text()).toBe('日本語 ✓')
    })
  })
})
