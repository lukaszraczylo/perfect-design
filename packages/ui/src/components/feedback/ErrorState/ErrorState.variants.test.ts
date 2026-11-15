import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorState from './ErrorState.vue'
import {
  ERROR_STATE_LAYOUTS,
  ERROR_STATE_SIZES,
  ERROR_STATE_TONES,
  ERROR_STATE_VARIANTS,
  errorStateActionsVariants,
  errorStateCodeVariants,
  errorStateIconVariants,
  errorStateMessageVariants,
  errorStateTitleVariants,
  errorStateVariants,
} from './variants'

const make = (props: Record<string, unknown> = {}) => mount(ErrorState, { props: { message: 'The server did not answer.', ...props } })
const part = (w: ReturnType<typeof make>, name: string) => w.find(`[data-slot="error-state-${name}"]`)

describe('ErrorState size', () => {
  it('md is the default and adds no data-size', () => {
    const w = make({ status: 500 })
    expect(w.attributes('data-size')).toBeUndefined()
    expect(errorStateVariants()).toBe('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center')
    expect(part(w, 'code').attributes('class')).toBe('font-bold tracking-tight text-muted-foreground tabular-nums text-5xl')
  })

  it('sm shrinks the block, the icon, the title and the message', () => {
    const w = make({ size: 'sm' })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'px-4', 'py-6']))
    expect(w.classes()).not.toContain('py-12')
    expect(part(w, 'icon').classes()).toEqual(expect.arrayContaining(['size-9', '[&_svg]:size-4']))
    expect(part(w, 'title').classes()).toContain('text-sm')
    expect(part(w, 'message').classes()).toContain('text-xs')
    expect(w.attributes('data-size')).toBe('sm')
  })

  it('lg enlarges the block, the icon, the title, the message and the code', () => {
    const w = make({ size: 'lg' })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-4', 'px-8', 'py-20']))
    expect(part(w, 'icon').classes()).toEqual(expect.arrayContaining(['size-16', '[&_svg]:size-7']))
    expect(part(w, 'title').classes()).toContain('text-xl')
    expect(part(w, 'message').classes()).toContain('text-base')
    expect(part(make({ size: 'lg', status: 404 }), 'code').classes()).toContain('text-6xl')
    expect(part(make({ size: 'sm', status: 404 }), 'code').classes()).toContain('text-3xl')
  })

  it('size does not change the inline row or the page layout', () => {
    for (const variant of ['inline', 'page'] as const) {
      const base = make({ variant })
      for (const size of ERROR_STATE_SIZES) expect(make({ variant, size }).classes().sort()).toEqual(base.classes().sort())
    }
    expect(errorStateTitleVariants({ variant: 'page', size: 'lg' })).toContain('text-2xl')
  })

  it('an unknown size falls back to md', () => {
    const w = make({ size: 'huge' })
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.classes()).toContain('py-12')
  })
})

describe('ErrorState layout', () => {
  it('center is the default', () => {
    const w = make()
    expect(w.attributes('data-layout')).toBeUndefined()
    expect(w.classes()).toEqual(expect.arrayContaining(['items-center', 'text-center']))
    expect(part(w, 'actions').classes()).toContain('justify-center')
  })

  it.each(['default', 'card', 'page'] as const)('start aligns the %s variant with logical properties', (variant) => {
    const w = make({ variant, layout: 'start' })
    expect(w.classes()).toEqual(expect.arrayContaining(['items-start', 'text-start']))
    expect(w.classes()).not.toContain('items-center')
    expect(w.classes()).not.toContain('text-center')
    expect(part(w, 'actions').classes()).toContain('justify-start')
    expect(part(w, 'actions').classes()).not.toContain('justify-center')
    expect(w.attributes('data-layout')).toBe('start')
  })

  it('start leaves the inline row as it is', () => {
    const w = make({ variant: 'inline', layout: 'start' })
    expect(w.classes()).toContain('text-left')
    expect(part(w, 'actions').classes()).toContain('justify-end')
  })

  it('an unknown layout falls back to center', () => {
    expect(make({ layout: 'end' }).attributes('data-layout')).toBeUndefined()
  })
})

