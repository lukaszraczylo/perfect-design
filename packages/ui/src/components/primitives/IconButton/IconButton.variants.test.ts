import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import IconButton from './IconButton.vue'
import { iconButtonVariants } from './variants'
import { buttonVariants } from '../Button/variants'

const make = (props: Record<string, unknown> = {}, slots?: Record<string, string>) => mount(IconButton, { props: { label: 'Add item', icon: faPlus, ...props }, slots })
const set = (s: string | string[]) => [...new Set((Array.isArray(s) ? s : s.split(/\s+/)).filter(Boolean))].sort()

describe('IconButton size xl', () => {
  it('is 48px square, wins over the lg size and enlarges the icon', () => {
    const w = make({ size: 'xl' })
    expect(w.classes()).toContain('size-12')
    expect(w.classes()).not.toContain('size-11')
    expect(w.classes()).toContain('[&_svg:not([class*="size-"])]:size-5')
    expect(w.classes()).not.toContain('[&_svg:not([class*="size-"])]:size-4')
    expect(w.attributes('aria-label')).toBe('Add item')
  })

  it('has no coarse-pointer shrink (it is already above 44px)', () => {
    expect(make({ size: 'xl' }).classes().some((c) => c.startsWith('pointer-coarse:size-'))).toBe(false)
  })

  it.each([
    ['xs', 'size-6'],
    ['sm', 'size-8'],
    ['md', 'size-9'],
    ['lg', 'size-11'],
    ['xl', 'size-12'],
  ] as const)('size %s is one square dimension (%s)', (size, cls) => {
    const sizeClasses = make({ size }).classes().filter((c) => /^size-\d/.test(c))
    expect(sizeClasses).toEqual([cls])
  })

  it('md keeps the 44px coarse target and xs is the 24px minimum', () => {
    expect(make({ size: 'md' }).classes()).toContain('pointer-coarse:size-11')
    expect(make({ size: 'xs' }).classes()).toContain('size-6')
  })
})

describe('IconButton shape', () => {
  it('rounded is the default and keeps the original rounded-md output', () => {
    const w = make()
    expect(w.classes()).toContain('rounded-md')
    expect(set(w.classes())).toEqual(set(make({ shape: 'rounded' }).classes()))
  })

  it('circle makes a fully round button and drops rounded-md', () => {
    const w = make({ shape: 'circle' })
    expect(w.classes()).toContain('rounded-full')
    expect(w.classes()).not.toContain('rounded-md')
  })

  it('square removes the rounding', () => {
    const w = make({ shape: 'square' })
    expect(w.classes()).toContain('rounded-none')
    expect(w.classes()).not.toContain('rounded-md')
  })

  it('unknown shape falls back to rounded', () => {
    const w = make({ shape: 'hex' as never })
    expect(w.classes()).toContain('rounded-md')
    expect(iconButtonVariants({ shape: 'hex' as never })).toBe(iconButtonVariants())
  })

  it('class wins over the shape', () => {
    const w = make({ shape: 'circle', class: 'rounded-lg' })
    expect(w.classes()).toContain('rounded-lg')
    expect(w.classes()).not.toContain('rounded-full')
  })
})

describe('IconButton variant and soft', () => {
  it('soft is a documented variant with a tinted fill', () => {
    const w = make({ variant: 'soft' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-primary/10', 'text-primary']))
  })
})

describe('IconButton cross-products', () => {
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
  const shapes = ['rounded', 'circle', 'square'] as const
  const variants = ['default', 'outline', 'ghost', 'soft', 'destructive'] as const

  it.each(sizes.flatMap((s) => shapes.flatMap((sh) => variants.map((v) => [s, sh, v] as const))))('size %s, shape %s, variant %s: one size, one radius, name and focus ring kept', (size, shape, variant) => {
    const w = make({ size, shape, variant })
    const c = w.classes()
    expect(c.filter((x) => /^size-\d/.test(x))).toHaveLength(1)
    expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(1)
    expect(c).toContain('focus-visible:ring-3')
    expect(w.attributes('aria-label')).toBe('Add item')
    expect(w.attributes('title')).toBe('Add item')
    expect(w.attributes('type')).toBe('button')
  })

  it('loading and disabled keep the look and the label', async () => {
    const w = make({ size: 'xl', shape: 'circle', loading: true })
    expect(w.classes()).toEqual(expect.arrayContaining(['size-12', 'rounded-full']))
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.attributes('aria-label')).toBe('Add item')
    const d = make({ size: 'lg', shape: 'square', disabled: true })
    expect(d.attributes('disabled')).toBeDefined()
  })

  it('works as a link with a custom slot and still has a name', () => {
    const w = mount(IconButton, { props: { label: 'Open', as: 'a', size: 'xl', shape: 'circle' }, attrs: { href: '/x' }, slots: { default: '<i data-custom />' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('aria-label')).toBe('Open')
    expect(w.classes()).toEqual(expect.arrayContaining(['size-12', 'rounded-full']))
  })

  it('reacts to size and shape changes', async () => {
    const w = make()
    await w.setProps({ size: 'xl', shape: 'circle' })
    expect(w.classes()).toEqual(expect.arrayContaining(['size-12', 'rounded-full']))
    await w.setProps({ size: 'xs', shape: 'square' })
    expect(w.classes()).toEqual(expect.arrayContaining(['size-6', 'rounded-none']))
    expect(w.classes()).not.toContain('size-12')
  })
})

describe('iconButtonVariants', () => {
  it('defaults match the component default (ghost, square md, rounded)', () => {
    expect(set(iconButtonVariants())).toEqual(set(buttonVariants({ variant: 'ghost', size: 'icon', rounded: 'default' })))
    expect(set(iconButtonVariants())).toEqual(set(make().classes()))
  })

  it('maps every size and shape like the component', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const)
      for (const shape of ['rounded', 'circle', 'square'] as const) expect(set(iconButtonVariants({ size, shape, variant: 'outline' }))).toEqual(set(make({ size, shape, variant: 'outline' }).classes()))
  })

  it('accepts null, unknown values and a class that wins', () => {
    expect(iconButtonVariants({ variant: null, size: null, shape: null })).toBe(iconButtonVariants())
    expect(iconButtonVariants({ size: 'huge' as never })).toBe(iconButtonVariants())
    expect(iconButtonVariants({ size: 'xl', class: 'size-14' })).toContain('size-14')
    expect(iconButtonVariants({ size: 'xl', class: 'size-14' })).not.toContain('size-12')
  })
})
