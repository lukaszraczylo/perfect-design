<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import CodeSnippet from '@/components/CodeSnippet.vue'
import DocSection from '@/components/DocSection.vue'
import PageShell from '@/components/PageShell.vue'
import { entries } from '@/lib/registry'
import { CONTRACT_SNIPPETS, SNIPPETS } from '@/lib/snippets'
import { GUIDE_TOPICS } from '@/router'

const route = useRoute()
const topic = computed(() => String(route.params.topic))
const meta = computed(() => GUIDE_TOPICS.find((t) => t.id === topic.value))

const migrations = computed(() =>
  entries.filter((e) => e.replaces?.length).map((e) => ({ name: e.name, group: e.group, slug: e.slug, replaces: e.replaces! })),
)

const lead: Record<string, string> = {
  'getting-started': 'Install, wire the CSS, mount Pinia and render your first component in five minutes.',
  customisation: 'Every component is customised the same way. Learn the contract once.',
  migration: 'Replace the per-project shadcn-style components with the shared ones, one file at a time.',
  contracts: 'Components that document a requirement enforce it: a missing DialogTitle, a nameless icon button or an unwired form fails loudly instead of shipping.',
  testing: 'How the library is tested and how to test your own UI built on it.',
  llm: 'Give an LLM everything it needs to generate on-system UI.',
}
</script>