describe('ErrorState tone', () => {
  it('danger is the default icon colour', () => {
    expect(part(make(), 'icon').classes()).toEqual(expect.arrayContaining(['bg-destructive/10', 'text-destructive']))
    expect(make().attributes('data-tone')).toBeUndefined()
  })

  it('warning and neutral recolour the icon bubble', () => {
    const warning = part(make({ tone: 'warning' }), 'icon').classes()
    expect(warning).toEqual(expect.arrayContaining(['bg-warning/20', 'text-warning-foreground', 'dark:text-warning']))
    expect(warning).not.toContain('bg-destructive/10')
    const neutral = part(make({ tone: 'neutral' }), 'icon').classes()
    expect(neutral).toEqual(expect.arrayContaining(['bg-muted', 'text-muted-foreground']))
    expect(neutral).not.toContain('text-destructive')
    expect(make({ tone: 'neutral' }).attributes('data-tone')).toBe('neutral')
  })

  it('recolours the inline row too', () => {
    expect(make({ variant: 'inline', tone: 'warning' }).classes()).toEqual(expect.arrayContaining(['border-warning/50', 'bg-warning/10']))
    expect(make({ variant: 'inline', tone: 'warning' }).classes()).not.toContain('border-destructive/30')
    expect(make({ variant: 'inline', tone: 'neutral' }).classes()).toEqual(expect.arrayContaining(['border-border', 'bg-muted/40']))
  })

  it('an unknown tone falls back to danger', () => {
    const w = make({ tone: 'purple' })
    expect(w.attributes('data-tone')).toBeUndefined()
    expect(part(w, 'icon').classes()).toContain('text-destructive')
  })

  it('helpers can be used standalone', () => {
    expect(errorStateIconVariants({ tone: 'warning' })).toContain('bg-warning/20')
    expect(errorStateActionsVariants({ layout: 'start' })).toContain('justify-start')
    expect(errorStateMessageVariants({ size: 'sm' })).toContain('text-xs')
    expect(errorStateCodeVariants({ variant: 'page' })).toContain('text-7xl')
  })
})

describe('ErrorState combinations and accessibility', () => {
  const cross = ERROR_STATE_VARIANTS.flatMap((v) => ERROR_STATE_SIZES.flatMap((s) => ERROR_STATE_LAYOUTS.flatMap((l) => ERROR_STATE_TONES.map((t) => [v, s, l, t] as const))))
  it.each(cross)('%s + %s + %s + %s keeps the alert, title, message and retry', (variant, size, layout, tone) => {
    const w = make({ variant, size, layout, tone, details: 'trace' })
    expect(w.attributes('role')).toBe('alert')
    expect(part(w, 'title').text()).toBe('Something went wrong')
    expect(part(w, 'message').text()).toBe('The server did not answer.')
    expect(part(w, 'retry').text()).toBe('Try again')
    expect(part(w, 'icon').find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.classes().filter((c) => /^py-\d/.test(c))).toHaveLength(1)
  })

  it('class prop wins over size and layout', () => {
    const w = make({ size: 'lg', layout: 'start', class: 'py-2 items-end' })
    expect(w.classes()).toEqual(expect.arrayContaining(['py-2', 'items-end']))
    expect(w.classes()).not.toContain('py-20')
    expect(w.classes()).not.toContain('items-start')
  })

  it('a long unbroken title and message wrap', () => {
    const w = make({ title: 'x'.repeat(300), message: 'y'.repeat(300), size: 'sm' })
    expect(part(w, 'title').classes()).toContain('break-words')
    expect(part(w, 'message').classes()).toContain('break-words')
  })
})
