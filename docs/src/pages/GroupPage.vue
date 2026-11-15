<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DocText from '@/components/DocText.vue'
import PageShell from '@/components/PageShell.vue'
import NotFoundPage from './NotFoundPage.vue'
import { tree } from '@/lib/registry'

const route = useRoute()
const group = computed(() => tree.find((g) => g.id === route.params.group))
</script>

<template>
  <PageShell v-if="group" :title="group.title" :lead="group.blurb">
    <section v-for="sg in group.subgroups" :key="sg.title" class="space-y-3">
      <h2 class="text-xl font-semibold tracking-tight">{{ sg.title }}</h2>
      <ul class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        <li v-for="c in sg.items" :key="c.name">
          <RouterLink :to="`/components/${group.id}/${c.slug}`" class="block h-full rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
            <span class="font-semibold">{{ c.name }}</span>
            <DocText :text="c.summary" size="sm" tone="muted" class="mt-1" />
            <span class="mt-2 block text-xs text-muted-foreground">{{ c.examples }} examples<template v-if="c.parts"> · {{ c.parts }} parts</template></span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </PageShell>
  <NotFoundPage v-else />
</template>
