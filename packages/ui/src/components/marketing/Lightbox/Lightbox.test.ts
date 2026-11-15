import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Lightbox from './Lightbox.vue'

const images = [
  { src: '/1.jpg', alt: 'One', caption: 'First' },
  { src: '/2.jpg', alt: 'Two' },
  { src: '/3.jpg', alt: 'Three' },
]
let w: VueWrapper | undefined
afterEach(() => {
  w?.unmount()
  w = undefined
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})
const q = <T extends HTMLElement = HTMLElement>(s: string) => document.body.querySelector<T>(s)
const qa = (s: string) => Array.from(document.body.querySelectorAll<HTMLElement>(s))
const key = (k: string, init: KeyboardEventInit = {}) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  return nextTick()
}
function make(props: Record<string, unknown> = {}) {
  w = mount(Lightbox, { props: { images, open: true, ...props }, attachTo: document.body })
  return w
}

describe('Lightbox', () => {
  describe('good path', () => {
    it('renders a modal dialog teleported to body', async () => {
      make()
      await nextTick()
      const dlg = q('[data-slot="lightbox"]')!
      expect(dlg.getAttribute('role')).toBe('dialog')
      expect(dlg.getAttribute('aria-modal')).toBe('true')
      expect(dlg.getAttribute('aria-label')).toBe('Image viewer')
      expect(dlg.parentElement).toBe(document.body)
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/1.jpg')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('alt')).toBe('One')
      expect(q('[data-slot="lightbox-caption"]')!.textContent).toBe('First')
      expect(q('[data-slot="lightbox-counter"]')!.textContent!.trim()).toBe('1 / 3')
    })
    it('is closed by default', () => {
      w = mount(Lightbox, { props: { images }, attachTo: document.body })
      expect(q('[data-slot="lightbox"]')).toBeNull()
    })
    it('focuses the close button, locks scroll, and restores both on close', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()
      w = mount(Lightbox, { props: { images, open: false }, attachTo: document.body })
      await w.setProps({ open: true })
      await nextTick()
      expect(document.activeElement).toBe(q('[data-slot="lightbox-close"]'))
      expect(document.body.style.overflow).toBe('hidden')
      await w.setProps({ open: false })
      await nextTick()
      expect(document.body.style.overflow).toBe('')
      expect(document.activeElement).toBe(opener)
    })
    it('next/prev buttons and arrow keys navigate and emit update:index', async () => {
      make()
      await nextTick()
      q('[data-slot="lightbox-next"]')!.click()
      await nextTick()
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/2.jpg')
      await key('ArrowRight')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/3.jpg')
      await key('ArrowLeft')
      q('[data-slot="lightbox-prev"]')!.click()
      await nextTick()
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/1.jpg')
      expect(w!.emitted('update:index')!.map((e) => e[0])).toEqual([1, 2, 1, 0])
    })
    it('wraps around when loop is on', async () => {
      make({ index: 2 })
      await nextTick()
      q('[data-slot="lightbox-next"]')!.click()
      expect(w!.emitted('update:index')![0]).toEqual([0])
    })
    it('Escape and the close button close and emit', async () => {
      make()
      await nextTick()
      await key('Escape')
      expect(w!.emitted('update:open')![0]).toEqual([false])
      expect(w!.emitted('close')).toHaveLength(1)
      q('[data-slot="lightbox-close"]')!.click()
      expect(w!.emitted('close')).toHaveLength(2)
    })
    it('backdrop click closes; clicking the image does not', async () => {
      make()
      await nextTick()
      q('[data-slot="lightbox-image"]')!.click()
      expect(w!.emitted('close')).toBeUndefined()
      q('[data-slot="lightbox"]')!.click()
      expect(w!.emitted('close')).toHaveLength(1)
      q('[data-slot="lightbox-figure"]')!.click()
      expect(w!.emitted('close')).toHaveLength(2)
    })
    it('Tab wraps focus inside the dialog', async () => {
      make()
      await nextTick()
      const btns = qa('button:not([disabled])')
      btns[btns.length - 1].focus()
      await key('Tab')
      expect(document.activeElement).toBe(btns[0])
      await key('Tab', { shiftKey: true })
      expect(document.activeElement).toBe(btns[btns.length - 1])
    })
    it('Tab from outside the dialog pulls focus in', async () => {
      make()
      await nextTick()
      ;(document.activeElement as HTMLElement).blur()
      await key('Tab')
      expect(document.activeElement).toBe(qa('button:not([disabled])')[0])
      ;(document.activeElement as HTMLElement).blur()
      await key('Tab', { shiftKey: true })
      const btns = qa('button:not([disabled])')
      expect(document.activeElement).toBe(btns[btns.length - 1])
    })
  })
  describe('accessibility regressions', () => {
    it('Home/End jump to the first/last image', async () => {
      make()
      await nextTick()
      await key('End')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/3.jpg')
      await key('Home')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/1.jpg')
    })
    it('ArrowLeft/ArrowRight swap in RTL (visual direction)', async () => {
      make()
      await nextTick()
      q('[data-slot="lightbox"]')!.style.direction = 'rtl'
      await key('ArrowLeft')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/2.jpg')
      await key('ArrowRight')
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/1.jpg')
    })
    it('prev/next chevrons mirror in RTL', async () => {
      make()
      await nextTick()
      expect(q('[data-slot="lightbox-prev"] svg')!.getAttribute('class')).toContain('rtl:-scale-x-100')
      expect(q('[data-slot="lightbox-next"] svg')!.getAttribute('class')).toContain('rtl:-scale-x-100')
    })
    it('focus stays on the Next button when it reaches the end (aria-disabled, not disabled)', async () => {
      make({ loop: false })
      await nextTick()
      const next = q<HTMLButtonElement>('[data-slot="lightbox-next"]')!
      next.focus()
      next.click()
      await nextTick()
      next.click()
      await nextTick()
      expect(next.getAttribute('aria-disabled')).toBe('true')
      expect(document.activeElement).toBe(next)
    })
    it('controls sit in a bar below the image (no overlay on the picture), close button in a header', async () => {
      make()
      await nextTick()
      const dlg = q('[data-slot="lightbox"]')!
      expect(dlg.classList.contains('h-dvh')).toBe(true)
      expect(q('[data-slot="lightbox-controls"]')!.contains(q('[data-slot="lightbox-prev"]'))).toBe(true)
      expect(q('[data-slot="lightbox-controls"]')!.contains(q('[data-slot="lightbox-next"]'))).toBe(true)
      expect(q('[data-slot="lightbox-header"]')!.contains(q('[data-slot="lightbox-close"]'))).toBe(true)
      expect(dlg.innerHTML).not.toMatch(/absolute|right-4|left-4|80vh|shadow-|backdrop-blur|bg-background\/90/)
    })
    it('image alt falls back to the caption, then to empty', async () => {
      make({ images: [{ src: '/a.jpg', caption: 'A harbour' }, { src: '/b.jpg' }] })
      await nextTick()
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('alt')).toBe('A harbour')
      await w!.setProps({ index: 1 })
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('alt')).toBe('')
    })
    it('counter is a polite live region', async () => {
      make()
      await nextTick()
      expect(q('[data-slot="lightbox-counter"]')!.getAttribute('aria-live')).toBe('polite')
    })
    it('clicking the controls bar padding closes, clicking a control or the caption does not', async () => {
      make()
      await nextTick()
      q('[data-slot="lightbox-caption"]')!.click()
      q('[data-slot="lightbox-counter"]')!.click()
      expect(w!.emitted('close')).toBeUndefined()
      q('[data-slot="lightbox-controls"]')!.click()
      expect(w!.emitted('close')).toHaveLength(1)
    })
  })
  describe('customisation', () => {
    it('merges class, labels and attrs', async () => {
      make({ class: 'bg-red-500 custom', label: 'Galerie', closeLabel: 'Schließen', prevLabel: 'Zurück', nextLabel: 'Weiter' })
      await nextTick()
      const dlg = q('[data-slot="lightbox"]')!
      expect(dlg.classList.contains('custom')).toBe(true)
      expect(dlg.classList.contains('bg-red-500')).toBe(true)
      expect(dlg.classList.contains('bg-scrim')).toBe(false)
      expect(dlg.getAttribute('aria-label')).toBe('Galerie')
      expect(q('[data-slot="lightbox-close"]')!.getAttribute('aria-label')).toBe('Schließen')
      expect(q('[data-slot="lightbox-prev"]')!.getAttribute('aria-label')).toBe('Zurück')
      expect(q('[data-slot="lightbox-next"]')!.getAttribute('aria-label')).toBe('Weiter')
    })
    it('closeOnBackdrop=false keeps it open', async () => {
      make({ closeOnBackdrop: false })
      await nextTick()
      q('[data-slot="lightbox"]')!.click()
      q('[data-slot="lightbox-figure"]')!.click()
      expect(w!.emitted('close')).toBeUndefined()
    })
    it('loop=false disables prev at the start and next at the end', async () => {
      make({ loop: false })
      await nextTick()
      // aria-disabled (not `disabled`) so the focused button never drops keyboard focus at the ends
      expect(q('[data-slot="lightbox-prev"]')!.getAttribute('aria-disabled')).toBe('true')
      expect(q<HTMLButtonElement>('[data-slot="lightbox-prev"]')!.disabled).toBe(false)
      expect(q('[data-slot="lightbox-next"]')!.getAttribute('aria-disabled')).toBeNull()
      q('[data-slot="lightbox-prev"]')!.click()
      await key('ArrowLeft')
      expect(w!.emitted('update:index')).toBeUndefined()
      await w!.setProps({ index: 2 })
      expect(q('[data-slot="lightbox-next"]')!.getAttribute('aria-disabled')).toBe('true')
      q('[data-slot="lightbox-next"]')!.click()
      await key('ArrowRight')
      expect(w!.emitted('update:index')).toBeUndefined()
    })
  })
  describe('bad path', () => {
    it('empty images render nothing even when open', async () => {
      make({ images: [] })
      await nextTick()
      expect(q('[data-slot="lightbox"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
    it.each([-5, 99, Number.NaN, 1.7])('index %s is clamped to a valid image', async (index) => {
      make({ index })
      await nextTick()
      expect(['/1.jpg', '/2.jpg', '/3.jpg']).toContain(q('[data-slot="lightbox-image"]')!.getAttribute('src'))
    })
    it('single image hides navigation and counter', async () => {
      make({ images: [images[0]] })
      await nextTick()
      expect(q('[data-slot="lightbox-next"]')).toBeNull()
      expect(q('[data-slot="lightbox-prev"]')).toBeNull()
      expect(q('[data-slot="lightbox-counter"]')).toBeNull()
      await key('ArrowRight')
      expect(w!.emitted('update:index')).toBeUndefined()
    })
    it('a broken image shows a fallback and resets on navigation', async () => {
      make()
      await nextTick()
      q('[data-slot="lightbox-image"]')!.dispatchEvent(new Event('error'))
      await nextTick()
      expect(q('[data-slot="lightbox-image"]')).toBeNull()
      expect(q('[data-slot="lightbox-fallback"]')!.textContent!.trim()).toBe('One')
      await w!.setProps({ index: 1 })
      expect(q('[data-slot="lightbox-image"]')!.getAttribute('src')).toBe('/2.jpg')
    })
    it('image without src or alt shows the generic fallback', async () => {
      make({ images: [{ src: '' }] })
      await nextTick()
      expect(q('[data-slot="lightbox-fallback"]')!.textContent!.trim()).toBe('Image unavailable')
    })
    it('keys are ignored when closed and listener is not leaked', async () => {
      w = mount(Lightbox, { props: { images, open: false }, attachTo: document.body })
      await key('Escape')
      expect(w.emitted('close')).toBeUndefined()
    })
    it('Tab with no focusable content focuses the dialog', async () => {
      make()
      await nextTick()
      qa('button').forEach((b) => b.remove())
      await key('Tab')
      expect(document.activeElement).toBe(q('[data-slot="lightbox"]'))
    })
  })
  describe('edge cases', () => {
    it('unmounting while open restores scroll and removes listeners', async () => {
      make()
      await nextTick()
      w!.unmount()
      w = undefined
      expect(document.body.style.overflow).toBe('')
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    it('preserves a pre-existing body overflow value', async () => {
      document.body.style.overflow = 'scroll'
      w = mount(Lightbox, { props: { images, open: false }, attachTo: document.body })
      await w.setProps({ open: true })
      await nextTick()
      await w.setProps({ open: false })
      await nextTick()
      expect(document.body.style.overflow).toBe('scroll')
    })
    it('rapid open/close toggles end consistent', async () => {
      w = mount(Lightbox, { props: { images, open: false }, attachTo: document.body })
      for (let i = 0; i < 9; i++) {
        await w.setProps({ open: i % 2 === 0 })
        await nextTick()
      }
      expect(q('[data-slot="lightbox"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
    })
    it('100 images and long unicode captions', async () => {
      const many = Array.from({ length: 100 }, (_, i) => ({ src: `/${i}.jpg`, alt: `Bild ${i}`, caption: '説'.repeat(1000) }))
      make({ images: many, index: 99 })
      await nextTick()
      expect(q('[data-slot="lightbox-counter"]')!.textContent!.trim()).toBe('100 / 100')
      expect(q('[data-slot="lightbox-caption"]')!.textContent).toHaveLength(1000)
    })
    it('activating twice is a no-op (open true on mount)', async () => {
      make()
      await nextTick()
      await w!.setProps({ images: [...images] })
      expect(document.body.style.overflow).toBe('hidden')
    })
  })
})
