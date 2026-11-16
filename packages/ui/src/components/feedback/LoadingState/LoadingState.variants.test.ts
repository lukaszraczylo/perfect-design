import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingState from './LoadingState.vue'
import { LOADING_STATE_LAYOUTS, LOADING_STATE_SHAPES, LOADING_STATE_SIZES, LOADING_STATE_VARIANTS, loadingStateVariants } from './variants'

const make = (props: Record<string, unknown> = {}) => mount(LoadingState, { props })
const bones = (w: ReturnType<typeof make>) => w.findAll('[data-slot="loading-state-skeleton"]')
const spinner = (w: ReturnType<typeof make>) => w.find('[role="status"] svg, [data-slot="loading-state"] span[aria-hidden="true"] > *')

describe('LoadingState size (spinner)', () => {
  it('md is the default and keeps the original classes', () => {
    const w = make()
    expect(w.classes()).toEqual(['flex', 'w-full', 'flex-col', 'items-center', 'justify-center', 'gap-3', 'text-sm', 'text-muted-foreground', 'py-12'])
    expect(w.attributes('data-size')).toBeUndefined()
    expect(spinner(w).classes()).toContain('size-6')
  })

  it.each([
    ['sm', 'text-xs', 'py-6', 'size-5'],
    ['lg', 'text-base', 'py-16', 'size-8'],
  ] as const)('%s scales the spinner, the label and the padding', (size, text, pad, icon) => {
    const w = make({ size })
    expect(w.classes()).toEqual(expect.arrayContaining([text, pad]))
    expect(w.classes()).not.toContain('py-12')
    expect(w.classes()).not.toContain('text-sm')
    expect(spinner(w).classes()).toContain(icon)
    expect(w.attributes('data-size')).toBe(size)
  })

  it('full page keeps its own height and does not add padding', () => {
    const w = make({ size: 'lg', fullPage: true })
    expect(w.classes()).toEqual(expect.arrayContaining(['min-h-dvh', 'text-base']))
    expect(w.classes()).not.toContain('py-16')
  })

  it('skeletons ignore size', () => {
    const base = make({ variant: 'text' })
    expect(make({ variant: 'text', size: 'lg' }).classes().sort()).toEqual(base.classes().sort())
  })

  it('an unknown size falls back to md', () => {
    const w = make({ size: 'giant' })
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.classes()).toContain('py-12')
  })
})

describe('LoadingState layout', () => {
  it('inline is a start-aligned row with a visible label', () => {
    const w = make({ layout: 'inline', label: 'Saving changes' })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'justify-start', 'gap-2', 'py-2']))
    expect(w.classes()).not.toContain('flex-col')
    expect(w.classes()).not.toContain('py-12')
    expect(w.attributes('data-layout')).toBe('inline')
    const label = w.find('[data-slot="loading-state-label"]')
    expect(label.text()).toBe('Saving changes')
    expect(label.classes()).not.toContain('sr-only')
  })

  it('stacked is the default and an unknown layout falls back', () => {
    expect(make().attributes('data-layout')).toBeUndefined()
    expect(make({ layout: 'grid' }).classes()).toContain('flex-col')
  })

  it('skeletons ignore layout', () => {
    expect(make({ variant: 'list', layout: 'inline' }).classes()).toContain('flex-col')
  })

  it('helper works standalone', () => {
    expect(loadingStateVariants({ variant: 'spinner', layout: 'inline', size: 'sm' })).toContain('flex-row')
  })
})

describe('LoadingState shape (skeleton)', () => {
  it('rounded is the default and keeps the original bone class', () => {
    const w = make({ variant: 'text' })
    expect(bones(w)[0].classes()).toEqual(expect.arrayContaining(['animate-pulse', 'rounded', 'bg-muted', 'motion-reduce:animate-none']))
    expect(w.attributes('data-shape')).toBeUndefined()
  })

  it.each(['table', 'list', 'text', 'form', 'kpi-grid', 'avatar-text', 'card'] as const)('square removes the radius of every %s bone', (variant) => {
    const w = make({ variant, shape: 'square' })
    expect(bones(w).length).toBeGreaterThan(0)
    for (const b of bones(w).filter((x) => !x.classes().includes('rounded-full'))) {
      expect(b.classes()).toContain('rounded-none')
      expect(b.classes()).not.toContain('rounded')
    }
    expect(w.attributes('data-shape')).toBe('square')
  })

  it('pill rounds the bones fully, except the tall card media', () => {
    const list = make({ variant: 'list', shape: 'pill' })
    for (const b of bones(list)) expect(b.classes()).toContain('rounded-full')
    const card = bones(make({ variant: 'card', shape: 'pill' }))
    expect(card[0].classes()).toContain('rounded-lg')
    expect(card[0].classes()).not.toContain('rounded-full')
    expect(card[1].classes()).toContain('rounded-full')
  })

  it('avatars stay round in every shape', () => {
    for (const shape of LOADING_STATE_SHAPES) {
      expect(bones(make({ variant: 'avatar-text', shape }))[0].classes()).toContain('rounded-full')
    }
  })

  it('the spinner variant ignores shape and an unknown shape falls back', () => {
    expect(make({ shape: 'square' }).classes()).toContain('flex-col')
    expect(make({ variant: 'text', shape: 'blob' }).attributes('data-shape')).toBeUndefined()
  })
})

describe('LoadingState combinations and accessibility', () => {
  const cross = LOADING_STATE_VARIANTS.flatMap((v) => LOADING_STATE_SIZES.flatMap((s) => LOADING_STATE_LAYOUTS.flatMap((l) => LOADING_STATE_SHAPES.map((sh) => [v, s, l, sh] as const))))
  it.each(cross)('%s + %s + %s + %s keeps the status region and the label', (variant, size, layout, shape) => {
    const w = make({ variant, size, layout, shape, label: 'Loading invoices' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(w.attributes('aria-live')).toBeUndefined()
    expect(w.find('[data-slot="loading-state-label"]').text()).toBe('Loading invoices')
  })

  it('class prop wins over size and layout', () => {
    const w = make({ size: 'lg', layout: 'inline', class: 'py-1 flex-col' })
    expect(w.classes()).toEqual(expect.arrayContaining(['py-1', 'flex-col']))
    expect(w.classes()).not.toContain('py-16')
    expect(w.classes()).not.toContain('flex-row')
  })

  it('a slot label replaces the text in the inline layout', () => {
    const w = mount(LoadingState, { props: { layout: 'inline' }, slots: { default: '<b>Syncing</b>' } })
    expect(w.find('[data-slot="loading-state-label"] b').text()).toBe('Syncing')
  })
})
