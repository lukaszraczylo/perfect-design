import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimeInput from './TimeInput.vue'
import Field from '../Field/Field.vue'
import { formatTimeInput, minuteOptions, parseTimeInput, timeToMinutes } from './time'
import { timeInputVariants } from './variants'

type W = ReturnType<typeof mount>
const seg = (w: W, s: 'hour' | 'minute' | 'period') => w.find(`[data-segment=${s}]`)
const text = (w: W) => ['hour', 'minute', 'period'].filter((s) => seg(w, s as 'hour').exists()).map((s) => seg(w, s as 'hour').text())
const key = (w: W, s: 'hour' | 'minute' | 'period', k: string, init: KeyboardEventInit = {}) => seg(w, s).trigger('keydown', { key: k, ...init })
const type = async (w: W, s: 'hour' | 'minute' | 'period', digits: string) => {
  for (const d of digits) await key(w, s, d)
}
const emitted = (w: W) => w.emitted('update:modelValue')?.map((e) => e[0])

describe('time helpers', () => {
  it('parses valid and rejects invalid', () => {
    expect(parseTimeInput('09:05')).toEqual({ hour: 9, minute: 5 })
    expect(parseTimeInput('9:05')).toEqual({ hour: 9, minute: 5 })
    expect(parseTimeInput(' 23:59 ')).toEqual({ hour: 23, minute: 59 })
    for (const bad of ['24:00', '12:60', '1:5', 'abc', '', '12', '12:3', null, undefined, 5, {}]) expect(parseTimeInput(bad)).toBeNull()
  })
  it('formats, converts to minutes and builds minute grids', () => {
    expect(formatTimeInput(0, 5)).toBe('00:05')
    expect(timeToMinutes('01:30')).toBe(90)
    expect(timeToMinutes('x')).toBeNull()
    expect(minuteOptions(15)).toEqual([0, 15, 30, 45])
    expect(minuteOptions(0)).toHaveLength(60)
    expect(minuteOptions(NaN)).toHaveLength(60)
    expect(minuteOptions(1000)).toEqual([0])
    expect(minuteOptions(7.9)).toEqual([0, 7, 14, 21, 28, 35, 42, 49, 56])
  })
})

