import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import CheckboxCard from './CheckboxCard.vue'
import CheckboxCardGroup from './CheckboxCardGroup.vue'
import { checkboxCardVariants } from './variants'
import Field from '../Field/Field.vue'

const mounted: VueWrapper[] = []
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, { attachTo: document.body, ...o })
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

describe('CheckboxCard a11y', () => {
  it('a Field label names the group through aria-labelledby; aria-label wins when given', () => {
    const w = mount(Field, { props: { id: 'g', label: 'Channels', hint: 'Pick any' }, slots: { default: () => h(CheckboxCardGroup, null, () => h(CheckboxCard, { value: 'a', title: 'A' })) } })
    const group = w.find('[data-slot="checkbox-card-group"]')
    expect(group.attributes('role')).toBe('group')
    expect(group.attributes('aria-labelledby')).toBe('g-label')
    expect(group.attributes('aria-describedby')).toBe('g-hint')
    const own = mount(CheckboxCardGroup, { attrs: { 'aria-label': 'Own' } })
    expect(own.attributes('aria-labelledby')).toBeUndefined()
    expect(own.attributes('aria-label')).toBe('Own')
  })

  it('never puts aria-invalid on the role=group (not allowed there): invalid lives on each input', () => {
    const w = mount(CheckboxCardGroup, { props: { invalid: true }, slots: { default: () => h(CheckboxCard, { value: 'a', title: 'A' }) } })
    expect(w.attributes('aria-invalid')).toBeUndefined()
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('uses scale radius and forced-colors fallbacks (focus outline, checked border, dashed invalid, indicator fill)', () => {
    const w = mount(CheckboxCard, { props: { title: 'A', defaultValue: true } })
    const indicator = w.find('[data-slot="checkbox-card-indicator"]')
    expect(indicator.classes()).toContain('rounded-sm')
    expect(indicator.classes().join(' ')).not.toMatch(/rounded-\[/)
    expect(indicator.classes()).toContain('forced-colors:data-[state=checked]:bg-[Highlight]')
    const surface = checkboxCardVariants()
    for (const c of ['forced-colors:has-focus-visible:outline-2', 'forced-colors:data-[state=checked]:border-[Highlight]', 'forced-colors:data-[invalid]:border-dashed']) {
      expect(surface).toContain(c)
    }
  })
})
