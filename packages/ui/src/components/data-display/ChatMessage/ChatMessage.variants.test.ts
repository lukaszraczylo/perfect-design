import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { CHAT_MESSAGE_ALIGNS, CHAT_MESSAGE_ROLES, CHAT_MESSAGE_STATUSES, CHAT_MESSAGE_VARIANTS, ChatMessage, chatMessageBodyVariants, chatMessageMainVariants, chatMessageVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(ChatMessage as never, { props: props as never, slots: { default: 'Sample' } }) as ReturnType<typeof mount>
const body = (w: ReturnType<typeof mk>) => w.find('[data-slot="chat-message-body"]')

describe('ChatMessage variants', () => {
  it('lists the values', () => {
    expect([...CHAT_MESSAGE_VARIANTS]).toEqual(['bubble', 'plain', 'card'])
    expect([...CHAT_MESSAGE_ALIGNS]).toEqual(['start', 'end'])
    expect([...CHAT_MESSAGE_ROLES]).toEqual(['user', 'assistant', 'system', 'tool'])
    expect([...CHAT_MESSAGE_STATUSES]).toEqual(['sending', 'sent', 'error', 'streaming'])
  })

  it('the default output is the assistant bubble at the start (pinned)', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('group/msg flex w-full min-w-0 items-start gap-2')
    expect(body(w).attributes('class')).toBe('min-w-0 max-w-full break-words text-base rounded-lg border border-transparent px-3 py-2 bg-muted text-foreground')
    expect(chatMessageVariants()).toBe('group/msg flex w-full min-w-0 items-start gap-2')
  })

  describe.each(CHAT_MESSAGE_VARIANTS)('variant %s', (variant) => {
    it('sets data-variant and the surface', () => {
      const w = mk({ variant })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(chatMessageBodyVariants({ variant })).toBeTruthy()
    })
  })

  it('bubble is a tinted box with a transparent border for forced-colors mode', () => {
    expect(body(mk({ variant: 'bubble', role: 'user' })).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'border-transparent', 'bg-secondary', 'text-secondary-foreground']))
    expect(body(mk({ variant: 'bubble', role: 'assistant' })).classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-foreground']))
    expect(body(mk({ variant: 'bubble', role: 'system' })).classes()).toEqual(expect.arrayContaining(['border-dashed', 'text-muted-foreground', 'bg-background']))
    expect(body(mk({ variant: 'bubble', role: 'tool' })).classes()).toEqual(expect.arrayContaining(['font-mono', 'bg-card', 'border-border']))
  })

  it('plain has no box and no background', () => {
    const w = mk({ variant: 'plain', role: 'user' })
    const cls = body(w).classes()
    expect(cls).toContain('py-1')
    expect(cls.some((c) => c.startsWith('bg-') || c === 'border' || c === 'rounded-lg')).toBe(false)
    expect(w.find('[data-slot="chat-message-main"]').classes()).toContain('sm:max-w-3xl')
    expect(body(mk({ variant: 'plain', role: 'system' })).classes()).toContain('text-muted-foreground')
  })

  it('card is a bordered panel on every role', () => {
    for (const role of CHAT_MESSAGE_ROLES) expect(body(mk({ variant: 'card', role })).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'px-4', 'py-3']))
    expect(body(mk({ variant: 'card', role: 'assistant' })).classes()).toContain('bg-card')
    expect(body(mk({ variant: 'card', role: 'system' })).classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-muted-foreground']))
  })

  it('align end reverses the row and right-justifies the column; start does neither', () => {
    const end = mk({ align: 'end' })
    expect(end.classes()).toContain('flex-row-reverse')
    expect(end.find('[data-slot="chat-message-main"]').classes()).toContain('items-end')
    const start = mk({ align: 'start' })
    expect(start.classes()).not.toContain('flex-row-reverse')
    expect(start.find('[data-slot="chat-message-main"]').classes()).toContain('items-start')
    expect(chatMessageVariants({ align: 'end' })).toContain('flex-row-reverse')
    expect(chatMessageMainVariants({ align: 'end' })).toContain('items-end')
  })

  it('unknown values equal the default output', () => {
    expect(mk({ variant: 'x', role: 'y', align: 'z', status: 'q' }).html()).toBe(mk().html())
  })

  it('class wins over variant classes', () => {
    const w = mk({ class: 'gap-6 flex-col' })
    expect(w.classes()).toEqual(expect.arrayContaining(['gap-6', 'flex-col']))
    expect(w.classes()).not.toContain('gap-2')
  })

  it('combinations do not conflict: variant x role x align x status', () => {
    for (const variant of CHAT_MESSAGE_VARIANTS)
      for (const role of CHAT_MESSAGE_ROLES)
        for (const align of CHAT_MESSAGE_ALIGNS) {
          const w = mk({ variant, role, align, status: 'sent' })
          expect(w.attributes('data-variant')).toBe(variant)
          expect(w.attributes('data-role')).toBe(role)
          expect(w.attributes('data-align')).toBe(align)
          expect(w.find('[data-slot="chat-message-status"]').text()).toBe('Sent')
          expect(body(w).text()).toContain('Sample')
        }
  })

  it('every value of every dimension changes the markup', () => {
    const base = mk().html()
    for (const variant of CHAT_MESSAGE_VARIANTS.slice(1)) expect(mk({ variant }).html()).not.toBe(base)
    expect(mk({ align: 'end' }).html()).not.toBe(base)
    for (const status of CHAT_MESSAGE_STATUSES) expect(mk({ status }).html()).not.toBe(base)
    expect(new Set(CHAT_MESSAGE_STATUSES.map((status) => mk({ status }).html())).size).toBe(4)
  })

  it('layout classes use logical properties and wrap', () => {
    const html = mk({ align: 'end', status: 'error' }).html()
    expect(html).not.toMatch(/\b(?:ml|mr|pl|pr)-\d|text-(?:left|right)|\b(?:left|right)-\d/)
    expect(html).toContain('min-w-0')
    expect(html).toContain('flex-wrap')
  })
})
