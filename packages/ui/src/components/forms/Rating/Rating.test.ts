import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Rating from './Rating.vue'
import Field from '../Field/Field.vue'
import { ratingVariants } from './variants'

const fills = (w: ReturnType<typeof mount>) => w.findAll('[data-slot=rating-star]').map((s) => Number(s.attributes('data-fill')))

/** jsdom has no layout: give every star a 20px wide box starting at x=0. */
function stubRect() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 20, width: 20, top: 0, bottom: 20, height: 20, x: 0, y: 0, toJSON: () => ({}) })
}

afterEach(() => vi.restoreAllMocks())

describe('Rating', () => {
  it('renders 5 stars and slider semantics by default', () => {
    const w = mount(Rating)
    const root = w.find('[data-slot=rating]')
    expect(root.attributes('role')).toBe('slider')
    expect(root.attributes('aria-valuemin')).toBe('0')
    expect(root.attributes('aria-valuemax')).toBe('5')
    expect(root.attributes('aria-valuenow')).toBe('0')
    expect(root.attributes('aria-valuetext')).toBe('0 out of 5')
    expect(root.attributes('tabindex')).toBe('0')
    expect(w.findAll('[data-slot=rating-star]')).toHaveLength(5)
    expect(w.findAll('svg')).toHaveLength(5)
  })

  it('reflects modelValue as filled stars', () => {
    expect(fills(mount(Rating, { props: { modelValue: 3 } }))).toEqual([100, 100, 100, 0, 0])
  })

  it('click sets the value and emits', async () => {
    const w = mount(Rating)
    await w.findAll('[data-slot=rating-star]')[3].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([4])
    expect(w.find('[data-slot=rating]').attributes('aria-valuenow')).toBe('4')
    expect(fills(w)).toEqual([100, 100, 100, 100, 0])
  })

  it('does not emit when clicking the current value (not clearable)', async () => {
    const w = mount(Rating, { props: { modelValue: 2 } })
    await w.findAll('[data-slot=rating-star]')[1].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('clearable: re-click on the same star resets to 0', async () => {
    const w = mount(Rating, { props: { modelValue: 2, clearable: true } })
    await w.findAll('[data-slot=rating-star]')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([0])
    expect(fills(w)).toEqual([0, 0, 0, 0, 0])
  })

  it('syncs when modelValue changes', async () => {
    const w = mount(Rating, { props: { modelValue: 1 } })
    await w.setProps({ modelValue: 4 })
    expect(fills(w)).toEqual([100, 100, 100, 100, 0])
  })

  describe('half stars', () => {
    it('left half of a star gives x.5, right half gives x', async () => {
      stubRect()
      const w = mount(Rating, { props: { allowHalf: true } })
      const star = w.findAll('[data-slot=rating-star]')[2]
      await star.trigger('click', { clientX: 5 })
      expect(w.emitted('update:modelValue')?.[0]).toEqual([2.5])
      expect(fills(w)).toEqual([100, 100, 50, 0, 0])
      await star.trigger('click', { clientX: 15 })
      expect(w.emitted('update:modelValue')?.[1]).toEqual([3])
    })

    it('rounds incoming values to half steps and ignores layout-less rects', async () => {
      const w = mount(Rating, { props: { allowHalf: true, modelValue: 2.3 } })
      expect(w.find('[data-slot=rating]').attributes('aria-valuenow')).toBe('2.5')
      // jsdom rect width is 0 -> full star
      await w.findAll('[data-slot=rating-star]')[0].trigger('click', { clientX: 0 })
      expect(w.emitted('update:modelValue')?.[0]).toEqual([1])
    })

    it('without allowHalf, fractions snap to whole stars', () => {
      expect(fills(mount(Rating, { props: { modelValue: 2.5 } }))).toEqual([100, 100, 100, 0, 0])
    })

    it('keyboard moves by 0.5', async () => {
      const w = mount(Rating, { props: { allowHalf: true, modelValue: 1 } })
      await w.find('[data-slot=rating]').trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')?.[0]).toEqual([1.5])
    })
  })

  describe('hover preview', () => {
    it('previews on mouse move and resets on leave without emitting', async () => {
      const w = mount(Rating, { props: { modelValue: 1 } })
      await w.findAll('[data-slot=rating-star]')[3].trigger('mousemove')
      expect(fills(w)).toEqual([100, 100, 100, 100, 0])
      await w.find('[data-slot=rating]').trigger('mouseleave')
      expect(fills(w)).toEqual([100, 0, 0, 0, 0])
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('keyboard', () => {
    const key = (w: ReturnType<typeof mount>, k: string) => w.find('[data-slot=rating]').trigger('keydown', { key: k })

    it('arrows, Home and End', async () => {
      const w = mount(Rating, { props: { modelValue: 2 } })
      await key(w, 'ArrowRight')
      await key(w, 'ArrowUp')
      await key(w, 'ArrowLeft')
      await key(w, 'ArrowDown')
      await key(w, 'End')
      await key(w, 'Home')
      expect(w.emitted('update:modelValue')?.map((e) => e[0])).toEqual([3, 4, 3, 2, 5, 0])
    })

    it('clamps at the ends and ignores other keys', async () => {
      const w = mount(Rating, { props: { modelValue: 5 } })
      await key(w, 'ArrowRight')
      await key(w, 'a')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      const z = mount(Rating)
      await key(z, 'ArrowLeft')
      expect(z.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('bad input', () => {
    it.each([
      [NaN, 0],
      [-3, 0],
      [99, 5],
      [Infinity, 0],
      [null, 0],
      [undefined, 0],
      ['4' as unknown as number, 4],
      ['abc' as unknown as number, 0],
    ])('clamps modelValue %s to %s', (input, expected) => {
      const w = mount(Rating, { props: { modelValue: input as number } })
      expect(w.find('[data-slot=rating]').attributes('aria-valuenow')).toBe(String(expected))
    })

    it.each([
      [NaN, 5],
      [0, 5],
      [-2, 5],
      [Infinity, 5],
      [3.9, 3],
      [10, 10],
    ])('max %s renders %s stars', (max, n) => {
      expect(mount(Rating, { props: { max } }).findAll('[data-slot=rating-star]')).toHaveLength(n)
    })

    it('caps absurd max at 100 stars', () => {
      expect(mount(Rating, { props: { max: 10000 } }).findAll('[data-slot=rating-star]')).toHaveLength(100)
    })

    it('max=1 works and value re-clamps when max shrinks', async () => {
      const w = mount(Rating, { props: { max: 5, modelValue: 5 } })
      await w.setProps({ max: 3 })
      expect(w.find('[data-slot=rating]').attributes('aria-valuenow')).toBe('3')
      expect(mount(Rating, { props: { max: 1 } }).findAll('[data-slot=rating-star]')).toHaveLength(1)
    })
  })

  describe('readonly / disabled', () => {
    it('readonly blocks click, hover and keys but stays focusable', async () => {
      const w = mount(Rating, { props: { readonly: true, modelValue: 2 } })
      const root = w.find('[data-slot=rating]')
      expect(root.attributes('aria-readonly')).toBe('true')
      expect(root.attributes('tabindex')).toBe('0')
      await w.findAll('[data-slot=rating-star]')[4].trigger('click')
      await w.findAll('[data-slot=rating-star]')[4].trigger('mousemove')
      await root.trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(fills(w)).toEqual([100, 100, 0, 0, 0])
    })

    it('disabled blocks everything and leaves tab order', async () => {
      const w = mount(Rating, { props: { disabled: true } })
      const root = w.find('[data-slot=rating]')
      expect(root.attributes('aria-disabled')).toBe('true')
      expect(root.attributes('tabindex')).toBe('-1')
      await w.findAll('[data-slot=rating-star]')[1].trigger('click')
      await root.trigger('keydown', { key: 'End' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(Rating, { props: { class: 'gap-4' }, attrs: { 'aria-label': 'Quality', 'data-test': 'x' } })
      const root = w.find('[data-slot=rating]')
      expect(root.classes()).toContain('gap-4')
      expect(root.classes()).not.toContain('gap-0.5')
      expect(root.attributes('aria-label')).toBe('Quality')
      expect(root.attributes('data-test')).toBe('x')
    })

    it('sizes use different star sizes; ratingVariants is reusable', () => {
      expect(mount(Rating, { props: { size: 'sm' } }).find('[data-slot=rating]').classes().join(' ')).toContain('size-4')
      expect(mount(Rating, { props: { size: 'lg' } }).find('[data-slot=rating]').classes().join(' ')).toContain('size-7')
      expect(ratingVariants()).toContain('size-5')
    })

    it('renders a hidden input when named', async () => {
      const w = mount(Rating, { props: { name: 'score', modelValue: 3 } })
      const input = w.find('input[type=hidden]')
      expect(input.attributes('name')).toBe('score')
      expect((input.element as HTMLInputElement).value).toBe('3')
      expect(mount(Rating).find('input').exists()).toBe(false)
    })

    it('invalid sets aria-invalid', () => {
      expect(mount(Rating, { props: { invalid: true } }).find('[data-slot=rating]').attributes('aria-invalid')).toBe('true')
      expect(mount(Rating).find('[data-slot=rating]').attributes('aria-invalid')).toBeUndefined()
    })

    it('wires into Field (id, invalid, disabled, required)', () => {
      const r = mount({ components: { Field, Rating }, template: '<Field label="Rate" error="Pick one" required disabled><Rating /></Field>' })
      const root = r.find('[data-slot=rating]')
      expect(root.attributes('aria-invalid')).toBe('true')
      // aria-required is not supported by role=slider, so it is not set (updated: previously pinned as 'true').
      expect(root.attributes('aria-required')).toBeUndefined()
      expect(root.attributes('aria-disabled')).toBe('true')
      expect(root.attributes('id')).toBeTruthy()
    })
  })

  describe('a11y regressions', () => {
    it('has a default accessible name when none is given, and a passed aria-label wins', () => {
      expect(mount(Rating).find('[data-slot=rating]').attributes('aria-label')).toBe('Rating')
      expect(mount(Rating, { attrs: { 'aria-label': 'Quality' } }).find('[data-slot=rating]').attributes('aria-label')).toBe('Quality')
    })

    it('is named by the Field label through aria-labelledby (label[for] cannot name a slider div)', async () => {
      const r = mount({ components: { Field, Rating }, template: '<Field label="Your rating"><Rating /></Field>' }, { attachTo: document.body })
      await r.vm.$nextTick()
      const root = r.find('[data-slot=rating]')
      const labelId = root.attributes('aria-labelledby')!
      expect(labelId).toBeTruthy()
      expect(document.getElementById(labelId)!.textContent).toContain('Your rating')
      expect(root.attributes('aria-label')).toBeUndefined()
      r.unmount()
    })

    it('keeps the default name when a Field has no label', async () => {
      const r = mount({ components: { Field, Rating }, template: '<Field><Rating /></Field>' }, { attachTo: document.body })
      await r.vm.$nextTick()
      expect(r.find('[data-slot=rating]').attributes('aria-label')).toBe('Rating')
      expect(r.find('[data-slot=rating]').attributes('aria-labelledby')).toBeUndefined()
      r.unmount()
    })

    it('PageUp and PageDown step by one whole star', async () => {
      const w = mount(Rating, { props: { modelValue: 2, allowHalf: true } })
      const root = w.find('[data-slot=rating]')
      await root.trigger('keydown', { key: 'PageUp' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([3])
      await root.trigger('keydown', { key: 'PageDown' })
      await root.trigger('keydown', { key: 'PageDown' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([1])
    })

    it('arrow keys and half-star pointer follow the writing direction in RTL', async () => {
      stubRect()
      const w = mount(Rating, { props: { modelValue: 2, allowHalf: true }, attachTo: document.body })
      w.element.setAttribute('dir', 'rtl')
      const root = w.find('[data-slot=rating]')
      await root.trigger('keydown', { key: 'ArrowLeft' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2.5])
      await root.trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2])
      // right half is the first half in RTL
      await w.findAll('[data-slot=rating-star]')[3].trigger('click', { clientX: 15 })
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([3.5])
      w.unmount()
    })

    it('stars are at least 24px (p-1 around 16px svg) and 44px on coarse pointers; wraps instead of overflowing', () => {
      const w = mount(Rating, { props: { size: 'sm' } })
      const star = w.find('[data-slot=rating-star]')
      expect(star.classes()).toContain('p-1')
      expect(star.classes()).toContain('pointer-coarse:min-h-11')
      expect(star.classes()).toContain('pointer-coarse:min-w-11')
      expect(ratingVariants()).toContain('flex-wrap')
      expect(ratingVariants()).toContain('max-w-full')
    })

    it('filled state differs by shape, not colour only: outlined empty star, filled star with ink stroke', () => {
      const w = mount(Rating, { props: { modelValue: 1 } })
      const svgs = w.findAll('svg')
      expect(svgs[0].classes()).toContain('fill-none')
      expect(svgs[1].classes()).toContain('fill-warning')
      expect(svgs[1].classes()).toContain('stroke-foreground')
    })
  })
})
