import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { CHAT_THREAD_DENSITIES, ChatThread, chatThreadContentVariants, chatThreadLogClasses, chatThreadVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(ChatThread as never, { props: { label: 'Thread', ...props } as never, slots: { default: 'Sample' } }) as ReturnType<typeof mount>
const content = (w: ReturnType<typeof mk>) => w.find('[data-slot="chat-thread-content"]')

describe('ChatThread density', () => {
  it('lists the values', () => expect([...CHAT_THREAD_DENSITIES]).toEqual(['compact', 'default', 'relaxed']))

  it('default keeps the pinned class strings and no data-density', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('relative flex min-h-0 min-w-0 flex-col')
    expect(w.attributes('data-density')).toBeUndefined()
    expect(content(w).attributes('class')).toBe('flex min-w-0 flex-col gap-3 p-3')
    expect(chatThreadVariants()).toBe('relative flex min-h-0 min-w-0 flex-col')
    expect(chatThreadContentVariants()).toBe('flex min-w-0 flex-col gap-3 p-3')
  })

  it.each([
    ['compact', 'gap-2', 'p-2'],
    ['relaxed', 'gap-5', 'p-4'],
  ] as const)('%s sets gap and padding and data-density', (density, gap, pad) => {
    const w = mk({ density })
    expect(content(w).classes()).toEqual(expect.arrayContaining([gap, pad]))
    expect(content(w).classes()).not.toContain('gap-3')
    expect(w.attributes('data-density')).toBe(density)
  })

  it('every density renders a different thread', () => {
    expect(new Set(CHAT_THREAD_DENSITIES.map((density) => mk({ density }).html())).size).toBe(3)
  })

  it('unknown density equals the default', () => expect(mk({ density: 'huge' }).html()).toBe(mk().html()))

  it('class wins on the root and does not touch the content classes', () => {
    const w = mk({ class: 'flex-row h-80', density: 'compact' })
    expect(w.classes()).toEqual(expect.arrayContaining(['flex-row', 'h-80']))
    expect(w.classes()).not.toContain('flex-col')
    expect(content(w).classes()).toContain('gap-2')
  })

  it('the log is focusable with a forced-colors fallback and no horizontal scroll', () => {
    const cls = chatThreadLogClasses
    expect(cls).toContain('focus-visible:ring-3')
    expect(cls).toContain('forced-colors:focus-visible:outline-2')
    expect(cls).toContain('overflow-y-auto')
    expect(cls).not.toMatch(/overflow-x-(?:auto|scroll)/)
  })

  it('uses logical properties only', () => {
    expect(mk({ density: 'relaxed', typing: true, canLoadOlder: true }).html()).not.toMatch(/\b(?:ml|mr|pl|pr)-\d|text-(?:left|right)|\b(?:left|right)-\d/)
  })
})
