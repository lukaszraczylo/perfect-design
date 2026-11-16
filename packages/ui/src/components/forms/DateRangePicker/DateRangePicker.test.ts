import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import DateRangePicker from './DateRangePicker.vue'
import Field from '../Field/Field.vue'
import { createDate, formatISODate } from '../Calendar/dateMath'
import * as barrel from './index'

const d = (y: number, m: number, day: number) => createDate(y, m - 1, day)
const iso = (v: unknown) => formatISODate(v as Date)
type Props = Record<string, unknown>

let wrappers: VueWrapper[] = []
function mountPicker(props: Props = {}, attrs: Props = {}) {
  const w = mount(DateRangePicker, { props: { locale: 'en-US', weekStart: 0, ...props }, attrs, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="date-range-picker-trigger"]')
const content = (w: VueWrapper) => w.find('[data-slot="date-range-picker-content"]')
const day = (w: VueWrapper, date: string) => w.find(`[data-slot="calendar-day"][data-date="${date}"]`)
const pointerDown = (target: Element) => target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
async function open(w: VueWrapper) {
  await trigger(w).trigger('click')
  await flushPromises()
}
const emitted = (w: VueWrapper) => w.emitted('update:modelValue')!.at(-1)![0] as { start: Date; end: Date } | null

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

describe('DateRangePicker: rendering', () => {
  it('renders a closed trigger with placeholder and data-slots', () => {
    const w = mountPicker()
    expect(w.attributes('data-slot')).toBe('date-range-picker')
    expect(w.attributes('data-state')).toBe('closed')
    expect(trigger(w).text()).toBe('Pick a date range')
    expect(trigger(w).attributes('aria-haspopup')).toBe('dialog')
    expect(trigger(w).attributes('aria-expanded')).toBe('false')
    expect(trigger(w).attributes('data-placeholder')).toBeDefined()
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="date-range-picker-value"]').exists()).toBe(true)
  })

  it('formats both ends with Intl', async () => {
    const w = mountPicker({ modelValue: { start: d(2024, 2, 10), end: d(2024, 2, 14) } })
    expect(trigger(w).text()).toBe('Feb 10, 2024 – Feb 14, 2024')
    await w.setProps({ locale: 'de-DE', format: { dateStyle: 'long' } })
    expect(trigger(w).text()).toBe('10. Februar 2024 – 14. Februar 2024')
  })

  it('a reversed model is normalised for display', () => {
    const w = mountPicker({ modelValue: { start: d(2024, 2, 14), end: d(2024, 2, 10) } })
    expect(trigger(w).text()).toBe('Feb 10, 2024 – Feb 14, 2024')
  })

  it('a one-day range shows a single date', () => {
    const w = mountPicker({ modelValue: { start: d(2024, 2, 10), end: new Date(2024, 1, 10, 22) } })
    expect(trigger(w).text()).toBe('Feb 10, 2024')
  })

  it('invalid / wrong-shaped values show the placeholder', () => {
    for (const bad of [null, d(2024, 2, 1), { start: d(2024, 2, 1) }, { start: new Date('x'), end: d(2024, 2, 2) }, 'x', []]) {
      expect(trigger(mountPicker({ modelValue: bad })).text()).toBe('Pick a date range')
    }
  })

  it('follows controlled changes', async () => {
    const w = mountPicker({ modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 2) } })
    await w.setProps({ modelValue: null })
    expect(trigger(w).text()).toBe('Pick a date range')
  })

  it('custom placeholder', () => {
    expect(trigger(mountPicker({ placeholder: 'Stay' })).text()).toBe('Stay')
  })
})

