import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { computed, createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  DEFAULT_SEQUENCE_TIMEOUT,
  MAX_SEQUENCE_STEPS,
  formatHotkey,
  isMacPlatform,
  listHotkeys,
  parseHotkey,
  useHotkeyRegistry,
  useHotkeys,
  useRegisteredHotkeys,
  type HotkeyInput,
  type UseHotkeysOptions,
} from './hotkeys'

const wrappers: VueWrapper[] = []
const scopes: ReturnType<typeof effectScope>[] = []
let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  scopes.splice(0).forEach((s) => s.stop())
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  warn.mockRestore()
  expect(useHotkeyRegistry().value).toEqual([])
})

/** Register inside a component (the normal path); resolves after the mount hook ran. */
function host(input: HotkeyInput | (() => HotkeyInput), options: UseHotkeysOptions = {}) {
  let api!: ReturnType<typeof useHotkeys>
  const w = mount(
    defineComponent({
      setup() {
        api = useHotkeys(input, options)
        return () => h('div', { id: 'host' }, h('input', { id: 'field' }))
      },
    }),
    { attachTo: document.body },
  )
  wrappers.push(w)
  return { w, api }
}

/** Register in a plain effect scope (no component instance). */
function scoped(input: HotkeyInput | (() => HotkeyInput), options: UseHotkeysOptions = {}) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useHotkeys(input, options))!
}

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

describe('parseHotkey', () => {
  it.each([
    ['k', { key: 'k', ctrl: false, alt: false, shift: false, meta: false }],
    ['K', { key: 'k', ctrl: false, alt: false, shift: false, meta: false }],
    ['?', { key: '?', ctrl: false, alt: false, shift: false, meta: false }],
    ['shift+?', { key: '?', ctrl: false, alt: false, shift: false, meta: false }],
    ['ctrl+k', { key: 'k', ctrl: true, alt: false, shift: false, meta: false }],
    ['Control+Shift+K', { key: 'k', ctrl: true, alt: false, shift: true, meta: false }],
    ['option+x', { key: 'x', ctrl: false, alt: true, shift: false, meta: false }],
    ['cmd+s', { key: 's', ctrl: false, alt: false, shift: false, meta: true }],
    ['command+s', { key: 's', ctrl: false, alt: false, shift: false, meta: true }],
    ['esc', { key: 'escape', ctrl: false, alt: false, shift: false, meta: false }],
    ['return', { key: 'enter', ctrl: false, alt: false, shift: false, meta: false }],
    ['up', { key: 'arrowup', ctrl: false, alt: false, shift: false, meta: false }],
    ['ArrowDown', { key: 'arrowdown', ctrl: false, alt: false, shift: false, meta: false }],
    ['space', { key: 'space', ctrl: false, alt: false, shift: false, meta: false }],
    ['f5', { key: 'f5', ctrl: false, alt: false, shift: false, meta: false }],
    ['F24', { key: 'f24', ctrl: false, alt: false, shift: false, meta: false }],
    ['ctrl++', { key: '+', ctrl: true, alt: false, shift: false, meta: false }],
    ['ctrl+plus', { key: '+', ctrl: true, alt: false, shift: false, meta: false }],
    ['+', { key: '+', ctrl: false, alt: false, shift: false, meta: false }],
    ['  ctrl + k ', { key: 'k', ctrl: true, alt: false, shift: false, meta: false }],
  ])('parses %j', (input, step) => {
    expect(parseHotkey(input, false)?.steps).toEqual([step])
  })

  it('resolves mod to Meta on macOS and Ctrl elsewhere', () => {
    expect(parseHotkey('mod+k', true)?.steps[0]).toMatchObject({ meta: true, ctrl: false })
    expect(parseHotkey('mod+k', false)?.steps[0]).toMatchObject({ meta: false, ctrl: true })
  })

  it('parses sequences', () => {
    expect(parseHotkey('g then d', false)?.steps.map((s) => s.key)).toEqual(['g', 'd'])
    expect(parseHotkey('G THEN D', false)?.steps).toHaveLength(2)
    expect(parseHotkey('ctrl+k then ctrl+b', false)?.steps).toHaveLength(2)
    expect(parseHotkey(Array(MAX_SEQUENCE_STEPS).fill('a').join(' then '), false)?.steps).toHaveLength(MAX_SEQUENCE_STEPS)
  })

  it.each([
    [''],
    ['   '],
    ['ctrl'],
    ['ctrl+shift'],
    ['mod'],
    ['shift+alt+meta'],
    ['k+ctrl'],
    ['ctrl+'],
    ['+k'],
    ['ctrl++k'],
    ['++'],
    ['ctrl+ +k'],
    ['foo'],
    ['ctrl+foo'],
    ['hyper+k'],
    ['f0'],
    ['f25'],
    ['g then'],
    ['then d'],
    ['g then then d'],
    ['g then  '],
    ['constructor'],
    ['__proto__'],
    ['ctrl+constructor'],
    ['toString'],
    ['hasOwnProperty+k'],
    ['ab'],
    ['\u{1F600}\u{1F600}'],
  ])('rejects %j', (input) => {
    expect(parseHotkey(input, false)).toBeNull()
  })

  it('accepts a single astral character', () => {
    expect(parseHotkey('\u{1F600}', false)?.steps[0].key).toBe('\u{1F600}')
  })

  it.each([[undefined], [null], [42], [{}], [['a']], [() => 'a']])('rejects the non-string %p', (input) => {
    expect(parseHotkey(input, false)).toBeNull()
  })

  it('rejects sequences longer than the limit and huge input without hanging', () => {
    expect(parseHotkey(Array(MAX_SEQUENCE_STEPS + 1).fill('a').join(' then '), false)).toBeNull()
    expect(parseHotkey(Array(10_000).fill('a').join(' then '), false)).toBeNull()
    expect(parseHotkey('a'.repeat(100_000), false)).toBeNull()
    expect(parseHotkey(`ctrl+${'shift+'.repeat(500)}k`, false)).toBeNull()
  })
})

