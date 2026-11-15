/**
 * Generates LLM-friendly artefacts from every `*.docs.ts` file:
 *   llms.txt (index), llms-full.txt (everything), components.manifest.json (structured).
 * Written to the repo root and docs/public so the website serves them.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ComponentDoc } from '../packages/ui/src/docs-types'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const componentsDir = join(root, 'packages/ui/src/components')
const GROUP_ORDER = ['primitives', 'typography', 'layout', 'forms', 'feedback', 'overlays', 'navigation', 'data-display', 'marketing']

const slug = (n: string) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.docs.ts')) out.push(p)
  }
  return out
}

export function renderIndex(docs: ComponentDoc[]): string {
  const lines = [
    '# Perfect Design (@perfect-design/ui)',
    '',
    '> Universal Vue 3 + Tailwind 4 + reka-ui component library and design system. Semantic tokens (shadcn-compatible), CVA variants, `class` prop always wins, `as`/`asChild`, `data-slot` hooks. Icons are FontAwesome IconDefinitions.',
    '',
    '## Rules',
    '- Import from `@perfect-design/ui`; use semantic tokens only (bg-background, text-foreground, bg-primary, border-border…); never raw colours.',
    '- Override styling only through the `class` prop; reuse `xVariants()` helpers for non-component elements.',
    '- Wrap form controls in `Field`; give icon-only buttons an aria-label; Dialogs need a DialogTitle.',
    '- Avoid the LLM tells in LLMSlop.md: no gradients, glass, glows, tracked all-caps eyebrows, hover lift, buzzwords, stock labels ("Get started", "Learn more"), emoji or invented people, quotes and numbers. Follow DESIGN.md.',
    '',
    '## Start here',
    '- [Getting started](/guides/getting-started): install, CSS wiring, first component',
    '- [Customisation contract](/guides/customisation): class, variant, size, as, data-slot',
    '- [Using with LLMs](/guides/llm): prompt and rules for generating UI',
    '- [Colour tokens](/foundations/colors): every semantic token and its role',
    '- [Style packs](/foundations/styles): workbench, tactile, editorial, raw, contrast and terminal looks via data-style',
    '- [Every component in detail](/llms-full.txt): props, slots, events, rules and examples for all components in one file',
    '- [Component manifest](/components.manifest.json): the same data as JSON',
    '',
  ]
  for (const g of GROUP_ORDER) {
    const items = docs.filter((d) => d.group === g)
    if (!items.length) continue
    lines.push(`## ${g}`)
    for (const d of items) lines.push(`- [${d.name}](/components/${d.group}/${slug(d.name)}): ${d.summary} (${d.subgroup})`)
    lines.push('')
  }
  return lines.join('\n')
}

export function renderFull(docs: ComponentDoc[]): string {
  const out: string[] = [renderIndex(docs), '---', '']
  for (const d of docs) {
    out.push(`# ${d.name}`, `group: ${d.group} / ${d.subgroup}`, d.summary, '')
    if (d.description) out.push(d.description, '')
    out.push(`import { ${[d.name, ...(d.parts ?? []).map((p) => p.name)].join(', ')} } from '@perfect-design/ui'`, '')
    if (d.props.length) {
      out.push('Props:')
      for (const p of d.props) out.push(`- ${p.name}${p.required ? '*' : ''}: ${p.type}${p.default ? ` = ${p.default}` : ''} - ${p.description}`)
      out.push('')
    }
    if (d.parts?.length) {
      out.push('Parts:')
      for (const p of d.parts) {
        out.push(`- ${p.name} - ${p.description}`)
        for (const pp of p.props ?? []) out.push(`    - ${pp.name}: ${pp.type}${pp.default ? ` = ${pp.default}` : ''} - ${pp.description}`)
      }
      out.push('')
    }
    if (d.slots?.length) out.push('Slots:', ...d.slots.map((s) => `- ${s.name}${s.props ? ` (${s.props})` : ''} - ${s.description}`), '')
    if (d.emits?.length) out.push('Events:', ...d.emits.map((e) => `- ${e.name}${e.payload ? ` ${e.payload}` : ''} - ${e.description}`), '')
    if (d.requires?.length) out.push('Enforced requirements (a ContractError is thrown when missing):', ...d.requires.map((n) => `- ${n}`), '')
    if (d.llmNotes?.length) out.push('Rules:', ...d.llmNotes.map((n) => `- ${n}`), '')
    if (d.a11y?.length) out.push('Accessibility:', ...d.a11y.map((n) => `- ${n}`), '')
    for (const ex of d.examples) {
      out.push(`Example: ${ex.title}`, '```vue')
      if (ex.script) out.push(`<script setup lang="ts">`, ex.script, `</script>`, '')
      out.push(ex.code, '```', '')
    }
    out.push('---', '')
  }
  return out.join('\n')
}

export function sortDocs(docs: ComponentDoc[]): ComponentDoc[] {
  const rank = (g: string) => (GROUP_ORDER.indexOf(g) === -1 ? 99 : GROUP_ORDER.indexOf(g))
  return [...docs].sort((a, b) => rank(a.group) - rank(b.group) || a.subgroup.localeCompare(b.subgroup) || a.name.localeCompare(b.name))
}

async function main() {
  const files = walk(componentsDir)
  const docs: ComponentDoc[] = []
  for (const f of files) {
    const mod = (await import(pathToFileURL(f).href)) as { default?: ComponentDoc }
    if (!mod.default) throw new Error(`${f}: missing default export`)
    docs.push(mod.default)
  }
  const sorted = sortDocs(docs)
  // `state` functions are not serialisable; strip them from the manifest.
  const manifest = sorted.map((d) => ({ ...d, examples: d.examples.map(({ state: _s, ...ex }) => ex) }))
  const targets = [root, join(root, 'docs/public')]
  for (const dir of targets) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'llms.txt'), renderIndex(sorted))
    writeFileSync(join(dir, 'llms-full.txt'), renderFull(sorted))
    writeFileSync(join(dir, 'components.manifest.json'), JSON.stringify({ name: '@perfect-design/ui', generatedFrom: 'packages/ui/src/components/**/*.docs.ts', count: manifest.length, components: manifest }, null, 2))
  }
  // Lean navigation index for the docs site (avoids bundling every docs file + component into the first page load).
  const nav = sorted.map((d) => {
    const file = files.find((f) => f.endsWith(`/${d.name}.docs.ts`))!
    return {
      name: d.name, slug: slug(d.name), group: d.group, subgroup: d.subgroup, summary: d.summary, status: d.status ?? 'stable',
      examples: d.examples.length, parts: d.parts?.length ?? 0, replaces: d.replaces ?? [],
      file: file.slice(root.length + 1),
    }
  })
  mkdirSync(join(root, 'docs/src/generated'), { recursive: true })
  writeFileSync(join(root, 'docs/src/generated/nav.json'), JSON.stringify(nav))
  // Agentic Resource Discovery manifest (Lighthouse "Agentic Browsing"): served at /.well-known/ard.json, with the legacy
  // ai-catalog.json name for older consumers. Entries carry inline `data` (a `url` would have to be an absolute URI and
  // the deployment origin is not known at build time). Media types are `application/*` extension types, which ARD permits.
  const groups = [...new Set(sorted.map((d) => d.group))]
  const ard = {
    entries: [
      {
        identifier: 'urn:air:perfect-design:docs:design-system',
        displayName: 'Perfect Design documentation',
        type: 'application/vnd.perfect-design.docs+json',
        description: `Documentation of the Perfect Design system: design tokens, ${sorted.length} Vue 3 components in ${groups.length} groups, guides, and rules for generating UI with them.`,
        representativeQueries: ['How do I install the Perfect Design component library?', 'Which design tokens does Perfect Design define?', 'How do I customise a Perfect Design component?'],
        tags: ['design-system', 'vue', 'tailwindcss', 'components', 'documentation'],
        capabilities: ['DesignTokens', 'ComponentCatalogue'],
        data: {
          name: '@perfect-design/ui',
          components: sorted.length,
          groups,
          entryPoints: { llmsTxt: '/llms.txt', llmsFull: '/llms-full.txt', componentManifest: '/components.manifest.json', guides: '/guides/getting-started', tokens: '/foundations/colors' },
        },
      },
      {
        identifier: 'urn:air:perfect-design:docs:component-catalogue',
        displayName: 'Perfect Design component catalogue',
        type: 'application/vnd.perfect-design.components+json',
        description: 'Every component with its props, slots, events, accessibility notes and rules for LLM authors, as one JSON document.',
        representativeQueries: ['What props does the Perfect Design Button accept?', 'Which Perfect Design component shows a date picker?', 'List the Perfect Design form components'],
        tags: ['components', 'props', 'api-reference'],
        capabilities: ['ComponentLookup'],
        data: { manifest: '/components.manifest.json', count: sorted.length, groups },
      },
    ],
  }
  const wellKnown = join(root, 'docs/public/.well-known')
  mkdirSync(wellKnown, { recursive: true })
  writeFileSync(join(wellKnown, 'ard.json'), JSON.stringify(ard, null, 2) + '\n')
  writeFileSync(join(wellKnown, 'ai-catalog.json'), JSON.stringify(ard, null, 2) + '\n')
  console.log(`Generated LLM artefacts for ${sorted.length} components.`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main()
