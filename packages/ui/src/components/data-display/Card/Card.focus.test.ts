import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'
import { cardVariants } from './variants'

describe('selectable Card focus indicator', () => {
  it('a checked card adds a solid outline on keyboard focus (its primary ring and border outrank the focus ring)', () => {
    const w = mount(Card, { props: { selectable: true, modelValue: true, 'aria-label': 'Plan' } })
    expect(w.attributes('data-state')).toBe('checked')
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'data-[state=checked]:focus-visible:outline-solid',
        'data-[state=checked]:focus-visible:outline-2',
        'data-[state=checked]:focus-visible:outline-offset-2',
        'data-[state=checked]:focus-visible:outline-ring',
        'focus-visible:ring-3',
      ]),
    )
  })
  it('a plain card does not carry the selectable focus classes', () => {
    expect(cardVariants()).not.toContain('focus-visible')
  })
})
