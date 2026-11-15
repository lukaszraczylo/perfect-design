import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LogoCloud from './LogoCloud.vue'
import Marquee from '../Marquee/Marquee.vue'
import { LOGO_CLOUD_LAYOUTS, LOGO_CLOUD_SIZES, logoCloudListVariants, logoCloudLogoVariants, resolveLogoCloudLayout, resolveLogoCloudSize } from './variants'

const logos = [
  { name: 'Kestrel Freight', src: '/kestrel.svg' },
  { name: 'Orchard Mill', href: 'https://orchard.example' },
  { name: 'sample-project', src: '/i.svg', href: '/i' },
]

describe('LogoCloud contrast regression', () => {
  const logos = [{ name: 'Kestrel Freight' }, { name: 'Orchard Mill', src: '/x.svg' }]
  it('never puts opacity on the logo element itself (text fallback keeps 4.5:1)', () => {
    const w = mount(LogoCloud, { props: { logos } })
    for (const el of w.findAll('[data-slot="logo-cloud-logo"]')) {
      expect(el.classes()).not.toContain('opacity-70')
      expect(el.classes()).not.toContain('grayscale')
      expect(el.classes().join(' ')).not.toMatch(/(^| )opacity-/)
    }
  })
  it('dims only the image in grayscale tone', () => {
    const w = mount(LogoCloud, { props: { logos } })
    expect(w.findAll('[data-slot="logo-cloud-logo"]')[1].classes()).toEqual(expect.arrayContaining(['[&>img]:opacity-70', '[&>img]:grayscale']))
    expect(w.find('[data-slot="logo-cloud-logo"]').classes()).toContain('text-muted-foreground')
  })
  it('colour tone leaves the image untouched', () => {
    const w = mount(LogoCloud, { props: { logos, tone: 'color' } })
    expect(w.findAll('[data-slot="logo-cloud-logo"]')[1].classes().join(' ')).not.toMatch(/opacity|grayscale/)
  })
  it('text fallback logos use the name; image logos use it as alt', () => {
    const w = mount(LogoCloud, { props: { logos } })
    expect(w.findAll('[data-slot="logo-cloud-logo"]')[0].text()).toBe('Kestrel Freight')
    expect(w.find('img').attributes('alt')).toBe('Orchard Mill')
  })
})

