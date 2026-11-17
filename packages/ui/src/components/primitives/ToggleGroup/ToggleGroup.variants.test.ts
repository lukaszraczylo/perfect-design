import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ToggleGroup from './ToggleGroup.vue'
import ToggleGroupItem from './ToggleGroupItem.vue'
import { cn } from '../../../lib/cn'
import { toggleVariants } from '../Toggle/variants'
import { TOGGLE_GROUP_GAPS, TOGGLE_GROUP_SHAPES, TOGGLE_GROUP_TONES, toggleGroupItemVariants, toggleGroupVariants } from './variants'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function build(groupProps: Record<string, unknown> = {}, itemProps: Record<string, Record<string, unknown>> = {}) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(ToggleGroup, { 'aria-label': 'Sample group', defaultValue: 'a', ...groupProps }, {
          default: () => [
            h(ToggleGroupItem, { value: 'a', ...itemProps.a }, () => 'A'),
            h(ToggleGroupItem, { value: 'b', ...itemProps.b }, () => 'B'),
            h(ToggleGroupItem, { value: 'c', ...itemProps.c }, () => 'C'),
          ],
        }),
    }),
    { attachTo: document.body },
  )
  return wrapper
}
const root = (w: VueWrapper) => w.find('[data-slot="toggle-group"]')
const items = (w: VueWrapper) => w.findAll('[data-slot="toggle-group-item"]')

describe('ToggleGroup shape', () => {
  it('rounded is the default and keeps the original joined corners and radius', () => {
    const explicit = build({ shape: 'rounded' })
    const a = items(explicit)[0]!.classes().sort()
    const r = root(explicit).classes().sort()
    wrapper!.unmount()
    const implicit = build()
    expect(items(implicit)[0]!.classes().sort()).toEqual(a)
    expect(root(implicit).classes().sort()).toEqual(r)
    expect(r).toContain('rounded-md')
    expect(a).toEqual(expect.arrayContaining(['first:rounded-s-md', 'last:rounded-e-md', 'rounded-none']))
  })

  it('pill rounds the outer ends of joined items fully (logical corners) and the group', () => {
    const w = build({ shape: 'pill', variant: 'outline' })
    expect(items(w)[0]!.classes()).toContain('first:rounded-s-full')
    expect(items(w)[2]!.classes()).toContain('last:rounded-e-full')
    expect(items(w)[0]!.classes()).not.toContain('first:rounded-s-md')
    expect(items(w)[1]!.classes()).toContain('rounded-none')
    expect(root(w).classes()).toContain('rounded-full')
    expect(root(w).classes()).not.toContain('rounded-md')
    expect(items(w)[0]!.classes().join(' ')).not.toMatch(/rounded-[lr]-/)
  })

  it('pill vertical rounds the top of the first and the bottom of the last item', () => {
    const w = build({ shape: 'pill', orientation: 'vertical' })
    expect(items(w)[0]!.classes()).toContain('first:rounded-t-full')
    expect(items(w)[2]!.classes()).toContain('last:rounded-b-full')
  })

  it('square removes every corner radius', () => {
    const w = build({ shape: 'square', variant: 'outline' })
    expect(root(w).classes()).toContain('rounded-none')
    for (const i of items(w)) {
      expect(i.classes()).toContain('rounded-none')
      expect(i.classes().join(' ')).not.toMatch(/first:rounded|last:rounded/)
    }
  })

  it('segmented: pill makes round segments on a round track, square makes square ones', () => {
    const pill = build({ shape: 'pill', variant: 'segmented' })
    expect(root(pill).classes()).toContain('rounded-full')
    expect(root(pill).classes()).not.toContain('rounded-lg')
    for (const i of items(pill)) expect(i.classes()).toContain('rounded-full')
    wrapper!.unmount()
    const square = build({ shape: 'square', variant: 'segmented' })
    expect(root(square).classes()).toContain('rounded-none')
    for (const i of items(square)) expect(i.classes()).toContain('rounded-none')
    wrapper!.unmount()
    const rounded = build({ variant: 'segmented' })
    expect(root(rounded).classes()).toContain('rounded-lg')
    expect(items(rounded)[0]!.classes()).toContain('rounded-md')
  })

  it('an item can override the group shape', () => {
    const w = build({ variant: 'segmented' }, { b: { shape: 'pill' } })
    expect(items(w)[1]!.classes()).toContain('rounded-full')
    expect(items(w)[0]!.classes()).toContain('rounded-md')
  })

  it('unknown shape falls back to rounded', () => {
    const w = build({ shape: 'hex', variant: 'outline' })
    expect(root(w).classes()).toContain('rounded-md')
    expect(items(w)[0]!.classes()).toContain('first:rounded-s-md')
    expect(toggleGroupItemVariants({ shape: 'hex' as never })).toBe(toggleGroupItemVariants())
  })

  it('class wins over the shape', () => {
    const w = build({ shape: 'pill', class: 'rounded-lg' }, { a: { class: 'first:rounded-s-sm' } })
    expect(root(w).classes()).toContain('rounded-lg')
    expect(root(w).classes()).not.toContain('rounded-full')
    expect(items(w)[0]!.classes()).toContain('first:rounded-s-sm')
    expect(items(w)[0]!.classes()).not.toContain('first:rounded-s-full')
  })
})

