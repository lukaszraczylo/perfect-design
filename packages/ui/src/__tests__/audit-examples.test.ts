/** Regression checks for docs examples that a screenshot audit found misleading or empty. */
import { describe, expect, it } from 'vitest'
import type { ComponentDoc } from '../docs-types'

const docs = import.meta.glob('../components/*/*/*.docs.ts', { eager: true, import: 'default' }) as Record<string, ComponentDoc>
const example = (name: string, title: string) => {
  const doc = Object.values(docs).find((d) => d.name === name)
  const ex = doc?.examples.find((e) => e.title === title)
  if (!ex) throw new Error(`${name} example "${title}" not found`)
  return ex
}

describe('docs examples from the screenshot audit', () => {
  it('NavLink sidebar row shows its label; the collapsed form has its own example', () => {
    expect(example('NavLink', 'Icon and badge, sidebar style').code).not.toContain('collapsed')
    expect(example('NavLink', 'Collapsed, icon only').code).toContain('collapsed')
  })

  it('DateInput "Time and month" shows only time and month fields', () => {
    const code = example('DateInput', 'Time and month').code
    expect(code).toContain('type="time"')
    expect(code).toContain('type="month"')
    expect(code.match(/<DateInput/g)).toHaveLength(2)
  })

  it('FormActions "Delete draft" is a bordered button, not bare ghost text', () => {
    const code = example('FormActions', 'Custom slot, spread layout, loading').code
    expect(code).toMatch(/<Button variant="outline"[^>]*>Delete draft/)
  })

  it('PromptInput attach control has a button surface', () => {
    const code = example('PromptInput', 'Attach button, actions and footer').code
    expect(code).toMatch(/<IconButton label="Attach a file" variant="outline"/)
  })

  it('AspectRatio fit sample stretches under fit="fill"', () => {
    const code = example('AspectRatio', 'Fit').code
    expect(code.match(/preserveAspectRatio='none'/g)).toHaveLength(3)
  })

  it('Avatar example shows real images', () => {
    const ex = example('Avatar', 'Image, initials and sizes')
    expect(ex.code).toContain(':src="portrait"')
    expect(String((ex.state?.() as { portrait: string }).portrait)).toMatch(/^data:image\/svg\+xml/)
  })

  it('PageHeader hero uses a real sample image, not a 1px gif', () => {
    const ex = example('PageHeader', 'Hero with image or primary background')
    expect(ex.code).not.toContain('R0lGODlhAQABAAAA')
    expect(String((ex.state?.() as { scene: string }).scene)).toMatch(/^data:image\/svg\+xml/)
  })

  it('Affix offset example gives the pinned cards a scroll box with a header and a bottom bar', () => {
    const code = example('Affix', 'Offset below a header and a bottom bar').code
    expect(code).toContain('overflow-auto')
    expect(code).toContain('root="#affix-offset-scroll"')
    expect(code).toContain('Header, 48px')
    expect(code).toContain('Bottom bar, 40px')
  })

  it('AsyncBoundary state grid aligns its cells to the start', () => {
    expect(example('AsyncBoundary', 'Variants and sizes').code).toContain('grid items-start')
  })
})
