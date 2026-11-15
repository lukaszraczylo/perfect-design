import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot } from 'reka-ui'
import ScrollArea from './ScrollArea.vue'
import ScrollBar from './ScrollBar.vue'
import { scrollBarVariants, scrollThumbVariants } from './variants'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function area(props: Record<string, unknown> = {}) {
  wrapper = mount(ScrollArea, { props: { type: 'always', ...props }, slots: { default: 'Content' }, attachTo: document.body }) as unknown as VueWrapper
  return wrapper
}
function bar(props: Record<string, unknown> = {}) {
  wrapper = mount(
    defineComponent({ setup: () => () => h(ScrollAreaRoot, { type: 'always' }, { default: () => h(ScrollBar, { forceMount: true, ...props }) }) }),
    { attachTo: document.body },
  ) as unknown as VueWrapper
  return wrapper.find('[data-slot="scroll-area-scrollbar"]')
}
const bars = (w: VueWrapper) => w.findAll('[data-slot="scroll-area-scrollbar"]')
const thumbs = (w: VueWrapper) => w.findAll('[data-slot="scroll-area-thumb"]')
const vertical = (w: VueWrapper) => bars(w).find((b) => b.attributes('data-orientation') === 'vertical')!
const horizontal = (w: VueWrapper) => bars(w).find((b) => b.attributes('data-orientation') === 'horizontal')!

describe('ScrollArea scrollbar defaults are unchanged', () => {
  it('md and default produce the original bar and thumb classes', () => {
    const w = area({ horizontal: true })
    expect(vertical(w).classes().sort()).toEqual(['border-l', 'border-l-transparent', 'flex', 'h-full', 'p-px', 'select-none', 'touch-none', 'transition-colors', 'w-2.5'])
    expect(horizontal(w).classes().sort()).toEqual(['border-t', 'border-t-transparent', 'flex', 'flex-col', 'h-2.5', 'p-px', 'select-none', 'touch-none', 'transition-colors', 'w-full'])
    expect(thumbs(w)[0]!.classes().sort()).toEqual(['bg-input', 'flex-1', 'hover:bg-muted-foreground', 'relative', 'rounded-full'])
    expect(area({ size: 'md', variant: 'default' }) && vertical(wrapper!).classes()).toContain('w-2.5')
  })
})

describe('ScrollArea size', () => {
  it.each([
    ['sm', 'w-1.5', 'h-1.5'],
    ['md', 'w-2.5', 'h-2.5'],
    ['lg', 'w-4', 'h-4'],
  ] as const)('%s sets %s on the vertical and %s on the horizontal bar', (size, w, h) => {
    const a = area({ size, horizontal: true })
    expect(vertical(a).classes()).toContain(w)
    expect(horizontal(a).classes()).toContain(h)
    const others = ['w-1.5', 'w-2.5', 'w-4'].filter((c) => c !== w)
    for (const c of others) expect(vertical(a).classes()).not.toContain(c)
    expect(horizontal(a).classes().filter((c) => /^h-\d/.test(c))).toEqual([h])
  })

  it('unknown size falls back to md', () => {
    expect(vertical(area({ size: 'xl' })).classes()).toContain('w-2.5')
  })

  it('reacts to size changes', async () => {
    const a = area({ size: 'sm' })
    await a.setProps({ size: 'lg' })
    expect(vertical(a).classes()).toContain('w-4')
    expect(vertical(a).classes()).not.toContain('w-1.5')
  })

  it('class on a standalone ScrollBar wins over the size', () => {
    const b = bar({ size: 'lg', class: 'w-8' })
    expect(b.classes()).toContain('w-8')
    expect(b.classes()).not.toContain('w-4')
  })
})

