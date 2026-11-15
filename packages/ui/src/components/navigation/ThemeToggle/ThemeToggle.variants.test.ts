import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { faDesktop, faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { nextTick } from 'vue'
import { cn } from '../../../lib/cn'
import { useThemeStore } from '../../../stores/theme'
import ThemeToggle from './ThemeToggle.vue'
import { THEME_TOGGLE_SIZES, THEME_TOGGLE_VARIANTS, themeSegmentVariants, themeSwitchThumbVariants, themeSwitchVariants } from './index'

beforeEach(() => localStorage.clear())
function make(props: Record<string, unknown> = {}, mode?: 'light' | 'dark' | 'system', attachTo?: HTMLElement) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (mode) store.setMode(mode)
  const w = mount(ThemeToggle, { props, global: { plugins: [pinia] }, attachTo })
  return { w, store }
}
const path = (el: { find: (s: string) => { attributes: (n: string) => string | undefined } }) => el.find('svg path').attributes('d')
const radios = (w: ReturnType<typeof make>['w']) => w.findAll('[role="radio"]')

describe('ThemeToggle variants', () => {
  describe('size on icon and button', () => {
    it('icon: sm, md and lg use 24px, 36px and 44px squares (md is the default)', () => {
      expect(make({ size: 'sm' }, 'light').w.classes()).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:min-h-10', 'pointer-coarse:min-w-10']))
      expect(make({}, 'light').w.classes()).toContain('size-9')
      expect(make({}, 'light').w.attributes('data-size')).toBe('md')
      expect(make({ size: 'lg' }, 'light').w.classes()).toContain('size-11')
    })

    it('button: scales the outline button and still shows the mode name', () => {
      const sm = make({ variant: 'button', size: 'sm' }, 'dark').w
      expect(sm.classes()).toContain('h-8')
      expect(sm.get('[data-slot="theme-toggle-label"]').text()).toBe('Dark')
      expect(make({ variant: 'button' }, 'dark').w.classes()).toContain('h-9')
      expect(make({ variant: 'button', size: 'lg' }, 'dark').w.classes()).toContain('h-11')
    })

    it('unknown size and variant fall back to the default icon button', () => {
      const { w } = make({ size: 'xl', variant: 'chip' }, 'light')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-variant')).toBe('icon')
      expect(w.classes()).toContain('size-9')
      expect(w.attributes('aria-label')).toBe('Theme: Light. Switch to dark.')
    })
  })

  describe('switch', () => {
    it('renders a named switch whose state is the resolved dark mode', () => {
      const light = make({ variant: 'switch' }, 'light').w
      expect(light.element.tagName).toBe('BUTTON')
      expect(light.attributes('role')).toBe('switch')
      expect(light.attributes('aria-label')).toBe('Dark mode')
      expect(light.attributes('aria-checked')).toBe('false')
      expect(light.attributes('data-slot')).toBe('theme-toggle')
      expect(light.attributes('data-mode')).toBe('light')
      expect(make({ variant: 'switch' }, 'dark').w.attributes('aria-checked')).toBe('true')
    })

    it('shows a sun on the thumb in light mode and a moon in dark mode, thumb shifted', () => {
      const light = make({ variant: 'switch' }, 'light').w
      expect(path(light)).toBe(faSun.icon[4])
      expect(light.get('[data-slot="theme-toggle-thumb"]').classes()).not.toContain('translate-x-5')
      const dark = make({ variant: 'switch' }, 'dark').w
      expect(path(dark)).toBe(faMoon.icon[4])
      expect(dark.get('[data-slot="theme-toggle-thumb"]').classes()).toEqual(expect.arrayContaining(['translate-x-5', 'rtl:-translate-x-5']))
      expect(dark.get('[data-slot="theme-toggle-thumb"]').attributes('aria-hidden')).toBe('true')
    })

    it('toggles between light and dark and never lands on system', async () => {
      const { w, store } = make({ variant: 'switch' }, 'system')
      await w.trigger('click')
      expect(['light', 'dark']).toContain(store.mode)
      const first = store.mode
      await w.trigger('click')
      await nextTick()
      expect(store.mode).not.toBe(first)
      expect(w.attributes('aria-checked')).toBe(String(store.isDark))
    })

    it('uses a custom label and sizes the track and thumb', () => {
      expect(make({ variant: 'switch', label: 'Use dark theme' }).w.attributes('aria-label')).toBe('Use dark theme')
      expect(make({ variant: 'switch', label: '  ' }).w.attributes('aria-label')).toBe('Dark mode')
      expect(make({ variant: 'switch', size: 'sm' }).w.classes()).toEqual(expect.arrayContaining(['h-5', 'w-9']))
      expect(make({ variant: 'switch' }).w.classes()).toEqual(expect.arrayContaining(['h-6', 'w-11']))
      expect(make({ variant: 'switch', size: 'lg' }).w.classes()).toEqual(expect.arrayContaining(['h-7', 'w-13']))
      expect(make({ variant: 'switch', size: 'lg' }, 'dark').w.get('[data-slot="theme-toggle-thumb"]').classes()).toEqual(expect.arrayContaining(['size-6', 'translate-x-6']))
    })

    it('has a focus ring, a 24px+ hit area, forced-colors border and reduced motion', () => {
      const cls = make({ variant: 'switch' }).w.classes()
      expect(cls).toContain('focus-visible:ring-3')
      expect(cls).toContain('after:-inset-y-1')
      expect(cls).toContain('pointer-coarse:after:-inset-y-3')
      expect(cls).toContain('forced-colors:border-[ButtonText]')
      expect(cls).toContain('motion-safe:transition-colors')
      expect(cls).toContain('aria-checked:bg-primary')
    })

    it('class wins over the track classes', () => {
      expect(make({ variant: 'switch', class: 'w-20 custom-x' }).w.classes()).toEqual(expect.arrayContaining(['w-20', 'custom-x']))
    })

    it('exported variants merge through cn()', () => {
      expect(cn(themeSwitchVariants({ size: 'lg' }))).toContain('w-13')
      expect(themeSwitchThumbVariants({ size: 'sm', checked: true })).toContain('translate-x-4')
      expect(themeSwitchThumbVariants()).not.toContain('translate-x')
    })
  })

  describe('segmented', () => {
    it('renders a named radio group with one radio per mode and the current one checked', () => {
      const { w } = make({ variant: 'segmented' }, 'dark')
      expect(w.attributes('role')).toBe('radiogroup')
      expect(w.attributes('aria-label')).toBe('Theme')
      expect(w.attributes('data-mode')).toBe('dark')
      expect(radios(w).map((r) => r.attributes('aria-label'))).toEqual(['Light', 'Dark', 'System'])
      expect(radios(w).map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
      expect(radios(w).map((r) => r.attributes('data-mode-option'))).toEqual(['light', 'dark', 'system'])
      expect(radios(w).map((r) => path(r))).toEqual([faSun.icon[4], faMoon.icon[4], faDesktop.icon[4]])
    })

    it('is a single tab stop on the selected radio and stays reachable for an unknown stored mode', () => {
      const { w } = make({ variant: 'segmented' }, 'system')
      expect(radios(w).map((r) => r.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    })

    it('selects a mode on click and updates the checked state', async () => {
      const { w, store } = make({ variant: 'segmented' }, 'light')
      await radios(w)[2].trigger('click')
      expect(store.mode).toBe('system')
      expect(radios(w)[2].attributes('aria-checked')).toBe('true')
      expect(w.attributes('data-mode')).toBe('system')
    })

    it('arrow keys move selection and focus, wrap, and Home/End jump', async () => {
      const host = document.createElement('div')
      document.body.appendChild(host)
      const { w, store } = make({ variant: 'segmented' }, 'light', host)
      await radios(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(store.mode).toBe('dark')
      expect(document.activeElement).toBe(radios(w)[1].element)
      await radios(w)[1].trigger('keydown', { key: 'ArrowDown' })
      expect(store.mode).toBe('system')
      await radios(w)[2].trigger('keydown', { key: 'ArrowRight' })
      expect(store.mode).toBe('light')
      await radios(w)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.mode).toBe('system')
      await radios(w)[2].trigger('keydown', { key: 'ArrowUp' })
      expect(store.mode).toBe('dark')
      await radios(w)[1].trigger('keydown', { key: 'Home' })
      expect(store.mode).toBe('light')
      await radios(w)[0].trigger('keydown', { key: 'End' })
      expect(store.mode).toBe('system')
      await radios(w)[2].trigger('keydown', { key: 'a' })
      expect(store.mode).toBe('system')
      w.unmount()
      host.remove()
    })

    it('Left and Right swap in a right-to-left group', async () => {
      const host = document.createElement('div')
      host.setAttribute('dir', 'rtl')
      document.body.appendChild(host)
      const { w, store } = make({ variant: 'segmented' }, 'dark', host)
      await radios(w)[1].trigger('keydown', { key: 'ArrowLeft' })
      expect(store.mode).toBe('system')
      await radios(w)[2].trigger('keydown', { key: 'ArrowRight' })
      expect(store.mode).toBe('dark')
      w.unmount()
      host.remove()
    })

    it('scales the radios (24px, 32px, 40px, grown on coarse pointers)', () => {
      const sm = radios(make({ variant: 'segmented', size: 'sm' }).w)[0].classes()
      expect(sm).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:size-10']))
      expect(radios(make({ variant: 'segmented' }).w)[0].classes()).toEqual(expect.arrayContaining(['size-8', 'pointer-coarse:size-11']))
      expect(radios(make({ variant: 'segmented', size: 'lg' }).w)[0].classes()).toContain('size-10')
      expect(themeSegmentVariants({ size: 'lg' })).toContain('[&_svg]:size-5')
    })

    it('marks the selected radio by more than colour: a raised surface and a forced-colors underline', () => {
      const cls = radios(make({ variant: 'segmented' }, 'light').w)[0].classes()
      expect(cls).toEqual(expect.arrayContaining(['aria-checked:bg-background', 'aria-checked:shadow-sm', 'forced-colors:aria-checked:underline', 'focus-visible:ring-3']))
    })

    it('custom label names the group and class lands on it', () => {
      const { w } = make({ variant: 'segmented', label: 'Colour scheme', class: 'mx-auto' })
      expect(w.attributes('aria-label')).toBe('Colour scheme')
      expect(w.classes()).toContain('mx-auto')
      expect(w.classes()).toContain('bg-muted')
    })
  })

  describe('every variant', () => {
    it('renders different markup and keeps data-slot and data-mode on the root', () => {
      const html = new Set<string>()
      for (const variant of THEME_TOGGLE_VARIANTS) {
        const { w } = make({ variant }, 'light')
        expect(w.attributes('data-slot')).toBe('theme-toggle')
        expect(w.attributes('data-mode')).toBe('light')
        expect(w.attributes('data-variant')).toBe(variant)
        html.add(w.html())
      }
      expect(html.size).toBe(4)
    })

    it('every size renders different markup in every variant', () => {
      for (const variant of THEME_TOGGLE_VARIANTS) expect(new Set(THEME_TOGGLE_SIZES.map((size) => make({ variant, size }, 'light').w.html())).size, variant).toBe(3)
    })
  })
})