describe('DateRangePicker: selecting', () => {
  it('opens a range calendar; two clicks emit a normalised range, close and return focus', async () => {
    const w = mountPicker()
    await open(w)
    expect(content(w).attributes('role')).toBe('dialog')
    expect(content(w).attributes('aria-label')).toBe('Choose date range')
    expect(w.find('[data-slot="calendar"]').attributes('data-mode')).toBe('range')
    expect(trigger(w).attributes('aria-controls')).toBe(content(w).attributes('id'))
    await day(w, '2024-02-20').trigger('click')
    expect(content(w).exists()).toBe(true) // still choosing
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await day(w, '2024-02-10').trigger('click') // reversed on purpose
    await flushPromises()
    const r = emitted(w)!
    expect([iso(r.start), iso(r.end)]).toEqual(['2024-02-10', '2024-02-20'])
    expect(content(w).exists()).toBe(false)
    expect(trigger(w).text()).toBe('Feb 10, 2024 – Feb 20, 2024')
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('same day twice yields a one-day range', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-12').trigger('click')
    await day(w, '2024-02-12').trigger('click')
    await flushPromises()
    expect(trigger(w).text()).toBe('Feb 12, 2024')
  })

  it('shows the current range selected and opens on its month', async () => {
    const w = mountPicker({ modelValue: { start: d(2023, 11, 20), end: d(2023, 11, 22) } })
    await open(w)
    expect(w.find('[data-slot="calendar-heading"]').text()).toBe('November 2023')
    expect(day(w, '2023-11-21').attributes('data-in-range')).toBe('true')
  })

  it('two-month option shows two months and allows cross-month ranges', async () => {
    const w = mountPicker({ numberOfMonths: 2 })
    await open(w)
    expect(w.findAll('[data-slot="calendar-heading"]').map((h) => h.text())).toEqual(['February 2024', 'March 2024'])
    await day(w, '2024-02-27').trigger('click')
    await day(w, '2024-03-03').trigger('click')
    await flushPromises()
    expect(trigger(w).text()).toBe('Feb 27, 2024 – Mar 3, 2024')
  })

  it('defaults to one month', async () => {
    const w = mountPicker()
    await open(w)
    expect(w.findAll('[role="grid"]')).toHaveLength(1)
  })

  it('min/max/isDateDisabled apply; disabled days are not picked', async () => {
    const w = mountPicker({ min: d(2024, 2, 10), max: d(2024, 2, 20), isDateDisabled: (x: Date) => x.getDate() === 15 })
    await open(w)
    await day(w, '2024-02-15').trigger('click')
    await day(w, '2024-02-05').trigger('click')
    await day(w, '2024-02-25').trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await day(w, '2024-02-11').trigger('click')
    await day(w, '2024-02-19').trigger('click') // spans the disabled 15th: refused, the anchor stays
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await day(w, '2024-02-14').trigger('click')
    await flushPromises()
    expect(trigger(w).text()).toBe('Feb 11, 2024 – Feb 14, 2024')
  })

  it('Escape during selection cancels the anchor first, then closes', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-10').trigger('click')
    await day(w, '2024-02-10').trigger('keydown', { key: 'Escape' })
    expect(content(w).exists()).toBe(true)
    expect(w.find('[data-selected]').exists()).toBe(false) // anchor cleared
    await day(w, '2024-02-10').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('reopening after an abandoned selection starts clean', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-10').trigger('click')
    pointerDown(document.body)
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    await open(w)
    expect(w.find('[data-selected]').exists()).toBe(false)
  })
})

describe('DateRangePicker: opening and closing', () => {
  it('ArrowDown opens, click toggles closed', async () => {
    const w = mountPicker()
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(content(w).exists()).toBe(true)
    await trigger(w).trigger('click')
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })

  it('outside pointer down closes, inside does not; unmount removes the listener', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const w = mountPicker()
    await open(w)
    pointerDown(day(w, '2024-02-10').element)
    expect(content(w).exists()).toBe(true)
    pointerDown(document.body)
    await flushPromises()
    expect(content(w).exists()).toBe(false)
    await open(w)
    const before = remove.mock.calls.filter((c) => c[0] === 'pointerdown').length
    w.unmount()
    wrappers = wrappers.filter((x) => x !== w)
    expect(remove.mock.calls.filter((c) => c[0] === 'pointerdown').length).toBeGreaterThan(before)
  })

  it('focus moving outside closes it', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const w = mountPicker()
    await open(w)
    await w.trigger('focusout', { relatedTarget: outside })
    await flushPromises()
    expect(content(w).exists()).toBe(false)
  })

  it('controlled open', async () => {
    const w = mountPicker({ open: true })
    expect(content(w).exists()).toBe(true)
    await trigger(w).trigger('click')
    expect(w.emitted('update:open')!.at(-1)).toEqual([false])
    expect(content(w).exists()).toBe(true)
    await w.setProps({ open: false })
    expect(content(w).exists()).toBe(false)
  })

  it('works with v-model and v-model:open in a parent', async () => {
    const isOpen = ref(false)
    const model = ref<{ start: Date; end: Date } | null>(null)
    const Parent = defineComponent({
      setup: () => () =>
        h(DateRangePicker, {
          locale: 'en-US',
          weekStart: 0,
          open: isOpen.value,
          'onUpdate:open': (v: boolean) => (isOpen.value = v),
          modelValue: model.value,
          'onUpdate:modelValue': (v: { start: Date; end: Date } | null) => (model.value = v),
        }),
    })
    const w = mount(Parent, { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(w)
    await trigger(w).trigger('click')
    await flushPromises()
    expect(isOpen.value).toBe(true)
    await day(w, '2024-02-02').trigger('click')
    await day(w, '2024-02-04').trigger('click')
    await flushPromises()
    expect(isOpen.value).toBe(false)
    expect(iso(model.value!.start)).toBe('2024-02-02')
    expect(trigger(w).text()).toBe('Feb 2, 2024 – Feb 4, 2024')
  })
})

describe('DateRangePicker: disabled, readonly, invalid, clearable', () => {
  it('disabled cannot open; closes if disabled while open', async () => {
    const w = mountPicker({ disabled: true })
    expect(trigger(w).attributes('disabled')).toBeDefined()
    await trigger(w).trigger('click')
    expect(content(w).exists()).toBe(false)
    const w2 = mountPicker()
    await open(w2)
    await w2.setProps({ disabled: true })
    expect(content(w2).exists()).toBe(false)
  })

  it('readonly cannot open or clear', async () => {
    const w = mountPicker({ readonly: true, clearable: true, modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 3) } })
    expect(trigger(w).attributes('data-readonly')).toBe('true')
    await trigger(w).trigger('click')
    await trigger(w).trigger('keydown', { key: 'ArrowDown' })
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="date-range-picker-clear"]').exists()).toBe(false)
  })

  it('invalid / required attributes', () => {
    expect(trigger(mountPicker({ invalid: true })).attributes('aria-invalid')).toBe('true')
    expect(trigger(mountPicker()).attributes('aria-invalid')).toBeUndefined()
    const w = mountPicker({ required: true })
    expect(trigger(w).attributes('aria-required')).toBeUndefined() // not allowed on a button
    expect(w.find('[data-slot="date-range-picker-required"]').text()).toBe('Required')
    expect(trigger(w).attributes('aria-describedby')).toBe(w.find('[data-slot="date-range-picker-required"]').attributes('id'))
  })

  it('clearable clears to null, closes and focuses the trigger', async () => {
    const w = mountPicker({ clearable: true, modelValue: { start: d(2024, 2, 1), end: d(2024, 2, 3) }, 'onUpdate:modelValue': (v: unknown) => w.setProps({ modelValue: v } as never) })
    const clear = w.find('[data-slot="date-range-picker-clear"]')
    expect(clear.attributes('aria-label')).toBe('Clear date range')
    expect(trigger(w).classes()).toContain('pe-16')
    await open(w)
    await clear.trigger('click')
    await flushPromises()
    expect(emitted(w)).toBeNull()
    expect(trigger(w).text()).toBe('Pick a date range')
    expect(content(w).exists()).toBe(false)
    expect(w.find('[data-slot="date-range-picker-clear"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('no clear button when not clearable, empty or disabled; custom label', () => {
    const value = { start: d(2024, 2, 1), end: d(2024, 2, 3) }
    expect(mountPicker({ modelValue: value }).find('[data-slot="date-range-picker-clear"]').exists()).toBe(false)
    expect(mountPicker({ clearable: true }).find('[data-slot="date-range-picker-clear"]').exists()).toBe(false)
    expect(mountPicker({ clearable: true, disabled: true, modelValue: value }).find('[data-slot="date-range-picker-clear"]').exists()).toBe(false)
    expect(mountPicker({ clearable: true, modelValue: value, clearLabel: 'Reset' }).find('[data-slot="date-range-picker-clear"]').attributes('aria-label')).toBe('Reset')
  })
})

