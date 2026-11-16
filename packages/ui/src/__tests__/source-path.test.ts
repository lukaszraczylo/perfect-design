/**
 * Consumers add `@source ".../@perfect-design/ui/<dir>"` so Tailwind scans the component classes. The directory must be
 * one the published package ships (`files` in package.json) and must hold the compiled components, or the app builds
 * with no component styles at all.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ui = process.cwd()
const repo = resolve(ui, '../..')
const pkg = JSON.parse(readFileSync(resolve(ui, 'package.json'), 'utf8')) as { files: string[] }

const DOCUMENTS = [
  'README.md',
  'AGENTS.md',
  'packages/ui/README.md',
  'docs/src/lib/snippets.ts',
  'packages/ui/src/styles/theme.css',
  'packages/ui/src/components/typography/Markdown/Markdown.docs.ts',
]
const SOURCE_LINE = /@source\s+["'][^"']*@perfect-design\/ui\/([^"'/]+)/g

describe('documented @source path', () => {
  it.each(DOCUMENTS)('%s points Tailwind at a shipped directory with compiled components', (file) => {
    const text = readFileSync(resolve(repo, file), 'utf8')
    const dirs = [...text.matchAll(SOURCE_LINE)].map((m) => m[1])
    for (const dir of dirs) {
      expect(pkg.files, `${file}: "${dir}" is not in package.json files`).toContain(dir)
      expect(dir, `${file}: "${dir}" ships no components; use "dist"`).toBe('dist')
    }
  })

  it('finds at least one @source line across the documents', () => {
    const total = DOCUMENTS.reduce((n, f) => n + [...readFileSync(resolve(repo, f), 'utf8').matchAll(SOURCE_LINE)].length, 0)
    expect(total).toBeGreaterThanOrEqual(DOCUMENTS.length)
  })
})
