import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_CORNERS, useThemeStore, type ThemeCorner } from '../../../stores/theme'
import CornerPicker from './CornerPicker.vue'

function make(props: Record<string, unknown> = {}, corner?: ThemeCorner) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (corner) store.setCorner(corner)
  const w = mount(CornerPicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="corner-picker-option"]')
const LAST = THEME_CORNERS.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('CornerPicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per corner shape, named Round and Squircle', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Corner')
      expect(w.attributes('data-slot')).toBe('corner-picker')
      expect(options(w).map((o) => o.attributes('data-corner-option'))).toEqual([...THEME_CORNERS])
      expect(options(w).map((o) => o.text())).toEqual(['Round', 'Squircle'])
      expect(options(w).every((o) => o.attributes('role') === 'radio')).toBe(true)
    })
    it('marks the current corner as checked and as the only tab stop', () => {
      const { w } = make({}, 'squircle')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(['false', 'true'])
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['-1', '0'])
    })
    it('clicking an option sets the corner in the store', async () => {
      const { w, store } = make()
      await options(w)[1].trigger('click')
      expect(store.corner).toBe('squircle')
      expect(options(w)[1].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'round')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.corner).toBe('squircle')
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(store.corner).toBe('round')
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.corner).toBe(THEME_CORNERS[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.corner).toBe('round')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.corner).toBe(THEME_CORNERS[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowUp' })
      expect(store.corner).toBe('round')
    })
    it('Left and Right swap in right-to-left', async () => {
      const { w, store } = make({}, 'round')
      w.element.setAttribute('dir', 'rtl')
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.corner).toBe('squircle')
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'squircle')
      await options(w)[1].trigger('keydown', { key: 'a' })
      expect(store.corner).toBe('squircle')
    })
  })

  describe('preview', () => {
    it('each option carries its own data-corner so corners.css previews it in that shape', () => {
      const { w } = make()
      expect(options(w).map((o) => o.attributes('data-corner'))).toEqual([...THEME_CORNERS])
    })
    it('choosing a corner sets data-corner on <html> once the store is initialised', async () => {
      const { w, store } = make()
      store.init()
      await options(w)[1].trigger('click')
      await nextTick()
      expect(document.documentElement.getAttribute('data-corner')).toBe('squircle')
      document.documentElement.removeAttribute('data-corner')
    })
  })

  describe('customisation', () => {
    it('limits and orders corners; ignores unknown names', () => {
      const { w } = make({ corners: ['squircle', 'nope'] })
      expect(options(w).map((o) => o.attributes('data-corner-option'))).toEqual(['squircle'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Corner style', class: 'gap-4 custom-x' })
      expect(w.attributes('aria-label')).toBe('Corner style')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid corners render an empty group', () => {
      expect(options(make({ corners: [] }).w)).toHaveLength(0)
      expect(options(make({ corners: 'squircle' }).w)).toHaveLength(0)
    })
    it('when the store corner is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ corners: ['round'] }, 'squircle')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 0, 1, 0, 1]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.corner).toBe('squircle')
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
