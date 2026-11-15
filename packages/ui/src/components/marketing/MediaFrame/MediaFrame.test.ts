import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaFrame from './MediaFrame.vue'
import { mediaFrameVariantNames, mediaFrameVariants } from './variants'

describe('MediaFrame', () => {
  describe('good path', () => {
    it('renders a browser frame by default with chrome dots, title and content', () => {
      const w = mount(MediaFrame, { props: { title: 'example.com/app' }, slots: { default: '<p id="c">Hi</p>' } })
      expect(w.element.tagName).toBe('FIGURE')
      expect(w.attributes('data-slot')).toBe('media-frame')
      expect(w.attributes('data-variant')).toBe('browser')
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(true)
      expect(w.find('[data-slot="media-frame-dots"]').attributes('aria-hidden')).toBe('true')
      expect(w.find('[data-slot="media-frame-title"]').text()).toBe('example.com/app')
      expect(w.find('[data-slot="media-frame-title"]').classes()).toContain('rounded-md')
      expect(w.classes()).toContain('rounded-lg')
      expect(w.find('[data-slot="media-frame-content"] #c').exists()).toBe(true)
    })
    it('window variant shows a mono centred title', () => {
      const w = mount(MediaFrame, { props: { variant: 'window', title: 'index.ts' } })
      expect(w.attributes('data-variant')).toBe('window')
      expect(w.find('[data-slot="media-frame-title"]').classes()).toContain('font-mono')
    })
    it('phone variant has a notch and no bar', () => {
      const w = mount(MediaFrame, { props: { variant: 'phone', title: 'ignored' } })
      expect(w.find('[data-slot="media-frame-notch"]').exists()).toBe(true)
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(false)
      expect(w.find('[data-slot="media-frame-content"]').classes()).toContain('aspect-9/19')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-xl', 'border-8', 'max-w-72']))
      expect(w.find('[data-slot="media-frame-notch"]').classes()).toEqual(expect.arrayContaining(['inset-x-0', 'mx-auto', 'rounded-b-lg']))
    })
    it('plain variant has no chrome', () => {
      const w = mount(MediaFrame, { props: { variant: 'plain' } })
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(false)
      expect(w.find('[data-slot="media-frame-notch"]').exists()).toBe(false)
    })
    it.each(mediaFrameVariantNames)('variant %s is mapped by the cva helper', (variant) => {
      expect(mediaFrameVariants({ variant })).toContain('overflow-hidden')
      expect(mount(MediaFrame, { props: { variant } }).attributes('data-variant')).toBe(variant)
    })
    it('renders src as an image with alt', () => {
      const w = mount(MediaFrame, { props: { src: '/a.png', alt: 'Dashboard' } })
      const img = w.find('img')
      expect(img.attributes('src')).toBe('/a.png')
      expect(img.attributes('alt')).toBe('Dashboard')
    })
    it('slot content wins over src', () => {
      const w = mount(MediaFrame, { props: { src: '/a.png' }, slots: { default: '<b id="s" />' } })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('#s').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last and contentClass', () => {
      const w = mount(MediaFrame, { props: { class: 'rounded-none custom', contentClass: 'p-6 bg-foreground' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.find('[data-slot="media-frame-content"]').classes()).toEqual(expect.arrayContaining(['p-6', 'bg-foreground']))
    })
    it('is flat by default (slop rule: no card shadows); elevated opts into a neutral shadow-md; attrs pass through', () => {
      const w = mount(MediaFrame, { attrs: { id: 'f', 'aria-label': 'Preview' } })
      expect(w.classes().join(' ')).not.toMatch(/shadow/)
      expect(w.attributes('id')).toBe('f')
      expect(w.attributes('aria-label')).toBe('Preview')
      expect(mount(MediaFrame, { props: { elevated: true } }).classes()).toContain('shadow-md')
    })
  })

  describe('bad path', () => {
    it('unknown variant falls back to browser', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(MediaFrame, { props: { variant: 'tablet' } })
      expect(w.attributes('data-variant')).toBe('browser')
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(true)
    })
    it('renders an empty frame with no slot, src or title', () => {
      const w = mount(MediaFrame)
      expect(w.find('[data-slot="media-frame-content"]').element.children).toHaveLength(0)
      expect(w.find('[data-slot="media-frame-title"]').exists()).toBe(false)
      expect(w.find('img').exists()).toBe(false)
    })
    it('missing alt is rendered as an empty (decorative) alt', () => {
      expect(mount(MediaFrame, { props: { src: '/x.png' } }).find('img').attributes('alt')).toBe('')
    })
  })

  describe('slop and accessibility regressions', () => {
    it('uses no rounded-2xl or larger, no blur, no gradient and no arbitrary values on any variant', () => {
      for (const variant of mediaFrameVariantNames) {
        const w = mount(MediaFrame, { props: { variant, title: 't', elevated: true } })
        expect(w.html()).not.toMatch(/rounded-(2xl|3xl|\[)|backdrop-blur|blur-|gradient|\[\d|shadow-xl/)
      }
    })
    it('chrome dots are neutral decoration, not traffic-light colours', () => {
      const dots = mount(MediaFrame).find('[data-slot="media-frame-dots"]')
      expect(dots.html()).not.toMatch(/destructive|warning|success/)
      expect(dots.attributes('aria-hidden')).toBe('true')
    })
    it('uses logical positioning for the phone notch so RTL is unaffected', () => {
      const notch = mount(MediaFrame, { props: { variant: 'phone' } }).find('[data-slot="media-frame-notch"]')
      expect(notch.classes().join(' ')).not.toMatch(/\bleft-|translate-x/)
    })
    it('src images decode asynchronously and keep the supplied alt', () => {
      const img = mount(MediaFrame, { props: { src: '/a.png', alt: 'Dashboard' } }).find('img')
      expect(img.attributes('decoding')).toBe('async')
      expect(img.attributes('alt')).toBe('Dashboard')
    })
  })

  describe('edge cases', () => {
    it('very long unicode title is rendered and truncated by class', () => {
      const w = mount(MediaFrame, { props: { title: '界'.repeat(2000) } })
      expect(w.find('[data-slot="media-frame-title"]').text()).toHaveLength(2000)
      expect(w.find('[data-slot="media-frame-title"]').classes()).toContain('truncate')
    })
    it('switching variant reactively updates chrome', async () => {
      const w = mount(MediaFrame, { props: { variant: 'browser', title: 't' } })
      await w.setProps({ variant: 'phone' })
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(false)
      await w.setProps({ variant: 'window' })
      expect(w.find('[data-slot="media-frame-bar"]').exists()).toBe(true)
    })
  })
})
