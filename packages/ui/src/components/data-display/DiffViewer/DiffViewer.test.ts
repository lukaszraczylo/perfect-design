import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DiffViewer from './DiffViewer.vue'

const props = { oldText: 'port = 80\nmode = "development"', newText: 'port = 8080\nmode = "production"', label: 'Sample diff', variant: 'inline' }
const mnt = (extra: Record<string, unknown> = {}) => mount(DiffViewer, { props: { ...props, ...extra } as never })

describe('DiffViewer narrow widths', () => {
  it('scrolls inside one focusable, named region', () => {
    const region = mnt().find('[data-slot="diff-viewer-scroll"]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label') ?? region.attributes('aria-labelledby')).toBeTruthy()
  })
  it('wraps long code lines below sm instead of cutting them off', () => {
    const code = mnt().find('[data-slot="diff-viewer-code"]').classes()
    expect(code).toContain('max-sm:whitespace-pre-wrap')
    expect(code).toContain('max-sm:[overflow-wrap:anywhere]')
    expect(mnt().find('[data-slot="diff-viewer-table"]').classes()).toContain('max-sm:w-full')
  })
  it('keeps removed words apart from the added words next to them', () => {
    const del = mnt().find('[data-slot="diff-viewer-del"]')
    expect(del.exists()).toBe(true)
    expect(del.classes()).toContain('me-0.5')
  })
})