describe('formatHotkey', () => {
  it('formats non-mac labels and spoken text', () => {
    expect(formatHotkey('mod+k', false)).toEqual({ labels: [['Ctrl', 'K']], spoken: 'Control plus K' })
    expect(formatHotkey('ctrl+alt+shift+meta+x', false)).toEqual({ labels: [['Ctrl', 'Alt', 'Shift', 'Meta', 'X']], spoken: 'Control plus Alt plus Shift plus Windows plus X' })
  })
  it('formats mac symbols', () => {
    expect(formatHotkey('mod+shift+p', true)).toEqual({ labels: [['⇧', '⌘', 'P']], spoken: 'Shift plus Command plus P' })
    expect(formatHotkey('ctrl+alt+x', true)?.labels).toEqual([['⌃', '⌥', 'X']])
  })
  it('formats sequences, named keys and function keys', () => {
    expect(formatHotkey('g then d', false)).toEqual({ labels: [['G'], ['D']], spoken: 'G then D' })
    expect(formatHotkey('esc', false)).toEqual({ labels: [['Esc']], spoken: 'Escape' })
    expect(formatHotkey('?', false)).toEqual({ labels: [['?']], spoken: 'Question mark' })
    expect(formatHotkey('up', false)).toEqual({ labels: [['↑']], spoken: 'Up arrow' })
    expect(formatHotkey('pageup', false)?.labels).toEqual([['Page Up']])
    expect(formatHotkey('f12', false)).toEqual({ labels: [['F12']], spoken: 'F12' })
    expect(formatHotkey('space', false)).toEqual({ labels: [['Space']], spoken: 'Space' })
  })
  it('returns null for invalid combos', () => {
    expect(formatHotkey('', false)).toBeNull()
    expect(formatHotkey('ctrl', false)).toBeNull()
  })
  it('uses the detected platform by default', () => {
    expect(formatHotkey('mod+k')?.labels).toEqual([['Ctrl', 'K']])
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: '' })
    expect(formatHotkey('mod+k')?.labels).toEqual([['⌘', 'K']])
  })
})

