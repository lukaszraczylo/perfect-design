import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import ImageGrid from './ImageGrid.vue'
import { IMAGE_GRID_ASPECTS, IMAGE_GRID_GAPS, IMAGE_GRID_VARIANTS, imageGridItemVariants, imageGridTileVariants, imageGridVariants } from './variants'

const images = [
  { src: '/1.jpg', thumb: '/1t.jpg', alt: 'One' },
  { src: '/2.jpg', alt: 'Two', caption: 'Cap' },
  { src: '/3.jpg' },
]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})
const q = (s: string) => document.body.querySelector<HTMLElement>(s)
const mountGrid = (props: Record<string, unknown> = {}) => (w = mount(ImageGrid, { props: { images, ...props }, attachTo: document.body }))

describe('ImageGrid accessibility and slop regressions', () => {
  const imgs = [
    { src: '/a.jpg', alt: 'Harbour at dawn' },
    { src: '/b.jpg', caption: 'Saturday market' },
  ]
  it('is a native list of list items', () => {
    const w = mount(ImageGrid, { props: { images: imgs } })
    expect(w.element.tagName).toBe('UL')
    expect(w.attributes('role')).toBe('list')
    const items = w.findAll(':scope > li[data-slot="image-grid-item"]')
    expect(items).toHaveLength(2)
    expect(w.find('[role="listitem"]').exists()).toBe(false)
  })
  it('every tile is at least 24px tall (min-h-11 even before the image loads) and announces a dialog', () => {
    const w = mount(ImageGrid, { props: { images: imgs, variant: 'masonry' } })
    for (const b of w.findAll('button')) {
      expect(b.classes()).toContain('min-h-11')
      expect(b.attributes('aria-haspopup')).toBe('dialog')
    }
    expect(w.findAll('button')[1].attributes('aria-label')).toBe('View image: Saturday market')
  })
  it('static grid: no button, alt text kept, no popup attribute', () => {
    const w = mount(ImageGrid, { props: { images: imgs, lightbox: false } })
    expect(w.find('button').exists()).toBe(false)
    expect(w.find('img').attributes('alt')).toBe('Harbour at dawn')
    expect(w.find('[aria-haspopup]').exists()).toBe(false)
  })
  it('thumbnails have no hover scale or transition (slop guard)', () => {
    const w = mount(ImageGrid, { props: { images: imgs } })
    expect(w.html()).not.toMatch(/scale-|group-hover|transition-transform|duration-300/)
  })
})

