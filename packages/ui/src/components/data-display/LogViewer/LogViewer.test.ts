import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { LogViewer } from './index'

const E = '\u001b'
const sample = [
  '2026-03-04 INFO service started',
  { time: '10:00:01', level: 'warn', message: 'slow response from cache', source: 'api' },
  { time: '10:00:02', level: 'error', message: 'request failed', source: 'api' },
  { level: 'debug', message: 'trace id 42' },
  `${E}[32mready${E}[0m and ${E}[1;31mhot${E}[0m`,
]
const mk = (props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}): VueWrapper =>
  mount(LogViewer as never, { props: { label: 'Sample log', lines: sample, height: 200, ...props } as never, slots: slots as never, attachTo: document.body }) as unknown as VueWrapper
const lines = (w: VueWrapper) => w.findAll('[data-slot="log-viewer-line"]')
const many = (n: number) => Array.from({ length: n }, (_, i) => `INFO line ${i}`)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('LogViewer good path', () => {
  it('renders a named, focusable log with every line, badges and level text', () => {
    const w = mk()
    const vp = w.find('[data-slot="log-viewer-viewport"]')
    expect(w.attributes('data-slot')).toBe('log-viewer')
    expect(vp.attributes('role')).toBe('log')
    expect(vp.attributes('aria-label')).toBe('Sample log')
    expect(vp.attributes('aria-live')).toBe('off')
    expect(vp.attributes('tabindex')).toBe('0')
    expect(lines(w)).toHaveLength(5)
    expect(w.findAll('[data-slot="log-viewer-level-badge"]').map((b) => b.text())).toEqual(['WARN', 'ERROR', 'DEBUG'])
    expect(lines(w)[0].text()).toContain('service started')
    expect(lines(w)[0].text()).toContain('2026-03-04 INFO service started')
    expect(w.find('[data-slot="log-viewer-time"]').text()).toBe('10:00:01')
    expect(w.find('[data-slot="log-viewer-source"]').text()).toBe('api')
  })
  it('maps ANSI colours to tokens, never to raw colours or markup', () => {
    const w = mk()
    const html = lines(w)[4].html()
    expect(html).toContain('text-success')
    expect(html).toContain('text-destructive')
    expect(html).toContain('font-semibold')
    expect(html).not.toMatch(/style="[^"]*color|#[0-9a-f]{3}|rgb\(/i)
    expect(lines(w)[4].text()).toContain('ready and hot')
  })
  it('hides line numbers and timestamps on request', () => {
    const w = mk({ lineNumbers: false, timestamps: false })
    expect(w.find('[data-slot="log-viewer-select"]').exists()).toBe(false)
    expect(w.find('[data-slot="log-viewer-time"]').exists()).toBe(false)
  })
  it('wraps long lines', () => {
    const w = mk({ wrap: true, lines: ['x'.repeat(500)] })
    expect(w.attributes('data-wrap')).toBe('')
    expect(w.find('[data-slot="log-viewer-message"]').classes()).toContain('whitespace-pre-wrap')
    expect(mk().find('[data-slot="log-viewer-message"]').classes()).toContain('whitespace-pre')
  })
  it('caps lines with maxLines and numbers from the original position', () => {
    const w = mk({ lines: many(10), maxLines: 3 })
    expect(lines(w)).toHaveLength(3)
    expect(lines(w)[0].attributes('data-line')).toBe('8')
    expect(w.find('[data-slot="log-viewer-count"]').text()).toContain('newest 3 kept')
  })
  it('shows the empty state and a custom empty slot', () => {
    expect(mk({ lines: [] }).find('[data-slot="log-viewer-empty"]').text()).toBe('No log lines yet.')
    expect(mk({ lines: [], toolbar: false }, { empty: () => h('i', 'Nothing here') }).find('[data-slot="log-viewer-empty"] i').text()).toBe('Nothing here')
  })
})

