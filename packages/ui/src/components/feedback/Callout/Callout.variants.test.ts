import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import Callout from './Callout.vue'
import { CALLOUT_APPEARANCES, CALLOUT_SIZES, CALLOUT_TYPES, calloutIconVariants, calloutVariants } from './variants'

const make = (props: Record<string, unknown> = {}, slots: Record<string, string> = { default: 'Body' }) => mount(Callout, { props, slots })

describe('Callout appearance', () => {
  it('soft is the default and keeps the original class string', () => {
    expect(calloutVariants({ type: 'note' })).toBe('relative flex gap-3 rounded-md border px-4 py-3 text-sm border-info/30 bg-info/10')
    expect(calloutVariants()).toBe(calloutVariants({ type: 'note', appearance: 'soft', size: 'md' }))
    const w = make()
    expect(w.classes()).toEqual(expect.arrayContaining(['border-info/30', 'bg-info/10', 'px-4', 'py-3', 'text-sm']))
    expect(w.attributes('data-appearance')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
  })

  it.each([
    ['note', 'bg-info', 'text-info-foreground'],
    ['tip', 'bg-success', 'text-success-foreground'],
    ['important', 'bg-primary', 'text-primary-foreground'],
    ['warning', 'bg-warning', 'text-warning-foreground'],
    ['caution', 'bg-destructive', 'text-destructive-foreground'],
    ['danger', 'bg-destructive', 'text-destructive-foreground'],
    ['success', 'bg-success', 'text-success-foreground'],
    ['quote', 'bg-foreground', 'text-background'],
    ['example', 'bg-secondary', 'text-secondary-foreground'],
  ] as const)('solid %s fills with its token pair', (type, bg, fg) => {
    const w = make({ type, appearance: 'solid' })
    expect(w.classes()).toContain(bg)
    expect(w.classes()).toContain(fg)
    expect(w.attributes('data-appearance')).toBe('solid')
    // the soft tint is replaced, not stacked
    expect(w.classes().some((c) => /^bg-[a-z-]+\/\d+$/.test(c))).toBe(false)
  })

  it('solid makes icon, body and dismiss follow the text colour', () => {
    const w = make({ type: 'warning', appearance: 'solid', dismissible: true }, { default: 'Body', title: 'Title' })
    expect(w.find('[data-slot="callout-icon"]').classes()).toContain('text-current')
    expect(w.find('[data-slot="callout-content"]').classes()).toContain('text-current')
    expect(w.find('[data-slot="callout-content"]').classes()).not.toContain('text-foreground/90')
    expect(w.find('[data-slot="callout-dismiss"]').classes()).toContain('text-current')
  })

  it.each(CALLOUT_TYPES)('outline %s has a border colour and a transparent surface', (type) => {
    const w = make({ type, appearance: 'outline' })
    expect(w.classes()).toContain('bg-transparent')
    expect(w.classes().some((c) => /^border-(info|success|chart-4|warning|destructive|border|chart-2)$/.test(c))).toBe(true)
    expect(w.attributes('data-appearance')).toBe('outline')
  })

  it('minimal drops the surface and the horizontal padding, at every size', () => {
    for (const size of CALLOUT_SIZES) {
      const w = make({ appearance: 'minimal', size })
      expect(w.classes()).toEqual(expect.arrayContaining(['border-transparent', 'bg-transparent', 'px-0']))
      expect(w.classes().some((c) => /^px-[1-9]/.test(c))).toBe(false)
    }
  })

  it('an unknown appearance falls back to soft', () => {
    const w = make({ appearance: 'glass' })
    expect(w.attributes('data-appearance')).toBeUndefined()
    expect(w.classes()).toContain('bg-info/10')
  })

  it('every appearance renders different markup', () => {
    const html = CALLOUT_APPEARANCES.map((appearance) => make({ appearance }).html())
    expect(new Set(html).size).toBe(CALLOUT_APPEARANCES.length)
  })
})

describe('Callout size', () => {
  it.each([
    ['sm', ['gap-2', 'px-3', 'py-2', 'text-xs']],
    ['md', ['gap-3', 'px-4', 'py-3', 'text-sm']],
    ['lg', ['gap-4', 'px-5', 'py-4', 'text-base']],
  ] as const)('%s sets padding, gap and type', (size, classes) => {
    const w = make({ size })
    expect(w.classes()).toEqual(expect.arrayContaining([...classes]))
    expect(w.attributes('data-size')).toBe(size === 'md' ? undefined : size)
  })

  it('scales the icon', () => {
    expect(calloutIconVariants({ size: 'sm' })).toContain('[&_svg]:size-3.5')
    expect(calloutIconVariants({ size: 'lg' })).toContain('[&_svg]:size-5')
    expect(calloutIconVariants({ type: 'note' })).toBe('mt-0.5 shrink-0 [&_svg]:size-4 text-info')
  })

  it('an unknown size falls back to md', () => {
    expect(make({ size: 'huge' }).classes()).toEqual(expect.arrayContaining(['px-4', 'py-3', 'text-sm']))
  })
})

describe('Callout combinations and customisation', () => {
  it.each(CALLOUT_APPEARANCES.flatMap((a) => CALLOUT_SIZES.map((s) => [a, s] as const)))('%s + %s renders without conflicting padding', (appearance, size) => {
    const w = make({ appearance, size, type: 'tip' })
    const px = w.classes().filter((c) => /^px-/.test(c))
    expect(px).toHaveLength(1)
  })

  it('class prop wins over appearance and size classes', () => {
    const w = make({ appearance: 'solid', size: 'lg', class: 'bg-card px-1 text-sm' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-card', 'px-1', 'text-sm']))
    expect(w.classes()).not.toContain('bg-info')
    expect(w.classes()).not.toContain('px-5')
  })

  it('keeps role=note and the type in every appearance', () => {
    for (const appearance of CALLOUT_APPEARANCES) {
      const w = make({ appearance, type: 'danger' })
      expect(w.attributes('role')).toBe('note')
      expect(w.attributes('data-type')).toBe('danger')
      expect(w.find('[data-slot="callout-icon"] svg').exists()).toBe(true)
    }
  })
})

describe('Callout dismiss and actions', () => {
  it('has no dismiss button by default', () => {
    expect(make().find('[data-slot="callout-dismiss"]').exists()).toBe(false)
  })

  it('dismissible renders a named button that hides the callout and emits once', async () => {
    const w = make({ dismissible: true })
    const btn = w.find('[data-slot="callout-dismiss"]')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('aria-label')).toBe('Dismiss')
    expect(btn.find('svg').attributes('aria-hidden')).toBe('true')
    expect(btn.classes()).toEqual(expect.arrayContaining(['size-7', 'pointer-coarse:size-10']))
    await btn.trigger('click')
    expect(w.find('[data-slot="callout"]').exists()).toBe(false)
    expect(w.emitted('dismiss')).toHaveLength(1)
  })

  it('uses a custom dismiss label', () => {
    expect(make({ dismissible: true, dismissLabel: 'Hide this tip' }).find('[data-slot="callout-dismiss"]').attributes('aria-label')).toBe('Hide this tip')
  })

  it('renders the actions slot under the content, inside the body', () => {
    const w = mount(Callout, { props: { title: 'Update' }, slots: { default: 'Body', actions: '<button type="button">Read notes</button>' } })
    const actions = w.find('[data-slot="callout-body"] [data-slot="callout-actions"]')
    expect(actions.exists()).toBe(true)
    expect(actions.classes()).toEqual(expect.arrayContaining(['flex', 'flex-wrap']))
    expect(actions.find('button').text()).toBe('Read notes')
  })

  it('renders no actions wrapper without the slot', () => {
    expect(make().find('[data-slot="callout-actions"]').exists()).toBe(false)
  })

  it('works with a custom icon, long text and no icon in every appearance', () => {
    for (const appearance of CALLOUT_APPEARANCES) {
      const w = make({ appearance, icon: faBell, hideIcon: false }, { default: 'x'.repeat(400) })
      expect(w.find('[data-slot="callout-icon"] path').attributes('d')).toBe(faBell.icon[4])
      expect(w.find('[data-slot="callout-body"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
      expect(make({ appearance, hideIcon: true }).find('[data-slot="callout-icon"]').exists()).toBe(false)
    }
  })
})
