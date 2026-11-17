import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_CODE_THEMES, useThemeStore, type ThemeCodeTheme } from '../../../stores/theme'
import CodeThemePicker from './CodeThemePicker.vue'

function make(props: Record<string, unknown> = {}, theme?: ThemeCodeTheme, attrs: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (theme) store.setCodeTheme(theme)
  const w = mount(CodeThemePicker, { props, attrs, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="code-theme-picker-option"]')
const LAST = THEME_CODE_THEMES.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('CodeThemePicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per theme, each with visible text', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Code theme')
      expect(w.attributes('data-slot')).toBe('code-theme-picker')
      expect(options(w).map((o) => o.attributes('data-code-theme-option'))).toEqual([...THEME_CODE_THEMES])
      expect(options(w).every((o) => o.attributes('role') === 'radio' && o.text().length > 1)).toBe(true)
    })
    it('names the default option "Follow palette" and shows the mode after each theme name', () => {
      const { w } = make()
      const texts = options(w).map((o) => o.text())
      expect(texts[0]).toBe('Follow palette')
      expect(texts[1]).toBe('Midnight (dark)')
      expect(texts[LAST]).toBe('Mist (light)')
    })
    it('lists dark themes before light themes', () => {
      const { w } = make()
      const modes = options(w).slice(1).map((o) => (o.text().includes('(dark)') ? 'dark' : 'light'))
      expect(modes).toEqual([...modes].sort((a, b) => (a === b ? 0 : a === 'dark' ? -1 : 1)))
    })
    it('marks the current theme as checked and as the only tab stop', () => {
      const { w } = make({}, 'frost')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(THEME_CODE_THEMES.map((s) => String(s === 'frost')))
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(THEME_CODE_THEMES.map((s) => (s === 'frost' ? '0' : '-1')))
    })
    it('clicking an option sets the code theme in the store', async () => {
      const { w, store } = make()
      await options(w)[2].trigger('click')
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[2])
      expect(options(w)[2].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'default')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[1])
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowDown' })
      expect(store.codeTheme).toBe('default')
      await options(w)[0].trigger('keydown', { key: 'ArrowUp' })
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.codeTheme).toBe('default')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[LAST])
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'ember')
      await options(w)[4].trigger('keydown', { key: 'a' })
      expect(store.codeTheme).toBe('ember')
    })
  })

  describe('rtl', () => {
    it('ArrowLeft moves forward and ArrowRight backward in a right-to-left group', async () => {
      const { w, store } = make({}, 'default', { dir: 'rtl' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[1])
      await options(w)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(store.codeTheme).toBe('default')
    })
  })

  describe('preview and store integration', () => {
    it('every theme option has an aria-hidden swatch with its own data-code-theme; default has none', () => {
      const { w } = make()
      const swatches = w.findAll('[data-slot="code-theme-picker-swatch"]')
      expect(swatches.map((s) => s.attributes('data-code-theme'))).toEqual(THEME_CODE_THEMES.slice(1))
      expect(swatches.every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
      expect(options(w)[0].find('[data-slot="code-theme-picker-swatch"]').exists()).toBe(false)
    })
    it('choosing a theme sets data-code-theme on <html> once the store is initialised', async () => {
      const { w, store } = make()
      store.init()
      await options(w)[6].trigger('click')
      await nextTick()
      expect(document.documentElement.getAttribute('data-code-theme')).toBe(THEME_CODE_THEMES[6])
      document.documentElement.removeAttribute('data-code-theme')
    })
  })

  describe('customisation', () => {
    it('limits and orders themes; ignores unknown names', () => {
      const { w } = make({ themes: ['mist', 'nope', 'default'] })
      expect(options(w).map((o) => o.attributes('data-code-theme-option'))).toEqual(['mist', 'default'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Syntax colours', class: 'gap-4 custom-x' }, undefined, { id: 'ct' })
      expect(w.attributes('aria-label')).toBe('Syntax colours')
      expect(w.attributes('id')).toBe('ct')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid themes render an empty group', () => {
      expect(options(make({ themes: [] }).w)).toHaveLength(0)
      expect(options(make({ themes: 'mist' }).w)).toHaveLength(0)
    })
    it('when the store theme is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ themes: ['default', 'mist'] }, 'ember')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 2, 3, 4, 5]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.codeTheme).toBe(THEME_CODE_THEMES[5])
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