describe('LogViewer filters and search', () => {
  it('filters by text, highlights matches and emits the query', async () => {
    const w = mk()
    await w.find('input').setValue('api')
    expect(w.emitted('update:query')!.at(-1)).toEqual(['api'])
    expect(w.findAll('[data-slot="log-viewer-line"]').length).toBe(0)
    await w.find('input').setValue('cache')
    expect(lines(w)).toHaveLength(1)
    expect(w.find('[data-slot="log-viewer-match"]').text()).toBe('cache')
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe('Match 1 of 1')
    await w.find('input').setValue('zzz')
    expect(w.find('[data-slot="log-viewer-empty"]').text()).toBe('No lines match the current filters.')
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe('No matching lines')
  })
  it('keeps every line in highlight mode and walks the matches with next, previous, Enter and keys', async () => {
    const w = mk({ queryMode: 'highlight', query: 'e' })
    const total = w.findAll('[data-slot="log-viewer-line"]').length
    expect(total).toBe(5)
    const count = Number(/of (\d+)/.exec(w.find('[data-slot="log-viewer-status"]').text())![1])
    expect(count).toBeGreaterThan(2)
    await w.find('[data-slot="log-viewer-next"]').trigger('click')
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match 2 of ${count}`)
    await w.find('input').trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match 1 of ${count}`)
    await w.find('[data-slot="log-viewer-prev"]').trigger('click')
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match ${count} of ${count}`)
    await w.find('input').trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe('Match 1 of ' + count)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('keydown', { key: 'n' })
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match 2 of ${count}`)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('keydown', { key: 'p' })
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match 1 of ${count}`)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('keydown', { key: 'n', ctrlKey: true })
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe(`Match 1 of ${count}`)
    expect(w.find('[data-current]').attributes('aria-current')).toBe('true')
  })
  it('clears the query with Escape and disables navigation without matches', async () => {
    const w = mk({ query: 'zzz' })
    expect(w.find('[data-slot="log-viewer-next"]').attributes('disabled')).toBeDefined()
    await w.find('input').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('update:query')!.at(-1)).toEqual([''])
    expect(lines(w)).toHaveLength(5)
    await w.find('input').trigger('keydown', { key: 'Escape' })
    await w.find('input').trigger('keydown', { key: 'a' })
    await w.find('[data-slot="log-viewer-viewport"]').trigger('keydown', { key: 'n' })
  })
  it('follows a controlled query', async () => {
    const w = mk()
    await w.setProps({ query: 'failed' })
    expect(lines(w)).toHaveLength(1)
  })
  it('filters by level with toggle buttons and a controlled levelFilter', async () => {
    const w = mk()
    const err = w.find('[data-level="error"][data-slot="log-viewer-level"]')
    expect(err.attributes('aria-pressed')).toBe('true')
    await err.trigger('click')
    expect(err.attributes('aria-pressed')).toBe('false')
    expect(w.emitted('update:levelFilter')!.at(-1)).toEqual([['debug', 'info', 'warn']])
    expect(w.findAll('[data-slot="log-viewer-level-badge"]').map((b) => b.text())).not.toContain('ERROR')
    expect(w.find('[data-slot="log-viewer-status"]').text()).toBe('4 lines shown')
    await err.trigger('click')
    expect(lines(w)).toHaveLength(5)
    await w.setProps({ levelFilter: ['error'] })
    expect(w.findAll('[data-slot="log-viewer-level-badge"]').map((b) => b.text())).toEqual(['ERROR'])
    expect(lines(w).some((l) => l.text().includes('ready'))).toBe(true) // lines without a level always show
  })
})

describe('LogViewer selection and copy', () => {
  it('copies visible lines, or the selected ones', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true })
    const w = mk()
    expect(w.find('[data-slot="copy-button"]').attributes('aria-label')).toBe('Copy visible lines')
    await w.find('[data-slot="copy-button"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(write.mock.calls[0][0].split('\n')).toHaveLength(5)
    expect(write.mock.calls[0][0]).toContain('10:00:02 ERROR api request failed')
    expect(w.emitted('copy')![0][0]).toContain('2026-03-04 INFO service started')

    const sel = w.findAll('[data-slot="log-viewer-select"]')
    await sel[2].trigger('click')
    await sel[1].trigger('click')
    expect(sel[1].attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-slot="copy-button"]').attributes('aria-label')).toBe('Copy 2 selected lines')
    await w.find('[data-slot="copy-button"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect(write.mock.calls[1][0]).toBe('10:00:01 WARN api slow response from cache\n10:00:02 ERROR api request failed')
    await sel[1].trigger('click')
    expect(w.find('[data-slot="copy-button"]').attributes('aria-label')).toBe('Copy 1 selected line')
    await w.find('[data-slot="log-viewer-clear"]').trigger('click')
    expect(w.find('[data-slot="log-viewer-clear"]').exists()).toBe(false)
  })
  it('drops selected lines that disappear', async () => {
    const w = mk({ lines: many(5) })
    await w.findAll('[data-slot="log-viewer-select"]')[4].trigger('click')
    await w.setProps({ lines: many(2) })
    expect(w.find('[data-slot="log-viewer-clear"]').exists()).toBe(false)
  })
})

describe('LogViewer follow mode', () => {
  const setScroll = (el: HTMLElement, top: number, scrollHeight = 1000, clientHeight = 200) => {
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
    el.scrollTop = top
  }
  it('sticks to the bottom, pauses on a manual scroll up and resumes with Jump to latest', async () => {
    const w = mk({ follow: true, lines: many(100) })
    const vp = w.find('[data-slot="log-viewer-viewport"]').element as HTMLElement
    expect(w.attributes('data-following')).toBe('on')
    expect(w.find('[data-slot="log-viewer-jump"]').exists()).toBe(false)
    await nextTick()
    expect(vp.scrollTop).toBeGreaterThan(0)
    setScroll(vp, vp.scrollTop - 300, 3000)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('scroll')
    expect(w.attributes('data-following')).toBe('paused')
    expect(w.emitted('pause')).toHaveLength(1)
    const jump = w.find('[data-slot="log-viewer-jump"]')
    expect(jump.text()).toContain('Jump to latest')
    await w.setProps({ lines: many(105) })
    expect(w.find('[data-slot="log-viewer-jump"]').text()).toContain('(5 new)')
    await w.find('[data-slot="log-viewer-jump"]').trigger('click')
    await nextTick()
    expect(w.emitted('resume')).toHaveLength(1)
    expect(w.attributes('data-following')).toBe('on')
    expect(w.find('[data-slot="log-viewer-jump"]').exists()).toBe(false)
  })
  it('resumes by itself when the reader scrolls back to the end', async () => {
    const w = mk({ follow: true, lines: many(100) })
    const vp = w.find('[data-slot="log-viewer-viewport"]').element as HTMLElement
    setScroll(vp, 100, 3000)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('scroll')
    expect(w.attributes('data-following')).toBe('paused')
    setScroll(vp, 2800, 3000)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('scroll')
    expect(w.attributes('data-following')).toBe('on')
  })
  it('never pauses or shows the button when follow is off, and restarts when follow turns on', async () => {
    const w = mk({ lines: many(100) })
    const vp = w.find('[data-slot="log-viewer-viewport"]').element as HTMLElement
    setScroll(vp, 100, 3000)
    await w.find('[data-slot="log-viewer-viewport"]').trigger('scroll')
    expect(w.find('[data-slot="log-viewer-jump"]').exists()).toBe(false)
    expect(w.attributes('data-following')).toBeUndefined()
    await w.setProps({ follow: true })
    await nextTick()
    expect(w.attributes('data-following')).toBe('on')
  })
  it('pauses when search navigation moves away', async () => {
    const w = mk({ follow: true, lines: many(100), query: '5', queryMode: 'highlight' })
    await w.find('[data-slot="log-viewer-next"]').trigger('click')
    expect(w.attributes('data-following')).toBe('paused')
  })
  it('exposes scrollToBottom, next, prev and clearSelection', async () => {
    const w = mk({ lines: many(100), query: '9', queryMode: 'highlight' })
    const api = w.vm as unknown as { scrollToBottom(): void; next(): Promise<void>; prev(): Promise<void>; clearSelection(): void }
    api.scrollToBottom()
    await api.next()
    await api.prev()
    api.clearSelection()
    expect(w.find('[data-slot="log-viewer-status"]').text()).toMatch(/^Match/)
  })
})

describe('LogViewer live region policy', () => {
  it('keeps the log silent and announces a throttled summary only while following', async () => {
    const w = mk({ follow: true, lines: many(3), announceInterval: 1000 })
    const live = () => w.find('[data-slot="log-viewer-live"]').text()
    expect(w.find('[data-slot="log-viewer-live"]').attributes('role')).toBe('status')
    expect(w.find('[data-slot="log-viewer-viewport"]').attributes('aria-live')).toBe('off')
    expect(live()).toBe('')
    await w.setProps({ lines: [...many(3), 'ERROR boom'] })
    await w.setProps({ lines: [...many(3), 'ERROR boom', 'INFO again'] })
    expect(live()).toBe('')
    await vi.advanceTimersByTimeAsync(1000)
    expect(live()).toBe('2 new lines. Latest INFO: again')
    await w.setProps({ lines: [...many(3), 'ERROR boom', 'INFO again', 'x'] })
    await vi.advanceTimersByTimeAsync(1000)
    expect(live()).toBe('1 new line. Latest x')
  })
  it('is silent without follow, with announce off, and while paused', async () => {
    const quiet = mk({ lines: many(3), announceInterval: 10 })
    await quiet.setProps({ lines: many(5) })
    await vi.advanceTimersByTimeAsync(50)
    expect(quiet.find('[data-slot="log-viewer-live"]').text()).toBe('')
    const off = mk({ follow: true, announce: false, lines: many(3), announceInterval: 10 })
    await off.setProps({ lines: many(5) })
    await vi.advanceTimersByTimeAsync(50)
    expect(off.find('[data-slot="log-viewer-live"]').text()).toBe('')
    const w = mk({ follow: true, lines: many(100), announceInterval: 500 })
    await w.setProps({ lines: many(101) })
    const vp = w.find('[data-slot="log-viewer-viewport"]').element as HTMLElement
    Object.defineProperty(vp, 'scrollHeight', { value: 3000, configurable: true })
    Object.defineProperty(vp, 'clientHeight', { value: 200, configurable: true })
    vp.scrollTop = 10
    await w.find('[data-slot="log-viewer-viewport"]').trigger('scroll')
    await vi.advanceTimersByTimeAsync(600)
    expect(w.find('[data-slot="log-viewer-live"]').text()).toBe('')
  })
  it('clears the pending announcement on unmount', async () => {
    const w = mk({ follow: true, lines: many(3), announceInterval: 5000 })
    await w.setProps({ lines: many(4) })
    w.unmount()
    await vi.advanceTimersByTimeAsync(6000)
  })
})

describe('LogViewer windowing and size', () => {
  it('renders only a window of 50k lines and keeps the numbering', async () => {
    const start = performance.now()
    const w = mk({ lines: many(50000), height: 280 })
    expect(lines(w).length).toBeLessThan(60)
    expect(performance.now() - start).toBeLessThan(5000)
    expect(w.find('[data-slot="log-viewer-count"]').text()).toContain('50,000 of 50,000')
    const vp = w.find('[data-slot="log-viewer-viewport"]')
    ;(vp.element as HTMLElement).scrollTop = 28 * 20000
    await vp.trigger('scroll')
    expect(lines(w)[0].attributes('data-line')).toBe(String(20000 - 10 + 1))
    expect(lines(w).length).toBeLessThan(60)
  })
  it('filters 50k lines fast', async () => {
    const w = mk({ lines: many(50000), height: 280 })
    const t = performance.now()
    await w.find('input').setValue('line 4999')
    expect(performance.now() - t).toBeLessThan(3000)
    expect(w.find('[data-slot="log-viewer-count"]').text()).toContain('11 of 50,000')
  })
  it('uses estimated heights when wrapping and measures rendered rows', async () => {
    const w = mk({ lines: ['x'.repeat(2000), 'y', 'z'], wrap: true })
    await nextTick()
    expect(lines(w).length).toBe(3)
    expect(lines(w)[0].attributes('style')).toContain('min-height')
  })
  it('sizes rows by size and density', () => {
    expect(lines(mk({ size: 'lg' }))[0].attributes('style')).toContain('height: 32px')
    expect(lines(mk({ size: 'lg', density: 'compact' }))[0].attributes('style')).toContain('height: 28px')
    expect(lines(mk())[0].attributes('style')).toContain('height: 28px')
    expect(lines(mk({ density: 'compact' }))[0].attributes('style')).toContain('height: 24px')
  })
  it('measures the viewport with a ResizeObserver and disconnects it on unmount', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { constructor(public cb: () => void) {} observe = observe; disconnect = disconnect; unobserve = vi.fn() })
    const w = mk()
    expect(observe).toHaveBeenCalled()
    w.unmount()
    expect(disconnect).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('LogViewer customisation and hostile input', () => {
  it('lets class win, passes attributes, and honours height', () => {
    const w = mk({ class: 'h-96 custom', 'data-x': '1', height: '30rem' })
    expect(w.classes()).toContain('custom')
    expect(w.classes()).not.toContain('h-80')
    expect(w.attributes('data-x')).toBe('1')
    expect(w.attributes('style')).toContain('height: 30rem')
    expect(mk().classes()).toContain('h-80')
  })
  it('renders markup in lines as text', () => {
    const evil = '<script>window.__x=1</script><img src=x onerror="window.__x=1">'
    const w = mk({ lines: [evil, { message: evil, source: evil, level: evil, time: evil }], query: 'script', queryMode: 'highlight' })
    expect(w.element.querySelector('script')).toBeNull()
    expect(w.element.querySelector('img')).toBeNull()
    expect(w.text()).toContain(evil)
  })
  it('handles RTL, unicode and very long lines', () => {
    const w = mk({ lines: ['שלום עולם', '日本語のログ', 'a'.repeat(100000)] })
    expect(w.text()).toContain('שלום עולם')
    expect(w.text()).toContain('日本語のログ')
  })
  it('falls back for unknown variant, size and density and tolerates bad inputs', () => {
    const w = mk({ variant: 'x', size: 'x', density: 'x', lines: null, query: null, levelFilter: null, maxLines: -1 })
    expect(w.attributes('data-variant')).toBe('panel')
    expect(w.attributes('data-size')).toBeUndefined()
    expect(w.attributes('data-density')).toBeUndefined()
    expect(w.find('[data-slot="log-viewer-empty"]').exists()).toBe(true)
  })
  it('hides the toolbar when asked and keeps the status regions', () => {
    const w = mk({ toolbar: false })
    expect(w.find('[data-slot="log-viewer-toolbar"]').exists()).toBe(false)
    expect(w.findAll('[role="status"]')).toHaveLength(2)
  })
  it('formats Date and numeric times with locale and zone', () => {
    const w = mk({ lines: [{ time: Date.UTC(2026, 2, 4, 10, 0, 1), message: 'x' }], locale: 'en', timeZone: 'UTC' })
    expect(w.find('[data-slot="log-viewer-time"]').text()).toBe('10:00:01.000')
    expect(w.find('[data-slot="log-viewer-time"]').attributes('datetime')).toBe('2026-03-04T10:00:01.000Z')
  })
})
