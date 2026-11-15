import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormSection from './FormSection.vue'

describe('FormSection responsive', () => {
  it('the header wraps when the aside does not fit, so nothing overflows at 320px', () => {
    const w = mount(FormSection, { props: { title: 'Profile' }, slots: { aside: '<button>Reset</button>' } })
    const header = w.find('[data-slot="form-section-header"]')
    expect(header.classes()).toContain('flex-wrap')
    expect(header.find('[data-slot="form-section-heading"]').classes()).toContain('min-w-0')
  })
})
