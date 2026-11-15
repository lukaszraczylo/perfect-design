import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Switch from './Switch.vue'
import Field from '../Field/Field.vue'

const sw = (w: ReturnType<typeof mount>) => w.find('[data-slot="switch"]')

describe('Switch a11y', () => {
  it('is a role=switch button with aria-checked, named by a Field label', async () => {
    const w = mount(Field, { props: { id: 's', label: 'Notifications', orientation: 'horizontal' }, slots: { default: () => h(Switch) } })
    expect(sw(w).attributes('role')).toBe('switch')
    expect(sw(w).attributes('aria-checked')).toBe('false')
    expect(w.find('label').attributes('for')).toBe('s')
    expect(sw(w).attributes('id')).toBe('s')
    await sw(w).trigger('click')
    expect(sw(w).attributes('aria-checked')).toBe('true')
  })

  it.each(['sm', 'md', 'lg'] as const)('size=%s has an invisible ::after hit area (24px tall, ~44px on touch)', (size) => {
    expect(sw(mount(Switch, { props: { size } })).classes()).toEqual(
      expect.arrayContaining(['relative', 'after:absolute', 'after:-inset-y-1', 'after:inset-x-0', 'pointer-coarse:after:-inset-y-3']),
    )
  })

  it('has forced-colors fallbacks for track, thumb and invalid, and honours reduced motion', () => {
    const w = mount(Switch, { props: { invalid: true } })
    const cls = sw(w).classes().join(' ')
    expect(cls).toContain('forced-colors:data-[state=checked]:bg-[Highlight]')
    expect(cls).toContain('forced-colors:aria-invalid:border-dashed')
    expect(cls).toContain('motion-reduce:transition-none')
    const thumb = w.find('[data-slot="switch-thumb"]').classes().join(' ')
    expect(thumb).toContain('forced-colors:bg-[ButtonText]')
    expect(thumb).toContain('motion-reduce:transition-none')
  })

  it('required: aria-invalid false while valid', () => {
    expect(sw(mount(Switch, { props: { required: true } })).attributes('aria-invalid')).toBe('false')
  })
})
