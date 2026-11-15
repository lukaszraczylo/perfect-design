import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastItem from './ToastItem.vue'
import { TOAST_APPEARANCES, TOAST_LAYOUTS, toastIconVariants, toastProgressVariants, toastVariants } from './variants'

const TONES = ['default', 'success', 'warning', 'danger', 'info'] as const
const make = (props: Record<string, unknown> = {}) => mount(ToastItem, { props: { title: 'Saved', ...props } })

describe('ToastItem layout', () => {
  it('default keeps the original class string and adds no data-layout', () => {
    expect(toastVariants()).toBe(
      'pointer-events-auto relative flex w-full items-start gap-3 rounded-lg border bg-popover p-4 pe-10 text-sm pointer-coarse:pe-12 text-popover-foreground shadow-lg motion-safe:animate-ds-pop-in',
    )
    const w = make()
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.attributes('data-appearance')).toBeUndefined()
    expect(w.classes()).toEqual(expect.arrayContaining(['p-4', 'pe-10', 'text-sm', 'gap-3', 'items-start']))
  })

  it('compact is a dense card with smaller type and padding', () => {
    const w = make({ layout: 'compact', description: 'Done.' })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'p-3', 'pe-9', 'text-xs', 'pointer-coarse:pe-12']))
    expect(w.classes()).not.toContain('p-4')
    expect(w.classes()).not.toContain('text-sm')
    expect(w.attributes('data-layout')).toBe('compact')
    // the dismiss button keeps its size and name
    expect(w.find('[data-slot="toast-dismiss"]').classes()).toEqual(expect.arrayContaining(['size-7', 'pointer-coarse:size-10']))
  })

  it('inline moves the action to the end of the row, outside the body', () => {
    const onClick = vi.fn()
    const w = make({ layout: 'inline', action: { label: 'Undo', onClick } })
    expect(w.classes()).toContain('items-center')
    expect(w.find('[data-slot="toast-body"] [data-slot="toast-action"]').exists()).toBe(false)
    const action = w.find('[data-slot="toast"] > [data-slot="toast-action"]')
    expect(action.text()).toBe('Undo')
    expect(action.classes()).toEqual(expect.arrayContaining(['whitespace-nowrap', 'shrink-0']))
    expect(action.classes()).not.toContain('mt-1')
  })

  it('inline action still runs, emits action and dismiss', async () => {
    const onClick = vi.fn()
    const w = make({ layout: 'inline', action: { label: 'Undo', onClick } })
    await w.find('[data-slot="toast-action"]').trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    expect(w.emitted('action')).toHaveLength(1)
    expect(w.emitted('dismiss')).toHaveLength(1)
  })

  it('default and compact keep the action under the text', () => {
    for (const layout of ['default', 'compact']) {
      const w = make({ layout, action: { label: 'Undo', onClick: () => {} } })
      expect(w.find('[data-slot="toast-body"] [data-slot="toast-action"]').classes()).toContain('mt-1')
    }
  })

  it('an unknown layout falls back to default', () => {
    const w = make({ layout: 'wide' })
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.classes()).toContain('p-4')
  })

  it('every layout renders different markup', () => {
    const action = { label: 'Undo', onClick: () => {} }
    expect(new Set(TOAST_LAYOUTS.map((layout) => make({ layout, action }).html())).size).toBe(TOAST_LAYOUTS.length)
  })
})

