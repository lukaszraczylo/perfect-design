import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Prose from './Prose.vue'
import { proseVariants } from './variants'

const descendantSelectors = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a', 'pre', 'blockquote', 'hr', 'table', 'th', 'td', 'img',
]

describe('Prose', () => {
  describe('good path', () => {
    it('renders a div with data-slot and slot content', () => {
      const w = mount(Prose, { slots: { default: '<p>Hello</p>' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('prose')
      expect(w.find('p').text()).toBe('Hello')
    })

    it.each(descendantSelectors)('includes descendant styles for %s', (sel) => {
      const cls = mount(Prose).attributes('class') ?? ''
      expect(cls).toContain(`[&_${sel}]:`)
    })

    it('styles inline code but not code inside pre', () => {
      const cls = mount(Prose).attributes('class') ?? ''
      expect(cls).toContain('[&_:not(pre)>code]:bg-muted')
    })

    it('uses text-md (16px) at the default size', () => {
      const c = mount(Prose).classes()
      expect(c).toContain('text-md')
      expect(c).toContain('text-foreground')
    })

    it.each([
      ['sm', 'text-base'],
      ['base', 'text-md'],
      ['lg', 'text-lg'],
    ] as const)('size %s', (size, cls) => {
      expect(mount(Prose, { props: { size } }).classes()).toContain(cls)
    })

    it('measure limits line length', () => {
      expect(mount(Prose, { props: { measure: true } }).classes()).toContain('max-w-prose')
      expect(mount(Prose).classes()).not.toContain('max-w-prose')
    })

    it('uses no hard-coded colours', () => {
      const cls = mount(Prose).attributes('class') ?? ''
      expect(cls).not.toMatch(/#[0-9a-f]{3,6}|rgb\(|oklch\(|-(red|blue|gray|slate|zinc|neutral)-\d/)
    })
  })

  describe('customisation', () => {
    it('as swaps the element', () => {
      expect(mount(Prose, { props: { as: 'article' } }).element.tagName).toBe('ARTICLE')
    })

    it('asChild styles the child', () => {
      const w = mount(Prose, { props: { asChild: true }, slots: { default: '<section>x</section>' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('text-foreground')
    })

    it('class merges last and overrides', () => {
      const w = mount(Prose, { props: { measure: true, class: 'max-w-none text-sm custom-x' } })
      expect(w.classes()).toContain('max-w-none')
      expect(w.classes()).not.toContain('max-w-prose')
      expect(w.classes()).toContain('text-sm')
      expect(w.classes()).not.toContain('text-md')
      expect(w.classes()).toContain('custom-x')
    })

    it('consumer can override a descendant style', () => {
      const w = mount(Prose, { props: { class: '[&_h1]:text-2xl' } })
      expect(w.classes()).toContain('[&_h1]:text-2xl')
      expect(w.classes()).not.toContain('[&_h1]:text-4xl')
    })

    it('passes attributes through', () => {
      expect(mount(Prose, { attrs: { id: 'doc', lang: 'en' } }).attributes('id')).toBe('doc')
    })

    it('proseVariants is reusable', () => {
      expect(proseVariants({ size: 'lg', measure: true })).toContain('max-w-prose')
    })
  })

  describe('bad path / edge cases', () => {
    it('renders empty', () => {
      expect(mount(Prose).text()).toBe('')
    })

    it('unknown size does not throw', () => {
      expect(mount(Prose, { props: { size: 'x' as never } }).exists()).toBe(true)
    })

    it('renders rich nested content untouched', () => {
      const html = '<h1>T</h1><ul><li>a<ul><li>b</li></ul></li></ul><table><tr><td>x</td></tr></table><img alt="i" src="/a.png">'
      const w = mount(Prose, { slots: { default: html } })
      expect(w.find('h1').text()).toBe('T')
      expect(w.findAll('li')).toHaveLength(2)
      expect(w.find('img').attributes('alt')).toBe('i')
    })

    it('handles unicode/RTL content and empty class', () => {
      const w = mount(Prose, { props: { class: '' }, slots: { default: '<p dir="rtl">مرحبا</p>' } })
      expect(w.find('p').text()).toBe('مرحبا')
    })
  })

  describe('sizes and tones', () => {
    it.each([
      ['xs', 'text-sm'],
      ['sm', 'text-base'],
      ['base', 'text-md'],
      ['md', 'text-md'],
      ['lg', 'text-lg'],
      ['xl', 'text-xl'],
    ] as const)('size %s maps to %s', (size, cls) => {
      const c = mount(Prose, { props: { size } }).classes()
      expect(c).toContain(cls)
      expect(c).toContain('text-foreground')
    })

    it('md renders the same size as base', () => {
      expect(mount(Prose, { props: { size: 'md' } }).classes()).toContain('text-md')
      expect(mount(Prose, { props: { size: 'base' } }).classes()).toContain('text-md')
    })

    it('default tone adds no surface', () => {
      const c = mount(Prose).classes()
      expect(c).not.toContain('bg-foreground')
      expect(c).not.toContain('dark')
      expect(c).not.toContain('p-6')
    })

    it('inverted swaps foreground and background', () => {
      const c = mount(Prose, { props: { tone: 'inverted' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'rounded-lg', 'p-6']))
      expect(c).not.toContain('text-foreground')
    })

    it('inverted re-colours descendants and drops the light-mode colours', () => {
      const c = mount(Prose, { props: { tone: 'inverted' } }).classes()
      expect(c).toEqual(
        expect.arrayContaining([
          '[&_a]:text-background',
          '[&_a:hover]:text-background/80',
          '[&_:not(pre)>code]:bg-background/15',
          '[&_pre]:bg-background/10',
          '[&_pre]:border-background/20',
          '[&_h2]:border-background/20',
          '[&_th]:border-background/20',
          '[&_td]:border-background/20',
          '[&_hr]:border-background/20',
          '[&_blockquote]:border-background/30',
          '[&_h6]:text-background/70',
          '[&_figcaption]:text-background/70',
        ]),
      )
      for (const gone of ['[&_a]:text-primary', '[&_pre]:bg-muted', '[&_:not(pre)>code]:bg-muted', '[&_h6]:text-muted-foreground']) {
        expect(c).not.toContain(gone)
      }
      expect(c).toContain('[&_h1]:text-4xl')
    })

    it('dark forces the dark palette on a bordered surface', () => {
      const c = mount(Prose, { props: { tone: 'dark' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['dark', 'bg-background', 'text-foreground', 'rounded-lg', 'border', 'p-6']))
      expect(c).toContain('[&_a]:text-primary')
    })

    it('tones compose with size and measure', () => {
      const c = mount(Prose, { props: { tone: 'inverted', size: 'lg', measure: true } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-lg', 'max-w-prose', 'bg-foreground']))
    })

    it('tone surfaces are overridable via class', () => {
      const c = mount(Prose, { props: { tone: 'dark', class: 'p-0 rounded-none bg-card' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['p-0', 'rounded-none', 'bg-card']))
      expect(c).not.toContain('p-6')
      expect(c).not.toContain('bg-background')
    })

    it('inverted uses no hard-coded colours', () => {
      const cls = mount(Prose, { props: { tone: 'inverted' } }).attributes('class') ?? ''
      expect(cls).not.toMatch(/#[0-9a-f]{3,6}|rgb\(|oklch\(|-(red|blue|gray|slate|zinc|neutral|white|black)\b/)
    })

    it('unknown tone falls back to default; unknown size renders no size class', () => {
      const w = mount(Prose, { props: { tone: 'neon' as never, size: 'huge' as never } })
      expect(w.exists()).toBe(true)
      expect(w.classes()).not.toContain('bg-foreground')
      expect(w.classes()).toContain('text-foreground')
    })

    it('reacts to tone changes and keeps slot content', async () => {
      const w = mount(Prose, { props: { tone: 'inverted' }, slots: { default: '<h2>T</h2>' } })
      await w.setProps({ tone: 'default' })
      expect(w.classes()).not.toContain('bg-foreground')
      expect(w.find('h2').text()).toBe('T')
    })

    it('proseVariants is reusable with tone', () => {
      expect(proseVariants({ tone: 'dark' })).toContain('dark')
    })
  })
})

describe('Prose keyboard access to scrolling code blocks', () => {
  it('gives an overflowing pre tabindex=0 (and removes it when it fits), via ResizeObserver', () => {
    const cbs: Array<() => void> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          cbs.push(cb)
        }
        observe() {}
        disconnect() {}
      },
    )
    const w = mount(Prose, { slots: { default: '<pre id="p"><code>x</code></pre>' }, attachTo: document.body })
    const pre = w.find('#p').element
    Object.defineProperty(pre, 'scrollWidth', { configurable: true, value: 900 })
    Object.defineProperty(pre, 'clientWidth', { configurable: true, value: 100 })
    cbs.forEach((cb) => cb())
    expect(pre.getAttribute('tabindex')).toBe('0')
    expect(proseVariants()).toContain('[&_pre:focus-visible]:ring-3')
    Object.defineProperty(pre, 'scrollWidth', { configurable: true, value: 100 })
    cbs.forEach((cb) => cb())
    expect(pre.hasAttribute('tabindex')).toBe(false)
    w.unmount()
    vi.unstubAllGlobals()
  })

  it('uses logical properties so lists, quotes and table headers mirror in RTL', () => {
    const c = proseVariants()
    expect(c).toContain('[&_ul]:ps-6')
    expect(c).toContain('[&_blockquote]:border-s-2')
    expect(c).toContain('[&_th]:text-start')
    expect(c).not.toMatch(/\[&_(?:ul|ol|blockquote)\]:(?:pl|border-l)/)
  })
})
