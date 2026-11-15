import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { cn } from '../../../lib/cn'
import {
  BREADCRUMB_SEPARATORS,
  BREADCRUMB_SIZES,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  breadcrumbListVariants,
} from './index'

const items = [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }]
let w: VueWrapper | undefined
afterEach(() => w?.unmount())
const mountIt = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => (w = mount(Breadcrumb, { props: { items, ...props }, slots }))
const list = () => w!.get('[data-slot="breadcrumb-list"]')
const seps = () => w!.findAll('[data-slot="breadcrumb-separator"]')

describe('Breadcrumb size', () => {
  it('md is the default and keeps today\'s classes', () => {
    mountIt()
    expect(w!.attributes('data-size')).toBe('md')
    expect(list().classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'items-center', 'gap-1.5', 'text-sm', 'text-muted-foreground', 'sm:gap-2']))
    expect(breadcrumbListVariants()).toBe('flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2')
    expect(breadcrumbListVariants({ size: 'md' })).toBe(breadcrumbListVariants())
  })

  it('sm uses smaller text and a tighter gap, replacing the md classes', () => {
    mountIt({ size: 'sm' })
    expect(w!.attributes('data-size')).toBe('sm')
    expect(list().classes()).toContain('text-xs')
    expect(list().classes()).toContain('gap-1')
    expect(list().classes()).not.toContain('text-sm')
    expect(list().classes()).not.toContain('gap-1.5')
    expect(list().classes()).toContain('sm:gap-1.5')
    expect(list().classes()).not.toContain('sm:gap-2')
  })

  it('lg uses larger text', () => {
    mountIt({ size: 'lg' })
    expect(list().classes()).toContain('text-base')
    expect(list().classes()).not.toContain('text-sm')
  })

  it('unknown size falls back to md', () => {
    mountIt({ size: 'giant' })
    expect(w!.attributes('data-size')).toBe('md')
    expect(list().classes()).toContain('text-sm')
  })

  it('every size renders a different list', () => {
    expect(new Set(BREADCRUMB_SIZES.map((size) => cn(breadcrumbListVariants({ size }))))).toHaveProperty('size', 3)
  })

  it('compound parts follow the size set on the root', () => {
    w = mount({
      components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator },
      template: `<Breadcrumb size="sm" separator="slash"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Now</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>`,
    }) as unknown as VueWrapper
    expect(list().classes()).toContain('text-xs')
    expect(seps()[0].text()).toBe('/')
  })

  it('a list used without a Breadcrumb root keeps the default size', () => {
    const solo = mount(BreadcrumbList)
    expect(solo.classes()).toContain('text-sm')
    solo.unmount()
  })

  it('class on the list and the root still wins', () => {
    mountIt({ size: 'sm', class: 'root-x' })
    expect(w!.classes()).toContain('root-x')
    const solo = mount(BreadcrumbList, { props: { class: 'text-lg gap-6' } })
    expect(solo.classes()).toContain('text-lg')
    expect(solo.classes()).toContain('gap-6')
    solo.unmount()
  })
})

describe('Breadcrumb separator', () => {
  it('chevron is the default: an svg icon that flips in RTL', () => {
    mountIt()
    expect(w!.attributes('data-separator')).toBe('chevron')
    expect(seps()).toHaveLength(2)
    expect(seps()[0].attributes('data-kind')).toBe('chevron')
    expect(seps()[0].find('svg').exists()).toBe(true)
    expect(seps()[0].find('svg').classes()).toContain('rtl:rotate-180')
  })

  it('slash renders a text glyph', () => {
    mountIt({ separator: 'slash' })
    expect(w!.attributes('data-separator')).toBe('slash')
    expect(seps().map((s) => s.text())).toEqual(['/', '/'])
    expect(seps()[0].find('svg').exists()).toBe(false)
  })

  it('dot renders a small round marker without text', () => {
    mountIt({ separator: 'dot' })
    expect(seps()[0].attributes('data-kind')).toBe('dot')
    const glyph = seps()[0].get('[data-slot="breadcrumb-separator-glyph"]')
    expect(glyph.classes()).toEqual(expect.arrayContaining(['size-1', 'rounded-full', 'bg-current']))
    expect(seps()[0].text()).toBe('')
  })

  it.each(BREADCRUMB_SEPARATORS)('%s separators are decorative: aria-hidden, presentation, never announced', (separator) => {
    mountIt({ separator })
    for (const s of seps()) {
      expect(s.attributes('aria-hidden')).toBe('true')
      expect(s.attributes('role')).toBe('presentation')
    }
    expect(w!.findAll('li[aria-current="page"],[aria-current="page"]')).toHaveLength(1)
  })

  it('unknown separator falls back to the chevron', () => {
    mountIt({ separator: 'arrow' })
    expect(w!.attributes('data-separator')).toBe('chevron')
    expect(seps()[0].find('svg').exists()).toBe(true)
  })

  it('every kind renders different markup', () => {
    const html = BREADCRUMB_SEPARATORS.map((separator) => {
      mountIt({ separator })
      const out = seps()[0].html()
      w!.unmount()
      return out
    })
    expect(new Set(html).size).toBe(3)
  })

  it('the separator slot wins over the separator prop', () => {
    mountIt({ separator: 'slash' }, { separator: '<span class="mine">&gt;</span>' })
    expect(seps()[0].find('.mine').exists()).toBe(true)
    expect(seps()[0].text()).toBe('>')
  })

  it('compound separators follow the root and a standalone one defaults to the chevron', () => {
    const solo = mount(BreadcrumbSeparator)
    expect(solo.attributes('data-kind')).toBe('chevron')
    expect(solo.find('svg').exists()).toBe(true)
    solo.unmount()
    w = mount({
      components: { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator },
      template: `<Breadcrumb separator="dot"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator class="mine" /><BreadcrumbItem><BreadcrumbPage>Now</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>`,
    }) as unknown as VueWrapper
    expect(seps()[0].attributes('data-kind')).toBe('dot')
    expect(seps()[0].classes()).toContain('mine')
  })

  it('combines with size and truncation without conflicts', () => {
    mountIt(
      { separator: 'slash', size: 'lg', maxItems: 3, items: [...items.slice(0, 2), { label: 'Three', href: '/3' }, { label: 'Four', href: '/4' }, { label: 'Five' }] },
    )
    expect(list().classes()).toContain('text-base')
    expect(seps().length).toBeGreaterThan(0)
    expect(seps().every((s) => s.text() === '/')).toBe(true)
    expect(w!.find('[data-slot="breadcrumb-ellipsis"]').exists()).toBe(true)
  })

  it('handles very long labels without dropping the separator', () => {
    const long = 'Very long page title '.repeat(12).trim()
    mountIt({ separator: 'dot', items: [{ label: 'Home', href: '/' }, { label: long }] })
    expect(w!.get('[data-slot="breadcrumb-page"]').text()).toBe(long)
    expect(seps()).toHaveLength(1)
    expect(list().classes()).toContain('break-words')
    expect(list().classes()).toContain('flex-wrap')
  })
})