describe('ToastItem appearance', () => {
  it.each([
    ['default', 'bg-muted', 'text-foreground'],
    ['success', 'bg-success/10', 'text-foreground'],
    ['warning', 'bg-warning/15', 'text-foreground'],
    ['danger', 'bg-destructive/10', 'text-foreground'],
    ['info', 'bg-info/10', 'text-foreground'],
  ] as const)('soft %s is tinted', (variant, bg, fg) => {
    const w = make({ appearance: 'soft', variant })
    expect(w.classes()).toEqual(expect.arrayContaining([bg, fg]))
    expect(w.classes()).not.toContain('bg-popover')
    expect(w.attributes('data-appearance')).toBe('soft')
  })

  it.each([
    ['default', 'bg-foreground', 'text-background'],
    ['success', 'bg-success', 'text-success-foreground'],
    ['warning', 'bg-warning', 'text-warning-foreground'],
    ['danger', 'bg-destructive', 'text-destructive-foreground'],
    ['info', 'bg-info', 'text-info-foreground'],
  ] as const)('solid %s uses the token pair', (variant, bg, fg) => {
    const w = make({ appearance: 'solid', variant, description: 'More detail' })
    expect(w.classes()).toEqual(expect.arrayContaining([bg, fg]))
    expect(w.classes()).not.toContain('bg-popover')
    expect(w.classes()).not.toContain('text-popover-foreground')
    // description, icon and dismiss follow the text colour instead of muted-foreground
    expect(w.find('[data-slot="toast-description"]').classes()).toContain('text-current')
    expect(w.find('[data-slot="toast-description"]').classes()).not.toContain('text-muted-foreground')
    expect(w.find('[data-slot="toast-icon"]').classes()).toContain('text-current')
    expect(w.find('[data-slot="toast-dismiss"]').classes()).toContain('text-current')
  })

  it('solid keeps the action readable on its own surface', () => {
    const w = make({ appearance: 'solid', variant: 'danger', action: { label: 'Retry', onClick: () => {} } })
    expect(w.find('[data-slot="toast-action"]').classes()).toEqual(expect.arrayContaining(['bg-background', 'text-foreground']))
  })

  it('solid progress bar fills with the text colour', () => {
    const w = make({ appearance: 'solid', variant: 'success', progress: true, duration: 4000 })
    expect(w.find('[data-slot="toast-progress-bar"]').classes()).toContain('bg-current')
    expect(toastProgressVariants({ variant: 'success', appearance: 'solid' })).toContain('bg-current')
    expect(toastIconVariants({ variant: 'warning', appearance: 'solid' })).toContain('text-current')
    expect(toastIconVariants({ variant: 'warning' })).toContain('text-warning-foreground')
  })

  it('an unknown appearance falls back to default', () => {
    const w = make({ appearance: 'glass', variant: 'success' })
    expect(w.attributes('data-appearance')).toBeUndefined()
    expect(w.classes()).toContain('bg-popover')
  })

  it('every appearance renders different markup', () => {
    expect(new Set(TOAST_APPEARANCES.map((appearance) => make({ appearance }).html())).size).toBe(TOAST_APPEARANCES.length)
  })
})

describe('ToastItem combinations and accessibility', () => {
  it.each(TOAST_LAYOUTS.flatMap((l) => TOAST_APPEARANCES.flatMap((a) => TONES.map((t) => [l, a, t] as const))))('%s + %s + %s keeps the roles, names and icon', (layout, appearance, variant) => {
    const w = make({ layout, appearance, variant, description: 'Detail', action: { label: 'Undo', onClick: () => {} } })
    expect(w.attributes('role')).toBe(variant === 'danger' || variant === 'warning' ? 'alert' : 'status')
    expect(w.find('[data-slot="toast-dismiss"]').attributes('aria-label')).toBe('Dismiss notification')
    expect(w.find('[data-slot="toast-action"]').text()).toBe('Undo')
    expect(w.find('[data-slot="toast-icon"] svg').attributes('aria-hidden')).toBe('true')
    expect(w.find('[data-slot="toast-title"]').text()).toBe('Saved')
    expect(w.classes().filter((c) => /^p-\d/.test(c))).toHaveLength(1)
  })

  it('hideIcon still hides the icon in every layout', () => {
    for (const layout of TOAST_LAYOUTS) expect(make({ layout, hideIcon: true }).find('[data-slot="toast-icon"]').exists()).toBe(false)
  })

  it('class prop wins over layout and appearance', () => {
    const w = make({ layout: 'compact', appearance: 'solid', variant: 'info', class: 'p-8 bg-card' })
    expect(w.classes()).toEqual(expect.arrayContaining(['p-8', 'bg-card']))
    expect(w.classes()).not.toContain('p-3')
    expect(w.classes()).not.toContain('bg-info')
  })

  it('long unbroken titles wrap in the compact layout', () => {
    const w = make({ layout: 'compact', title: 'x'.repeat(300) })
    expect(w.find('[data-slot="toast-title"]').classes()).toContain('break-words')
    expect(w.find('[data-slot="toast-body"]').classes()).toContain('min-w-0')
  })
})
