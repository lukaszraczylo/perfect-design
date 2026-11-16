import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import Button from '../../primitives/Button/Button.vue'
import Field from '../Field/Field.vue'
import Input from '../Input/Input.vue'
import Textarea from '../Textarea/Textarea.vue'
import NativeSelect from '../NativeSelect/NativeSelect.vue'
import InputGroup from './InputGroup.vue'
import InputGroupAddon from './InputGroupAddon.vue'
import { inputGroupAddonVariants, inputGroupVariants } from './variants'
import * as barrel from './index'

let wrappers: VueWrapper[] = []
function group(props: Record<string, unknown> = {}, slots?: () => unknown[]) {
  const w = mount(InputGroup, {
    props,
    slots: { default: slots ?? (() => [h(InputGroupAddon, null, () => 'https://'), h(Input, { 'aria-label': 'Site' }), h(InputGroupAddon, null, () => '.com')]) },
    attachTo: document.body,
  })
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
})

describe('InputGroup: structure', () => {
  it('renders a plain container with the data-slots and children in order', () => {
    const w = group()
    expect(w.attributes('data-slot')).toBe('input-group')
    expect(w.attributes('data-layout')).toBe('inset')
    expect(w.attributes('role')).toBeUndefined()
    const kids = [...w.element.children].map((c) => c.getAttribute('data-slot'))
    expect(kids).toEqual(['input-group-addon', 'input', 'input-group-addon'])
    expect(w.findAll('[data-slot="input-group-addon"]').map((a) => a.text())).toEqual(['https://', '.com'])
  })
  it('the default group has the inset surface, border, shared focus and invalid selectors', () => {
    const c = group().classes()
    expect(c).toEqual(expect.arrayContaining(['relative', 'flex', 'w-full', 'min-w-0', 'items-center', 'gap-2', 'border', 'border-input', 'rounded-md', 'px-3', 'shadow-xs', 'min-h-9', 'pointer-coarse:min-h-11']))
    const joined = c.join(' ')
    expect(joined).toContain('has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-3')
    expect(joined).toContain('has-[[aria-invalid=true]]:border-destructive')
    expect(joined).toContain('forced-colors:has-[[aria-invalid=true]]:border-dashed')
    expect(joined).toContain('[&_input]:border-0!')
    // the group draws the focus indicator; the inner border colour follows it (width 0) so the control itself also reports focus
    expect(joined).toContain('[&_input:focus-visible]:border-ring!')
    expect(group({ status: 'error' }).classes().join(' ')).toContain('[&_input:focus-visible]:border-ring!')
    expect(group({ layout: 'joined' }).classes().join(' ')).not.toContain('[&_input:focus-visible]:border-ring!')
  })
  it('exports the variants and parts from the barrel', () => {
    expect(Object.keys(barrel).sort()).toEqual(['InputGroup', 'InputGroupAddon', 'inputGroupAddonVariants', 'inputGroupVariants'])
    expect(inputGroupVariants()).toContain('rounded-md')
    expect(inputGroupAddonVariants()).toContain('text-muted-foreground')
  })
  it('works with a Field: the label, id and describedby still reach the Input inside', () => {
    const w = mount(Field, { props: { label: 'Website', hint: 'Without the scheme.' }, slots: { default: () => h(InputGroup, null, () => [h(InputGroupAddon, null, () => 'https://'), h(Input)]) }, attachTo: document.body })
    wrappers.push(w)
    const input = w.find('input')
    expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toContain('hint')
  })
  it('a Field error marks the Input invalid, which the group border follows through :has', () => {
    const w = mount(Field, { props: { label: 'Website', error: 'Required' }, slots: { default: () => h(InputGroup, null, () => h(Input)) }, attachTo: document.body })
    wrappers.push(w)
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })
  it('empty slot renders an empty group without errors', () => {
    const w = mount(InputGroup)
    wrappers.push(w)
    expect(w.element.children).toHaveLength(0)
  })
})

