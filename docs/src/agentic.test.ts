/**
 * Agentic Browsing (Lighthouse): the site must publish a valid llms.txt and a valid Agentic Resource Discovery manifest.
 * These tests run Lighthouse's own conformance code against the files the site serves, so a change to the generator that
 * breaks either file fails here instead of in a later audit.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// Lighthouse vendors the reference ARD validator; import it by path (it is not a public export).
import { ConformanceTester } from '../../node_modules/lighthouse/third-party/ard/ard.js'

const read = (p: string) => readFileSync(resolve(process.cwd(), 'public', p), 'utf8')

describe('llms.txt', () => {
  const text = read('llms.txt')
  it('has an H1 header, at least one markdown link and is not trivially short (Lighthouse llms-txt audit)', () => {
    expect(/^\s*#\s+.+/m.test(text)).toBe(true)
    expect(/\[.+\]\(.+\)/.test(text)).toBe(true)
    expect(text.length).toBeGreaterThanOrEqual(50)
  })
  it('links every documented component to its docs page', () => {
    const nav = JSON.parse(readFileSync(resolve(process.cwd(), 'src/generated/nav.json'), 'utf8')) as { group: string; slug: string }[]
    const missing = nav.filter((c) => !text.includes(`](/components/${c.group}/${c.slug})`))
    expect(missing).toEqual([])
  })
})

describe('Agentic Resource Discovery manifest', () => {
  for (const path of ['.well-known/ard.json', '.well-known/ai-catalog.json']) {
    it(`${path} passes Lighthouse's ARD conformance tester with no errors or warnings`, () => {
      const tester = new ConformanceTester()
      tester.validate_manifest(read(path), path)
      expect(tester.errors).toEqual([])
      expect(tester.warnings).toEqual([])
    })
  }
  it('the legacy name serves the same manifest', () => {
    expect(read('.well-known/ai-catalog.json')).toBe(read('.well-known/ard.json'))
  })
  it('component counts in the manifest match the generated navigation index', () => {
    const nav = JSON.parse(readFileSync(resolve(process.cwd(), 'src/generated/nav.json'), 'utf8')) as unknown[]
    const manifest = JSON.parse(read('.well-known/ard.json')) as { entries: { data: { components?: number; count?: number } }[] }
    expect(manifest.entries[0].data.components).toBe(nav.length)
    expect(manifest.entries[1].data.count).toBe(nav.length)
  })
  it('the app shell advertises the manifest and llms.txt', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain('rel="ard"')
    expect(html).toContain('href="/llms.txt"')
  })
})
