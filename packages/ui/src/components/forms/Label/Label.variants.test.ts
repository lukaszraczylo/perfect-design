import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Label from './Label.vue'
import { labelVariants } from './variants'
import * as barrel from './index'

describe('Label variations', () => {
  it('default class string is unchanged', () => {
    expect(labelVariants()).toBe('inline-flex items-baseline gap-1 text-sm leading-snug font-medium select-none')
    expect(mount(Label).attributes('class')).toBe('inline-flex items-baseline gap-1 text-sm leading-snug font-medium select-none')
    expect(typeof barrel.labelVariants).toBe('function')
  })
  it.each([
    ['sm', 'text-xs'],
    ['lg', 'text-base'],
  ])('size %s uses %s and drops text-sm', (size, cls) => {
    const c = mount(Label, { props: { size: size as never } }).classes()
    expect(c).toContain(cls)
    expect(c).not.toContain('text-sm')
    expect(c).toEqual(expect.arrayContaining(['font-medium', 'leading-snug', 'select-none']))
  })
  it('variant muted uses the muted text colour', () => {
    const c = mount(Label, { props: { variant: 'muted' } }).classes()
    expect(c).toContain('text-muted-foreground')
  })
  it('unknown size and variant fall back', () => {
    const w = mount(Label, { props: { size: 'huge' as never, variant: 'neon' as never } })
    expect(w.classes()).toContain('text-sm')
    expect(w.classes()).not.toContain('text-muted-foreground')
  })
  it('class wins; disabled and required combine with size and variant', () => {
    const w = mount(Label, { props: { size: 'lg', variant: 'muted', disabled: true, required: true, class: 'text-foreground text-lg' }, slots: { default: 'Name' } })
    expect(w.classes()).toEqual(expect.arrayContaining(['text-foreground', 'text-lg', 'opacity-50']))
    expect(w.classes()).not.toContain('text-base')
    expect(w.classes()).not.toContain('text-muted-foreground')
    expect(w.find('[data-slot="label-required"]').attributes('aria-hidden')).toBe('true')
  })
})
