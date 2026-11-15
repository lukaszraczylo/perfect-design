import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { cn } from '../../../lib/cn'
import { Popover, PopoverContent, PopoverTrigger, popoverArrowVariants, popoverContentVariants, popoverSizes, popoverVariantNames } from './index'

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
        h(Popover, { open: true }, () => [h(PopoverTrigger, null, () => 'Toggle'), h(PopoverContent, contentProps, () => h('p', { id: 'body' }, 'Body'))]),
    }),
    { attachTo: document.body },
  )
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const content = () => q('[data-slot="popover-content"]')!
const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean))

describe('Popover variant and arrow', () => {
  it('lists the variant names', () => {
    expect(popoverVariantNames).toEqual(['neutral', 'inverted'])
  })

  it('default output is unchanged: popover surface, md size, no arrow, no data-variant', async () => {
    make()
    await nextTick()
    const c = content()
    expect(c.className).toContain('bg-popover')
    expect(c.className).toContain('text-popover-foreground')
    expect(c.className).toContain('w-72')
    expect(c.className).not.toContain('bg-foreground')
    expect(c.hasAttribute('data-variant')).toBe(false)
    expect(q('[data-slot="popover-arrow"]')).toBeNull()
    expect(set(popoverContentVariants())).toEqual(set(popoverContentVariants({ variant: 'neutral', size: 'md' })))
    expect(popoverContentVariants({ variant: 'neutral' })).not.toContain('bg-foreground')
  })

  it('variant="neutral" is identical to omitting it', async () => {
    make({ variant: 'neutral' })
    await nextTick()
    expect(content().className).toContain('bg-popover')
    expect(content().hasAttribute('data-variant')).toBe(false)
  })

  it('variant="inverted" uses foreground surface and background text, replacing the popover colours', async () => {
    make({ variant: 'inverted' })
    await nextTick()
    const c = content()
    expect(c.getAttribute('data-variant')).toBe('inverted')
    for (const cls of ['bg-foreground', 'text-background', 'border-foreground']) expect(c.classList.contains(cls), cls).toBe(true)
    for (const cls of ['bg-popover', 'text-popover-foreground']) expect(c.classList.contains(cls), cls).toBe(false)
    expect(c.classList.contains('border')).toBe(true)
  })

  it('unknown variant falls back to neutral (also prototype keys)', async () => {
    for (const bad of ['neon', 'toString', '']) {
      make({ variant: bad })
      await nextTick()
      expect(content().className).toContain('bg-popover')
      expect(content().hasAttribute('data-variant')).toBe(false)
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('showArrow renders a decorative arrow that follows the variant', async () => {
    make({ showArrow: true })
    await nextTick()
    const neutral = q('[data-slot="popover-arrow"]')!
    expect(neutral).not.toBeNull()
    expect(neutral.getAttribute('aria-hidden')).toBe('true')
    expect(neutral.getAttribute('class')).toContain('fill-popover')
    expect(neutral.getAttribute('class')).toContain('stroke-border')
    wrapper!.unmount()
    document.body.innerHTML = ''
    make({ showArrow: true, variant: 'inverted' })
    await nextTick()
    expect(q('[data-slot="popover-arrow"]')!.getAttribute('class')).toContain('fill-foreground')
  })

  it('showArrow=false renders no arrow', async () => {
    make({ showArrow: false, variant: 'inverted' })
    await nextTick()
    expect(q('[data-slot="popover-arrow"]')).toBeNull()
  })

  it('the arrow does not remove the dialog role or the content', async () => {
    make({ showArrow: true })
    await nextTick()
    expect(content().getAttribute('role')).toBe('dialog')
    expect(q('#body')!.textContent).toBe('Body')
  })

  it.each(popoverSizes)('variant and size %s combine without losing either', async (size) => {
    make({ variant: 'inverted', size, showArrow: true })
    await nextTick()
    const c = content()
    expect(c.classList.contains('bg-foreground')).toBe(true)
    expect(c.className).toContain(size === 'auto' ? 'w-auto' : `w-${{ xs: '48', sm: '60', md: '72', lg: '96', xl: 'lg' }[size]}`)
  })

  it('class prop wins over variant classes', async () => {
    make({ variant: 'inverted', class: 'bg-primary text-primary-foreground' })
    await nextTick()
    const c = content()
    expect(c.classList.contains('bg-primary')).toBe(true)
    expect(c.classList.contains('bg-foreground')).toBe(false)
  })

  it('does not leak variant or showArrow as DOM attributes', async () => {
    make({ variant: 'inverted', showArrow: true })
    await nextTick()
    expect(content().hasAttribute('variant')).toBe(false)
    expect(content().hasAttribute('showarrow')).toBe(false)
    expect(content().hasAttribute('show-arrow')).toBe(false)
  })

  it('the exported helpers match the component (cn merges the surface colours)', () => {
    expect(cn(popoverContentVariants({ variant: 'inverted' }))).toContain('bg-foreground')
    expect(cn(popoverContentVariants({ variant: 'inverted' }))).not.toContain('bg-popover')
    expect(popoverArrowVariants({ variant: 'inverted' })).toBe('fill-foreground')
    expect(popoverArrowVariants()).toContain('fill-popover')
    expect(() => popoverContentVariants({ variant: 'x' as never })).not.toThrow()
  })
})
