import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import Field from '../Field/Field.vue'
import TimeInput from '../TimeInput/TimeInput.vue'
import TimeRangePicker from './TimeRangePicker.vue'
import { TIME_RANGE_VARIANTS, timeRangePickerVariants, timeRangeTriggerVariants } from './index'

type Props = Record<string, unknown>
const utc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => new Date(Date.UTC(y, m - 1, d, h, mi, s, ms)).toISOString()
const NOW = utc(2024, 5, 15, 12, 30)
const VALUE = { from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11, 30) }

let wrappers: VueWrapper[] = []
function mountPicker(props: Props = {}, attrs: Props = {}) {
  const w = mount(TimeRangePicker, { props: { locale: 'en-US', now: NOW, ...props }, attrs: { 'aria-label': 'Window', ...attrs }, attachTo: document.body })
  wrappers.push(w)
  return w
}
const trigger = (w: VueWrapper) => w.find('[data-slot="time-range-picker-trigger"]')
const preset = (w: VueWrapper, id: string) => w.find(`[data-slot="time-range-picker-preset"][data-preset="${id}"]`)
const radio = (w: VueWrapper, id: string) => w.find(`[data-slot="segmented-control-item"][value="${id}"]`)
const custom = (w: VueWrapper) => w.find('[data-slot="time-range-picker-custom"]')
const apply = (w: VueWrapper) => w.find('[data-slot="time-range-picker-apply"]')
const last = (w: VueWrapper) => w.emitted('update:modelValue')!.at(-1)![0] as { from: string; to: string }

afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('TimeRangePicker variations: variant', () => {
  it('lists the variants and pins the default root classes', () => {
    expect([...TIME_RANGE_VARIANTS]).toEqual(['popover', 'inline', 'segmented'])
    expect(mountPicker().classes()).toEqual(['min-w-0', 'w-full', 'relative'])
    expect(timeRangePickerVariants()).toBe('min-w-0 w-full relative')
  })

  it('unknown values fall back to popover', () => {
    for (const variant of ['x', '', null, 5, {}]) {
      const w = mountPicker({ variant })
      expect(w.attributes('data-variant')).toBe('popover')
      expect(trigger(w).exists()).toBe(true)
    }
  })

  describe('popover', () => {
    it('is a trigger with a dropdown; the root has no group role and the label goes to the trigger', () => {
      const w = mountPicker()
      expect(w.attributes('role')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
      expect(trigger(w).attributes('aria-labelledby')).toContain(trigger(w).attributes('id'))
      expect(w.find('[data-slot="time-range-picker-summary"]').exists()).toBe(false)
    })
  })

  describe('inline', () => {
    it('shows the summary, the presets and no trigger or dialog, without opening anything', () => {
      const w = mountPicker({ variant: 'inline', modelValue: VALUE })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('aria-label')).toBe('Window')
      expect(w.attributes('data-state')).toBeUndefined()
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'rounded-lg', 'border', 'bg-card', 'p-3']))
      expect(trigger(w).exists()).toBe(false)
      expect(w.find('[data-slot="time-range-picker-content"]').attributes('role')).toBeUndefined()
      expect(w.find('[data-slot="time-range-picker-summary"]').text()).toBe('May 1, 2024, 10:00 AM – May 1, 2024, 11:30 AM UTC')
      expect(w.findAll('[data-slot="time-range-picker-preset"]')).toHaveLength(10)
    })
    it('the summary shows the placeholder while empty, and the presets are laid out as a wrapping row until Custom is chosen', async () => {
      const w = mountPicker({ variant: 'inline' })
      const summary = w.find('[data-slot="time-range-picker-summary"]')
      expect(summary.text()).toBe('Pick a time range')
      expect(summary.attributes('data-placeholder')).toBeDefined()
      expect(w.find('[data-slot="time-range-picker-presets"]').classes()).not.toContain('@lg:flex-col')
      expect(custom(w).exists()).toBe(false)
      await preset(w, 'custom').trigger('click')
      expect(custom(w).exists()).toBe(true)
      expect(w.find('[data-slot="time-range-picker-presets"]').classes()).toEqual(expect.arrayContaining(['@lg:flex-col', '@lg:border-e']))
    })
    it('picking a preset emits and keeps the panel in place', async () => {
      const w = mountPicker({ variant: 'inline' })
      await preset(w, 'last-1-hour').trigger('click')
      expect(last(w)).toEqual({ from: utc(2024, 5, 15, 11, 30), to: NOW })
      expect(w.find('[data-slot="time-range-picker-content"]').exists()).toBe(true)
      expect(preset(w, 'last-1-hour').attributes('aria-pressed')).toBe('true')
      expect(w.find('[data-slot="time-range-picker-summary"]').text()).toContain('May 15, 2024')
    })
    it('Custom then Apply emits, and the fields stay visible', async () => {
      const w = mountPicker({ variant: 'inline', timeZone: 'Europe/Warsaw' })
      await preset(w, 'custom').trigger('click')
      await w.find('input[type="date"]').setValue('2024-05-01')
      await w.findAll('input[type="date"]')[1].setValue('2024-05-01')
      w.findAllComponents(TimeInput)[0].vm.$emit('update:modelValue', '12:00')
      w.findAllComponents(TimeInput)[1].vm.$emit('update:modelValue', '13:00')
      await apply(w).trigger('click')
      expect(last(w)).toEqual({ from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11) })
      expect(custom(w).exists()).toBe(true)
      expect(w.find('[data-slot="calendar"]').exists()).toBe(true)
    })
    it('a reversed range is shown as visible error text under the fields only, not twice', async () => {
      const w = mountPicker({ variant: 'inline', modelValue: { from: VALUE.to, to: VALUE.from }, 'onUpdate:modelValue': (v: unknown) => w.setProps({ modelValue: v } as never) })
      expect(w.find('[data-slot="time-range-picker-draft-message"]').text()).toBe('The start must not be after the end')
      expect(w.find('[data-slot="time-range-picker-message"]').text()).toBe('')
      expect(w.classes()).toContain('border-destructive')
      await preset(w, 'last-1-hour').trigger('click')
      expect(w.classes()).not.toContain('border-destructive')
    })
    it('takes its name from a Field label, and the error wiring', async () => {
      const w = mount(Field, { props: { label: 'Window', error: 'Required' }, slots: { default: () => h(TimeRangePicker, { variant: 'inline', now: NOW }) }, attachTo: document.body })
      wrappers.push(w)
      await flushPromises()
      const group = w.find('[data-slot="time-range-picker"]')
      expect(group.attributes('aria-labelledby')).toBe(w.find('label').attributes('id'))
      expect(group.attributes('aria-describedby')).toContain(w.find('[data-slot="field-error"]').attributes('id'))
    })
    it('readonly and disabled lock every control', async () => {
      for (const state of [{ readonly: true }, { disabled: true }]) {
        const w = mountPicker({ variant: 'inline', modelValue: VALUE, ...state })
        for (const b of w.findAll('[data-slot="time-range-picker-preset"]')) expect(b.attributes('disabled')).toBeDefined()
        expect(apply(w).attributes('disabled')).toBeDefined()
        await preset(w, 'last-1-hour').trigger('click')
        expect(w.emitted('update:modelValue')).toBeUndefined()
        if (state.readonly) expect(w.find('input[type="date"]').attributes('readonly')).toBeDefined()
        else expect(w.find('input[type="date"]').attributes('disabled')).toBeDefined()
      }
    })
    it('a required inline picker has a hidden description', () => {
      const w = mountPicker({ variant: 'inline', required: true })
      expect(w.attributes('aria-describedby')).toContain(w.find('[data-slot="time-range-picker-required"]').attributes('id'))
    })
    it('aria-labelledby set by the consumer wins over the Field label', () => {
      const w = mountPicker({ variant: 'inline' }, { 'aria-label': undefined, 'aria-labelledby': 'external' })
      expect(w.attributes('aria-labelledby')).toBe('external')
    })
  })

  describe('segmented', () => {
    it('renders the presets as one radio group and no dropdown', () => {
      const w = mountPicker({ variant: 'segmented' })
      expect(w.attributes('data-variant')).toBe('segmented')
      expect(w.attributes('role')).toBe('group')
      expect(w.find('[role="radiogroup"]').attributes('aria-label')).toBe('Presets')
      expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual([
        'Last 15 minutes', 'Last 30 minutes', 'Last hour', 'Last 6 hours', 'Last 24 hours', 'Last 7 days', 'Last 30 days', 'Today', 'Yesterday', 'Custom range',
      ])
      expect(w.find('[data-slot="time-range-picker-preset"]').exists()).toBe(false)
      expect(w.findAll('[role="radio"][aria-checked="true"]')).toHaveLength(0)
      expect(trigger(w).exists()).toBe(false)
      expect(custom(w).exists()).toBe(false)
    })
    it('choosing a segment emits a concrete range and checks it', async () => {
      const w = mountPicker({ variant: 'segmented', presets: ['last-1-hour', 'today', 'custom'] })
      await radio(w, 'last-1-hour').trigger('click')
      await flushPromises()
      expect(last(w)).toEqual({ from: utc(2024, 5, 15, 11, 30), to: NOW })
      expect(radio(w, 'last-1-hour').attributes('aria-checked')).toBe('true')
      expect(w.emitted('select')![0][0]).toEqual({ preset: 'last-1-hour', value: last(w) })
    })
    it('arrow keys move through the segments like any radio group: selection follows focus', async () => {
      const w = mountPicker({ variant: 'segmented', presets: ['last-1-hour', 'today', 'custom'], modelValue: VALUE, 'onUpdate:modelValue': (v: unknown) => w.setProps({ modelValue: v } as never) })
      await flushPromises()
      expect(radio(w, 'custom').attributes('aria-checked')).toBe('true')
      await radio(w, 'custom').trigger('focus')
      ;(radio(w, 'custom').element as HTMLElement).focus()
      await flushPromises()
      await radio(w, 'custom').trigger('keydown', { key: 'ArrowLeft' })
      // reka-ui checks the newly focused radio in a `setTimeout(0)` (RadioGroupItem's handleFocus), so the selection is
      // not there after a microtask flush. Wait for the condition instead of a fixed tick.
      await vi.waitFor(() => expect(radio(w, 'today').attributes('aria-checked')).toBe('true'))
      await flushPromises()
      expect(radio(w, 'today').attributes('aria-checked')).toBe('true')
      expect(last(w)).toEqual({ from: utc(2024, 5, 15), to: NOW })
      expect(custom(w).exists()).toBe(false)
    })
    it('Custom range shows the date and time fields (without the calendar) and Apply works', async () => {
      const w = mountPicker({ variant: 'segmented', presets: ['last-1-hour', 'custom'] })
      await radio(w, 'custom').trigger('click')
      await flushPromises()
      expect(custom(w).exists()).toBe(true)
      expect(w.find('[data-slot="calendar"]').exists()).toBe(false)
      await w.find('input[type="date"]').setValue('2024-05-01')
      await w.findAll('input[type="date"]')[1].setValue('2024-05-01')
      w.findAllComponents(TimeInput)[0].vm.$emit('update:modelValue', '10:00')
      w.findAllComponents(TimeInput)[1].vm.$emit('update:modelValue', '11:00')
      await apply(w).trigger('click')
      expect(last(w)).toEqual({ from: utc(2024, 5, 1, 10), to: utc(2024, 5, 1, 11) })
      expect(radio(w, 'custom').attributes('aria-checked')).toBe('true')
    })
    it('a disabled preset is a disabled segment; locked pickers disable all of them', async () => {
      const w = mountPicker({ variant: 'segmented', min: utc(2024, 5, 15, 12), presets: ['last-15-minutes', 'last-1-hour'] })
      expect(radio(w, 'last-1-hour').attributes('disabled')).toBeDefined()
      expect(radio(w, 'last-15-minutes').attributes('disabled')).toBeUndefined()
      const locked = mountPicker({ variant: 'segmented', readonly: true })
      expect(locked.findAll('[role="radio"]').every((r) => r.attributes('disabled') !== undefined)).toBe(true)
    })
    it('shows the summary of a set value', () => {
      const w = mountPicker({ variant: 'segmented', modelValue: VALUE })
      expect(w.find('[data-slot="time-range-picker-summary"]').text()).toContain('May 1, 2024')
      expect(custom(w).exists()).toBe(true)
    })
    it('xs maps to the smallest segmented size', () => {
      const w = mountPicker({ variant: 'segmented', size: 'xs' })
      expect(w.find('[role="radio"]').classes().join(' ')).toMatch(/h-7|text-xs|h-8/)
    })
  })
})

