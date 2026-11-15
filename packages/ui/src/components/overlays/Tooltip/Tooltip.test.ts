import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SimpleTooltip, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, tooltipArrowVariants, tooltipSizes, tooltipVariantNames, tooltipVariants } from './index'

let wrapper: VueWrapper | undefined
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

function make(opts: { open?: boolean; providerProps?: Record<string, unknown>; rootProps?: Record<string, unknown>; contentProps?: Record<string, unknown> } = {}) {
  const open = ref<boolean | undefined>(opts.open)
  const Comp = defineComponent({
    setup: () => () =>
      h(TooltipProvider, opts.providerProps ?? {}, () =>
        h(Tooltip, { ...(opts.open !== undefined ? { open: open.value } : {}), 'onUpdate:open': (v: boolean) => (open.value = v), ...(opts.rootProps ?? {}) }, () => [
          h(TooltipTrigger, null, () => 'Hover me'),
          h(TooltipContent, opts.contentProps ?? {}, () => 'Helpful text'),
        ]),
      ),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const trigger = () => q('[data-slot="tooltip-trigger"]')!
const hover = (el: HTMLElement) => el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))

describe('Tooltip', () => {
  it('renders no content until triggered', () => {
    make()
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
    expect(trigger().textContent).toBe('Hover me')
  })

  it('opens after the provider delay on pointer hover', async () => {
    make({ providerProps: { delayDuration: 300 } })
    hover(trigger())
    await vi.advanceTimersByTimeAsync(299)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(2)
    expect(q('[data-slot="tooltip-content"]')?.textContent).toContain('Helpful text')
  })

  it('default delay is 400ms', async () => {
    make()
    hover(trigger())
    await vi.advanceTimersByTimeAsync(390)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(20)
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
  })

  it('root delayDuration overrides the provider', async () => {
    make({ rootProps: { delayDuration: 0 } })
    hover(trigger())
    await vi.advanceTimersByTimeAsync(1)
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
  })

  it('opens immediately on keyboard focus and exposes role=tooltip', async () => {
    make()
    trigger().dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
    expect(q('[role="tooltip"]')?.textContent).toBe('Helpful text')
  })

  it('describes the trigger with the tooltip content', async () => {
    make({ open: true })
    await nextTick()
    expect(trigger().getAttribute('aria-describedby')).toBeTruthy()
  })

  it('closes on Escape', async () => {
    const { open } = make({ open: true })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes on blur and on trigger press', async () => {
    make()
    trigger().dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
    trigger().dispatchEvent(new FocusEvent('blur'))
    await vi.advanceTimersByTimeAsync(5)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()

    trigger().dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
    trigger().click()
    await vi.advanceTimersByTimeAsync(5)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
  })

  it('does not open when disabled', async () => {
    make({ rootProps: { disabled: true, delayDuration: 0 } })
    hover(trigger())
    trigger().dispatchEvent(new FocusEvent('focus'))
    await vi.advanceTimersByTimeAsync(10)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
  })

  it('supports controlled open', async () => {
    const { open } = make({ open: false })
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
    open.value = true
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
  })

  describe('customisation', () => {
    it('merges class on content and keeps tokens', async () => {
      make({ open: true, contentProps: { class: 'bg-primary max-w-sm' } })
      await nextTick()
      const cls = q('[data-slot="tooltip-content"]')!.className
      expect(cls).toContain('bg-primary')
      expect(cls).not.toContain('bg-foreground')
      expect(cls).toContain('max-w-sm')
      expect(cls).not.toContain('max-w-xs')
    })

    it('renders an arrow by default and can hide it', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[data-slot="tooltip-arrow"]')).not.toBeNull()
      wrapper!.unmount()
      document.body.innerHTML = ''
      make({ open: true, contentProps: { showArrow: false } })
      await nextTick()
      expect(q('[data-slot="tooltip-arrow"]')).toBeNull()
    })

    it('honours side and falls through attributes', async () => {
      make({ open: true, contentProps: { side: 'right', 'data-testid': 'tip' } })
      await nextTick()
      const c = q('[data-slot="tooltip-content"]')!
      expect(c.getAttribute('data-side')).toBe('right')
      expect(c.getAttribute('data-testid')).toBe('tip')
    })
  })

  it('removes content when unmounted while open', async () => {
    make({ open: true })
    await nextTick()
    wrapper!.unmount()
    wrapper = undefined
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
  })
})

