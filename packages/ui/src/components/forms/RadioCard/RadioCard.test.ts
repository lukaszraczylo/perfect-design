import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import RadioCard from './RadioCard.vue'
import RadioCardGroup from './RadioCardGroup.vue'
import { RadioCard as Exported, RadioCardGroup as ExportedGroup, radioCardVariants } from './index'
import Field from '../Field/Field.vue'

const mounted: VueWrapper[] = []
// jsdom only runs radio activation behaviour on connected elements
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, { attachTo: document.body, ...o })
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const radios = (w: VueWrapper) => w.findAll('input[type="radio"]')
const cards = (w: VueWrapper) => w.findAll('[data-slot="radio-card"]')
const checkedValues = (w: VueWrapper) => radios(w).filter((r) => (r.element as HTMLInputElement).checked).map((r) => (r.element as HTMLInputElement).value)

const focusRadio = (w: VueWrapper, i: number) => (radios(w)[i].element as HTMLElement).focus()

function group(props: Record<string, unknown> = {}, items: Record<string, unknown>[] = [{ value: 'a' }, { value: 'b' }, { value: 'c' }], attrs: Record<string, unknown> = {}) {
  return mount(RadioCardGroup, {
    props,
    attrs: { 'aria-label': 'Plan', ...attrs },
    slots: { default: () => items.map((p) => h(RadioCard, { key: String(p.value), title: String(p.value), ...p } as never)) },
  })
}

