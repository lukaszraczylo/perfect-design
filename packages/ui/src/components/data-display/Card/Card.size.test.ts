import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Card, CardBody, CardContent, CardFooter, CardHeader, CARD_SIZES, cardVariants } from './index'

const tree = (props: Record<string, unknown> = {}) =>
  mount(Card, {
    props: props as never,
    slots: { default: () => [] },
    global: { components: { CardHeader, CardContent, CardFooter, CardBody } },
  })
function full(props: Record<string, unknown> = {}) {
  return mount(
    {
      components: { Card, CardHeader, CardContent, CardFooter, CardBody },
      props: ['p'],
      template: '<Card v-bind="p"><CardHeader>h</CardHeader><CardContent>c</CardContent><CardBody>b</CardBody><CardFooter>f</CardFooter></Card>',
    },
    { props: { p: props } },
  )
}
const part = (w: ReturnType<typeof full>, slot: string) => w.find(`[data-slot="${slot}"]`)

describe('Card size dimension', () => {
  it('lists the values', () => expect([...CARD_SIZES]).toEqual(['sm', 'md', 'lg']))

  it('keeps the default class string and no data-size', () => {
    expect(cardVariants()).toBe('flex flex-col gap-6 rounded-xl py-6 border bg-card shadow-sm text-card-foreground')
    expect(cardVariants({ size: 'md' })).toBe(cardVariants())
    expect(tree().attributes('data-size')).toBeUndefined()
  })

  it('default parts keep px-6 and the body keeps gap-4 py-6', () => {
    const w = full()
    for (const s of ['card-header', 'card-content', 'card-footer']) expect(part(w, s).classes()).toContain('px-6')
    expect(part(w, 'card-body').classes()).toEqual(expect.arrayContaining(['gap-4', 'py-6']))
  })

  it.each([
    ['sm', 'gap-4', 'py-4', 'px-4', 'gap-3'],
    ['lg', 'gap-8', 'py-8', 'px-8', 'gap-5'],
  ])('size=%s resizes the card and its parts', (size, gap, py, px, bodyGap) => {
    const w = full({ size })
    expect(w.classes()).toEqual(expect.arrayContaining([gap, py]))
    expect(w.classes()).not.toContain('gap-6')
    expect(w.attributes('data-size')).toBe(size)
    for (const s of ['card-header', 'card-content', 'card-footer']) {
      expect(part(w, s).classes()).toContain(px)
      expect(part(w, s).classes()).not.toContain('px-6')
    }
    expect(part(w, 'card-body').classes()).toEqual(expect.arrayContaining([bodyGap, py]))
  })

  it('unknown size falls back to md', () => expect(full({ size: 'huge' }).html()).toBe(full().html()))

  it('parts outside a card use the default padding', () => {
    expect(mount(CardContent).classes()).toContain('px-6')
    expect(mount(CardBody).classes()).toContain('py-6')
  })

  describe('combinations', () => {
    it('with-image-header keeps pt-0 at every size', () => {
      for (const size of CARD_SIZES) expect(tree({ size, variant: 'with-image-header' }).classes()).toContain('pt-0')
    })
    it('horizontal layout keeps gap-0 py-0 at every size', () => {
      for (const size of CARD_SIZES) {
        const w = tree({ size, layout: 'horizontal' })
        expect(w.classes()).toEqual(expect.arrayContaining(['gap-0', 'py-0']))
        expect(w.classes()).not.toContain('py-4')
        expect(w.classes()).not.toContain('py-8')
      }
    })
    it('selectable sm card keeps role and checked state', () => {
      const w = tree({ size: 'sm', selectable: true, modelValue: true, 'aria-label': 'Plan' })
      expect(w.attributes('role')).toBe('checkbox')
      expect(w.attributes('aria-checked')).toBe('true')
      expect(w.classes()).toContain('py-4')
    })
    it('class wins over size', () => {
      const w = tree({ size: 'lg', class: 'py-2 gap-1' })
      expect(w.classes()).toEqual(expect.arrayContaining(['py-2', 'gap-1']))
      expect(w.classes()).not.toContain('py-8')
    })
    it('a part class still wins over the injected padding', () => {
      const w = mount({ components: { Card, CardContent }, template: '<Card size="lg"><CardContent class="px-1">x</CardContent></Card>' })
      expect(w.find('[data-slot="card-content"]').classes()).toEqual(expect.arrayContaining(['px-1']))
      expect(w.find('[data-slot="card-content"]').classes()).not.toContain('px-8')
    })
  })
})
