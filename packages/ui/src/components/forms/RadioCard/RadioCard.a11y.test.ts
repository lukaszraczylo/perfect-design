import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import RadioCard from './RadioCard.vue'
import RadioCardGroup from './RadioCardGroup.vue'
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

describe('RadioCard a11y', () => {
  it('a Field label names the radiogroup through aria-labelledby; hint and error describe it', () => {
    const w = mount(Field, {
      props: { id: 'g', label: 'Plan', hint: 'Pick one', error: 'Required' },
      slots: { default: () => h(RadioCardGroup, null, () => h(RadioCard, { value: 'a', title: 'A' })) },
    })
    const group = w.find('[role="radiogroup"]')
    expect(group.attributes('aria-labelledby')).toBe('g-label')
    expect(group.attributes('aria-describedby')).toBe('g-hint g-error')
    expect(group.attributes('aria-invalid')).toBe('true')
  })

  it('aria-label wins over the Field label; a required, valid group reports aria-invalid=false', () => {
    const own = mount(RadioCardGroup, { attrs: { 'aria-label': 'Own' }, props: { required: true } })
    expect(own.attributes('aria-labelledby')).toBeUndefined()
    expect(own.attributes('aria-required')).toBe('true')
    expect(own.attributes('aria-invalid')).toBe('false')
  })

  it('the card indicator is forced-colors safe and uses the scale radius', () => {
    const w = mount(RadioCardGroup, { props: { defaultValue: 'a' }, slots: { default: () => h(RadioCard, { value: 'a', title: 'A' }) } })
    const indicator = w.find('[data-slot="radio-card-indicator"]')
    expect(indicator.classes()).toContain('rounded-full')
    expect(indicator.classes()).toContain('forced-colors:data-[state=checked]:bg-[Highlight]')
  })
})
