import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import DatePicker from './DatePicker.vue'
import Field from '../Field/Field.vue'
import { createDate } from '../Calendar/dateMath'
import { datePickerVariants } from './variants'
import * as barrel from './index'

const d = (y: number, m: number, day: number) => createDate(y, m - 1, day)
type Props = Record<string, unknown>

let wrappers: VueWrapper[] = []
function mountPicker(props: Props = {}, attrs: Props = {}) {
  const w = mount(DatePicker, { props: { locale: 'en-US', weekStart: 0, ...props }, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="date-picker-trigger"]')
const content = (w: VueWrapper) => w.find('[data-slot="date-picker-content"]')
const day = (w: VueWrapper, date: string) => w.find(`[data-slot="calendar-day"][data-date="${date}"]`)
const activeDate = () => (document.activeElement as HTMLElement | null)?.getAttribute('data-date')
const pointerDown = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
async function open(w: VueWrapper) {
  await trigger(w).trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 1, 15, 10, 30))
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('DatePicker: rendering', () => {
  it('renders a closed input-like trigger with placeholder and data-slots', () => {
    const w = mountPicker()
    expect(w.attributes('data-slot')).toBe('date-picker')
    expect(w.attributes('data-state')).toBe('closed')
    expect(trigger(w).element.tagName).toBe('BUTTON')
    expect(trigger(w).attributes('type')).toBe('button')
    expect(trigger(w).text()).toBe('Pick a date')
    expect(trigger(w).attributes('data-placeholder')).toBeDefined()
    expect(trigger(w).attributes('aria-haspopup')).toBe('dialog')
    expect(trigger(w).attributes('aria-expanded')).toBe('false')
    expect(trigger(w).attributes('aria-controls')).toBeUndefined()
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="date-picker-icon"]').attributes('aria-hidden')).toBe('true')
  })

  it('formats the value with Intl (default medium, custom format, locale)', async () => {
    const w = mountPicker({ modelValue: d(2024, 2, 29) })
    expect(trigger(w).text()).toBe('Feb 29, 2024')
    expect(trigger(w).attributes('data-placeholder')).toBeUndefined()
    await w.setProps({ format: { dateStyle: 'full' } })
    expect(trigger(w).text()).toBe('Thursday, February 29, 2024')
    await w.setProps({ format: { year: 'numeric', month: '2-digit', day: '2-digit' } })
    expect(trigger(w).text()).toBe('02/29/2024')
    await w.setProps({ locale: 'de-DE', format: { dateStyle: 'long' } })
    expect(trigger(w).text()).toBe('29. Februar 2024')
  })

  it('custom placeholder', () => {
    expect(trigger(mountPicker({ placeholder: 'Departure' })).text()).toBe('Departure')
  })

  it('bad format options fall back instead of throwing', () => {
    const w = mountPicker({ modelValue: d(2024, 2, 10), format: { dateStyle: 'short', year: 'numeric' } })
    expect(trigger(w).text()).toContain('2024')
  })

  it('invalid / wrong-typed modelValue shows the placeholder', () => {
    for (const bad of [new Date('nope'), '2024-01-01', 12345, {}, null]) {
      expect(trigger(mountPicker({ modelValue: bad })).text()).toBe('Pick a date')
    }
  })

  it('follows controlled modelValue changes', async () => {
    const w = mountPicker({ modelValue: d(2024, 2, 1) })
    await w.setProps({ modelValue: d(2025, 5, 5) })
    expect(trigger(w).text()).toBe('May 5, 2025')
    await w.setProps({ modelValue: null })
    expect(trigger(w).text()).toBe('Pick a date')
  })
})