describe('ImageGrid', () => {
  describe('good path', () => {
    it('renders a button thumbnail per image using thumb when given', () => {
      mountGrid()
      expect(w!.attributes('data-slot')).toBe('image-grid')
      const btns = w!.findAll('[data-slot="image-grid-item"] button')
      expect(btns).toHaveLength(3)
      expect(btns[0].attributes('aria-label')).toBe('View image: One')
      expect(btns[1].find('img').attributes('src')).toBe('/2.jpg')
      expect(btns[0].find('img').attributes('src')).toBe('/1t.jpg')
      expect(btns[2].attributes('aria-label')).toBe('View image: 3')
      expect(btns[0].classes()).toContain('aspect-square')
    })
    it('clicking a thumbnail opens the lightbox at that image and emits open', async () => {
      mountGrid()
      await w!.findAll('button')[1].trigger('click')
      await nextTick()
      expect(w!.emitted('open')![0]).toEqual([1])
      expect(q('[data-slot="lightbox"]')).not.toBeNull()
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/2.jpg')
      expect(q('[data-slot="lightbox-counter"]')!.textContent!.trim()).toBe('2 / 3')
    })
    it('closing the lightbox hides it', async () => {
      mountGrid()
      await w!.find('button').trigger('click')
      await nextTick()
      q('[data-slot="lightbox-close"]')!.click()
      await nextTick()
      expect(q('[data-slot="lightbox"]')).toBeNull()
    })
    it.each([
      [2, 'sm:grid-cols-2'],
      [3, 'sm:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mountGrid({ columns }).classes()).toContain(cls)
    })
    it.each([
      ['square', 'aspect-square'],
      ['video', 'aspect-video'],
    ] as const)('ratio %s', (ratio, cls) => {
      expect(mountGrid({ ratio }).find('button').classes()).toContain(cls)
    })
  })
  describe('variants', () => {
    const items = () => w!.findAll('[data-slot="image-grid-item"]')
    it('grid is the default layout', () => {
      mountGrid()
      expect(w!.attributes('data-variant')).toBe('grid')
      expect(w!.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-2', 'sm:grid-cols-3', 'gap-3']))
      expect(items()[0].attributes('data-featured')).toBeUndefined()
    })
    it.each([
      [2, ['sm:columns-2']],
      [3, ['sm:columns-3']],
      [4, ['sm:columns-2', 'lg:columns-4']],
    ] as const)('masonry uses CSS columns (%s)', (columns, cls) => {
      mountGrid({ variant: 'masonry', columns })
      expect(w!.attributes('data-variant')).toBe('masonry')
      expect(w!.classes()).toEqual(expect.arrayContaining(['columns-2', ...cls]))
      expect(w!.classes()).not.toContain('grid')
      expect(items()[0].classes()).toEqual(expect.arrayContaining(['break-inside-avoid', 'mb-3']))
    })
    it('masonry tiles take the natural image height by default', () => {
      mountGrid({ variant: 'masonry' })
      const btn = w!.find('button')
      expect(btn.classes().some((c) => c.startsWith('aspect-'))).toBe(false)
      expect(btn.find('img').classes()).toEqual(expect.arrayContaining(['block', 'h-auto', 'w-full']))
      expect(btn.find('img').classes()).not.toContain('absolute')
    })
    it('masonry honours an explicit aspect or legacy ratio', () => {
      mountGrid({ variant: 'masonry', aspect: 'portrait' })
      expect(w!.find('button').classes()).toContain('aspect-3/4')
      w!.unmount()
      mountGrid({ variant: 'masonry', ratio: 'video' })
      expect(w!.find('button').classes()).toContain('aspect-video')
    })
    it('masonry fallback tiles keep a minimum height', async () => {
      mountGrid({ variant: 'masonry' })
      await w!.find('img').trigger('error')
      expect(w!.find('[data-slot="image-grid-fallback"]').classes()).toContain('min-h-24')
    })
    it('featured makes the first tile span 2x2 and fill its area', () => {
      mountGrid({ variant: 'featured' })
      expect(w!.classes()).toEqual(expect.arrayContaining(['grid', 'grid-flow-dense', 'sm:grid-cols-3']))
      const [first, second] = items()
      expect(first.attributes('data-featured')).toBeDefined()
      expect(first.classes()).toEqual(expect.arrayContaining(['col-span-2', 'row-span-2']))
      expect(first.find('button').classes()).toEqual(expect.arrayContaining(['aspect-auto', 'h-full']))
      expect(first.find('button').classes()).not.toContain('aspect-square')
      expect(first.find('img').classes()).toContain('absolute')
      expect(second.attributes('data-featured')).toBeUndefined()
      expect(second.classes()).not.toContain('col-span-2')
      expect(second.find('button').classes()).toContain('aspect-square')
    })
    it('featured with lightbox disabled still marks the first tile', () => {
      mountGrid({ variant: 'featured', lightbox: false })
      expect(items()[0].find('div').classes()).toContain('aspect-auto')
      expect(w!.findAll('button')).toHaveLength(0)
    })
    it('every variant keeps the lightbox integration', async () => {
      for (const variant of IMAGE_GRID_VARIANTS) {
        mountGrid({ variant })
        await w!.findAll('button')[1].trigger('click')
        await nextTick()
        expect(w!.emitted('open')![0]).toEqual([1])
        expect(q('[data-slot="lightbox-counter"]')!.textContent!.trim()).toBe('2 / 3')
        w!.unmount()
        document.body.innerHTML = ''
        w = undefined
      }
    })
    it.each([
      ['none', 'gap-0'],
      ['sm', 'gap-1.5'],
      ['md', 'gap-3'],
      ['lg', 'gap-6'],
    ] as const)('gap %s', (gap, cls) => {
      mountGrid({ gap })
      expect(w!.classes()).toContain(cls)
      expect(imageGridVariants({ gap })).toContain(cls)
    })
    it.each([
      ['none', 'mb-0'],
      ['sm', 'mb-1.5'],
      ['md', 'mb-3'],
      ['lg', 'mb-6'],
    ] as const)('masonry item margin follows gap %s', (gap, cls) => {
      mountGrid({ variant: 'masonry', gap })
      expect(items()[0].classes()).toContain(cls)
    })
    it.each([
      ['square', 'aspect-square'],
      ['video', 'aspect-video'],
      ['portrait', 'aspect-3/4'],
      ['landscape', 'aspect-4/3'],
    ] as const)('aspect %s', (aspect, cls) => {
      mountGrid({ aspect })
      expect(w!.find('button').classes()).toContain(cls)
      expect(w!.find('img').classes()).toContain('absolute')
    })
    it('aspect wins over ratio', () => {
      mountGrid({ aspect: 'landscape', ratio: 'video' })
      expect(w!.find('button').classes()).toContain('aspect-4/3')
      expect(w!.find('button').classes()).not.toContain('aspect-video')
    })
    it('aspect auto removes the frame ratio on grids', () => {
      mountGrid({ aspect: 'auto' })
      expect(w!.find('button').classes().some((c) => c.startsWith('aspect-'))).toBe(false)
    })
    it.each(IMAGE_GRID_VARIANTS)('%s: class merges last and attrs fall through', (variant) => {
      mountGrid({ variant, class: 'gap-1 custom' })
      expect(w!.classes()).toContain('custom')
      expect(w!.classes()).not.toContain('gap-3')
    })
    it('exposes class helpers', () => {
      expect(imageGridItemVariants({ variant: 'masonry', gap: 'lg' })).toContain('mb-6')
      expect(imageGridItemVariants()).toBe('min-w-0')
      expect(imageGridTileVariants({ aspect: 'portrait' })).toContain('aspect-3/4')
      expect(IMAGE_GRID_GAPS).toHaveLength(4)
      expect(IMAGE_GRID_ASPECTS).toHaveLength(5)
    })
  })
  describe('customisation', () => {
    it('merges class, attrs, custom view label', () => {
      mountGrid({ class: 'gap-1 custom', viewLabel: 'Zoom' })
      expect(w!.classes()).toContain('custom')
      expect(w!.classes()).not.toContain('gap-3')
      expect(w!.find('button').attributes('aria-label')).toBe('Zoom: One')
    })
    it('lightbox=false renders plain images with alt and no buttons', () => {
      mountGrid({ lightbox: false })
      expect(w!.findAll('button')).toHaveLength(0)
      expect(w!.find('img').attributes('alt')).toBe('One')
      expect(w!.findComponent({ name: 'Lightbox' }).exists()).toBe(false)
    })
    it('ratio auto adds no aspect class', () => {
      const btn = mountGrid({ ratio: 'auto' }).find('button')
      expect(btn.classes().some((c) => c.startsWith('aspect-'))).toBe(false)
    })
  })
  describe('bad path', () => {
    it('empty images renders an empty grid and opens nothing', () => {
      mountGrid({ images: [] })
      expect(w!.findAll('button')).toHaveLength(0)
      expect(q('[data-slot="lightbox"]')).toBeNull()
    })
    it('broken thumbnails fall back to alt text and still open', async () => {
      mountGrid()
      await w!.find('img').trigger('error')
      expect(w!.find('[data-slot="image-grid-fallback"]').text()).toBe('One')
      await w!.find('button').trigger('click')
      await nextTick()
      expect(q('[data-slot="lightbox"]')).not.toBeNull()
    })
    it('unknown variant, gap and aspect fall back to defaults', () => {
      mountGrid({ variant: 'mosaic', gap: 'huge', aspect: 'cinema' })
      expect(w!.attributes('data-variant')).toBe('grid')
      expect(w!.classes()).toContain('gap-3')
      expect(w!.find('button').classes()).toContain('aspect-square')
    })
    it('invalid aspect falls through to a valid legacy ratio', () => {
      mountGrid({ aspect: 'cinema', ratio: 'video' })
      expect(w!.find('button').classes()).toContain('aspect-video')
    })
    it('null props are treated as unset', () => {
      mountGrid({ variant: null, gap: null, aspect: null, columns: null })
      expect(w!.attributes('data-variant')).toBe('grid')
      expect(w!.attributes('data-columns')).toBe('3')
    })
    it.each(IMAGE_GRID_VARIANTS)('%s with empty images renders nothing and no lightbox', (variant) => {
      mountGrid({ variant, images: [] })
      expect(w!.findAll('[data-slot="image-grid-item"]')).toHaveLength(0)
      expect(q('[data-slot="lightbox"]')).toBeNull()
    })
    it('invalid columns and ratio fall back', () => {
      mountGrid({ columns: 9, ratio: 'weird' })
      expect(w!.attributes('data-columns')).toBe('3')
      expect(w!.find('button').classes()).toContain('aspect-square')
    })
    it('image without src or alt shows a generic fallback', () => {
      mountGrid({ images: [{ src: '' }] })
      expect(w!.find('[data-slot="image-grid-fallback"]').text()).toBe('Image unavailable')
    })
  })
  describe('edge cases', () => {
    it.each(IMAGE_GRID_VARIANTS)('%s: one and 100 images with long unicode alt', (variant) => {
      mountGrid({ variant, images: [{ src: '/a.jpg', alt: '写真'.repeat(500) }] })
      expect(w!.find('button').attributes('aria-label')).toHaveLength(1000 + 'View image: '.length)
      w!.unmount()
      mountGrid({ variant, images: Array.from({ length: 100 }, (_, i) => ({ src: `/${i}.jpg`, alt: `Bild ${i}` })) })
      expect(w!.findAll('button')).toHaveLength(100)
    })
    it('rapid variant toggling keeps the grid and lightbox consistent', async () => {
      mountGrid()
      for (let i = 0; i < 30; i++) await w!.setProps({ variant: IMAGE_GRID_VARIANTS[i % 3] })
      expect(w!.findAll('[data-slot="image-grid-item"]')).toHaveLength(3)
    })
    it('a featured grid with a single image', () => {
      mountGrid({ variant: 'featured', images: [images[0]] })
      expect(w!.findAll('button')).toHaveLength(1)
      expect(w!.find('[data-slot="image-grid-item"]').classes()).toContain('col-span-2')
    })
    it('one image and 100 images', () => {
      mountGrid({ images: [images[0]] })
      expect(w!.findAll('button')).toHaveLength(1)
      w!.unmount()
      mountGrid({ images: Array.from({ length: 100 }, (_, i) => ({ src: `/${i}.jpg`, alt: `Bild ${i}` })) })
      expect(w!.findAll('button')).toHaveLength(100)
    })
    it('unicode alt and rapid clicks', async () => {
      mountGrid({ images: [{ src: '/a.jpg', alt: '写真 🌸' }] })
      const b = w!.find('button')
      expect(b.attributes('aria-label')).toBe('View image: 写真 🌸')
      for (let i = 0; i < 5; i++) await b.trigger('click')
      expect(w!.emitted('open')).toHaveLength(5)
    })
    it('unmount while open restores the page', async () => {
      mountGrid()
      await w!.find('button').trigger('click')
      await nextTick()
      w!.unmount()
      w = undefined
      expect(document.body.style.overflow).toBe('')
    })
  })
})
