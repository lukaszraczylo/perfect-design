import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { configureStrictMode } from '../../../lib/contract'
import UptimeBar from './UptimeBar.vue'
import { uptimeBarVariants, uptimeSegmentVariants } from './variants'

const segs = (...states: string[]) => states.map((state, i) => ({ state, label: `Check ${i + 1}` }))
const mk = (props: Record<string, unknown> = {}) => mount(UptimeBar, { props: { label: 'API', segments: segs('up', 'up', 'degraded', 'down'), ...props } as never })
const track = (w: ReturnType<typeof mk>) => w.find('[data-slot="uptime-bar-track"]')
const items = (w: ReturnType<typeof mk>) => w.findAll('[data-slot="uptime-bar-segment"]')

afterEach(() => configureStrictMode('off'))

describe('UptimeBar good path', () => {
  it('renders one segment per check with state colour classes', () => {
    const w = mk()
    expect(w.attributes('data-slot')).toBe('uptime-bar')
    expect(items(w)).toHaveLength(4)
    expect(items(w).map((s) => s.attributes('data-state'))).toEqual(['up', 'up', 'degraded', 'down'])
    expect(items(w)[0]!.classes()).toContain('bg-success')
    expect(items(w)[2]!.classes()).toContain('bg-warning')
    expect(items(w)[3]!.classes()).toContain('bg-destructive')
    expect(items(w)[0]!.classes()).toEqual(expect.arrayContaining(['flex-1', 'min-w-px']))
  })
  it('gives every segment a tooltip with label and state text', () => {
    expect(items(mk())[2]!.attributes('title')).toBe('Check 3: degraded')
    expect(items(mk({ segments: [{ state: 'down' }] }))[0]!.attributes('title')).toBe('down')
  })
  it('names the image with a counted summary', () => {
    const w = mk()
    expect(track(w).attributes('role')).toBe('img')
    expect(track(w).attributes('aria-label')).toBe('API: 4 checks: 2 up, 1 degraded, 1 down')
    expect(w.find('[data-slot="uptime-bar-summary"]').text()).toBe('4 checks: 2 up, 1 degraded, 1 down')
  })
  it('singular count and unknown state', () => {
    expect(track(mk({ segments: segs('unknown') })).attributes('aria-label')).toBe('API: 1 check: 1 unknown')
  })
  it('translates state names', () => {
    const w = mk({ stateLabels: { up: 'ok', down: 'ausgefallen', degraded: '  ' } })
    expect(items(w)[3]!.attributes('title')).toBe('Check 4: ausgefallen')
    expect(items(w)[2]!.attributes('title')).toBe('Check 3: degraded')
    expect(track(w).attributes('aria-label')).toContain('2 ok')
  })
  it('summary prop replaces the text, hideSummary keeps the name', () => {
    expect(mk({ summary: '99.9% uptime' }).find('[data-slot="uptime-bar-summary"]').text()).toBe('99.9% uptime')
    expect(track(mk({ summary: '99.9% uptime' })).attributes('aria-label')).toBe('API: 99.9% uptime')
    const h = mk({ hideSummary: true })
    expect(h.find('[data-slot="uptime-bar-summary"]').exists()).toBe(false)
    expect(track(h).attributes('aria-label')).toContain('4 checks')
  })
  it('summary slot receives total and counts', () => {
    const s = mount(UptimeBar, { props: { label: 'API', segments: segs('up', 'down') } as never, slots: { summary: `<template #summary="{ total, counts }">{{ total }}/{{ counts.up }}</template>` } })
    expect(s.find('[data-slot="uptime-bar-summary"]').text()).toBe('2/1')
  })
})

describe('UptimeBar customisation and sizes', () => {
  it.each([['sm', 'h-4'], ['md', 'h-8'], ['lg', 'h-12']])('size %s -> %s', (size, cls) => expect(track(mk({ size })).classes()).toContain(cls))
  it('unknown size falls back to md', () => expect(mk({ size: 'xl' }).html()).toBe(mk().html()))
  it('class merges on the root, attrs fall through', () => {
    const w = mount(UptimeBar, { props: { label: 'x', segments: segs('up'), class: 'max-w-sm' } as never, attrs: { id: 'u1' } })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.attributes('id')).toBe('u1')
  })
  it('uses no physical left/right classes (RTL safe)', () => {
    expect(mk().html()).not.toMatch(/\b(pl|pr|ml|mr|left|right)-/)
  })
  it('variants helpers expose the same classes', () => {
    expect(uptimeSegmentVariants({ state: 'down' })).toContain('bg-destructive')
    expect(uptimeBarVariants({ size: 'sm' })).toContain('h-4')
  })
})

describe('UptimeBar bad path and edges', () => {
  it('shows the empty text for no segments, with a name', () => {
    const w = mk({ segments: [] })
    expect(w.find('[data-slot="uptime-bar-empty"]').text()).toBe('No checks yet')
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('API: No checks yet')
    expect(mk({ segments: [], emptyText: 'Noch keine Prüfungen' }).text()).toBe('Noch keine Prüfungen')
  })
  it('treats an invalid state as unknown and a non-array as empty', () => {
    expect(items(mk({ segments: [{ state: 'broken' }] }))[0]!.attributes('data-state')).toBe('unknown')
    expect(mk({ segments: null }).find('[data-slot="uptime-bar-empty"]').exists()).toBe(true)
  })
  it('renders 200 segments and drops the gap above 100', () => {
    const w = mk({ segments: Array.from({ length: 200 }, () => ({ state: 'up' })) })
    expect(items(w)).toHaveLength(200)
    expect(track(w).classes()).toContain('gap-0')
    expect(track(w).attributes('aria-label')).toContain('200 checks: 200 up')
    expect(track(mk()).classes()).toContain('gap-px')
  })
  it('handles long unicode labels', () => {
    expect(items(mk({ segments: [{ state: 'up', label: 'ü'.repeat(300) }] }))[0]!.attributes('title')).toHaveLength(304)
  })
})

describe('UptimeBar contract', () => {
  const run = async (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => {
    configureStrictMode('throw')
    const errors: unknown[] = []
    mount(UptimeBar, { props: props as never, attrs, global: { config: { errorHandler: (e: unknown) => errors.push(e) } } })
    await flushPromises()
    return errors
  }
  it('throws without a name', async () => expect(String(((await run({ segments: segs('up') }))[0] as Error)?.message)).toMatch(/UptimeBar/))
  it('throws when segments is not an array', async () => expect(String(((await run({ label: 'x', segments: 'nope' }))[0] as Error)?.message)).toMatch(/segments/))
  it('accepts aria-label instead of label', async () => expect(await run({ segments: segs('up') }, { 'aria-label': 'x' })).toHaveLength(0))
})