describe('RadioCard / RadioCardGroup', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => {
      expect(Exported).toBe(RadioCard)
      expect(ExportedGroup).toBe(RadioCardGroup)
    })

    it('renders a radiogroup of native radios sharing one generated name', () => {
      const w = group()
      const g = w.find('[data-slot="radio-card-group"]')
      expect(g.attributes('role')).toBe('radiogroup')
      expect(g.attributes('aria-label')).toBe('Plan')
      expect(radios(w)).toHaveLength(3)
      const names = new Set(radios(w).map((r) => r.attributes('name')))
      expect(names.size).toBe(1)
      expect(radios(w)[0].classes()).toContain('sr-only')
      expect(cards(w)[0].element.tagName).toBe('LABEL')
    })

    it('uses the provided name', () => {
      expect(radios(group({ name: 'plan' }))[0].attributes('name')).toBe('plan')
    })

    it('reflects modelValue and emits on selection (controlled)', async () => {
      const w = group({ modelValue: 'a' })
      expect(checkedValues(w)).toEqual(['a'])
      expect(cards(w)[0].attributes('data-state')).toBe('checked')
      await radios(w)[1].trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
      await nextTick()
      await nextTick()
      expect(checkedValues(w)).toEqual(['a']) // rejected: native state restored
      await w.setProps({ modelValue: 'b' })
      expect(checkedValues(w)).toEqual(['b'])
      expect(cards(w)[1].attributes('data-state')).toBe('checked')
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = group({ defaultValue: 'b' })
      expect(checkedValues(w)).toEqual(['b'])
      await radios(w)[2].trigger('click')
      expect(checkedValues(w)).toEqual(['c'])
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['c'])
    })

    it('supports v-model from a parent', async () => {
      const v = ref('a')
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(RadioCardGroup, { modelValue: v.value, 'onUpdate:modelValue': (x: string) => (v.value = x) }, () => [h(RadioCard, { value: 'a', title: 'A' }), h(RadioCard, { value: 'b', title: 'B' })]),
        }),
      )
      await radios(w)[1].trigger('click')
      expect(v.value).toBe('b')
      expect(checkedValues(w)).toEqual(['b'])
    })

    it('does not emit when selecting the already selected value', async () => {
      const w = group({ defaultValue: 'a' })
      await radios(w)[0].trigger('change')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('renders title, description, icon prop, slots and wires aria', () => {
      const w = group({}, [{ value: 'a', title: 'Pro', description: 'Desc', icon: faUser }])
      const r = radios(w)[0]
      expect(w.find(`[id="${r.attributes('aria-labelledby')}"]`).text()).toBe('Pro')
      expect(w.find(`[id="${r.attributes('aria-describedby')}"]`).text()).toBe('Desc')
      expect(w.find('[data-slot="radio-card-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="radio-card-indicator"]').attributes('aria-hidden')).toBe('true')

      const s = mount(RadioCardGroup, {
        slots: {
          default: () =>
            h(RadioCard, { value: 'x' }, { icon: () => h('i', { class: 'ico' }), title: (p: { checked: boolean }) => `T-${p.checked}`, description: () => 'D', default: (p: { checked: boolean }) => `extra-${p.checked}` }),
        },
      })
      expect(s.find('.ico').exists()).toBe(true)
      expect(s.find('[data-slot="radio-card-title"]').text()).toBe('T-false')
      expect(s.text()).toContain('extra-false')
    })
  })

  describe('keyboard (roving)', () => {
    const key = async (w: VueWrapper, i: number, k: string) => {
      focusRadio(w, i)
      await radios(w)[i].trigger('keydown', { key: k })
    }

    it('arrow keys move focus and selection, skipping disabled cards', async () => {
      const w = group({ defaultValue: 'a' }, [{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }])
      await key(w, 0, 'ArrowDown')
      expect(checkedValues(w)).toEqual(['c'])
      expect(document.activeElement).toBe(radios(w)[2].element)
      await key(w, 2, 'ArrowRight')
      expect(checkedValues(w)).toEqual(['a']) // loops
      await key(w, 0, 'ArrowUp')
      expect(checkedValues(w)).toEqual(['c'])
      await key(w, 2, 'ArrowLeft')
      expect(checkedValues(w)).toEqual(['a'])
    })

    it('Home / End jump to the first / last enabled card', async () => {
      const w = group({ defaultValue: 'b' }, [{ value: 'a', disabled: true }, { value: 'b' }, { value: 'c' }, { value: 'd' }])
      await key(w, 1, 'End')
      expect(checkedValues(w)).toEqual(['d'])
      await key(w, 3, 'Home')
      expect(checkedValues(w)).toEqual(['b'])
    })

    it('loop=false clamps at the ends', async () => {
      const w = group({ defaultValue: 'a', loop: false })
      await key(w, 0, 'ArrowUp')
      expect(checkedValues(w)).toEqual(['a'])
      await key(w, 2, 'ArrowDown')
      await key(w, 2, 'ArrowDown')
      expect(checkedValues(w)).toEqual(['c'])
    })

    it('prevents default for handled keys and ignores others', async () => {
      const w = group({ defaultValue: 'a' })
      focusRadio(w, 0)
      const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      radios(w)[0].element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
      const other = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true })
      radios(w)[0].element.dispatchEvent(other)
      expect(other.defaultPrevented).toBe(false)
    })

    it('ignores keydown that does not come from a radio input', async () => {
      const w = group({ defaultValue: 'a' })
      const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      w.find('[data-slot="radio-card-title"]').element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(checkedValues(w)).toEqual(['a'])
    })

    it('does nothing from a disabled-only group and keeps the key from scrolling', async () => {
      const w = group({}, [{ value: 'a', disabled: true }])
      const ev = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
      radios(w)[0].element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('a disabled group never changes value', async () => {
      const w = group({ disabled: true, defaultValue: 'a' })
      focusRadio(w, 1)
      await radios(w)[1].trigger('keydown', { key: 'ArrowDown' })
      await radios(w)[2].trigger('change')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(checkedValues(w)).toEqual(['a'])
    })
  })

  describe('customisation', () => {
    it('merges class last on cards and group', () => {
      const w = group({ class: 'gap-8' }, [{ value: 'a', class: 'rounded-none custom' }])
      expect(w.find('[data-slot="radio-card-group"]').classes()).toContain('gap-8')
      expect(w.find('[data-slot="radio-card-group"]').classes()).not.toContain('gap-3')
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['custom', 'rounded-none']))
      expect(cards(w)[0].classes()).not.toContain('rounded-lg')
    })

    it('forwards attrs to the native input', () => {
      const w = group({}, [{ value: 'a', 'aria-label': 'Custom', 'data-testid': 't' }])
      expect(radios(w)[0].attributes('aria-label')).toBe('Custom')
      expect(radios(w)[0].attributes('data-testid')).toBe('t')
    })

    it('group variant/size cascade and card props override', () => {
      const w = group({ variant: 'filled', size: 'lg' }, [{ value: 'a' }, { value: 'b', variant: 'outline', size: 'sm' }])
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-5']))
      expect(cards(w)[1].classes()).toEqual(expect.arrayContaining(['bg-transparent', 'p-3']))
      expect(radioCardVariants({ variant: 'filled' })).toContain('bg-muted')
    })

    it.each([
      [1, null],
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
      [7, null],
    ])('columns=%s', (columns, expected) => {
      const cls = group({ columns }).find('[data-slot="radio-card-group"]').classes()
      if (expected) expect(cls).toContain(expected)
      else expect(cls.some((c) => c.startsWith('sm:grid-cols'))).toBe(false)
    })

    it('uses round indicator for radios', () => {
      const w = group()
      expect(w.find('[data-slot="radio-card-indicator"]').classes()).toContain('rounded-full')
    })
  })

  describe('bad path', () => {
    it('disabled card is skipped and cannot be selected', async () => {
      const w = group({}, [{ value: 'a' }, { value: 'b', disabled: true }])
      expect(radios(w)[1].attributes('disabled')).toBeDefined()
      expect(cards(w)[1].attributes('data-disabled')).toBeDefined()
      await radios(w)[1].trigger('change')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('group disabled / invalid / required propagate', () => {
      const w = group({ disabled: true, invalid: true, required: true })
      const g = w.find('[data-slot="radio-card-group"]')
      expect(g.attributes('aria-invalid')).toBe('true')
      expect(g.attributes('aria-required')).toBe('true')
      expect(g.attributes('aria-disabled')).toBe('true')
      expect(radios(w)[0].attributes('disabled')).toBeDefined()
      expect(radios(w)[0].attributes('aria-invalid')).toBe('true')
      expect(radios(w)[0].attributes('required')).toBeDefined()
      expect(cards(w)[0].attributes('data-invalid')).toBeDefined()
    })

    it('card-level invalid', () => {
      const w = group({}, [{ value: 'a', invalid: true }, { value: 'b' }])
      expect(radios(w)[0].attributes('aria-invalid')).toBe('true')
      expect(radios(w)[1].attributes('aria-invalid')).toBeUndefined()
    })

    it('a RadioCard outside a group is inert', async () => {
      const w = mount(RadioCard, { props: { value: 'x', title: 'solo' } })
      const r = w.find('input')
      expect(r.attributes('disabled')).toBeDefined()
      await r.trigger('change')
      expect(w.find('[data-slot="radio-card"]').attributes('data-state')).toBe('unchecked')
    })

    it('an unknown modelValue selects nothing', () => {
      expect(checkedValues(group({ modelValue: 'zzz' }))).toEqual([])
    })

    it('an empty-string card value is never checked', () => {
      const w = group({ modelValue: '' }, [{ value: '' }])
      expect(checkedValues(w)).toEqual([])
    })

    it('inherits state from a Field', () => {
      const w = mount(Field, {
        props: { label: 'L', error: 'bad', hint: 'h', disabled: true },
        slots: { default: () => h(RadioCardGroup, null, { default: () => h(RadioCard, { value: 'a', title: 'a' }) }) },
      })
      const g = w.find('[data-slot="radio-card-group"]')
      expect(g.attributes('aria-invalid')).toBe('true')
      expect(g.attributes('aria-describedby')).toBeTruthy()
      expect(g.attributes('id')).toBeTruthy()
      expect(w.find('input').attributes('disabled')).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles 0 and 300 cards', () => {
      expect(mount(RadioCardGroup).findAll('input')).toHaveLength(0)
      const many = Array.from({ length: 300 }, (_, i) => ({ value: `v${i}` }))
      expect(radios(group({}, many))).toHaveLength(300)
    })

    it('handles rapid selection changes', async () => {
      const w = group()
      for (let i = 0; i < 30; i++) await radios(w)[i % 3].trigger('click')
      expect(checkedValues(w)).toEqual(['c'])
      expect(w.emitted('update:modelValue')?.length).toBe(30)
    })

    it('arrow key from a card absent from the enabled list does not throw', async () => {
      const w = group({}, [{ value: 'a', disabled: true }, { value: 'b' }])
      const el = radios(w)[0].element
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('unmount leaves no stray nodes', () => {
      const w = group()
      w.unmount()
      mounted.pop()
      expect(document.querySelectorAll('[data-slot^="radio-card"]')).toHaveLength(0)
    })
  })
})
