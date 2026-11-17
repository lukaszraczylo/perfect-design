import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { formatDay, formatTime, dayKey, toDate } from './date'
import { ChatMessage } from './index'

const mk = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = { default: 'Hello there' }) => mount(ChatMessage as never, { props: props as never, slots: slots as never }) as VueWrapper
const body = (w: VueWrapper) => w.find('[data-slot="chat-message-body"]')

describe('ChatMessage', () => {
  describe('good path', () => {
    it('renders a div root with data-slot, the content and a hidden speaker phrase', () => {
      const w = mk()
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('chat-message')
      expect(body(w).text()).toBe('Assistant said: Hello there')
      const role = w.find('[data-slot="chat-message-role"]')
      expect(role.classes()).toContain('sr-only')
      expect(role.text()).toBe('Assistant said:')
    })

    it.each([
      ['user', 'You said', 'end'],
      ['assistant', 'Assistant said', 'start'],
      ['system', 'System message', 'start'],
      ['tool', 'Tool result', 'start'],
    ] as const)('role %s speaks "%s" and sits at the %s', (role, phrase, align) => {
      const w = mk({ role })
      expect(w.attributes('data-role')).toBe(role)
      expect(w.attributes('data-align')).toBe(align)
      expect(w.find('[data-slot="chat-message-role"]').text()).toBe(`${phrase}:`)
    })

    it('explicit align wins over the role default and flips the row', () => {
      expect(mk({ role: 'user', align: 'start' }).attributes('data-align')).toBe('start')
      const end = mk({ role: 'assistant', align: 'end' })
      expect(end.classes()).toContain('flex-row-reverse')
      expect(end.find('[data-slot="chat-message-main"]').classes()).toContain('items-end')
      expect(mk({ role: 'assistant' }).classes()).not.toContain('flex-row-reverse')
    })

    it('roleLabel replaces the phrase and loses a trailing colon', () => {
      const w = mk({ roleLabel: 'Ada said:  ' })
      expect(w.find('[data-slot="chat-message-role"]').text()).toBe('Ada said:')
      expect(mk({ roleLabel: '   ' }).find('[data-slot="chat-message-role"]').text()).toBe('Assistant said:')
    })

    it('renders the avatar slot in its own column', () => {
      const w = mk({}, { default: 'x', avatar: () => h('i', { class: 'av' }, 'A') })
      expect(w.find('[data-slot="chat-message-avatar"] .av').exists()).toBe(true)
      expect(mk().find('[data-slot="chat-message-avatar"]').exists()).toBe(false)
    })

    it('renders the name and a real time element for a valid datetime', () => {
      const w = mk({ name: 'Orchard Mill support', datetime: '2026-03-02T09:41:00Z', timeZone: 'UTC', locale: 'en' })
      expect(w.find('[data-slot="chat-message-name"]').text()).toBe('Orchard Mill support')
      const time = w.find('time')
      expect(time.exists()).toBe(true)
      expect(time.attributes('datetime')).toBe('2026-03-02T09:41:00.000Z')
      expect(time.text()).toMatch(/9:41\s?AM/)
    })

    it('accepts a number and a Date', () => {
      const ms = Date.UTC(2026, 0, 5, 14, 5)
      expect(mk({ datetime: ms, timeZone: 'UTC', locale: 'en' }).find('time').attributes('datetime')).toBe(new Date(ms).toISOString())
      expect(mk({ datetime: new Date(ms), timeZone: 'UTC', locale: 'en' }).find('time').text()).toMatch(/2:05\s?PM/)
    })

    it('timeLabel replaces the formatted text and stays a time element', () => {
      const w = mk({ datetime: '2026-03-02T09:41:00Z', timeLabel: 'Just now' })
      expect(w.find('time').text()).toBe('Just now')
    })

    it('shows timeLabel as plain text when there is no valid date', () => {
      const w = mk({ timeLabel: 'Earlier' })
      expect(w.find('time').exists()).toBe(false)
      expect(w.find('[data-slot="chat-message-time"]').text()).toBe('Earlier')
    })

    it('the header slot replaces the default header', () => {
      const w = mk({ name: 'x' }, { default: 'x', header: (p: { author: string }) => h('b', { class: 'hd' }, `custom ${p.author}`) })
      expect(w.find('.hd').text()).toBe('custom x')
      expect(w.find('[data-slot="chat-message-name"]').exists()).toBe(false)
    })

    it('no header renders when there is no name, time or slot', () => {
      expect(mk().find('[data-slot="chat-message-header"]').exists()).toBe(false)
    })

    it('renders the default slot', () => {
      const w = mk({}, { default: () => h('strong', { class: 'in' }, 'Rich') })
      expect(w.find('.in').text()).toBe('Rich')
    })

    it('as changes the root element', () => {
      expect(mk({ as: 'li' }).element.tagName).toBe('LI')
      expect(mk({ as: 'article' }).element.tagName).toBe('ARTICLE')
    })
  })

  describe('status', () => {
    it.each([
      ['sending', 'Sending'],
      ['sent', 'Sent'],
      ['error', 'Failed to send'],
      ['streaming', 'Responding'],
    ] as const)('%s is written as "%s"', (status, text) => {
      const w = mk({ status })
      const el = w.find('[data-slot="chat-message-status"]')
      expect(el.text()).toBe(text)
      expect(w.attributes('data-status')).toBe(status)
    })

    it('has no status element and no aria-busy by default, and ignores unknown values', () => {
      for (const w of [mk(), mk({ status: 'weird' })]) {
        expect(w.find('[data-slot="chat-message-status"]').exists()).toBe(false)
        expect(w.attributes('aria-busy')).toBeUndefined()
        expect(w.attributes('data-status')).toBeUndefined()
      }
    })

    it('sending and streaming set aria-busy, sent and error do not', () => {
      expect(mk({ status: 'sending' }).attributes('aria-busy')).toBe('true')
      expect(mk({ status: 'streaming' }).attributes('aria-busy')).toBe('true')
      expect(mk({ status: 'sent' }).attributes('aria-busy')).toBeUndefined()
      expect(mk({ status: 'error' }).attributes('aria-busy')).toBeUndefined()
    })

    it('error shows an icon next to the text and uses the destructive colour', () => {
      const el = mk({ status: 'error' }).find('[data-slot="chat-message-status"]')
      expect(el.find('svg').exists()).toBe(true)
      expect(el.classes()).toContain('text-destructive')
    })

    it('statusLabel replaces the words; blank keeps the default', () => {
      expect(mk({ status: 'error', statusLabel: 'Could not reach the server' }).find('[data-slot="chat-message-status"]').text()).toBe('Could not reach the server')
      expect(mk({ status: 'error', statusLabel: '  ' }).find('[data-slot="chat-message-status"]').text()).toBe('Failed to send')
    })

    it('is not a live region by default and is a polite status with live', () => {
      expect(mk({ status: 'sent' }).find('[data-slot="chat-message-status"]').attributes('role')).toBeUndefined()
      expect(mk({ status: 'sent', live: true }).find('[data-slot="chat-message-status"]').attributes('role')).toBe('status')
    })

    it('streaming shows decorative typing dots that stay still under reduced motion', () => {
      const ind = mk({ status: 'streaming' }).find('[data-slot="chat-message-status"] [data-slot="typing-indicator"]')
      expect(ind.attributes('aria-hidden')).toBe('true')
      expect(ind.attributes('role')).toBeUndefined()
      expect(ind.find('[data-slot="typing-indicator-dot"]').classes()).toContain('motion-reduce:animate-none')
    })
  })

  describe('actions', () => {
    const actions = () => h('div', [h('button', { type: 'button', 'aria-label': 'Copy message' }, 'c'), h('button', { type: 'button' }, 'Retry')])

    it('renders the actions slot hidden-by-opacity only, never display none or hidden', () => {
      const w = mk({}, { default: 'x', actions })
      const el = w.find('[data-slot="chat-message-actions"]')
      expect(el.exists()).toBe(true)
      const cls = el.classes()
      expect(cls).toEqual(expect.arrayContaining(['opacity-0', 'group-hover/msg:opacity-100', 'group-focus-within/msg:opacity-100', 'pointer-coarse:opacity-100', 'forced-colors:opacity-100']))
      expect(cls).not.toContain('hidden')
      expect(cls).not.toContain('invisible')
      expect(cls.some((c) => /^(sm:|md:)?(hidden|invisible)$/.test(c))).toBe(false)
      expect(w.classes()).toContain('group/msg')
      expect(w.findAll('button')).toHaveLength(2)
    })

    it('buttons inside stay focusable', () => {
      const w = mount(ChatMessage as never, { slots: { default: 'x', actions }, attachTo: document.body }) as VueWrapper
      const btn = w.find('button').element as HTMLButtonElement
      btn.focus()
      expect(document.activeElement).toBe(btn)
      expect(btn.tabIndex).toBe(0)
      w.unmount()
    })

    it('end alignment right-justifies the actions and reverses the footer', () => {
      const w = mk({ align: 'end' }, { default: 'x', actions })
      expect(w.find('[data-slot="chat-message-actions"]').classes()).toContain('justify-end')
      expect(w.find('[data-slot="chat-message-footer"]').classes()).toContain('flex-row-reverse')
    })

    it('no footer without a status or actions', () => {
      expect(mk().find('[data-slot="chat-message-footer"]').exists()).toBe(false)
    })
  })

  describe('markdown', () => {
    it('renders through Markdown and wins over the slot', () => {
      const w = mk({ markdown: 'Some **bold** text' })
      expect(w.find('[data-slot="markdown"]').exists()).toBe(true)
      expect(w.find('strong').text()).toBe('bold')
      expect(body(w).text()).not.toContain('Hello there')
    })

    it('an empty markdown string renders an empty Markdown body, not the slot', () => {
      const w = mk({ markdown: '' })
      expect(w.find('[data-slot="markdown"]').exists()).toBe(true)
      expect(body(w).text()).not.toContain('Hello there')
    })

    it('streaming marks Markdown busy', () => {
      const w = mk({ markdown: 'Half **bol', status: 'streaming' })
      expect(w.find('[data-slot="markdown"]').attributes('aria-busy')).toBe('true')
      expect(w.find('strong').exists()).toBe(true)
    })

    it('system messages use the muted tone', () => {
      expect(mk({ role: 'system', markdown: 'x' }).find('[data-slot="markdown"]').classes()).toContain('text-muted-foreground')
    })

    it('external links open in a new tab with noopener', () => {
      const a = mk({ markdown: '[site](https://example.com/page)' }).find('a')
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toContain('noopener')
    })
  })

  describe('hostile text', () => {
    const hostile = '<script>window.__pwn = 1</script>\n\n<img src=x onerror="window.__pwn = 2">\n\n[click](javascript:window.__pwn=3) [data](data:text/html;base64,PHNjcmlwdD4=) <a href="javascript:1">raw</a>\n\n![t](javascript:alert(1)) ![p](https://example.com/p.png)'

    it('never creates script elements, handlers or unsafe urls from markdown', () => {
      const w = mk({ markdown: hostile })
      expect(w.find('script').exists()).toBe(false)
      expect([...w.element.querySelectorAll('*')].some((el) => [...el.attributes].some((a) => /^on/i.test(a.name)))).toBe(false)
      const urls = [...w.element.querySelectorAll('[href], [src]')].map((el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '')
      expect(urls).toEqual(['https://example.com/p.png'])
      expect(w.findAll('img')).toHaveLength(0)
      expect((window as unknown as { __pwn?: number }).__pwn).toBeUndefined()
      expect(w.text()).toContain('<script>')
    })

    it('http images become a safe link, data images stay inline, and showImages loads remote ones', () => {
      const link = mk({ markdown: '![Chart](https://example.com/p.png)' })
      expect(link.find('img').exists()).toBe(false)
      const a = link.find('[data-slot="chat-message-image-link"]')
      expect(a.attributes('href')).toBe('https://example.com/p.png')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      expect(a.text()).toContain('Chart')
      expect(mk({ markdown: '![](https://example.com/p.png)' }).find('[data-slot="chat-message-image-link"]').text()).toContain('Image')

      const inline = mk({ markdown: '![Dot](data:image/png;base64,iVBORw0KGgo=)' })
      expect(inline.find('img[data-slot="chat-message-image"]').exists()).toBe(true)
      expect(mk({ markdown: '![Dot](data:image/png;base64,iVBORw0KGgo= "Title")' }).find('img').attributes('title')).toBe('Title')

      const shown = mk({ markdown: '![Chart](https://example.com/p.png)', showImages: true })
      expect(shown.find('img[data-slot="markdown-image"]').exists()).toBe(true)
    })

    it('slot text and names are escaped, not parsed', () => {
      const w = mk({ name: '<b>x</b>', roleLabel: '<i>y</i>', timeLabel: '<u>z</u>' }, { default: () => '<img src=x onerror=alert(1)>' })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('b, i, u').exists()).toBe(false)
      expect(w.text()).toContain('<img src=x onerror=alert(1)>')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it win', () => {
      const w = mk({ class: 'custom-x gap-6' })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-2')
    })

    it('passes attributes and listeners through to the root', async () => {
      const onClick = vi.fn()
      const w = mount(ChatMessage as never, { attrs: { id: 'm1', 'data-test': 'y', onClick }, slots: { default: 'x' } }) as VueWrapper
      expect(w.attributes('id')).toBe('m1')
      expect(w.attributes('data-test')).toBe('y')
      await w.trigger('click')
      expect(onClick).toHaveBeenCalledOnce()
    })
  })

  describe('edge cases', () => {
    it('empty content still renders the shell', () => {
      const w = mk({}, {})
      expect(w.find('[data-slot="chat-message-body"]').exists()).toBe(true)
    })

    it('huge text with long unbreakable words wraps (break-words, min-w-0)', () => {
      const w = mk({}, { default: 'a'.repeat(20000) + ' ' + 'ünï'.repeat(5000) })
      expect(body(w).classes()).toEqual(expect.arrayContaining(['break-words', 'min-w-0', 'max-w-full']))
      expect(w.find('[data-slot="chat-message-main"]').classes()).toContain('min-w-0')
      expect(w.text().length).toBeGreaterThan(30000)
    })

    it('right-to-left text and a rtl container render without physical direction classes', () => {
      const w = mk({ roleLabel: 'قال', name: 'مساعد', markdown: 'مرحبا **بالعالم**' })
      expect(w.text()).toContain('مرحبا')
      expect(w.html()).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-\d/)
    })

    it('invalid role, variant and align fall back', () => {
      const w = mk({ role: 'robot', variant: 'neon', align: 'middle' })
      expect(w.attributes('data-role')).toBe('assistant')
      expect(w.attributes('data-variant')).toBe('bubble')
      expect(w.attributes('data-align')).toBe('start')
      expect(w.html()).toBe(mk().html())
    })

    it('invalid datetime shows no time element', () => {
      expect(mk({ datetime: 'not a date' }).find('time').exists()).toBe(false)
      expect(mk({ datetime: Number.NaN }).find('time').exists()).toBe(false)
      expect(mk({ datetime: null }).find('time').exists()).toBe(false)
    })

    it('bad locale and time zone do not throw', () => {
      const w = mk({ datetime: '2026-03-02T09:41:00Z', locale: 'zz-invalid-@@', timeZone: 'Mars/Base' })
      expect(w.find('time').text().length).toBeGreaterThan(0)
    })

    it('many messages mount quickly', () => {
      const t = performance.now()
      for (let i = 0; i < 100; i++) mk({ role: i % 2 ? 'user' : 'assistant' }, { default: `m${i}` })
      expect(performance.now() - t).toBeLessThan(5000)
    })
  })
})

