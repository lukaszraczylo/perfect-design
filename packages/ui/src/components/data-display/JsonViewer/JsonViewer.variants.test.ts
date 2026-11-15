import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { JSON_VIEWER_SIZES, JSON_VIEWER_VARIANTS, JsonViewer, jsonViewerVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(JsonViewer, { props: { value: { a: [1, 2] }, ...props } as never })

describe('JsonViewer variant and size dimensions', () => {
  it('keeps the default class string', () => {
    expect(mk().attributes('class')).toBe('font-mono text-foreground rounded-md border bg-card p-2 text-sm')
  })
  it('lists the values', () => {
    expect([...JSON_VIEWER_VARIANTS]).toEqual(['default', 'plain', 'flush'])
    expect([...JSON_VIEWER_SIZES]).toEqual(['sm', 'md', 'lg'])
  })
  it('flush: full-bleed with top and bottom rules', () => {
    const w = mk({ variant: 'flush' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-x-0', 'border-y', 'bg-card']))
    expect(w.classes()).not.toContain('rounded-md')
  })
  it('plain has no chrome', () => {
    const w = mk({ variant: 'plain' })
    expect(w.classes()).not.toContain('border')
    expect(w.classes()).not.toContain('bg-card')
  })
  it.each([['sm', 'text-xs'], ['md', 'text-sm'], ['lg', 'text-base']])('size %s -> %s', (size, cls) => {
    expect(mk({ size }).classes()).toContain(cls)
  })
  it('unknown variant and size fall back to the default', () => {
    expect(mk({ variant: 'neon', size: 'huge' }).html()).toBe(mk().html())
  })
  it('combination and class override', () => {
    const w = mk({ variant: 'flush', size: 'lg', class: 'p-6 text-xs' })
    expect(w.classes()).toEqual(expect.arrayContaining(['p-6', 'text-xs', 'border-y']))
    expect(w.classes()).not.toContain('text-base')
    expect(w.classes()).not.toContain('px-2')
  })
  it.each(JSON_VIEWER_VARIANTS)('%s keeps tree semantics and the name', (variant) => {
    const w = mk({ variant, label: 'Payload' })
    expect(w.attributes('role')).toBe('tree')
    expect(w.attributes('aria-label')).toBe('Payload')
    expect(w.findAll('[role="treeitem"]').length).toBeGreaterThan(1)
  })
  it('helper accepts both dimensions', () => {
    expect(jsonViewerVariants({ variant: 'flush', size: 'sm' })).toContain('border-y')
  })
  it('renders an empty object at every size', () => {
    for (const size of JSON_VIEWER_SIZES) expect(mk({ size, value: {} }).findAll('[role="treeitem"]')).toHaveLength(1)
  })
})
