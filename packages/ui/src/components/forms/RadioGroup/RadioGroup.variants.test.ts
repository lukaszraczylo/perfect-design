import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import RadioGroup from './RadioGroup.vue'
import RadioGroupItem from './RadioGroupItem.vue'
import Field from '../Field/Field.vue'
import { radioGroupDotVariants, radioGroupItemVariants, normalizeRadioGroupSize } from './variants'
import { CHOICE_TONES } from '../Checkbox/tones'
import * as barrel from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const DEFAULT_ITEM =
  'peer relative inline-flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input bg-transparent text-primary shadow-xs transition-[color,box-shadow] after:absolute after:-inset-1 pointer-coarse:after:-inset-3 dark:bg-input/30 data-[state=checked]:border-primary disabled:cursor-not-allowed disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 forced-colors:aria-invalid:border-dashed'
const DEFAULT_DOT = 'block size-2 rounded-full bg-primary forced-colors:bg-[CanvasText]'

const TONES = {
  primary: 'primary',
  success: 'success',
  danger: 'destructive',
  info: 'info',
  neutral: 'foreground',
} as const

type ItemProps = Record<string, unknown>
function make(groupProps: Record<string, unknown> = {}, itemProps: ItemProps[] = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]) {
  return mount(RadioGroup, {
    props: { 'aria-label': 'Sample group', defaultValue: 'a', ...groupProps } as never,
    slots: { default: () => itemProps.map((p) => h(RadioGroupItem, p as never)) },
    attachTo: document.body,
  })
}
const items = (w: VueWrapper) => w.findAll('[data-slot="radio-group-item"]')
const dot = (w: VueWrapper) => w.find('[data-slot="radio-group-indicator"] span')

