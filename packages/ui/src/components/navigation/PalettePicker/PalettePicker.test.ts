import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_PALETTES, type ThemePalette } from '../../../lib/palettes'
import { useThemeStore } from '../../../stores/theme'
import PalettePicker from './PalettePicker.vue'

function make(props: Record<string, unknown> = {}, palette?: ThemePalette, attrs: Record<string, unknown> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (palette) store.setPalette(palette)
  const w = mount(PalettePicker, { props, attrs, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="palette-picker-option"]')
const LAST = THEME_PALETTES.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('dir')
})

describe('PalettePicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per palette, each with visible text', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Palette')
      expect(w.attributes('data-slot')).toBe('palette-picker')
      expect(options(w).map((o) => o.attributes('data-palette-option'))).toEqual([...THEME_PALETTES])
      expect(options(w).map((o) => o.text())).toEqual(['Default', 'Graphite', 'Saffron', 'Glacier', 'Nocturne', 'Harbor'])
      expect(options(w).every((o) => o.attributes('role') === 'radio')).toBe(true)
    })
    it('marks the current palette as checked and as the only tab stop', () => {
      const { w } = make({}, 'saffron')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(THEME_PALETTES.map((s) => String(s === 'saffron')))
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(THEME_PALETTES.map((s) => (s === 'saffron' ? '0' : '-1')))
    })
    it('clicking an option sets the palette in the store', async () => {
      const { w, store } = make()
      await options(w)[2].trigger('click')
      expect(store.palette).toBe(THEME_PALETTES[2])
      expect(options(w)[2].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'default')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.palette).toBe(THEME_PALETTES[1])
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.palette).toBe(THEME_PALETTES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowDown' })
      expect(store.palette).toBe('default')
      await options(w)[0].trigger('keydown', { key: 'ArrowUp' })
      expect(store.palette).toBe(THEME_PALETTES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.palette).toBe('default')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.palette).toBe(THEME_PALETTES[LAST])
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'glacier')
      await options(w)[3].trigger('keydown', { key: 'a' })
      expect(store.palette).toBe('glacier')
    })
  })

  describe('rtl', () => {
    it('ArrowLeft moves forward and ArrowRight backward in a right-to-left group', async () => {
      const { w, store } = make({}, 'default', { dir: 'rtl' })
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.palette).toBe(THEME_PALETTES[1])
      await options(w)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(store.palette).toBe('default')
    })
  })

  describe('preview and store integration', () => {
    it('each option has an aria-hidden swatch carrying its own data-palette', () => {
      const { w } = make()
      const swatches = w.findAll('[data-slot="palette-picker-swatch"]')
      expect(swatches.map((s) => s.attributes('data-palette'))).toEqual([...THEME_PALETTES])
      expect(swatches.every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
    })
    it('choosing a palette sets data-palette on <html> and resets the accent', async () => {
      const { w, store } = make()
      store.init()
      store.setAccent('emerald')
      await options(w)[4].trigger('click')
      await nextTick()
      expect(document.documentElement.getAttribute('data-palette')).toBe(THEME_PALETTES[4])
      expect(store.accent).toBe('default')
      document.documentElement.removeAttribute('data-palette')
    })
  })

  describe('customisation', () => {
    it('limits and orders palettes; ignores unknown names', () => {
      const { w } = make({ palettes: ['harbor', 'nope', 'default'] })
      expect(options(w).map((o) => o.attributes('data-palette-option'))).toEqual(['harbor', 'default'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Colour set', class: 'gap-4 custom-x' }, undefined, { id: 'pp' })
      expect(w.attributes('aria-label')).toBe('Colour set')
      expect(w.attributes('id')).toBe('pp')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid palettes render an empty group', () => {
      expect(options(make({ palettes: [] }).w)).toHaveLength(0)
      expect(options(make({ palettes: 'harbor' }).w)).toHaveLength(0)
    })
    it('when the store palette is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ palettes: ['default', 'harbor'] }, 'saffron')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 2, 3, 4, 5]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.palette).toBe(THEME_PALETTES[5])
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('a single option wraps onto itself', async () => {
      const { w, store } = make({ palettes: ['harbor'] }, 'harbor')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.palette).toBe('harbor')
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
