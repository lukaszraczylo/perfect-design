import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_SURFACES, useThemeStore, type ThemeSurface } from '../../../stores/theme'
import SurfacePicker from './SurfacePicker.vue'

function make(props: Record<string, unknown> = {}, surface?: ThemeSurface) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (surface) store.setSurface(surface)
  const w = mount(SurfacePicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const options = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="surface-picker-option"]')
const LAST = THEME_SURFACES.length - 1

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('SurfacePicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per surface, named Solid and Glass', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Surface')
      expect(w.attributes('data-slot')).toBe('surface-picker')
      expect(options(w).map((o) => o.attributes('data-surface-option'))).toEqual([...THEME_SURFACES])
      expect(options(w).map((o) => o.text())).toEqual(['Solid', 'Glass'])
      expect(options(w).every((o) => o.attributes('role') === 'radio')).toBe(true)
    })
    it('marks the current surface as checked and as the only tab stop', () => {
      const { w } = make({}, 'glass')
      expect(options(w).map((o) => o.attributes('aria-checked'))).toEqual(['false', 'true'])
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['-1', '0'])
    })
    it('clicking an option sets the surface in the store', async () => {
      const { w, store } = make()
      await options(w)[1].trigger('click')
      expect(store.surface).toBe('glass')
      expect(options(w)[1].attributes('aria-checked')).toBe('true')
    })
    it('arrow keys move selection and focus, wrapping around; Home and End jump', async () => {
      const { w, store } = make({}, 'solid')
      await options(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.surface).toBe('glass')
      expect(document.activeElement).toBe(options(w)[1].element)
      await options(w)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(store.surface).toBe('solid')
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.surface).toBe(THEME_SURFACES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'Home' })
      expect(store.surface).toBe('solid')
      await options(w)[0].trigger('keydown', { key: 'End' })
      expect(store.surface).toBe(THEME_SURFACES[LAST])
      await options(w)[LAST].trigger('keydown', { key: 'ArrowUp' })
      expect(store.surface).toBe('solid')
    })
    it('Left and Right swap in right-to-left', async () => {
      const { w, store } = make({}, 'solid')
      w.element.setAttribute('dir', 'rtl')
      await options(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.surface).toBe('glass')
    })
    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'glass')
      await options(w)[1].trigger('keydown', { key: 'a' })
      expect(store.surface).toBe('glass')
    })
  })

  describe('apply', () => {
    it('choosing a surface sets data-surface on <html> once the store is initialised', async () => {
      const { w, store } = make()
      store.init()
      await options(w)[1].trigger('click')
      await nextTick()
      expect(document.documentElement.getAttribute('data-surface')).toBe('glass')
      document.documentElement.removeAttribute('data-surface')
    })
  })

  describe('customisation', () => {
    it('limits and orders surfaces; ignores unknown names', () => {
      const { w } = make({ surfaces: ['glass', 'nope'] })
      expect(options(w).map((o) => o.attributes('data-surface-option'))).toEqual(['glass'])
    })
    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Surface style', class: 'gap-4 custom-x' })
      expect(w.attributes('aria-label')).toBe('Surface style')
      expect(w.classes()).toEqual(expect.arrayContaining(['custom-x', 'gap-4']))
      expect(w.classes()).not.toContain('gap-1.5')
    })
  })

  describe('bad path', () => {
    it('empty or invalid surfaces render an empty group', () => {
      expect(options(make({ surfaces: [] }).w)).toHaveLength(0)
      expect(options(make({ surfaces: 'glass' }).w)).toHaveLength(0)
    })
    it('when the store surface is not offered the first option is the tab stop and none is checked', () => {
      const { w } = make({ surfaces: ['solid'] }, 'glass')
      expect(options(w).map((o) => o.attributes('tabindex'))).toEqual(['0'])
      expect(options(w).every((o) => o.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks end on the last one with exactly one checked', async () => {
      const { w, store } = make()
      for (const i of [1, 0, 1, 0, 1]) await options(w)[i].trigger('click')
      await nextTick()
      expect(store.surface).toBe('glass')
      expect(options(w).filter((o) => o.attributes('aria-checked') === 'true')).toHaveLength(1)
    })
    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
