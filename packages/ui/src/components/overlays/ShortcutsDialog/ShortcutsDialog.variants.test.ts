import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useHotkeyRegistry } from '../../../lib/hotkeys'
import ShortcutsDialog from './ShortcutsDialog.vue'
import {
  normalizeShortcutsDialogDensity,
  normalizeShortcutsDialogHeadingLevel,
  normalizeShortcutsDialogLayout,
  normalizeShortcutsDialogSize,
  shortcutsDialogDensities,
  shortcutsDialogHeadingLevels,
  shortcutsDialogItemVariants,
  shortcutsDialogLayouts,
  shortcutsDialogSizes,
  shortcutsDialogVariants,
} from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
const wrappers: VueWrapper[] = []
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  expect(useHotkeyRegistry().value).toEqual([])
})
const q = (s: string) => document.body.querySelector(s) as HTMLElement
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]
async function make(props: Record<string, unknown> = {}) {
  const w = mount(ShortcutsDialog, {
    props: { title: 'Keys', open: true, hotkey: '', registered: false, shortcuts: [{ keys: 'mod+k', description: 'Search' }, { keys: 'g then d', description: 'Dashboard', group: 'Go' }], ...props } as never,
    attachTo: document.body,
  })
  wrappers.push(w)
  await nextTick()
  await nextTick()
  return w
}

