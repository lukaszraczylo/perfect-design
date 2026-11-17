import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Calendar from './Calendar.vue'

const headerOf = (w: ReturnType<typeof mount>, slot: string) => w.get(`[data-slot="${slot}"]`).element.closest('[data-slot="calendar-header"]')

describe('Calendar navigation placement', () => {
  it('puts previous and next on the first header when months are stacked', () => {
    const w = mount(Calendar, { props: { numberOfMonths: 2, orientation: 'vertical' } })
    const headers = w.findAll('[data-slot="calendar-header"]')
    expect(headerOf(w, 'calendar-prev')).toBe(headers[0]!.element)
    expect(headerOf(w, 'calendar-next')).toBe(headers[0]!.element)
    expect(headers[1]!.find('button').exists()).toBe(false)
  })

  it('keeps next on the last header when months sit side by side', () => {
    const w = mount(Calendar, { props: { numberOfMonths: 3 } })
    const headers = w.findAll('[data-slot="calendar-header"]')
    expect(headerOf(w, 'calendar-prev')).toBe(headers[0]!.element)
    expect(headerOf(w, 'calendar-next')).toBe(headers[2]!.element)
  })
})
