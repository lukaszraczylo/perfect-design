import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_STYLES, useThemeStore, type ThemeStyle } from '../../../stores/theme'
import StylePicker from './StylePicker.vue'

function make(props: Record<string, unknown> = {}, style?: ThemeStyle) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (style) store.setStyle(style)
  const w = mount(StylePicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="style-picker-option"]')
const LAST = THEME_STYLES.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('StylePicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per style, each with visible text', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Style')
      expect(w.attributes('data-slot')).toBe('style-picker')
      expect(options(w).map((o) => o.attributes('data-style-option'))).toEqual([...THEME_STYLES])
      expect(options(w).every((o) => o.attributes('role') === 'radio' && o.text().length > 1)).toBe(true)
    })
    it('marks the current style as checked and as the only tab stop', () => {
      const { w } = make({}, 'raw')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(THEME_STYLES.map((s) => String(s === 'raw')))
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(THEME_STYLES.map((s) => (s === 'raw' ? '0' : '-1')))
    })
    it('clicking an option sets the style in the store', async () => {
      const { w, store } = make()
      await options(w)[2].trigger('click')
      expect(store.style).toBe(THEME_STYLES[2])
      expect(options(w)[2].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'quiet')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.style).toBe(THEME_STYLES[1])
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.style).toBe(THEME_STYLES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowDown' })
      expect(store.style).toBe('quiet')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.style).toBe(THEME_STYLES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.style).toBe('quiet')
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'tactile')
      await options(w)[2].trigger('keydown', { key: 'a' })
      expect(store.style).toBe('tactile')
    })
  })

  describe('customisation', () => {
    it('limits and orders styles; ignores unknown names', () => {
      const { w } = make({ styles: ['raw', 'nope', 'quiet'] })
      expect(options(w).map((o) => o.attributes('data-style-option'))).toEqual(['raw', 'quiet'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Look', class: 'gap-4 custom-x' })
      expect(w.attributes('aria-label')).toBe('Look')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid styles render an empty group', () => {
      expect(options(make({ styles: [] }).w)).toHaveLength(0)
      expect(options(make({ styles: 'raw' }).w)).toHaveLength(0)
    })
    it('when the store style is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ styles: ['quiet', 'raw'] }, 'terminal')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 2, 3, 4, 5]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.style).toBe(THEME_STYLES[5])
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
