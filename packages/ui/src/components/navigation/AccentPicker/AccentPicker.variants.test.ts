import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { cn } from '../../../lib/cn'
import { THEME_ACCENTS, useThemeStore, type ThemeAccent } from '../../../stores/theme'
import AccentPicker from './AccentPicker.vue'
import { ACCENT_PICKER_LAYOUTS, ACCENT_PICKER_SHAPES, ACCENT_PICKER_SIZES, ACCENT_ROW, accentPickerVariants, accentSwatchVariants } from './index'

function make(props: Record<string, unknown> = {}, accent?: ThemeAccent) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useThemeStore()
  if (accent) store.setAccent(accent)
  const w = mount(AccentPicker, { props, global: { plugins: [pinia] }, attachTo: document.body })
  return { w, store }
}
const swatches = (w: ReturnType<typeof make>['w']) => w.findAll('[data-slot="accent-picker-swatch"]')

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('AccentPicker variations', () => {
  it('defaults keep today\'s classes: a wrapping row of 24px circles', () => {
    const { w } = make({}, 'rose')
    expect(w.attributes('data-layout')).toBe('inline')
    expect(w.attributes('data-shape')).toBe('circle')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'items-center', 'gap-2']))
    const first = swatches(w)[0].classes()
    expect(first).toEqual(expect.arrayContaining(['size-6', 'shrink-0', 'cursor-pointer', 'rounded-full', 'ring-offset-2', 'ring-offset-background', 'pointer-coarse:size-8', 'hover:ring-2', 'hover:ring-border', 'focus-visible:ring-3']))
    expect(swatches(w).find((s) => s.attributes('data-accent') === 'rose')!.classes()).toEqual(expect.arrayContaining(['ring-2', 'ring-foreground']))
  })

  describe('shape', () => {
    it('rounded and square replace the circle radius', () => {
      const rounded = swatches(make({ shape: 'rounded' }).w)[0].classes()
      expect(rounded).toContain('rounded-md')
      expect(rounded).not.toContain('rounded-full')
      const square = swatches(make({ shape: 'square' }).w)[0].classes()
      expect(square).toContain('rounded-none')
      expect(square).not.toContain('rounded-full')
    })

    it('unknown shape falls back to circle; every shape differs', () => {
      expect(make({ shape: 'hex' }).w.attributes('data-shape')).toBe('circle')
      expect(swatches(make({ shape: 'hex' }).w)[0].classes()).toContain('rounded-full')
      expect(new Set(ACCENT_PICKER_SHAPES.map((shape) => swatches(make({ shape }).w)[0].classes().join(' '))).size).toBe(3)
    })
  })

  describe('size', () => {
    it.each([
      ['md', 'size-6', 'pointer-coarse:size-8'],
      ['lg', 'size-8', 'pointer-coarse:size-10'],
      ['xl', 'size-10', 'pointer-coarse:size-11'],
    ])('%s uses %s and %s on coarse pointers', (size, cls, coarse) => {
      const s = swatches(make({ size }).w)[0].classes()
      expect(s).toContain(cls)
      expect(s).toContain(coarse)
      if (size !== 'md') expect(s).not.toContain('size-6')
    })

    it('never goes below the 24px target size', () => {
      for (const size of ACCENT_PICKER_SIZES) expect(accentSwatchVariants({ size }).includes('size-5')).toBe(false)
      expect(make({ size: 'sm' }).w.attributes('data-size')).toBe('md')
    })

    it('unknown size falls back to md', () => {
      expect(swatches(make({ size: 'giant' }).w)[0].classes()).toContain('size-6')
    })
  })

  describe('layout', () => {
    it('grid shows three columns of swatches without names', () => {
      const { w } = make({ layout: 'grid' })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-3', 'gap-2']))
      expect(w.classes()).not.toContain('flex')
      expect(swatches(w)[0].text()).toBe('')
    })

    it('list renders a row per preset with the visible name, a swatch and a check on the chosen one', () => {
      const { w } = make({ layout: 'list' }, 'emerald')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col']))
      const rows = swatches(w)
      expect(rows).toHaveLength(THEME_ACCENTS.length)
      for (const c of ACCENT_ROW.split(' ')) expect(rows[0].classes(), c).toContain(c)
      expect(rows[0].text()).toBe('Default')
      expect(rows.find((r) => r.attributes('data-accent') === 'emerald')!.text()).toBe('Emerald')
      for (const row of rows) expect(row.find('[data-slot="accent-picker-swatch-color"]').exists()).toBe(true)
      expect(rows.map((r) => r.findAll('svg').length)).toEqual(THEME_ACCENTS.map((a) => (a === 'emerald' ? 1 : 0)))
      const color = rows[0].get('[data-slot="accent-picker-swatch-color"]')
      expect(color.classes()).toContain('size-6')
      expect(color.classes()).not.toContain('hover:ring-2')
      expect(color.attributes('aria-hidden')).toBe('true')
    })

    it('list keeps radio semantics, names that contain the visible text, roving tabindex and keys', async () => {
      const { w, store } = make({ layout: 'list' }, 'default')
      const rows = swatches(w)
      expect(rows.every((r) => r.attributes('role') === 'radio')).toBe(true)
      expect(rows.map((r) => r.attributes('aria-label'))).toEqual(rows.map((r) => r.text()))
      expect(rows.map((r) => r.attributes('tabindex'))).toEqual(THEME_ACCENTS.map((a) => (a === 'default' ? '0' : '-1')))
      await rows[0].trigger('keydown', { key: 'ArrowDown' })
      expect(store.accent).toBe(THEME_ACCENTS[1])
      await rows[2].trigger('click')
      expect(store.accent).toBe(THEME_ACCENTS[2])
      expect(swatches(w)[2].attributes('aria-checked')).toBe('true')
    })

    it('list rows are 24px+ tall, grow on touch screens and have a forced-colors marker', () => {
      const cls = swatches(make({ layout: 'list' }).w)[0].classes()
      expect(cls).toEqual(expect.arrayContaining(['py-1.5', 'text-sm', 'pointer-coarse:min-h-11', 'forced-colors:aria-checked:underline', 'aria-checked:bg-accent', 'focus-visible:ring-3']))
    })

    it('unknown layout falls back to inline; every layout differs', () => {
      expect(make({ layout: 'masonry' }).w.attributes('data-layout')).toBe('inline')
      expect(new Set(ACCENT_PICKER_LAYOUTS.map((layout) => make({ layout }).w.html())).size).toBe(3)
    })
  })

  describe('combinations and overrides', () => {
    it('shape, size and layout combine and still honour the accents subset', () => {
      const { w } = make({ shape: 'square', size: 'xl', layout: 'list', accents: ['indigo', 'rose', 'nope'] })
      expect(swatches(w).map((s) => s.attributes('data-accent'))).toEqual(['indigo', 'rose'])
      const color = swatches(w)[0].get('[data-slot="accent-picker-swatch-color"]')
      expect(color.classes()).toEqual(expect.arrayContaining(['size-10', 'rounded-none']))
    })

    it('class on the group wins', () => {
      const { w } = make({ layout: 'grid', class: 'grid-cols-2 w-full' })
      expect(w.classes()).toContain('grid-cols-2')
      expect(w.classes()).not.toContain('grid-cols-3')
    })

    it('a chosen swatch has a ring in every shape, and the group keeps its name', () => {
      for (const shape of ACCENT_PICKER_SHAPES) {
        const { w } = make({ shape }, 'amber')
        expect(w.attributes('aria-label')).toBe('Accent colour')
        expect(swatches(w).find((s) => s.attributes('data-accent') === 'amber')!.classes()).toContain('ring-2')
      }
    })

    it('exported variants merge through cn()', () => {
      expect(cn(accentSwatchVariants({ size: 'lg', shape: 'rounded' }))).toBe('shrink-0 ring-offset-2 ring-offset-background rounded-md size-8 pointer-coarse:size-10')
      expect(accentPickerVariants({ layout: 'grid' })).toContain('grid-cols-3')
    })
  })
})
