import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import { el, strictMount } from '../shared/contract/testing'
import NumberedSteps from './NumberedSteps.vue'
import {
  NUMBERED_STEPS_ALIGNS,
  NUMBERED_STEPS_SHAPES,
  NUMBERED_STEPS_SIZES,
  NUMBERED_STEPS_TONES,
  NUMBERED_STEPS_VARIANTS,
  numberedStepsContentVariants,
  numberedStepsDescriptionVariants,
  numberedStepsItemVariants,
  numberedStepsNumberVariants,
  numberedStepsTitleVariants,
} from './variants'

const steps = [
  { title: 'Install the package', description: 'Add it with pnpm.' },
  { title: 'Import the theme', description: 'One CSS import.' },
  { title: 'Register the source path' },
]
const mount$ = (props: Record<string, unknown> = {}) => mount(NumberedSteps, { props: { steps, ...props } })
const marker = (w: ReturnType<typeof mount$>) => w.find('[data-slot="numbered-steps-number"]')
const tokens = (s: string) => s.split(' ').sort()

describe('NumberedSteps variations', () => {
  describe('defaults keep the original output', () => {
    it('marker, item, content, title and description keep the original class set', () => {
      const w = mount$()
      expect(marker(w).classes().sort()).toEqual(tokens('flex shrink-0 items-center justify-center font-semibold tabular-nums size-10 rounded-full bg-primary text-sm text-primary-foreground'))
      expect(w.find('li').classes().sort()).toEqual(tokens('min-w-0 rounded-lg border bg-card p-6 text-card-foreground'))
      expect(w.find('[data-slot="numbered-steps-content"]').classes().sort()).toEqual(tokens('flex min-w-0 gap-4'))
      expect(w.find('h3').classes().sort()).toEqual(tokens('text-base font-semibold'))
      expect(w.find('p').classes().sort()).toEqual(tokens('mt-1 text-sm text-muted-foreground'))
    })
    it('every original layout keeps its original marker classes', () => {
      expect(tokens(numberedStepsNumberVariants({ variant: 'timeline' }))).toEqual(tokens('flex shrink-0 items-center justify-center font-semibold tabular-nums relative z-10 size-10 rounded-full border-2 border-primary bg-background text-sm text-primary'))
      expect(tokens(numberedStepsNumberVariants({ variant: 'minimal' }))).toEqual(tokens('flex shrink-0 items-center justify-center font-semibold tabular-nums w-10 text-2xl text-primary'))
      expect(tokens(numberedStepsItemVariants({ variant: 'timeline' }))).toEqual(
        tokens('min-w-0 relative pb-10 last:pb-0 before:absolute before:start-5 before:top-11 before:bottom-1 before:w-px before:-translate-x-1/2 before:bg-border rtl:before:translate-x-1/2 last:before:hidden'),
      )
      expect(tokens(numberedStepsItemVariants({ variant: 'horizontal' }))).toEqual(
        tokens('min-w-0 relative sm:after:absolute sm:after:start-13 sm:after:-end-3 sm:after:top-5 sm:after:h-px sm:after:bg-border sm:last:after:hidden'),
      )
      expect(tokens(numberedStepsItemVariants({ variant: 'minimal' }))).toEqual(tokens('min-w-0 border-t py-6'))
      expect(tokens(numberedStepsItemVariants({ variant: 'with-media' }))).toEqual(tokens('min-w-0 grid gap-6 rounded-lg border bg-card p-6 text-card-foreground md:grid-cols-2 md:items-center'))
    })
    it('reports the default dimensions as data attributes', () => {
      const w = mount$()
      expect([w.attributes('data-size'), w.attributes('data-tone'), w.attributes('data-shape'), w.attributes('data-align')]).toEqual(['md', 'primary', 'circle', 'start'])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'size-8', 'text-xs', 'p-4', 'text-sm'],
      ['md', 'size-10', 'text-sm', 'p-6', 'text-base'],
      ['lg', 'size-12', 'text-base', 'p-8', 'text-lg'],
    ] as const)('%s: marker %s %s, padding %s, title %s', (size, box, text, pad, title) => {
      const w = mount$({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(marker(w).classes()).toEqual(expect.arrayContaining([box, text]))
      expect(w.find('li').classes()).toContain(pad)
      expect(w.find('h3').classes()).toContain(title)
      expect(w.find('h3').classes()).toContain('font-semibold')
    })
    it('content gap and description scale with size', () => {
      expect(mount$({ size: 'sm' }).find('[data-slot="numbered-steps-content"]').classes()).toContain('gap-3')
      expect(mount$({ size: 'lg' }).find('[data-slot="numbered-steps-content"]').classes()).toContain('gap-5')
      expect(mount$({ size: 'lg' }).find('p').classes()).toContain('text-base')
      expect(mount$({ size: 'sm' }).find('p').classes()).toContain('text-sm')
      expect(numberedStepsDescriptionVariants({ size: 'lg' })).toContain('text-base')
      expect(numberedStepsTitleVariants({ size: 'lg' })).toContain('text-lg')
    })
    it('minimal scales the bare number instead of a box', () => {
      expect(marker(mount$({ variant: 'minimal', size: 'sm' })).classes()).toEqual(expect.arrayContaining(['w-8', 'text-xl']))
      expect(marker(mount$({ variant: 'minimal', size: 'lg' })).classes()).toEqual(expect.arrayContaining(['w-12', 'text-3xl']))
      expect(mount$({ variant: 'minimal', size: 'lg' }).find('li').classes()).toContain('py-8')
    })
    it.each([
      ['sm', 'before:start-4', 'before:top-9', 'pb-8'],
      ['md', 'before:start-5', 'before:top-11', 'pb-10'],
      ['lg', 'before:start-6', 'before:top-13', 'pb-12'],
    ] as const)('timeline connector follows the %s marker', (size, start, top, pad) => {
      const c = mount$({ variant: 'timeline', size }).find('li').classes()
      expect(c).toEqual(expect.arrayContaining([start, top, pad, 'before:bottom-1', 'rtl:before:translate-x-1/2']))
      expect(c.filter((x) => /^before:start-/.test(x))).toHaveLength(1)
    })
    it.each([
      ['sm', 'sm:after:start-11', 'sm:after:top-4'],
      ['md', 'sm:after:start-13', 'sm:after:top-5'],
      ['lg', 'sm:after:start-15', 'sm:after:top-6'],
    ] as const)('horizontal connector follows the %s marker', (size, start, top) => {
      const c = mount$({ variant: 'horizontal', size }).find('li').classes()
      expect(c).toEqual(expect.arrayContaining([start, top, 'sm:after:-end-3']))
      expect(c.filter((x) => /^sm:after:start-/.test(x))).toHaveLength(1)
    })
    it('with-media scales padding and gap', () => {
      const c = mount$({ variant: 'with-media', size: 'lg' }).find('li').classes()
      expect(c).toEqual(expect.arrayContaining(['p-8', 'gap-8']))
      expect(c).not.toContain('p-6')
    })
    it('unknown values fall back to md', () => {
      for (const size of ['xl', '', 'LG', 2, null]) {
        const w = mount$({ size })
        expect(w.attributes('data-size')).toBe('md')
        expect(marker(w).classes()).toContain('size-10')
      }
    })
  })

  describe('tone', () => {
    it.each([
      ['primary', ['bg-primary', 'text-primary-foreground']],
      ['neutral', ['bg-foreground', 'text-background']],
      ['success', ['bg-success', 'text-success-foreground']],
      ['info', ['bg-info', 'text-info-foreground']],
    ] as const)('filled marker %s uses %j', (tone, cls) => {
      const w = mount$({ tone })
      expect(w.attributes('data-tone')).toBe(tone)
      expect(marker(w).classes()).toEqual(expect.arrayContaining([...cls]))
      expect(marker(w).classes().filter((c) => /^bg-/.test(c))).toHaveLength(1)
    })
    it.each([
      ['primary', ['border-primary', 'text-primary']],
      ['neutral', ['border-foreground', 'text-foreground']],
      ['success', ['border-success', 'text-success']],
      ['info', ['border-info', 'text-info']],
    ] as const)('timeline marker %s is outlined with %j on the page background', (tone, cls) => {
      const c = marker(mount$({ variant: 'timeline', tone })).classes()
      expect(c).toEqual(expect.arrayContaining([...cls, 'bg-background', 'border-2']))
    })
    it.each([
      ['primary', 'text-primary'],
      ['neutral', 'text-foreground'],
      ['success', 'text-success'],
      ['info', 'text-info'],
    ] as const)('minimal number %s uses %s', (tone, cls) => {
      const c = marker(mount$({ variant: 'minimal', tone })).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => /^bg-/.test(x))).toHaveLength(0)
    })
    it('solid tones never mix two fills or two text colours, in any layout', () => {
      for (const variant of NUMBERED_STEPS_VARIANTS)
        for (const tone of NUMBERED_STEPS_TONES) {
          const c = marker(mount$({ variant, tone })).classes()
          expect(c.filter((x) => /^bg-/.test(x)).length, `${variant}/${tone}`).toBeLessThanOrEqual(1)
          expect(c.filter((x) => /^text-(primary|primary-foreground|foreground|background|success|success-foreground|info|info-foreground)$/.test(x)), `${variant}/${tone}`).toHaveLength(1)
        }
    })
    it('unknown values fall back to primary', () => {
      const w = mount$({ tone: 'danger' })
      expect(w.attributes('data-tone')).toBe('primary')
      expect(marker(w).classes()).toContain('bg-primary')
    })
  })

  describe('shape', () => {
    it.each([
      ['circle', 'rounded-full'],
      ['rounded', 'rounded-md'],
      ['square', 'rounded-none'],
    ] as const)('%s uses %s', (shape, cls) => {
      for (const variant of ['default', 'cards', 'timeline', 'horizontal', 'with-media'] as const) {
        const c = marker(mount$({ variant, shape })).classes()
        expect(c, variant).toContain(cls)
        expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(1)
      }
    })
    it('the bare number of minimal has no box and ignores the shape', () => {
      for (const shape of NUMBERED_STEPS_SHAPES) expect(marker(mount$({ variant: 'minimal', shape })).classes().some((c) => /^rounded-/.test(c))).toBe(false)
    })
    it('unknown values fall back to circle', () => {
      const w = mount$({ shape: 'hexagon' })
      expect(w.attributes('data-shape')).toBe('circle')
      expect(marker(w).classes()).toContain('rounded-full')
    })
  })

  describe('align', () => {
    it('center centres the marker against the text in the default row layout', () => {
      const w = mount$({ align: 'center' })
      expect(w.attributes('data-align')).toBe('center')
      expect(w.find('[data-slot="numbered-steps-content"]').classes()).toContain('items-center')
      expect(w.find('[data-slot="numbered-steps-content"]').classes()).not.toContain('text-center')
    })
    it('center also centres the text of the stacked cards layout', () => {
      const c = mount$({ variant: 'cards', align: 'center' }).find('[data-slot="numbered-steps-content"]').classes()
      expect(c).toEqual(expect.arrayContaining(['flex-col', 'items-center', 'text-center']))
    })
    it('start keeps the original classes', () => {
      expect(mount$({ align: 'start' }).find('[data-slot="numbered-steps-content"]').classes()).not.toContain('items-center')
      expect(numberedStepsContentVariants({ variant: 'cards' })).not.toContain('text-center')
    })
    it('timeline and horizontal ignore center because their connectors start at the marker', () => {
      for (const variant of ['timeline', 'horizontal'] as const) {
        const w = mount$({ variant, align: 'center' })
        expect(w.attributes('data-align')).toBe('start')
        expect(w.find('[data-slot="numbered-steps-content"]').classes()).not.toContain('items-center')
      }
    })
    it('minimal and with-media accept center', () => {
      for (const variant of ['minimal', 'with-media'] as const) expect(mount$({ variant, align: 'center' }).find('[data-slot="numbered-steps-content"]').classes()).toContain('items-center')
    })
    it('unknown values fall back to start', () => {
      for (const align of ['end', 'middle', '', 1]) expect(mount$({ align }).attributes('data-align')).toBe('start')
      expect(NUMBERED_STEPS_ALIGNS).toEqual(['start', 'center'])
    })
  })

  describe('combinations, overrides and a11y', () => {
    it('size x tone x shape x align x variant renders every step with one marker per step', () => {
      for (const variant of NUMBERED_STEPS_VARIANTS)
        for (const size of NUMBERED_STEPS_SIZES) {
          const w = mount$({ variant, size, tone: 'info', shape: 'square', align: 'center' })
          expect(w.findAll('li')).toHaveLength(3)
          expect(w.findAll('[data-slot="numbered-steps-number"]')).toHaveLength(3)
        }
    })
    it('the class prop wins over variant classes on the root', () => {
      const w = mount$({ size: 'lg', class: 'gap-2 custom' })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'custom']))
      expect(w.classes()).not.toContain('gap-6')
    })
    it('helper class option wins', () => {
      expect(numberedStepsNumberVariants({ tone: 'success', class: 'extra' })).toContain('extra')
    })
    it('ordered list, heading level, sr-only number and aria-hidden marker survive every tone, size and shape', () => {
      for (const tone of NUMBERED_STEPS_TONES)
        for (const size of NUMBERED_STEPS_SIZES) {
          const w = mount$({ tone, size, shape: 'rounded', level: 4, pad: true })
          expect(w.element.tagName).toBe('OL')
          expect(w.findAll('h4')).toHaveLength(3)
          expect(w.find('h4 .sr-only').text()).toBe('1.')
          expect(marker(w).attributes('aria-hidden')).toBe('true')
          expect(marker(w).text()).toBe('01')
        }
    })
    it('marker keeps tabular numbers and uses no shadow, gradient or hover effect', () => {
      for (const variant of NUMBERED_STEPS_VARIANTS) {
        const html = mount$({ variant, tone: 'success', size: 'lg', shape: 'rounded' }).html()
        expect(html).toContain('tabular-nums')
        expect(html).not.toMatch(/shadow|gradient|hover:|rounded-(xl|2xl|3xl)/)
      }
    })
    it('long titles and an empty step list render in every size', () => {
      const long = 'x'.repeat(150)
      for (const size of NUMBERED_STEPS_SIZES) {
        expect(mount$({ size, steps: [{ title: long }] }).find('h3').text()).toContain(long)
        expect(mount$({ size, steps: [] }).findAll('li')).toHaveLength(0)
      }
    })
  })

  describe('contract stays enforced', () => {
    const t = strictMount()
    beforeEach(() => configureStrictMode('throw'))
    afterEach(() => {
      t.reset()
      configureStrictMode('off')
    })
    it('a step without a title still throws with size, tone, shape and align set', async () => {
      await t.mount(() => el(NumberedSteps, { steps: [{ title: 'ok' }, { title: '' }], size: 'lg', tone: 'success', shape: 'square', align: 'center' }))
      expect(t.errors).toHaveLength(1)
      expect(t.errors[0].message).toContain('NumberedSteps: requires a non-empty `title` on every step')
    })
  })
})