describe('DatePicker: opening and selecting', () => {
  it('click opens a dialog with a Calendar and moves focus to the roving day', async () => {
    const w = mountPicker()
    await open(w)
    expect(w.attributes('data-state')).toBe('open')
    expect(content(w).attributes('role')).toBe('dialog')
    expect(content(w).attributes('aria-label')).toBe('Choose date')
    expect(trigger(w).attributes('aria-expanded')).toBe('true')
    expect(trigger(w).attributes('aria-controls')).toBe(content(w).attributes('id'))
    expect(w.find('[data-slot="calendar"]').attributes('data-variant')).toBe('ghost')
    expect(activeDate()).toBe('2024-02-15')
  })

  it('opens on the month of the current value and marks it selected', async () => {
    const w = mountPicker({ modelValue: d(2023, 11, 7) })
    await open(w)
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('November 2023')
    expect(day(w, '2023-11-07').attributes('data-selected')).toBe('true')
    expect(activeDate()).toBe('2023-11-07')
  })

  it('picking a day emits the Date, closes, returns focus and shows the text (uncontrolled)', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-20').trigger('click')
    await flushPromises()
    const v = w.emitted('update:modelValue')![0][0] as Date
    expect(v.getFullYear() * 10000 + (v.getMonth() + 1) * 100 + v.getDate()).toBe(20240220)
    expect(content(w).exists()).toBe(false)
    expect(trigger(w).text()).toBe('Feb 20, 2024')
    expect(document.activeElement).toBe(trigger(w).element)
    expect(w.emitted('update:open')!.map((e) => e[0])).toEqual([true, false])
  })

  it('re-picking the current day closes without a model update', async () => {
    const w = mountPicker({ modelValue: d(2024, 2, 10) })
    await open(w)
    await day(w, '2024-02-10').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(content(w).exists()).toBe(false)
  })

  it('ArrowDown on the trigger opens; clicking again closes', async () => {
    const w = mountPicker()
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    await trigger(w).trigger('click')
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('ArrowDown while already open does nothing harmful', async () => {
    const w = mountPicker()
    await open(w)
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(content(w).exists()).toBe(true)
    expect(w.emitted('update:open')).toHaveLength(1)
  })

  it('rapid toggling ends in a consistent state', async () => {
    const w = mountPicker()
    for (let i = 0; i < 11; i++) await trigger(w).trigger('click')
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    expect(w.findAll('[data-slot="date-picker-content"]')).toHaveLength(1)
  })

  it('passes min/max/isDateDisabled/weekStart/size to the Calendar; disabled days keep it open', async () => {
    const w = mountPicker({ min: d(2024, 2, 10), max: d(2024, 2, 20), isDateDisabled: (x: Date) => x.getDate() === 12, weekStart: 1, size: 'lg' })
    await open(w)
    expect(day(w, '2024-02-09').attributes('aria-disabled')).toBe('true')
    expect(day(w, '2024-02-12').attributes('aria-disabled')).toBe('true')
    expect(day(w, '2024-02-11').attributes('aria-disabled')).toBeUndefined()
    expect(w.find('[role="columnheader"]').text()).toBe('Mon')
    expect(w.find('[data-slot="calendar"]').attributes('data-size')).toBe('lg')
    await day(w, '2024-02-12').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(content(w).exists()).toBe(true)
  })
})

describe('DatePicker: closing', () => {
  it('Escape closes, returns focus to the trigger and stops propagation', async () => {
    const outer = vi.fn()
    const w = mountPicker()
    document.body.addEventListener('keydown', outer)
    await open(w)
    await day(w, '2024-02-15').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
    expect(outer).not.toHaveBeenCalled()
    await trigger(w).trigger('keydown', { key: 'Escape' }) // closed: bubbles normally
    expect(outer).toHaveBeenCalledTimes(1)
    document.body.removeEventListener('keydown', outer)
  })

  it('other keys do not close', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-15').trigger('keydown', { key: 'Enter' })
    expect(content(w).exists()).toBe(true)
  })

  it('pointer down outside closes; inside does not', async () => {
    const w = mountPicker()
    await open(w)
    pointerDown(day(w, '2024-02-10').element)
    pointerDown(trigger(w).element)
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    pointerDown(document.body)
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })

  it('registers the document listener only while open and removes it on close and unmount', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const count = (spy: typeof add) => spy.mock.calls.filter((c) => c[0] === 'pointerdown').length
    const w = mountPicker()
    expect(count(add)).toBe(0)
    await open(w)
    expect(count(add)).toBe(1)
    await trigger(w).trigger('click')
    await flushPromises()
    const removedAfterClose = count(remove)
    expect(removedAfterClose).toBeGreaterThanOrEqual(2) // re-armed then cleared
    pointerDown(document.body)
    expect(w.emitted('update:open')!.map((e) => e[0])).toEqual([true, false]) // no extra close emitted
    await open(w)
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(count(remove)).toBeGreaterThan(removedAfterClose)
    expect(() => pointerDown(document.body)).not.toThrow()
  })

  it('focus leaving to an outside element closes; focus to null / inside does not', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const w = mountPicker()
    await open(w)
    await w.trigger('focusout', { relatedTarget: null })
    await w.trigger('focusout', { relatedTarget: day(w, '2024-02-10').element })
    expect(content(w).exists()).toBe(true)
    await w.trigger('focusout', { relatedTarget: outside })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    await w.trigger('focusout', { relatedTarget: outside }) // closed: no-op
    expect(w.emitted('update:open')).toHaveLength(2)
  })

  it('closes when it becomes disabled while open', async () => {
    const w = mountPicker()
    await open(w)
    await w.setProps({ disabled: true })
    expect(content(w).exists()).toBe(false)
  })
})

