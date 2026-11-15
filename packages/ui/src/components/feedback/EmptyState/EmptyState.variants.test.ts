import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import EmptyState from './EmptyState.vue'
import {
  EMPTY_STATE_LAYOUTS,
  EMPTY_STATE_TONES,
  EMPTY_STATE_VARIANTS,
  emptyStateActionVariants,
  emptyStateIconVariants,
  emptyStateVariants,
} from './variants'

const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mount(EmptyState, { props: { title: 'No invoices yet', description: 'Create one to start.', icon: faInbox, ...props }, slots: { action: '<button type="button">Create</button>', ...slots } })
const icon = (w: ReturnType<typeof make>) => w.find('[data-slot="empty-state-icon"]')

describe('EmptyState layout', () => {
  it('center is the default and keeps the original class strings', () => {
    const w = make()
    expect(w.attributes('class')).toBe('flex flex-col items-center justify-center text-center gap-3 px-6 py-12')
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.find('[data-slot="empty-state-action"]').attributes('class')).toBe('mt-1 flex flex-wrap items-center justify-center gap-2')
  })

  it.each(['default', 'card', 'bordered-dashed', 'compact'] as const)('start aligns the %s variant to the start edge', (variant) => {
    const w = make({ variant, layout: 'start' })
    expect(w.classes()).toEqual(expect.arrayContaining(['items-start', 'text-start']))
    expect(w.classes()).not.toContain('items-center')
    expect(w.classes()).not.toContain('text-center')
    expect(w.find('[data-slot="empty-state-action"]').classes()).toContain('justify-start')
    expect(w.find('[data-slot="empty-state-action"]').classes()).not.toContain('justify-center')
    expect(w.attributes('data-layout')).toBe('start')
  })

  it('start leaves the inline variant as it is', () => {
    const base = make({ variant: 'inline' })
    const w = make({ variant: 'inline', layout: 'start' })
    expect(w.classes().sort()).toEqual(base.classes().sort())
    expect(w.find('[data-slot="empty-state-action"]').classes()).toContain('justify-end')
  })

  it('an unknown layout falls back to center', () => {
    const w = make({ layout: 'end' })
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.classes()).toContain('items-center')
  })

  it('class prop wins over layout classes', () => {
    const w = make({ layout: 'start', class: 'items-center text-center' })
    expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
    expect(w.classes()).not.toContain('items-start')
  })

  it('helpers work standalone', () => {
    expect(emptyStateVariants({ layout: 'start' })).toContain('items-start')
    expect(emptyStateActionVariants({ layout: 'start' })).toContain('justify-start')
  })
})

describe('EmptyState tone', () => {
  it('neutral is the default grey bubble', () => {
    const w = make()
    expect(icon(w).attributes('class')).toBe('flex items-center justify-center rounded-full bg-muted text-muted-foreground size-12 [&_svg]:size-5')
    expect(w.attributes('data-tone')).toBeUndefined()
  })

  it.each([
    ['info', 'bg-info/15', 'text-info'],
    ['success', 'bg-success/15', 'text-success'],
    ['warning', 'bg-warning/20', 'text-warning-foreground'],
    ['danger', 'bg-destructive/10', 'text-destructive'],
  ] as const)('%s tints the bubble and replaces the grey', (tone, bg, fg) => {
    const w = make({ tone })
    expect(icon(w).classes()).toEqual(expect.arrayContaining([bg, fg]))
    expect(icon(w).classes()).not.toContain('bg-muted')
    expect(icon(w).classes()).not.toContain('text-muted-foreground')
    expect(w.attributes('data-tone')).toBe(tone)
  })

  it('warning also has the dark mode colour', () => {
    expect(emptyStateIconVariants({ tone: 'warning' })).toContain('dark:text-warning')
  })

  it('an unknown tone falls back to neutral', () => {
    const w = make({ tone: 'purple' })
    expect(w.attributes('data-tone')).toBeUndefined()
    expect(icon(w).classes()).toContain('bg-muted')
  })

  it('the tone is reflected on the root even without an icon', () => {
    const w = mount(EmptyState, { props: { title: 'Nothing here', tone: 'warning' } })
    expect(w.attributes('data-tone')).toBe('warning')
  })
})

describe('EmptyState combinations and accessibility', () => {
  const cross = EMPTY_STATE_VARIANTS.flatMap((v) => EMPTY_STATE_LAYOUTS.flatMap((l) => EMPTY_STATE_TONES.map((t) => [v, l, t] as const)))
  it.each(cross)('%s + %s + %s keeps the heading, text, decorative icon and action', (variant, layout, tone) => {
    const w = make({ variant, layout, tone })
    expect(w.find('[data-slot="empty-state-title"]').element.tagName).toBe('H3')
    expect(w.find('[data-slot="empty-state-title"]').text()).toBe('No invoices yet')
    expect(w.find('[data-slot="empty-state-description"]').text()).toBe('Create one to start.')
    expect(icon(w).find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.find('[data-slot="empty-state-action"] button').text()).toBe('Create')
  })

  it('works without description and action, with long unbroken text', () => {
    const w = mount(EmptyState, { props: { title: 'x'.repeat(300), layout: 'start', tone: 'info' } })
    expect(w.find('[data-slot="empty-state-title"]').classes()).toContain('break-words')
    expect(w.find('[data-slot="empty-state-action"]').exists()).toBe(false)
  })
})
