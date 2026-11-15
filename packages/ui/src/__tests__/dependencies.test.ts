/**
 * Dependency guard: the library's runtime imports are deliberately minimal.
 * Allowed bare imports in component/lib/store source: vue, reka-ui, tailwind-merge, pinia (stores + store-backed components).
 * Everything else must be a relative import. Tests and docs files may use dev-only packages.
 */
import { describe, expect, it } from 'vitest'
import pkg from '../../package.json'

const ALLOWED = new Set(['vue', 'reka-ui', 'tailwind-merge', 'pinia'])
const sources = import.meta.glob(['../**/*.vue', '../**/*.ts', '!../**/*.test.ts', '!../**/*.docs.ts', '!../**/*-stub.ts', '!../__tests__/**', '!../**/*.d.ts', '!../**/testing.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function bareImports(text: string): string[] {
  const out: string[] = []
  const re = /(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const m of text.matchAll(re)) {
    const spec = m[1] ?? m[2] ?? m[3]
    if (spec && !spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('@/')) out.push(spec)
  }
  return out
}
const pkgName = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])

describe('dependency guard', () => {
  it('scans a meaningful number of source files', () => expect(Object.keys(sources).length).toBeGreaterThan(100))

  it('source files import only allowed packages', () => {
    const offenders: string[] = []
    for (const [file, text] of Object.entries(sources))
      for (const spec of bareImports(text)) if (!ALLOWED.has(pkgName(spec))) offenders.push(`${file} → ${spec}`)
    expect(offenders).toEqual([])
  })

  it('package.json runtime dependencies match what the code imports', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['reka-ui', 'tailwind-merge'])
    expect(Object.keys(pkg.peerDependencies).sort()).toEqual(['pinia', 'tailwindcss', 'vue'])
  })

  it('does not hard-code the removed libraries anywhere in source', () => {
    const bad = Object.entries(sources).filter(([f, t]) => !f.includes('lib/icons.ts') && /class-variance-authority|@vueuse\/core|@fortawesome/.test(t.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')))
    expect(bad.map(([f]) => f)).toEqual([])
  })
})
