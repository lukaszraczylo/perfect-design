<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@ui/index'
</script>

<template>
  <div class="mx-auto max-w-xl py-24 text-center">
    <p class="text-sm font-semibold text-primary">404</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
    <p class="mt-3 text-muted-foreground">That page or component does not exist. Try the search or browse the catalogue.</p>
    <Button as-child class="mt-6"><RouterLink to="/components">Browse components</RouterLink></Button>
  </div>
</template>
