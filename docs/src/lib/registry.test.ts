import { describe, expect, it } from 'vitest'
import { buildRegistry, buildTree, slugify, type DocEntry } from './registry'

const mk = (name: string, group: string, subgroup = 'S'): DocEntry => ({
  name, slug: slugify(name), group, subgroup, summary: 'summary of ' + name, status: 'stable', examples: 1, parts: 0, replaces: [], file: `x/${name}.docs.ts`,
})

describe('slugify', () => {
  it.each([
    ['Button', 'button'],
    ['DataTable', 'data-table'],
    ['KpiTile', 'kpi-tile'],
    ['AlertDialog', 'alert-dialog'],
    ['FAQList', 'faq-list'],
    ['', ''],
  ])('%s → %s', (input, out) => expect(slugify(input)).toBe(out))
})

describe('buildRegistry / buildTree', () => {
  const entries = buildRegistry([mk('Zed', 'forms'), mk('Btn', 'primitives', 'Buttons'), mk('Alpha', 'primitives', 'Buttons'), mk('Odd', 'unknown-group')])

  it('orders by group rank, then subgroup, then name; unknown groups last', () => {
    expect(entries.map((e) => e.name)).toEqual(['Alpha', 'Btn', 'Zed', 'Odd'])
  })
  it('adds slug and source file', () => {
    expect(entries[0]).toMatchObject({ slug: 'alpha', file: 'x/Alpha.docs.ts' })
  })
  it('builds a tree with counts and fallbacks for unknown groups', () => {
    const tree = buildTree(entries)
    expect(tree.map((g) => [g.id, g.count])).toEqual([['primitives', 2], ['forms', 1], ['unknown-group', 1]])
    expect(tree[0].title).toBe('Primitives')
    expect(tree[2].title).toBe('unknown-group')
    expect(tree[0].subgroups[0].items).toHaveLength(2)
  })
  it('handles an empty registry', () => {
    expect(buildRegistry([])).toEqual([])
    expect(buildTree([])).toEqual([])
  })
})

describe('generated nav index', () => {
  it('matches the docs files on disk (run `pnpm generate:llms` after adding or renaming docs)', async () => {
    const { entries } = await import('./registry')
    const files = Object.keys(import.meta.glob('../../../packages/ui/src/components/**/*.docs.ts'))
    expect(entries.length).toBe(files.length)
    for (const e of entries) expect(files).toContain(`../../../${e.file}`)
  })
  it('loads a lazy doc by entry and returns null for an unknown file', async () => {
    const { entries, loadDoc } = await import('./registry')
    const doc = await loadDoc(entries.find((e) => e.name === 'Button')!)
    expect(doc?.name).toBe('Button')
    expect(await loadDoc({ ...entries[0], file: 'nope.docs.ts' })).toBeNull()
  })
})