describe('DatePicker: disabled, readonly, invalid, clearable', () => {
  it('disabled: trigger disabled and cannot open', async () => {
    const w = mountPicker({ disabled: true, modelValue: d(2024, 2, 1) })
    expect(trigger(w).attributes('disabled')).toBeDefined()
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(content(w).exists()).toBe(false)
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('readonly: shows the value but cannot open or clear', async () => {
    const w = mountPicker({ readonly: true, clearable: true, modelValue: d(2024, 2, 1) })
    expect(trigger(w).attributes('data-readonly')).toBe('true')
    expect(trigger(w).text()).toBe('Feb 1, 2024')
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="date-picker-clear"]').exists()).toBe(false)
  })

  it('invalid sets aria-invalid; valid does not', () => {
    expect(trigger(mountPicker({ invalid: true })).attributes('aria-invalid')).toBe('true')
    expect(trigger(mountPicker()).attributes('aria-invalid')).toBeUndefined()
  })

  it('required is exposed as a hidden description, never aria-required (not allowed on a button)', () => {
    const w = mountPicker({ required: true })
    expect(trigger(w).attributes('aria-required')).toBeUndefined()
    const hint = w.find('[data-slot="date-picker-required"]')
    expect(hint.text()).toBe('Required')
    expect(hint.classes()).toContain('sr-only')
    expect(trigger(w).attributes('aria-describedby')).toBe(hint.attributes('id'))
    expect(mountPicker({ required: true, requiredLabel: 'Pflichtfeld' }).find('[data-slot="date-picker-required"]').text()).toBe('Pflichtfeld')
    const optional = mountPicker()
    expect(optional.find('[data-slot="date-picker-required"]').exists()).toBe(false)
    expect(trigger(optional).attributes('aria-describedby')).toBeUndefined()
  })

  it('clearable: button only with a value; clearing emits null and focuses the trigger', async () => {
    const w = mountPicker({ clearable: true })
    expect(w.find('[data-slot="date-picker-clear"]').exists()).toBe(false)
    await open(w)
    await day(w, '2024-02-20').trigger('click')
    await flushPromises()
    const clear = w.find('[data-slot="date-picker-clear"]')
    expect(clear.attributes('aria-label')).toBe('Clear date')
    expect(trigger(w).classes()).toContain('pe-16')
    await clear.trigger('click')
    await flushPromises()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
    expect(trigger(w).text()).toBe('Pick a date')
    expect(w.find('[data-slot="date-picker-clear"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('clearing while open closes the dropdown; custom clear label', async () => {
    const w = mountPicker({ clearable: true, modelValue: d(2024, 2, 5), clearLabel: 'Entfernen' })
    await open(w)
    expect(w.find('[data-slot="date-picker-clear"]').attributes('aria-label')).toBe('Entfernen')
    await w.find('[data-slot="date-picker-clear"]').trigger('click')
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })

  it('not clearable by default and not while disabled', () => {
    expect(mountPicker({ modelValue: d(2024, 2, 5) }).find('[data-slot="date-picker-clear"]').exists()).toBe(false)
    expect(mountPicker({ clearable: true, disabled: true, modelValue: d(2024, 2, 5) }).find('[data-slot="date-picker-clear"]').exists()).toBe(false)
  })
})

describe('DatePicker: controlled open state', () => {
  it('open=true renders the dropdown without user interaction', () => {
    expect(content(mountPicker({ open: true })).exists()).toBe(true)
  })

  it('emits update:open but a parent that ignores it keeps control', async () => {
    const w = mountPicker({ open: false })
    await trigger(w).trigger('click')
    expect(w.emitted('update:open')![0]).toEqual([true])
    expect(content(w).exists()).toBe(false)
    await w.setProps({ open: true })
    expect(content(w).exists()).toBe(true)
    await trigger(w).trigger('click')
    expect(w.emitted('update:open')!.at(-1)).toEqual([false])
    expect(content(w).exists()).toBe(true)
  })

  it('open mounted as true closes on outside pointer down', () => {
    const w = mountPicker({ open: true })
    pointerDown(document.body)
    expect(w.emitted('update:open')![0]).toEqual([false])
  })

  it('works with v-model:open and v-model in a parent', async () => {
    const isOpen = ref(false)
    const model = ref<Date | null>(null)
    const Parent = defineComponent({
      setup: () => () =>
        h(DatePicker, {
          locale: 'en-US',
          weekStart: 0,
          open: isOpen.value,
          'onUpdate:open': (v: boolean) => (isOpen.value = v),
          modelValue: model.value,
          'onUpdate:modelValue': (v: Date | null) => (model.value = v),
        }),
    })
    const w = mount(Parent, { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(w)
    await trigger(w).trigger('click')
    expect(isOpen.value).toBe(true)
    await flushPromises()
    await day(w, '2024-02-03').trigger('click')
    await flushPromises()
    expect(isOpen.value).toBe(false)
    expect(model.value).toBeInstanceOf(Date)
    expect(trigger(w).text()).toBe('Feb 3, 2024')
  })
})

describe('DatePicker: Field integration and customisation', () => {
  it('inside a Field the trigger gets the id, description and invalid state', () => {
    const w = mount(Field, {
      props: { label: 'Start', hint: 'Pick one', error: 'Required' },
      slots: { default: () => h(DatePicker, { locale: 'en-US' }) },
      attachTo: document.body,
    })
    wrappers.push(w as unknown as VueWrapper)
    const t = w.find('[data-slot="date-picker-trigger"]')
    expect(t.attributes('id')).toBeTruthy()
    expect(w.find('label').attributes('for')).toBe(t.attributes('id'))
    expect(t.attributes('aria-invalid')).toBe('true')
    expect(t.attributes('aria-describedby')).toBeTruthy()
  })

  it('a Field that disables the control disables the picker', () => {
    const w = mount(Field, { props: { label: 'x', disabled: true }, slots: { default: () => h(DatePicker) }, attachTo: document.body })
    wrappers.push(w as unknown as VueWrapper)
    expect(w.find('[data-slot="date-picker-trigger"]').attributes('disabled')).toBeDefined()
  })

  it('class merges last on the trigger; attrs land on the trigger and win over defaults', () => {
    const w = mountPicker({ class: 'h-20 custom' }, { id: 'my-id', 'aria-label': 'Birthday', 'data-testid': 't', 'aria-describedby': 'mine' })
    expect(trigger(w).classes()).toContain('custom')
    expect(trigger(w).classes()).toContain('h-20')
    expect(trigger(w).classes()).not.toContain('h-9')
    expect(trigger(w).attributes('id')).toBe('my-id')
    expect(trigger(w).attributes('aria-label')).toBe('Birthday')
    expect(trigger(w).attributes('data-testid')).toBe('t')
    expect(trigger(w).attributes('aria-describedby')).toBe('mine')
    expect(w.attributes('data-testid')).toBeUndefined()
  })

  it('consumer click listeners still run alongside the built-in toggle', async () => {
    const onClick = vi.fn()
    const w = mountPicker({}, { onClick })
    await trigger(w).trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(content(w).exists()).toBe(true)
  })

  it('sizes map to heights; unknown falls back to md', () => {
    expect(trigger(mountPicker({ size: 'sm' })).classes()).toContain('h-8')
    expect(trigger(mountPicker({ size: 'lg' })).classes()).toContain('h-11')
    expect(trigger(mountPicker({ size: 'nope' })).classes()).toContain('h-9')
  })

  it('align end anchors the dropdown to the trigger end', async () => {
    const w = mountPicker({ align: 'end' })
    await open(w)
    expect(content(w).classes()).toContain('end-0')
    const s = mountPicker()
    await open(s)
    expect(content(s).classes()).toContain('start-0')
  })

  it('custom dialog label', async () => {
    const w = mountPicker({ dialogLabel: 'Datum wählen' })
    await open(w)
    expect(content(w).attributes('aria-label')).toBe('Datum wählen')
  })

  it('barrel exports and variants helper', () => {
    expect(Object.keys(barrel).sort()).toEqual(['DatePicker', 'datePickerVariants'])
    expect(datePickerVariants({ size: 'sm', class: 'x' })).toContain('h-8')
  })

  it('two pickers keep independent state', async () => {
    const a = mountPicker()
    const b = mountPicker()
    await open(a)
    expect(content(a).exists()).toBe(true)
    expect(content(b).exists()).toBe(false)
  })
})

describe('DatePicker: edge dates', () => {
  it('Feb 29 on a leap year is selectable and shown selected', async () => {
    const w = mountPicker({ modelValue: d(2024, 2, 29) })
    await open(w)
    expect(day(w, '2024-02-29').attributes('data-selected')).toBe('true')
  })

  it('a value with a time component displays and selects by calendar day', async () => {
    const w = mountPicker({ modelValue: new Date(2024, 2, 10, 23, 59, 59) })
    expect(trigger(w).text()).toBe('Mar 10, 2024')
    await open(w)
    expect(day(w, '2024-03-10').attributes('data-selected')).toBe('true')
  })

  it('year 1 and the maximum Date do not crash', () => {
    expect(trigger(mountPicker({ modelValue: createDate(1, 0, 1) })).text()).toBeTruthy()
    expect(trigger(mountPicker({ modelValue: new Date(8.64e15) })).text()).toBeTruthy()
  })
})

describe('DatePicker: accessible name and responsive regressions', () => {
  const nameIds = (w: VueWrapper) => trigger(w).attributes('aria-labelledby')!.split(' ')

  it('the name is the trigger label plus the visible value, so visible text is always in the name (WCAG 2.5.3)', () => {
    const w = mountPicker({ modelValue: d(2024, 5, 3) }, { 'aria-label': 'Date' })
    const [self, valueId] = nameIds(w)
    expect(self).toBe(trigger(w).attributes('id'))
    const value = w.find('[data-slot="date-picker-value"]')
    expect(valueId).toBe(value.attributes('id'))
    expect(value.text()).toBe('May 3, 2024')
    expect(trigger(w).attributes('aria-label')).toBe('Date') // resolved through the self reference
  })

  it('always has an id, even outside a Field, and keeps a consumer id', () => {
    expect(trigger(mountPicker()).attributes('id')).toBeTruthy()
    expect(trigger(mountPicker({}, { id: 'mine' })).attributes('id')).toBe('mine')
    expect(nameIds(mountPicker({}, { id: 'mine' }))[0]).toBe('mine')
  })

  it('a consumer aria-labelledby replaces the self reference and the value is still appended', () => {
    const w = mountPicker({}, { 'aria-labelledby': 'ext-label' })
    expect(nameIds(w)[0]).toBe('ext-label')
    expect(nameIds(w)).toHaveLength(2)
  })

  it('inside a Field the label stays the label source and the value is added', () => {
    const w = mount(Field, {
      props: { label: 'Start', hint: 'Pick one', required: true },
      slots: { default: () => h(DatePicker, { locale: 'en-US' }) },
      attachTo: document.body,
    })
    wrappers.push(w as unknown as VueWrapper)
    const t = w.find('[data-slot="date-picker-trigger"]')
    expect(t.attributes('aria-labelledby')!.split(' ')[0]).toBe(t.attributes('id'))
    expect(w.find('label').attributes('for')).toBe(t.attributes('id'))
    const described = t.attributes('aria-describedby')!.split(' ')
    expect(described).toContain(w.find('[data-slot="field-hint"]').attributes('id'))
    expect(described).toContain(w.find('[data-slot="date-picker-required"]').attributes('id'))
    expect(t.attributes('aria-required')).toBeUndefined()
  })

  it('a consumer aria-describedby wins over the Field, with the required hint appended', () => {
    const w = mountPicker({ required: true }, { 'aria-describedby': 'mine' })
    expect(trigger(w).attributes('aria-describedby')).toBe(`mine ${w.find('[data-slot="date-picker-required"]').attributes('id')}`)
  })

  it('trigger is 16px on mobile, 14px from md, text-start, with a 44px coarse-pointer height', () => {
    const cls = trigger(mountPicker()).classes()
    expect(cls).toEqual(expect.arrayContaining(['text-md', 'md:text-sm', 'text-start', 'pointer-coarse:min-h-11']))
    expect(cls).not.toContain('text-left')
    expect(datePickerVariants({ size: 'sm' })).toContain('md:text-sm')
    expect(datePickerVariants({ size: 'lg' })).not.toContain('md:text-sm')
  })

  it('the value span can shrink and truncate instead of overflowing', () => {
    expect(mountPicker().find('[data-slot="date-picker-value"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
  })

  it('the dropdown matches the trigger width on phones and is content-wide from sm, never a fixed px width', async () => {
    const w = mountPicker()
    await open(w)
    const cls = content(w).classes()
    expect(cls).toEqual(expect.arrayContaining(['w-full', 'min-w-69', 'sm:w-max']))
    expect(content(w).attributes('class')).not.toMatch(/-\[/)
  })

  it('the clear button uses the shared focus ring (outline kept for forced colours)', () => {
    const cls = mountPicker({ clearable: true, modelValue: d(2024, 5, 3) }).find('[data-slot="date-picker-clear"]').classes()
    expect(cls).toContain('outline-hidden')
    expect(cls).not.toContain('focus-visible:outline-none')
    expect(cls).toContain('focus-visible:ring-3')
  })

  it('the calendar inside announces month changes through its status region', async () => {
    const w = mountPicker({ modelValue: d(2024, 5, 3) })
    await open(w)
    await w.find('[data-slot="calendar-next"]').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').text()).toBe('June 2024')
  })
})

describe('DatePicker: native form participation', () => {
  function mountInForm(props: Props) {
    const Host = defineComponent({ setup: () => () => h('form', [h(DatePicker, { locale: 'en-US', ...props })]) })
    const w = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(w)
    return w.find('form').element as HTMLFormElement
  }

  it('submits the day as an ISO date under `name`', () => {
    const form = mountInForm({ name: 'due', modelValue: d(2024, 2, 9) })
    expect(new FormData(form).get('due')).toBe('2024-02-09')
  })

  it('submits an empty value when nothing is picked and the field is optional', () => {
    const form = mountInForm({ name: 'due' })
    expect(new FormData(form).get('due')).toBe('')
    expect(form.checkValidity()).toBe(true)
  })

  it('blocks native submit while required and empty, allows it once set', () => {
    expect(mountInForm({ name: 'due', required: true }).checkValidity()).toBe(false)
    expect(mountInForm({ name: 'due', required: true, modelValue: d(2024, 2, 9) }).checkValidity()).toBe(true)
  })

  it('renders no input without name or required, and a disabled picker does not submit', () => {
    expect(mountPicker().find('input').exists()).toBe(false)
    const form = mountInForm({ name: 'due', modelValue: d(2024, 2, 9), disabled: true })
    expect(new FormData(form).has('due')).toBe(false)
  })

  it('focuses the trigger when the hidden input is reported invalid', () => {
    const w = mountPicker({ name: 'due', required: true })
    w.find('input[name="due"]').element.dispatchEvent(new Event('invalid'))
    expect(document.activeElement).toBe(trigger(w).element)
  })
})