describe('DateRangePicker: Field and customisation', () => {
  it('wires into a Field', () => {
    const w = mount(Field, {
      props: { label: 'Stay', error: 'Pick dates' },
      slots: { default: () => h(DateRangePicker, { locale: 'en-US' }) },
      attachTo: document.body,
    })
    wrappers.push(w as unknown as VueWrapper)
    const t = w.find('[data-slot="date-range-picker-trigger"]')
    expect(w.find('label').attributes('for')).toBe(t.attributes('id'))
    expect(t.attributes('aria-invalid')).toBe('true')
    expect(t.attributes('aria-describedby')).toBeTruthy()
  })

  it('class merges last on the trigger; attrs land on the trigger', () => {
    const w = mountPicker({ class: 'h-20 custom' }, { id: 'rng', 'aria-label': 'Stay', 'data-testid': 'x' })
    expect(trigger(w).classes()).toEqual(expect.arrayContaining(['custom', 'h-20']))
    expect(trigger(w).classes()).not.toContain('h-9')
    expect(trigger(w).attributes('id')).toBe('rng')
    expect(trigger(w).attributes('aria-label')).toBe('Stay')
    expect(trigger(w).attributes('data-testid')).toBe('x')
  })

  it('sizes and invalid size fallback', () => {
    expect(trigger(mountPicker({ size: 'sm' })).classes()).toContain('h-8')
    expect(trigger(mountPicker({ size: 'lg' })).classes()).toContain('h-11')
    expect(trigger(mountPicker({ size: 'zzz' })).classes()).toContain('h-9')
  })

  it('align and dialog label', async () => {
    const w = mountPicker({ align: 'end', dialogLabel: 'Zeitraum' })
    await open(w)
    expect(content(w).classes()).toContain('end-0')
    expect(content(w).attributes('aria-label')).toBe('Zeitraum')
  })

  it('barrel exports', () => {
    expect(Object.keys(barrel).sort()).toEqual(['DateRangePicker', 'dateRangePickerVariants'])
    expect(barrel.dateRangePickerVariants({ size: 'lg' })).toContain('h-11')
  })
})