describe('isMacPlatform', () => {
  it('is false in jsdom', () => expect(isMacPlatform()).toBe(false))
  it('reads userAgentData first', () => {
    vi.stubGlobal('navigator', { userAgentData: { platform: 'macOS' }, platform: 'Win32' })
    expect(isMacPlatform()).toBe(true)
    vi.stubGlobal('navigator', { userAgentData: { platform: 'Windows' }, platform: 'MacIntel' })
    expect(isMacPlatform()).toBe(false)
  })
  it('falls back to navigator.platform, then the user agent', () => {
    vi.stubGlobal('navigator', { platform: 'iPhone' })
    expect(isMacPlatform()).toBe(true)
    vi.stubGlobal('navigator', { platform: '', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' })
    expect(isMacPlatform()).toBe(true)
    vi.stubGlobal('navigator', { platform: 'Linux x86_64' })
    expect(isMacPlatform()).toBe(false)
    vi.stubGlobal('navigator', {})
    expect(isMacPlatform()).toBe(false)
  })
  it('is false without navigator and when navigator throws', () => {
    vi.stubGlobal('navigator', undefined)
    expect(isMacPlatform()).toBe(false)
    vi.stubGlobal('navigator', {
      get platform(): string {
        throw new Error('blocked')
      },
    })
    expect(isMacPlatform()).toBe(false)
  })
})

describe('useHotkeys matching', () => {
  it('fires a plain key and passes the event', () => {
    const fn = vi.fn()
    host({ '?': fn })
    const event = press(document, '?', { shiftKey: true })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.mock.calls[0][0]).toBe(event)
  })

  it('resolves mod to Ctrl off macOS and Meta on macOS', () => {
    const fn = vi.fn()
    host({ 'mod+k': fn })
    press(document, 'k', { metaKey: true })
    expect(fn).not.toHaveBeenCalled()
    press(document, 'k', { ctrlKey: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('uses Meta for mod on macOS', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' })
    const fn = vi.fn()
    host({ 'mod+k': fn })
    press(document, 'k', { ctrlKey: true })
    expect(fn).not.toHaveBeenCalled()
    press(document, 'k', { metaKey: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('matches modifiers exactly', () => {
    const fn = vi.fn()
    host({ 'ctrl+k': fn })
    press(document, 'k')
    press(document, 'k', { ctrlKey: true, shiftKey: true })
    press(document, 'k', { ctrlKey: true, altKey: true })
    press(document, 'k', { ctrlKey: true, metaKey: true })
    expect(fn).not.toHaveBeenCalled()
    press(document, 'k', { ctrlKey: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not fire a bare key when a modifier is held', () => {
    const fn = vi.fn()
    host({ k: fn })
    press(document, 'k', { ctrlKey: true })
    press(document, 'k', { metaKey: true })
    press(document, 'k', { altKey: true })
    press(document, 'k', { shiftKey: true })
    expect(fn).not.toHaveBeenCalled()
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('matches shift+letter case-insensitively and ignores shift for punctuation', () => {
    const letter = vi.fn()
    const question = vi.fn()
    host({ 'shift+k': letter, '?': question })
    press(document, 'K', { shiftKey: true })
    expect(letter).toHaveBeenCalledTimes(1)
    press(document, '?')
    press(document, '?', { shiftKey: true })
    expect(question).toHaveBeenCalledTimes(2)
  })

  it('matches named keys and aliases', () => {
    const esc = vi.fn()
    const up = vi.fn()
    const space = vi.fn()
    const f5 = vi.fn()
    host({ esc, up, space, f5 })
    press(document, 'Escape')
    press(document, 'ArrowUp')
    press(document, ' ')
    press(document, 'F5')
    expect([esc, up, space, f5].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1])
  })

  it('resolves Alt+letter through event.code (Option rewrites the character on macOS)', () => {
    const letter = vi.fn()
    const digit = vi.fn()
    host({ 'alt+k': letter, 'alt+1': digit })
    press(document, '˚', { altKey: true, code: 'KeyK' })
    press(document, '¡', { altKey: true, code: 'Digit1' })
    expect(letter).toHaveBeenCalledTimes(1)
    expect(digit).toHaveBeenCalledTimes(1)
  })

  it('matches shift+digit through event.code (shift rewrites the character)', () => {
    const fn = vi.fn()
    const bang = vi.fn()
    host({ 'shift+1': fn, '!': bang })
    press(document, '!', { shiftKey: true, code: 'Digit1' })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(bang).toHaveBeenCalledTimes(1)
  })

  it('matches Alt+letter on the produced character for non-QWERTY layouts, and falls back to code when Alt rewrote it', () => {
    const a = vi.fn()
    host({ 'alt+a': a })
    press(document, 'a', { altKey: true, code: 'KeyQ' }) // AZERTY: the key labelled A sits at KeyQ
    expect(a).toHaveBeenCalledTimes(1)
    press(document, 'å', { altKey: true, code: 'KeyA' }) // macOS Option+A
    expect(a).toHaveBeenCalledTimes(2)
    press(document, 'q', { altKey: true, code: 'KeyQ' }) // produced 'q' must not trigger alt+a
    expect(a).toHaveBeenCalledTimes(2)
  })

  it('ignores repeats, composition, modifier-only presses and events without a key', () => {
    const fn = vi.fn()
    host({ k: fn, 'ctrl+k': fn })
    press(document, 'k', { repeat: true })
    press(document, 'k', { isComposing: true })
    press(document, 'Process')
    press(document, 'Control', { ctrlKey: true })
    press(document, 'Shift', { shiftKey: true })
    press(document, 'Meta', { metaKey: true })
    document.dispatchEvent(new Event('keydown', { bubbles: true }))
    document.dispatchEvent(Object.assign(new Event('keydown'), { key: 42 }))
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not react to keyup or keypress', () => {
    const fn = vi.fn()
    host({ k: fn })
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'k' }))
    document.dispatchEvent(new KeyboardEvent('keypress', { key: 'k' }))
    expect(fn).not.toHaveBeenCalled()
  })

  it('treats unmatched keys as no-ops', () => {
    const fn = vi.fn()
    host({ k: fn })
    press(document, 'Dead')
    press(document, 'Unidentified')
    press(document, '')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useHotkeys preventDefault', () => {
  it('prevents the default action by default', () => {
    host({ k: () => {} })
    expect(press(document, 'k').defaultPrevented).toBe(true)
  })
  it('can be turned off globally and per binding', () => {
    host({ k: () => {}, j: { handler: () => {}, preventDefault: true } }, { preventDefault: false })
    expect(press(document, 'k').defaultPrevented).toBe(false)
    expect(press(document, 'j').defaultPrevented).toBe(true)
  })
  it('does not prevent keys that do not match', () => {
    host({ k: () => {} })
    expect(press(document, 'x').defaultPrevented).toBe(false)
  })
  it('prevents modifier steps in the middle of a sequence, not plain ones', () => {
    host({ 'ctrl+k then b': () => {}, 'g then d': () => {} })
    expect(press(document, 'k', { ctrlKey: true }).defaultPrevented).toBe(true)
    expect(press(document, 'g').defaultPrevented).toBe(false)
  })
})

describe('useHotkeys inputs', () => {
  const field = (html: string) => {
    document.body.insertAdjacentHTML('beforeend', html)
    return document.body.lastElementChild as HTMLElement
  }

  it.each([
    ['input', '<input />'],
    ['input type=email', '<input type="email" />'],
    ['textarea', '<textarea></textarea>'],
    ['select', '<select><option>a</option></select>'],
    ['contenteditable', '<div contenteditable="true"></div>'],
    ['contenteditable empty value', '<div contenteditable=""><span id="inner">x</span></div>'],
  ])('ignores events from %s', (_name, html) => {
    const fn = vi.fn()
    host({ '?': fn })
    const el = field(html)
    press(el.querySelector('#inner') ?? el, '?')
    expect(fn).not.toHaveBeenCalled()
    press(document.body, '?')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['checkbox', '<input type="checkbox" />'],
    ['button type', '<input type="button" />'],
    ['contenteditable=false', '<div contenteditable="false"></div>'],
    ['a button', '<button>x</button>'],
  ])('does not ignore events from %s', (_name, html) => {
    const fn = vi.fn()
    host({ '?': fn })
    press(field(html), '?')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('fires in inputs with allowInInputs (global and per binding)', () => {
    const all = vi.fn()
    const one = vi.fn()
    const none = vi.fn()
    host({ a: all, b: { handler: one, allowInInputs: true }, c: { handler: none, allowInInputs: false } }, { allowInInputs: false })
    const input = field('<input />')
    press(input, 'a')
    press(input, 'b')
    press(input, 'c')
    expect([all.mock.calls.length, one.mock.calls.length, none.mock.calls.length]).toEqual([0, 1, 0])
    wrappers.pop()!.unmount()
    host({ a: all }, { allowInInputs: true })
    press(input, 'a')
    expect(all).toHaveBeenCalledTimes(1)
  })

  it('uses the composed path so shadow DOM text fields are detected', () => {
    const fn = vi.fn()
    host({ '?': fn })
    const shadowHost = field('<div></div>')
    const root = shadowHost.attachShadow({ mode: 'open' })
    const input = document.createElement('input')
    root.appendChild(input)
    press(input, '?', { composed: true })
    expect(fn).not.toHaveBeenCalled()
  })

  it('a text field interrupts a pending sequence', () => {
    const fn = vi.fn()
    host({ 'g then d': fn })
    const input = field('<input />')
    press(document.body, 'g')
    press(input, 'x')
    press(document.body, 'd')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useHotkeys scope', () => {
  it('listens on an element and ignores events elsewhere', () => {
    const fn = vi.fn()
    const el = document.createElement('div')
    const child = document.createElement('button')
    el.appendChild(child)
    document.body.append(el)
    host({ k: fn }, { target: el })
    press(child, 'k')
    press(document.body, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('follows a template ref that is filled on mount', async () => {
    const fn = vi.fn()
    const w = mount(
      defineComponent({
        setup() {
          const el = ref<HTMLElement | null>(null)
          useHotkeys({ k: fn }, { target: el })
          return () => h('section', { ref: el, id: 'scope' }, h('button', { id: 'inside' }))
        },
      }),
      { attachTo: document.body },
    )
    wrappers.push(w)
    press(document.getElementById('inside')!, 'k')
    press(document.body, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('moves when the target ref changes and detaches from the old element', async () => {
    const fn = vi.fn()
    const a = document.createElement('div')
    const b = document.createElement('div')
    const target = ref<HTMLElement | null>(a)
    host({ k: fn }, { target })
    press(a, 'k')
    target.value = b
    await nextTick()
    press(a, 'k')
    press(b, 'k')
    expect(fn).toHaveBeenCalledTimes(2)
    target.value = null
    await nextTick()
    press(b, 'k')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('accepts a component instance (its $el) and a getter', () => {
    const fn = vi.fn()
    const el = document.createElement('div')
    host({ k: fn }, { target: () => ({ $el: el }) })
    press(el, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('registers nothing for targets that cannot listen', () => {
    const fn = vi.fn()
    host({ k: fn }, { target: { $el: 'not an element' } })
    host({ j: fn }, { target: { $el: null } })
    host({ i: fn }, { target: null })
    expect(useHotkeyRegistry().value).toHaveLength(0)
    press(document, 'k')
    expect(fn).not.toHaveBeenCalled()
  })

  it('can listen on window', () => {
    const fn = vi.fn()
    host({ k: fn }, { target: window })
    press(document.body, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('useHotkeys sequences', () => {
  it('fires after the last step', () => {
    const fn = vi.fn()
    host({ 'g then d': fn })
    press(document, 'g')
    expect(fn).not.toHaveBeenCalled()
    press(document, 'd')
    expect(fn).toHaveBeenCalledTimes(1)
    press(document, 'd')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('ignores modifier presses between steps', () => {
    const fn = vi.fn()
    host({ 'g then shift+d': fn })
    press(document, 'g')
    press(document, 'Shift', { shiftKey: true })
    press(document, 'D', { shiftKey: true })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('resets after the timeout', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    host({ 'g then d': fn })
    press(document, 'g')
    vi.advanceTimersByTime(DEFAULT_SEQUENCE_TIMEOUT + 1)
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
    press(document, 'g')
    vi.advanceTimersByTime(DEFAULT_SEQUENCE_TIMEOUT - 1)
    press(document, 'd')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('honours a custom timeout and falls back for invalid ones', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    host({ 'g then d': fn }, { timeout: 50 })
    press(document, 'g')
    vi.advanceTimersByTime(60)
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const spy = vi.fn()
      const { w } = host({ 'x then y': spy }, { timeout: bad })
      press(document, 'x')
      vi.advanceTimersByTime(DEFAULT_SEQUENCE_TIMEOUT - 1)
      press(document, 'y')
      expect(spy).toHaveBeenCalledTimes(1)
      w.unmount()
      wrappers.splice(wrappers.indexOf(w), 1)
    }
  })

  it('a wrong key cancels the sequence, but may start it again', () => {
    const fn = vi.fn()
    host({ 'g then d': fn, 'g then g': fn })
    press(document, 'g')
    press(document, 'x')
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
    press(document, 'g')
    press(document, 'g')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('restarts when the failing key is the first step again', () => {
    const fn = vi.fn()
    host({ 'a then b then c': fn })
    press(document, 'a')
    press(document, 'b')
    press(document, 'a')
    press(document, 'b')
    press(document, 'c')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('tracks several sequences with a shared first key', () => {
    const d = vi.fn()
    const i = vi.fn()
    host({ 'g then d': d, 'g then i': i })
    press(document, 'g')
    press(document, 'i')
    expect(i).toHaveBeenCalledTimes(1)
    expect(d).not.toHaveBeenCalled()
  })

  it('does not run a sequence when its first key arrives as part of a chord', () => {
    const fn = vi.fn()
    host({ 'g then d': fn })
    press(document, 'g', { ctrlKey: true })
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
  })

  it('supports the longest allowed sequence', () => {
    const fn = vi.fn()
    host({ 'a then b then c then d then e': fn })
    for (const k of 'abcde') press(document, k)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cleans every timer on unmount mid-sequence', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const { w } = host({ 'g then d': fn })
    press(document, 'g')
    expect(vi.getTimerCount()).toBe(1)
    w.unmount()
    wrappers.pop()
    expect(vi.getTimerCount()).toBe(0)
    press(document, 'd')
    vi.advanceTimersByTime(5000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('clears the timer after the sequence completes or breaks', () => {
    vi.useFakeTimers()
    host({ 'g then d': () => {} })
    press(document, 'g')
    press(document, 'd')
    expect(vi.getTimerCount()).toBe(0)
    press(document, 'g')
    press(document, 'x')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stop() mid-sequence clears the timer and the listener', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const { api } = host({ 'g then d': fn })
    press(document, 'g')
    api.stop()
    expect(vi.getTimerCount()).toBe(0)
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('a disabled sequence drops its progress', () => {
    const on = ref(true)
    const fn = vi.fn()
    host({ 'g then d': { handler: fn, enabled: on } })
    press(document, 'g')
    on.value = false
    press(document, 'x')
    on.value = true
    press(document, 'd')
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useHotkeys inputs shapes and lifecycle', () => {
  it('accepts an array of bindings with options', () => {
    const fn = vi.fn()
    host([{ keys: 'k', handler: fn, description: 'Do it', group: 'Test' }])
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(listHotkeys(false)).toMatchObject([{ keys: 'k', description: 'Do it', group: 'Test' }])
  })

  it('accepts object values with a handler and rejects values without one', () => {
    const fn = vi.fn()
    host({ k: { handler: fn }, j: { handler: undefined as never }, i: null as never, h: 5 as never })
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(useHotkeyRegistry().value.map((e) => e.keys)).toEqual(['k'])
  })

  it('tolerates null, undefined and junk input', () => {
    host(null as never)
    host(undefined as never)
    host('nope' as never)
    host([null, 5, { keys: 'k' }] as never)
    host({})
    host([])
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('ignores invalid combos and warns in development without throwing', () => {
    const fn = vi.fn()
    host({ '': fn, ctrl: fn, nonsense: fn, [`g then ${'x then '.repeat(20)}y`]: fn, k: fn })
    expect(warn).toHaveBeenCalledTimes(4)
    expect(warn.mock.calls[0][0]).toContain('[perfect-design] useHotkeys: ignored invalid shortcut')
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(useHotkeyRegistry().value).toHaveLength(1)
  })

  it('does not warn about invalid combos in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    host({ '': () => {}, ctrl: () => {} })
    expect(warn).not.toHaveBeenCalled()
  })

  it('works without a component, inside an effect scope, and is cleaned by scope.stop()', () => {
    const fn = vi.fn()
    const scope = effectScope()
    scope.run(() => useHotkeys({ k: fn }))
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
    scope.stop()
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('works outside any scope and stop() unregisters it', () => {
    const fn = vi.fn()
    const { stop } = useHotkeys({ k: fn })
    press(document, 'k')
    stop()
    stop()
    press(document, 'k')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined)
    const { stop } = useHotkeys({ k: () => {} })
    expect(() => stop()).not.toThrow()
    vi.unstubAllGlobals()
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('removes listeners on unmount', () => {
    const fn = vi.fn()
    const { w } = host({ k: fn })
    w.unmount()
    wrappers.pop()
    press(document, 'k')
    expect(fn).not.toHaveBeenCalled()
  })

  it('re-registers when the getter changes', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const key = ref('a')
    host(() => ({ [key.value]: key.value === 'a' ? first : second }))
    press(document, 'a')
    key.value = 'b'
    await nextTick()
    press(document, 'a')
    press(document, 'b')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(useHotkeyRegistry().value.map((e) => e.keys)).toEqual(['b'])
  })

  it('does not re-register after stop() when a dependency changes', async () => {
    const key = ref('a')
    const { api } = host(() => ({ [key.value]: () => {} }))
    api.stop()
    key.value = 'b'
    await nextTick()
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })

  it('accepts a ref as input', async () => {
    const fn = vi.fn()
    const input = ref<HotkeyInput>({ a: fn })
    const scope = effectScope()
    scopes.push(scope)
    scope.run(() => useHotkeys(input))
    input.value = { b: fn }
    await nextTick()
    press(document, 'a')
    press(document, 'b')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('registering the same combo repeatedly fires every handler and warns', () => {
    const a = vi.fn()
    const b = vi.fn()
    host({ k: a })
    host({ k: b })
    press(document, 'k')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('the same combo twice in one call fires once per binding', () => {
    const a = vi.fn()
    const b = vi.fn()
    host([
      { keys: 'k', handler: a },
      { keys: 'K', handler: b },
    ])
    press(document, 'k')
    expect([a.mock.calls.length, b.mock.calls.length]).toEqual([1, 1])
  })

  it('a throwing handler does not stop the others and its error is rethrown', () => {
    const after = vi.fn()
    const handled = vi.fn()
    host([
      { keys: 'k', handler: () => { throw new Error('boom') } },
      { keys: 'k', handler: after },
    ])
    window.addEventListener('error', handled)
    try {
      press(document, 'k')
    } finally {
      window.removeEventListener('error', handled)
    }
    expect(after).toHaveBeenCalledTimes(1)
    expect(handled).toHaveBeenCalledTimes(1)
  })

  it('enabled: false, a ref and a getter switch bindings off', () => {
    const on = ref(false)
    const a = vi.fn()
    const b = vi.fn()
    const c = vi.fn()
    host({ a: { handler: a, enabled: on }, b: { handler: b, enabled: () => false }, c }, { enabled: () => true })
    press(document, 'a')
    press(document, 'b')
    press(document, 'c')
    on.value = true
    press(document, 'a')
    expect([a.mock.calls.length, b.mock.calls.length, c.mock.calls.length]).toEqual([1, 0, 1])
  })

  it('options.enabled switches the whole call off', () => {
    const on = ref(false)
    const fn = vi.fn()
    host({ a: fn }, { enabled: on })
    press(document, 'a')
    on.value = true
    press(document, 'a')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('useHotkeys defaultPrevented, modals and stop', () => {
  it('skips events whose defaultPrevented is already true', () => {
    const fn = vi.fn()
    host({ k: fn })
    const e = new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true })
    e.preventDefault()
    document.dispatchEvent(e)
    expect(fn).not.toHaveBeenCalled()
  })

  it('skips global hotkeys while a modal dialog is open and the target is outside it, unless allowInModal', () => {
    const blocked = vi.fn()
    const allowed = vi.fn()
    host({ k: blocked, j: { handler: allowed, allowInModal: true } })
    document.body.insertAdjacentHTML('beforeend', '<div role="dialog" aria-modal="true"><button id="in">in</button></div><button id="out">out</button>')
    press(document.getElementById('out')!, 'k')
    press(document.getElementById('out')!, 'j')
    expect(blocked).not.toHaveBeenCalled()
    expect(allowed).toHaveBeenCalledTimes(1)
    press(document.getElementById('in')!, 'k')
    expect(blocked).toHaveBeenCalledTimes(1)
  })

  it('stop() also stops the watcher when used outside an effect scope', async () => {
    const source = ref<HotkeyInput>({ a: () => {} })
    let reads = 0
    const api = useHotkeys(() => {
      reads++
      return source.value
    })
    await nextTick()
    api.stop()
    const before = reads
    source.value = { b: () => {} }
    await nextTick()
    await nextTick()
    expect(reads).toBe(before)
  })
})

describe('registry', () => {
  it('lists documented shortcuts grouped data with formatted labels', () => {
    host({ 'mod+k': { handler: () => {}, description: 'Open search', group: 'Navigation' }, '?': { handler: () => {}, description: 'Show shortcuts' } })
    const items = listHotkeys(false)
    expect(items.map((i) => [i.keys, i.group, i.description, i.labels, i.spoken])).toEqual([
      ['mod+k', 'Navigation', 'Open search', [['Ctrl', 'K']], 'Control plus K'],
      ['?', 'General', 'Show shortcuts', [['?']], 'Question mark'],
    ])
  })

  it('uses call-level defaults for description, group and hidden', () => {
    host({ a: () => {}, b: { handler: () => {}, group: 'Own', hidden: false } }, { description: 'Default text', group: 'Defaults', hidden: true })
    expect(listHotkeys(false).map((i) => [i.keys, i.group])).toEqual([['b', 'Own']])
    expect(useHotkeyRegistry().value.map((e) => [e.group, e.description, e.hidden])).toEqual([
      ['Defaults', 'Default text', true],
      ['Own', 'Default text', false],
    ])
  })

  it('hides entries without a description, hidden ones and disabled ones', () => {
    const on = ref(true)
    host({
      a: { handler: () => {}, description: 'Listed' },
      b: { handler: () => {} },
      c: { handler: () => {}, description: '   ' },
      d: { handler: () => {}, description: 'Hidden', hidden: true },
      e: { handler: () => {}, description: 'Toggled', enabled: on },
    })
    expect(listHotkeys(false).map((i) => i.keys)).toEqual(['a', 'e'])
    on.value = false
    expect(listHotkeys(false).map((i) => i.keys)).toEqual(['a'])
  })

  it('is reactive and shrinks when components unmount', async () => {
    const list = useRegisteredHotkeys()
    expect(list.value).toEqual([])
    const { w } = host({ k: { handler: () => {}, description: 'Do it' } })
    expect(list.value.map((i) => i.keys)).toEqual(['k'])
    w.unmount()
    wrappers.pop()
    expect(list.value).toEqual([])
  })

  it('lists with the platform default when none is given', () => {
    host({ 'mod+k': { handler: () => {}, description: 'Search' } })
    expect(listHotkeys()[0].labels).toEqual([['Ctrl', 'K']])
  })

  it('reflects the computed enabled state in a computed list', () => {
    const on = ref(true)
    host({ k: { handler: () => {}, description: 'Do it', enabled: on } })
    const count = computed(() => listHotkeys(false).length)
    expect(count.value).toBe(1)
    on.value = false
    expect(count.value).toBe(0)
  })
})

describe('conflict detection', () => {
  it('warns for the same combo in the same scope (case and alias insensitive)', () => {
    host({ 'mod+k': () => {} })
    host({ 'ctrl+K': () => {} })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('conflicts')
  })

  it('names the other shortcut description in the warning', () => {
    host({ k: { handler: () => {}, description: 'Open search' } })
    host({ k: () => {} })
    expect(warn.mock.calls[0][0]).toContain('(Open search)')
  })

  it('warns when one sequence starts another', () => {
    host({ g: () => {} })
    host({ 'g then d': () => {} })
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn for different keys, different modifiers or different sequences', () => {
    host({ 'ctrl+k': () => {}, 'alt+k': () => {}, k: () => {}, 'g then d': () => {}, 'g then i': () => {}, 'h then d': () => {} })
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not warn for the same combo on two different elements', () => {
    host({ k: () => {} }, { target: document.createElement('div') })
    host({ k: () => {} }, { target: document.createElement('div') })
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when an element shares a combo with the global scope, and for the same element', () => {
    const el = document.createElement('div')
    host({ k: () => {} })
    host({ k: () => {} }, { target: el })
    expect(warn).toHaveBeenCalledTimes(1)
    host({ j: () => {} }, { target: el })
    host({ j: () => {} }, { target: el })
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('warns when the same combo is registered globally on window and document', () => {
    host({ k: () => {} })
    host({ k: () => {} }, { target: window })
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not warn in production, even for real conflicts', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const a = vi.fn()
    host({ k: a })
    host({ k: a })
    press(document, 'k')
    expect(warn).not.toHaveBeenCalled()
    expect(a).toHaveBeenCalledTimes(2)
  })

  it('does not re-warn about itself when a getter re-registers', async () => {
    const n = ref(0)
    host(() => ({ k: () => void n.value }))
    n.value++
    await nextTick()
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('SSR', () => {
  it('renders without touching the DOM and never fills the registry', async () => {
    const App = defineComponent({
      setup() {
        useHotkeys({ k: () => {} })
        return () => h('p', 'ssr')
      },
    })
    const html = await renderToString(createSSRApp(App))
    expect(html).toBe('<p>ssr</p>')
    expect(useHotkeyRegistry().value).toHaveLength(0)
  })
})
