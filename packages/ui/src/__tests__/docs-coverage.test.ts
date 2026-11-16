/**
 * Every component folder ships a `<Name>.docs.ts`. The structure test only inspects docs files that exist, so a folder
 * without one would vanish from the docs site, llms.txt and the manifest without any test noticing.
 */
import { describe, expect, it } from 'vitest'

const vueFiles = Object.keys(import.meta.glob('../components/*/*/*.vue'))
const docFiles = new Set(Object.keys(import.meta.glob('../components/*/*/*.docs.ts')))

// Ratchet: folders known to lack docs. Remove an entry when its docs file lands; never add one.
const KNOWN_UNDOCUMENTED = new Set(['primitives/Spinner', 'primitives/Icon', 'data-display/LogViewer'])

const folders = [...new Set(vueFiles.map((f) => f.split('/').slice(2, 4).join('/')))].filter((f) => !f.split('/')[1].startsWith('_'))

describe('docs coverage', () => {
  it.each(folders)('%s has a docs file', (folder) => {
    const name = folder.split('/')[1]
    const has = docFiles.has(`../components/${folder}/${name}.docs.ts`)
    if (KNOWN_UNDOCUMENTED.has(folder)) expect(has, `${folder} now has docs: remove it from KNOWN_UNDOCUMENTED`).toBe(false)
    else expect(has, `${folder}/${name}.docs.ts is missing`).toBe(true)
  })
})