describe('ScrollArea variant', () => {
  it('track adds a visible muted track and a solid thumb that keeps a forced-colors border', () => {
    const a = area({ variant: 'track' })
    expect(vertical(a).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full']))
    expect(thumbs(a)[0]!.classes()).toEqual(expect.arrayContaining(['bg-muted-foreground', 'hover:bg-foreground', 'forced-colors:border']))
    expect(thumbs(a)[0]!.classes()).not.toContain('bg-input')
  })

  it('solid has a solid thumb on a transparent track', () => {
    const a = area({ variant: 'solid' })
    expect(vertical(a).classes()).not.toContain('bg-muted')
    expect(thumbs(a)[0]!.classes()).toEqual(expect.arrayContaining(['bg-muted-foreground', 'forced-colors:border']))
  })

  it('default has no track and no forced-colors border', () => {
    const a = area()
    expect(vertical(a).classes()).not.toContain('bg-muted')
    expect(thumbs(a)[0]!.classes()).not.toContain('forced-colors:border')
  })

  it('unknown variant falls back to default', () => {
    const a = area({ variant: 'neon' })
    expect(thumbs(a)[0]!.classes()).toContain('bg-input')
    expect(vertical(a).classes()).not.toContain('bg-muted')
  })

  it('applies to both bars', () => {
    const a = area({ variant: 'track', horizontal: true })
    expect(bars(a)).toHaveLength(2)
    for (const b of bars(a)) expect(b.classes()).toContain('bg-muted')
    for (const t of thumbs(a)) expect(t.classes()).toContain('bg-muted-foreground')
  })

  it('class wins over the track fill', () => {
    const b = bar({ variant: 'track', class: 'bg-accent' })
    expect(b.classes()).toContain('bg-accent')
    expect(b.classes()).not.toContain('bg-muted')
  })
})

describe('ScrollArea size x variant keeps the scroller accessible', () => {
  const sizes = ['sm', 'md', 'lg'] as const
  const variants = ['default', 'track', 'solid'] as const
  it.each(sizes.flatMap((s) => variants.map((v) => [s, v] as const)))('size %s, variant %s: one thickness, labelled focusable viewport, focus ring kept', (size, variant) => {
    const a = area({ size, variant, label: 'Sample log', horizontal: true })
    expect(vertical(a).classes().filter((c) => /^w-\d/.test(c))).toHaveLength(1)
    expect(horizontal(a).classes().filter((c) => /^h-\d/.test(c))).toHaveLength(1)
    const vp = a.find('[data-slot="scroll-area-viewport"]')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(vp.attributes('role')).toBe('region')
    expect(vp.attributes('aria-label')).toBe('Sample log')
    expect(vp.classes()).toEqual(expect.arrayContaining(['focus-visible:ring-3', 'focus-visible:ring-inset']))
  })

  it('vertical=false removes the vertical bar for every look', () => {
    const a = area({ size: 'lg', variant: 'solid', vertical: false, horizontal: true })
    expect(bars(a)).toHaveLength(1)
    expect(horizontal(a).classes()).toContain('h-4')
  })

  it('hover type renders no bar until hovered, whatever the look', () => {
    expect(bars(area({ type: 'hover', size: 'lg', variant: 'track' }))).toHaveLength(0)
  })

  it('standalone ScrollBar accepts every orientation, size and variant and uses logical borders', () => {
    for (const orientation of ['vertical', 'horizontal'] as const)
      for (const size of sizes)
        for (const variant of variants) {
          const b = bar({ orientation, size, variant })
          expect(b.attributes('data-orientation')).toBe(orientation)
          expect(b.classes().join(' ')).not.toMatch(/\bm[lr]-|\bpl-|\bpr-/)
          wrapper!.unmount()
        }
  })

  it('an unknown ScrollBar orientation gets the vertical bar classes', () => {
    const b = bar({ orientation: 'diagonal' })
    expect(b.classes()).toEqual(expect.arrayContaining(['h-full', 'w-2.5']))
    expect(b.classes()).not.toContain('w-full')
  })
})

describe('scrollBarVariants and scrollThumbVariants', () => {
  it('cover every size, orientation and variant', () => {
    expect(scrollBarVariants()).toContain('w-2.5')
    expect(scrollBarVariants({ orientation: 'horizontal', size: 'sm' })).toContain('h-1.5')
    expect(scrollBarVariants({ orientation: 'horizontal', size: 'lg' })).toContain('h-4')
    expect(scrollBarVariants({ size: 'lg' })).toContain('w-4')
    expect(scrollBarVariants({ size: 'sm' })).toContain('w-1.5')
    expect(scrollBarVariants({ variant: 'track' })).toContain('bg-muted')
    expect(scrollThumbVariants()).toContain('bg-input')
    expect(scrollThumbVariants({ variant: 'solid' })).toContain('forced-colors:border')
    expect(scrollBarVariants({ class: 'extra' })).toContain('extra')
  })
})

describe('ScrollArea default thumb contrast', () => {
  // The old faint thumb (muted-foreground at 30% over the page) measured about 1.3:1. WCAG 1.4.11 asks 3:1 for a UI component.
  // `--input` (the form-control border colour) is held at >= 3:1 against background and card, light and dark, by
  // src/__tests__/contrast.test.ts ("form-control border (--input)"), so the default thumb reuses that pair and adds no new one.
  it('uses the opaque --input token, not a translucent foreground tint', () => {
    const thumb = scrollThumbVariants()
    expect(thumb).toContain('bg-input')
    expect(thumb).not.toMatch(/bg-[a-z-]+\/\d+/)
    expect(thumb).not.toMatch(/(^| )opacity-/)
  })

  it('darkens to the muted foreground on hover, which is at least 4.5:1 against the same surfaces', () => {
    expect(scrollThumbVariants()).toContain('hover:bg-muted-foreground')
  })

  it('track and solid variants keep their solid muted-foreground thumb and forced-colors border', () => {
    for (const variant of ['track', 'solid'] as const) {
      const a = area({ variant })
      expect(thumbs(a)[0]!.classes()).toEqual(expect.arrayContaining(['bg-muted-foreground', 'hover:bg-foreground', 'forced-colors:border']))
      expect(thumbs(a)[0]!.classes()).not.toContain('bg-input')
    }
    expect(vertical(area({ variant: 'track' })).classes()).toContain('bg-muted')
  })

  it('every size renders the same thumb colour', () => {
    for (const size of ['sm', 'md', 'lg']) expect(thumbs(area({ size }))[0]!.classes()).toContain('bg-input')
  })
})
