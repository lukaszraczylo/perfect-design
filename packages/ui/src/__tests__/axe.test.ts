/**
 * Accessibility rules that do not need layout, run on every documented example in the unit suite: roles, names, ARIA
 * validity, labels, duplicate ids, list and table structure. (Colour contrast, target size, scrolling and landmarks
 * need a real browser: scripts/a11y-sweep.mjs covers those.) A component that ships with an invalid role, a nameless
 * control or a dangling aria-labelledby is broken by definition, whatever else its tests say.
 */
import axe from 'axe-core'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentDoc } from '../docs-types'
import { allComponents } from '../registry'

const docs = Object.values(import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })).map((m) => m.default)

// Page-level rules make no sense for a fragment, and these need real layout.
const DISABLED = ['color-contrast', 'color-contrast-enhanced', 'region', 'landmark-one-main', 'page-has-heading-one', 'heading-order', 'target-size', 'scrollable-region-focusable', 'document-title', 'html-has-lang', 'landmark-unique', 'landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-no-duplicate-banner', 'landmark-no-duplicate-contentinfo', 'landmark-banner-is-top-level', 'landmark-contentinfo-is-top-level', 'bypass', 'link-in-text-block']

describe('axe on every documented example', () => {
  it.each(docs.flatMap((d) => d.examples.map((ex) => [`${d.name} › ${ex.title}`, ex] as const)))('%s', async (_name, ex) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Demo = defineComponent({ components: allComponents, setup: () => ex.state?.() ?? {}, template: `<main><div>${ex.code}</div></main>` })
    const w = mount(Demo, { global: { plugins: [createPinia()] }, attachTo: document.body })
    await Promise.resolve()
    const result = await axe.run(document.body, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      rules: Object.fromEntries(DISABLED.map((id) => [id, { enabled: false }])),
      resultTypes: ['violations'],
    })
    w.unmount()
    document.body.innerHTML = ''
    warn.mockRestore()
    err.mockRestore()
    expect(result.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([])
  })
})
