import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import BackToTop from './BackToTop.vue'
import { BACK_TO_TOP_SIZES, BACK_TO_TOP_VARIANTS, backToTopVariants } from './index'

let wrapper: VueWrapper | undefined
function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
  Object.defineProperty(window, 'pageYOffset', { value: y, configurable: true, writable: true })
  document.documentElement.scrollTop = y
  window.dispatchEvent(new Event('scroll'))
}
async function make(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  scrollTo(0)
  wrapper = mount(BackToTop, { props, slots: slots as never, attachTo: document.body })
  scrollTo(900)
  await flushPromises()
  return wrapper
}
const btn = () => document.body.querySelector<HTMLElement>('[data-slot="back-to-top"]')!
const reset = () => {
  wrapper?.unmount()
  document.body.innerHTML = ''
}

beforeEach(() => scrollTo(0))
afterEach(() => {
  reset()
  vi.restoreAllMocks()
})

describe('BackToTop variations', () => {
  it('button md is the default and keeps today\'s classes', async () => {
    await make()
    expect(btn().dataset.variant).toBe('button')
    expect(btn().dataset.size).toBe('md')
    for (const c of ['fixed', 'end-6', 'bottom-6', 'z-(--z-sticky)', 'rounded-full', 'shadow-lg', 'animate-ds-fade-in', 'motion-reduce:animate-none', 'size-11', 'bg-secondary']) expect(btn().className).toContain(c)
    expect(btn().querySelector('[data-slot="back-to-top-label"]')).toBeNull()
    expect(btn().querySelector('svg')).not.toBeNull()
    expect(btn().textContent?.trim()).toBe('')
    expect(backToTopVariants()).toContain('fixed end-6 bottom-6')
  })

  describe('pill', () => {
    it('shows the arrow and the label as visible text, in a rounded-full pill', async () => {
      await make({ variant: 'pill' })
      expect(btn().dataset.variant).toBe('pill')
      expect(btn().querySelector('svg')).not.toBeNull()
      expect(btn().querySelector('[data-slot="back-to-top-label"]')?.textContent).toBe('Back to top')
      expect(btn().className).toContain('rounded-full')
      expect(btn().className).toContain('px-4')
      expect(btn().className).not.toContain('size-11')
      expect(btn().className).toContain('pointer-coarse:min-h-11')
    })

    it('the visible text is the accessible name (label in name), including a custom label', async () => {
      await make({ variant: 'pill', label: 'Jump to top' })
      expect(btn().getAttribute('aria-label')).toBe('Jump to top')
      expect(btn().textContent).toContain('Jump to top')
      expect(btn().getAttribute('title')).toBe('Jump to top')
    })

    it('a custom default slot replaces both the icon and the label', async () => {
      await make({ variant: 'pill' }, { default: '<b class="mine">Up</b>' })
      expect(btn().querySelector('.mine')).not.toBeNull()
      expect(btn().querySelector('svg')).toBeNull()
      expect(btn().querySelector('[data-slot="back-to-top-label"]')).toBeNull()
    })

    it.each([
      ['sm', 'h-8'],
      ['md', 'h-9'],
      ['lg', 'h-11'],
    ])('size %s is a %s pill', async (size, h) => {
      await make({ variant: 'pill', size })
      expect(btn().className).toContain(h)
    })
  })

  describe('button size', () => {
    it.each([
      ['sm', 'size-9'],
      ['md', 'size-11'],
      ['lg', 'size-14'],
    ])('%s circle uses %s', async (size, cls) => {
      await make({ size })
      expect(btn().className).toContain(cls)
      expect(btn().dataset.size).toBe(size)
    })

    it('lg replaces the 44px Button size instead of stacking it', async () => {
      await make({ size: 'lg' })
      expect(btn().className).not.toContain('size-11')
    })

    it('sm still grows to 44px on coarse pointers through Button', async () => {
      await make({ size: 'sm' })
      expect(btn().className).toContain('pointer-coarse:size-11')
    })
  })

  it('unknown variant and size fall back to the defaults', async () => {
    await make({ variant: 'fab', size: 'huge' })
    expect(btn().dataset.variant).toBe('button')
    expect(btn().dataset.size).toBe('md')
    expect(btn().className).toContain('size-11')
  })

  it('every variant and size renders different markup', async () => {
    const seen = new Set<string>()
    for (const variant of BACK_TO_TOP_VARIANTS) {
      await make({ variant })
      seen.add(btn().outerHTML)
      reset()
    }
    expect(seen.size).toBe(2)
    const sizes = new Set<string>()
    for (const size of BACK_TO_TOP_SIZES) {
      await make({ size })
      sizes.add(btn().className)
      reset()
    }
    expect(sizes.size).toBe(3)
  })

  it('class wins over every variant and keeps working with a position override', async () => {
    await make({ variant: 'pill', size: 'lg', class: 'bottom-2 start-6 end-auto h-20' })
    expect(btn().className).toContain('bottom-2')
    expect(btn().className).not.toContain('bottom-6')
    expect(btn().className).toContain('start-6')
    expect(btn().className).toContain('h-20')
    expect(btn().className).not.toMatch(/(^|\s)h-11(\s|$)/)
  })

  it.each(BACK_TO_TOP_VARIANTS)('%s keeps the button semantics, the threshold and scrolling to the top', async (variant) => {
    const scroll = vi.fn()
    window.scrollTo = scroll as never
    await make({ variant, threshold: 100 })
    expect(btn().tagName).toBe('BUTTON')
    expect(btn().getAttribute('aria-label')).toBe('Back to top')
    await new Promise((r) => setTimeout(r, 5))
    btn().click()
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }))
    scrollTo(50)
    await flushPromises()
    expect(document.body.querySelector('[data-slot="back-to-top"]')).toBeNull()
  })

  it('exported variants merge through cn()', () => {
    expect(cn(backToTopVariants({ variant: 'button', size: 'lg' }))).toContain('size-14')
    expect(backToTopVariants({ variant: 'pill' })).toContain('pointer-coarse:min-h-11')
  })
})
