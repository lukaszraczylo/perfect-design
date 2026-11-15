import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import TableOfContents, { type TocItem } from './TableOfContents.vue'
import { TOC_SIZES, TOC_VARIANTS, tocLinkVariants, tocListVariants, tocTitleVariants, tocVariants } from './index'

const items: TocItem[] = [
  { id: 'a', label: 'Alpha', level: 2 },
  { id: 'b', label: 'Beta', level: 3 },
  { id: 'c', label: 'Gamma', level: 2 },
]
let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())
const make = (props: Record<string, unknown> = {}) => (wrapper = mount(TableOfContents, { props: { items, modelValue: 'b', ...props } }))
const links = () => wrapper!.findAll('[data-slot="table-of-contents-link"]')

describe('TableOfContents variations', () => {
  it('line md is the default and keeps today\'s classes', () => {
    make()
    const w = wrapper!
    expect(w.attributes('data-variant')).toBe('line')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.classes()).toEqual(['text-sm'])
    expect(w.get('ul').classes()).toEqual(['flex', 'flex-col', 'border-s'])
    expect(w.get('[data-slot="table-of-contents-title"]').classes()).toEqual(['mb-3', 'text-xs', 'font-semibold', 'text-muted-foreground'])
    expect(links()[1].classes()).toEqual(
      expect.arrayContaining(['-ms-px', 'block', 'min-h-6', 'rounded-e-sm', 'border-s-2', 'border-transparent', 'py-1', 'pe-2', 'text-muted-foreground', 'aria-[current=location]:border-primary', 'forced-colors:aria-[current=location]:underline', 'focus-visible:ring-3', 'ps-6']),
    )
    expect(links()[1].attributes('aria-current')).toBe('location')
  })

  describe('rail', () => {
    it('uses a thicker rule and shifts the marker by the same amount', () => {
      make({ variant: 'rail' })
      expect(wrapper!.attributes('data-variant')).toBe('rail')
      expect(wrapper!.get('ul').classes()).toContain('border-s-2')
      expect(wrapper!.get('ul').classes()).not.toContain('border-s')
      expect(links()[0].classes()).toContain('-ms-0.5')
      expect(links()[0].classes()).not.toContain('-ms-px')
      expect(links()[0].classes()).toContain('border-s-2')
    })
  })

  describe('boxed', () => {
    it('is a bordered card on the card surface with no rule', () => {
      make({ variant: 'boxed' })
      expect(wrapper!.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'p-4', 'text-card-foreground']))
      expect(wrapper!.get('ul').classes()).toContain('border-s-0')
      expect(wrapper!.get('ul').classes()).not.toContain('border-s')
    })

    it('fills the current entry and drops the border marker', () => {
      make({ variant: 'boxed' })
      const cls = links()[1].classes()
      expect(cls).toEqual(expect.arrayContaining(['aria-[current=location]:bg-accent', 'aria-[current=location]:text-accent-foreground', 'aria-[current=location]:font-medium', 'border-s-0', 'ms-0', 'rounded-md', 'forced-colors:aria-[current=location]:underline']))
      expect(cls).not.toContain('border-s-2')
      expect(cls).not.toContain('-ms-px')
      expect(cls).not.toContain('aria-[current=location]:text-foreground')
    })

    it('keeps indentation by level', () => {
      make({ variant: 'boxed' })
      expect(links().map((l) => l.classes().find((c) => c.startsWith('ps-')))).toEqual(['ps-3', 'ps-6', 'ps-3'])
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ])('%s sets %s on the nav', (size, cls) => {
      make({ size })
      expect(wrapper!.attributes('data-size')).toBe(size)
      expect(wrapper!.classes()).toContain(cls)
      if (size !== 'md') expect(wrapper!.classes()).not.toContain('text-sm')
    })

    it('lg enlarges the title and keeps links at least 24px tall at sm', () => {
      make({ size: 'lg' })
      expect(wrapper!.get('[data-slot="table-of-contents-title"]').classes()).toContain('text-sm')
      expect(wrapper!.get('[data-slot="table-of-contents-title"]').classes()).not.toContain('text-xs')
      wrapper!.unmount()
      make({ size: 'sm' })
      expect(links()[0].classes()).toContain('min-h-6')
      expect(links()[0].classes()).toContain('py-1')
    })
  })

  it('unknown variant and size fall back to the defaults', () => {
    make({ variant: 'dots', size: 'jumbo' })
    expect(wrapper!.attributes('data-variant')).toBe('line')
    expect(wrapper!.attributes('data-size')).toBe('md')
    expect(wrapper!.classes()).toEqual(['text-sm'])
  })

  it('every variant and size renders different markup', () => {
    expect(new Set(TOC_VARIANTS.map((variant) => (make({ variant }), wrapper!.html()))).size).toBe(3)
    expect(new Set(TOC_SIZES.map((size) => (make({ size }), wrapper!.html()))).size).toBe(3)
  })

  it.each(TOC_VARIANTS)('%s keeps the landmark, anchors, current marker and select events', async (variant) => {
    make({ variant, size: 'sm', title: 'Contents' })
    const w = wrapper!
    expect(w.element.tagName).toBe('NAV')
    expect(w.attributes('aria-label')).toBe('Contents')
    expect(links().map((l) => l.attributes('href'))).toEqual(['#a', '#b', '#c'])
    expect(links().filter((l) => l.attributes('aria-current') === 'location')).toHaveLength(1)
    await links()[2].trigger('click')
    expect(w.emitted('select')).toEqual([['c']])
  })

  it('class wins, an empty title hides the heading in every variant, and long labels are kept', () => {
    const long = 'A very long heading that keeps going '.repeat(6).trim()
    make({ variant: 'boxed', class: 'p-0 w-64', title: '', items: [{ id: 'x', label: long }] })
    expect(wrapper!.classes()).toContain('p-0')
    expect(wrapper!.classes()).not.toContain('p-4')
    expect(wrapper!.find('[data-slot="table-of-contents-title"]').exists()).toBe(false)
    expect(wrapper!.attributes('aria-label')).toBe('Table of contents')
    expect(links()[0].text()).toBe(long)
  })

  it('exported variants merge through cn()', () => {
    expect(cn(tocVariants({ size: 'sm' }))).toBe('text-xs')
    expect(cn(tocListVariants({ variant: 'rail' }))).toBe('flex flex-col border-s-2')
    expect(cn(tocLinkVariants({ variant: 'boxed' }))).toContain('border-s-0')
    expect(cn(tocTitleVariants({ size: 'lg' }))).toContain('text-sm')
  })
})
