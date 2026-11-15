<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@ui/index'
import { tree } from '@/lib/registry'
import { FOUNDATION_TOPICS, GUIDE_TOPICS } from '@/router'

const route = useRoute()
const openGroups = ref<Set<string>>(new Set())
watch(() => route.params.group, (g) => g && openGroups.value.add(String(g)), { immediate: true })
function toggle(id: string) {
  const next = new Set(openGroups.value)
  next.has(id) ? next.delete(id) : next.add(id)
  openGroups.value = next
}
const link = 'block rounded-md px-2 py-1.5 text-sm pointer-coarse:py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
const active = 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
</script>

<template>
  <nav class="space-y-6 text-sm" data-testid="side-nav" aria-label="Documentation">
    <section>
      <h2 class="mb-1 px-2 text-sm font-semibold text-muted-foreground">Guides</h2>
      <RouterLink v-for="g in GUIDE_TOPICS" :key="g.id" :to="`/guides/${g.id}`" :class="link" :active-class="active">{{ g.title }}</RouterLink>
    </section>
    <section>
      <h2 class="mb-1 px-2 text-sm font-semibold text-muted-foreground">Foundations</h2>
      <RouterLink v-for="t in FOUNDATION_TOPICS" :key="t.id" :to="`/foundations/${t.id}`" :class="link" :active-class="active">{{ t.title }}</RouterLink>
    </section>
    <section>
      <h2 class="mb-1 px-2 text-sm font-semibold text-muted-foreground">Components</h2>
      <RouterLink to="/components" :class="link" exact-active-class="bg-sidebar-accent font-medium">Overview</RouterLink>
      <div v-for="g in tree" :key="g.id">
        <button type="button" class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start font-medium hover:bg-sidebar-accent pointer-coarse:py-3" :aria-expanded="openGroups.has(g.id)" @click="toggle(g.id)">
          <span>{{ g.title }} <span class="text-xs font-normal text-muted-foreground">{{ g.count }}</span></span>
          <Icon :icon="faChevronRight" size="xs" :class="openGroups.has(g.id) && 'rotate-90'" class="transition-transform" />
        </button>
        <div v-if="openGroups.has(g.id)" class="mb-2 ml-2 border-l pl-2">
          <RouterLink :to="`/components/${g.id}`" :class="link" exact-active-class="bg-sidebar-accent font-medium">All {{ g.title.toLowerCase() }}</RouterLink>
          <template v-for="sg in g.subgroups" :key="sg.title">
            <h3 class="mt-2 px-2 text-xs text-muted-foreground">{{ sg.title }}</h3>
            <RouterLink v-for="c in sg.items" :key="c.name" :to="`/components/${g.id}/${c.slug}`" :class="link" :active-class="active">{{ c.name }}</RouterLink>
          </template>
        </div>
      </div>
    </section>
  </nav>
</template>
