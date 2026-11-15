import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import Label from '../Label/Label.vue'
import Switch from './Switch.vue'

const { errors, mountTree } = useStrictHarness()

describe('Switch contract', () => {
  it('throws when nothing names the switch, saying how to fix it', async () => {
    await mountTree(() => h(Switch))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('Switch: needs an accessible name')
    expect(errors[0].message).toContain('Field')
    expect(errors[0].message).toContain('aria-label')
  })
  it.each([
    ['the label prop', () => h(Switch, { label: 'Notifications' })],
    ['the label slot', () => h(Switch, null, { label: () => 'Notifications' })],
    ['the label prop with every variation', () => h(Switch, { label: 'Notifications', description: 'Sent daily.', tone: 'info', showIcons: true, labelPosition: 'start', size: 'lg' })],
    ['aria-label', () => h(Switch, { 'aria-label': 'Notifications' })],
    ['aria-labelledby', () => [h('span', { id: 'n' }, 'Notifications'), h(Switch, { 'aria-labelledby': 'n' })]],
    ['a Field label prop', () => h(Field, { label: 'Notifications', orientation: 'horizontal' }, () => h(Switch))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Notifications', default: () => h(Switch) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Notifications'), default: () => h(Switch) })],
    ['a Label for the id', () => [h(Label, { for: 's' }, () => 'Notifications'), h(Switch, { id: 's' })]],
    ['a wrapping label', () => h('label', null, ['Notifications', h(Switch)])],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it.each([
    ['tone', { tone: 'success' }],
    ['showIcons', { showIcons: true }],
    ['label position', { labelPosition: 'start' }],
    ['description (no label)', { description: 'Hint' }],
    ['tone, size and icons together', { tone: 'neutral', size: 'lg', showIcons: true }],
  ])('still throws without a name when only the %s is set', async (_n, props) => {
    await mountTree(() => h(Switch, props as never))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Switch: needs an accessible name')
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(Switch))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Switch: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(Switch))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
