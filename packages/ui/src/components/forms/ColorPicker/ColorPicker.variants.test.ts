import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ColorPicker from './ColorPicker.vue'
import Field from '../Field/Field.vue'
import * as barrel from './index'
import {
  COLOR_PICKER_LAYOUTS,
  COLOR_PICKER_SHAPES,
  COLOR_PICKER_SIZES,
  colorPickerFieldVariants,
  colorPickerSwatchListVariants,
  colorPickerSwatchVariants,
  colorPickerVariants,
  normalizeColorPickerLayout,
  normalizeColorPickerShape,
  normalizeColorPickerSize,
} from './variants'

type W = ReturnType<typeof mount>
const root = (w: W) => w.find('[data-slot=color-picker]')
const list = (w: W) => w.find('[data-slot=color-picker-swatches]')
const swatches = (w: W) => w.findAll('[data-slot=color-picker-swatch]')
const preview = (w: W) => w.find('[data-slot=color-picker-preview]')
const field = (w: W) => w.find('[data-slot=color-picker-field]')
const input = (w: W) => w.find('input[data-slot=color-picker-input]')
const base = { modelValue: '#22c55e', swatches: ['#22c55e', '#ef4444', '#3b82f6'] }
const make = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => mount(ColorPicker, { props: { ...base, ...props }, attrs })