describe('TimeRangePicker variations: size, shape, status, align', () => {
  it.each([
    ['xs', 'h-7'],
    ['sm', 'h-8'],
    ['md', 'h-9'],
    ['lg', 'h-11'],
  ])('size %s sets the trigger height', (size, cls) => expect(trigger(mountPicker({ size })).classes()).toContain(cls))
  it('unknown size and shape fall back', () => {
    const c = trigger(mountPicker({ size: 'huge', shape: 'blob', status: 'nope' })).classes()
    expect(c).toEqual(expect.arrayContaining(['h-9', 'rounded-md']))
    expect(mountPicker({ size: 'huge', shape: 'blob' }).find('[data-slot="field-status"]').exists()).toBe(false)
  })
  it.each([
    ['pill', 'rounded-full'],
    ['square', 'rounded-none'],
  ])('shape %s', (shape, cls) => expect(trigger(mountPicker({ shape })).classes()).toContain(cls))
  it('size and shape reach the fields in the dropdown', async () => {
    const w = mountPicker({ size: 'lg', shape: 'pill', modelValue: VALUE, open: true })
    await flushPromises()
    expect(w.find('input[type="date"]').classes()).toEqual(expect.arrayContaining(['h-11', 'rounded-full']))
  })
  it.each([
    ['success', 'Valid', 'border-success'],
    ['warning', 'Warning', 'border-warning-foreground'],
  ])('status %s adds an icon, hidden text linked to the trigger, and the colour', (status, text, cls) => {
    const w = mountPicker({ status })
    expect(w.find('[data-slot="field-status"]').attributes('data-status')).toBe(status)
    expect(w.find('[data-slot="field-status"] .sr-only').text()).toBe(text)
    expect(trigger(w).attributes('aria-describedby')).toContain(w.find('[data-slot="field-status"] .sr-only').attributes('id'))
    expect(trigger(w).classes()).toContain(cls)
    expect(trigger(w).classes()).toContain('pe-9')
  })
  it('status error adds an icon and aria-invalid and a destructive border', () => {
    const w = mountPicker({ status: 'error' })
    expect(trigger(w).attributes('aria-invalid')).toBe('true')
    expect(trigger(w).classes()).toContain('border-destructive')
    expect(w.find('[data-slot="field-status"]').attributes('data-status')).toBe('error')
  })
  it('statusLabel replaces the hidden text', () => expect(mountPicker({ status: 'success', statusLabel: 'Gueltig' }).find('[data-slot="field-status"] .sr-only').text()).toBe('Gueltig'))
  it('inline status colours the panel border and the same value is not coloured twice', () => {
    expect(mountPicker({ variant: 'inline', status: 'success' }).classes()).toContain('border-success')
    expect(mountPicker({ variant: 'inline', status: 'warning' }).classes()).toContain('border-warning-foreground')
    expect(mountPicker({ variant: 'inline', status: 'error' }).classes()).toContain('border-destructive')
  })
  it('align is a data hook, and end aligns the dropdown to the end edge', async () => {
    const start = mountPicker({ open: true })
    expect(start.attributes('data-align')).toBe('start')
    expect(start.find('[data-slot="time-range-picker-content"]').classes()).toContain('start-0')
    const end = mountPicker({ align: 'end', open: true })
    expect(end.attributes('data-align')).toBe('end')
    expect(end.find('[data-slot="time-range-picker-content"]').classes()).toContain('end-0')
  })
  it('the dropdown surface uses the card pair and the floating look', async () => {
    const w = mountPicker({ open: true })
    expect(w.find('[data-slot="time-range-picker-content"]').classes()).toEqual(expect.arrayContaining(['bg-card', 'text-card-foreground', 'shadow-md', 'absolute']))
  })
  it('the trigger carries focus, forced-colors and touch rules through the shared field surface', () => {
    const c = trigger(mountPicker()).classes().join(' ')
    expect(c).toContain('focus-visible:ring-3')
    expect(c).toContain('pointer-coarse:min-h-11')
  })
})

