<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { ComponentDoc } from '@ui/docs-types'
import { Badge } from '@ui/index'
import CodeSnippet from '@/components/CodeSnippet.vue'
import DocSection from '@/components/DocSection.vue'
import ExampleRunner from '@/components/ExampleRunner.vue'
import DocText from '@/components/DocText.vue'
import PropsTable from '@/components/PropsTable.vue'
import { cachedDoc, findEntry, loadDoc, GROUP_META, entries } from '@/lib/registry'

const route = useRoute()
const doc = computed(() => findEntry(String(route.params.group), String(route.params.slug)))
// The router guard preloads the docs, so on first render (and when hydrating the prerendered page) `full` is already set.
const full = ref<ComponentDoc | null>(doc.value ? cachedDoc(doc.value) : null)
const failed = ref(false)

watch(
  () => route.params.slug,
  async () => {
    failed.value = false
    const entry = doc.value
    if (!entry) return
    const hit = cachedDoc(entry)
    if (hit) {
      full.value = hit
      return
    }
    full.value = null
    try {
      full.value = await loadDoc(entry)
    } catch {
      failed.value = true
    }
  },
)

const related = computed(() => (full.value?.related ?? []).map((n) => entries.find((e) => e.name === n)).filter((e): e is NonNullable<typeof e> => !!e))
const importLine = computed(() => {
  const d = doc.value
  if (!d) return ''
  const names = [d.name, ...(full.value?.parts ?? []).map((p) => p.name)]
  return `import { ${names.join(', ')} } from '@perfect-design/ui'`
})
</script>

<template>
  <article v-if="doc" class="w-full min-w-0">
    <nav aria-label="Breadcrumb" class="mb-3 text-sm text-muted-foreground">
      <RouterLink to="/components" class="hover:underline">Components</RouterLink> /
      <RouterLink :to="`/components/${doc.group}`" class="hover:underline">{{ GROUP_META[doc.group]?.title ?? doc.group }}</RouterLink> /
      <span>{{ doc.subgroup }}</span>
    </nav>
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="min-w-0 text-4xl font-semibold tracking-tight wrap-anywhere">{{ doc.name }}</h1>
      <Badge :variant="doc.status === 'beta' ? 'warning' : 'success'">{{ doc.status ?? 'stable' }}</Badge>
    </div>
    <DocText :text="doc.summary" size="lg" tone="muted" class="mt-3 max-w-2xl text-pretty" />
    <div class="mt-10 space-y-12">
      <DocSection title="Import"><CodeSnippet :code="importLine" /></DocSection>
      <p v-if="failed" role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">The documentation for this component could not be loaded. Reload the page to try again.</p>
      <p v-else-if="!full" role="status" data-doc-loading class="text-sm text-muted-foreground">Loading documentation…</p>
      <template v-if="full">
      <DocSection v-if="full.description" title="Overview"><DocText :text="full.description" block class="max-w-3xl text-pretty" /></DocSection>
      <DocSection title="Examples">
        <div class="space-y-6"><ExampleRunner v-for="ex in full.examples" :key="ex.title" :example="ex" /></div>
      </DocSection>
      <DocSection title="Props"><PropsTable :props="full.props" :label="`${full.name} props`" /></DocSection>
      <DocSection v-if="full.parts?.length" title="Parts" description="Compound sub-components exported alongside the root.">
        <div v-for="p in full.parts" :key="p.name" class="space-y-2">
          <h3 class="font-mono text-sm font-semibold">{{ p.name }}</h3>
          <DocText :text="p.description" size="sm" tone="muted" />
          <PropsTable v-if="p.props?.length" :props="p.props" :label="`${p.name} props`" />
        </div>
      </DocSection>
      <DocSection v-if="full.slots?.length" title="Slots">
        <ul class="divide-y rounded-lg border text-sm">
          <li v-for="s in full.slots" :key="s.name" class="flex flex-wrap gap-x-3 px-3 py-2"><code class="font-mono">{{ s.name }}</code><span v-if="s.props" class="font-mono text-xs text-muted-foreground">{{ s.props }}</span><DocText :text="s.description" size="sm" tone="muted" class="min-w-0 flex-1" /></li>
        </ul>
      </DocSection>
      <DocSection v-if="full.emits?.length" title="Events">
        <ul class="divide-y rounded-lg border text-sm">
          <li v-for="e in full.emits" :key="e.name" class="flex flex-wrap gap-x-3 px-3 py-2"><code class="font-mono">{{ e.name }}</code><span v-if="e.payload" class="font-mono text-xs text-muted-foreground">{{ e.payload }}</span><DocText :text="e.description" size="sm" tone="muted" class="min-w-0 flex-1" /></li>
        </ul>
      </DocSection>
      <DocSection v-if="full.requires?.length" title="Required by the component" description="These are enforced: a ContractError is thrown (in development) when one is missing, so the mistake cannot ship unnoticed."><ul class="list-disc space-y-1 pl-5 text-sm"><li v-for="r in full.requires" :key="r"><DocText :text="r" size="sm" /></li></ul></DocSection>
      <DocSection v-if="full.a11y?.length" title="Accessibility"><ul class="list-disc space-y-1 pl-5 text-sm"><li v-for="a in full.a11y" :key="a"><DocText :text="a" size="sm" /></li></ul></DocSection>
      <DocSection v-if="full.llmNotes?.length" title="Rules for LLM authors" description="Terse rules to follow when generating UI with this component.">
        <ul class="list-disc space-y-1 pl-5 text-sm"><li v-for="a in full.llmNotes" :key="a"><DocText :text="a" size="sm" /></li></ul>
      </DocSection>
      <DocSection v-if="full.replaces?.length" title="Replaces"><ul class="list-disc space-y-1 pl-5 text-sm"><li v-for="a in full.replaces" :key="a"><DocText :text="a" size="sm" /></li></ul></DocSection>
      <DocSection v-if="related.length" title="Related">
        <ul class="flex flex-wrap gap-2"><li v-for="r in related" :key="r.name"><RouterLink :to="`/components/${r.group}/${r.slug}`" class="inline-flex min-h-6 items-center rounded-md border px-2.5 py-1 text-sm hover:bg-accent pointer-coarse:min-h-11">{{ r.name }}</RouterLink></li></ul>
      </DocSection>
      </template>
    </div>
  </article>
</template>
