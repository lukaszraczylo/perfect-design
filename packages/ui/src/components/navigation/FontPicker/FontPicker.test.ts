import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_FONTS, useThemeStore, type ThemeFont } from '../../../stores/theme'
import FontPicker from './FontPicker.vue'

function make(props: Record<string, unknown> = {}, style?: ThemeFont) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (style) store.setFont(style)
  const w = mount(FontPicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="font-picker-option"]')
const LAST = THEME_FONTS.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('FontPicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per font, each with visible text', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Font')
      expect(w.attributes('data-slot')).toBe('font-picker')
      expect(options(w).map((o) => o.attributes('data-font-option'))).toEqual([...THEME_FONTS])
      expect(options(w).every((o) => o.attributes('role') === 'radio' && o.text().length > 1)).toBe(true)
    })
    it('marks the current font as checked and as the only tab stop', () => {
      const { w } = make({}, 'serif')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(THEME_FONTS.map((s) => String(s === 'serif')))
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(THEME_FONTS.map((s) => (s === 'serif' ? '0' : '-1')))
    })
    it('clicking an option sets the font in the store', async () => {
      const { w, store } = make()
      await options(w)[2].trigger('click')
      expect(store.font).toBe(THEME_FONTS[2])
      expect(options(w)[2].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'default')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.font).toBe(THEME_FONTS[1])
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.font).toBe(THEME_FONTS[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowDown' })
      expect(store.font).toBe('default')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.font).toBe(THEME_FONTS[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.font).toBe('default')
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'rounded')
      await options(w)[2].trigger('keydown', { key: 'a' })
      expect(store.font).toBe('rounded')
    })
  })

  describe('preview', () => {
    it('each option carries its own data-font so fonts.css previews it in that family', () => {
      const { w } = make()
      expect(options(w).map((o) => o.attributes('data-font'))).toEqual([...THEME_FONTS])
    })
    it('choosing a font sets data-font on <html> once the store is initialised', async () => {
      const { w, store } = make()
      store.init()
      await options(w)[6].trigger('click')
      await nextTick()
      expect(document.documentElement.getAttribute('data-font')).toBe(THEME_FONTS[6])
      document.documentElement.removeAttribute('data-font')
    })
  })

  describe('customisation', () => {
    it('limits and orders fonts; ignores unknown names', () => {
      const { w } = make({ fonts: ['serif', 'nope', 'default'] })
      expect(options(w).map((o) => o.attributes('data-font-option'))).toEqual(['serif', 'default'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Typeface', class: 'gap-4 custom-x' })
      expect(w.attributes('aria-label')).toBe('Typeface')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid fonts render an empty group', () => {
      expect(options(make({ fonts: [] }).w)).toHaveLength(0)
      expect(options(make({ fonts: 'serif' }).w)).toHaveLength(0)
    })
    it('when the store font is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ fonts: ['default', 'serif'] }, 'mono')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 2, 3, 4, 5]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.font).toBe(THEME_FONTS[5])
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
