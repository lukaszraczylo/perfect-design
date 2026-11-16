import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import CheckboxCard from './CheckboxCard.vue'
import CheckboxCardGroup from './CheckboxCardGroup.vue'
import { CheckboxCard as Exported, CheckboxCardGroup as ExportedGroup, checkboxCardVariants } from './index'
import { useControllable } from './use-controllable'
import Field from '../Field/Field.vue'

const mounted: VueWrapper[] = []
// jsdom only runs checkbox/radio activation behaviour on connected elements
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, { attachTo: document.body, ...o })
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount
let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper = undefined
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const input = (w: VueWrapper, i = 0) => w.findAll('input[type="checkbox"]')[i]
const root = (w: VueWrapper) => w.find('[data-slot="checkbox-card"]')

describe('CheckboxCard', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => {
      expect(Exported).toBe(CheckboxCard)
      expect(ExportedGroup).toBe(CheckboxCardGroup)
    })

    it('renders a label root with a visually hidden native checkbox', () => {
      const w = mount(CheckboxCard, { props: { title: 'Pro', description: 'All features' } })
      expect(root(w).element.tagName).toBe('LABEL')
      expect(input(w).classes()).toContain('sr-only')
      expect(input(w).attributes('type')).toBe('checkbox')
      expect(root(w).attributes('data-state')).toBe('unchecked')
      expect(w.find('[data-slot="checkbox-card-title"]').text()).toBe('Pro')
      expect(w.find('[data-slot="checkbox-card-description"]').text()).toBe('All features')
      expect(w.find('[data-slot="checkbox-card-indicator"]').attributes('aria-hidden')).toBe('true')
    })

    it('labels the input by title and describes it by description', () => {
      const w = mount(CheckboxCard, { props: { title: 'Pro', description: 'Desc' } })
      const labelledby = input(w).attributes('aria-labelledby')!
      const describedby = input(w).attributes('aria-describedby')!
      expect(w.find(`[id="${labelledby}"]`).text()).toBe('Pro')
      expect(w.find(`[id="${describedby}"]`).text()).toBe('Desc')
    })

    it('omits aria wiring and parts that have no content', () => {
      const w = mount(CheckboxCard)
      expect(input(w).attributes('aria-labelledby')).toBeUndefined()
      expect(input(w).attributes('aria-describedby')).toBeUndefined()
      expect(w.find('[data-slot="checkbox-card-title"]').exists()).toBe(false)
      expect(w.find('[data-slot="checkbox-card-description"]').exists()).toBe(false)
      expect(w.find('[data-slot="checkbox-card-icon"]').exists()).toBe(false)
    })

    it('reflects modelValue and emits on click (controlled stays until parent updates)', async () => {
      const w = mount(CheckboxCard, { props: { modelValue: false, title: 'A' } })
      await input(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([true])
      await nextTick()
      expect((input(w).element as HTMLInputElement).checked).toBe(false)
      expect(root(w).attributes('data-state')).toBe('unchecked')
      await w.setProps({ modelValue: true })
      expect(root(w).attributes('data-state')).toBe('checked')
      expect((input(w).element as HTMLInputElement).checked).toBe(true)
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = mount(CheckboxCard, { props: { defaultValue: true } })
      expect(root(w).attributes('data-state')).toBe('checked')
      await input(w).trigger('click')
      expect(root(w).attributes('data-state')).toBe('unchecked')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('supports v-model from a parent', async () => {
      const on = ref(false)
      wrapper = mount(defineComponent({ setup: () => () => h(CheckboxCard, { modelValue: on.value, 'onUpdate:modelValue': (v: boolean) => (on.value = v), title: 'x' }) }))
      await input(wrapper).trigger('click')
      expect(on.value).toBe(true)
      expect(root(wrapper).attributes('data-state')).toBe('checked')
    })

    it('renders icon prop, icon/title/description slots and default slot with checked scope', async () => {
      const w = mount(CheckboxCard, { props: { icon: faUser, modelValue: true }, slots: { default: ({ checked }: { checked: boolean }) => `extra-${checked}` } })
      expect(w.find('[data-slot="checkbox-card-icon"] svg').exists()).toBe(true)
      expect(w.text()).toContain('extra-true')
      const s = mount(CheckboxCard, {
        slots: {
          icon: '<i class="my-icon">i</i>',
          title: ({ checked }: { checked: boolean }) => `T-${checked}`,
          description: 'D-slot',
        },
      })
      expect(s.find('.my-icon').exists()).toBe(true)
      expect(s.find('[data-slot="checkbox-card-title"]').text()).toBe('T-false')
      expect(s.find('[data-slot="checkbox-card-description"]').text()).toBe('D-slot')
    })

    it('submits name and value natively', () => {
      const w = mount(CheckboxCard, { props: { name: 'plan', value: 'pro' } })
      expect(input(w).attributes('name')).toBe('plan')
      expect(input(w).attributes('value')).toBe('pro')
    })
  })

  describe('customisation', () => {
    it('merges class last on the root', () => {
      const w = mount(CheckboxCard, { props: { class: 'rounded-none custom' } })
      expect(root(w).classes()).toContain('custom')
      expect(root(w).classes()).toContain('rounded-none')
      expect(root(w).classes()).not.toContain('rounded-lg')
    })

    it('forwards attrs to the native input', () => {
      const w = mount(CheckboxCard, { attrs: { 'aria-label': 'Custom', 'data-testid': 'x', id: 'my-id' } })
      expect(input(w).attributes('aria-label')).toBe('Custom')
      expect(input(w).attributes('data-testid')).toBe('x')
      expect(input(w).attributes('id')).toBe('my-id')
      expect(root(w).attributes('data-testid')).toBeUndefined()
    })

    it('applies variant and size classes', () => {
      expect(root(mount(CheckboxCard)).classes()).toEqual(expect.arrayContaining(['bg-transparent', 'p-4']))
      const filled = mount(CheckboxCard, { props: { variant: 'filled', size: 'lg' } })
      expect(root(filled).classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-5']))
      expect(root(mount(CheckboxCard, { props: { size: 'sm' } })).classes()).toContain('p-3')
    })

    it('exposes variants for reuse', () => {
      expect(checkboxCardVariants({ variant: 'filled' })).toContain('bg-muted')
      expect(checkboxCardVariants()).toContain('bg-transparent')
    })

    it('uses only tokens (no hard-coded colours)', () => {
      const w = mount(CheckboxCard, { props: { title: 'a', invalid: true } })
      expect(w.html()).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(/i)
    })
  })

  describe('bad path', () => {
    it('disabled: native input disabled, no emit, data-disabled set', async () => {
      const w = mount(CheckboxCard, { props: { disabled: true } })
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(root(w).attributes('data-disabled')).toBeDefined()
      await input(w).trigger('change')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('invalid: aria-invalid and data-invalid', () => {
      const w = mount(CheckboxCard, { props: { invalid: true, required: true } })
      expect(input(w).attributes('aria-invalid')).toBe('true')
      expect(root(w).attributes('data-invalid')).toBeDefined()
      expect(input(w).attributes('required')).toBeDefined()
    })

    it('unknown variant/size fall back without throwing', () => {
      const w = mount(CheckboxCard, { props: { variant: 'nope' as never, size: 'huge' as never } })
      expect(root(w).exists()).toBe(true)
    })

    it('without a group value it behaves standalone even inside a group', async () => {
      const w = mount(CheckboxCardGroup, { slots: { default: () => h(CheckboxCard, { title: 'solo' }) } })
      await input(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(root(w).attributes('data-state')).toBe('checked')
    })

    it('inherits invalid, disabled and required from a surrounding Field', () => {
      const w = mount(Field, { props: { label: 'x', error: 'bad', disabled: true, required: true }, slots: { default: () => h(CheckboxCard, { title: 't' }) } })
      const i = w.find('input[type="checkbox"]')
      expect(i.attributes('aria-invalid')).toBe('true')
      expect(i.attributes('disabled')).toBeDefined()
      expect(i.attributes('required')).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles rapid toggles', async () => {
      const w = mount(CheckboxCard)
      for (let i = 0; i < 25; i++) await input(w).trigger('click')
      expect(w.emitted('update:modelValue')).toHaveLength(25)
      expect(root(w).attributes('data-state')).toBe('checked')
    })

    it('handles unicode, RTL and very long titles', () => {
      const long = 'x'.repeat(10_000)
      const w = mount(CheckboxCard, { props: { title: `مرحبا 🚀 ${long}` } })
      expect(w.find('[data-slot="checkbox-card-title"]').text()).toContain('مرحبا 🚀')
    })

    it('ignores non-element invalid icon objects', () => {
      const w = mount(CheckboxCard, { props: { icon: {} as never } })
      expect(w.find('[data-slot="checkbox-card-icon"] svg').exists()).toBe(false)
    })
  })
})

describe('CheckboxCardGroup', () => {
  const make = (props: Record<string, unknown> = {}, cardProps: Record<string, unknown>[] = [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }]) =>
    mount(CheckboxCardGroup, {
      props,
      attrs: { 'aria-label': 'Options' },
      slots: { default: () => cardProps.map((p, i) => h(CheckboxCard, { key: i, title: String(p.value), ...p })) },
    })

  it('renders a labelled group role with default 1 column', () => {
    const w = make()
    const g = w.find('[data-slot="checkbox-card-group"]')
    expect(g.attributes('role')).toBe('group')
    expect(g.attributes('aria-label')).toBe('Options')
    expect(g.classes()).toContain('grid-cols-1')
    wrapper = w
  })

  it('toggles values in the array (controlled) and emits new arrays', async () => {
    const w = make({ modelValue: ['a'] })
    expect((input(w, 0).element as HTMLInputElement).checked).toBe(true)
    await input(w, 1).trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
    await input(w, 0).trigger('click')
    expect(w.emitted('update:modelValue')?.[1]).toEqual([[]])
    wrapper = w
  })

  it('works uncontrolled with defaultValue and de-duplicates / drops non-strings', async () => {
    const w = make({ defaultValue: ['a', 'a', 5 as never] })
    expect(w.findAll('[data-state="checked"][data-slot="checkbox-card"]')).toHaveLength(1)
    await input(w, 1).trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
    wrapper = w
  })

  it('treats a non-array modelValue as empty', () => {
    const w = make({ modelValue: 'oops' as never })
    expect(w.findAll('[data-state="checked"][data-slot="checkbox-card"]')).toHaveLength(0)
    wrapper = w
  })

  it('propagates disabled, invalid, variant, size, name; card props override', () => {
    const w = make({ disabled: true, invalid: true, variant: 'filled', size: 'lg', name: 'n' }, [{ value: 'a' }, { value: 'b', variant: 'outline', size: 'sm' }])
    expect(input(w, 0).attributes('disabled')).toBeDefined()
    expect(input(w, 0).attributes('aria-invalid')).toBe('true')
    expect(input(w, 0).attributes('name')).toBe('n')
    expect(root(w).classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-5']))
    const second = w.findAll('[data-slot="checkbox-card"]')[1]
    expect(second.classes()).toEqual(expect.arrayContaining(['bg-transparent', 'p-3']))
    // aria-invalid is not allowed on role=group: the invalid state lives on each card's native input
    expect(w.find('[data-slot="checkbox-card-group"]').attributes('aria-invalid')).toBeUndefined()
    wrapper = w
  })

  it('a disabled card cannot be toggled', async () => {
    const w = make()
    await input(w, 2).trigger('change')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    wrapper = w
  })

  it.each([
    [1, null],
    [2, 'sm:grid-cols-2'],
    [3, 'lg:grid-cols-3'],
    [4, 'lg:grid-cols-4'],
    [9, null],
  ])('columns=%s', (columns, expected) => {
    const w = make({ columns })
    const cls = w.find('[data-slot="checkbox-card-group"]').classes()
    if (expected) expect(cls).toContain(expected)
    else expect(cls.some((c) => c.startsWith('sm:grid-cols') || c.startsWith('lg:grid-cols'))).toBe(false)
    wrapper = w
  })

  it('merges class last', () => {
    const w = make({ class: 'gap-8' })
    expect(w.find('[data-slot="checkbox-card-group"]').classes()).toContain('gap-8')
    expect(w.find('[data-slot="checkbox-card-group"]').classes()).not.toContain('gap-3')
    wrapper = w
  })

  it('handles 0 and many cards', () => {
    expect(mount(CheckboxCardGroup).findAll('input')).toHaveLength(0)
    const many = Array.from({ length: 300 }, (_, i) => ({ value: `v${i}` }))
    const w = make({}, many)
    expect(w.findAll('input')).toHaveLength(300)
    wrapper = w
  })

  it('wires Field id and describedby onto the group', () => {
    const w = mount(Field, {
      props: { label: 'L', hint: 'H' },
      slots: { default: () => h(CheckboxCardGroup, null, { default: () => h(CheckboxCard, { value: 'a', title: 'a' }) }) },
    })
    const g = w.find('[data-slot="checkbox-card-group"]')
    expect(g.attributes('id')).toBeTruthy()
    expect(g.attributes('aria-describedby')).toBeTruthy()
  })

  it('ignores a toggle that does not change membership', async () => {
    const w = make({ modelValue: ['a'] })
    // checked state already matches: native change with the same state must not emit
    const el = input(w, 0).element as HTMLInputElement
    el.checked = true
    await input(w, 0).trigger('change')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    wrapper = w
  })
})

describe('useControllable', () => {
  it('falls back to the internal value when the model is undefined', () => {
    const seen: number[] = []
    const c = useControllable<number>(() => undefined, 1, (v) => seen.push(v))
    expect(c.value.value).toBe(1)
    c.set(2)
    expect(c.value.value).toBe(2)
    expect(seen).toEqual([2])
  })
  it('follows the model when defined', () => {
    const c = useControllable<number>(() => 5, 1, () => {})
    c.set(9)
    expect(c.value.value).toBe(5)
  })
})

describe('Field required and wiring', () => {
  const grouped = (required: boolean, modelValue?: string[]) =>
    mount(
      defineComponent({
        render: () =>
          h(Field, { label: 'Pick', required }, () =>
            h(CheckboxCardGroup, { modelValue, name: 'k' }, () => [h(CheckboxCard, { value: 'a', title: 'A' }), h(CheckboxCard, { value: 'b', title: 'B' })]),
          ),
      }),
    )

  // aria-required is not allowed on role=group (ARIA 1.2), so each checkbox carries the required state while none is checked.
  it('group in a required Field: native required on every card only while nothing is checked, none on the group', async () => {
    const w = grouped(true, [])
    expect(w.find('[data-slot=checkbox-card-group]').attributes('aria-required')).toBeUndefined()
    expect(w.findAll('input').every((i) => i.attributes('required') !== undefined)).toBe(true)
    const w2 = grouped(true, ['a'])
    expect(w2.findAll('input').every((i) => i.attributes('required') === undefined)).toBe(true)
  })

  it('group in a non-required Field has no aria-required or native required', () => {
    const w = grouped(false, [])
    expect(w.find('[data-slot=checkbox-card-group]').attributes('aria-required')).toBeUndefined()
    expect(w.findAll('input').every((i) => i.attributes('required') === undefined)).toBe(true)
  })

  it('a lone card in a required Field keeps native required and gets the Field id and description', () => {
    const w = mount(
      defineComponent({
        render: () => h(Field, { label: 'Terms', required: true, hint: 'Read first' }, () => h(CheckboxCard, { title: 'Accept' })),
      }),
    )
    const el = input(w)
    expect(el.attributes('required')).toBeDefined()
    expect(el.attributes('id')).toBe(w.find('label[for]').attributes('for'))
    expect(el.attributes('aria-describedby')).toContain(`${el.attributes('id')}-hint`)
  })
})
