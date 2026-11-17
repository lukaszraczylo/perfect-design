import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { faHeart as faHeartData, faStar as faStarData } from '@fortawesome/free-solid-svg-icons'
import Rating from './Rating.vue'
import Field from '../Field/Field.vue'
import * as barrel from './index'
import {
  RATING_ICONS,
  RATING_PATHS,
  RATING_PRECISIONS,
  RATING_SIZES,
  RATING_TONES,
  normalizeRatingPrecision,
  normalizeRatingSize,
  normalizeRatingTone,
  ratingFillVariants,
  ratingVariants,
  resolveRatingGlyph,
} from './variants'

type W = ReturnType<typeof mount>
const named = { 'aria-label': 'Sample rating' }
const root = (w: W) => w.find('[data-slot=rating]')
const stars = (w: W) => w.findAll('[data-slot=rating-star]')
const fills = (w: W) => stars(w).map((s) => Number(s.attributes('data-fill')))
/** The solid (filled) svg of the first star that has one. */
const solid = (w: W) => w.find('[data-slot=rating-star] .absolute svg')
const outline = (w: W) => w.find('[data-slot=rating-star] svg')

/** jsdom has no layout: give every icon a 20px wide box starting at x=0. */
function stubRect(width = 20) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, right: width, width, top: 0, bottom: 20, height: 20, x: 0, y: 0, toJSON: () => ({}) })
}
const clickAt = async (w: W, index: number, clientX: number) => stars(w)[index].trigger('click', { clientX })
afterEach(() => vi.restoreAllMocks())