describe('ToggleGroup tone', () => {
  const FILLS = {
    primary: ['data-[state=on]:bg-primary', 'data-[state=on]:text-primary-foreground'],
    success: ['data-[state=on]:bg-success', 'data-[state=on]:text-success-foreground'],
    danger: ['data-[state=on]:bg-destructive', 'data-[state=on]:text-destructive-foreground'],
    info: ['data-[state=on]:bg-info', 'data-[state=on]:text-info-foreground'],
  } as const

  it('neutral is the default and keeps the accent fill', () => {
    const w = build()
    expect(items(w)[0]!.classes()).toEqual(expect.arrayContaining(['data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground']))
    expect(items(w)[0]!.classes().join(' ')).not.toContain('data-[state=on]:bg-primary')
    expect(toggleGroupItemVariants({ tone: 'neutral' })).toBe(toggleGroupItemVariants())
  })

  it.each(Object.entries(FILLS))('%s paints the pressed item with its fill and foreground and keeps the hover state the same', (tone, cls) => {
    for (const variant of ['default', 'outline'] as const) {
      const w = build({ tone, variant })
      const c = items(w)[0]!.classes()
      expect(c).toEqual(expect.arrayContaining([...cls]))
      expect(c).not.toContain('data-[state=on]:bg-accent')
      expect(c).not.toContain('data-[state=on]:text-accent-foreground')
      expect(c).toContain(`data-[state=on]:hover:${cls[0]!.replace('data-[state=on]:', '')}`)
      wrapper!.unmount()
    }
  })

  it('segmented: the tone replaces the raised background fill and its hover', () => {
    const w = build({ tone: 'primary', variant: 'segmented' })
    const c = items(w)[0]!.classes()
    expect(c).toContain('data-[state=on]:bg-primary')
    expect(c).not.toContain('data-[state=on]:bg-background')
    expect(c).not.toContain('data-[state=on]:hover:bg-background')
    expect(c).not.toContain('data-[state=on]:text-foreground')
  })

  it('the pressed state stays exposed as aria-pressed and a forced-colors border, not colour alone', async () => {
    const w = build({ tone: 'success' })
    expect(items(w)[0]!.attributes('aria-pressed')).toBe('true')
    expect(items(w)[1]!.attributes('aria-pressed')).toBe('false')
    await items(w)[1]!.trigger('click')
    expect(items(w)[1]!.attributes('aria-pressed')).toBe('true')
    expect(items(w)[1]!.attributes('data-state')).toBe('on')
    for (const i of items(w)) expect(i.classes()).toContain('forced-colors:data-[state=on]:border-2')
  })

  it('an item can override the group tone', () => {
    const w = build({ tone: 'primary' }, { b: { tone: 'danger' }, c: { tone: 'neutral' } })
    expect(items(w)[0]!.classes()).toContain('data-[state=on]:bg-primary')
    expect(items(w)[1]!.classes()).toContain('data-[state=on]:bg-destructive')
    expect(items(w)[2]!.classes()).toContain('data-[state=on]:bg-accent')
  })

  it('unknown tone falls back to neutral', () => {
    const w = build({ tone: 'purple' })
    expect(items(w)[0]!.classes()).toContain('data-[state=on]:bg-accent')
    expect(toggleGroupItemVariants({ tone: 'purple' as never })).toBe(toggleGroupItemVariants())
  })

  it('class wins over the tone', () => {
    const w = build({ tone: 'primary' }, { a: { class: 'data-[state=on]:bg-pink-500' } })
    expect(items(w)[0]!.classes()).toContain('data-[state=on]:bg-pink-500')
    expect(items(w)[0]!.classes()).not.toContain('data-[state=on]:bg-primary')
  })
})

