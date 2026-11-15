import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { cn } from '../../../lib/cn'
import { TABS_SIZES, TABS_VARIANTS, Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants, tabsTriggerVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(rootProps: Record<string, unknown> = {}, listProps: Record<string, unknown> = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Tabs, { defaultValue: 'a', ...rootProps }, () => [
        h(TabsList, { 'aria-label': 'Sections', ...listProps }, () => [
          h(TabsTrigger, { value: 'a' }, () => 'Alpha'),
          h(TabsTrigger, { value: 'b' }, () => 'Beta'),
        ]),
        h(TabsContent, { value: 'a' }, () => 'Panel A'),
        h(TabsContent, { value: 'b' }, () => 'Panel B'),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const root = () => document.body.querySelector<HTMLElement>('[data-slot="tabs"]')!
const list = () => document.body.querySelector<HTMLElement>('[data-slot="tabs-list"]')!
const triggers = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')]

describe('Tabs variations', () => {
  describe('variant', () => {
    it('line (default) keeps today\'s classes', () => {
      make()
      expect(root().dataset.variant).toBe('line')
      expect(list().className).toBe(cn(tabsListVariants()))
      expect(list().className).toContain('border-b')
      expect(triggers()[0].className).toContain('border-b-2')
      expect(triggers()[0].className).not.toContain('text-xs')
      expect(triggers()[0].className).toContain('px-3 py-2')
    })

    it('default class strings are exactly the pre-variation output', () => {
      expect(tabsListVariants()).toBe(
        'inline-flex max-w-full items-center overflow-x-auto text-muted-foreground data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:overflow-visible gap-1 border-b data-[orientation=vertical]:border-e data-[orientation=vertical]:border-b-0',
      )
      expect(tabsTriggerVariants()).toContain('relative border-b-2 border-transparent px-3 py-2')
      expect(tabsTriggerVariants({ variant: 'pill' })).toContain('rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm')
    })

    it('pill: muted track and a raised active tab', () => {
      make({ variant: 'pill' })
      expect(root().dataset.variant).toBe('pill')
      expect(list().className).toContain('bg-muted')
      expect(list().className).toContain('rounded-lg')
      expect(triggers()[0].className).toContain('data-[state=active]:bg-background')
    })

    it('segmented: bordered track and a solid active segment with matching hover text', () => {
      make({ variant: 'segmented' })
      expect(root().dataset.variant).toBe('segmented')
      expect(list().className).toContain('border')
      expect(list().className).toContain('bg-background')
      const cls = triggers()[0].className
      expect(cls).toContain('data-[state=active]:bg-primary')
      expect(cls).toContain('data-[state=active]:text-primary-foreground')
      expect(cls).toContain('data-[state=active]:hover:text-primary-foreground')
      expect(cls).not.toContain('data-[state=active]:text-foreground')
    })

    it('enclosed: boxed tabs, the active one matches the panel surface', () => {
      make({ variant: 'enclosed' })
      expect(root().dataset.variant).toBe('enclosed')
      expect(list().className).toContain('border-b')
      const cls = triggers()[0].className
      expect(cls).toContain('rounded-t-md')
      expect(cls).toContain('bg-muted')
      expect(cls).toContain('data-[state=active]:bg-background')
      expect(cls).toContain('border-border')
    })

    it('every value renders distinct list and trigger classes', () => {
      const seen = new Set<string>()
      for (const variant of TABS_VARIANTS) {
        make({ variant })
        seen.add(`${list().className}|${triggers()[0].className}`)
        wrapper?.unmount()
        document.body.innerHTML = ''
      }
      expect(seen.size).toBe(TABS_VARIANTS.length)
    })

    it('an unknown variant falls back to line', () => {
      make({ variant: 'bogus' })
      expect(root().dataset.variant).toBe('line')
      expect(list().className).toBe(cn(tabsListVariants()))
    })

    it('state is not colour alone: active tabs differ by border or fill and underline in forced colors', () => {
      for (const variant of TABS_VARIANTS) {
        make({ variant })
        expect(triggers()[0].className, variant).toContain('forced-colors:data-[state=active]:underline')
        expect(triggers()[0].className, variant).toMatch(/data-\[state=active\]:(border|bg)/)
        wrapper?.unmount()
        document.body.innerHTML = ''
      }
    })
  })

  describe('size', () => {
    it('md is the default and adds no classes', () => {
      make()
      expect(root().dataset.size).toBe('md')
      expect(triggers()[0].className).toBe(cn(tabsTriggerVariants()))
      expect(tabsTriggerVariants({ size: 'md' })).toBe(tabsTriggerVariants())
    })

    it.each([
      ['line', 'text-xs', 'px-2 py-1'],
      ['pill', 'text-xs', 'px-2 py-1'],
      ['segmented', 'text-xs', 'px-2 py-1'],
      ['enclosed', 'text-xs', 'px-2 py-1'],
    ])('sm on %s uses smaller text and padding (merged with the variant padding)', (variant, text, pad) => {
      make({ variant, size: 'sm' })
      const cls = triggers()[0].className
      expect(root().dataset.size).toBe('sm')
      expect(cls).toContain(text)
      expect(cls).toContain(pad)
      expect(cls).not.toMatch(/\btext-sm\b/)
      expect(cls).not.toContain('px-3')
    })

    it.each(['line', 'pill', 'segmented', 'enclosed'])('lg on %s uses larger text and padding', (variant) => {
      make({ variant, size: 'lg' })
      const cls = triggers()[0].className
      expect(root().dataset.size).toBe('lg')
      expect(cls).toContain('text-base')
      expect(cls).not.toMatch(/\btext-sm\b/)
      expect(cls).toMatch(/px-4/)
    })

    it('every size renders a different trigger', () => {
      const seen = new Set<string>()
      for (const size of TABS_SIZES) {
        make({ size })
        seen.add(triggers()[0].className)
        wrapper?.unmount()
        document.body.innerHTML = ''
      }
      expect(seen.size).toBe(3)
    })

    it('unknown size falls back to md', () => {
      make({ size: 'huge' })
      expect(root().dataset.size).toBe('md')
      expect(triggers()[0].className).toBe(cn(tabsTriggerVariants()))
    })

    it('keeps 24px targets at sm (text-xs line height plus vertical padding) and coarse-pointer 44px', () => {
      make({ size: 'sm', variant: 'pill' })
      expect(triggers()[0].className).toContain('py-1')
      expect(triggers()[0].className).toContain('pointer-coarse:min-h-11')
    })
  })

  describe('fullWidth', () => {
    it('is off by default', () => {
      make()
      expect(root().hasAttribute('data-full-width')).toBe(false)
      expect(list().className).not.toMatch(/(^|\s|:)w-full/)
      expect(triggers()[0].className).not.toMatch(/\bgrow\b/)
    })

    it('stretches a horizontal list and lets triggers grow', () => {
      make({ fullWidth: true })
      expect(root().hasAttribute('data-full-width')).toBe(true)
      expect(list().className).toContain('data-[orientation=horizontal]:w-full')
      expect(list().className).toContain('data-[orientation=horizontal]:flex')
      expect(triggers().every((t) => /\bgrow\b/.test(t.className))).toBe(true)
    })

    it('is scoped to horizontal lists so a vertical list keeps its column', () => {
      make({ fullWidth: true, orientation: 'vertical' })
      expect(list().getAttribute('data-orientation')).toBe('vertical')
      expect(list().className).not.toMatch(/(^|\s)w-full/)
      expect(list().className).toContain('data-[orientation=vertical]:flex-col')
    })

    it('a truthy non-boolean is not treated as true', () => {
      make({ fullWidth: 'yes' })
      expect(root().hasAttribute('data-full-width')).toBe(false)
    })
  })

  describe('orientation', () => {
    it.each(TABS_VARIANTS)('vertical %s keeps aria-orientation and uses logical borders', (variant) => {
      make({ variant, orientation: 'vertical' })
      expect(document.body.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe('vertical')
      if (variant === 'line' || variant === 'enclosed') expect(list().className).toContain('data-[orientation=vertical]:border-e')
      if (variant !== 'pill') expect(triggers()[0].className).toContain('data-[orientation=vertical]:')
    })

    it('enclosed vertical rounds the start edge, not the top', () => {
      make({ variant: 'enclosed', orientation: 'vertical' })
      const cls = triggers()[0].className
      expect(cls).toContain('data-[orientation=vertical]:rounded-s-md')
      expect(cls).toContain('data-[orientation=vertical]:rounded-t-none')
      expect(cls).toContain('data-[orientation=vertical]:border-e-0')
    })
  })

  describe('combinations and overrides', () => {
    it.each([
      ['segmented', 'sm', true],
      ['pill', 'lg', true],
      ['enclosed', 'lg', false],
      ['line', 'sm', true],
    ])('%s + %s + fullWidth=%s keep every dimension', (variant, size, fullWidth) => {
      make({ variant, size, fullWidth })
      expect(root().dataset.variant).toBe(variant)
      expect(root().dataset.size).toBe(size)
      expect(root().hasAttribute('data-full-width')).toBe(fullWidth)
      expect(triggers()[0].className).toContain(size === 'sm' ? 'text-xs' : 'text-base')
      expect(/\bgrow\b/.test(triggers()[0].className)).toBe(fullWidth)
    })

    it('class on TabsList and TabsTrigger still wins over variant classes', () => {
      const Comp = defineComponent({
        setup: () => () =>
          h(Tabs, { defaultValue: 'a', variant: 'segmented', size: 'lg' }, () => [
            h(TabsList, { 'aria-label': 'x', class: 'bg-red-500' }, () => [h(TabsTrigger, { value: 'a', class: 'px-9 text-xs' }, () => 'A')]),
            h(TabsContent, { value: 'a' }, () => 'P'),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(list().className).toContain('bg-red-500')
      expect(list().className).not.toMatch(/(^|\s)bg-background(\s|$)/)
      expect(triggers()[0].className).toContain('px-9')
      expect(triggers()[0].className).toContain('text-xs')
      expect(triggers()[0].className).not.toContain('text-base')
    })

    it('exported variants work on plain elements and need cn() to resolve size against variant padding', () => {
      const raw = tabsTriggerVariants({ variant: 'line', size: 'sm' })
      expect(raw).toContain('px-3')
      expect(raw).toContain('px-2')
      expect(cn(raw)).not.toContain('px-3')
      expect(tabsListVariants({ variant: 'segmented', fullWidth: true })).toContain('data-[orientation=horizontal]:w-full')
    })

    it('unknown cva values fall back to the defaults', () => {
      expect(tabsListVariants({ variant: 'nope' as never })).not.toContain('nope')
      expect(tabsTriggerVariants({ size: 'nope' as never })).toBe(tabsTriggerVariants())
    })
  })

  describe('behaviour and a11y stay identical across variants', () => {
    it.each(TABS_VARIANTS)('%s keeps tablist/tab/tabpanel roles, names and switching', async (variant) => {
      make({ variant, size: 'sm', fullWidth: true })
      expect(document.body.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Sections')
      expect(triggers().map((t) => t.getAttribute('role'))).toEqual(['tab', 'tab'])
      expect(triggers()[0].getAttribute('aria-selected')).toBe('true')
      triggers()[1].dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }))
      await flushPromises()
      expect(triggers()[1].getAttribute('aria-selected')).toBe('true')
      expect(document.body.textContent).toContain('Panel B')
      expect(document.body.querySelector('[role="tabpanel"][data-state="active"]')?.getAttribute('aria-labelledby')).toBe(triggers()[1].id)
    })

    it('every trigger keeps the focus ring and coarse-pointer height', () => {
      for (const variant of TABS_VARIANTS) {
        make({ variant })
        expect(triggers()[0].className, variant).toContain('focus-visible:ring-3')
        expect(triggers()[0].className, variant).toContain('pointer-coarse:min-h-11')
        wrapper?.unmount()
        document.body.innerHTML = ''
      }
    })

    it('the list stays a scroll container so long tabs never widen the page', () => {
      for (const variant of TABS_VARIANTS) {
        make({ variant, fullWidth: true })
        expect(list().className, variant).toContain('overflow-x-auto')
        expect(list().className, variant).toContain('max-w-full')
        wrapper?.unmount()
        document.body.innerHTML = ''
      }
    })

    it('handles empty and very long trigger text', () => {
      const long = 'Very long tab title '.repeat(10)
      const Comp = defineComponent({
        setup: () => () =>
          h(Tabs, { defaultValue: 'a', variant: 'enclosed', size: 'lg', fullWidth: true }, () => [
            h(TabsList, { 'aria-label': 'Long' }, () => [h(TabsTrigger, { value: 'a' }, () => long.trim())]),
            h(TabsContent, { value: 'a' }, () => ''),
          ]),
      })
      wrapper = mount(Comp, { attachTo: document.body })
      expect(triggers()[0].textContent).toBe(long.trim())
      expect(triggers()[0].className).toContain('whitespace-nowrap')
    })
  })
})
