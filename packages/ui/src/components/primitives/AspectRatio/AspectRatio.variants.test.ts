import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AspectRatio from './AspectRatio.vue'
import { aspectRatioVariants } from './variants'

const inner = (w: ReturnType<typeof mount>) => w.find('[data-slot="aspect-ratio"]')
const wrapperEl = (w: ReturnType<typeof mount>) => w.find('[data-reka-aspect-ratio-wrapper]')
const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => mount(AspectRatio, { props, slots })

describe('AspectRatio defaults stay unchanged', () => {
  it('adds no classes by default', () => {
    expect(aspectRatioVariants()).toBe('')
    const w = make()
    expect(inner(w).classes()).toEqual([])
    expect(inner(make({ rounded: 'none', variant: 'plain', fit: 'none' })).classes()).toEqual([])
    expect(wrapperEl(w).attributes('style')).toContain('padding-bottom: 56.25%')
  })
})

describe('AspectRatio rounded', () => {
  it.each([
    ['md', 'rounded-md'],
    ['lg', 'rounded-lg'],
    ['full', 'rounded-full'],
  ] as const)('%s adds %s and clips the content', (rounded, cls) => {
    const w = make({ rounded })
    expect(inner(w).classes()).toEqual(expect.arrayContaining([cls, 'overflow-hidden']))
    expect(wrapperEl(w).classes()).not.toContain(cls)
  })

  it('full with a square ratio keeps the 1:1 box', () => {
    const w = make({ rounded: 'full', ratio: 1 })
    expect(inner(w).classes()).toContain('rounded-full')
    expect(wrapperEl(w).attributes('style')).toContain('padding-bottom: 100%')
  })

  it('unknown value falls back to none', () => {
    expect(inner(make({ rounded: 'xl' as never })).classes()).toEqual([])
  })

  it('class wins over rounded and can switch clipping back', () => {
    const w = make({ rounded: 'lg', class: 'rounded-sm overflow-visible' })
    expect(inner(w).classes()).toEqual(expect.arrayContaining(['rounded-sm', 'overflow-visible']))
    expect(inner(w).classes()).not.toContain('rounded-lg')
    expect(inner(w).classes()).not.toContain('overflow-hidden')
  })
})

describe('AspectRatio variant', () => {
  it('bordered draws a 1px border in the border colour', () => {
    expect(inner(make({ variant: 'bordered' })).classes()).toEqual(['border', 'border-border'])
  })

  it('muted is a placeholder surface with muted text and a forced-colors border', () => {
    const c = inner(make({ variant: 'muted' }, { default: 'Placeholder' })).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-muted', 'text-muted-foreground', 'forced-colors:border']))
    expect(inner(make({ variant: 'muted' }, { default: 'Placeholder' })).text()).toBe('Placeholder')
  })

  it('plain is the default', () => {
    expect(inner(make({ variant: 'plain' })).classes()).toEqual([])
  })

  it('unknown value falls back to plain', () => {
    expect(inner(make({ variant: 'glass' as never })).classes()).toEqual([])
  })

  it('class wins over the surface', () => {
    const w = make({ variant: 'muted', class: 'bg-accent' })
    expect(inner(w).classes()).toContain('bg-accent')
    expect(inner(w).classes()).not.toContain('bg-muted')
  })
})

describe('AspectRatio fit', () => {
  it.each([
    ['cover', 'object-cover'],
    ['contain', 'object-contain'],
    ['fill', 'object-fill'],
  ] as const)('%s sizes direct img and video children (%s)', (fit, obj) => {
    const c = inner(make({ fit })).classes()
    expect(c).toEqual(expect.arrayContaining([`[&>img]:size-full`, `[&>img]:${obj}`, `[&>video]:size-full`, `[&>video]:${obj}`]))
  })

  it('none leaves children alone and unknown falls back to none', () => {
    expect(inner(make({ fit: 'none' })).classes()).toEqual([])
    expect(inner(make({ fit: 'zoom' as never })).classes()).toEqual([])
  })

  it('keeps the image alt text and renders the child inside the box', () => {
    const w = make({ fit: 'cover', rounded: 'md' }, { default: '<img alt="Sample" src="a.png">' })
    expect(inner(w).find('img').attributes('alt')).toBe('Sample')
  })

  it('one fit rule only: object-* classes do not stack', () => {
    const c = inner(make({ fit: 'contain' })).classes()
    expect(c.filter((x) => x.startsWith('[&>img]:object-'))).toEqual(['[&>img]:object-contain'])
  })
})

describe('AspectRatio cross-products', () => {
  const roundeds = ['none', 'md', 'lg', 'full'] as const
  const variants = ['plain', 'bordered', 'muted'] as const
  const fits = ['none', 'cover', 'contain', 'fill'] as const

  it.each(roundeds.flatMap((r) => variants.flatMap((v) => fits.map((f) => [r, v, f] as const))))('rounded %s, variant %s, fit %s: single radius and surface, ratio kept', (rounded, variant, fit) => {
    const w = make({ rounded, variant, fit, ratio: 4 / 3 })
    const c = inner(w).classes()
    expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(rounded === 'none' ? 0 : 1)
    expect(c.includes('overflow-hidden')).toBe(rounded !== 'none')
    expect(c.includes('border')).toBe(variant === 'bordered')
    expect(c.includes('bg-muted')).toBe(variant === 'muted')
    expect(wrapperEl(w).attributes('style')).toContain('padding-bottom: 75%')
  })

  it('works with `as` and asChild and passes a11y attributes', () => {
    const f = mount(AspectRatio, { props: { as: 'figure', rounded: 'lg', variant: 'bordered' }, attrs: { role: 'img', 'aria-label': 'Chart preview' } })
    expect(inner(f).element.tagName).toBe('FIGURE')
    expect(inner(f).attributes('aria-label')).toBe('Chart preview')
    expect(inner(f).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border']))
    const c = mount(AspectRatio, { props: { asChild: true, rounded: 'md', fit: 'cover' }, slots: { default: '<img alt="Sample" src="a.png">' } })
    expect(c.find('img').classes()).toEqual(expect.arrayContaining(['rounded-md', 'overflow-hidden', '[&>img]:object-cover']))
  })

  it('reacts to prop changes', async () => {
    const w = make()
    await w.setProps({ rounded: 'full', variant: 'bordered' })
    expect(inner(w).classes()).toEqual(expect.arrayContaining(['rounded-full', 'border']))
    await w.setProps({ rounded: 'none', variant: 'plain' })
    expect(inner(w).classes()).toEqual([])
  })

  it('invalid ratio still falls back with the new looks applied', () => {
    expect(wrapperEl(make({ ratio: 0, rounded: 'lg' })).attributes('style')).toContain('padding-bottom: 56.25%')
  })
})