describe('SimpleTooltip', () => {
  function simple(props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) {
    wrapper = mount(SimpleTooltip, {
      props,
      slots: { default: () => h('button', { id: 'target' }, 'Target'), ...slots } as never,
      attachTo: document.body,
    })
  }

  it('wraps the default slot as the trigger without extra wrapper element', () => {
    simple({ content: 'Save' })
    const btn = q('#target')!
    expect(btn.getAttribute('data-slot')).toBe('tooltip-trigger')
    expect(btn.tagName).toBe('BUTTON')
  })

  it('shows the content prop on focus', async () => {
    simple({ content: 'Save file' })
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')?.textContent).toContain('Save file')
  })

  it('opens on hover after delayDuration', async () => {
    simple({ content: 'Delayed', delayDuration: 100 })
    hover(q('#target')!)
    await vi.advanceTimersByTimeAsync(50)
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(60)
    expect(q('[data-slot="tooltip-content"]')).not.toBeNull()
  })

  it('applies side, align and class to the bubble', async () => {
    simple({ content: 'x', side: 'bottom', align: 'start', class: 'bg-primary' })
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    const c = q('[data-slot="tooltip-content"]')!
    expect(c.getAttribute('data-side')).toBe('bottom')
    expect(c.getAttribute('data-align')).toBe('start')
    expect(c.className).toContain('bg-primary')
  })

  it('renders rich content from the content slot', async () => {
    simple({}, { content: () => h('strong', { id: 'rich' }, 'Rich') })
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"] #rich')?.textContent).toBe('Rich')
  })

  it('never opens when disabled', async () => {
    simple({ content: 'Nope', disabled: true })
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
  })

  it('never opens with empty content (nothing to show)', async () => {
    simple({})
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')).toBeNull()
  })

  it('handles long unicode content', async () => {
    simple({ content: '😀 '.repeat(50) + 'مرحبا' })
    q('#target')!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(q('[data-slot="tooltip-content"]')?.textContent).toContain('مرحبا')
  })
})

