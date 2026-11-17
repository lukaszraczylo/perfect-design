import { describe, expect, it } from 'vitest'
import { resizableHandleVariants } from './variants'

describe('ResizableHandle visibility', () => {
  it('draws the bar with the control border token, not the muted surface', () => {
    const cls = resizableHandleVariants({ variant: 'bar' }).split(/\s+/)
    expect(cls).toContain('bg-input')
    expect(cls).not.toContain('bg-muted')
  })

  it('keeps a disabled handle fully opaque and tinted with the control border token', () => {
    for (const variant of ['line', 'bar'] as const) {
      const cls = resizableHandleVariants({ variant }).split(/\s+/)
      expect(cls).toContain('data-[disabled]:bg-input')
      expect(cls).toContain('data-[disabled]:hover:bg-input')
      expect(cls).not.toContain('data-[disabled]:opacity-50')
    }
  })
})