describe('ShortcutsDialog variations', () => {
  it('lists the values', () => {
    expect(shortcutsDialogSizes).toEqual(['sm', 'md', 'lg', 'xl'])
    expect(shortcutsDialogLayouts).toEqual(['list', 'columns'])
    expect(shortcutsDialogDensities).toEqual(['comfortable', 'compact'])
    expect(shortcutsDialogHeadingLevels).toEqual([3, 4, 5, 6])
  })

  describe('default output is frozen', () => {
    it('body and row defaults', () => {
      expect(set(shortcutsDialogVariants())).toEqual(set('grid min-w-0 gap-6 grid-cols-[minmax(0,1fr)]'))
      expect(set(shortcutsDialogItemVariants())).toEqual(set('flex min-w-0 items-center justify-between gap-4 border-b border-border last:border-b-0 py-2 text-sm'))
    })
    it('renders the defaults', async () => {
      await make()
      expect(q('[data-slot="dialog-content"]').className).toContain('sm:max-w-lg')
      expect(q('[data-slot="shortcuts-dialog-body"]').dataset.layout).toBe('list')
      expect(q('[data-slot="shortcuts-dialog-item"]').dataset.density).toBe('comfortable')
      expect(q('[data-slot="shortcuts-dialog-group-title"]').tagName).toBe('H3')
      expect(q('[data-slot="kbd"]').className).toContain('h-6')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'sm:max-w-sm'],
      ['md', 'sm:max-w-lg'],
      ['lg', 'sm:max-w-2xl'],
      ['xl', 'sm:max-w-4xl'],
    ])('%s sets %s on the panel', async (size, cls) => {
      await make({ size })
      expect(q('[data-slot="dialog-content"]').classList.contains(cls)).toBe(true)
    })
    it('falls back to md', () => {
      for (const v of ['2xl', '', null, undefined, 3, {}]) expect(normalizeShortcutsDialogSize(v)).toBe('md')
    })
  })

  describe('layout', () => {
    it('list is one column', async () => {
      await make({ layout: 'list' })
      const cls = q('[data-slot="shortcuts-dialog-body"]').className
      expect(cls).toContain('grid-cols-[minmax(0,1fr)]')
      expect(cls).not.toContain('sm:grid-cols')
    })
    it('columns is two columns from sm and one below', async () => {
      await make({ layout: 'columns' })
      const body = q('[data-slot="shortcuts-dialog-body"]')
      expect(body.dataset.layout).toBe('columns')
      expect(body.className).toContain('sm:grid-cols-[repeat(2,minmax(0,1fr))]')
      expect(body.className).toContain('grid-cols-[minmax(0,1fr)]')
      expect(body.className).toContain('sm:gap-x-8')
    })
    it('falls back to list', () => {
      for (const v of ['grid', '', null, undefined, 1]) expect(normalizeShortcutsDialogLayout(v)).toBe('list')
    })
  })

  describe('density', () => {
    it('comfortable rows use py-2 text-sm and md chips', async () => {
      await make({ density: 'comfortable' })
      const row = q('[data-slot="shortcuts-dialog-item"]')
      expect(row.classList.contains('py-2')).toBe(true)
      expect(row.classList.contains('text-sm')).toBe(true)
      expect(q('[data-slot="kbd"]').classList.contains('h-6')).toBe(true)
    })
    it('compact rows use py-1 text-xs and sm chips', async () => {
      await make({ density: 'compact' })
      const rows = qa('[data-slot="shortcuts-dialog-item"]')
      for (const row of rows) {
        expect(row.classList.contains('py-1')).toBe(true)
        expect(row.classList.contains('text-xs')).toBe(true)
        expect(row.dataset.density).toBe('compact')
      }
      for (const kbd of qa('[data-slot="kbd"]')) expect(kbd.classList.contains('h-5')).toBe(true)
    })
    it('falls back to comfortable', () => {
      for (const v of ['dense', '', null, undefined]) expect(normalizeShortcutsDialogDensity(v)).toBe('comfortable')
    })
  })

  describe('headingLevel', () => {
    it.each([3, 4, 5, 6])('renders h%i', async (level) => {
      await make({ headingLevel: level })
      expect(q('[data-slot="shortcuts-dialog-group-title"]').tagName).toBe(`H${level}`)
    })
    it('falls back to 3 (the dialog title is an h2)', () => {
      for (const v of [1, 2, 7, '4', null, undefined]) expect(normalizeShortcutsDialogHeadingLevel(v)).toBe(3)
      expect(q('[data-slot="dialog-title"]')).toBeNull()
    })
  })

  describe('combinations', () => {
    it.each(shortcutsDialogSizes.flatMap((size) => shortcutsDialogLayouts.flatMap((layout) => shortcutsDialogDensities.map((density) => [size, layout, density] as const))))(
      'size %s, layout %s, density %s render together',
      async (size, layout, density) => {
        await make({ size, layout, density })
        expect(q('[data-slot="dialog-content"]').className).toContain(`sm:max-w-${{ sm: 'sm', md: 'lg', lg: '2xl', xl: '4xl' }[size]}`)
        expect(q('[data-slot="shortcuts-dialog-body"]').dataset.layout).toBe(layout)
        expect(q('[data-slot="shortcuts-dialog-item"]').dataset.density).toBe(density)
        expect(qa('[data-slot="shortcuts-dialog-item"]')).toHaveLength(2)
      },
    )
  })

  describe('class wins over variants', () => {
    it('keeps consumer classes after the variant classes', async () => {
      await make({ size: 'xl', class: 'sm:max-w-xs' })
      const cls = q('[data-slot="dialog-content"]').classList
      expect(cls.contains('sm:max-w-xs')).toBe(true)
      expect(cls.contains('sm:max-w-4xl')).toBe(false)
    })
  })

  describe('responsive, forced-colors and RTL expectations', () => {
    it('wraps long keys and text, keeps one column below sm, and uses no physical direction classes', async () => {
      await make({ layout: 'columns' })
      const html = q('[data-slot="dialog-content"]').outerHTML
      expect(q('[data-slot="shortcuts-dialog-keys"]').className).toContain('flex-wrap')
      expect(q('[data-slot="shortcuts-dialog-body"]').className).toContain('min-w-0')
      expect(html).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr)-\d/)
    })
    it('state is carried by text, not by colour: every row has a spoken form and a visible label', async () => {
      await make()
      for (const row of qa('[data-slot="shortcuts-dialog-item"]')) {
        expect(row.querySelector('[data-slot="shortcuts-dialog-label"]')?.textContent?.trim()).not.toBe('')
        expect(row.querySelector('.sr-only')?.textContent?.trim()).not.toBe('')
      }
    })
  })
})
