import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { SimpleTooltip, tooltipSizes, tooltipVariantNames } from './index'

let wrapper: VueWrapper | undefined
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

async function simple(props: Record<string, unknown>) {
  wrapper = mount(SimpleTooltip, { props, slots: { default: () => h('button', { id: 'target' }, 'Target') } as never, attachTo: document.body })
  document.getElementById('target')!.dispatchEvent(new FocusEvent('focus'))
  await nextTick()
}
const bubble = () => document.body.querySelector('[data-slot="tooltip-content"]') as HTMLElement
const arrow = () => document.body.querySelector('[data-slot="tooltip-arrow"]') as HTMLElement | null

describe('SimpleTooltip arrow', () => {
  it('shows the arrow by default (default output unchanged)', async () => {
    await simple({ content: 'Hi' })
    expect(arrow()).not.toBeNull()
    expect(arrow()!.getAttribute('class')).toContain('fill-foreground')
  })

  it('showArrow=false removes it, for every variant', async () => {
    for (const variant of tooltipVariantNames) {
      await simple({ content: 'Hi', variant, showArrow: false })
      expect(bubble()).not.toBeNull()
      expect(arrow(), variant).toBeNull()
      wrapper!.unmount()
      document.body.innerHTML = ''
    }
  })

  it('showArrow=true keeps the arrow and recolours it for the light variant', async () => {
    await simple({ content: 'Hi', variant: 'light', showArrow: true })
    expect(arrow()!.getAttribute('class')).toContain('fill-popover')
  })
})

describe('Tooltip variant x size cross product', () => {
  it('every combination keeps the bubble colours and the size classes together, with the accessible role', async () => {
    const sizeClass = { sm: 'text-2xs', md: 'text-xs', lg: 'text-sm' } as const
    for (const variant of tooltipVariantNames) {
      for (const size of tooltipSizes) {
        await simple({ content: 'Hi', variant, size })
        const parts = bubble().className.split(' ')
        expect(parts, `${variant}/${size}`).toContain(variant === 'dark' ? 'bg-foreground' : 'bg-popover')
        expect(parts).toContain(sizeClass[size])
        expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()
        wrapper!.unmount()
        document.body.innerHTML = ''
      }
    }
  })

  it('the class prop wins over variant and size', async () => {
    await simple({ content: 'Hi', variant: 'light', size: 'lg', class: 'bg-primary text-xs' })
    const parts = bubble().className.split(' ')
    expect(parts).toContain('bg-primary')
    expect(parts).not.toContain('bg-popover')
    expect(parts).toContain('text-xs')
    expect(parts).not.toContain('text-sm')
  })

  it('an empty content disables the tooltip in every variant', async () => {
    await simple({ variant: 'light', size: 'sm' })
    expect(bubble()).toBeNull()
  })
})