describe('DateRangePicker: edge cases', () => {
  it('range over the leap day and year boundary renders', async () => {
    const w = mountPicker({ modelValue: { start: d(2024, 2, 28), end: d(2024, 3, 1) } })
    expect(trigger(w).text()).toBe('Feb 28, 2024 – Mar 1, 2024')
    const y = mountPicker({ modelValue: { start: d(2023, 12, 30), end: d(2024, 1, 2) } })
    expect(trigger(y).text()).toBe('Dec 30, 2023 – Jan 2, 2024')
  })

  it('DST fall-back zone: range includes the 25-hour day', async () => {
    const tz = process.env.TZ
    process.env.TZ = 'America/New_York'
    try {
      const w = mountPicker({ numberOfMonths: 2, modelValue: { start: d(2024, 11, 2), end: d(2024, 11, 4) } })
      await open(w)
      expect(day(w, '2024-11-03').attributes('data-in-range')).toBe('true')
    } finally {
      if (tz === undefined) delete process.env.TZ
      else process.env.TZ = tz
    }
  })

  it('time components are ignored', () => {
    const w = mountPicker({ modelValue: { start: new Date(2024, 1, 10, 23, 59), end: new Date(2024, 1, 11, 0, 1) } })
    expect(trigger(w).text()).toBe('Feb 10, 2024 – Feb 11, 2024')
  })
})