describe('ColorPicker variations', () => {
  describe('defaults', () => {
    it('keeps the original root, swatch list, swatch, preview and field classes', () => {
      const w = make()
      expect(root(w).classes().join(' ')).toBe('inline-flex w-full max-w-xs flex-col gap-3')
      expect(list(w).classes().join(' ')).toBe('flex flex-wrap gap-2')
      expect(field(w).classes().join(' ')).toBe('min-w-0')
      expect(swatches(w)[0].classes()).toEqual(expect.arrayContaining(['relative', 'shrink-0', 'rounded-md', 'border', 'border-border', 'size-8', 'aria-checked:ring-2', 'pointer-coarse:min-h-11']))
      expect(preview(w).classes()).toEqual(expect.arrayContaining(['rounded-md', 'size-8', 'pointer-coarse:min-h-0']))
    })

    it('keeps the stacked order: swatches first, then the hex field', () => {
      const w = make()
      const kids = [...root(w).element.children].map((c) => c.getAttribute('data-slot'))
      expect(kids).toEqual(['color-picker-swatches', 'color-picker-field'])
    })
  })

  describe('shape', () => {
    it.each([
      ['rounded', 'rounded-md'],
      ['square', 'rounded-none'],
      ['circle', 'rounded-full'],
    ])('%s gives every swatch and the preview chip %s', (shape, cls) => {
      const w = make({ shape })
      for (const s of swatches(w)) expect(s.classes()).toContain(cls)
      expect(preview(w).classes()).toContain(cls)
      for (const other of ['rounded-md', 'rounded-none', 'rounded-full'].filter((c) => c !== cls)) {
        expect(swatches(w)[0].classes()).not.toContain(other)
        expect(preview(w).classes()).not.toContain(other)
      }
    })

    it('keeps the checked ring, the forced-colors outline and the focus ring for every shape', () => {
      for (const shape of COLOR_PICKER_SHAPES) {
        const c = swatches(make({ shape }))[0].classes()
        expect(c).toEqual(
          expect.arrayContaining(['aria-checked:ring-2', 'aria-checked:ring-offset-2', 'forced-colors:aria-checked:outline-2', 'forced-colors:focus-visible:outline-2', 'focus-visible:ring-3', 'forced-color-adjust-none']),
        )
      }
    })

    it('the checked swatch widens its ring on keyboard focus, so focus stays visible on the one tab stop', () => {
      for (const shape of COLOR_PICKER_SHAPES) {
        expect(swatches(make({ shape }))[0].classes()).toEqual(expect.arrayContaining(['aria-checked:ring-2', 'aria-checked:focus-visible:ring-4']))
      }
    })

    it('falls back to rounded for an unknown shape', () => {
      expect(swatches(make({ shape: 'hexagon' }))[0].classes()).toContain('rounded-md')
      expect(normalizeColorPickerShape('hexagon')).toBe('rounded')
    })

    it('the checked swatch is still aria-checked and selection still emits in every shape', async () => {
      for (const shape of COLOR_PICKER_SHAPES) {
        const w = make({ shape })
        expect(swatches(w).map((s) => s.attributes('aria-checked'))).toEqual(['true', 'false', 'false'])
        await swatches(w)[1].trigger('click')
        expect(w.emitted('update:modelValue')?.[0]).toEqual(['#ef4444'])
      }
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'size-6', 'h-8', 'text-sm'],
      ['md', 'size-8', 'h-9', undefined],
      ['lg', 'size-10', 'h-11', 'text-md'],
    ])('%s sets the swatch %s, input %s and root text %s', (size, swatch, inputH, text) => {
      const w = make({ size })
      expect(swatches(w)[0].classes()).toContain(swatch)
      expect(preview(w).classes()).toContain(swatch)
      expect(input(w).classes()).toContain(inputH)
      if (text) expect(root(w).classes()).toContain(text)
    })

    it('falls back to md for an unknown size, in the swatches and the input', () => {
      const w = make({ size: 'huge' })
      expect(swatches(w)[0].classes()).toContain('size-8')
      expect(input(w).classes()).toContain('h-9')
      expect(normalizeColorPickerSize('huge')).toBe('md')
    })

    it('size combines with shape on the swatch', () => {
      const c = swatches(make({ size: 'lg', shape: 'circle' }))[0].classes()
      expect(c).toEqual(expect.arrayContaining(['size-10', 'rounded-full']))
      expect(c).not.toContain('size-8')
    })
  })

  describe('layout', () => {
    it('inline puts the swatches and the hex field on one wrapping row', () => {
      const w = make({ layout: 'inline' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap', 'items-center', 'max-w-lg']))
      expect(root(w).classes()).not.toContain('flex-col')
      expect(root(w).classes()).not.toContain('max-w-xs')
      expect(field(w).classes()).toEqual(expect.arrayContaining(['min-w-40', 'flex-1']))
      expect(list(w).classes()).toContain('gap-2')
    })

    it('compact is a denser row with a narrow field', () => {
      const w = make({ layout: 'compact' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap', 'items-center', 'max-w-md', 'gap-2']))
      expect(root(w).classes()).not.toContain('gap-3')
      expect(list(w).classes()).toContain('gap-1')
      expect(list(w).classes()).not.toContain('gap-2')
      expect(field(w).classes()).toEqual(expect.arrayContaining(['w-32', 'shrink-0']))
    })

    it('keeps the DOM order (swatches then field) so reading and tab order do not change', () => {
      for (const layout of COLOR_PICKER_LAYOUTS) {
        const kids = [...root(make({ layout })).element.children].map((c) => c.getAttribute('data-slot'))
        expect(kids).toEqual(['color-picker-swatches', 'color-picker-field'])
      }
    })

    it('falls back to stacked for an unknown layout', () => {
      expect(root(make({ layout: 'grid' })).classes()).toContain('flex-col')
      expect(normalizeColorPickerLayout('grid')).toBe('stacked')
    })

    it('every layout works without swatches and without the input', () => {
      for (const layout of COLOR_PICKER_LAYOUTS) {
        expect(list(make({ layout, swatches: [] })).exists()).toBe(false)
        expect(field(make({ layout, showInput: false })).exists()).toBe(false)
        expect(swatches(make({ layout, showInput: false }))).toHaveLength(3)
      }
    })

    it('every layout keeps the radiogroup, the radios and the input names', () => {
      for (const layout of COLOR_PICKER_LAYOUTS) {
        const w = make({ layout })
        expect(list(w).attributes('role')).toBe('radiogroup')
        expect(list(w).attributes('aria-label')).toBe('Colour swatches')
        expect(swatches(w).every((s) => s.attributes('role') === 'radio' && !!s.attributes('aria-label'))).toBe(true)
        expect(input(w).attributes('aria-label')).toBe('Hex colour')
      }
    })
  })

  describe('keyboard and behaviour stay the same in every variation', () => {
    it.each([
      ['circle + compact', { shape: 'circle', layout: 'compact' }],
      ['square + inline + lg', { shape: 'square', layout: 'inline', size: 'lg' }],
    ])('%s: arrow keys, Home and End move and select', async (_n, props) => {
      const w = make(props)
      await swatches(w)[0].trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['#ef4444'])
      await swatches(w)[1].trigger('keydown', { key: 'End' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['#3b82f6'])
      await swatches(w)[2].trigger('keydown', { key: 'Home' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['#22c55e'])
      await input(w).setValue('#fff')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['#ffffff'])
    })

    it('disabled and readonly still block changes in a non-default look', async () => {
      const d = make({ shape: 'circle', layout: 'compact', disabled: true })
      expect(swatches(d).every((s) => s.attributes('disabled') !== undefined)).toBe(true)
      const r = make({ shape: 'circle', layout: 'inline', readonly: true })
      await swatches(r)[1].trigger('click')
      expect(r.emitted('update:modelValue')).toBeUndefined()
      expect(list(r).attributes('aria-readonly')).toBe('true')
    })

    it('an empty value keeps the muted preview chip in the chosen shape', () => {
      const w = make({ modelValue: null, shape: 'circle' })
      expect(preview(w).attributes('data-empty')).toBeDefined()
      expect(preview(w).classes()).toContain('rounded-full')
    })

    it('the preview chip stays decorative', () => {
      expect(preview(make({ shape: 'square' })).attributes('aria-hidden')).toBe('true')
    })

    it('in a Field the Field label still names the hex input in a compact layout', async () => {
      const w = mount({ components: { Field, ColorPicker }, template: '<Field label="Brand colour" id="cp"><ColorPicker layout="compact" shape="circle" model-value="#22c55e" /></Field>' })
      await nextTick()
      expect(input(w).attributes('aria-label')).toBeUndefined()
      expect(input(w).attributes('id')).toBe('cp')
    })
  })

  describe('class and attributes', () => {
    it('class wins over the layout classes on the root', () => {
      const w = make({ layout: 'inline', class: 'max-w-sm flex-col' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['max-w-sm', 'flex-col']))
      expect(root(w).classes()).not.toContain('max-w-lg')
      expect(root(w).classes()).not.toContain('flex-row')
    })

    it('passes attributes to the root', () => {
      expect(root(make({ shape: 'circle' }, { 'data-x': '1' })).attributes('data-x')).toBe('1')
    })
  })

  describe('variant helpers and exports', () => {
    it('exports the value lists and helpers from the barrel', () => {
      expect(barrel.COLOR_PICKER_SHAPES).toEqual(['rounded', 'square', 'circle'])
      expect(barrel.COLOR_PICKER_LAYOUTS).toEqual(['stacked', 'inline', 'compact'])
      expect(barrel.COLOR_PICKER_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(barrel.colorPickerSwatchListVariants).toBe(colorPickerSwatchListVariants)
      expect(barrel.colorPickerFieldVariants).toBe(colorPickerFieldVariants)
    })

    it('helpers return plain strings, replace conflicting classes and let class win', () => {
      expect(colorPickerVariants()).toBe('inline-flex w-full max-w-xs flex-col gap-3')
      expect(colorPickerVariants({ layout: 'inline', size: 'lg' })).toContain('text-md')
      expect(colorPickerVariants({ layout: 'compact', class: 'gap-6' })).toContain('gap-6')
      expect(colorPickerSwatchVariants({ shape: 'circle', size: 'sm' })).toEqual(expect.stringContaining('rounded-full'))
      expect(colorPickerSwatchVariants({ shape: 'circle' })).not.toContain('rounded-md')
      expect(colorPickerSwatchListVariants({ layout: 'compact' })).toBe('flex flex-wrap gap-1')
      expect(colorPickerFieldVariants({ layout: 'compact' })).toBe('min-w-0 w-32 shrink-0')
      for (const size of COLOR_PICKER_SIZES) expect(colorPickerSwatchVariants({ size })).toBeTruthy()
    })
  })
})
