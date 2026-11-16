import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressRing from './ProgressRing.vue'

describe('ProgressRing valueText and stroke clamp', () => {
  it('aria-valuetext defaults to the percent and valueText overrides it', () => {
    expect(mount(ProgressRing, { props: { value: 42, label: 'Used' } }).attributes('aria-valuetext')).toBe('42%')
    expect(mount(ProgressRing, { props: { value: 42, label: 'Used', valueText: '42 of 100 GB' } }).attributes('aria-valuetext')).toBe('42 of 100 GB')
  })

  it.each([64, 100, 1000])('a stroke wider than the size is capped at size/2 and keeps a positive radius (strokeWidth %s)', (strokeWidth) => {
    const w = mount(ProgressRing, { props: { size: 64, strokeWidth, label: 'x' } })
    const arc = w.find('[data-slot="progress-ring-value"]')
    expect(Number(arc.attributes('r'))).toBeGreaterThan(0)
    expect(Number(arc.attributes('stroke-width'))).toBeLessThanOrEqual(32)
  })
})
