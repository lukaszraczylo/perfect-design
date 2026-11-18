import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { faLightbulb } from '../../../lib/icons'
import BrandLink from './BrandLink.vue'
import { BRAND_LINK_SIZES, brandLinkLogoVariants, brandLinkVariants } from './index'

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], default: undefined } },
  setup: (p, { slots, attrs }) => () => h('a', { ...attrs, href: typeof p.to === 'string' ? p.to : '/obj', 'data-router': '' }, slots.default?.()),
})

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

describe('BrandLink', () => {
  describe('good path', () => {
    it('renders an anchor to / with the logo and the name', () => {
      const w = mount(BrandLink, { props: { name: 'Kestrel Freight', icon: faLightbulb } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/')
      expect(w.attributes('data-slot')).toBe('brand-link')
      expect(w.find('[data-slot="brand-link-logo"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="brand-link-name"]').element.tagName).toBe('BDI')
      expect(w.text()).toBe('Kestrel Freight')
    })

    it('uses a custom href', () => {
      expect(mount(BrandLink, { props: { name: 'Orchard Mill', href: '/home' } }).attributes('href')).toBe('/home')
    })

    it('hides the logo from assistive tech so the name is the accessible name', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb } })
      expect(w.find('[data-slot="brand-link-logo"]').attributes('aria-hidden')).toBe('true')
      expect(w.attributes('aria-label')).toBeUndefined()
    })

    it('tints the logo with the primary colour', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb } })
      expect(w.find('[data-slot="brand-link-logo"]').classes()).toContain('text-primary')
    })
  })

  describe('sizes', () => {
    it('md is the default: size-6 logo and text-lg name', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb } })
      expect(w.classes()).toContain('text-lg')
      expect(w.find('[data-slot="brand-link-logo"]').classes()).toContain('size-6')
      expect(brandLinkVariants()).toBe(brandLinkVariants({ size: 'md' }))
    })

    it.each([
      ['sm', 'text-base', 'size-5'],
      ['md', 'text-lg', 'size-6'],
      ['lg', 'text-xl', 'size-8'],
    ] as const)('size %s sets %s and %s', (size, text, box) => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb, size } })
      expect(w.classes()).toContain(text)
      expect(w.find('[data-slot="brand-link-logo"]').classes()).toContain(box)
      expect(brandLinkLogoVariants({ size })).toContain(box)
    })

    it('falls back to md for an unknown size', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb, size: 'huge' as never } })
      expect(w.classes()).toContain('text-lg')
      expect(w.find('[data-slot="brand-link-logo"]').classes()).toContain('size-6')
      expect(BRAND_LINK_SIZES).toEqual(['sm', 'md', 'lg'])
    })

    it('keeps a 24px minimum target and a 44px coarse-pointer target', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11', 'rounded-md']))
    })
  })

  describe('customisation', () => {
    it('merges class and lets it win', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', class: 'text-sm rounded-none' } })
      expect(w.classes()).toContain('text-sm')
      expect(w.classes()).not.toContain('text-lg')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-md')
    })

    it('passes attributes and listeners through', async () => {
      const onClick = vi.fn()
      const w = mount(BrandLink, { props: { name: 'Orchard Mill' }, attrs: { id: 'brand', 'data-test': 'x', 'aria-describedby': 'd', onClick } })
      expect(w.attributes('id')).toBe('brand')
      expect(w.attributes('data-test')).toBe('x')
      expect(w.attributes('aria-describedby')).toBe('d')
      await w.trigger('click')
      expect(onClick).toHaveBeenCalledOnce()
    })

    it('renders another element with `as` and drops href', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', as: 'button' } })
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('href')).toBeUndefined()
    })

    it('renders a router link with `as` and `to`, keeping the logo and name', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', icon: faLightbulb, as: RouterLinkStub }, attrs: { to: '/home' } })
      expect(w.attributes('data-router')).toBeDefined()
      expect(w.attributes('href')).toBe('/home')
      expect(w.attributes('data-slot')).toBe('brand-link')
      expect(w.find('[data-slot="brand-link-name"]').text()).toBe('Orchard Mill')
      expect(w.find('[data-slot="brand-link-logo"]').exists()).toBe(true)
    })

    it('with asChild renders the child element and merges classes onto it', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill', asChild: true }, slots: { default: () => h('a', { href: '/x' }, 'Own content') } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/x')
      expect(w.attributes('data-slot')).toBe('brand-link')
      expect(w.classes()).toContain('text-lg')
      expect(w.text()).toBe('Own content')
      expect(w.find('[data-slot="brand-link-name"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('renders the name alone without an icon', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill' } })
      expect(w.find('[data-slot="brand-link-logo"]').exists()).toBe(false)
      expect(w.text()).toBe('Orchard Mill')
    })

    it('replaces the icon with the logo slot', () => {
      const w = mount(BrandLink, {
        props: { name: 'Orchard Mill', icon: faLightbulb },
        slots: { logo: '<img data-test="logo" alt="" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27/%3E" />' },
      })
      expect(w.find('[data-slot="brand-link-logo"] img[data-test="logo"]').exists()).toBe(true)
      expect(w.find('[data-slot="brand-link-logo"] svg').exists()).toBe(false)
    })

    it('shows the logo slot without an icon prop', () => {
      const w = mount(BrandLink, { props: { name: 'Orchard Mill' }, slots: { logo: '<svg data-test="mark" />' } })
      expect(w.find('[data-slot="brand-link-logo"] [data-test="mark"]').exists()).toBe(true)
    })

    it('keeps a long name inside the link with truncation', () => {
      const name = 'Kestrel Freight and Brightwater Co Combined Logistics Holding Group '.repeat(4).trim()
      const w = mount(BrandLink, { props: { name } })
      expect(w.find('[data-slot="brand-link-name"]').text()).toBe(name)
      expect(w.find('[data-slot="brand-link-name"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
    })

    it('keeps an RTL or unicode name intact inside bdi', () => {
      const w = mount(BrandLink, { props: { name: 'مطحنة Orchard 東京', icon: faLightbulb }, attrs: { dir: 'rtl' } })
      expect(w.find('bdi').text()).toBe('مطحنة Orchard 東京')
      expect(w.html()).not.toMatch(/\b(left|right)-/)
    })

    it('escapes markup in the name', () => {
      const w = mount(BrandLink, { props: { name: '<b>Orchard</b>' } })
      expect(w.find('bdi b').exists()).toBe(false)
      expect(w.text()).toBe('<b>Orchard</b>')
    })
  })
})

describe('BrandLink contract', () => {
  beforeEach(() => configureStrictMode('throw'))
  afterEach(() => configureStrictMode('off'))

  const capture = async (props: Record<string, unknown>) => {
    const errors: Error[] = []
    const Host = defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(BrandLink, props as never)
      },
    })
    const w = mount(Host)
    await settle()
    w.unmount()
    return errors
  }

  it('throws a ContractError when the name is empty', async () => {
    const errors = await capture({ name: '' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('BrandLink: requires a non-empty `name`')
  })

  it('throws a ContractError when the name is only whitespace', async () => {
    const errors = await capture({ name: '   ' })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a non-empty `name`')
  })

  it('throws a ContractError when the name is missing', async () => {
    expect(await capture({})).toHaveLength(1)
  })

  it('passes with a name', async () => {
    expect(await capture({ name: 'Orchard Mill', icon: faLightbulb })).toHaveLength(0)
  })

  it('warn logs without throwing and off is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    configureStrictMode('warn')
    expect(await capture({ name: '' })).toHaveLength(0)
    expect(spy).toHaveBeenCalledOnce()
    spy.mockClear()
    configureStrictMode('off')
    expect(await capture({ name: '' })).toHaveLength(0)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