describe('TimeInput', () => {
  it('renders group, separator and two spinbuttons with values', () => {
    const w = mount(TimeInput, { props: { modelValue: '09:05' } })
    const root = w.find('[data-slot=time-input]')
    expect(root.attributes('role')).toBe('group')
    expect(text(w)).toEqual(['09', '05'])
    expect(seg(w, 'hour').attributes('role')).toBe('spinbutton')
    expect(seg(w, 'hour').attributes('aria-valuenow')).toBe('9')
    expect(seg(w, 'hour').attributes('aria-valuemax')).toBe('23')
    expect(seg(w, 'minute').attributes('aria-valuenow')).toBe('5')
    expect(seg(w, 'minute').attributes('aria-label')).toBe('Minutes')
    expect(w.find('[data-slot=time-input-separator]').attributes('aria-hidden')).toBe('true')
    expect(seg(w, 'period').exists()).toBe(false)
  })

  it('renders empty placeholders for null / invalid models', () => {
    for (const modelValue of [null, undefined, '25:00', 'nope']) {
      const w = mount(TimeInput, { props: { modelValue: modelValue as string } })
      expect(text(w)).toEqual(['--', '--'])
      expect(seg(w, 'hour').attributes('aria-valuenow')).toBeUndefined()
      expect(seg(w, 'hour').attributes('aria-valuetext')).toBe('Empty')
    }
  })

  it('syncs from modelValue changes', async () => {
    const w = mount(TimeInput, { props: { modelValue: '01:00' } })
    await w.setProps({ modelValue: '13:45' })
    expect(text(w)).toEqual(['13', '45'])
    await w.setProps({ modelValue: null })
    expect(text(w)).toEqual(['--', '--'])
  })

  describe('arrow keys (24h)', () => {
    it('hour up/down wraps without touching minutes', async () => {
      const w = mount(TimeInput, { props: { modelValue: '23:30' } })
      await key(w, 'hour', 'ArrowUp')
      expect(emitted(w)).toEqual(['00:30'])
      await key(w, 'hour', 'ArrowDown')
      expect(emitted(w)).toEqual(['00:30', '23:30'])
    })

    it('minute steps by `step` and wraps', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:45', step: 15 } })
      await key(w, 'minute', 'ArrowUp')
      expect(emitted(w)).toEqual(['10:00'])
      await key(w, 'minute', 'ArrowDown')
      expect(emitted(w)).toEqual(['10:00', '10:45'])
      await key(w, 'minute', 'ArrowDown')
      expect(emitted(w)?.at(-1)).toBe('10:30')
    })

    it('off-grid minutes snap to the next/previous step', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:07', step: 15 } })
      await key(w, 'minute', 'ArrowUp')
      expect(emitted(w)?.at(-1)).toBe('10:15')
      await w.setProps({ modelValue: '10:07' })
      await key(w, 'minute', 'ArrowDown')
      expect(emitted(w)?.at(-1)).toBe('10:00')
    })

    it('arrows on an empty field start from 00 and fill the other segment', async () => {
      const w = mount(TimeInput)
      await key(w, 'hour', 'ArrowUp')
      expect(emitted(w)).toEqual(['00:00'])
      const m = mount(TimeInput)
      await key(m, 'minute', 'ArrowDown')
      expect(emitted(m)).toEqual(['00:00'])
    })

    it('Home / End jump to segment bounds', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:30', step: 10 } })
      await key(w, 'hour', 'End')
      await key(w, 'hour', 'Home')
      await key(w, 'minute', 'End')
      await key(w, 'minute', 'Home')
      expect(emitted(w)).toEqual(['23:30', '00:30', '00:50', '00:00'])
    })
  })

  describe('typing digits', () => {
    it('types a full time and moves focus hour -> minute', async () => {
      const w = mount(TimeInput, { attachTo: document.body })
      await type(w, 'hour', '14')
      expect(document.activeElement).toBe(seg(w, 'minute').element)
      await type(w, 'minute', '35')
      expect(text(w)).toEqual(['14', '35'])
      expect(emitted(w)?.at(-1)).toBe('14:35')
      w.unmount()
    })

    it('a first digit that cannot extend completes immediately', async () => {
      const w = mount(TimeInput, { attachTo: document.body })
      await key(w, 'hour', '5')
      expect(text(w)[0]).toBe('05')
      expect(document.activeElement).toBe(seg(w, 'minute').element)
      await key(w, 'minute', '7')
      expect(emitted(w)).toEqual(['05:07'])
      w.unmount()
    })

    it('out-of-range second digit restarts the buffer', async () => {
      const w = mount(TimeInput, { props: { modelValue: '00:00' } })
      await type(w, 'hour', '2')
      expect(text(w)[0]).toBe('02')
      await type(w, 'hour', '9') // 29 > 23 -> restart with 9
      expect(text(w)[0]).toBe('09')
      await type(w, 'minute', '6') // 6*10 > 59 completes
      expect(text(w)[1]).toBe('06')
    })

    it('ignores letters and typing on readonly', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:10' } })
      await key(w, 'hour', 'x')
      expect(emitted(w)).toBeUndefined()
      const r = mount(TimeInput, { props: { modelValue: '10:10', readonly: true } })
      await type(r, 'hour', '2')
      expect(emitted(r)).toBeUndefined()
    })

    it('modifier combos are left to the browser', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:10' } })
      await key(w, 'hour', 'ArrowUp', { ctrlKey: true })
      await key(w, 'hour', '3', { metaKey: true })
      expect(emitted(w)).toBeUndefined()
    })

    it('focus/blur reset the typing buffer', async () => {
      const w = mount(TimeInput, { props: { modelValue: '00:00' } })
      await key(w, 'hour', '1')
      await seg(w, 'hour').trigger('blur')
      await seg(w, 'hour').trigger('focus')
      await key(w, 'hour', '2') // fresh buffer, not 12
      expect(text(w)[0]).toBe('02')
    })
  })

  describe('clearing and partial state', () => {
    it('Backspace on a segment emits null, keeps the other segment, and re-emits once complete', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:30' } })
      await key(w, 'minute', 'Backspace')
      expect(emitted(w)).toEqual([null])
      expect(text(w)).toEqual(['10', '--'])
      await key(w, 'minute', 'Delete')
      expect(emitted(w)).toEqual([null]) // no duplicate null
      await type(w, 'minute', '45')
      expect(emitted(w)?.at(-1)).toBe('10:45')
      await key(w, 'hour', 'Delete')
      expect(text(w)).toEqual(['--', '45'])
    })

    it('echoed null from the parent does not wipe the remaining segment', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:30' } })
      await key(w, 'minute', 'Backspace')
      await w.setProps({ modelValue: null })
      expect(text(w)).toEqual(['10', '--'])
    })

    it('Backspace on the period segment is a no-op', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:30', hour12: true } })
      await key(w, 'period', 'Backspace')
      expect(emitted(w)).toBeUndefined()
    })

    it('typing the minute while the hour is empty stays partial (no emit)', async () => {
      const w = mount(TimeInput)
      await type(w, 'minute', '30')
      expect(emitted(w)).toBeUndefined()
      expect(text(w)).toEqual(['--', '30'])
    })
  })

  describe('12h mode', () => {
    it('shows 1-12 with AM/PM and keeps a 24h model', async () => {
      const w = mount(TimeInput, { props: { modelValue: '13:05', hour12: true } })
      expect(text(w)).toEqual(['01', '05', 'PM'])
      expect(seg(w, 'hour').attributes('aria-valuemax')).toBe('12')
      expect(seg(w, 'hour').attributes('aria-valuemin')).toBe('1')
      expect(seg(w, 'period').attributes('aria-valuetext')).toBe('PM')
      await w.setProps({ modelValue: '00:15' })
      expect(text(w)).toEqual(['12', '15', 'AM'])
      await w.setProps({ modelValue: '12:00' })
      expect(text(w)).toEqual(['12', '00', 'PM'])
    })

    it('hour arrows cycle inside the period', async () => {
      const w = mount(TimeInput, { props: { modelValue: '11:00', hour12: true } })
      await key(w, 'hour', 'ArrowUp') // 11 AM -> 12 AM = 00
      expect(emitted(w)?.at(-1)).toBe('00:00')
      await key(w, 'hour', 'ArrowUp') // 12 AM -> 1 AM
      expect(emitted(w)?.at(-1)).toBe('01:00')
      await key(w, 'hour', 'ArrowDown')
      await key(w, 'hour', 'ArrowDown') // 12 AM -> 11 AM
      expect(emitted(w)?.at(-1)).toBe('11:00')
    })

    it('period toggles with arrows and a/p keys', async () => {
      const w = mount(TimeInput, { props: { modelValue: '09:30', hour12: true } })
      await key(w, 'period', 'ArrowUp')
      expect(emitted(w)?.at(-1)).toBe('21:30')
      await key(w, 'period', 'a')
      expect(emitted(w)?.at(-1)).toBe('09:30')
      await key(w, 'period', 'P')
      expect(emitted(w)?.at(-1)).toBe('21:30')
      const n = emitted(w)?.length
      await key(w, 'period', 'p') // already PM
      expect(emitted(w)).toHaveLength(n as number)
      await key(w, 'period', '5') // digits ignored on the period segment
      expect(emitted(w)).toHaveLength(n as number)
    })

    it('typing digits respects the 1-12 range and the period', async () => {
      const w = mount(TimeInput, { props: { hour12: true } })
      await key(w, 'period', 'p')
      expect(text(w)).toEqual(['--', '--', 'PM'])
      await type(w, 'hour', '3') // completes immediately
      await type(w, 'minute', '20')
      expect(emitted(w)?.at(-1)).toBe('15:20')
      await type(w, 'hour', '12')
      expect(emitted(w)?.at(-1)).toBe('12:20')
      await type(w, 'hour', '13') // 13 > 12 -> restart with 3
      expect(emitted(w)?.at(-1)).toBe('15:20')
      await type(w, 'hour', '05') // 0 waits, then 05
      expect(emitted(w)?.at(-1)).toBe('17:20')
    })

    it('Home/End on hour and period; arrows with empty value start at 12 AM', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:00', hour12: true } })
      await key(w, 'hour', 'End')
      expect(emitted(w)?.at(-1)).toBe('00:00')
      await key(w, 'hour', 'Home')
      expect(emitted(w)?.at(-1)).toBe('01:00')
      await key(w, 'period', 'End')
      expect(emitted(w)?.at(-1)).toBe('13:00')
      await key(w, 'period', 'Home')
      expect(emitted(w)?.at(-1)).toBe('01:00')
      const e = mount(TimeInput, { props: { hour12: true } })
      await key(e, 'hour', 'ArrowDown')
      expect(emitted(e)).toEqual(['00:00'])
      const e2 = mount(TimeInput, { props: { hour12: true } })
      await key(e2, 'minute', 'ArrowUp')
      expect(emitted(e2)).toEqual(['00:00'])
    })

    it('period Home/End with empty hour only flips the marker', async () => {
      const w = mount(TimeInput, { props: { hour12: true } })
      await key(w, 'period', 'End')
      expect(text(w)[2]).toBe('PM')
      expect(emitted(w)).toBeUndefined()
      await key(w, 'period', 'ArrowDown')
      expect(text(w)[2]).toBe('AM')
    })
  })

  describe('min / max', () => {
    it('clamps arrow results into range', async () => {
      const w = mount(TimeInput, { props: { modelValue: '09:30', min: '09:00', max: '17:00' } })
      await key(w, 'hour', 'ArrowDown') // 08:30 -> 09:00
      expect(emitted(w)?.at(-1)).toBe('09:00')
      expect(text(w)).toEqual(['09', '00'])
      await w.setProps({ modelValue: '16:30' })
      await key(w, 'hour', 'ArrowUp') // 17:30 -> 17:00
      expect(emitted(w)?.at(-1)).toBe('17:00')
    })

    it('typed values are clamped', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:00', max: '12:00' } })
      await type(w, 'hour', '20')
      expect(emitted(w)?.at(-1)).toBe('12:00')
      expect(text(w)).toEqual(['12', '00'])
    })

    it('ignores invalid or reversed bounds', async () => {
      const rev = mount(TimeInput, { props: { modelValue: '10:00', min: '18:00', max: '08:00' } })
      await key(rev, 'hour', 'ArrowUp')
      expect(emitted(rev)?.at(-1)).toBe('11:00')
      const bad = mount(TimeInput, { props: { modelValue: '10:00', min: 'zz', max: '25:99' } })
      await key(bad, 'hour', 'ArrowUp')
      expect(emitted(bad)?.at(-1)).toBe('11:00')
    })
  })

  describe('navigation, disabled and readonly', () => {
    it('ArrowLeft/Right move focus between segments, stopping at the edges', async () => {
      const w = mount(TimeInput, { props: { hour12: true, modelValue: '10:10' }, attachTo: document.body })
      await key(w, 'hour', 'ArrowRight')
      expect(document.activeElement).toBe(seg(w, 'minute').element)
      await key(w, 'minute', 'ArrowRight')
      expect(document.activeElement).toBe(seg(w, 'period').element)
      await key(w, 'period', 'ArrowRight')
      expect(document.activeElement).toBe(seg(w, 'period').element)
      await key(w, 'period', 'ArrowLeft')
      await key(w, 'minute', 'ArrowLeft')
      expect(document.activeElement).toBe(seg(w, 'hour').element)
      await key(w, 'hour', 'ArrowLeft')
      expect(document.activeElement).toBe(seg(w, 'hour').element)
      w.unmount()
    })

    it('readonly: arrow navigation works, edits do not', async () => {
      const w = mount(TimeInput, { props: { readonly: true, modelValue: '10:10' }, attachTo: document.body })
      expect(seg(w, 'hour').attributes('aria-readonly')).toBe('true')
      expect(seg(w, 'hour').attributes('tabindex')).toBe('0')
      await key(w, 'hour', 'ArrowRight')
      expect(document.activeElement).toBe(seg(w, 'minute').element)
      await key(w, 'minute', 'ArrowUp')
      await key(w, 'minute', 'Backspace')
      expect(emitted(w)).toBeUndefined()
      w.unmount()
    })

    it('disabled: not focusable, no events', async () => {
      const w = mount(TimeInput, { props: { disabled: true, modelValue: '10:10' } })
      expect(seg(w, 'hour').attributes('tabindex')).toBe('-1')
      expect(seg(w, 'hour').attributes('aria-disabled')).toBe('true')
      expect(w.find('[data-slot=time-input]').attributes('data-disabled')).toBeDefined()
      await key(w, 'hour', 'ArrowUp')
      await key(w, 'minute', 'ArrowRight')
      expect(emitted(w)).toBeUndefined()
    })

    it('rapid events keep state consistent', async () => {
      const w = mount(TimeInput, { props: { modelValue: '00:00' } })
      for (let i = 0; i < 60; i++) await key(w, 'minute', 'ArrowUp')
      expect(text(w)).toEqual(['00', '00'])
      expect(emitted(w)).toHaveLength(60) // every press changes the value; the 60th wraps back to 00:00
      expect(emitted(w)?.at(-1)).toBe('00:00')
    })
  })

  describe('customisation', () => {
    it('merges class last, forwards attrs, exposes sizes', () => {
      const w = mount(TimeInput, { props: { class: 'h-20', size: 'sm' }, attrs: { 'aria-label': 'Start', 'data-x': '1' } })
      const root = w.find('[data-slot=time-input]')
      expect(root.classes()).toContain('h-20')
      expect(root.classes()).not.toContain('h-8')
      expect(root.attributes('aria-label')).toBe('Start')
      expect(root.attributes('data-x')).toBe('1')
      expect(timeInputVariants({ size: 'lg' })).toContain('h-11')
      expect(timeInputVariants()).toContain('h-9')
    })

    it('custom labels', () => {
      const w = mount(TimeInput, { props: { hour12: true, hourLabel: 'Godz.', minuteLabel: 'Min.', periodLabel: 'Pora' } })
      expect(seg(w, 'hour').attributes('aria-label')).toBe('Godz.')
      expect(seg(w, 'minute').attributes('aria-label')).toBe('Min.')
      expect(seg(w, 'period').attributes('aria-label')).toBe('Pora')
    })

    it('invalid / required state attributes', () => {
      const w = mount(TimeInput, { props: { invalid: true, required: true } })
      expect(seg(w, 'hour').attributes('aria-invalid')).toBe('true')
      expect(seg(w, 'minute').attributes('aria-required')).toBe('true')
      expect(w.find('[data-slot=time-input]').attributes('data-invalid')).toBeDefined()
      const ok = mount(TimeInput)
      expect(seg(ok, 'hour').attributes('aria-invalid')).toBeUndefined()
    })

    it('hidden input mirrors the complete value', async () => {
      const w = mount(TimeInput, { props: { name: 'start', modelValue: '07:08' } })
      const input = () => w.find('input[type=hidden]').element as HTMLInputElement
      expect(input().name).toBe('start')
      expect(input().value).toBe('07:08')
      await key(w, 'minute', 'Backspace')
      await nextTick()
      expect(input().value).toBe('')
      expect(mount(TimeInput).find('input').exists()).toBe(false)
    })

    it('wires into Field', () => {
      const w = mount({ components: { Field, TimeInput }, template: '<Field label="Start" error="Bad" required disabled><TimeInput /></Field>' })
      const h = w.find('[data-segment=hour]')
      expect(h.attributes('id')).toBeTruthy()
      expect(h.attributes('aria-invalid')).toBe('true')
      expect(h.attributes('aria-disabled')).toBe('true')
      expect(w.find('[data-slot=time-input]').attributes('aria-describedby')).toBeTruthy()
    })
  })

  describe('accessibility and responsive behaviour', () => {
    const status = (w: W) => w.find('[data-slot=time-input-status]')

    it('names the group from the Field label when the caller did not', async () => {
      const w = mount({ components: { Field, TimeInput }, template: '<Field label="Start time"><TimeInput /></Field>' })
      await nextTick()
      const g = w.find('[data-slot=time-input]')
      const label = w.find('label')
      expect(label.attributes('id')).toBeTruthy()
      expect(g.attributes('aria-labelledby')).toBe(label.attributes('id'))
    })

    it('keeps an explicit aria-label instead of the Field label', async () => {
      const w = mount({ components: { Field, TimeInput }, template: '<Field label="Start time"><TimeInput aria-label="Own name" /></Field>' })
      await nextTick()
      const g = w.find('[data-slot=time-input]')
      expect(g.attributes('aria-label')).toBe('Own name')
      expect(g.attributes('aria-labelledby')).toBeUndefined()
    })

    it('has no aria-labelledby when standalone or when the Field has no label', async () => {
      expect(mount(TimeInput).find('[data-slot=time-input]').attributes('aria-labelledby')).toBeUndefined()
      const w = mount({ components: { Field, TimeInput }, template: '<Field><TimeInput /></Field>' })
      await nextTick()
      expect(w.find('[data-slot=time-input]').attributes('aria-labelledby')).toBeUndefined()
    })

    it('segments meet the 24px minimum target and a coarse-pointer height, with a forced-colors focus outline', () => {
      const w = mount(TimeInput, { props: { modelValue: '09:00', hour12: true } })
      for (const s of ['hour', 'minute', 'period'] as const) {
        const c = seg(w, s).classes()
        expect(c).toEqual(expect.arrayContaining(['min-h-6', 'min-w-6', 'pointer-coarse:min-h-9', 'forced-colors:focus:outline-2', 'outline-hidden']))
      }
      const root = w.find('[data-slot=time-input]').classes()
      expect(root).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'max-w-full', 'forced-colors:focus-within:outline-2']))
    })

    it('uses 16px text on small screens and logical spacing for the AM/PM segment', () => {
      expect(timeInputVariants({ size: 'md' })).toContain('text-md')
      expect(timeInputVariants({ size: 'sm' })).toContain('md:text-sm')
      const w = mount(TimeInput, { props: { hour12: true } })
      expect(seg(w, 'period').classes()).toContain('ms-1')
      expect(seg(w, 'period').classes()).not.toContain('ml-1')
    })

    it('has a polite, visually hidden status region that is empty at rest', () => {
      const w = mount(TimeInput, { props: { modelValue: '10:00' } })
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).classes()).toContain('sr-only')
      expect(status(w).text()).toBe('')
    })

    it('announces when max moves the time', async () => {
      const w = mount(TimeInput, { props: { modelValue: '17:00', max: '17:30', step: 15 } })
      await key(w, 'hour', 'ArrowUp')
      await key(w, 'hour', 'ArrowUp')
      await nextTick()
      await nextTick()
      expect(text(w)).toEqual(['17', '30'])
      expect(status(w).text()).toBe('Adjusted to 17:30')
    })

    it('announces when min moves the time, with a custom label', async () => {
      const w = mount(TimeInput, { props: { modelValue: '09:30', min: '09:00', adjustedLabel: 'Set to' } })
      await key(w, 'hour', 'ArrowDown')
      await nextTick()
      await nextTick()
      expect(status(w).text()).toBe('Set to 09:00')
    })

    it('does not announce when the time was not adjusted', async () => {
      const w = mount(TimeInput, { props: { modelValue: '10:00', min: '09:00', max: '17:00' } })
      await key(w, 'minute', 'ArrowUp')
      await nextTick()
      await nextTick()
      expect(status(w).text()).toBe('')
    })
  })
})
