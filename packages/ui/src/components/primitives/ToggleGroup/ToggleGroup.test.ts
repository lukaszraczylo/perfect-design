import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { ToggleGroupRoot } from 'reka-ui'
import ToggleGroup from './ToggleGroup.vue'
import ToggleGroupItem from './ToggleGroupItem.vue'
import { useToggleGroupContext } from './context'
import { toggleGroupItemVariants, toggleGroupVariants } from './variants'

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
        h(ToggleGroup, groupProps, {
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

const items = (w: VueWrapper) => w.findAll('[data-slot="toggle-group-item"]')

describe('ToggleGroup', () => {
  describe('good path', () => {
    it('renders a group with items', () => {
      const w = build()
      const root = w.find('[data-slot="toggle-group"]')
      expect(root.attributes('role')).toBe('group')
      expect(root.attributes('data-orientation')).toBe('horizontal')
      expect(items(w)).toHaveLength(3)
      expect(items(w)[0]!.element.tagName).toBe('BUTTON')
    })

    it('single: pressing selects one and replaces the previous', async () => {
      const w = build()
      await items(w)[0]!.trigger('click')
      expect(items(w)[0]!.attributes('data-state')).toBe('on')
      await items(w)[1]!.trigger('click')
      expect(items(w)[0]!.attributes('data-state')).toBe('off')
      expect(items(w)[1]!.attributes('data-state')).toBe('on')
    })

    it('single: pressing the active item again clears the value', async () => {
      const w = build()
      await items(w)[0]!.trigger('click')
      await items(w)[0]!.trigger('click')
      expect(items(w)[0]!.attributes('data-state')).toBe('off')
    })

    it('multiple: several items can be pressed', async () => {
      const w = build({ type: 'multiple' })
      await items(w)[0]!.trigger('click')
      await items(w)[2]!.trigger('click')
      expect(items(w).map((i) => i.attributes('data-state'))).toEqual(['on', 'off', 'on'])
    })

    it('defaultValue preselects (single and multiple)', () => {
      expect(items(build({ defaultValue: 'b' })).map((i) => i.attributes('data-state'))).toEqual(['off', 'on', 'off'])
      wrapper!.unmount()
      expect(items(build({ type: 'multiple', defaultValue: ['a', 'c'] })).map((i) => i.attributes('data-state'))).toEqual(['on', 'off', 'on'])
    })

    it('v-model: emits update:modelValue and follows controlled value', async () => {
      const value = ref<string | undefined>('a')
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(
              ToggleGroup,
              { modelValue: value.value, 'onUpdate:modelValue': (v: string | string[] | undefined) => (value.value = v as string) },
              { default: () => [h(ToggleGroupItem, { value: 'a' }, () => 'A'), h(ToggleGroupItem, { value: 'b' }, () => 'B')] },
            ),
        }),
        { attachTo: document.body },
      )
      const w = wrapper
      expect(items(w)[0]!.attributes('data-state')).toBe('on')
      await items(w)[1]!.trigger('click')
      expect(value.value).toBe('b')
      expect(items(w)[1]!.attributes('data-state')).toBe('on')
    })

    it('emits string[] in multiple mode', async () => {
      const w = mount(ToggleGroup, {
        props: { type: 'multiple' },
        slots: { default: () => [h(ToggleGroupItem, { value: 'a' }, () => 'A'), h(ToggleGroupItem, { value: 'b' }, () => 'B')] },
        attachTo: document.body,
      })
      wrapper = w as unknown as VueWrapper
      await w.findAll('button')[1]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([['b']])
    })

    it('shares variant and size from the group via context', () => {
      const w = build({ variant: 'outline', size: 'lg' })
      for (const item of items(w)) {
        expect(item.classes()).toContain('border-input')
        expect(item.classes()).toContain('h-10')
      }
    })

    it('items can override the group variant and size', () => {
      const w = build({ variant: 'outline', size: 'lg' }, { b: { variant: 'default', size: 'sm' } })
      expect(items(w)[1]!.classes()).toContain('h-8')
      expect(items(w)[1]!.classes()).not.toContain('border-input')
      expect(items(w)[0]!.classes()).toContain('h-10')
    })

    it('joins items: outer corners only rounded, outline collapses inner borders', () => {
      const w = build({ variant: 'outline' })
      const c = items(w)[1]!.classes()
      expect(c).toContain('rounded-none')
      expect(c).toContain('border-s-0')
      expect(items(w)[0]!.classes()).toContain('first:rounded-s-md')
      expect(items(w)[2]!.classes()).toContain('last:rounded-e-md')
    })

    it('default variant does not add a left border', () => {
      expect(items(build())[0]!.classes()).not.toContain('first:border-s')
    })

    it('vertical orientation lays out a column with vertical joins', () => {
      const w = build({ variant: 'outline', orientation: 'vertical' })
      const root = w.find('[data-slot="toggle-group"]')
      expect(root.classes()).toContain('flex-col')
      expect(root.attributes('data-orientation')).toBe('vertical')
      expect(items(w)[1]!.classes()).toContain('border-t-0')
      expect(items(w)[0]!.classes()).toContain('first:rounded-t-md')
    })

    it('item scoped slot exposes pressed', async () => {
      wrapper = mount(ToggleGroup, {
        slots: { default: () => h(ToggleGroupItem, { value: 'a' }, { default: ({ pressed }: { pressed: boolean }) => (pressed ? 'ON' : 'OFF') }) },
        attachTo: document.body,
      }) as unknown as VueWrapper
      const btn = wrapper.find('button')
      expect(btn.text()).toBe('OFF')
      await btn.trigger('click')
      expect(btn.text()).toBe('ON')
    })

    it('uses a roving tabindex: only the focused item is a tab stop', async () => {
      const w = build()
      await flushPromises()
      expect(items(w).map((i) => i.attributes('tabindex'))).toEqual(['-1', '-1', '-1'])
      ;(items(w)[1]!.element as HTMLElement).focus()
      await flushPromises()
      expect(items(w).map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
    })
  })

  describe('customisation', () => {
    it('merges class on group and items', () => {
      const w = build({ class: 'gap-2 custom-g' }, { a: { class: 'custom-i h-12' } })
      const root = w.find('[data-slot="toggle-group"]')
      expect(root.classes()).toContain('custom-g')
      expect(root.classes()).toContain('gap-2')
      expect(items(w)[0]!.classes()).toContain('custom-i')
      expect(items(w)[0]!.classes()).toContain('h-12')
      expect(items(w)[0]!.classes()).not.toContain('h-9')
    })

    it('passes attributes through', () => {
      const w = build({ 'aria-label': 'Alignment', id: 'grp' }, { a: { 'aria-label': 'Left', 'data-test': 'x' } })
      expect(w.find('[data-slot="toggle-group"]').attributes('aria-label')).toBe('Alignment')
      expect(w.find('#grp').exists()).toBe(true)
      expect(items(w)[0]!.attributes('aria-label')).toBe('Left')
      expect(items(w)[0]!.attributes('data-test')).toBe('x')
    })

    it('`as` swaps the group element', () => {
      const w = build({ as: 'section' })
      expect(w.find('[data-slot="toggle-group"]').element.tagName).toBe('SECTION')
    })

    it('asChild on an item renders the child element', () => {
      wrapper = mount(ToggleGroup, {
        slots: { default: () => h(ToggleGroupItem, { value: 'a', asChild: true }, () => h('a', { href: '#' }, 'Link')) },
        attachTo: document.body,
      }) as unknown as VueWrapper
      expect(wrapper.find('a[data-slot="toggle-group-item"]').exists()).toBe(true)
    })
  })

  describe('bad path', () => {
    it('group disabled blocks every item', async () => {
      const w = build({ disabled: true })
      await items(w)[0]!.trigger('click')
      for (const item of items(w)) {
        expect(item.attributes('disabled')).toBeDefined()
        expect(item.attributes('data-state')).toBe('off')
      }
    })

    it('item disabled blocks only that item', async () => {
      const w = build({}, { a: { disabled: true } })
      await items(w)[0]!.trigger('click')
      expect(items(w)[0]!.attributes('data-state')).toBe('off')
      await items(w)[1]!.trigger('click')
      expect(items(w)[1]!.attributes('data-state')).toBe('on')
    })

    it('an item outside a group falls back to defaults at the context level', () => {
      let ctx: ReturnType<typeof useToggleGroupContext> | undefined
      const Probe = defineComponent({
        setup() {
          ctx = useToggleGroupContext()
          return () => null
        },
      })
      mount(Probe)
      expect(ctx).toBeNull()
    })

    it('an item inside a bare reka group (no ToggleGroup context) uses default variant and size', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(ToggleGroupRoot, { type: 'single' }, { default: () => h(ToggleGroupItem, { value: 'a' }, () => 'A') }),
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      const item = wrapper.find('[data-slot="toggle-group-item"]')
      expect(item.classes()).toContain('h-9')
      expect(item.classes()).toContain('first:rounded-s-md')
    })

    it('unknown variant/size values do not throw', () => {
      const w = build({ variant: 'x', size: 'y' })
      expect(items(w)).toHaveLength(3)
    })

    it('defaultValue that matches no item presses nothing', () => {
      expect(items(build({ defaultValue: 'zzz' })).every((i) => i.attributes('data-state') === 'off')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('empty group renders without items', () => {
      wrapper = mount(ToggleGroup, { attachTo: document.body }) as unknown as VueWrapper
      expect(wrapper.find('[data-slot="toggle-group"]').exists()).toBe(true)
      expect(wrapper.findAll('button')).toHaveLength(0)
    })

    it('a single item group works', async () => {
      wrapper = mount(ToggleGroup, {
        slots: { default: () => h(ToggleGroupItem, { value: 'only' }, () => 'Only') },
        attachTo: document.body,
      }) as unknown as VueWrapper
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('button').attributes('data-state')).toBe('on')
    })

    it('unicode / RTL labels are rendered', () => {
      wrapper = mount(ToggleGroup, {
        props: { dir: 'rtl' },
        slots: { default: () => h(ToggleGroupItem, { value: 'a' }, () => 'محاذاة ✓') },
        attachTo: document.body,
      }) as unknown as VueWrapper
      expect(wrapper.find('button').text()).toBe('محاذاة ✓')
    })

    it('rapid clicks in multiple mode keep consistent state', async () => {
      const w = build({ type: 'multiple' })
      for (let i = 0; i < 5; i++) await items(w)[0]!.trigger('click')
      expect(items(w)[0]!.attributes('data-state')).toBe('on')
    })
  })
})

describe('ToggleGroup variations', () => {
  const root = (w: VueWrapper) => w.find('[data-slot="toggle-group"]')

  describe('segmented variant', () => {
    it('draws a muted track around separate rounded items', () => {
      const w = build({ variant: 'segmented' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-0.5', 'gap-0.5', 'rounded-lg']))
      expect(root(w).classes()).not.toContain('rounded-md')
      for (const item of items(w)) {
        expect(item.classes()).toContain('rounded-md')
        expect(item.classes()).not.toContain('rounded-none')
        expect(item.classes()).not.toContain('first:rounded-s-md')
        expect(item.classes()).not.toContain('border-input')
        expect(item.classes()).toContain('text-muted-foreground')
        expect(item.classes()).toContain('data-[state=on]:bg-background')
        expect(item.classes()).toContain('data-[state=on]:shadow-sm')
        expect(item.classes()).not.toContain('data-[state=on]:bg-accent')
      }
    })

    it('selection still works and toggles data-state', async () => {
      const w = build({ variant: 'segmented' })
      await items(w)[1]!.trigger('click')
      expect(items(w).map((i) => i.attributes('data-state'))).toEqual(['off', 'on', 'off'])
      await items(w)[2]!.trigger('click')
      expect(items(w).map((i) => i.attributes('data-state'))).toEqual(['off', 'off', 'on'])
    })

    it('works with multiple selection', async () => {
      const w = build({ variant: 'segmented', type: 'multiple' })
      await items(w)[0]!.trigger('click')
      await items(w)[2]!.trigger('click')
      expect(items(w).map((i) => i.attributes('data-state'))).toEqual(['on', 'off', 'on'])
    })

    it('vertical segmented stacks the track', () => {
      const w = build({ variant: 'segmented', orientation: 'vertical' })
      expect(root(w).classes()).toContain('flex-col')
      expect(root(w).classes()).toContain('bg-muted')
      expect(items(w)[0]!.classes()).not.toContain('first:rounded-t-md')
    })

    it('an item can opt out of the segmented look and an item can opt in', () => {
      const w = build({ variant: 'segmented' }, { b: { variant: 'outline' } })
      expect(items(w)[1]!.classes()).toContain('border-input')
      expect(items(w)[0]!.classes()).toContain('data-[state=on]:bg-background')
      const x = build({ variant: 'default' }, { a: { variant: 'segmented' } })
      expect(items(x)[0]!.classes()).toContain('data-[state=on]:bg-background')
      expect(items(x)[1]!.classes()).toContain('rounded-none')
    })

    it('group classes can override the track', () => {
      const w = build({ variant: 'segmented', class: 'bg-accent p-1' })
      expect(root(w).classes()).toContain('bg-accent')
      expect(root(w).classes()).not.toContain('bg-muted')
      expect(root(w).classes()).toContain('p-1')
      expect(root(w).classes()).not.toContain('p-0.5')
    })

    it('keeps keyboard roving and aria-pressed semantics', async () => {
      const w = build({ variant: 'segmented' })
      await flushPromises()
      expect(items(w)[0]!.attributes('aria-pressed')).toBe('false')
      await items(w)[0]!.trigger('click')
      expect(items(w)[0]!.attributes('aria-pressed')).toBe('true')
    })

    it('disabled segmented group blocks items', async () => {
      const w = build({ variant: 'segmented', disabled: true })
      await items(w)[0]!.trigger('click')
      expect(items(w).every((i) => i.attributes('data-state') === 'off' && i.attributes('disabled') !== undefined)).toBe(true)
    })
  })

  describe('sizes', () => {
    it.each([
      ['xs', ['h-7', 'min-w-7', 'px-1.5', 'text-xs'], ['h-9']],
      ['sm', ['h-8'], ['h-9']],
      ['md', ['h-9'], ['h-8']],
      ['lg', ['h-10'], ['h-9']],
      ['xl', ['h-11', 'min-w-11', 'px-4', 'text-base'], ['h-9', 'text-sm']],
    ] as const)('size %s has %j and not %j', (size, has, not) => {
      for (const variant of ['default', 'outline', 'segmented'] as const) {
        const item = items(build({ size, variant }))[0]!
        for (const c of has) expect(item.classes()).toContain(c)
        for (const c of not) expect(item.classes()).not.toContain(c)
        wrapper!.unmount()
      }
    })

    it('unknown size falls back to md and unknown variant to default', () => {
      const w = build({ size: 'huge', variant: 'fancy' })
      const item = items(w)[0]!
      expect(item.classes()).toContain('h-9')
      expect(item.classes()).toContain('rounded-none')
      expect(item.classes()).toContain('first:rounded-s-md')
      expect(root(w).classes()).not.toContain('bg-muted')
    })

    it('item size overrides the group size, including the extra sizes', () => {
      const w = build({ size: 'sm' }, { a: { size: 'xl' }, b: { size: 'xs' } })
      expect(items(w)[0]!.classes()).toContain('h-11')
      expect(items(w)[1]!.classes()).toContain('h-7')
      expect(items(w)[2]!.classes()).toContain('h-8')
    })

    it('consumer class still beats the size', () => {
      const item = items(build({ size: 'xl' }, { a: { class: 'h-20' } }))[0]!
      expect(item.classes()).toContain('h-20')
      expect(item.classes()).not.toContain('h-11')
    })
  })

  describe('fullWidth', () => {
    it('stretches the group and shares width between items', () => {
      const w = build({ fullWidth: true, variant: 'segmented' })
      expect(root(w).classes()).toContain('w-full')
      expect(root(w).classes()).toContain('flex')
      expect(root(w).classes()).not.toContain('inline-flex')
      expect(root(w).classes()).not.toContain('w-fit')
      expect(items(w).every((i) => i.classes().includes('flex-1'))).toBe(true)
    })

    it('is off by default', () => {
      const w = build()
      expect(root(w).classes()).toContain('w-fit')
      expect(items(w)[0]!.classes()).not.toContain('flex-1')
    })

    it('vertical full width does not make items flex-1', () => {
      const w = build({ fullWidth: true, orientation: 'vertical' })
      expect(root(w).classes()).toContain('w-full')
      expect(items(w)[0]!.classes()).not.toContain('flex-1')
    })

    it('bare reka group (no context) ignores fullWidth', () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(ToggleGroupRoot, { type: 'single' }, { default: () => h(ToggleGroupItem, { value: 'a' }, () => 'A') }),
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      expect(wrapper.find('[data-slot="toggle-group-item"]').classes()).not.toContain('flex-1')
    })
  })

  describe('variant helpers', () => {
    it('toggleGroupVariants covers every variant, orientation and fullWidth', () => {
      expect(toggleGroupVariants()).toContain('inline-flex')
      expect(toggleGroupVariants({ variant: 'segmented' })).toContain('bg-muted')
      expect(toggleGroupVariants({ variant: 'outline' })).not.toContain('bg-muted')
      expect(toggleGroupVariants({ orientation: 'vertical' })).toContain('flex-col')
      expect(toggleGroupVariants({ fullWidth: true })).toContain('w-full')
    })

    it('toggleGroupItemVariants handles null / missing values and class', () => {
      expect(toggleGroupItemVariants()).toContain('h-9')
      expect(toggleGroupItemVariants({ variant: null, size: null, orientation: null, fullWidth: null })).toContain('rounded-none')
      expect(toggleGroupItemVariants({ variant: 'outline', orientation: 'vertical' })).toContain('border-t-0')
      expect(toggleGroupItemVariants({ variant: 'segmented', class: 'extra' })).toContain('extra')
      expect(toggleGroupItemVariants({ variant: 'nope' as never, size: 'nope' as never })).toContain('h-9')
    })
  })
})

describe('ToggleGroup logical corners and forced colours', () => {
  it('joined items round the inline start/end corners so the group mirrors in RTL', () => {
    const c = toggleGroupItemVariants({ variant: 'outline' })
    expect(c).toContain('first:rounded-s-md')
    expect(c).toContain('last:rounded-e-md')
    expect(c).not.toMatch(/rounded-[lr]-md/)
  })

  it('the pressed item gets a border in forced-colors mode (background alone disappears)', () => {
    expect(toggleGroupItemVariants()).toContain('forced-colors:data-[state=on]:border-2')
  })
})
