<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DocText from '@/components/DocText.vue'
import PageShell from '@/components/PageShell.vue'
import { tree } from '@/lib/registry'
</script>

<template>
  <PageShell title="Components" lead="Every component is grouped, documented with live examples, tested for good, bad and edge cases, and customisable the same way.">
    <section v-for="g in tree" :key="g.id" class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight"><RouterLink :to="`/components/${g.id}`" class="hover:underline">{{ g.title }}</RouterLink></h2>
        <p class="text-sm text-muted-foreground">{{ g.blurb }}</p>
      </div>
      <div v-for="sg in g.subgroups" :key="sg.title">
        <h3 class="mb-2 text-sm font-medium text-muted-foreground">{{ sg.title }}</h3>
        <ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <li v-for="c in sg.items" :key="c.name">
            <RouterLink :to="`/components/${g.id}/${c.slug}`" class="block h-full rounded-lg border p-3 transition-colors hover:bg-accent">
              <span class="font-medium">{{ c.name }}</span>
              <DocText :text="c.summary" size="sm" tone="muted" class="mt-0.5 line-clamp-2" />
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>
  </PageShell>
</template>
