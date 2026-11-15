import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import LogoCloud from './LogoCloud.vue'
import Marquee from '../Marquee/Marquee.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import {
  LOGO_CLOUD_GAPS,
  LOGO_CLOUD_LAYOUTS,
  LOGO_CLOUD_SHAPES,
  LOGO_CLOUD_SIZES,
  LOGO_CLOUD_TONES,
  logoCloudListVariants,
  logoCloudLogoVariants,
  logoCloudTitleVariants,
  logoCloudVariants,
  resolveLogoCloudGap,
  resolveLogoCloudShape,
} from './variants'

const { errors, open } = useContractHarness()
const logos = [{ name: 'Kestrel Freight', src: '/kestrel.svg' }, { name: 'Orchard Mill', href: '/orchard' }, { name: 'Halden Optics' }]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
})
const mountWith = (props: Record<string, unknown> = {}) => (w = mount(LogoCloud, { props: { logos, title: 'Sample logos', ...props } }))
const list = () => w!.find('ul')
const logo = (i = 0) => w!.findAll('[data-slot="logo-cloud-logo"]')[i]
const title = () => w!.find('[data-slot="logo-cloud-title"]')

describe('LogoCloud variations', () => {
  describe('defaults are unchanged', () => {
    it('keeps the original grid output', () => {
      mountWith()
      expect([...w!.classes()].sort()).toEqual(['flex', 'flex-col', 'gap-6'])
      expect([...list().classes()].sort()).toEqual(['md:grid-cols-5', 'gap-x-8', 'gap-y-6', 'grid', 'grid-cols-2', 'items-center', 'sm:grid-cols-3'].sort())
      expect([...logo(1).classes()].sort()).toEqual(
        ['flex', 'items-center', 'justify-center', 'rounded-sm', 'text-center', 'font-semibold', 'text-muted-foreground', 'h-12', 'text-base', '[&>img]:opacity-70', '[&>img]:grayscale', '[&>img]:transition-[filter,opacity]', 'motion-reduce:[&>img]:transition-none', 'hover:[&>img]:opacity-100', 'hover:[&>img]:grayscale-0', 'focus-visible:[&>img]:opacity-100', 'focus-visible:[&>img]:grayscale-0', 'outline-hidden', 'focus-visible:border-ring', 'focus-visible:ring-3', 'focus-visible:ring-ring/40'].sort(),
      )
      expect(w!.attributes('data-shape')).toBe('plain')
      expect(w!.attributes('data-gap')).toBe('md')
    })
    it('inline keeps its original row classes', () => {
      mountWith({ layout: 'inline' })
      expect([...list().classes()].sort()).toEqual(['flex', 'flex-wrap', 'gap-x-10', 'gap-y-6', 'items-center', 'justify-center'])
    })
  })

  describe('layout split', () => {
    it('puts a headline-size title on a third and wrapping logos beside it from lg', () => {
      mountWith({ layout: 'split' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['lg:flex-row', 'lg:items-start', 'gap-8']))
      expect(title().classes()).toEqual(expect.arrayContaining(['text-xl', 'font-semibold', 'text-foreground', 'text-start', 'lg:w-1/3', 'lg:shrink-0']))
      expect(list().classes()).toEqual(expect.arrayContaining(['flex', 'flex-1', 'flex-wrap', 'justify-start', 'gap-x-10', 'gap-y-6']))
      expect(list().classes().join(' ')).not.toContain('grid-cols')
      expect(w!.attributes('data-layout')).toBe('split')
    })
    it('differs from with-title (caption size, grid) and ignores columns', () => {
      mountWith({ layout: 'split', columns: 3 })
      expect(title().classes()).not.toContain('lg:max-w-56')
      expect(list().classes().join(' ')).not.toMatch(/md:grid-cols/)
    })
    it('renders every logo with its link and alt, and works without a title', () => {
      mountWith({ layout: 'split', title: undefined })
      expect(title().exists()).toBe(false)
      expect(w!.findAll('li')).toHaveLength(3)
      expect(w!.find('img').attributes('alt')).toBe('Kestrel Freight')
      expect(w!.find('a').attributes('href')).toBe('/orchard')
    })
  })

  describe('layout centered', () => {
    it('centres a headline-size title above a centred wrapping row', () => {
      mountWith({ layout: 'centered' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['items-center', 'gap-8']))
      expect(title().classes()).toEqual(expect.arrayContaining(['text-center', 'text-lg', 'font-semibold', 'text-foreground', 'max-w-xl', 'text-balance']))
      expect(list().classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap', 'justify-center']))
      expect(w!.attributes('data-layout')).toBe('centered')
    })
    it('title and logos stay in DOM order (title first)', () => {
      mountWith({ layout: 'centered' })
      expect(w!.element.firstElementChild).toBe(title().element)
    })
  })

  describe('layout card', () => {
    it('wraps the strip in a bordered panel on the card surface', () => {
      mountWith({ layout: 'card' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'p-6', 'sm:p-8']))
      expect(title().classes()).toContain('text-start')
      expect(title().classes()).toContain('text-muted-foreground')
      expect(list().classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-5']))
    })
    it('honours columns', () => {
      mountWith({ layout: 'card', columns: 3 })
      expect(list().classes()).toContain('md:grid-cols-3')
      expect(list().classes()).not.toContain('md:grid-cols-5')
    })
    it('the other layouts have no panel', () => {
      for (const layout of LOGO_CLOUD_LAYOUTS.filter((l) => l !== 'card')) {
        mountWith({ layout })
        expect(w!.classes()).not.toContain('bg-card')
        expect(w!.classes()).not.toContain('border')
        w!.unmount()
      }
      w = undefined
    })
    it('has no landmark role of its own', () => {
      mountWith({ layout: 'card' })
      expect(w!.attributes('role')).toBeUndefined()
    })
  })

  describe('gap', () => {
    it.each([
      ['sm', ['gap-x-4', 'gap-y-4']],
      ['md', ['gap-x-8', 'gap-y-6']],
      ['lg', ['gap-x-12', 'gap-y-8']],
    ] as const)('grid %s uses %j', (gap, cls) => {
      mountWith({ gap })
      expect(list().classes()).toEqual(expect.arrayContaining([...cls]))
      expect(list().classes().filter((c) => /^gap-/.test(c))).toHaveLength(2)
      expect(w!.attributes('data-gap')).toBe(gap)
    })
    it.each([
      ['inline', 'sm', ['gap-x-6', 'gap-y-4']],
      ['inline', 'lg', ['gap-x-16', 'gap-y-8']],
      ['split', 'sm', ['gap-x-6', 'gap-y-4']],
      ['centered', 'lg', ['gap-x-16', 'gap-y-8']],
      ['with-title', 'lg', ['gap-x-12', 'gap-y-8']],
      ['card', 'sm', ['gap-x-4', 'gap-y-4']],
    ] as const)('%s with gap %s uses %j and a single pair of gap classes', (layout, gap, cls) => {
      mountWith({ layout, gap })
      expect(list().classes()).toEqual(expect.arrayContaining([...cls]))
      expect(list().classes().filter((c) => /^gap-/.test(c))).toHaveLength(2)
    })
    it('marquee maps sm to the medium strip gap and md or lg to the large one', () => {
      mountWith({ layout: 'marquee', gap: 'sm' })
      expect(w!.findComponent(Marquee).props('gap')).toBe('md')
      w!.unmount()
      mountWith({ layout: 'marquee', gap: 'md' })
      expect(w!.findComponent(Marquee).props('gap')).toBe('lg')
      w!.unmount()
      mountWith({ layout: 'marquee', gap: 'lg' })
      expect(w!.findComponent(Marquee).props('gap')).toBe('lg')
    })
    it('an unknown gap falls back to md', () => {
      mountWith({ gap: 'huge' })
      expect(list().classes()).toEqual(expect.arrayContaining(['gap-x-8', 'gap-y-6']))
      expect(w!.attributes('data-gap')).toBe('md')
      expect(resolveLogoCloudGap(undefined)).toBe('md')
    })
  })

  describe('shape', () => {
    it.each([
      ['rounded', ['rounded-md', 'border', 'bg-card', 'px-4', 'py-1']],
      ['square', ['rounded-none', 'border', 'bg-card', 'px-4', 'py-1']],
      ['pill', ['rounded-full', 'border', 'bg-card', 'px-5', 'py-1']],
    ] as const)('%s draws a bordered tile %j', (shape, cls) => {
      mountWith({ shape })
      expect(logo(0).classes()).toEqual(expect.arrayContaining([...cls]))
      expect(logo(0).classes()).not.toContain('rounded-sm')
      expect(w!.attributes('data-shape')).toBe(shape)
    })
    it('plain has no border or surface and keeps rounded-sm', () => {
      mountWith({ shape: 'plain' })
      expect(logo(0).classes()).toContain('rounded-sm')
      expect(logo(0).classes()).not.toContain('border')
      expect(logo(0).classes()).not.toContain('bg-card')
    })
    it('applies to text fallbacks, images and links alike, keeping the focus ring', () => {
      mountWith({ shape: 'pill' })
      for (let i = 0; i < 3; i++) {
        expect(logo(i).classes()).toContain('rounded-full')
        expect(logo(i).classes()).toContain('focus-visible:ring-3')
      }
      expect(logo(1).element.tagName).toBe('A')
    })
    it('keeps the muted-foreground text colour that is tested on the card surface', () => {
      mountWith({ shape: 'rounded' })
      expect(logo(2).classes()).toContain('text-muted-foreground')
      expect(logo(2).classes().join(' ')).not.toMatch(/(^| )opacity-/)
    })
    it('an unknown shape falls back to plain', () => {
      mountWith({ shape: 'hexagon' })
      expect(w!.attributes('data-shape')).toBe('plain')
      expect(logo(0).classes()).toContain('rounded-sm')
      expect(resolveLogoCloudShape(null)).toBe('plain')
    })
    it('marquee tiles keep shape and no-wrap', () => {
      mountWith({ layout: 'marquee', shape: 'rounded' })
      expect(logo(0).classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'shrink-0', 'whitespace-nowrap']))
    })
  })

  describe('tone muted', () => {
    it('dims images permanently with no hover or focus reveal', () => {
      mountWith({ tone: 'muted' })
      expect(logo(0).classes()).toEqual(expect.arrayContaining(['[&>img]:opacity-60', '[&>img]:grayscale']))
      expect(logo(0).classes().join(' ')).not.toMatch(/hover:|focus-visible:\[&>img\]/)
      expect(w!.attributes('data-tone')).toBe('muted')
    })
    it('never dims the logo element or the text fallback', () => {
      mountWith({ tone: 'muted' })
      for (let i = 0; i < 3; i++) expect(logo(i).classes().join(' ')).not.toMatch(/(^| )(opacity-|grayscale)/)
      expect(logo(2).text()).toBe('Halden Optics')
    })
    it('tone wins over the grayscale prop', () => {
      mountWith({ tone: 'muted', grayscale: false })
      expect(w!.attributes('data-tone')).toBe('muted')
      w!.unmount()
      mountWith({ grayscale: false })
      expect(w!.attributes('data-tone')).toBe('color')
    })
    it('an unknown tone falls back to the grayscale prop', () => {
      mountWith({ tone: 'neon' })
      expect(w!.attributes('data-tone')).toBe('grayscale')
    })
  })

  describe('combinations, class override and alt contract', () => {
    it.each(LOGO_CLOUD_LAYOUTS.flatMap((layout) => LOGO_CLOUD_SHAPES.map((shape) => [layout, shape] as const)))('layout %s with shape %s renders every logo once with its name', (layout, shape) => {
      mountWith({ layout, shape, tone: 'muted', gap: 'lg', size: 'sm' })
      const logosOnPage = w!.findAll('[data-slot="logo-cloud-logo"]')
      // The marquee duplicates its content for the loop; every other layout renders each logo once.
      expect(logosOnPage.length).toBe(layout === 'marquee' ? 6 : 3)
      expect(w!.find('img').attributes('alt')).toBe('Kestrel Freight')
      expect(w!.findAll('[data-slot="logo-cloud-logo"]')[2].text()).toBe('Halden Optics')
    })
    it('size, shape and gap combine without duplicate height, radius or gap classes', () => {
      mountWith({ size: 'lg', shape: 'pill', gap: 'sm', layout: 'inline' })
      expect(logo(0).classes().filter((c) => /^h-\d/.test(c))).toEqual(['h-16'])
      expect(logo(0).classes().filter((c) => /^rounded-/.test(c))).toEqual(['rounded-full'])
      expect(list().classes().filter((c) => /^gap-/.test(c))).toHaveLength(2)
    })
    it('the class prop wins over layout classes', () => {
      mountWith({ layout: 'card', class: 'rounded-none p-2 custom' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['rounded-none', 'p-2', 'custom']))
      expect(w!.classes()).not.toContain('rounded-lg')
      expect(w!.classes()).not.toContain('p-6')
    })
    it('a broken image falls back to its name inside a shaped tile', async () => {
      mountWith({ shape: 'rounded', logos: [{ name: 'Broken', src: '/x.png' }] })
      await w!.find('img').trigger('error')
      expect(w!.find('img').exists()).toBe(false)
      expect(logo(0).text()).toBe('Broken')
      expect(logo(0).classes()).toContain('rounded-md')
    })
    it('empty logos render the title and an empty list in the new layouts', () => {
      for (const layout of ['split', 'centered', 'card'] as const) {
        mountWith({ layout, logos: [] })
        expect(title().exists()).toBe(true)
        expect(w!.findAll('li')).toHaveLength(0)
        w!.unmount()
      }
      w = undefined
    })
    it('long and unicode titles and names do not break the new layouts', () => {
      mountWith({ layout: 'split', title: '株式会社'.repeat(100), logos: [{ name: 'x'.repeat(500) }] })
      expect(title().text()).toHaveLength(400)
      expect(logo(0).text()).toHaveLength(500)
    })
    it('the name contract is enforced in the new layouts and shapes', async () => {
      await open(LogoCloud, { logos: [{ name: '', src: '/x.svg' }], layout: 'card', shape: 'pill', tone: 'muted' })
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('requires a non-empty `name`')
      await open(LogoCloud, { logos, layout: 'centered', shape: 'square' })
      expect(errors).toEqual([])
    })
  })

  describe('cva helpers', () => {
    it('defaults equal the component defaults', () => {
      expect(logoCloudVariants()).toBe('flex flex-col gap-6')
      expect(logoCloudListVariants()).toContain('gap-x-8 gap-y-6')
      expect(logoCloudLogoVariants()).toContain('rounded-sm')
      expect(logoCloudTitleVariants()).toContain('text-center')
    })
    it('every layout, gap, shape and tone produces a token-only class string', () => {
      const all = [
        ...LOGO_CLOUD_LAYOUTS.flatMap((layout) => [logoCloudVariants({ layout }), logoCloudTitleVariants({ layout }), ...LOGO_CLOUD_GAPS.map((gap) => logoCloudListVariants({ layout, gap }))]),
        ...LOGO_CLOUD_SHAPES.flatMap((shape) => LOGO_CLOUD_TONES.flatMap((tone) => LOGO_CLOUD_SIZES.map((size) => logoCloudLogoVariants({ shape, tone, size })))),
      ]
      // Only the marquee list is empty on purpose: Marquee brings its own layout.
      expect(all.filter((c) => c === '')).toHaveLength(LOGO_CLOUD_GAPS.length)
      // The dimming selectors are the only arbitrary variants: they target the nested image.
      expect(all.join(' ').replace(/\[&>img\]:[\w[\],-]+/g, '')).not.toMatch(/\[|gradient|blur|shadow|rounded-(2xl|3xl)/)
    })
  })
})
