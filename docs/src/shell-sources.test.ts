/**
 * The site shell (App, pages and docs components) renders library components outside the live examples, and its
 * stylesheet only gets the classes of the folders it names with @source. Every folder the shell reaches, directly or
 * through relative imports, must be listed, or those components render without their styles (Card on the style packs
 * page and inline code in summaries once did).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const docs = resolve(__dirname)
const ui = resolve(__dirname, '../../packages/ui/src')
const components = join(ui, 'components')

const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]))
const shellFiles = walk(docs).filter((f) => /\.(vue|ts)$/.test(f) && !f.endsWith('.test.ts') && !f.includes('/generated/'))

/** Library names the shell imports from @ui/index. */
const used = new Set(
  shellFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/import \{([^}]+)\} from '@ui\/index'/g)].flatMap((m) => m[1].split(',').map((n) => n.replace(/^\s*type\s+/, '').trim()))),
)

/** Component folder (group/Name) that exports a name from its index.ts. */
const folders = readdirSync(components).flatMap((g) => (statSync(join(components, g)).isDirectory() ? readdirSync(join(components, g)).filter((n) => existsSync(join(components, g, n, 'index.ts'))).map((n) => join(components, g, n)) : []))
const owner = (name: string) => folders.find((dir) => new RegExp(`\\b${name}\\b`).test(readFileSync(join(dir, 'index.ts'), 'utf8')))

/** Every folder under components/ (or lib/) reached from the start folders through relative imports. */
function reach(start: string[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...start]
  while (queue.length) {
    const dir = queue.pop()!
    if (seen.has(dir)) continue
    seen.add(dir)
    for (const file of walk(dir).filter((f) => /\.(vue|ts)$/.test(f) && !/\.(test|docs)\.ts$/.test(f))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/from '(\.[^']+)'/g)) {
        const target = resolve(dirname(file), m[1])
        const rel = relative(components, target)
        const folder = rel.startsWith('..') ? (relative(ui, target).startsWith('lib') ? join(ui, 'lib') : null) : join(components, ...rel.split('/').slice(0, 2))
        if (!folder) continue
        if (existsSync(folder) && statSync(folder).isDirectory()) queue.push(folder)
        // A shared module directly under a group (overlays/menuStyles.ts) can hold classes too.
        else for (const ext of ['', '.ts', '.vue']) if (existsSync(folder + ext) && statSync(folder + ext).isFile()) seen.add(folder + ext)
      }
    }
  }
  return seen
}

const css = readFileSync(join(docs, 'style.css'), 'utf8')
const sources = [...css.matchAll(/@source "([^"]+)"/g)].map((m) => resolve(docs, m[1]))
const covered = (dir: string) => sources.some((s) => dir === s || dir.startsWith(`${s}/`))

describe('docs shell stylesheet', () => {
  const start = [...used].map(owner).filter((d): d is string => !!d)
  const needed = [...reach(start)].sort()

  it('finds the library components the shell renders', () => {
    expect(start.length).toBeGreaterThan(5)
  })

  it.each(needed.map((d) => relative(ui, d)))('@source covers %s', (rel) => {
    expect(covered(join(ui, rel)), `add @source "../../packages/ui/src/${rel}"; to docs/src/style.css`).toBe(true)
  })
})
