import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { cn } from '../../../lib/cn'
import { COLLAPSIBLE_SIZES, COLLAPSIBLE_VARIANTS, Collapsible, CollapsibleContent, CollapsibleTrigger, collapsibleContentVariants, collapsibleVariants } from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(props: Record<string, unknown> = {}) {
  const Comp = defineComponent({
    setup: () => () =>
      h(Collapsible, { defaultOpen: true, ...props }, () => [h(CollapsibleTrigger, null, () => 'Toggle'), h(CollapsibleContent, null, () => 'Hidden text')]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return wrapper
}
const root = () => document.body.querySelector<HTMLElement>('[data-slot="collapsible"]')!
const content = () => document.body.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!
const reset = () => {
  wrapper?.unmount()
  document.body.innerHTML = ''
}

describe('Collapsible variations', () => {
  it('plain md is the default and adds no root classes', () => {
    make()
    expect(root().dataset.variant).toBe('plain')
    expect(root().dataset.size).toBe('md')
    expect(root().className).toBe('')
    expect(collapsibleVariants()).toBe('')
    expect(content().className).toBe(collapsibleContentVariants())
    expect(content().className).toContain('overflow-hidden')
    expect(content().className).toContain('motion-reduce:animate-none')
  })

  it('bordered draws a rounded frame with padding', () => {
    make({ variant: 'bordered' })
    expect(root().className).toBe('rounded-lg border p-4')
  })

  it('filled uses the muted surface and no border', () => {
    make({ variant: 'filled' })
    expect(root().className).toContain('rounded-lg')
    expect(root().className).toContain('bg-muted/50')
    expect(root().className).not.toMatch(/(^|\s)border(\s|$)/)
    expect(root().className).toContain('p-4')
  })

  it.each([
    ['sm', 'p-3', 'text-xs'],
    ['md', 'p-4', undefined],
    ['lg', 'p-5', 'text-base'],
  ])('size %s: padding %s on framed variants and text %s on the content', (size, pad, text) => {
    make({ variant: 'bordered', size })
    expect(root().dataset.size).toBe(size)
    expect(root().className).toContain(pad)
    if (text) expect(content().className).toContain(text)
    else expect(content().className).not.toMatch(/text-(xs|base)/)
  })

  it('size changes the text of a plain collapsible without adding padding', () => {
    make({ size: 'lg' })
    expect(root().className).toBe('')
    expect(content().className).toContain('text-base')
  })

  it('unknown variant and size fall back to the defaults', () => {
    make({ variant: 'card', size: 'huge' })
    expect(root().dataset.variant).toBe('plain')
    expect(root().dataset.size).toBe('md')
    expect(root().className).toBe('')
  })

  it('every variant and size renders different classes', () => {
    const seen = new Set<string>()
    for (const variant of COLLAPSIBLE_VARIANTS) {
      make({ variant })
      seen.add(root().className)
      reset()
    }
    expect(seen.size).toBe(3)
    const sizes = new Set<string>()
    for (const size of COLLAPSIBLE_SIZES) {
      make({ size, variant: 'filled' })
      sizes.add(`${root().className}|${content().className}`)
      reset()
    }
    expect(sizes.size).toBe(3)
  })

  it('class wins over the variant', () => {
    make({ variant: 'bordered', class: 'p-8 rounded-none' })
    expect(root().className).toContain('p-8')
    expect(root().className).not.toContain('p-4')
    expect(root().className).toContain('rounded-none')
  })

  it('keeps aria wiring and toggling in every variant', async () => {
    for (const variant of COLLAPSIBLE_VARIANTS) {
      make({ variant, defaultOpen: false })
      const trigger = document.body.querySelector<HTMLButtonElement>('[data-slot="collapsible-trigger"]')!
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      trigger.click()
      await new Promise((r) => setTimeout(r, 0))
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(content().id)
      reset()
    }
  })

  it('content used without a root, and exported variants, keep working', () => {
    expect(cn(collapsibleVariants({ variant: 'bordered', size: 'lg' }))).toBe('rounded-lg border p-5')
    expect(collapsibleContentVariants({ size: 'sm' })).toContain('text-xs')
  })

  it('handles empty content', () => {
    const Comp = defineComponent({
      setup: () => () => h(Collapsible, { variant: 'filled', unmountOnHide: true }, () => [h(CollapsibleTrigger, null, () => 'Toggle'), h(CollapsibleContent, null, () => '')]),
    })
    wrapper = mount(Comp, { attachTo: document.body })
    expect(root().dataset.variant).toBe('filled')
    expect(content().textContent).toBe('')
  })
})