describe('ToggleGroup gap', () => {
  it('none is the default: items stay joined', () => {
    const w = build({ variant: 'outline' })
    expect(root(w).classes()).not.toEqual(expect.arrayContaining(['gap-1']))
    expect(root(w).classes().some((c) => /^gap-/.test(c))).toBe(false)
    expect(items(w)[1]!.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-s-0']))
  })

  it.each([
    ['sm', 'gap-1'],
    ['md', 'gap-2'],
  ] as const)('%s adds %s and separates the items with their own corners and borders', (gap, cls) => {
    const w = build({ gap, variant: 'outline' })
    expect(root(w).classes()).toContain(cls)
    for (const i of items(w)) {
      expect(i.classes()).toContain('rounded-md')
      expect(i.classes()).toContain('border-input')
      expect(i.classes()).not.toContain('rounded-none')
      expect(i.classes()).not.toContain('border-s-0')
      expect(i.classes().join(' ')).not.toMatch(/first:rounded|last:rounded/)
    }
  })

  it.each(['sm', 'md'] as const)('outline with gap %s carries every class of a standalone outline Toggle, so it matches an outline Button/Toggle and shows its on state', (gap) => {
    const w = build({ gap, variant: 'outline' })
    const toggle = cn(toggleVariants({ variant: 'outline' })).split(/\s+/)
    for (const i of items(w)) {
      const have = i.classes()
      for (const c of toggle) expect(have, c).toContain(c)
      expect(have).toEqual(expect.arrayContaining(['border', 'border-input', 'rounded-md', 'data-[state=on]:bg-accent', 'data-[state=on]:border-foreground']))
    }
  })

  it('combines with shape: pill and square separate items', () => {
    const pill = build({ gap: 'md', shape: 'pill' })
    for (const i of items(pill)) expect(i.classes()).toContain('rounded-full')
    wrapper!.unmount()
    const square = build({ gap: 'sm', shape: 'square' })
    for (const i of items(square)) expect(i.classes()).toContain('rounded-none')
  })

  it('works vertically and with segmented (the track gap grows)', () => {
    const v = build({ gap: 'md', orientation: 'vertical', variant: 'outline' })
    expect(root(v).classes()).toEqual(expect.arrayContaining(['flex-col', 'gap-2']))
    expect(items(v)[1]!.classes()).not.toContain('border-t-0')
    wrapper!.unmount()
    const s = build({ gap: 'md', variant: 'segmented' })
    expect(root(s).classes()).toContain('gap-2')
    expect(root(s).classes()).not.toContain('gap-0.5')
  })

  it('keeps keyboard roving and selection', async () => {
    const w = build({ gap: 'md' })
    await items(w)[2]!.trigger('click')
    expect(items(w)[2]!.attributes('data-state')).toBe('on')
    ;(items(w)[1]!.element as HTMLElement).focus()
    await flushPromises()
    expect(items(w).map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
  })

  it('unknown gap falls back to none', () => {
    const w = build({ gap: 'huge', variant: 'outline' })
    expect(root(w).classes().some((c) => /^gap-/.test(c))).toBe(false)
    expect(items(w)[1]!.classes()).toContain('border-s-0')
  })

  it('class wins over the gap', () => {
    const w = build({ gap: 'md', class: 'gap-6' })
    expect(root(w).classes()).toContain('gap-6')
    expect(root(w).classes()).not.toContain('gap-2')
  })
})

describe('ToggleGroup variation cross-products', () => {
  it.each(TOGGLE_GROUP_SHAPES.flatMap((shape) => TOGGLE_GROUP_TONES.map((tone) => [shape, tone] as const)))('shape %s with tone %s has no conflicting radius or fill', (shape, tone) => {
    const w = build({ shape, tone, variant: 'outline' })
    const c = items(w)[0]!.classes()
    expect(c.filter((x) => /^data-\[state=on\]:bg-/.test(x))).toHaveLength(1)
    expect(c.filter((x) => /^rounded-/.test(x))).toHaveLength(1)
    expect(c.filter((x) => /^first:rounded-/.test(x))).toHaveLength(shape === 'square' ? 0 : 1)
  })

  it.each(TOGGLE_GROUP_GAPS.flatMap((gap) => (['default', 'outline', 'segmented'] as const).map((variant) => [gap, variant] as const)))('gap %s with variant %s renders every item', (gap, variant) => {
    const w = build({ gap, variant })
    expect(items(w)).toHaveLength(3)
    expect(root(w).attributes('role')).toBe('group')
  })

  it('size xl with pill and primary tone keeps the 44px height and 24px minimum', () => {
    const c = items(build({ size: 'xl', shape: 'pill', tone: 'primary', gap: 'sm' }))[0]!.classes()
    expect(c).toEqual(expect.arrayContaining(['h-11', 'min-w-11', 'rounded-full', 'data-[state=on]:bg-primary']))
    wrapper!.unmount()
    const xs = items(build({ size: 'xs' }))[0]!.classes()
    expect(xs).toEqual(expect.arrayContaining(['h-7', 'min-w-7']))
  })

  it('pointer-coarse targets survive every look', () => {
    for (const props of [{ shape: 'pill' }, { tone: 'danger' }, { gap: 'md' }, { variant: 'segmented', tone: 'info', shape: 'square' }]) {
      const c = items(build(props))[0]!.classes()
      expect(c).toContain('pointer-coarse:min-h-11')
      wrapper!.unmount()
    }
  })

  it('every look keeps the focus ring and the group name', () => {
    const w = build({ shape: 'pill', tone: 'success', gap: 'md', variant: 'segmented' })
    expect(items(w)[0]!.classes()).toEqual(expect.arrayContaining(['focus-visible:ring-3', 'focus-visible:ring-ring/40']))
    expect(root(w).attributes('aria-label')).toBe('Sample group')
  })
})

describe('toggleGroupVariants helper with the new dimensions', () => {
  it('defaults add nothing', () => {
    expect(toggleGroupVariants()).toBe('inline-flex w-fit items-center rounded-md')
    expect(toggleGroupVariants({ shape: 'rounded', gap: 'none' })).toBe(toggleGroupVariants())
  })
  it('emits shape and gap classes', () => {
    expect(toggleGroupVariants({ shape: 'pill' })).toContain('rounded-full')
    expect(toggleGroupVariants({ shape: 'square' })).toContain('rounded-none')
    expect(toggleGroupVariants({ gap: 'sm' })).toContain('gap-1')
    expect(toggleGroupVariants({ gap: 'md' })).toContain('gap-2')
  })
  it('item helper accepts null values', () => {
    expect(toggleGroupItemVariants({ shape: null, tone: null, gap: null })).toBe(toggleGroupItemVariants())
    expect(toggleGroupItemVariants({ tone: 'success' })).toContain('data-[state=on]:bg-success')
    expect(toggleGroupItemVariants({ gap: 'sm', variant: 'outline' })).not.toContain('border-s-0')
  })
})

describe('bare reka group (no ToggleGroup context)', () => {
  it('items use the defaults for the new dimensions', async () => {
    const { ToggleGroupRoot } = await import('reka-ui')
    wrapper = mount(
      defineComponent({ setup: () => () => h(ToggleGroupRoot, { type: 'single' }, { default: () => h(ToggleGroupItem, { value: 'a' }, () => 'A') }) }),
      { attachTo: document.body },
    ) as unknown as VueWrapper
    const c = wrapper.find('[data-slot="toggle-group-item"]').classes()
    expect(c).toContain('first:rounded-s-md')
    expect(c).toContain('data-[state=on]:bg-accent')
  })
})