describe('DateRangePicker: accessible name and responsive regressions', () => {
  const nameIds = (w: VueWrapper) => trigger(w).attributes('aria-labelledby')!.split(' ')

  it('the name is the trigger label plus the visible range text (WCAG 2.5.3)', () => {
    const w = mountPicker({ modelValue: { start: d(2024, 5, 3), end: d(2024, 5, 7) } }, { 'aria-label': 'Date range' })
    const [self, valueId] = nameIds(w)
    expect(self).toBe(trigger(w).attributes('id'))
    const value = w.find('[data-slot="date-range-picker-value"]')
    expect(valueId).toBe(value.attributes('id'))
    expect(value.text()).toBe('May 3, 2024 \u2013 May 7, 2024')
    expect(value.classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
  })

  it('keeps consumer id and aria-labelledby, and always has an id', () => {
    expect(trigger(mountPicker()).attributes('id')).toBeTruthy()
    const w = mountPicker({}, { id: 'mine', 'aria-labelledby': 'ext' })
    expect(trigger(w).attributes('id')).toBe('mine')
    expect(nameIds(w)[0]).toBe('ext')
  })

  it('inside a Field: label source, description ids and the required hint', () => {
    const w = mount(Field, {
      props: { label: 'Stay', hint: 'Check-in to check-out', required: true },
      slots: { default: () => h(DateRangePicker, { locale: 'en-US', requiredLabel: 'Pflichtfeld' }) },
      attachTo: document.body,
    })
    wrappers.push(w as unknown as VueWrapper)
    const t = w.find('[data-slot="date-range-picker-trigger"]')
    expect(t.attributes('aria-labelledby')!.split(' ')[0]).toBe(t.attributes('id'))
    expect(t.attributes('aria-describedby')!.split(' ')).toEqual([
      w.find('[data-slot="field-hint"]').attributes('id'),
      w.find('[data-slot="date-range-picker-required"]').attributes('id'),
    ])
    expect(w.find('[data-slot="date-range-picker-required"]').text()).toBe('Pflichtfeld')
  })

  it('trigger is 16px on mobile, 14px from md, with a 44px coarse-pointer height', () => {
    expect(trigger(mountPicker()).classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-sm', 'text-start', 'pointer-coarse:min-h-11']))
  })

  it('the dropdown has no arbitrary widths: trigger width on phones, content width from sm', async () => {
    const w = mountPicker({ numberOfMonths: 2 })
    await open(w)
    expect(content(w).classes()).toEqual(expect.arrayContaining(['w-full', 'min-w-69', 'sm:w-max']))
    expect(content(w).attributes('class')).not.toMatch(/-\[/)
  })

  it('the clear button keeps a forced-colours-safe focus outline', () => {
    const cls = mountPicker({ clearable: true, modelValue: { start: d(2024, 5, 3), end: d(2024, 5, 7) } })
      .find('[data-slot="date-range-picker-clear"]')
      .classes()
    expect(cls).toContain('outline-hidden')
    expect(cls).not.toContain('focus-visible:outline-none')
  })

  it('announces the range start inside the dropdown', async () => {
    const w = mountPicker()
    await open(w)
    await day(w, '2024-02-10').trigger('click')
    expect(w.find('[data-slot="calendar-status"]').text()).toContain('Range start')
  })
})

describe('DateRangePicker: review fixes', () => {
  const presetBtns = (w: VueWrapper) => w.findAll('[data-slot="date-range-picker-preset"]')
  const range = (a: [number, number, number], b: [number, number, number]) => ({ start: d(...a), end: d(...b) })

  it('applies the same min/max swap as the calendar to presets', async () => {
    const w = mountPicker({ min: d(2024, 3, 1), max: d(2024, 2, 1), presets: [{ label: 'Inside', range: range([2024, 2, 10], [2024, 2, 14]) }, { label: 'Outside', range: range([2024, 3, 5], [2024, 3, 9]) }] })
    await open(w)
    expect(presetBtns(w).map((b) => (b.element as HTMLButtonElement).disabled)).toEqual([false, true])
  })

  it('disables a preset that spans a disabled day', async () => {
    const w = mountPicker({ isDateDisabled: (x: Date) => iso(x) === '2024-02-12', presets: [{ label: 'Spans', range: range([2024, 2, 10], [2024, 2, 14]) }, { label: 'Clear', range: range([2024, 2, 1], [2024, 2, 5]) }] })
    await open(w)
    expect(presetBtns(w).map((b) => (b.element as HTMLButtonElement).disabled)).toEqual([true, false])
  })

  it('accepts presets with the same label without duplicate-key warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mountPicker({ presets: [{ label: 'Week', range: range([2024, 2, 1], [2024, 2, 7]) }, { label: 'Week', range: range([2024, 2, 8], [2024, 2, 14]) }] })
    await open(w)
    expect(presetBtns(w)).toHaveLength(2)
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/[Dd]uplicate key/)
  })

  it('reads the locale from a surrounding ConfigProvider, the prop still wins', async () => {
    const { default: ConfigProvider } = await import('../../layout/ConfigProvider/ConfigProvider.vue')
    const value = { start: d(2024, 2, 10), end: d(2024, 2, 14) }
    const host = (props: Props) => defineComponent({ setup: () => () => h(ConfigProvider, { locale: 'de-DE' }, () => h(DateRangePicker, { weekStart: 0, modelValue: value, format: { dateStyle: 'long' }, ...props })) })
    const a = mount(host({}), { attachTo: document.body }) as unknown as VueWrapper
    const b = mount(host({ locale: 'en-US' }), { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(a, b)
    expect(trigger(a).text()).toBe('10. Februar 2024 – 14. Februar 2024')
    expect(trigger(b).text()).toBe('February 10, 2024 – February 14, 2024')
  })

  it('controlled: shows the prop again when the parent ignores the update', async () => {
    const value = { start: d(2024, 2, 10), end: d(2024, 2, 14) }
    const w = mountPicker({ modelValue: value })
    await open(w)
    await day(w, '2024-02-20').trigger('click')
    await day(w, '2024-02-22').trigger('click')
    expect(w.emitted('update:modelValue')).toHaveLength(1)
    await flushPromises()
    expect(trigger(w).text()).toBe('Feb 10, 2024 – Feb 14, 2024')
  })

  it('submits `name[from]` and `name[to]` as ISO dates', () => {
    const Host = defineComponent({ setup: () => () => h('form', [h(DateRangePicker, { locale: 'en-US', name: 'stay', modelValue: { start: d(2024, 2, 10), end: d(2024, 2, 14) } })]) })
    const w = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
    wrappers.push(w)
    const data = new FormData(w.find('form').element as HTMLFormElement)
    expect(data.get('stay[from]')).toBe('2024-02-10')
    expect(data.get('stay[to]')).toBe('2024-02-14')
  })

  it('blocks native submit while required and empty', () => {
    const mountForm = (props: Props) => {
      const w = mount(defineComponent({ setup: () => () => h('form', [h(DateRangePicker, { locale: 'en-US', name: 'stay', required: true, ...props })]) }), { attachTo: document.body }) as unknown as VueWrapper
      wrappers.push(w)
      return w.find('form').element as HTMLFormElement
    }
    expect(mountForm({}).checkValidity()).toBe(false)
    expect(mountForm({ modelValue: { start: d(2024, 2, 10), end: d(2024, 2, 14) } }).checkValidity()).toBe(true)
  })
})
