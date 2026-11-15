import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { cn } from '../../../lib/cn'
import ShowMore from './ShowMore.vue'
import { heights, installLayout, uninstallLayout } from './layout-stub'
import {
  SHOW_MORE_ALIGNS,
  showMoreContentVariants,
  showMoreLineClamp,
  showMoreMaxHeight,
  showMoreToggleVariants,
  showMoreVariants,
  resolveShowMoreLines,
} from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

beforeEach(() => installLayout())
afterEach(() => {
  uninstallLayout()
  document.body.innerHTML = ''
})

function render(props: Record<string, unknown> = {}) {
  const w = mount(ShowMore, { props, slots: { default: () => h('p', 'Sample text') } })
  ;(w.vm.$ as unknown as { update: () => void }).update()
  return w
}
const root = (p: Record<string, unknown> = {}) => render(p).classes()
const toggle = (p: Record<string, unknown> = {}) => render(p).find('[data-slot="show-more-toggle"]').classes()

describe('ShowMore variations', () => {
  it('heights stub is wired (guard against a silent no-op test file)', () => {
    expect(heights.full).toBeGreaterThan(heights.visible)
    expect(render().find('[data-slot="show-more-toggle"]').exists()).toBe(true)
  })

  describe('default output is frozen', () => {
    it('root', () => {
      expect(set(root().join(' '))).toEqual(set('flex w-full min-w-0 flex-col gap-1'))
    })
    it('content', () => {
      expect(set(render().find('[data-slot="show-more-content"]').classes().join(' '))).toEqual(set('min-w-0 break-words line-clamp-3'))
    })
    it('toggle: link, md, below, start', () => {
      const c = toggle()
      expect(c).toEqual(
        expect.arrayContaining(['inline-flex', 'shrink-0', 'rounded-md', 'px-1', 'text-primary', 'underline-offset-4', 'hover:underline', 'min-h-8', 'text-sm', 'self-start', 'pointer-coarse:min-h-11']),
      )
    })
  })

  describe('layout', () => {
    it('below stacks the toggle under the content', () => {
      expect(root({ layout: 'below' })).toEqual(expect.arrayContaining(['flex-col', 'gap-1']))
      expect(render({ layout: 'below' }).find('[data-slot="show-more-content"]').classes()).not.toContain('flex-1')
    })
    it('inline puts the toggle beside the content at its last line', () => {
      const w = render({ layout: 'inline' })
      expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'items-end', 'gap-2']))
      expect(w.classes()).not.toContain('flex-col')
      expect(w.find('[data-slot="show-more-content"]').classes()).toContain('flex-1')
      expect(w.find('[data-slot="show-more-toggle"]').classes().some((c) => c.startsWith('self-'))).toBe(false)
    })
    it('unknown layout falls back to below', () => {
      expect(root({ layout: 'floating' })).toEqual(root())
    })
  })

  describe('align', () => {
    it.each([
      ['start', 'self-start'],
      ['center', 'self-center'],
      ['end', 'self-end'],
    ] as const)('%s uses %s (logical, flips in rtl)', (align, cls) => {
      const c = toggle({ align })
      expect(c).toContain(cls)
      expect(c.filter((x) => x.startsWith('self-'))).toEqual([cls])
    })
    it('unknown align falls back to start', () => {
      expect(toggle({ align: 'middle' })).toEqual(toggle())
    })
    it('lists every documented value', () => {
      expect([...SHOW_MORE_ALIGNS]).toEqual(['start', 'center', 'end'])
    })
  })

  describe('appearance', () => {
    it('link is text only with an underline on hover', () => {
      const c = toggle({ appearance: 'link' })
      expect(c).toEqual(expect.arrayContaining(['text-primary', 'hover:underline', 'px-1']))
      expect(c.some((x) => x.startsWith('bg-') || x === 'border')).toBe(false)
    })
    it('button is a tinted fill', () => {
      const c = toggle({ appearance: 'button' })
      expect(c).toEqual(expect.arrayContaining(['bg-primary/10', 'text-primary', 'hover:bg-primary/20', 'px-3']))
      expect(c).not.toContain('hover:underline')
    })
    it('outline has a visible border', () => {
      const c = toggle({ appearance: 'outline' })
      expect(c).toEqual(expect.arrayContaining(['border', 'border-input', 'bg-background', 'text-foreground', 'hover:bg-accent', 'hover:text-accent-foreground', 'px-3']))
    })
    it('unknown appearance falls back to link', () => {
      expect(toggle({ appearance: 'ghost' })).toEqual(toggle())
    })
  })

  describe('size', () => {
    it.each([
      ['sm', ['min-h-6', 'text-xs']],
      ['md', ['min-h-8', 'text-sm']],
      ['lg', ['min-h-10', 'text-sm']],
    ] as const)('%s', (size, cls) => {
      const c = toggle({ size })
      expect(c).toEqual(expect.arrayContaining([...cls]))
      expect(c.filter((x) => /^min-h-/.test(x))).toHaveLength(1)
    })
    it.each([
      ['sm', 'px-2'],
      ['md', 'px-3'],
      ['lg', 'px-4'],
    ] as const)('button padding follows %s', (size, px) => {
      expect(toggle({ appearance: 'button', size })).toContain(px)
      expect(toggle({ appearance: 'outline', size })).toContain(px)
    })
    it('every size keeps a 24px floor and a 44px coarse floor', () => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const c = toggle({ size })
        expect(c).toContain('pointer-coarse:min-h-11')
        expect(c.some((x) => /^min-h-(6|8|10)$/.test(x))).toBe(true)
      }
    })
    it('unknown size falls back to md', () => {
      expect(toggle({ size: 'giant' })).toEqual(toggle())
    })
  })

  describe('focus and forced-colors', () => {
    it('uses the shared focus ring', () => {
      expect(toggle()).toEqual(expect.arrayContaining(['outline-hidden', 'focus-visible:ring-3', 'focus-visible:ring-ring/40']))
    })
    it('outline appearance keeps a border in forced-colors mode', () => {
      expect(toggle({ appearance: 'outline' })).toContain('border')
    })
  })

  describe('clamp lookups use literal classes', () => {
    it('line clamp table', () => {
      expect(Object.values(showMoreLineClamp)).toEqual(['line-clamp-1', 'line-clamp-2', 'line-clamp-3', 'line-clamp-4', 'line-clamp-5', 'line-clamp-6'])
    })
    it('height table', () => {
      expect(Object.values(showMoreMaxHeight).every((c) => /^max-h-\d+ overflow-hidden$/.test(c))).toBe(true)
      expect(new Set(Object.values(showMoreMaxHeight)).size).toBe(5)
    })
    it('resolveShowMoreLines', () => {
      expect([resolveShowMoreLines(undefined), resolveShowMoreLines(0.5), resolveShowMoreLines(2.5), resolveShowMoreLines(9)]).toEqual([3, 3, 2, 6])
    })
  })

  describe('combinations', () => {
    it('inline + outline + sm + maxHeight', () => {
      const w = render({ layout: 'inline', appearance: 'outline', size: 'sm', maxHeight: 'md' })
      expect(w.classes()).toContain('flex-row')
      expect(w.find('[data-slot="show-more-content"]').classes()).toContain('max-h-32')
      expect(w.find('[data-slot="show-more-toggle"]').classes()).toEqual(expect.arrayContaining(['border', 'min-h-6', 'px-2']))
    })
    it('below + end + button + lg', () => {
      expect(toggle({ align: 'end', appearance: 'button', size: 'lg' })).toEqual(expect.arrayContaining(['self-end', 'bg-primary/10', 'min-h-10', 'px-4']))
    })
    it('class wins over layout classes', () => {
      expect(root({ class: 'flex-row gap-8' })).toEqual(expect.arrayContaining(['flex-row', 'gap-8']))
      expect(root({ class: 'flex-row gap-8' })).not.toContain('flex-col')
    })
  })

  describe('variants outside the component', () => {
    it('can style plain elements', () => {
      expect(showMoreVariants({ layout: 'inline' })).toContain('flex-row')
      expect(showMoreContentVariants({ layout: 'inline' })).toContain('flex-1')
      expect(cn(showMoreToggleVariants({ appearance: 'button' }))).toContain('bg-primary/10')
    })
  })
})