describe('Rating variations', () => {
  describe('defaults', () => {
    it('keeps the original root classes, the star glyph and the warning fill', () => {
      const w = mount(Rating, { props: { modelValue: 3 }, attrs: named })
      expect(root(w).classes().join(' ')).toBe(
        'inline-flex w-fit max-w-full flex-wrap items-center rounded-md border border-transparent align-middle select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 gap-0.5 [&_svg]:size-5',
      )
      expect(outline(w).attributes('viewBox')).toBe('0 0 24 24')
      expect(outline(w).find('path').attributes('d')).toBe(RATING_PATHS.star)
      expect(outline(w).attributes('stroke-width')).toBe('1.5')
      expect(solid(w).classes()).toEqual(expect.arrayContaining(['fill-warning', 'stroke-foreground', 'max-w-none', 'shrink-0']))
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'gap-0.5', '[&_svg]:size-4'],
      ['md', 'gap-0.5', '[&_svg]:size-5'],
      ['lg', 'gap-1', '[&_svg]:size-7'],
    ])('%s sets %s and %s', (size, gap, glyph) => {
      const c = root(mount(Rating, { props: { size: size as 'sm' }, attrs: named })).classes()
      expect(c).toContain(gap)
      expect(c).toContain(glyph)
    })

    it('falls back to md for an unknown size', () => {
      expect(root(mount(Rating, { props: { size: 'xl' as never }, attrs: named })).classes()).toContain('[&_svg]:size-5')
      expect(normalizeRatingSize('xl')).toBe('md')
      expect(RATING_SIZES).toEqual(['sm', 'md', 'lg'])
    })

    it('keeps the 24px target (p-1 around the glyph and 44px on coarse pointers) in every size', () => {
      for (const size of RATING_SIZES) {
        const star = stars(mount(Rating, { props: { size }, attrs: named }))[0]
        expect(star.classes()).toEqual(expect.arrayContaining(['p-1', 'pointer-coarse:min-h-11', 'pointer-coarse:min-w-11']))
      }
    })
  })

  describe('tone', () => {
    it.each([
      ['warning', 'fill-warning'],
      ['primary', 'fill-primary'],
      ['success', 'fill-success'],
      ['danger', 'fill-destructive'],
      ['neutral', 'fill-foreground'],
      ['info', 'fill-info'],
    ])('%s fills with %s and keeps the ink outline', (tone, fill) => {
      const w = mount(Rating, { props: { tone: tone as 'warning', modelValue: 2 }, attrs: named })
      expect(solid(w).classes()).toContain(fill)
      expect(solid(w).classes()).toContain('stroke-foreground')
      for (const other of ['fill-warning', 'fill-primary', 'fill-success', 'fill-destructive', 'fill-foreground', 'fill-info'].filter((c) => c !== fill)) {
        expect(solid(w).classes()).not.toContain(other)
      }
    })

    it('exposes data-tone on the root for non-default tones only, so the tone shows even with no icon filled', () => {
      expect(root(mount(Rating, { props: { tone: 'info' }, attrs: named })).attributes('data-tone')).toBe('info')
      expect(root(mount(Rating, { props: { tone: 'warning' }, attrs: named })).attributes('data-tone')).toBeUndefined()
      expect(root(mount(Rating, { props: { tone: 'pink' as never }, attrs: named })).attributes('data-tone')).toBeUndefined()
    })

    it('the empty icons never depend on the tone: still an outline with no fill', () => {
      for (const tone of RATING_TONES) {
        const w = mount(Rating, { props: { tone, modelValue: 1 }, attrs: named })
        expect(outline(w).classes()).toEqual(expect.arrayContaining(['fill-none', 'stroke-muted-foreground']))
      }
    })

    it('falls back to warning for an unknown tone', () => {
      const w = mount(Rating, { props: { tone: 'pink' as never, modelValue: 1 }, attrs: named })
      expect(solid(w).classes()).toContain('fill-warning')
      expect(normalizeRatingTone('pink')).toBe('warning')
      expect(ratingFillVariants()).toContain('fill-warning')
    })

    it('every tone still sets the value from the keyboard and the pointer', async () => {
      for (const tone of RATING_TONES) {
        const w = mount(Rating, { props: { tone, modelValue: 1 }, attrs: named })
        await root(w).trigger('keydown', { key: 'ArrowRight' })
        expect(root(w).attributes('aria-valuenow')).toBe('2')
        await stars(w)[3].trigger('click')
        expect(w.emitted('update:modelValue')?.at(-1)).toEqual([4])
      }
    })
  })

  describe('icon', () => {
    it.each(RATING_ICONS)('%s draws its own 24 grid path', (icon) => {
      const w = mount(Rating, { props: { icon, modelValue: 3 }, attrs: named })
      expect(outline(w).find('path').attributes('d')).toBe(RATING_PATHS[icon])
      expect(solid(w).find('path').attributes('d')).toBe(RATING_PATHS[icon])
      expect(outline(w).attributes('viewBox')).toBe('0 0 24 24')
    })

    it('the three glyphs are different shapes', () => {
      expect(new Set(Object.values(RATING_PATHS)).size).toBe(3)
    })

    it('accepts an icon definition: its viewBox and path data, with the stroke scaled to the grid', () => {
      const w = mount(Rating, { props: { icon: faHeartData, modelValue: 2 }, attrs: named })
      expect(outline(w).attributes('viewBox')).toBe(`0 0 ${faHeartData.icon[0]} ${faHeartData.icon[1]}`)
      expect(outline(w).find('path').attributes('d')).toBe(faHeartData.icon[4])
      expect(Number(outline(w).attributes('stroke-width'))).toBeGreaterThan(20)
    })

    it('draws every path of a multi-path icon', () => {
      const icon = { prefix: 'fas', iconName: 'sample', icon: [24, 24, [], 'f000', ['M0 0h4v4z', 'M8 8h4v4z']] } as never
      const w = mount(Rating, { props: { icon, modelValue: 1 }, attrs: named })
      expect(outline(w).findAll('path').map((p) => p.attributes('d'))).toEqual(['M0 0h4v4z', 'M8 8h4v4z'])
    })

    it('falls back to the star for an unknown name or a malformed definition', () => {
      for (const icon of ['diamond', 5, null, {}, { icon: [24] }, { icon: [0, 0, [], 'x', 'M0 0'] }, { icon: [24, 24, [], 'x', ''] }, { icon: [24, 24, [], 'x', [1, null]] }]) {
        const w = mount(Rating, { props: { icon: icon as never }, attrs: named })
        expect(outline(w).find('path').attributes('d')).toBe(RATING_PATHS.star)
      }
      expect(resolveRatingGlyph(faStarData).viewBox).toBe(`0 0 ${faStarData.icon[0]} ${faStarData.icon[1]}`)
    })

    it('icons stay decorative: aria-hidden svgs, one slider with the same semantics', () => {
      for (const icon of ['star', 'heart', 'circle'] as const) {
        const w = mount(Rating, { props: { icon, modelValue: 2 }, attrs: named })
        expect(w.findAll('svg').every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
        expect(root(w).attributes('role')).toBe('slider')
        expect(root(w).attributes('aria-valuetext')).toBe('2 out of 5')
      }
    })
  })

  describe('precision', () => {
    it('lists 1, 0.5 and 0.25', () => expect([...RATING_PRECISIONS]).toEqual([1, 0.5, 0.25]))

    it('normalizes precision values', () => {
      expect(normalizeRatingPrecision(0.25)).toBe(0.25)
      expect(normalizeRatingPrecision('0.5')).toBe(0.5)
      expect(normalizeRatingPrecision(1)).toBe(1)
      for (const v of [0.1, 2, 0, -1, null, undefined, '', 'x', Number.NaN]) expect(normalizeRatingPrecision(v)).toBeUndefined()
    })

    it('0.5 behaves like allowHalf', async () => {
      const w = mount(Rating, { props: { precision: 0.5, modelValue: 2.3 }, attrs: named })
      expect(root(w).attributes('aria-valuenow')).toBe('2.5')
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(root(w).attributes('aria-valuenow')).toBe('3')
    })

    it('0.25 snaps values and fills a quarter at a time', () => {
      const w = mount(Rating, { props: { precision: 0.25, modelValue: 2.3 }, attrs: named })
      expect(root(w).attributes('aria-valuenow')).toBe('2.25')
      expect(fills(w)).toEqual([100, 100, 25, 0, 0])
      expect(root(w).attributes('aria-valuetext')).toBe('2.25 out of 5')
    })

    it('0.25 steps with the arrow keys, pages by one, and clamps at both ends', async () => {
      const w = mount(Rating, { props: { precision: 0.25, modelValue: 1 }, attrs: named })
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(root(w).attributes('aria-valuenow')).toBe('1.25')
      await root(w).trigger('keydown', { key: 'ArrowUp' })
      expect(root(w).attributes('aria-valuenow')).toBe('1.5')
      await root(w).trigger('keydown', { key: 'ArrowLeft' })
      await root(w).trigger('keydown', { key: 'ArrowDown' })
      expect(root(w).attributes('aria-valuenow')).toBe('1')
      await root(w).trigger('keydown', { key: 'PageUp' })
      expect(root(w).attributes('aria-valuenow')).toBe('2')
      await root(w).trigger('keydown', { key: 'End' })
      expect(root(w).attributes('aria-valuenow')).toBe('5')
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(root(w).attributes('aria-valuenow')).toBe('5')
      await root(w).trigger('keydown', { key: 'Home' })
      expect(root(w).attributes('aria-valuenow')).toBe('0')
      await root(w).trigger('keydown', { key: 'ArrowLeft' })
      expect(root(w).attributes('aria-valuenow')).toBe('0')
      expect(w.emitted('update:modelValue')?.map((e) => e[0])).toEqual([1.25, 1.5, 1.25, 1, 2, 5, 0])
    })

    it('0.25 reads the pointer position inside the icon', async () => {
      stubRect(20)
      const w = mount(Rating, { props: { precision: 0.25 }, attrs: named })
      await clickAt(w, 2, 1)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2.25])
      await clickAt(w, 2, 7)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2.5])
      await clickAt(w, 2, 12)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2.75])
      await clickAt(w, 2, 19)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([3])
    })

    it('0.5 keeps the old half rule: first half is x.5, the exact middle is the whole icon', async () => {
      stubRect(20)
      const w = mount(Rating, { props: { precision: 0.5 }, attrs: named })
      await clickAt(w, 1, 4)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([1.5])
      await clickAt(w, 1, 10)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([2])
    })

    it('hover previews the quarter under the pointer', async () => {
      stubRect(20)
      const w = mount(Rating, { props: { precision: 0.25, modelValue: 4 }, attrs: named })
      await stars(w)[0].trigger('mousemove', { clientX: 3 })
      expect(fills(w)).toEqual([25, 0, 0, 0, 0])
      await root(w).trigger('mouseleave')
      expect(fills(w)).toEqual([100, 100, 100, 100, 0])
    })

    it('mirrors the pointer position in right-to-left layouts', async () => {
      stubRect(20)
      const w = mount(Rating, { props: { precision: 0.25 }, attrs: named, attachTo: document.body })
      document.body.setAttribute('dir', 'rtl')
      await clickAt(w, 0, 19)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([0.25])
      document.body.removeAttribute('dir')
      w.unmount()
    })

    it('clearable resets when the same quarter is clicked again', async () => {
      stubRect(20)
      const w = mount(Rating, { props: { precision: 0.25, clearable: true, modelValue: 2.25 }, attrs: named })
      await clickAt(w, 2, 1)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([0])
    })

    it('precision wins over allowHalf; an invalid precision falls back to allowHalf, then to whole steps', async () => {
      const a = mount(Rating, { props: { precision: 0.25, allowHalf: true, modelValue: 1 }, attrs: named })
      await root(a).trigger('keydown', { key: 'ArrowRight' })
      expect(root(a).attributes('aria-valuenow')).toBe('1.25')
      const b = mount(Rating, { props: { precision: 0.3 as never, allowHalf: true, modelValue: 1 }, attrs: named })
      await root(b).trigger('keydown', { key: 'ArrowRight' })
      expect(root(b).attributes('aria-valuenow')).toBe('1.5')
      const c = mount(Rating, { props: { precision: 0.3 as never, modelValue: 1 }, attrs: named })
      await root(c).trigger('keydown', { key: 'ArrowRight' })
      expect(root(c).attributes('aria-valuenow')).toBe('2')
    })

    it('re-snaps the value when precision changes', async () => {
      const w = mount(Rating, { props: { precision: 0.25, modelValue: 2.25 }, attrs: named })
      await w.setProps({ precision: 1 })
      expect(root(w).attributes('aria-valuenow')).toBe('2')
    })

    it('readonly and disabled ignore keys at every precision', async () => {
      for (const extra of [{ readonly: true }, { disabled: true }]) {
        const w = mount(Rating, { props: { precision: 0.25, modelValue: 1, ...extra }, attrs: named })
        await root(w).trigger('keydown', { key: 'ArrowRight' })
        expect(root(w).attributes('aria-valuenow')).toBe('1')
        expect(w.emitted('update:modelValue')).toBeUndefined()
      }
    })
  })

  describe('combinations', () => {
    it('tone + icon + precision + size render together without losing a11y', async () => {
      const w = mount(Rating, { props: { tone: 'danger', icon: 'heart', precision: 0.5, size: 'lg', modelValue: 3.5, max: 6 }, attrs: named })
      expect(solid(w).classes()).toContain('fill-destructive')
      expect(solid(w).find('path').attributes('d')).toBe(RATING_PATHS.heart)
      expect(root(w).classes()).toEqual(expect.arrayContaining(['gap-1', '[&_svg]:size-7']))
      expect(root(w).attributes('aria-valuetext')).toBe('3.5 out of 6')
      expect(fills(w)).toEqual([100, 100, 100, 50, 0, 0])
      await root(w).trigger('keydown', { key: 'ArrowRight' })
      expect(root(w).attributes('aria-valuenow')).toBe('4')
    })

    it('class wins over variant classes', () => {
      const w = mount(Rating, { props: { size: 'lg', class: 'gap-4' }, attrs: named })
      expect(root(w).classes()).toContain('gap-4')
      expect(root(w).classes()).not.toContain('gap-1')
    })

    it('stays named and described inside a Field with an error', async () => {
      const w = mount({ components: { Field, Rating }, template: '<Field label="Your rating" error="Choose a rating" id="rt"><Rating tone="success" icon="circle" precision="0.5" /></Field>' }, { attachTo: document.body })
      await nextTick()
      const r = w.find('[data-slot=rating]')
      expect(r.attributes('aria-labelledby')).toBeTruthy()
      expect(r.attributes('aria-invalid')).toBe('true')
      expect(r.attributes('aria-describedby')).toContain('rt-error')
      w.unmount()
    })

    it('hidden form input follows fractional values', () => {
      const w = mount(Rating, { props: { name: 'score', precision: 0.25, modelValue: 3.75 }, attrs: named })
      expect((w.find('input[type=hidden]').element as HTMLInputElement).value).toBe('3.75')
    })
  })

  describe('exports', () => {
    it('are available from the barrel', () => {
      expect(barrel.ratingVariants).toBe(ratingVariants)
      expect(barrel.RATING_TONES).toEqual(['warning', 'primary', 'success', 'danger', 'neutral', 'info'])
      expect(barrel.resolveRatingGlyph).toBe(resolveRatingGlyph)
    })
    it('ratingVariants lets class win and defaults to md', () => {
      expect(ratingVariants()).toContain('[&_svg]:size-5')
      expect(ratingVariants({ size: 'lg', class: 'gap-2' })).toContain('gap-2')
    })
  })
})

describe('Rating width', () => {
  it('hugs its icons so the invalid outline is not drawn across a grid or column parent', () => {
    expect(ratingVariants({ size: 'md' })).toContain('w-fit')
  })
})
