/**
 * A requirement listed in a component's docs (`requires`) is a promise that it is enforced. Each such component must have
 * a test in its folder that turns strict mode on and triggers the error; documenting a rule without testing it fails here.
 */
import { describe, expect, it } from 'vitest'
import type { ComponentDoc } from '../docs-types'

const docs = import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })
const tests = import.meta.glob('../components/**/*.test.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

describe('documented requirements are tested', () => {
  const withRequires = Object.entries(docs).filter(([, m]) => m.default.requires?.length)

  it('some components document requirements', () => expect(withRequires.length).toBeGreaterThan(0))

  it.each(withRequires.map(([path, m]) => [m.default.name, path, m.default.requires!.length] as const))('%s', (_name, path, count) => {
    const dir = path.slice(0, path.lastIndexOf('/'))
    const group = dir.slice(0, dir.lastIndexOf('/')) // the component group folder: parts of a compound may be tested one level up
    const own = Object.entries(tests).filter(([p]) => p.startsWith(dir + '/') || p === `${group}/contract.test.ts`)
    const strict = own.filter(([, text]) => text.includes('configureStrictMode') && /ContractError|requires a|needs an accessible name|non-empty/.test(text))
    expect(strict.length, `${_name} documents ${count} requirement(s) but no test in ${dir} turns strict mode on and triggers an error`).toBeGreaterThan(0)
  })
})