describe('InputGroup: variations', () => {
  it.each([
    ['filled', ['bg-muted', 'dark:bg-card']],
    ['underline', ['border-0', 'border-b', 'rounded-none', 'px-0', 'forced-colors:border-b-[ButtonText]']],
    ['ghost', ['border-transparent', 'bg-transparent', 'hover:border-input', 'forced-colors:border-[ButtonText]']],
  ])('variant %s', (variant, expected) => {
    const w = group({ variant })
    expect(w.classes()).toEqual(expect.arrayContaining(expected))
    expect(w.classes().join(' ')).toContain('has-[input:focus-visible,textarea:focus-visible,select:focus-visible]')
  })
  it.each([
    ['xs', 'min-h-7'],
    ['sm', 'min-h-8'],
    ['lg', 'min-h-11'],
  ])('size %s', (size, cls) => {
    const c = group({ size }).classes()
    expect(c).toContain(cls)
    expect(c).not.toContain('min-h-9')
  })
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s', (shape, cls) => {
    const c = group({ shape }).classes()
    expect(c).toContain(cls)
    expect(c).not.toContain('rounded-md')
  })
  it('unknown values fall back to the defaults', () => {
    const base = group().attributes('class')
    expect(group({ variant: 'x', size: 'x', shape: 'x', status: 'x', layout: 'x' }).attributes('class')).toBe(base)
    expect(group({ layout: 'x' }).attributes('data-layout')).toBe('inset')
  })
  it('class wins over variant classes', () => {
    const c = group({ variant: 'filled', class: 'bg-card w-48' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-card', 'w-48']))
    expect(c).not.toContain('bg-muted')
    expect(c).not.toContain('w-full')
  })
  it('variant, shape, size and status combine without conflict', () => {
    const c = group({ variant: 'filled', shape: 'pill', size: 'lg', status: 'success' }).classes()
    expect(c).toEqual(expect.arrayContaining(['bg-muted', 'rounded-full', 'min-h-11', 'border-success']))
  })
  it('underline wins over pill (no radius, no side padding)', () => {
    const c = group({ variant: 'underline', shape: 'pill' }).classes()
    expect(c).toContain('rounded-none')
    expect(c).toContain('px-0')
    expect(c).not.toContain('rounded-full')
  })
})

describe('InputGroup: status', () => {
  it.each([
    ['success', 'border-success'],
    ['warning', 'border-warning-foreground'],
    ['error', 'border-destructive'],
  ])('%s colours the border and adds an icon after the control', (status, cls) => {
    const w = group({ status })
    expect(w.classes()).toContain(cls)
    const icon = w.find('[data-slot="field-status"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-status')).toBe(status)
    expect(icon.find('svg').attributes('aria-hidden')).toBe('true')
    expect(icon.classes()).toEqual(expect.arrayContaining(['static', 'shrink-0']))
    expect(w.element.lastElementChild).toBe(icon.element)
  })
  it('success and warning carry hidden text, error does not', () => {
    expect(group({ status: 'success' }).find('[data-slot="field-status"] .sr-only').text()).toBe('Valid')
    expect(group({ status: 'warning', statusLabel: 'Check this' }).find('[data-slot="field-status"] .sr-only').text()).toBe('Check this')
    expect(group({ status: 'error' }).find('[data-slot="field-status"] .sr-only').exists()).toBe(false)
  })
  it('no icon by default', () => expect(group().find('[data-slot="field-status"]').exists()).toBe(false))
  it('a joined group takes no status of its own', () => {
    const w = group({ layout: 'joined', status: 'error' })
    expect(w.find('[data-slot="field-status"]').exists()).toBe(false)
    expect(w.classes()).not.toContain('border-destructive')
  })
})

