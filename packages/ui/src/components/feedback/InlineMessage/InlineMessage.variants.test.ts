import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineMessage from './InlineMessage.vue'
import { INLINE_MESSAGE_SIZES, INLINE_MESSAGE_VARIANTS, inlineMessageVariants } from './variants'

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const
const make = (props: Record<string, unknown> = {}, text = 'Saved') => mount(InlineMessage, { props, slots: { default: text } })

describe('InlineMessage variant', () => {
  it('plain is the default and keeps the original class string', () => {
    expect(inlineMessageVariants()).toBe('flex items-start gap-1.5 leading-snug text-muted-foreground text-sm [&_svg]:size-3.5')
    const w = make()
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.classes()).not.toContain('rounded-md')
  })

  it.each(TONES)('soft %s tints the box and keeps the tone text colour', (tone) => {
    const w = make({ tone, variant: 'soft' })
    expect(w.classes()).toEqual(expect.arrayContaining(['w-fit', 'max-w-full', 'rounded-md', 'px-2', 'py-1']))
    expect(w.classes().some((c) => /^bg-(muted|info\/15|success\/15|warning\/20|destructive\/10)$/.test(c))).toBe(true)
    expect(w.classes().some((c) => /^text-(muted-foreground|info|success|warning-foreground|destructive)$/.test(c))).toBe(true)
    expect(w.attributes('data-variant')).toBe('soft')
  })

  it.each([
    ['neutral', 'border-border'],
    ['info', 'border-info/50'],
    ['success', 'border-success/50'],
    ['warning', 'border-warning'],
    ['danger', 'border-destructive/50'],
  ] as const)('outline %s has a %s border and no fill', (tone, border) => {
    const w = make({ tone, variant: 'outline' })
    expect(w.classes()).toEqual(expect.arrayContaining(['border', border, 'rounded-md']))
    expect(w.classes().some((c) => c.startsWith('bg-'))).toBe(false)
  })

  it('an unknown variant falls back to plain', () => {
    const w = make({ variant: 'glass' })
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.classes()).not.toContain('rounded-md')
  })

  it('every variant renders different markup', () => {
    expect(new Set(INLINE_MESSAGE_VARIANTS.map((variant) => make({ variant }).html())).size).toBe(INLINE_MESSAGE_VARIANTS.length)
  })

  it('keeps the icon, the text and the live role in every variant (not colour alone)', () => {
    for (const variant of INLINE_MESSAGE_VARIANTS) {
      const danger = make({ tone: 'danger', variant })
      expect(danger.attributes('role')).toBe('alert')
      expect(danger.find('[data-slot="inline-message-icon"]').exists()).toBe(true)
      expect(danger.find('[data-slot="inline-message-text"]').text()).toBe('Saved')
      expect(make({ tone: 'info', variant }).attributes('role')).toBe('status')
    }
  })
})

describe('InlineMessage size', () => {
  it.each([
    ['sm', 'text-xs', '[&_svg]:size-3'],
    ['md', 'text-sm', '[&_svg]:size-3.5'],
    ['lg', 'text-base', '[&_svg]:size-4'],
  ] as const)('%s sets text and icon size', (size, text, icon) => {
    const w = make({ size })
    expect(w.classes()).toEqual(expect.arrayContaining([text, icon]))
    expect(w.attributes('data-size')).toBe(size === 'md' ? undefined : size)
  })

  it('an unknown size falls back to md', () => {
    expect(make({ size: 'xl' }).classes()).toContain('text-sm')
  })

  it.each(INLINE_MESSAGE_SIZES.flatMap((s) => INLINE_MESSAGE_VARIANTS.map((v) => [s, v] as const)))('size %s + variant %s combine', (size, variant) => {
    const w = make({ size, variant, tone: 'success' })
    expect(w.classes().filter((c) => /^text-(xs|sm|base)$/.test(c))).toHaveLength(1)
    expect(w.attributes('data-variant')).toBe(variant === 'plain' ? undefined : variant)
  })
})

describe('InlineMessage customisation and edge cases', () => {
  it('class prop wins over variant classes', () => {
    const w = make({ variant: 'soft', tone: 'info', class: 'bg-card px-4 mine' })
    expect(w.classes()).toEqual(expect.arrayContaining(['bg-card', 'px-4', 'mine']))
    expect(w.classes()).not.toContain('bg-info/15')
    expect(w.classes()).not.toContain('px-2')
  })

  it('wraps long unbroken text and handles an empty slot in a boxed variant', () => {
    const long = make({ variant: 'outline' }, 'x'.repeat(600))
    expect(long.find('[data-slot="inline-message-text"]').classes()).toEqual(expect.arrayContaining(['min-w-0', 'break-words']))
    expect(mount(InlineMessage, { props: { variant: 'soft' } }).find('[data-slot="inline-message-text"]').text()).toBe('')
  })

  it('attrs still fall through (id for aria-describedby)', () => {
    expect(mount(InlineMessage, { props: { variant: 'soft' }, attrs: { id: 'f-msg' } }).attributes('id')).toBe('f-msg')
  })
})
