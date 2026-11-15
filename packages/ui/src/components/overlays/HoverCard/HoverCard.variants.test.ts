import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { cn } from '../../../lib/cn'
import { floatingSurface } from '../../../lib/styles'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  hoverCardArrowVariants,
  hoverCardContentVariants,
  hoverCardSizes,
  hoverCardVariantNames,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(contentProps: Record<string, unknown> = {}) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(HoverCard, { open: true }, () => [h(HoverCardTrigger, { href: '#user' }, () => '@ada'), h(HoverCardContent, contentProps, () => 'Ada Lovelace')]),
    }),
    { attachTo: document.body },
  )
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const content = () => q('[data-slot="hover-card-content"]')!
const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

describe('HoverCard size, variant and arrow', () => {
  it('lists the values', () => {
    expect(hoverCardSizes).toEqual(['sm', 'md', 'lg', 'xl', 'auto'])
    expect(hoverCardVariantNames).toEqual(['neutral', 'inverted'])
  })

  it('default output is the original class set (w-64 p-4 popover surface), no arrow, no data-variant', async () => {
    make()
    await nextTick()
    const original = cn(
      floatingSurface,
      'z-(--z-modal) max-h-(--reka-popper-available-height) w-64 max-w-[calc(100vw-2rem)] overflow-y-auto p-4 outline-hidden data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out',
    )
    // data-state classes are reka-independent, so the class set must match exactly.
    expect(set(content().className)).toEqual(set(original))
    expect(content().hasAttribute('data-variant')).toBe(false)
    expect(q('[data-slot="hover-card-arrow"]')).toBeNull()
  })

  it.each([
    ['sm', 'w-52', 'p-3'],
    ['md', 'w-64', 'p-4'],
    ['lg', 'w-80', 'p-4'],
    ['xl', 'w-96', 'p-5'],
    ['auto', 'w-auto', 'p-4'],
  ] as const)('size %s sets %s and %s and stays capped to the viewport', async (size, w, p) => {
    make({ size })
    await nextTick()
    const c = content()
    expect(c.classList.contains(w)).toBe(true)
    expect(c.classList.contains(p)).toBe(true)
    expect(c.className).toContain('max-w-[calc(100vw-2rem)]')
    expect(c.className).toContain('max-h-(--reka-popper-available-height)')
    if (size !== 'md') expect(c.classList.contains('w-64')).toBe(false)
  })

  it('unknown size falls back to md', async () => {
    make({ size: 'giant' })
    await nextTick()
    expect(content().classList.contains('w-64')).toBe(true)
  })

  it('variant="inverted" replaces the popover colours and sets data-variant', async () => {
    make({ variant: 'inverted' })
    await nextTick()
    const c = content()
    expect(c.getAttribute('data-variant')).toBe('inverted')
    for (const cls of ['bg-foreground', 'text-background', 'border-foreground']) expect(c.classList.contains(cls), cls).toBe(true)
    for (const cls of ['bg-popover', 'text-popover-foreground']) expect(c.classList.contains(cls), cls).toBe(false)
  })

  it('unknown variant falls back to neutral', async () => {
    make({ variant: 'neon' })
    await nextTick()
    expect(content().classList.contains('bg-popover')).toBe(true)
    expect(content().hasAttribute('data-variant')).toBe(false)
  })

  it('showArrow renders a decorative arrow that follows the variant', async () => {
    make({ showArrow: true })
    await nextTick()
    const arrow = q('[data-slot="hover-card-arrow"]')!
    expect(arrow.getAttribute('aria-hidden')).toBe('true')
    expect(arrow.getAttribute('class')).toContain('fill-popover')
    wrapper!.unmount()
    document.body.innerHTML = ''
    make({ showArrow: true, variant: 'inverted' })
    await nextTick()
    expect(q('[data-slot="hover-card-arrow"]')!.getAttribute('class')).toContain('fill-foreground')
  })

  it('cross product of size and variant', async () => {
    for (const size of hoverCardSizes) {
      for (const variant of hoverCardVariantNames) {
        make({ size, variant, showArrow: true })
        await nextTick()
        const c = content()
        expect(c.classList.contains(variant === 'inverted' ? 'bg-foreground' : 'bg-popover'), `${size}/${variant}`).toBe(true)
        expect(c.classList.contains(size === 'auto' ? 'w-auto' : { sm: 'w-52', md: 'w-64', lg: 'w-80', xl: 'w-96' }[size])).toBe(true)
        expect(q('[data-slot="hover-card-arrow"]')).not.toBeNull()
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('class prop wins over size and variant classes and attributes fall through', async () => {
    make({ size: 'lg', variant: 'inverted', class: 'w-40 bg-primary', 'data-testid': 'hc' })
    await nextTick()
    const c = content()
    expect(c.classList.contains('w-40')).toBe(true)
    expect(c.classList.contains('w-80')).toBe(false)
    expect(c.classList.contains('bg-primary')).toBe(true)
    expect(c.classList.contains('bg-foreground')).toBe(false)
    expect(c.getAttribute('data-testid')).toBe('hc')
    expect(c.hasAttribute('size')).toBe(false)
    expect(c.hasAttribute('variant')).toBe(false)
  })

  it('exported helpers', () => {
    expect(hoverCardContentVariants()).toContain('w-64 p-4')
    expect(hoverCardArrowVariants({ variant: 'inverted' })).toBe('fill-foreground')
    expect(hoverCardArrowVariants()).toContain('stroke-border')
    expect(() => hoverCardContentVariants({ size: 'x' as never, variant: 'y' as never })).not.toThrow()
  })
})
