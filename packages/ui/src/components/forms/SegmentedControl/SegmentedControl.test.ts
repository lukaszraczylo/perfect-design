import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { faList, faTableCells } from '@fortawesome/free-solid-svg-icons'
import SegmentedControl from './SegmentedControl.vue'
import { SegmentedControl as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month', disabled: true },
]
const items = (w: VueWrapper) => w.findAll('[role="radio"]')
const root = (w: VueWrapper) => w.find('[data-slot="segmented-control"]')

describe('SegmentedControl', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(SegmentedControl))

    it('renders a radiogroup with one radio per option', () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS } })
      expect(root(w).attributes('role')).toBe('radiogroup')
      expect(root(w).attributes('aria-orientation')).toBe('horizontal')
      expect(items(w).map((i) => i.text())).toEqual(['Day', 'Week', 'Month'])
      expect(items(w)[0]!.attributes('data-slot')).toBe('segmented-control-item')
    })

    it('marks the selected option', () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, modelValue: 'week' } })
      expect(items(w).map((i) => i.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
      expect(items(w)[1]!.classes()).toContain('data-[state=checked]:bg-background')
    })

    it('emits update:modelValue on click', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, modelValue: 'day' } })
      await items(w)[1]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['week'])
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, defaultValue: 'day' } })
      expect(items(w)[0]!.attributes('aria-checked')).toBe('true')
      await items(w)[1]!.trigger('click')
      expect(items(w)[1]!.attributes('aria-checked')).toBe('true')
      expect(items(w)[0]!.attributes('aria-checked')).toBe('false')
    })

    it('works with v-model in a parent', async () => {
      const v = ref('day')
      wrapper = mount(
        defineComponent({
          setup: () => () => h(SegmentedControl, { options: OPTIONS, modelValue: v.value, 'onUpdate:modelValue': (x: string) => (v.value = x) }),
        }),
      )
      await wrapper.findAll('[role="radio"]')[1]!.trigger('click')
      expect(v.value).toBe('week')
    })

    it('renders option icons (decorative)', () => {
      const w = mount(SegmentedControl, {
        props: {
          options: [
            { value: 'list', label: 'List', icon: faList },
            { value: 'grid', label: 'Grid', icon: faTableCells },
          ],
        },
      })
      expect(w.findAll('[data-slot="icon"]')).toHaveLength(2)
      expect(w.find('[data-slot="icon"]').attributes('aria-hidden')).toBe('true')
    })

    it('the option slot replaces item content and receives the option', () => {
      const w = mount(SegmentedControl, {
        props: { options: OPTIONS },
        slots: { option: `<template #option="{ option }"><b>{{ option.value }}!</b></template>` },
      })
      expect(items(w).map((i) => i.text())).toEqual(['day!', 'week!', 'month!'])
    })

    it.each([
      ['sm', 'h-6'],
      ['md', 'h-7'],
      ['lg', 'h-9'],
    ] as const)('applies the %s size', (size, cls) => {
      expect(items(mount(SegmentedControl, { props: { options: OPTIONS, size } }))[0]!.classes()).toContain(cls)
    })

    it('inline by default, full width with fullWidth', () => {
      const a = mount(SegmentedControl, { props: { options: OPTIONS } })
      expect(root(a).classes()).toContain('inline-flex')
      expect(items(a)[0]!.classes()).not.toContain('flex-1')
      const b = mount(SegmentedControl, { props: { options: OPTIONS, fullWidth: true } })
      expect(root(b).classes()).toContain('w-full')
      expect(items(b)[0]!.classes()).toContain('flex-1')
    })

    it('forwards name to the hidden inputs inside a form', () => {
      const Host = defineComponent({ setup: () => () => h('form', null, [h(SegmentedControl, { options: OPTIONS, name: 'range', modelValue: 'day' })]) })
      wrapper = mount(Host, { attachTo: document.body })
      expect(wrapper.find('input[name="range"]').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last on the root', () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, class: 'bg-card custom' } })
      expect(root(w).classes()).toContain('custom')
      expect(root(w).classes()).toContain('bg-card')
      expect(root(w).classes()).not.toContain('bg-muted')
    })

    it('passes attrs to the root', () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS }, attrs: { 'aria-label': 'Range', 'data-x': '1' } })
      expect(root(w).attributes('aria-label')).toBe('Range')
      expect(root(w).attributes('data-x')).toBe('1')
    })
  })

  describe('bad path', () => {
    it('disabled group blocks selection', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, disabled: true } })
      expect(items(w).every((i) => i.attributes('disabled') !== undefined)).toBe(true)
      await items(w)[0]!.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('disabled option blocks only itself', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS } })
      await items(w)[2]!.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await items(w)[1]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['week'])
    })

    it('invalid sets aria-invalid', () => {
      expect(root(mount(SegmentedControl, { props: { options: OPTIONS, invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(root(mount(SegmentedControl, { props: { options: OPTIONS } })).attributes('aria-invalid')).toBeUndefined()
    })

    it('unknown size falls back to md', () => {
      expect(items(mount(SegmentedControl, { props: { options: OPTIONS, size: 'xl' as never } }))[0]!.classes()).toContain('h-7')
    })

    it('modelValue matching no option selects nothing', () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, modelValue: 'year' } })
      expect(items(w).every((i) => i.attributes('aria-checked') === 'false')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('empty options renders an empty group', () => {
      const w = mount(SegmentedControl)
      expect(root(w).exists()).toBe(true)
      expect(items(w)).toHaveLength(0)
    })

    it('single option', async () => {
      const w = mount(SegmentedControl, { props: { options: [{ value: 'only', label: 'Only' }] } })
      await items(w)[0]!.trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['only'])
    })

    it('unicode labels', () => {
      const w = mount(SegmentedControl, { props: { options: [{ value: 'jp', label: '日本語 🎌' }, { value: 'ar', label: 'مرحبا' }] } })
      expect(items(w).map((i) => i.text())).toEqual(['日本語 🎌', 'مرحبا'])
    })

    it('rapid selection ends on the last click', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS, defaultValue: 'day' } })
      for (const i of [1, 0, 1, 0, 1]) await items(w)[i]!.trigger('click')
      expect(items(w)[1]!.attributes('aria-checked')).toBe('true')
    })

    it('options update reactively', async () => {
      const w = mount(SegmentedControl, { props: { options: OPTIONS } })
      await w.setProps({ options: [{ value: 'x', label: 'X' }] })
      expect(items(w).map((i) => i.text())).toEqual(['X'])
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid, disabled from Field', () => {
      wrapper = mount(Field, {
        props: { label: 'Range', hint: 'Pick', error: 'Bad', id: 'range', disabled: true },
        slots: { default: () => h(SegmentedControl, { options: OPTIONS }) },
      })
      const g = wrapper.find('[role="radiogroup"]')
      expect(g.attributes('id')).toBe('range')
      expect(g.attributes('aria-describedby')).toBe('range-hint range-error')
      expect(g.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('[role="radio"]').attributes('disabled')).toBeDefined()
    })
  })
})