describe('TimeRangePicker variations: customisation and combinations', () => {
  it('class wins and is merged last on the root', () => {
    for (const variant of ['popover', 'inline', 'segmented']) {
      const w = mountPicker({ variant, class: 'max-w-sm w-1/2' })
      expect(w.classes()).toEqual(expect.arrayContaining(['max-w-sm', 'w-1/2']))
      expect(w.classes()).not.toContain('w-full')
    }
  })
  it('attributes fall through to the trigger (popover) or the group root (inline, segmented)', () => {
    const w = mountPicker({}, { 'data-testid': 'a', id: 'picker' })
    expect(trigger(w).attributes('data-testid')).toBe('a')
    expect(trigger(w).attributes('id')).toBe('picker')
    const g = mountPicker({ variant: 'inline' }, { 'data-testid': 'b' })
    expect(g.attributes('data-testid')).toBe('b')
  })
  it('a cross product of variant, size, shape and status mounts and renders the same structure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const variant of TIME_RANGE_VARIANTS) {
      for (const size of ['xs', 'lg']) {
        for (const shape of ['pill', 'square']) {
          for (const status of ['success', 'error']) {
            const w = mountPicker({ variant, size, shape, status, modelValue: VALUE, open: true })
            await flushPromises()
            expect(w.attributes('data-variant')).toBe(variant)
            expect(w.find('[data-slot="time-range-picker-content"]').exists()).toBe(true)
            expect(custom(w).exists()).toBe(true)
          }
        }
      }
    }
    expect(warn).not.toHaveBeenCalled()
  })
  it('exposes the trigger variants for plain buttons', () => {
    expect(timeRangeTriggerVariants({ variant: 'filled', shape: 'pill' })).toEqual(expect.stringContaining('bg-muted'))
  })
})
