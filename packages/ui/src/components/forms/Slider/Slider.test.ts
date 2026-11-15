import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import Slider from './Slider.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
async function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  wrapper = mount(Slider, { props, attrs, attachTo: document.body })
  await nextTick()
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const thumbs = (w: VueWrapper) => w.findAll('[role=slider]')
const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await Promise.resolve()
}

describe('Slider', () => {
  describe('good path', () => {
    it('renders root, track, range and one thumb with data-slots', async () => {
      const w = await make({ modelValue: [40] })
      expect(w.attributes('data-slot')).toBe('slider')
      expect(w.find('[data-slot=slider-track]').exists()).toBe(true)
      expect(w.find('[data-slot=slider-range]').exists()).toBe(true)
      expect(w.findAll('[data-slot=slider-thumb]')).toHaveLength(1)
    })

    it('exposes slider semantics on the thumb', async () => {
      const w = await make({ modelValue: [40], min: 10, max: 90 })
      const t = thumbs(w)[0]!
      expect(t.attributes('aria-valuenow')).toBe('40')
      expect(t.attributes('aria-valuemin')).toBe('10')
      expect(t.attributes('aria-valuemax')).toBe('90')
      expect(t.attributes('aria-orientation')).toBe('horizontal')
      expect(t.attributes('tabindex')).toBe('0')
    })

    it('renders one thumb per value (range)', async () => {
      const w = await make({ modelValue: [20, 80] })
      expect(thumbs(w)).toHaveLength(2)
      expect(thumbs(w).map((t) => t.attributes('aria-valuenow'))).toEqual(['20', '80'])
    })

    it('emits update:modelValue as number[] on ArrowRight', async () => {
      const w = await make({ modelValue: [40] })
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([[41]])
    })

    it('respects step and keyboard Home/End', async () => {
      const w = await make({ modelValue: [50], step: 10 })
      const t = thumbs(w)[0]!.element
      await press(t, 'ArrowRight')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[60]])
      await press(t, 'End')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[100]])
      await press(t, 'Home')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual([[0]])
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = await make({ defaultValue: [30] })
      expect(thumbs(w)[0]!.attributes('aria-valuenow')).toBe('30')
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(thumbs(w)[0]!.attributes('aria-valuenow')).toBe('31')
    })

    it('defaults to a single thumb at min when nothing is given', async () => {
      const w = await make({ min: 5, max: 15 })
      expect(thumbs(w)).toHaveLength(1)
      expect(thumbs(w)[0]!.attributes('aria-valuenow')).toBe('5')
    })

    it('syncs when the controlled modelValue changes', async () => {
      const w = await make({ modelValue: [10] })
      await w.setProps({ modelValue: [70] })
      expect(thumbs(w)[0]!.attributes('aria-valuenow')).toBe('70')
    })

    it('keeps the last value when modelValue becomes null', async () => {
      const w = await make({ modelValue: [10] })
      await w.setProps({ modelValue: null })
      expect(thumbs(w)[0]!.attributes('aria-valuenow')).toBe('10')
    })

    it('works with a parent v-model', async () => {
      const value = ref([25])
      const Host = defineComponent({
        setup: () => () => h(Slider, { modelValue: value.value, 'onUpdate:modelValue': (v: number[]) => (value.value = v) }),
      })
      wrapper = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
      await press(wrapper.find('[role=slider]').element, 'ArrowRight')
      expect(value.value).toEqual([26])
    })

    it('supports vertical orientation', async () => {
      const w = await make({ modelValue: [50], orientation: 'vertical' })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(thumbs(w)[0]!.attributes('aria-orientation')).toBe('vertical')
      expect(w.classes()).toContain('flex-col')
      expect(w.find('[data-slot=slider-track]').classes()).toContain('w-1.5')
    })

    it('emits valueCommit after a key change completes via reka', async () => {
      const w = await make({ modelValue: [10] })
      const root = w.findComponent({ name: 'SliderRoot' })
      root.vm.$emit('valueCommit', [12])
      expect(w.emitted('valueCommit')?.[0]).toEqual([[12]])
    })

    it('keeps range thumbs ordered when keying past each other', async () => {
      const w = await make({ modelValue: [49, 50] })
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      const last = w.emitted('update:modelValue')?.at(-1)?.[0] as number[]
      expect(last).toEqual([50, 50])
    })
  })

  describe('labels and a11y', () => {
    it('applies ariaLabel to a single thumb', async () => {
      const w = await make({ modelValue: [1], ariaLabel: 'Volume' })
      expect(thumbs(w)[0]!.attributes('aria-label')).toBe('Volume')
    })

    it('appends index when several thumbs share ariaLabel', async () => {
      const w = await make({ modelValue: [1, 2], ariaLabel: 'Price' })
      expect(thumbs(w).map((t) => t.attributes('aria-label'))).toEqual(['Price 1 of 2', 'Price 2 of 2'])
    })

    it('thumbLabels wins over ariaLabel and falls back per thumb', async () => {
      const w = await make({ modelValue: [1, 2], ariaLabel: 'Price', thumbLabels: ['Min price'] })
      expect(thumbs(w).map((t) => t.attributes('aria-label'))).toEqual(['Min price', 'Price 2 of 2'])
    })

    it('falls back to reka default labels when no label is given', async () => {
      const w = await make({ modelValue: [1, 2] })
      expect(thumbs(w).map((t) => t.attributes('aria-label'))).toEqual(['Minimum', 'Maximum'])
    })

    it('invalid sets aria-invalid on thumbs and data-invalid on root', async () => {
      const w = await make({ modelValue: [1], invalid: true })
      expect(thumbs(w)[0]!.attributes('aria-invalid')).toBe('true')
      expect(w.attributes('data-invalid')).toBeDefined()
      expect(w.find('[data-slot=slider-range]').classes()).toContain('bg-destructive')
    })

    it('valid slider has no aria-invalid', async () => {
      const w = await make({ modelValue: [1] })
      expect(thumbs(w)[0]!.attributes('aria-invalid')).toBeUndefined()
      expect(w.attributes('data-invalid')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last so it wins', async () => {
      const w = await make({ modelValue: [1], class: 'w-48 custom' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-48')
      expect(w.classes()).not.toContain('w-full')
    })

    it('passes attrs through to the root', async () => {
      const w = await make({ modelValue: [1] }, { 'data-testid': 'vol', id: 'my-slider' })
      expect(w.attributes('data-testid')).toBe('vol')
    })
  })

  describe('bad path', () => {
    it('disabled blocks keyboard changes and removes tab stop', async () => {
      const w = await make({ modelValue: [40], disabled: true })
      expect(w.attributes('data-disabled')).toBeDefined()
      expect(thumbs(w)[0]!.attributes('tabindex')).toBeUndefined()
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('does not exceed max or go below min', async () => {
      const w = await make({ modelValue: [100] })
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      const w2 = await make({ modelValue: [0] })
      await press(thumbs(w2)[0]!.element, 'ArrowLeft')
      expect(w2.emitted('update:modelValue')).toBeUndefined()
    })

    it('empty array renders a track but no thumbs', async () => {
      const w = await make({ modelValue: [] })
      expect(thumbs(w)).toHaveLength(0)
      expect(w.find('[data-slot=slider-track]').exists()).toBe(true)
    })

    it('onUpdate tolerates undefined from reka', async () => {
      const w = await make({ modelValue: [1] })
      const root = w.findComponent({ name: 'SliderRoot' })
      root.vm.$emit('update:modelValue', undefined)
      expect(w.emitted('update:modelValue')?.[0]).toEqual([[]])
    })
  })

  describe('edge cases', () => {
    it('handles fractional steps without float drift', async () => {
      const w = await make({ modelValue: [0.1], step: 0.1, min: 0, max: 1 })
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([[0.2]])
    })

    it('handles negative ranges', async () => {
      const w = await make({ modelValue: [-10], min: -50, max: 50 })
      await press(thumbs(w)[0]!.element, 'ArrowLeft')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([[-11]])
    })

    it('inverted flips key direction semantics without error', async () => {
      const w = await make({ modelValue: [50], inverted: true })
      await press(thumbs(w)[0]!.element, 'ArrowLeft')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([[51]])
    })

    it('minStepsBetweenThumbs blocks thumbs from touching', async () => {
      const w = await make({ modelValue: [40, 42], minStepsBetweenThumbs: 2 })
      await press(thumbs(w)[0]!.element, 'ArrowRight')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('renders a hidden form input when name is set inside a form', async () => {
      wrapper = mount(
        defineComponent({ render: () => h('form', [h(Slider, { modelValue: [5], name: 'vol' })]) }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await nextTick()
      expect(document.body.querySelector('input[name="vol[0]"]')).not.toBeNull()
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid and disabled from Field', async () => {
      wrapper = mount(
        defineComponent({
          components: { Field, Slider },
          template: `<Field id="vol" hint="Pick" error="Too loud" disabled><Slider :model-value="[5]" /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await nextTick()
      const t = wrapper.find('[role=slider]')
      expect(t.attributes('id')).toBe('vol')
      expect(t.attributes('aria-describedby')).toContain('vol-hint')
      expect(t.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('[data-slot=slider]').attributes('data-disabled')).toBeDefined()
    })

    it('only the first thumb of a range gets the field id', async () => {
      wrapper = mount(
        defineComponent({
          components: { Field, Slider },
          template: `<Field id="rng"><Slider :model-value="[5, 6]" /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await nextTick()
      const ids = wrapper.findAll('[role=slider]').map((t) => t.attributes('id'))
      expect(ids).toEqual(['rng', undefined])
    })
  })

  describe('a11y regressions', () => {
    const mountField = async (template: string) => {
      wrapper = mount(defineComponent({ components: { Field, Slider }, template }), { attachTo: document.body }) as unknown as VueWrapper
      await nextTick()
      await nextTick()
      return wrapper
    }

    it('a single thumb is named by the Field label through aria-labelledby', async () => {
      const w = await mountField('<Field id="vol2" label="Volume"><Slider :model-value="[5]" /></Field>')
      const t = w.find('[role=slider]')
      const id = t.attributes('aria-labelledby')!
      expect(document.getElementById(id)!.textContent).toContain('Volume')
    })

    it('several thumbs without labels: Field label plus reka Minimum/Maximum, each referencing itself', async () => {
      const w = await mountField('<Field id="rng2" label="Price"><Slider :model-value="[5, 6]" /></Field>')
      const [a, b] = w.findAll('[role=slider]')
      const labelId = a!.attributes('aria-labelledby')!.split(' ')[0]!
      expect(document.getElementById(labelId)!.textContent).toContain('Price')
      expect(a!.attributes('aria-labelledby')).toBe(`${labelId} rng2`)
      expect(b!.attributes('aria-labelledby')).toBe(`${labelId} ${b!.attributes('id')}`)
      expect(b!.attributes('aria-label')).toBe('Maximum')
    })

    it('explicit labels win over the Field label (no aria-labelledby)', async () => {
      const w = await mountField('<Field id="rng3" label="Price"><Slider :model-value="[5, 6]" :thumb-labels="[\'Min price\', \'Max price\']" /></Field>')
      for (const t of w.findAll('[role=slider]')) expect(t.attributes('aria-labelledby')).toBeUndefined()
      expect(w.findAll('[role=slider]').map((t) => t.attributes('aria-label'))).toEqual(['Min price', 'Max price'])
    })

    it('thumb is 24px (size-6) and the root reaches 44px on coarse pointers', async () => {
      const w = await make({ modelValue: [1] })
      expect(thumbs(w)[0]!.classes()).toContain('size-6')
      expect(w.classes()).toContain('pointer-coarse:min-h-11')
      expect(w.classes()).toContain('min-h-6')
      const v = await make({ modelValue: [1], orientation: 'vertical' })
      expect(v.classes()).toContain('pointer-coarse:min-w-11')
    })

    it('keeps track, range and thumb colours in forced-colors mode and has no arbitrary data variants', async () => {
      const w = await make({ modelValue: [1] })
      for (const sel of ['[data-slot=slider-track]', '[data-slot=slider-range]', '[data-slot=slider-thumb]']) {
        expect(w.find(sel).classes()).toContain('forced-color-adjust-none')
      }
      expect(w.html()).not.toMatch(/data-\[/)
    })
  })
})