describe('chat date helpers', () => {
  it('toDate handles every input', () => {
    expect(toDate('')).toBeNull()
    expect(toDate(undefined)).toBeNull()
    expect(toDate(new Date('nope'))).toBeNull()
    expect(toDate(0)?.getTime()).toBe(0)
  })

  it('dayKey uses the time zone', () => {
    const d = new Date('2026-03-02T23:30:00Z')
    expect(dayKey(d, 'UTC')).toBe('2026-03-02')
    expect(dayKey(d, 'Pacific/Auckland')).toBe('2026-03-03')
    expect(dayKey(d, 'Not/AZone')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('formatDay says Today and Yesterday relative to now, otherwise a date', () => {
    const now = new Date('2026-03-02T12:00:00Z')
    expect(formatDay(new Date('2026-03-02T01:00:00Z'), 'en', 'UTC', now)).toBe('Today')
    expect(formatDay(new Date('2026-03-01T23:00:00Z'), 'en', 'UTC', now)).toBe('Yesterday')
    expect(formatDay(new Date('2026-02-27T10:00:00Z'), 'en', 'UTC', now)).toBe('Feb 27, 2026')
    expect(formatDay(new Date('2026-02-27T10:00:00Z'), 'en', 'UTC')).toBe('Feb 27, 2026')
    expect(formatDay(new Date('2026-03-01T23:00:00Z'), 'de', 'UTC', now)).toBe('Gestern')
  })

  it('formatDay across a month boundary', () => {
    expect(formatDay(new Date('2026-02-28T10:00:00Z'), 'en', 'UTC', new Date('2026-03-01T09:00:00Z'))).toBe('Yesterday')
  })

  it('formatTime survives a bad locale', () => {
    expect(formatTime(new Date('2026-03-02T09:41:00Z'), 'xx-@@', 'UTC')).toMatch(/09:41|9:41/)
  })
})

describe('ChatMessage contract', () => {
  const errors: Error[] = []
  let wrapper: VueWrapper | undefined
  const open = async (actions: () => unknown) => {
    wrapper = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(ChatMessage as never, null, { default: () => 'x', actions })
        },
      }),
      { attachTo: document.body },
    )
    await flushPromises()
    await nextTick()
  }
  beforeEach(() => {
    errors.length = 0
    configureStrictMode('throw')
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
    configureStrictMode('off')
  })

  it('throws a ContractError when an action button has no accessible name', async () => {
    await open(() => h('button', { type: 'button' }, [h('svg', { 'aria-hidden': 'true' })]))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ChatMessage')
    expect(errors[0].message).toContain('accessible name')
    expect(errors[0].message).toContain('aria-label')
  })

  it('accepts aria-label, visible text and aria-labelledby', async () => {
    await open(() => [
      h('button', { type: 'button', 'aria-label': 'Copy message' }),
      h('button', { type: 'button' }, 'Retry'),
      h('span', { id: 'lbl' }, 'Share'),
      h('button', { type: 'button', 'aria-labelledby': 'lbl' }),
    ])
    expect(errors).toHaveLength(0)
  })

  it('checks links and role=button too', async () => {
    await open(() => h('a', { href: '/x' }))
    expect(errors).toHaveLength(1)
  })

  it('no actions slot means no check', async () => {
    wrapper = mount(ChatMessage as never, { slots: { default: 'x' }, attachTo: document.body }) as VueWrapper
    await flushPromises()
    expect(errors).toHaveLength(0)
  })

  it('warn mode logs without throwing and off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(() => h('button', { type: 'button' }))
    expect(errors).toHaveLength(0)
    expect(spy).toHaveBeenCalled()
    spy.mockClear()
    wrapper?.unmount()
    configureStrictMode('off')
    await open(() => h('button', { type: 'button' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
