<script setup lang="ts">
/**
 * Compiles a docs example (a Vue template string) at runtime and renders it with every library component registered.
 * Lives in its own lazy chunk because it needs the template compiler and the whole component library.
 */
import * as Vue from 'vue'
import { compile } from '@vue/compiler-dom'
import '../demo.css'
import { computed, defineComponent, onErrorCaptured, proxyRefs, ref } from 'vue'
import type { ExampleDoc } from '@ui/docs-types'
import { allComponents } from '@ui/registry'

const props = defineProps<{ example: ExampleDoc }>()
const error = ref<string | null>(null)

onErrorCaptured((e) => {
  error.value = e instanceof Error ? e.message : String(e)
  return false
})

const Demo = computed(() => {
  const { code } = compile(`<div>${props.example.code}</div>`, { mode: 'function', onError: (e) => { throw e } })
  const render = new Function('Vue', code)(Vue) as (ctx: object, cache: unknown[]) => unknown
  return defineComponent({
    name: 'ExampleDemo',
    components: allComponents,
    setup() {
      // The compiled render function reads state through `with (ctx)`. Giving it a plain proxy over the example's state
      // (refs unwrapped, only own keys reported) lets globals such as `undefined` fall through without Vue's dev warning
      // that the component-instance proxy would emit in the runtime-only build.
      const state = proxyRefs(props.example.state?.() ?? {})
      const ctx = new Proxy(state, { has: (target, key) => typeof key === 'string' && key in target })
      return () => render(ctx, [])
    },
  })
})
</script>

<template>
  <p v-if="error" role="alert" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">Example failed to render: {{ error }}</p>
  <component :is="Demo" v-else />
</template>
