import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { faDesktop, faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { nextTick } from 'vue'
import { useThemeStore } from '../../../stores/theme'
import ThemeToggle from './ThemeToggle.vue'

const settle = () => new Promise((r) => setTimeout(r, 5))
function make(props: Record<string, unknown> = {}, mode?: 'light' | 'dark' | 'system') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (mode) store.setMode(mode)
  const w = mount(ThemeToggle, { props, global: { plugins: [pinia] } })
  return { w, store }
}
const PATHS = new Map<string, string>([
  [faSun.icon[4] as string, 'sun'],
  [faMoon.icon[4] as string, 'moon'],
  [faDesktop.icon[4] as string, 'desktop'],
])
const icon = (w: ReturnType<typeof mount>) => PATHS.get(w.find('svg path').attributes('d') ?? '')

beforeEach(() => {
  localStorage.clear()
})

describe('ThemeToggle', () => {
  describe('good path', () => {
    it('renders an icon button with data-slot and the current mode icon', () => {
      const { w } = make({}, 'light')
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('data-slot')).toBe('theme-toggle')
      expect(w.attributes('data-mode')).toBe('light')
      expect(icon(w)).toBe('sun')
      expect(w.find('[data-slot="theme-toggle-label"]').exists()).toBe(false)
    })

    it('shows sun / moon / desktop per mode', () => {
      expect(icon(make({}, 'light').w)).toBe('sun')
      expect(icon(make({}, 'dark').w)).toBe('moon')
      expect(icon(make({}, 'system').w)).toBe('desktop')
    })

    it('aria-label announces the NEXT mode', () => {
      expect(make({}, 'light').w.attributes('aria-label')).toBe('Theme: Light. Switch to dark.')
      expect(make({}, 'dark').w.attributes('aria-label')).toBe('Theme: Dark. Switch to system.')
      expect(make({}, 'system').w.attributes('aria-label')).toBe('Theme: System. Switch to light.')
      expect(make({}, 'light').w.attributes('title')).toBe('Theme: Light. Switch to dark.')
    })

    it('cycles light → dark → system → light on click and updates icon + label', async () => {
      const { w, store } = make({}, 'light')
      await settle()
      const seen: string[] = []
      for (let i = 0; i < 3; i++) {
        await w.trigger('click')
        await nextTick()
        seen.push(`${store.mode}:${icon(w)}:${w.attributes('aria-label')}`)
      }
      expect(seen).toEqual(['dark:moon:Theme: Dark. Switch to system.', 'system:desktop:Theme: System. Switch to light.', 'light:sun:Theme: Light. Switch to dark.'])
    })

    it('button variant shows the current mode name and an outline style', () => {
      const { w } = make({ variant: 'button' }, 'dark')
      expect(w.find('[data-slot="theme-toggle-label"]').text()).toBe('Dark')
      expect(w.classes()).toContain('border')
      expect(w.classes()).not.toContain('size-9')
    })
  })

  describe('customisation', () => {
    it('merges class and passes attrs', () => {
      const { w } = make({ class: 'size-12 custom-x' }, 'light')
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('size-12')
      expect(w.classes()).not.toContain('size-9')
      const m = mount(ThemeToggle, { attrs: { 'data-test': 't' }, global: { plugins: [createPinia()] } })
      expect(m.attributes('data-test')).toBe('t')
    })

    it('icon variant is ghost and square', () => {
      const { w } = make({}, 'light')
      expect(w.classes()).toContain('size-9')
      expect(w.classes()).toContain('hover:bg-accent')
    })
  })

  describe('bad path', () => {
    it('unknown variant behaves as the icon variant', () => {
      const { w } = make({ variant: 'zzz' }, 'light')
      expect(w.find('[data-slot="theme-toggle-label"]').exists()).toBe(false)
    })

    it('a store in an unexpected mode falls back to the system presentation', () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      const store = useThemeStore()
      // @ts-expect-error corrupt state on purpose
      store.mode = 'bogus'
      const w = mount(ThemeToggle, { global: { plugins: [pinia] } })
      expect(icon(w)).toBe('desktop')
      expect(w.attributes('aria-label')).toBe('Theme: System. Switch to light.')
    })
  })

  describe('edge cases', () => {
    it('rapid clicks keep store and UI consistent (3 full cycles)', async () => {
      const { w, store } = make({}, 'light')
      await settle()
      for (let i = 0; i < 9; i++) await w.trigger('click')
      await nextTick()
      expect(store.mode).toBe('light')
      expect(icon(w)).toBe('sun')
    })

    it('two toggles share the same store', async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      useThemeStore().setMode('light')
      const a = mount(ThemeToggle, { global: { plugins: [pinia] } })
      const b = mount(ThemeToggle, { global: { plugins: [pinia] } })
      await settle()
      await a.trigger('click')
      await nextTick()
      expect(b.attributes('data-mode')).toBe('dark')
    })

    it('unmounts cleanly', () => {
      const { w } = make({}, 'light')
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
