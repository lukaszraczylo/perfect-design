<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge, Button, Input } from '@ui/index'
import { entries, tree } from '@/lib/registry'
import { COLOR_GROUPS } from '@/lib/tokens'

const exampleCount = computed(() => entries.reduce((n, e) => n + e.examples, 0))

// The five named colours from DESIGN.md, read live from the active theme so the specimen never drifts from the CSS.
const NAMED = [
  { name: 'Paper', token: 'background', role: 'Surfaces' },
  { name: 'Ink', token: 'foreground', role: 'Text and icons' },
  { name: 'Petrol', token: 'primary', role: 'The one accent' },
  { name: 'Signal', token: 'warning', role: 'Attention only' },
  { name: 'Brick', token: 'destructive', role: 'Errors and irreversible actions' },
]
const values = ref<Record<string, string>>({})
onMounted(() => {
  const cs = getComputedStyle(document.documentElement)
  values.value = Object.fromEntries(NAMED.map((n) => [n.token, cs.getPropertyValue(`--${n.token}`).trim()]))
})
const tokenTotal = COLOR_GROUPS.reduce((n, g) => n + g.tokens.length, 0)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="text-4xl font-semibold tracking-tight text-balance">Vue components and design tokens for our Tailwind apps</h1>
    <p class="mt-4 max-w-2xl text-md text-muted-foreground text-pretty">
      {{ entries.length }} documented components in {{ tree.length }} groups, one token set, tested in light and dark. Built from patterns that repeat across many Vue apps, so each app can replace its local copies.
    </p>
    <div class="mt-6">
      <Button as-child size="lg"><RouterLink to="/components">Browse the components</RouterLink></Button>
    </div>

    <section class="mt-14" aria-labelledby="specimen">
      <h2 id="specimen" class="text-2xl font-semibold tracking-tight">The palette in use right now</h2>
      <p class="mt-2 max-w-2xl text-muted-foreground">Five named colours, one dominant and one sharp. Values are read from the active theme: change the mode or accent and they update.</p>
      <ul class="mt-5 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-5">
        <li v-for="n in NAMED" :key="n.token" class="bg-card">
          <div class="h-20" :style="{ background: `var(--${n.token})` }" role="img" :aria-label="`${n.name} swatch`" />
          <div class="p-3">
            <div class="font-medium">{{ n.name }}</div>
            <div class="mt-0.5 text-sm text-muted-foreground">{{ n.role }}</div>
            <div class="mt-1 truncate font-mono text-xs text-muted-foreground tabular-nums">{{ values[n.token] }}</div>
          </div>
        </li>
      </ul>
      <div class="mt-6 flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Button>Save changes</Button>
        <Button variant="outline">Cancel</Button>
        <Badge variant="success">Deployed</Badge>
        <Badge variant="warning">Quota at 80%</Badge>
        <Input class="max-w-56" aria-label="Project name" placeholder="Project name" />
      </div>
    </section>

    <section class="mt-14" aria-labelledby="coverage">
      <h2 id="coverage" class="text-2xl font-semibold tracking-tight">What is covered</h2>
      <div class="mt-4 overflow-x-auto rounded-lg border">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">Component groups and how many components each holds</caption>
          <thead class="bg-muted/50 text-muted-foreground"><tr><th scope="col" class="px-3 py-2 font-medium">Group</th><th scope="col" class="px-3 py-2 text-end font-medium">Components</th><th scope="col" class="px-3 py-2 font-medium">Contains</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="g in tree" :key="g.id">
              <th scope="row" class="px-3 py-2 text-start font-medium"><RouterLink :to="`/components/${g.id}`" class="underline-offset-4 hover:underline">{{ g.title }}</RouterLink></th>
              <td class="px-3 py-2 text-end tabular-nums">{{ g.count }}</td>
              <td class="px-3 py-2 text-muted-foreground">{{ g.blurb }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-sm text-muted-foreground tabular-nums">{{ exampleCount }} live examples and {{ tokenTotal }} colour tokens. Every example is mounted by the test suite and audited for accessibility.</p>
    </section>

    <section class="mt-14" aria-labelledby="start">
      <h2 id="start" class="text-2xl font-semibold tracking-tight">Using it in an existing app</h2>
      <p class="mt-2 max-w-2xl text-muted-foreground">Token names match shadcn/ui, so most apps swap imports and keep their classes. The <RouterLink to="/guides/migration" class="text-primary underline underline-offset-4">migration guide</RouterLink> lists which local component each one replaces.</p>
    </section>
  </div>
</template>