<template>
  <PageShell v-if="meta" :title="meta.title" :lead="lead[topic]" :key="topic">
    <template v-if="topic === 'getting-started'">
      <DocSection title="1. Install" description="GitHub is the primary channel: every tag publishes a GitHub Release with the packed tarball attached. The npm registry is a mirror, used when a release has been published there too.">
        <CodeSnippet :code="SNIPPETS.install" />
        <p class="text-sm text-muted-foreground">Or, from the npm registry, when that release exists there:</p>
        <CodeSnippet :code="SNIPPETS.installNpm" />
      </DocSection>
      <DocSection title="2. Wire the CSS"><CodeSnippet :code="SNIPPETS.css" label="style.css" /></DocSection>
      <DocSection title="3. Bootstrap"><CodeSnippet :code="SNIPPETS.main" label="main.ts" /></DocSection>
      <DocSection title="4. Use components"><CodeSnippet :code="SNIPPETS.use" label="Login.vue" /></DocSection>
      <DocSection title="5. Avoid a theme flash" description="useThemeStore().init() runs after your bundle loads, so a visitor who saved dark mode sees light first. Inline themeBootScript in the head to apply the saved mode, accent and style pack before first paint."><CodeSnippet :code="SNIPPETS.boot" label="server.ts" /></DocSection>
      <DocSection title="6. Required parts" description="Components throw a ContractError when a documented part is missing, for example a DialogTitle. Step 3 throws in development and logs in production."><p class="text-sm"><RouterLink to="/guides/contracts" class="text-primary underline underline-offset-4">Required parts and strict mode</RouterLink> lists what is enforced and how to route the errors.</p></DocSection>
      <DocSection title="Requirements"><p class="text-sm">Vue ≥ 3.5 and Tailwind CSS ≥ 4.1 (Vite plugin). Runtime dependencies are deliberately minimal: reka-ui (accessible primitives) and tailwind-merge (class conflict resolution). Pinia ≥ 3 is a peer: the entry point re-exports the theme store, so it must be installed even if you do not use it directly. Icons are plain FontAwesome-shaped data rendered as inline SVG. FontAwesome itself is optional. Variants, class joining, clipboard/debounce helpers and a date engine are in-house.</p></DocSection>
    </template>
    <template v-else-if="topic === 'customisation'">
      <DocSection title="The contract"><ol class="list-decimal space-y-2 pl-5 text-sm"><li><b>class wins:</b> consumer classes are merged last with tailwind-merge.</li><li><b>variant / size</b> through CVA; the variant functions are exported for reuse on non-component elements.</li><li><b>as / asChild</b> to change the rendered element (links, RouterLink).</li><li><b>data-slot</b> on every root and part for stable CSS hooks.</li><li><b>Attributes fall through</b>: aria-*, data-*, id and listeners.</li><li><b>Compound parts</b> (<code>Card</code>, <code>CardHeader</code>…) instead of config props for composite UI.</li><li><b>Tokens only</b>: change the theme, not the components.</li></ol></DocSection>
      <DocSection title="In practice"><CodeSnippet :code="SNIPPETS.override" /></DocSection>
    </template>
    <template v-else-if="topic === 'migration'">
      <DocSection title="Strategy" description="Token names match shadcn/ui, so swapping imports is usually enough.">
        <ol class="list-decimal space-y-1 pl-5 text-sm"><li>Add the CSS imports and <code>@source</code> line (see Getting started). Keep your existing token overrides after the import.</li><li>Replace <code>@/components/ui/button</code> with <code>@perfect-design/ui</code> imports file by file.</li><li>Delete the local copy once nothing imports it; run your tests.</li><li>Differences: <code>size="default"</code> → <code>"md"</code>; <code>variant="destructive"</code> unchanged; Select/Dialog compound part names are identical.</li></ol>
      </DocSection>
      <DocSection title="What replaces what">
        <div class="overflow-x-auto rounded-lg border"><table class="w-full text-left text-sm"><thead class="bg-muted/50 text-xs text-muted-foreground uppercase"><tr><th class="px-3 py-2">Component</th><th class="px-3 py-2">Replaces</th></tr></thead><tbody class="divide-y"><tr v-for="m in migrations" :key="m.name"><td class="px-3 py-2 align-top"><RouterLink :to="`/components/${m.group}/${m.slug}`" class="font-medium hover:underline">{{ m.name }}</RouterLink></td><td class="px-3 py-2"><ul class="space-y-0.5"><li v-for="r in m.replaces" :key="r">{{ r }}</li></ul></td></tr></tbody></table></div>
      </DocSection>
    </template>
    <template v-else-if="topic === 'contracts'">
      <DocSection title="What gets enforced" description="If a component's page lists something under Required by the component, leaving it out throws a ContractError.">
        <ul class="list-disc space-y-1 pl-5 text-sm">
          <li>Parts a compound component cannot work without: <code>DialogTitle</code> in <code>DialogContent</code>, a matching <code>TabsContent</code> for every <code>TabsTrigger</code>.</li>
          <li>Props that are meaningless when blank: an icon button's <code>label</code>, a table's <code>caption</code>, an image's <code>alt</code>.</li>
          <li>Accessible names for controls: icon-only buttons, inputs without a visible label, groups and regions.</li>
          <li>Silent no-ops that hide mistakes: a form with no submit handler, a social link without a label.</li>
        </ul>
      </DocSection>
      <DocSection title="What it looks like"><CodeSnippet :code="CONTRACT_SNIPPETS.missing" label="Throws" /><CodeSnippet :code="CONTRACT_SNIPPETS.fixed" label="Fixed" /></DocSection>
      <DocSection title="When it throws" description="The checks run after the component mounts, never while it renders, so a production page cannot be blanked by one. Vue re-throws errors from mounted hooks in development and logs them in production.">
        <ul class="list-disc space-y-1 pl-5 text-sm"><li>A closed dialog renders nothing and is not checked.</li><li>Every documented alternative satisfies a rule (<code>aria-label</code>, <code>aria-labelledby</code>, a <code>Field</code> label, visually hidden text).</li><li>The error message names the component, what is missing and how to fix it.</li></ul>
      </DocSection>
      <DocSection title="Strict mode"><CodeSnippet :code="CONTRACT_SNIPPETS.mode" label="main.ts" /></DocSection>
      <DocSection title="Route the errors"><CodeSnippet :code="CONTRACT_SNIPPETS.handler" label="main.ts" /></DocSection>
      <DocSection title="In your tests"><CodeSnippet :code="CONTRACT_SNIPPETS.test" label="setup" /></DocSection>
    </template>
    <template v-else-if="topic === 'testing'">
      <DocSection title="What every component ships with"><ul class="list-disc space-y-1 pl-5 text-sm"><li><b>Good path:</b> renders, variants, v-model, emits, slots.</li><li><b>Customisation</b>: class merge/override, attribute passthrough, as / asChild.</li><li><b>Bad path</b>: invalid props fall back, disabled/readonly/loading block interaction, empty or null input.</li><li><b>Edge cases</b>: empty slots, long or unicode text, boundaries, rapid interaction, cleanup on unmount.</li></ul></DocSection>
      <DocSection title="Quality gates"><ul class="list-disc space-y-1 pl-5 text-sm"><li><code>pnpm test:coverage</code> enforces 95/90/95/95 (statements/branches/functions/lines).</li><li>A structure test fails if any component folder lacks an index, tests or docs (three known gaps are listed in a ratchet), or if a docs example does not mount warning-free.</li></ul></DocSection>
      <DocSection title="Testing your own UI"><CodeSnippet :code="SNIPPETS.test" /></DocSection>
    </template>
    <template v-else-if="topic === 'llm'">
      <DocSection title="Machine-readable files">
        <ul class="list-disc space-y-1 pl-5 text-sm"><li><a class="text-primary underline" href="/llms.txt">/llms.txt</a> lists every component in one line each.</li><li><a class="text-primary underline" href="/llms-full.txt">/llms-full.txt</a> lists every prop, slot, event, rule and example.</li><li><a class="text-primary underline" href="/components.manifest.json">/components.manifest.json</a>: the same as structured JSON.</li><li><code>AGENTS.md</code> in the repository root: contribution + usage rules.</li></ul>
      </DocSection>
      <DocSection title="Starter prompt"><CodeSnippet :code="SNIPPETS.llmPrompt" /></DocSection>
    </template>
  </PageShell>
</template>