describe('LogoCloud', () => {
  describe('good path', () => {
    it('renders items as a list with images, text and links', () => {
      const w = mount(LogoCloud, { props: { logos, title: 'Trusted by' } })
      expect(w.attributes('data-slot')).toBe('logo-cloud')
      expect(w.find('[data-slot="logo-cloud-title"]').text()).toBe('Trusted by')
      expect(w.findAll('li')).toHaveLength(3)
      expect(w.find('img').attributes('alt')).toBe('Kestrel Freight')
      expect(w.findAll('a')).toHaveLength(2)
      expect(w.findAll('a')[0].text()).toBe('Orchard Mill')
      expect(w.findAll('a')[0].attributes('href')).toBe('https://orchard.example')
    })
    it('grayscale with hover reveal by default; can be disabled', () => {
      expect(mount(LogoCloud, { props: { logos } }).find('li > *').classes()).toContain('[&>img]:grayscale')
      expect(mount(LogoCloud, { props: { logos, grayscale: false } }).find('li > *').classes()).not.toContain('[&>img]:grayscale')
    })
    it.each([
      [3, 'md:grid-cols-3'],
      [4, 'md:grid-cols-4'],
      [5, 'md:grid-cols-5'],
      [6, 'md:grid-cols-6'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mount(LogoCloud, { props: { logos, columns } }).find('ul').classes()).toContain(cls)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(LogoCloud, { props: { logos, class: 'gap-2 custom' }, attrs: { id: 'l' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('l')
    })
  })
  describe('bad path', () => {
    it('empty list renders an empty ul and no title', () => {
      const w = mount(LogoCloud, { props: { logos: [] } })
      expect(w.findAll('li')).toHaveLength(0)
      expect(w.find('[data-slot="logo-cloud-title"]').exists()).toBe(false)
    })
    it('a broken image falls back to the name', async () => {
      const w = mount(LogoCloud, { props: { logos: [{ name: 'Broken', src: '/x.png' }] } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('li').text()).toBe('Broken')
    })
    it('invalid columns fall back to 5', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(LogoCloud, { props: { logos, columns: 2 } }).attributes('data-columns')).toBe('5')
    })
  })
  describe('edge cases', () => {
    it('one logo and 100 logos with duplicates', () => {
      expect(mount(LogoCloud, { props: { logos: [logos[0]] } }).findAll('li')).toHaveLength(1)
      const many = Array.from({ length: 100 }, () => ({ name: 'Same', src: '/s.svg' }))
      expect(mount(LogoCloud, { props: { logos: many } }).findAll('img')).toHaveLength(100)
    })
    it('failure of one duplicate-src logo does not hide the others', async () => {
      const w = mount(LogoCloud, { props: { logos: [{ name: 'A', src: '/s.svg' }, { name: 'B', src: '/s.svg' }] } })
      await w.findAll('img')[0].trigger('error')
      expect(w.findAll('img')).toHaveLength(1)
    })
    it('long and unicode names', () => {
      expect(mount(LogoCloud, { props: { logos: [{ name: '株式会社'.repeat(200) }] } }).find('li').text()).toHaveLength(800)
    })
  })

  describe('layouts', () => {
    it('defaults to grid, md, grayscale', () => {
      const w = mount(LogoCloud, { props: { logos } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-tone')).toBe('grayscale')
      expect(w.find('ul').classes()).toContain('grid')
    })
    it('inline: centred wrapping row, columns ignored', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'inline', columns: 3 } })
      expect(w.attributes('data-layout')).toBe('inline')
      expect(w.find('ul').classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'justify-center']))
      expect(w.find('ul').classes().join(' ')).not.toContain('grid-cols')
      expect(w.findAll('li')).toHaveLength(3)
      expect(w.findAll('a')).toHaveLength(2)
    })
    it('with-title: title left on lg with logos in a grid', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'with-title', title: 'Trusted by', columns: 4 } })
      expect(w.classes()).toContain('lg:flex-row')
      expect(w.find('[data-slot="logo-cloud-title"]').classes()).toEqual(expect.arrayContaining(['text-start', 'lg:shrink-0']))
      expect(w.find('ul').classes()).toEqual(expect.arrayContaining(['grid', 'flex-1', 'md:grid-cols-4']))
      expect(w.findAll('a')).toHaveLength(2)
    })
    it('with-title without a title still renders the logos', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'with-title' } })
      expect(w.find('[data-slot="logo-cloud-title"]').exists()).toBe(false)
      expect(w.findAll('li')).toHaveLength(3)
    })
    it('marquee: reuses Marquee with the title as label; logos are not linked', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'marquee', title: 'Customers', duration: 12, direction: 'right' } })
      const m = w.findComponent(Marquee)
      expect(m.exists()).toBe(true)
      expect(m.attributes('aria-label')).toBe('Customers')
      expect(m.attributes('data-reverse')).toBeDefined()
      expect(m.attributes('style')).toContain('--pd-marquee-duration: 12s')
      expect(w.find('ul').exists()).toBe(false)
      expect(w.find('a').exists()).toBe(false)
      expect(w.findAll('[data-slot="logo-cloud-logo"]').length).toBe(6) // content + aria-hidden clone
      expect(w.find('[data-slot="marquee-clone"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('img').attributes('alt')).toBe('Kestrel Freight')
    })
    it('marquee without title or extra props uses Marquee defaults', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'marquee' } })
      expect(w.find('[data-slot="marquee"]').attributes('role')).toBeUndefined()
      expect(w.find('[data-slot="marquee"]').attributes('data-reverse')).toBeUndefined()
      expect(w.find('[data-slot="marquee"]').attributes('style')).toContain('30s')
    })
    it('marquee: a broken image falls back to the name in that copy', async () => {
      const w = mount(LogoCloud, { props: { logos: [{ name: 'Broken', src: '/x.png' }], layout: 'marquee' } })
      await w.find('img').trigger('error')
      expect(w.findAll('img')).toHaveLength(1)
      expect(w.text()).toContain('Broken')
    })
    it('unknown layout falls back to grid', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(LogoCloud, { props: { logos, layout: 'carousel' } })
      expect(w.attributes('data-layout')).toBe('grid')
      expect(w.find('ul').classes()).toContain('grid')
    })
    it('title sits above the logos in grid, inline and marquee layouts', () => {
      for (const layout of ['grid', 'inline', 'marquee'] as const) {
        const w = mount(LogoCloud, { props: { logos, layout, title: 'T' } })
        expect(w.element.firstElementChild?.getAttribute('data-slot')).toBe('logo-cloud-title')
        expect(w.find('[data-slot="logo-cloud-title"]').classes()).toContain('text-center')
      }
    })
  })

  describe('tone and size', () => {
    it('tone=grayscale and tone=color', () => {
      expect(mount(LogoCloud, { props: { logos, tone: 'grayscale' } }).find('li > *').classes()).toContain('[&>img]:grayscale')
      const color = mount(LogoCloud, { props: { logos, tone: 'color' } })
      expect(color.find('li > *').classes()).not.toContain('[&>img]:grayscale')
      expect(color.attributes('data-tone')).toBe('color')
    })
    it('tone wins over the grayscale prop', () => {
      expect(mount(LogoCloud, { props: { logos, tone: 'color', grayscale: true } }).attributes('data-tone')).toBe('color')
      expect(mount(LogoCloud, { props: { logos, tone: 'grayscale', grayscale: false } }).attributes('data-tone')).toBe('grayscale')
    })
    it('invalid tone falls back to the grayscale prop', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(LogoCloud, { props: { logos, tone: 'sepia', grayscale: false } }).attributes('data-tone')).toBe('color')
      // @ts-expect-error deliberately invalid
      expect(mount(LogoCloud, { props: { logos, tone: 'sepia' } }).attributes('data-tone')).toBe('grayscale')
    })
    it.each([
      ['sm', 'h-8'],
      ['md', 'h-12'],
      ['lg', 'h-16'],
    ] as const)('size %s sets logo height', (size, cls) => {
      const w = mount(LogoCloud, { props: { logos, size } })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.find('li > *').classes()).toContain(cls)
    })
    it('invalid size falls back to md', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(LogoCloud, { props: { logos, size: 'huge' } })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.find('li > *').classes()).toContain('h-12')
    })
    it('size and tone apply in the marquee layout', () => {
      const w = mount(LogoCloud, { props: { logos, layout: 'marquee', size: 'lg', tone: 'color' } })
      const logo = w.find('[data-slot="logo-cloud-logo"]')
      expect(logo.classes()).toContain('h-16')
      expect(logo.classes()).not.toContain('[&>img]:grayscale')
    })
  })

  describe('variant helpers and customisation', () => {
    it('exports helpers', () => {
      expect(LOGO_CLOUD_LAYOUTS).toEqual(['grid', 'inline', 'marquee', 'with-title', 'split', 'centered', 'card'])
      expect(LOGO_CLOUD_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(resolveLogoCloudLayout('inline')).toBe('inline')
      expect(resolveLogoCloudLayout(1)).toBe('grid')
      expect(resolveLogoCloudSize('lg')).toBe('lg')
      expect(resolveLogoCloudSize(null)).toBe('md')
      expect(logoCloudListVariants({ layout: 'grid', columns: 6 })).toContain('md:grid-cols-6')
      expect(logoCloudLogoVariants({ tone: 'color', size: 'sm' })).toContain('h-8')
    })
    it('class override and attrs pass through in every layout', () => {
      for (const layout of LOGO_CLOUD_LAYOUTS) {
        const w = mount(LogoCloud, { props: { logos, layout, class: 'gap-1 custom' }, attrs: { id: 'x' } })
        expect(w.classes()).toContain('custom')
        expect(w.classes()).not.toContain('gap-6')
        expect(w.classes()).not.toContain('gap-8')
        expect(w.attributes('id')).toBe('x')
      }
    })
    it('a changed src resets the broken state', async () => {
      const w = mount(LogoCloud, { props: { logos: [{ name: 'A', src: '/bad.png' }] } })
      await w.find('img').trigger('error')
      expect(w.find('img').exists()).toBe(false)
      await w.setProps({ logos: [{ name: 'A', src: '/good.png' }] })
      expect(w.find('img').attributes('src')).toBe('/good.png')
    })
  })

  describe('layout edge cases', () => {
    it('empty logos render safely in every layout', () => {
      for (const layout of LOGO_CLOUD_LAYOUTS) {
        const w = mount(LogoCloud, { props: { logos: [], layout, title: 'T' } })
        expect(w.findAll('[data-slot="logo-cloud-logo"]')).toHaveLength(0)
      }
    })
    it('one logo and 100 logos in marquee and inline', () => {
      const many = Array.from({ length: 100 }, (_, i) => ({ name: `L${i}`, src: '/s.svg' }))
      expect(mount(LogoCloud, { props: { logos: many, layout: 'marquee' } }).findAll('img')).toHaveLength(200)
      expect(mount(LogoCloud, { props: { logos: many, layout: 'inline' } }).findAll('li')).toHaveLength(100)
      expect(mount(LogoCloud, { props: { logos: [logos[0]], layout: 'marquee' } }).findAll('img')).toHaveLength(2)
    })
    it('very long unicode names and title', () => {
      const w = mount(LogoCloud, { props: { logos: [{ name: '😀'.repeat(300) }], layout: 'with-title', title: '数'.repeat(1000) } })
      expect(w.find('[data-slot="logo-cloud-title"]').text()).toHaveLength(1000)
      expect(w.find('li').text()).toHaveLength(600)
    })
    it('switching layouts repeatedly and unmounting is clean', async () => {
      const w = mount(LogoCloud, { props: { logos, title: 'T' } })
      for (let n = 0; n < 16; n++) await w.setProps({ layout: LOGO_CLOUD_LAYOUTS[n % 4] })
      expect(w.attributes('data-layout')).toBe('with-title')
      w.unmount()
    })
  })
})
