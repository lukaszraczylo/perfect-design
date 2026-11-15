/**
 * "Broken by definition" detector for styling. Tailwind silently drops a utility it cannot generate (a typo, an unknown
 * token, removed v3 syntax such as `z-[--z-modal]`), so the component renders unstyled and jsdom tests never notice.
 * This mounts every documented example, collects the class tokens that actually end up in the DOM, and asks Tailwind's
 * own design system (loaded with the real theme) whether each token produces CSS.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentDoc } from '../docs-types'
import { allComponents } from '../registry'

const docs = Object.values(import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })).map((m) => m.default)

// Classes that are hooks or component-owned rules (defined in theme.css), not Tailwind utilities.
const NON_UTILITY = new Set(['group', 'peer', 'dark', 'pd-marquee', 'pd-marquee-track', 'pd-marquee-clone', 'pd-marquee-copy'])
const isHook = (t: string) => NON_UTILITY.has(t) || t.startsWith('group/') || t.startsWith('peer/') || t.startsWith('pd-') || t.startsWith('language-')

// Tailwind v4 happily generates `z-index: --z-modal` for `z-[--z-modal]` (v3 syntax): a candidate that is "valid" but emits
// a bare custom property instead of var(). v4 needs `z-(--z-modal)`.
const bareCustomProperty = (css: string | null | undefined) => !!css && /:\s*--[\w-]+\s*[;}]/.test(css)

describe('css validity', async () => {
  const root = resolve(process.cwd(), 'src/styles')
  const css = readFileSync(join(root, 'theme.css'), 'utf8')
  const design = await __unstable__loadDesignSystem(`@import "tailwindcss";\n${css}`, { base: root })

  it('the checker rejects invalid utilities and accepts valid ones (self test)', () => {
    const [bad, good, oldSyntax, arbitrary] = design.candidatesToCss(['bg-primaryy', 'bg-primary', 'z-[--z-modal]', 'size-[3px]'])
    expect(bad).toBeFalsy()
    expect(good).toBeTruthy()
    expect(bareCustomProperty(oldSyntax)).toBe(true) // v3 syntax: emits a bare custom property
    expect(bareCustomProperty(design.candidatesToCss(['z-(--z-modal)'])[0])).toBe(false) // v4 syntax is fine
    expect(arbitrary).toBeTruthy()
  })

  it('every class rendered by every documented example generates CSS', async () => {
    const seen = new Map<string, string>() // token -> first example that rendered it
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    for (const doc of docs) {
      for (const ex of doc.examples) {
        const Demo = defineComponent({ components: allComponents, setup: () => ex.state?.() ?? {}, template: `<div>${ex.code}</div>` })
        const w = mount(Demo, { global: { plugins: [createPinia()] }, attachTo: document.body })
        for (const el of document.body.querySelectorAll('[class]')) {
          for (const t of (el.getAttribute('class') ?? '').split(/\s+/)) if (t && !isHook(t) && !seen.has(t)) seen.set(t, `${doc.name} › ${ex.title}`)
        }
        w.unmount()
        document.body.innerHTML = ''
      }
    }
    warn.mockRestore()
    err.mockRestore()
    const tokens = [...seen.keys()]
    const out = design.candidatesToCss(tokens)
    const invalid = tokens.filter((_, i) => !out[i] || bareCustomProperty(out[i])).map((t) => `${t}   (first seen in ${seen.get(t)})`)
    expect(tokens.length).toBeGreaterThan(500)
    expect(invalid).toEqual([])
  }, 300000)
})
