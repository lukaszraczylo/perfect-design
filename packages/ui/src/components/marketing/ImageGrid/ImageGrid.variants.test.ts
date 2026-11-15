import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import ImageGrid from './ImageGrid.vue'
import { useContractHarness } from '../shared/contract-harness/testing'
import { IMAGE_GRID_ASPECTS, IMAGE_GRID_SHAPES, IMAGE_GRID_VARIANTS, imageGridHeroMobileAspect, imageGridTileVariants } from './variants'

const { errors, open } = useContractHarness()
const images = [
  { src: '/1.jpg', alt: 'Harbour at dawn' },
  { src: '/2.jpg', alt: 'Saturday market' },
  { src: '/3.jpg', alt: '', caption: 'Decorative sample' },
]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  document.body.innerHTML = ''
})
const mountWith = (props: Record<string, unknown> = {}) => (w = mount(ImageGrid, { props: { images, ...props }, attachTo: document.body }))
const tiles = () => w!.findAll('[data-slot="image-grid-item"] > button, [data-slot="image-grid-item"] > div')

describe('ImageGrid shape', () => {
  it('defaults to rounded tiles with the original tile classes', () => {
    mountWith()
    expect(w!.attributes('data-shape')).toBe('rounded')
    expect([...tiles()[0].classes()].sort()).toEqual(
      ['relative', 'block', 'min-h-11', 'w-full', 'overflow-hidden', 'rounded-lg', 'border', 'bg-muted', 'aspect-square', 'cursor-zoom-in', 'outline-hidden', 'focus-visible:border-ring', 'focus-visible:ring-3', 'focus-visible:ring-ring/40'].sort(),
    )
  })

  it.each([
    ['rounded', 'rounded-lg'],
    ['square', 'rounded-none'],
  ] as const)('%s sets %s as the only radius on every tile', (shape, cls) => {
    mountWith({ shape })
    expect(w!.attributes('data-shape')).toBe(shape)
    expect(tiles()).toHaveLength(3)
    for (const t of tiles()) expect(t.classes().filter((c) => /^rounded-/.test(c))).toEqual([cls])
  })

  it('an unknown shape falls back to rounded', () => {
    mountWith({ shape: 'circle' })
    expect(w!.attributes('data-shape')).toBe('rounded')
    expect(tiles()[0].classes()).toContain('rounded-lg')
  })

  it('square tiles keep the border, the clip and the focus ring', () => {
    mountWith({ shape: 'square' })
    expect(tiles()[0].classes()).toEqual(expect.arrayContaining(['border', 'overflow-hidden', 'focus-visible:ring-3', 'cursor-zoom-in']))
  })

  it('square tiles stay at least 44px tall so images do not collapse before loading', () => {
    mountWith({ shape: 'square', aspect: 'auto' })
    expect(tiles()[0].classes()).toContain('min-h-11')
  })

  it.each(IMAGE_GRID_VARIANTS.flatMap((variant) => IMAGE_GRID_SHAPES.map((shape) => [variant, shape] as const)))('layout %s with shape %s renders every tile once, with one radius', (variant, shape) => {
    mountWith({ variant, shape, gap: 'sm', columns: 4 })
    expect(w!.findAll('li')).toHaveLength(3)
    expect(w!.attributes('data-variant')).toBe(variant)
    for (const t of tiles()) expect(t.classes().filter((c) => /^rounded-/.test(c))).toHaveLength(1)
  })

  it('the featured hero tile keeps its 2x2 sizing in both shapes', () => {
    for (const shape of IMAGE_GRID_SHAPES) {
      mountWith({ variant: 'featured', shape })
      expect(w!.find('[data-featured]').classes()).toEqual(expect.arrayContaining(['col-span-2', 'row-span-2']))
      expect(tiles()[0].classes()).toEqual(expect.arrayContaining(['aspect-auto', 'h-full']))
      w!.unmount()
    }
    w = undefined
  })

  it('every aspect combines with every shape without a second radius', () => {
    for (const aspect of IMAGE_GRID_ASPECTS) {
      for (const shape of IMAGE_GRID_SHAPES) {
        expect(imageGridTileVariants({ aspect, shape }).split(' ').filter((c) => /^rounded-/.test(c))).toHaveLength(1)
      }
    }
  })

  it('works with the lightbox off: plain tiles with alt text keep the shape', () => {
    mountWith({ shape: 'square', lightbox: false })
    expect(tiles()[0].element.tagName).toBe('DIV')
    expect(tiles()[0].classes()).toContain('rounded-none')
    expect(w!.find('img').attributes('alt')).toBe('Harbour at dawn')
  })

  it('a lightbox button keeps its accessible name in a square grid and opens the viewer', async () => {
    mountWith({ shape: 'square' })
    expect(tiles()[0].attributes('aria-label')).toBe('View image: Harbour at dawn')
    expect(tiles()[0].attributes('aria-haspopup')).toBe('dialog')
    await tiles()[0].trigger('click')
    expect(w!.emitted('open')).toEqual([[0]])
  })

  it('the class prop on the root still wins and does not touch the tile shape', () => {
    mountWith({ shape: 'square', class: 'gap-8 custom' })
    expect(w!.classes()).toEqual(expect.arrayContaining(['custom', 'gap-8']))
    expect(w!.classes()).not.toContain('gap-3')
    expect(tiles()[0].classes()).toContain('rounded-none')
  })

  it('empty and failed images fall back inside a square tile', async () => {
    mountWith({ shape: 'square', images: [{ src: '/x.jpg', alt: 'Missing sample' }] })
    await w!.find('img').trigger('error')
    expect(w!.find('[data-slot="image-grid-fallback"]').text()).toBe('Missing sample')
    expect(tiles()[0].classes()).toContain('rounded-none')
    w!.unmount()
    mountWith({ shape: 'square', images: [] })
    expect(w!.findAll('li')).toHaveLength(0)
  })

  it('the alt contract is enforced with a shape set', async () => {
    await open(ImageGrid, { images: [{ src: '/a.jpg' }], shape: 'square', lightbox: false })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ImageGrid')
    await open(ImageGrid, { images, shape: 'square' })
    expect(errors).toEqual([])
  })

  it('tile helper defaults to the rounded shape and has no arbitrary values', () => {
    expect(imageGridTileVariants()).toContain('rounded-lg')
    expect(imageGridTileVariants({ shape: 'square' })).not.toMatch(/\[|blur|shadow/)
  })
})

describe('ImageGrid featured hero below sm', () => {
  it.each([
    ['square', 'max-sm:aspect-square'],
    ['video', 'max-sm:aspect-video'],
    ['portrait', 'max-sm:aspect-3/4'],
    ['landscape', 'max-sm:aspect-4/3'],
    ['auto', 'max-sm:aspect-square'],
  ] as const)('with aspect %s the hero keeps %s so it cannot collapse in the two-column layout', (aspect, cls) => {
    mountWith({ variant: 'featured', aspect })
    const hero = tiles()[0]
    expect(hero.classes()).toEqual(expect.arrayContaining([cls, 'aspect-auto', 'h-full', 'min-h-0']))
    for (const other of tiles().slice(1)) expect(other.classes().join(' ')).not.toContain('max-sm:')
  })
  it('the other layouts never get the mobile hero class', () => {
    for (const variant of ['grid', 'masonry'] as const) {
      mountWith({ variant })
      for (const t of tiles()) expect(t.classes().join(' ')).not.toContain('max-sm:')
      w!.unmount()
    }
    w = undefined
  })
  it('the helper covers every aspect with a literal class', () => {
    for (const aspect of IMAGE_GRID_ASPECTS) expect(imageGridHeroMobileAspect[aspect]).toMatch(/^max-sm:aspect-/)
  })
})
