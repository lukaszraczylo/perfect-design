import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { CODE_BLOCK_SIZES, CODE_BLOCK_VARIANTS, CodeBlock, codeBlockTabVariants, codeBlockVariants } from './index'

const mk = (props: Record<string, unknown> = {}) => mount(CodeBlock, { props: { code: 'a = 1', language: 'ts', ...props } as never })

describe('CodeBlock variant dimensions', () => {
  it('keeps the default class string and data attributes', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('flex flex-col overflow-hidden rounded-lg border bg-muted/40 text-sm text-foreground')
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(w.attributes('data-size')).toBeUndefined()
    expect(codeBlockVariants()).toBe('flex flex-col overflow-hidden rounded-lg border bg-muted/40 text-sm text-foreground')
  })

  it('lists every documented value', () => {
    expect([...CODE_BLOCK_VARIANTS]).toEqual(['default', 'window', 'terminal', 'plain', 'flush'])
    expect([...CODE_BLOCK_SIZES]).toEqual(['sm', 'md', 'lg'])
  })

  describe('variant plain', () => {
    it('drops frame and fill but keeps a header when there is something to show', () => {
      const w = mk({ variant: 'plain' })
      expect(w.attributes('data-variant')).toBe('plain')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-transparent', 'bg-transparent']))
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.classes()).not.toContain('bg-muted/40')
      expect(w.find('[data-slot="code-block-header"]').exists()).toBe(true)
    })
    it('does not force the header bar like window and terminal do', () => {
      const w = mk({ variant: 'plain', language: undefined, copyable: false })
      expect(w.find('[data-slot="code-block-header"]').exists()).toBe(false)
    })
  })

  describe('variant flush', () => {
    it('runs edge to edge with only top and bottom rules', () => {
      const w = mk({ variant: 'flush' })
      expect(w.attributes('data-variant')).toBe('flush')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-x-0', 'border', 'bg-muted/40']))
      expect(w.classes()).not.toContain('rounded-lg')
    })
  })

  it('window and terminal still force the header bar and the data attribute', () => {
    for (const variant of ['window', 'terminal']) {
      const w = mk({ variant, language: undefined, copyable: false })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.find('[data-slot="code-block-header"]').exists()).toBe(true)
    }
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs', 'text-sm'],
      ['lg', 'text-base', 'text-sm'],
    ])('size=%s uses %s and replaces %s', (size, add, drop) => {
      const w = mk({ size })
      expect(w.classes()).toContain(add)
      expect(w.classes()).not.toContain(drop)
      expect(w.attributes('data-size')).toBe(size)
    })
    it('md equals the default output', () => {
      expect(mk({ size: 'md' }).html()).toBe(mk().html())
    })
    it('unknown size and variant fall back to the default', () => {
      expect(mk({ size: 'xl', variant: 'neon' }).html()).toBe(mk().html())
    })
    it('line-number gutter and diff markers still render at every size', () => {
      for (const size of CODE_BLOCK_SIZES) {
        const w = mk({ size, lineNumbers: true, diff: true, code: '+a\n-b' })
        expect(w.findAll('[data-slot="code-block-line-number"]')).toHaveLength(2)
        expect(w.findAll('[data-slot="code-block-marker"]')).toHaveLength(2)
      }
    })
  })

  describe('combinations and overrides', () => {
    it('plain + sm combine without conflict', () => {
      const w = mk({ variant: 'plain', size: 'sm' })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-transparent', 'text-xs']))
      expect(w.classes()).not.toContain('text-sm')
    })
    it('terminal + lg keeps the inverted surface and the larger text', () => {
      const w = mk({ variant: 'terminal', size: 'lg' })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background', 'text-base']))
    })
    it('class wins over variant and size', () => {
      const w = mk({ variant: 'flush', size: 'lg', class: 'rounded-md text-sm' })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-md', 'text-sm']))
      expect(w.classes()).not.toContain('rounded-none')
      expect(w.classes()).not.toContain('text-base')
    })
  })

  describe('a11y independent of the look', () => {
    it.each(['default', 'window', 'terminal', 'plain', 'flush'])('%s keeps a named focusable region and a named copy button', (variant) => {
      const w = mk({ variant, filename: 'a.ts' })
      const pre = w.find('pre')
      expect(pre.attributes('tabindex')).toBe('0')
      expect(pre.attributes('role')).toBe('region')
      expect(pre.attributes('aria-label')).toBe('a.ts')
      expect(w.find('button').attributes('aria-label')).toBe('Copy code')
    })
    it('tabs keep the tablist semantics in plain and flush', () => {
      for (const variant of ['plain', 'flush']) {
        const w = mk({ variant, tabs: [{ label: 'a.ts', code: 'x' }, { label: 'b.ts', code: 'y' }] })
        expect(w.findAll('[role="tab"]')).toHaveLength(2)
        expect(w.find('[role="tabpanel"]').exists()).toBe(true)
      }
    })
  })

  describe('exported helpers', () => {
    it('codeBlockVariants takes variant and size', () => {
      expect(codeBlockVariants({ variant: 'flush', size: 'sm' })).toContain('border-x-0')
      expect(codeBlockVariants({ variant: 'flush', size: 'sm' })).toContain('text-xs')
    })
    it('tab variants treat plain and flush like the default', () => {
      expect(codeBlockTabVariants({ variant: 'plain', active: true })).toContain('bg-background')
      expect(codeBlockTabVariants({ variant: 'flush', active: false })).toContain('text-muted-foreground')
    })
  })

  it('handles empty and very long text in every size', () => {
    for (const size of CODE_BLOCK_SIZES) {
      expect(() => mk({ size, code: '' })).not.toThrow()
      const w = mk({ size, code: 'x'.repeat(5000), wrap: true })
      expect(w.find('pre').classes()).toContain('whitespace-pre-wrap')
    }
  })
})
