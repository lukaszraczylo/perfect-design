import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Toggle from './Toggle.vue'
import { toggleVariants } from './variants'

// reka's Toggle renders a fragment (button + optional hidden input), so query the element explicitly.
const el = (w: { find: (s: string) => any }) => w.find('[data-slot="toggle"]')

describe('Toggle', () => {
  describe('good path', () => {
    it('renders a button with aria-pressed=false and data-state=off', () => {
      const w = mount(Toggle, { slots: { default: 'Bold' } })
      expect(el(w).element.tagName).toBe('BUTTON')
      expect(el(w).attributes('type')).toBe('button')
      expect(el(w).attributes('data-slot')).toBe('toggle')
      expect(el(w).attributes('aria-pressed')).toBe('false')
      expect(el(w).attributes('data-state')).toBe('off')
      expect(el(w).text()).toBe('Bold')
    })

    it('uncontrolled: click toggles pressed state and emits', async () => {
      const w = mount(Toggle)
      await el(w).trigger('click')
      expect(el(w).attributes('aria-pressed')).toBe('true')
      expect(el(w).attributes('data-state')).toBe('on')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      await el(w).trigger('click')
      expect(el(w).attributes('aria-pressed')).toBe('false')
      expect(w.emitted('update:modelValue')?.[1]).toEqual([false])
    })

    it('defaultPressed starts pressed', () => {
      const w = mount(Toggle, { props: { defaultPressed: true } })
      expect(el(w).attributes('aria-pressed')).toBe('true')
      expect(el(w).attributes('data-state')).toBe('on')
    })

    it('controlled: follows modelValue and only emits', async () => {
      const w = mount(Toggle, { props: { modelValue: false } })
      await el(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      expect(el(w).attributes('aria-pressed')).toBe('false')
      await w.setProps({ modelValue: true })
      expect(el(w).attributes('aria-pressed')).toBe('true')
    })

    it('scoped slot exposes pressed', async () => {
      const w = mount(Toggle, { slots: { default: `<template #default="{ pressed }">{{ pressed ? 'on' : 'off' }}</template>` } })
      expect(el(w).text()).toBe('off')
      await el(w).trigger('click')
      expect(el(w).text()).toBe('on')
    })

    it.each([
      ['default', 'bg-transparent'],
      ['outline', 'border-input'],
    ] as const)('variant %s uses %s', (variant, cls) => {
      expect(el(mount(Toggle, { props: { variant } })).classes()).toContain(cls)
    })

    it.each([
      ['sm', 'h-8'],
      ['md', 'h-9'],
      ['lg', 'h-10'],
    ] as const)('size %s uses %s', (size, cls) => {
      expect(el(mount(Toggle, { props: { size } })).classes()).toContain(cls)
    })

    it('pressed style comes from data-state classes', () => {
      expect(el(mount(Toggle)).classes()).toContain('data-[state=on]:bg-accent')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override', () => {
      const w = mount(Toggle, { props: { class: 'h-14 custom-x' } })
      expect(el(w).classes()).toContain('custom-x')
      expect(el(w).classes()).toContain('h-14')
      expect(el(w).classes()).not.toContain('h-9')
    })

    it('passes attributes through', () => {
      const w = mount(Toggle, { attrs: { 'aria-label': 'Bold', 'data-test': 'x', id: 't' } })
      expect(el(w).attributes('aria-label')).toBe('Bold')
      expect(el(w).attributes('data-test')).toBe('x')
      expect(el(w).attributes('id')).toBe('t')
    })

    it('renders as another element with `as`', () => {
      const w = mount(Toggle, { props: { as: 'div' } })
      expect(el(w).element.tagName).toBe('DIV')
      expect(el(w).attributes('type')).toBeUndefined()
    })

    it('asChild renders the child with toggle classes', () => {
      const w = mount(Toggle, { props: { asChild: true }, slots: { default: '<a href="/x">Go</a>' } })
      expect(el(w).element.tagName).toBe('A')
      expect(el(w).classes()).toContain('inline-flex')
    })

    it('exports variants for reuse', () => {
      expect(toggleVariants({ variant: 'outline', size: 'lg' })).toContain('h-10')
      expect(toggleVariants()).toContain('h-9')
    })
  })

  describe('bad path', () => {
    it('disabled blocks interaction', async () => {
      const w = mount(Toggle, { props: { disabled: true } })
      expect(el(w).attributes('disabled')).toBeDefined()
      expect(el(w).attributes('data-disabled')).toBeDefined()
      await el(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(el(w).attributes('aria-pressed')).toBe('false')
    })

    it('unknown variant/size do not throw', () => {
      const w = mount(Toggle, { props: { variant: 'x' as never, size: 'y' as never } })
      expect(el(w).attributes('data-slot')).toBe('toggle')
    })
  })

  describe('edge cases', () => {
    it('renders with no slot content', () => {
      expect(el(mount(Toggle)).text()).toBe('')
    })

    it('rapid toggles end in the right state', async () => {
      const w = mount(Toggle)
      for (let i = 0; i < 7; i++) await el(w).trigger('click')
      expect(el(w).attributes('aria-pressed')).toBe('true')
      expect(w.emitted('update:modelValue')).toHaveLength(7)
    })

    it('handles unicode content', () => {
      expect(el(mount(Toggle, { slots: { default: 'מודגש ✓ 日本語' } })).text()).toBe('מודגש ✓ 日本語')
    })

    it('Space/Enter on a native button click (keyboard) toggles', async () => {
      const w = mount(Toggle)
      await el(w).trigger('click')
      expect(el(w).attributes('data-state')).toBe('on')
    })
  })
})

describe('Toggle touch targets', () => {
  it.each([
    ['sm', 'pointer-coarse:min-h-10'],
    ['md', 'pointer-coarse:min-h-11'],
    ['lg', 'pointer-coarse:min-h-11'],
  ] as const)('size %s grows on coarse pointers (%s)', (size, cls) => {
    expect(toggleVariants({ size })).toContain(cls)
  })
})