describe('Tooltip variations', () => {
  const cls = () => q('[data-slot="tooltip-content"]')!.className
  const arrow = () => q('[data-slot="tooltip-arrow"]')!

  describe('variants', () => {
    it('defaults to the dark (inverted) bubble, unchanged output', async () => {
      make({ open: true })
      await nextTick()
      for (const c of ['bg-foreground', 'text-background', 'px-3', 'py-1.5', 'text-xs', 'max-w-xs', 'rounded-md', 'w-fit']) expect(cls()).toContain(c)
      expect(arrow().getAttribute('class')).toContain('fill-foreground')
    })

    it('variant=dark equals the default', async () => {
      make({ open: true, contentProps: { variant: 'dark' } })
      await nextTick()
      expect(cls()).toContain('bg-foreground')
    })

    it('variant=light uses the popover surface with border and shadow', async () => {
      make({ open: true, contentProps: { variant: 'light' } })
      await nextTick()
      expect(cls()).toContain('bg-popover')
      expect(cls()).toContain('text-popover-foreground')
      expect(cls()).toContain('border')
      expect(cls()).toContain('shadow-md')
      expect(cls()).not.toContain('bg-foreground')
      expect(cls()).not.toContain('text-background')
    })

    it('light variant recolours the arrow', async () => {
      make({ open: true, contentProps: { variant: 'light' } })
      await nextTick()
      const c = arrow().getAttribute('class')!
      expect(c).toContain('fill-popover')
      expect(c).toContain('stroke-border')
      expect(c).not.toContain('fill-foreground')
    })

    it('unknown variant falls back to dark', async () => {
      make({ open: true, contentProps: { variant: 'neon' } })
      await nextTick()
      expect(cls()).toContain('bg-foreground')
      expect(arrow().getAttribute('class')).toContain('fill-foreground')
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', 'px-2', 'text-2xs', 'max-w-2xs'],
      ['md', 'px-3', 'text-xs', 'max-w-xs'],
      ['lg', 'px-4', 'text-sm', 'max-w-sm'],
    ])('size=%s sets padding, text size and max width', async (size, px, text, max) => {
      make({ open: true, contentProps: { size } })
      await nextTick()
      const parts = cls().split(' ')
      expect(parts).toContain(px)
      expect(parts).toContain(text)
      expect(parts).toContain(max)
    })

    it('unknown size falls back to md', async () => {
      make({ open: true, contentProps: { size: 'gigantic' } })
      await nextTick()
      expect(cls().split(' ')).toContain('px-3')
    })

    it('size and variant combine', async () => {
      make({ open: true, contentProps: { variant: 'light', size: 'lg' } })
      await nextTick()
      expect(cls()).toContain('bg-popover')
      expect(cls().split(' ')).toContain('text-sm')
    })

    it('prototype keys are not valid variant or size', async () => {
      make({ open: true, contentProps: { variant: 'toString', size: 'constructor' } })
      await nextTick()
      expect(cls()).toContain('bg-foreground')
      expect(cls().split(' ')).toContain('px-3')
    })
  })

  describe('customisation', () => {
    it('class override wins over variant and size classes', async () => {
      make({ open: true, contentProps: { variant: 'light', size: 'lg', class: 'bg-primary px-1' } })
      await nextTick()
      expect(cls()).toContain('bg-primary')
      expect(cls()).not.toContain('bg-popover')
      expect(cls().split(' ')).toContain('px-1')
      expect(cls().split(' ')).not.toContain('px-4')
    })

    it('does not leak variant/size as DOM attributes', async () => {
      make({ open: true, contentProps: { variant: 'light', size: 'sm' } })
      await nextTick()
      const c = q('[data-slot="tooltip-content"]')!
      expect(c.hasAttribute('variant')).toBe(false)
      expect(c.hasAttribute('size')).toBe(false)
    })

    it('hiding the arrow works with the light variant', async () => {
      make({ open: true, contentProps: { variant: 'light', showArrow: false } })
      await nextTick()
      expect(q('[data-slot="tooltip-arrow"]')).toBeNull()
    })
  })

  describe('tooltipVariants / tooltipArrowVariants', () => {
    it('work standalone', () => {
      expect(tooltipVariants()).toContain('bg-foreground')
      expect(tooltipVariants({ variant: 'light', size: 'sm' })).toContain('text-2xs')
      expect(tooltipVariants({ class: 'extra' })).toMatch(/extra$/)
      expect(tooltipArrowVariants()).toBe('fill-foreground')
      expect(tooltipArrowVariants({ variant: 'light' })).toContain('fill-popover')
      expect(() => tooltipVariants({ variant: 'x' as never, size: 'y' as never })).not.toThrow()
    })

    it('export allowed values', () => {
      expect(tooltipVariantNames).toEqual(['dark', 'light'])
      expect(tooltipSizes).toEqual(['sm', 'md', 'lg'])
    })
  })

  describe('SimpleTooltip', () => {
    function simple(props: Record<string, unknown>) {
      wrapper = mount(SimpleTooltip, { props, slots: { default: () => h('button', { id: 'target' }, 'Target') } as never, attachTo: document.body })
      q('#target')!.dispatchEvent(new FocusEvent('focus'))
    }

    it('passes variant and size to the bubble', async () => {
      simple({ content: 'Hi', variant: 'light', size: 'lg' })
      await nextTick()
      expect(cls()).toContain('bg-popover')
      expect(cls().split(' ')).toContain('text-sm')
    })

    it('uses the dark md bubble when nothing is given', async () => {
      simple({ content: 'Hi' })
      await nextTick()
      expect(cls()).toContain('bg-foreground')
      expect(cls().split(' ')).toContain('px-3')
    })

    it('unknown variant falls back to dark', async () => {
      simple({ content: 'Hi', variant: 'zzz' })
      await nextTick()
      expect(cls()).toContain('bg-foreground')
    })
  })

describe('Tooltip forced colors', () => {
  it('the dark bubble gets a border so it stays visible in forced-colors mode', () => {
    expect(tooltipVariants({ variant: 'dark' })).toContain('forced-colors:border')
  })
})
})