describe('RadioGroup variations', () => {
  describe('defaults', () => {
    it('keeps the original item and dot class strings', () => {
      wrapper = make({}, [{ value: 'a', 'aria-label': 'A' }])
      expect(items(wrapper)[0].attributes('class')).toBe(DEFAULT_ITEM)
      expect(dot(wrapper).attributes('class')).toBe(DEFAULT_DOT)
      expect(radioGroupItemVariants()).toBe(DEFAULT_ITEM)
      expect(radioGroupDotVariants()).toBe(DEFAULT_DOT)
    })

    it('a labelled item only adds the alignment margin and keeps the original wrapper', () => {
      wrapper = make()
      expect(items(wrapper)[0].attributes('class')).toBe(`${DEFAULT_ITEM} mt-0.5`)
      expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').attributes('class')).toBe('inline-flex max-w-full items-start gap-2')
      expect(wrapper.find('[data-slot="radio-group-item-text"]').exists()).toBe(false)
    })

    it('explicit default values render exactly like omitted ones', () => {
      const a = make().html()
      wrapper = make({ size: 'md', tone: 'primary', labelPosition: 'end' }, [{ value: 'a', label: 'Alpha', size: 'md', tone: 'primary', labelPosition: 'end' }, { value: 'b', label: 'Beta' }])
      expect(wrapper.html()).toBe(a)
    })

    it('exports the helpers from the barrel', () => {
      expect(barrel.radioGroupItemVariants).toBe(radioGroupItemVariants)
      expect(barrel.radioGroupDotVariants).toBe(radioGroupDotVariants)
    })
  })

  describe('tone', () => {
    it.each(Object.entries(TONES).filter(([t]) => t !== 'primary'))('group tone %s colours the checked border and the dot', (tone, token) => {
      wrapper = make({ tone })
      const checked = items(wrapper)[0]
      expect(checked.classes()).toContain(`data-[state=checked]:border-${token}`)
      expect(checked.classes()).not.toContain('data-[state=checked]:border-primary')
      expect(dot(wrapper).classes()).toContain(`bg-${token}`)
      expect(dot(wrapper).classes()).not.toContain('bg-primary')
      // Both radios carry it, so selecting another one shows the same colour.
      expect(items(wrapper)[1].classes()).toContain(`data-[state=checked]:border-${token}`)
    })

    it('an item tone wins over the group tone', () => {
      wrapper = make({ tone: 'success' }, [{ value: 'a', label: 'A', tone: 'danger' }, { value: 'b', label: 'B' }])
      expect(items(wrapper)[0].classes()).toContain('data-[state=checked]:border-destructive')
      expect(items(wrapper)[1].classes()).toContain('data-[state=checked]:border-success')
      expect(dot(wrapper).classes()).toContain('bg-destructive')
    })

    it('every tone renders a different group', () => {
      const html = CHOICE_TONES.map((tone) => {
        const w = make({ tone })
        const out = w.html().replace(/(id|for|aria-labelledby)="[^"]*"/g, '')
        w.unmount()
        return out
      })
      expect(new Set(html).size).toBe(CHOICE_TONES.length)
    })

    it('unknown tones fall back to primary', () => {
      wrapper = make({ tone: 'pink' }, [{ value: 'a', 'aria-label': 'A', tone: 'teal' }])
      expect(items(wrapper)[0].attributes('class')).toBe(DEFAULT_ITEM)
      expect(dot(wrapper).attributes('class')).toBe(DEFAULT_DOT)
    })

    it.each(CHOICE_TONES)('%s: selecting another item moves the checked state and the dot', async (tone) => {
      wrapper = make({ tone })
      expect(dot(wrapper).exists()).toBe(true)
      await items(wrapper)[1].trigger('click')
      expect(items(wrapper)[1].attributes('aria-checked')).toBe('true')
      expect(items(wrapper)[0].attributes('aria-checked')).toBe('false')
      expect(wrapper.findAll('[data-slot="radio-group-indicator"]')).toHaveLength(1)
    })

    it('keeps the forced-colors dot and the dashed invalid border in every tone', () => {
      for (const tone of CHOICE_TONES) {
        const w = make({ tone })
        expect(dot(w).classes()).toContain('forced-colors:bg-[CanvasText]')
        expect(items(w)[0].classes()).toContain('forced-colors:aria-invalid:border-dashed')
        w.unmount()
      }
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'size-3.5', 'after:-inset-1.5', 'size-1.5'],
      ['md', 'size-4', 'after:-inset-1', 'size-2'],
      ['lg', 'size-5', 'after:-inset-1', 'size-2.5'],
    ] as const)('%s sets the radio, hit area and dot', (size, box, after, dotSize) => {
      wrapper = make({ size })
      expect(items(wrapper)[0].classes()).toEqual(expect.arrayContaining([box, after, 'pointer-coarse:after:-inset-3', 'after:absolute']))
      expect(items(wrapper)[0].classes().filter((c) => /^size-/.test(c))).toHaveLength(1)
      expect(dot(wrapper).classes()).toContain(dotSize)
      expect(dot(wrapper).classes().filter((c) => /^size-/.test(c))).toHaveLength(1)
    })

    it('label text follows the size', () => {
      wrapper = make({ size: 'lg' })
      expect(wrapper.find('label').classes()).toContain('text-base')
      wrapper.unmount()
      wrapper = make({ size: 'sm' })
      expect(wrapper.find('label').classes()).toContain('text-sm')
    })

    it('an item size wins over the group size', () => {
      wrapper = make({ size: 'lg' }, [{ value: 'a', label: 'A', size: 'sm' }, { value: 'b', label: 'B' }])
      expect(items(wrapper)[0].classes()).toContain('size-3.5')
      expect(items(wrapper)[1].classes()).toContain('size-5')
    })

    it('unknown size falls back to md', () => {
      wrapper = make({ size: 'huge' }, [{ value: 'a', 'aria-label': 'A' }])
      expect(items(wrapper)[0].attributes('class')).toBe(DEFAULT_ITEM)
      expect(normalizeRadioGroupSize(7)).toBe('md')
    })

    it('class on the item wins over size classes', () => {
      wrapper = make({ size: 'lg' }, [{ value: 'a', label: 'A', class: 'size-8 custom' }])
      expect(items(wrapper)[0].classes()).toContain('size-8')
      expect(items(wrapper)[0].classes()).not.toContain('size-5')
    })

    it('radioGroupItemVariants merges for plain elements', () => {
      const out = radioGroupItemVariants({ size: 'sm', tone: 'info', labeled: true, class: 'extra' })
      expect(out).toContain('size-3.5')
      expect(out).not.toContain('size-4 ')
      expect(out).toContain('data-[state=checked]:border-info')
      expect(out).not.toContain('data-[state=checked]:border-primary')
      expect(out).toContain('mt-0.5')
      expect(out.endsWith('extra')).toBe(true)
    })
  })

  describe('labelPosition', () => {
    it('start from the group reverses every row logically; the source order stays box then label', () => {
      wrapper = make({ labelPosition: 'start' })
      for (const row of wrapper.findAll('[data-slot="radio-group-item-wrapper"]')) {
        expect(row.classes()).toContain('flex-row-reverse')
        expect([...row.element.children].map((c) => c.getAttribute('data-slot'))).toEqual(['radio-group-item', 'radio-group-item-label'])
      }
      expect(wrapper.html()).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
    })

    it('an item can override the group both ways', () => {
      wrapper = make({ labelPosition: 'start' }, [{ value: 'a', label: 'A', labelPosition: 'end' }, { value: 'b', label: 'B' }])
      const rows = wrapper.findAll('[data-slot="radio-group-item-wrapper"]')
      expect(rows[0].classes()).not.toContain('flex-row-reverse')
      expect(rows[1].classes()).toContain('flex-row-reverse')
    })

    it('unknown value falls back to end', () => {
      wrapper = make({ labelPosition: 'above' })
      expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').classes()).not.toContain('flex-row-reverse')
    })

    it('does nothing for an item without a label', () => {
      wrapper = make({ labelPosition: 'start' }, [{ value: 'a', 'aria-label': 'A' }])
      expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').exists()).toBe(false)
    })

    it('clicking the label of a start-positioned item selects it', async () => {
      wrapper = make({ labelPosition: 'start' })
      await wrapper.findAll('label')[1].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b'])
    })
  })

  describe('description', () => {
    it('renders under the label and links to the radio with aria-describedby', () => {
      wrapper = make({}, [{ value: 'a', label: 'Monthly', description: 'Billed every month.', id: 'm' }, { value: 'b', label: 'Yearly', id: 'y' }])
      const desc = wrapper.find('[data-slot="radio-group-item-description"]')
      expect(desc.text()).toBe('Billed every month.')
      expect(desc.attributes('id')).toBe('m-description')
      expect(items(wrapper)[0].attributes('aria-describedby')).toBe('m-description')
      expect(items(wrapper)[1].attributes('aria-describedby')).toBeUndefined()
      expect(wrapper.findAll('label')[0].text()).toBe('Monthly')
    })

    it('uses a description slot and merges with an explicit aria-describedby', () => {
      wrapper = mount(RadioGroup, {
        props: { 'aria-label': 'Plan' } as never,
        slots: {
          default: () =>
            h(RadioGroupItem, { value: 'a', label: 'A', id: 'a1', 'aria-describedby': 'ext' } as never, { description: () => h('b', 'Rich') }),
        },
      })
      expect(wrapper.find('[data-slot="radio-group-item-description"] b').text()).toBe('Rich')
      expect(items(wrapper)[0].attributes('aria-describedby')).toBe('ext a1-description')
    })

    it('is ignored without a label', () => {
      wrapper = make({}, [{ value: 'a', 'aria-label': 'A', description: 'Orphan' }])
      expect(wrapper.find('[data-slot="radio-group-item-description"]').exists()).toBe(false)
      expect(items(wrapper)[0].attributes('aria-describedby')).toBeUndefined()
    })

    it('shrinks on sm, dims when the item is disabled and tolerates long text', () => {
      wrapper = make({ size: 'sm' }, [{ value: 'a', label: 'A', description: 'x'.repeat(300), disabled: true }])
      const d = wrapper.find('[data-slot="radio-group-item-description"]')
      expect(d.classes()).toEqual(expect.arrayContaining(['text-xs', 'opacity-50', 'text-muted-foreground']))
      expect(wrapper.find('[data-slot="radio-group-item-text"]').classes()).toContain('min-w-0')
    })

    it('the group keeps its own describedby from a Field while items describe themselves', () => {
      wrapper = mount(Field, {
        props: { label: 'Plan', hint: 'Pick one', id: 'p' },
        slots: { default: () => h(RadioGroup, { defaultValue: 'a' }, () => h(RadioGroupItem, { value: 'a', label: 'A', description: 'About A', id: 'ia' })) },
      })
      expect(wrapper.find('[role="radiogroup"]').attributes('aria-describedby')).toBe('p-hint')
      expect(wrapper.find('[data-slot="radio-group-item"]').attributes('aria-describedby')).toBe('ia-description')
    })
  })

  describe('combinations and keyboard', () => {
    it.each(CHOICE_TONES.flatMap((tone) => (['sm', 'md', 'lg'] as const).map((size) => [tone, size] as const)))('tone=%s size=%s with description and start label', (tone, size) => {
      wrapper = make({ tone, size, labelPosition: 'start' }, [{ value: 'a', label: 'A', description: 'D' }, { value: 'b', label: 'B', description: 'D' }])
      expect(items(wrapper)).toHaveLength(2)
      expect(items(wrapper)[0].classes().filter((c) => /^data-\[state=checked\]:border-/.test(c))).toHaveLength(1)
      expect(wrapper.findAll('[data-slot="radio-group-item-description"]')).toHaveLength(2)
    })

    it('keeps the radio roles and horizontal layout in a varied group', () => {
      wrapper = make({ tone: 'success', size: 'lg', orientation: 'horizontal' })
      expect(wrapper.find('[data-slot="radio-group"]').classes()).toContain('flex')
      expect(wrapper.find('[data-slot="radio-group"]').attributes('aria-orientation')).toBe('horizontal')
      expect(items(wrapper).map((i) => i.attributes('role'))).toEqual(['radio', 'radio'])
      expect(items(wrapper)[0].attributes('data-orientation')).toBe('horizontal')
    })

    it('selecting by click works in every tone and emits the value', async () => {
      for (const tone of CHOICE_TONES) {
        const w = make({ tone })
        await items(w)[1].trigger('click')
        expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['b'])
        w.unmount()
      }
    })

    it('disabled and invalid still apply with a tone', () => {
      wrapper = make({ tone: 'danger', invalid: true, disabled: true })
      expect(wrapper.find('[data-slot="radio-group"]').attributes('aria-invalid')).toBe('true')
      expect(items(wrapper)[0].attributes('disabled')).toBeDefined()
      expect(items(wrapper)[0].classes()).toContain('disabled:opacity-50')
    })

    it('group props update items after mount', async () => {
      wrapper = make()
      await wrapper.setProps({ tone: 'info', size: 'lg', labelPosition: 'start' })
      expect(items(wrapper)[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:border-info', 'size-5']))
      expect(wrapper.find('[data-slot="radio-group-item-wrapper"]').classes()).toContain('flex-row-reverse')
    })

    it('unmounts cleanly', () => {
      const w = make({ tone: 'neutral', size: 'sm' })
      w.unmount()
      expect(document.body.innerHTML).toBe('')
    })
  })
})
