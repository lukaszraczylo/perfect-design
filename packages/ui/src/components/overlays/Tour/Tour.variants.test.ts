import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Tour from './Tour.vue'
import type { TourStep } from './Tour.vue'
import { tourCardVariants, tourSizes, tourVariantNames } from './index'

const steps: TourStep[] = [
  { target: '#t-a', title: 'First', description: 'Desc one' },
  { target: null, title: 'Second', description: 'Desc two' },
  { target: null, title: 'Third' },
]

let wrappers: VueWrapper[] = []
function make(props: Record<string, unknown> = {}) {
  const w = mount(Tour, { props: { steps, open: true, teleport: false, ...props }, attachTo: document.body })
  wrappers.push(w)
  return w
}
beforeEach(() => {
  document.body.innerHTML = '<div id="t-a"></div>'
  vi.spyOn(document.getElementById('t-a')!, 'getBoundingClientRect').mockReturnValue({ top: 100, left: 100, width: 80, height: 30, x: 100, y: 100, right: 180, bottom: 130, toJSON: () => ({}) } as DOMRect)
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
const card = (w: VueWrapper) => w.find('[data-slot="tour-card"]')
const progress = (w: VueWrapper) => w.find('[data-slot="tour-progress"]')

describe('Tour size validation', () => {
  it.each([
    ['sm', 'w-64'],
    ['md', 'w-80'],
    ['lg', 'w-96'],
  ] as const)('size %s sets %s', (size, cls) => {
    expect(card(make({ size })).classes()).toContain(cls)
  })

  it('unknown size falls back to md (the card keeps a width)', () => {
    const c = card(make({ size: 'huge' }))
    expect(c.classes()).toContain('w-80')
    expect(tourSizes).toEqual(['sm', 'md', 'lg'])
  })
})

describe('Tour variant', () => {
  it('lists the variants', () => expect(tourVariantNames).toEqual(['default', 'compact', 'dots']))

  it('default keeps the original card: gap-3 p-4, text progress, no data-variant', async () => {
    const w = make()
    await nextTick()
    const c = card(w)
    expect(c.classes()).toEqual(expect.arrayContaining(['gap-3', 'p-4', 'rounded-lg', 'border', 'bg-popover', 'w-80']))
    expect(c.attributes('data-variant')).toBeUndefined()
    expect(progress(w).text()).toBe('1 / 3')
    expect(w.find('[data-slot="tour-dot"]').exists()).toBe(false)
    expect(tourCardVariants()).toBe(tourCardVariants({ size: 'md', variant: 'default' }))
  })

  it('compact tightens padding and gap and shrinks the description, keeping the dialog semantics', async () => {
    const w = make({ variant: 'compact' })
    await nextTick()
    const c = card(w)
    expect(c.attributes('data-variant')).toBe('compact')
    expect(c.classes()).toEqual(expect.arrayContaining(['gap-2', 'p-3']))
    expect(c.classes()).not.toContain('p-4')
    expect(c.classes()).not.toContain('gap-3')
    expect(c.classes().join(' ')).toContain('[&_[data-slot=tour-description]]:text-xs')
    expect(c.attributes('role')).toBe('dialog')
    expect(c.attributes('aria-modal')).toBe('true')
    expect(progress(w).text()).toBe('1 / 3')
  })

  it('dots renders one aria-hidden dot per step, marks the current one, and keeps the progress text for screen readers', async () => {
    const w = make({ variant: 'dots' })
    await nextTick()
    const dots = w.findAll('[data-slot="tour-dot"]')
    expect(dots).toHaveLength(3)
    expect(dots.map((d) => d.attributes('data-active') !== undefined)).toEqual([true, false, false])
    expect(dots[0].classes()).toEqual(expect.arrayContaining(['bg-primary', 'border-primary']))
    expect(dots[0].classes().join(' ')).toContain('forced-colors:bg-[Highlight]')
    // inactive dots differ in more than colour: they are outlined, not filled
    expect(dots[1].classes()).toContain('border-muted-foreground')
    expect(dots[1].classes()).not.toContain('bg-primary')
    expect(dots[0].element.parentElement!.getAttribute('aria-hidden')).toBe('true')
    expect(w.find('[data-slot="tour-progress"] .sr-only').text()).toBe('1 / 3')
    expect(card(w).attributes('data-variant')).toBe('dots')
    expect(card(w).classes()).toEqual(expect.arrayContaining(['gap-3', 'p-4']))
  })

  it('the dots follow the step and the progress description id stays wired', async () => {
    const w = make({ variant: 'dots' })
    await nextTick()
    const id = progress(w).attributes('id')!
    expect(card(w).attributes('aria-describedby')).toContain(id)
    await w.find('[data-slot="tour-next"]').trigger('click')
    await nextTick()
    const dots = w.findAll('[data-slot="tour-dot"]')
    expect(dots.map((d) => d.attributes('data-active') !== undefined)).toEqual([false, true, false])
    expect(w.find('[data-slot="tour-progress"] .sr-only').text()).toBe('2 / 3')
  })

  it('dots honours progressFormat for the screen reader text and showProgress=false removes the dots', async () => {
    const w = make({ variant: 'dots', progressFormat: (c: number, t: number) => `Step ${c} of ${t}` })
    await nextTick()
    expect(w.find('[data-slot="tour-progress"] .sr-only').text()).toBe('Step 1 of 3')
    const off = make({ variant: 'dots', showProgress: false })
    await nextTick()
    expect(off.find('[data-slot="tour-progress"]').exists()).toBe(false)
    expect(off.find('[data-slot="tour-dot"]').exists()).toBe(false)
  })

  it('unknown variant falls back to default', async () => {
    const w = make({ variant: 'fancy' })
    await nextTick()
    expect(card(w).attributes('data-variant')).toBeUndefined()
    expect(card(w).classes()).toContain('p-4')
    expect(progress(w).text()).toBe('1 / 3')
  })

  it('every size and variant combination renders one width and the controls', async () => {
    for (const size of tourSizes) {
      for (const variant of tourVariantNames) {
        const w = make({ size, variant })
        await nextTick()
        expect(card(w).classes().filter((c) => /^w-(64|80|96)$/.test(c))).toHaveLength(1)
        expect(w.find('[data-slot="tour-next"]').exists()).toBe(true)
        expect(card(w).attributes('aria-labelledby')).toBeTruthy()
      }
    }
  })

  it('cardClass wins over the variant classes', async () => {
    const w = make({ variant: 'compact', cardClass: 'p-8' })
    await nextTick()
    expect(card(w).classes()).toContain('p-8')
    expect(card(w).classes()).not.toContain('p-3')
  })

  it('a variant change re-measures: the card is repositioned', async () => {
    const w = make({ variant: 'default' })
    await nextTick()
    await w.setProps({ variant: 'compact' })
    await nextTick()
    expect(card(w).attributes('data-variant')).toBe('compact')
    expect(card(w).attributes('style')).toContain('top:')
  })
})
