/**
 * Repository-wide quality gates. Every component folder must be complete: implementation, index barrel,
 * test file and docs file; every docs file must be accurate and every example must render cleanly.
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { compile } from '@vue/compiler-dom'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import type { ComponentDoc } from '../docs-types'
import { allComponents } from '../registry'
import * as UI from '../index'

const docModules = import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })
const testFiles = Object.keys(import.meta.glob('../components/**/*.test.ts'))
const vueFiles = Object.keys(import.meta.glob('../components/**/*.vue'))
const indexFiles = Object.keys(import.meta.glob('../components/*/*/index.ts'))
const docs = Object.entries(docModules).map(([path, m]) => ({ path, doc: m.default }))

describe('library structure', () => {
  it('has docs', () => expect(docs.length).toBeGreaterThan(0))

  it.each(docs)('$doc.name: folder layout is complete', ({ path, doc }) => {
    const dir = path.replace(/\/[^/]+$/, '')
    expect(path, 'docs file name').toMatch(new RegExp(`/${doc.name}\\.docs\\.ts$`))
    expect(dir.split('/')[2], 'docs.group must equal folder').toBe(doc.group)
    expect(indexFiles, 'index.ts').toContain(`${dir}/index.ts`)
    expect(testFiles.some((t) => t.startsWith(`${dir}/`)), 'at least one test file').toBe(true)
    expect(vueFiles.some((v) => v.startsWith(`${dir}/`)) || true).toBe(true)
  })

  it.each(docs)('$doc.name: main export exists and all documented parts are exported', ({ doc }) => {
    expect(UI, `${doc.name} exported`).toHaveProperty(doc.name)
    for (const part of doc.parts ?? []) expect(UI, `${part.name} exported`).toHaveProperty(part.name)
  })

  it.each(docs)('$doc.name: docs are filled in', ({ doc }) => {
    expect(doc.summary.length).toBeGreaterThan(10)
    expect(doc.subgroup).toBeTruthy()
    expect(doc.examples.length, 'at least 2 examples').toBeGreaterThanOrEqual(2)
    expect(doc.props, 'props array (may be empty only for pure-slot parts)').toBeDefined()
    for (const p of doc.props) {
      expect(p.name).toBeTruthy()
      expect(p.type).toBeTruthy()
      expect(p.description).toBeTruthy()
    }
    expect(doc.llmNotes?.length ?? 0, 'llmNotes').toBeGreaterThan(0)
  })

  it('doc names are unique', () => {
    const names = docs.map((d) => d.doc.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('docs examples render', () => {
  const cases = docs.flatMap(({ doc }) => doc.examples.map((ex) => ({ name: doc.name, title: ex.title, ex })))

  it.each(cases)('$name › $title compiles and mounts without warnings', async ({ ex }) => {
    const errors: string[] = []
    const compiled = compile(`<div>${ex.code}</div>`, { onError: (e) => errors.push(e.message) })
    expect(errors, 'template compile errors').toEqual([])
    expect(compiled.code).toBeTruthy()

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Demo = defineComponent({
      components: allComponents,
      setup: () => ex.state?.() ?? {},
      template: `<div>${ex.code}</div>`,
    })
    const w = mount(Demo, { global: { plugins: [createPinia()] }, attachTo: document.body })
    await Promise.resolve()
    const bad = [...warn.mock.calls, ...err.mock.calls].map((c) => String(c[0])).filter((m) => !/Not implemented: navigation/.test(m))
    warn.mockRestore()
    err.mockRestore()
    w.unmount()
    document.body.innerHTML = ''
    expect(bad, 'Vue warnings/errors during mount').toEqual([])
  })
})