describe('InputGroup: joined layout', () => {
  const joined = (props: Record<string, unknown> = {}) =>
    group({ layout: 'joined', ...props }, () => [h(Input, { 'aria-label': 'Email' }), h(Button, null, () => 'Subscribe')])
  it('draws no surface and squares the touching edges', () => {
    const w = joined()
    expect(w.attributes('data-layout')).toBe('joined')
    const c = w.classes()
    expect(c).toEqual(expect.arrayContaining(['items-stretch', 'px-0', 'rounded-none', 'min-h-0']))
    expect(c).not.toContain('border')
    expect(c).not.toContain('gap-2')
    const j = c.join(' ')
    expect(j).toContain('[&>*]:rounded-none!')
    expect(j).toContain('[&>*+*]:-ms-px')
    expect(j).toContain('[&>:first-child]:rounded-s-md!')
    expect(j).toContain('[&>:last-child]:rounded-e-md!')
  })
  it('pill rounds only the outer edges fully; square rounds none', () => {
    expect(joined({ shape: 'pill' }).classes().join(' ')).toContain('[&>:first-child]:rounded-s-full!')
    const sq = joined({ shape: 'square' }).classes().join(' ')
    expect(sq).not.toContain('rounded-s-md')
    expect(sq).not.toContain('rounded-s-full')
  })
  it('keeps the children interactive and the button focusable', () => {
    const w = joined()
    expect(w.find('input').exists()).toBe(true)
    expect(w.find('button').text()).toBe('Subscribe')
  })
  it('addons in a joined group get their own border and fill', () => {
    const w = group({ layout: 'joined' }, () => [h(InputGroupAddon, null, () => '$'), h(Input, { 'aria-label': 'Amount' })])
    const a = w.find('[data-slot="input-group-addon"]').classes()
    expect(a).toEqual(expect.arrayContaining(['border', 'border-input', 'bg-muted', 'px-3']))
  })
})

describe('InputGroupAddon', () => {
  it('muted text by default, as a div', () => {
    const w = mount(InputGroupAddon, { slots: { default: 'USD' } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'shrink-0', 'items-center', 'text-sm', 'text-muted-foreground', 'has-[>button]:-mx-2']))
    expect(w.attributes('data-slot')).toBe('input-group-addon')
  })
  it('as swaps the element; class wins; attrs fall through', () => {
    const w = mount(InputGroupAddon, { props: { as: 'span', class: 'text-foreground' }, attrs: { 'data-x': '1', id: 'a' }, slots: { default: 'x' } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.classes()).toContain('text-foreground')
    expect(w.classes()).not.toContain('text-muted-foreground')
    expect(w.attributes('data-x')).toBe('1')
  })
  it('standalone (no group) behaves as inset; empty slot is fine', () => {
    const w = mount(InputGroupAddon)
    expect(w.classes()).toContain('has-[>button]:-mx-2')
    expect(w.text()).toBe('')
  })
  it('a Button inside keeps its own name and focus', () => {
    const w = group({}, () => [h(Input, { 'aria-label': 'Code' }), h(InputGroupAddon, null, () => h(Button, { size: 'xs', variant: 'ghost' }, () => 'Apply'))])
    const b = w.find('[data-slot="input-group-addon"] button')
    expect(b.text()).toBe('Apply')
    expect(b.attributes('type')).toBe('button')
  })
})

describe('InputGroup: status reaches the inner control', () => {
  const inner = (tag: 'input' | 'textarea' | 'select') => (document.body.querySelector(`[data-slot=input-group] ${tag}`) as HTMLElement)
  const slotOf = (control: ReturnType<typeof h>) => () => [h(InputGroupAddon, null, () => '@'), control]

  it.each([
    ['input', () => h(Input, { 'aria-label': 'x' })],
    ['textarea', () => h(Textarea, { 'aria-label': 'x' })],
    ['select', () => h(NativeSelect, { 'aria-label': 'x', options: [{ value: 'a', label: 'A' }] })],
  ] as const)('status="error" sets aria-invalid on the inner %s', (tag, make) => {
    group({ status: 'error' }, slotOf(make()))
    expect(inner(tag).getAttribute('aria-invalid')).toBe('true')
  })

  it('success text id is in the inner control aria-describedby', () => {
    const w = group({ status: 'success' }, slotOf(h(Input, { 'aria-label': 'x' })))
    const id = w.find('[data-slot=field-status] .sr-only').attributes('id')!
    expect(inner('input').getAttribute('aria-describedby')).toContain(id)
  })

  it('a consumer class overrides the inner focus classes', () => {
    const w = group({ class: '[&_input:focus-visible]:border-foreground!' })
    const cls = w.attributes('class')!
    expect(cls).toContain('[&_input:focus-visible]:border-foreground!')
    expect(cls).not.toContain('[&_input:focus-visible]:border-ring!')
  })

  it('InputGroupAddon supports asChild', () => {
    const w = mount(InputGroupAddon, { props: { asChild: true }, slots: { default: () => h('label', { id: 'l' }, 'Site') }, attachTo: document.body })
    wrappers.push(w)
    expect(w.element.tagName).toBe('LABEL')
    expect(w.attributes('data-slot')).toBe('input-group-addon')
  })
})
