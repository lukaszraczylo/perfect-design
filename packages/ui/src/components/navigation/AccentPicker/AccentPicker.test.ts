import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { THEME_ACCENTS, useThemeStore, type ThemeAccent } from '../../../stores/theme'
import AccentPicker from './AccentPicker.vue'

const settle = () => new Promise((r) => setTimeout(r, 5))
function make(props: Record<string, unknown> = {}, accent?: ThemeAccent) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (accent) store.setAccent(accent)
  const w = mount(AccentPicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const swatches = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="accent-picker-swatch"]')

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

const LAST = THEME_ACCENTS.length - 1

describe('AccentPicker', () => {
  describe('good path', () => {
    it('renders a labelled radiogroup with one radio per accent', () => {
      const { w } = make()
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Accent colour')
      expect(w.attributes('data-slot')).toBe('accent-picker')
      expect(swatches(w).map((s) => s.attributes('data-accent'))).toEqual([...THEME_ACCENTS])
      expect(swatches(w).every((s) => s.attributes('role') === 'radio' && !!s.attributes('aria-label'))).toBe(true)
    })

    it('marks the current accent as checked and is the only tab stop', () => {
      const { w } = make({}, 'rose')
      expect(swatches(w).map((s) => s.attributes('aria-checked'))).toEqual(THEME_ACCENTS.map((a) => String(a === 'rose')))
      expect(swatches(w).map((s) => s.attributes('tabindex'))).toEqual(THEME_ACCENTS.map((a) => (a === 'rose' ? '0' : '-1')))
    })

    it('clicking a swatch sets the accent in the store', async () => {
      const { w, store } = make()
      await settle()
      await swatches(w)[1].trigger('click')
      expect(store.accent).toBe(THEME_ACCENTS[1])
      expect(swatches(w)[1].attributes('aria-checked')).toBe('true')
    })

    it('arrow keys move selection and focus, wrapping around', async () => {
      const { w, store } = make({}, 'default')
      await settle()
      await swatches(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.accent).toBe(THEME_ACCENTS[1])
      expect(document.activeElement).toBe(swatches(w)[1].element)
      await swatches(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      await swatches(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.accent).toBe(THEME_ACCENTS[LAST])
      await swatches(w)[LAST].trigger('keydown', { key: 'ArrowDown' })
      expect(store.accent).toBe('default')
      await swatches(w)[0].trigger('keydown', { key: 'ArrowUp' })
      expect(store.accent).toBe(THEME_ACCENTS[LAST])
    })

    it('Home and End jump to the ends', async () => {
      const { w, store } = make({}, THEME_ACCENTS[3])
      await settle()
      await swatches(w)[3].trigger('keydown', { key: 'Home' })
      expect(store.accent).toBe('default')
      await swatches(w)[0].trigger('keydown', { key: 'End' })
      expect(store.accent).toBe(THEME_ACCENTS[LAST])
    })

    it('other keys do nothing', async () => {
      const { w, store } = make({}, 'rose')
      await swatches(w)[2].trigger('keydown', { key: 'a' })
      expect(store.accent).toBe('rose')
    })

    it('swatch colours are preset-specific, not the live primary token', () => {
      const { w } = make()
      expect(swatches(w)[2].classes().join(' ')).toContain('oklch(0.485_0.13_160)')
      expect(swatches(w).some((s) => s.classes().includes('bg-primary'))).toBe(false)
    })
  })

  describe('customisation', () => {
    it('limits and orders accents; ignores unknown names', () => {
      const { w } = make({ accents: ['indigo', 'nope', 'default'] })
      expect(swatches(w).map((s) => s.attributes('data-accent'))).toEqual(['indigo', 'default'])
    })

    it('custom label, class merge and attrs', () => {
      const { w } = make({ label: 'Farbe', class: 'gap-4 custom-x' })
      expect(w.attributes('aria-label')).toBe('Farbe')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('gap-4')
      expect(w.classes()).not.toContain('gap-2')
    })
  })

  describe('bad path', () => {
    it('empty or invalid accents render an empty group', () => {
      expect(swatches(make({ accents: [] }).w)).toHaveLength(0)
      expect(swatches(make({ accents: 'emerald' }).w)).toHaveLength(0)
    })

    it('when the store accent is not offered the first swatch is the tab stop and none is checked', () => {
      const { w } = make({ accents: ['emerald', 'rose'] }, 'indigo')
      expect(swatches(w).map((s) => s.attributes('tabindex'))).toEqual(['0', '-1'])
      expect(swatches(w).every((s) => s.attributes('aria-checked') === 'false')).toBe(true)
    })

    it('keyboard handling is safe with an empty group (no swatches to receive keys)', () => {
      const { w } = make({ accents: [] })
      expect(w.findAll('button')).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('rapid clicks on different swatches end on the last one', async () => {
      const { w, store } = make()
      await settle()
      for (const i of [1, 2, 3, 4, 5]) await swatches(w)[i].trigger('click')
      await nextTick()
      expect(store.accent).toBe(THEME_ACCENTS[5])
      expect(swatches(w).filter((s) => s.attributes('aria-checked') === 'true')).toHaveLength(1)
    })

    it('a single accent still works with arrow keys', async () => {
      const { w, store } = make({ accents: ['rose'] }, 'rose')
      await swatches(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.accent).toBe('rose')
    })

    it('unmounts cleanly', () => {
      expect(() => make().w.unmount()).not.toThrow()
    })
  })
})
