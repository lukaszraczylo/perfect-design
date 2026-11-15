import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import InfiniteScroll from './InfiniteScroll.vue'
import { infiniteScrollErrorVariants, infiniteScrollFooterVariants, infiniteScrollSizes, infiniteScrollSpinnerVariants, infiniteScrollVariantNames } from './variants'

class FakeIO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

let wrappers: VueWrapper<any>[] = []
const make = (props: Record<string, unknown> = {}) => {
  const w = mount(InfiniteScroll, { props: { finished: true, ...props }, slots: { default: '<p>Item</p>' }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const set = (c: string[]) => [...c].sort()

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', FakeIO)
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

const end = (w: VueWrapper<any>) => w.find('[data-slot="infinite-scroll-end"]')
const loading = (w: VueWrapper<any>) => w.find('[data-slot="infinite-scroll-loading"]')
const error = (w: VueWrapper<any>) => w.find('[data-slot="infinite-scroll-error"]')

describe('InfiniteScroll footer variant and size', () => {
  describe('default output is unchanged', () => {
    it('end footer', () => {
      expect(set(end(make()).classes())).toEqual(set('py-4 text-center text-sm text-muted-foreground'.split(' ')))
    })
    it('loading footer and spinner', () => {
      const w = make({ loading: true })
      expect(set(loading(w).classes())).toEqual(set('flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground'.split(' ')))
      expect(set(w.find('[data-slot="infinite-scroll-loading"] > span').classes())).toEqual(set('size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none'.split(' ')))
    })
    it('error footer', () => {
      expect(set(error(make({ error: true })).classes())).toEqual(set('flex flex-col items-center gap-2 py-4 text-center text-sm text-destructive'.split(' ')))
    })
    it('no data-variant attribute on the root', () => {
      expect(make().attributes('data-variant')).toBeUndefined()
    })
  })

  describe('variant', () => {
    it('compact tightens every footer to py-2', () => {
      expect(end(make({ variant: 'compact' })).classes()).toEqual(expect.arrayContaining(['py-2']))
      expect(end(make({ variant: 'compact' })).classes()).not.toContain('py-4')
      expect(loading(make({ variant: 'compact', loading: true })).classes()).toContain('py-2')
      expect(error(make({ variant: 'compact', error: true })).classes()).toContain('py-2')
    })
    it('compact lays the error out on one wrapping row', () => {
      const c = error(make({ variant: 'compact', error: 'Failed' })).classes()
      expect(c).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap', 'justify-center']))
      expect(c).not.toContain('flex-col')
    })
    it('sets data-variant on the root only when not default', () => {
      expect(make({ variant: 'compact' }).attributes('data-variant')).toBe('compact')
      expect(make({ variant: 'default' }).attributes('data-variant')).toBeUndefined()
    })
    it('unknown variant falls back to default', () => {
      const w = make({ variant: 'dense' })
      expect(end(w).classes()).toContain('py-4')
      expect(w.attributes('data-variant')).toBeUndefined()
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs', 'size-3'],
      ['md', 'text-sm', 'size-4'],
      ['lg', 'text-base', 'size-5'],
    ] as const)('%s uses %s text and a %s spinner', (size, text, spinner) => {
      const l = loading(make({ size, loading: true }))
      expect(l.classes().filter((x) => /^text-(xs|sm|base)$/.test(x))).toEqual([text])
      expect(l.find('span').classes()).toContain(spinner)
      expect(end(make({ size })).classes()).toContain(text)
      expect(error(make({ size, error: true })).classes()).toContain(text)
    })
    it('unknown size falls back to md', () => {
      expect(end(make({ size: 'huge' })).classes()).toContain('text-sm')
    })
  })

  describe('combinations and a11y', () => {
    it('every variant x size keeps the live region, alert role and retry button', () => {
      for (const variant of infiniteScrollVariantNames)
        for (const size of infiniteScrollSizes) {
          const w = make({ variant, size, error: 'Could not load', finished: true })
          expect(w.find('[data-slot="infinite-scroll-status"]').attributes('role')).toBe('status')
          expect(error(w).attributes('role')).toBe('alert')
          const retry = w.find('[data-slot="infinite-scroll-retry"]')
          expect(retry.element.tagName).toBe('BUTTON')
          expect(retry.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
          expect(error(w).text()).toContain('Could not load')
        }
    })
    it('loading keeps aria-busy and a decorative spinner in every combination', () => {
      for (const variant of infiniteScrollVariantNames)
        for (const size of infiniteScrollSizes) {
          const w = make({ variant, size, loading: true })
          expect(w.attributes('aria-busy')).toBe('true')
          expect(loading(w).find('span').attributes('aria-hidden')).toBe('true')
          expect(loading(w).text()).toContain('Loading')
          expect(loading(w).find('span').classes()).toContain('motion-reduce:animate-none')
        }
    })
    it('custom slots still replace the default footer content with the same wrapper', () => {
      const w = mount(InfiniteScroll, { props: { finished: true, variant: 'compact', size: 'lg' }, slots: { end: '<em id="x">Done</em>' } })
      wrappers.push(w)
      expect(end(w).find('#x').text()).toBe('Done')
      expect(end(w).classes()).toEqual(expect.arrayContaining(['py-2', 'text-base']))
    })
    it('long error text wraps and stays inside the footer', () => {
      const w = make({ variant: 'compact', error: 'x '.repeat(500) })
      expect(error(w).classes()).toContain('flex-wrap')
      expect(error(w).classes()).toContain('text-center')
    })
    it('the class prop on the root still wins', () => {
      expect(make({ variant: 'compact', class: 'h-40' }).classes()).toEqual(expect.arrayContaining(['relative', 'h-40']))
    })
  })

  describe('exported cva helpers', () => {
    it('are reusable and have the documented defaults', () => {
      expect(set(infiniteScrollFooterVariants().split(' '))).toEqual(['py-4', 'text-sm'])
      expect(infiniteScrollFooterVariants({ variant: 'compact', size: 'sm' })).toBe('py-2 text-xs')
      expect(infiniteScrollErrorVariants()).toContain('flex-col')
      expect(infiniteScrollErrorVariants({ variant: 'compact' })).toContain('flex-row')
      expect(infiniteScrollSpinnerVariants({ size: 'lg' })).toContain('size-5')
      expect(infiniteScrollSpinnerVariants()).toContain('size-4')
    })
  })
})
