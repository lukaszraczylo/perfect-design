# @perfect-design/ui

Vue 3 component library for the Perfect Design system: tokens, primitives, forms, overlays,
navigation, data display, marketing sections and charts. Runtime dependencies are only
**reka-ui** and **tailwind-merge**; peers are **vue**, **pinia** and **tailwindcss** (Tailwind 4).

- Docs, every component with live examples: <https://perfect-design.raczylo.com>
- Source and releases: <https://github.com/lukaszraczylo/perfect-design>

## Install

GitHub Releases are the primary channel; the npm registry mirrors the same build.

```
pnpm add @perfect-design/ui
pnpm add pinia tailwindcss vue                      # peers the package does not bundle
pnpm add @fortawesome/free-solid-svg-icons          # optional: icon data for <Icon>
```

Prefer a GitHub Release tarball? Every tag attaches one:

```
pnpm add https://github.com/lukaszraczylo/perfect-design/releases/download/v0.1.5/perfect-design-ui-0.1.5.tgz
```

## Setup

```css
/* src/style.css */
@import "tailwindcss";
@import "@perfect-design/ui/theme.css";
@import "@perfect-design/ui/themes/emerald.css"; /* optional accent preset */
@source "../node_modules/@perfect-design/ui/dist";  /* Tailwind must scan the component classes */
```

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useThemeStore } from '@perfect-design/ui'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
useThemeStore().init()   // applies dark class and accent, persists the choice
app.mount('#app')
```

## Use

```vue
<script setup lang="ts">
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Field } from '@perfect-design/ui'
</script>

<template>
  <Card>
    <CardHeader><CardTitle>Sign in</CardTitle></CardHeader>
    <CardContent class="space-y-4">
      <Field label="Email"><Input type="email" /></Field>
      <Button class="w-full">Continue</Button>
    </CardContent>
  </Card>
</template>
```

Every component is customised the same way: pass classes (tailwind-merge resolves conflicts),
override CSS custom properties, or switch the whole surface with a style pack
(`useThemeStore().setStyle('editorial')`).

## What is inside

- `theme.css` — tokens (colour, type, radius, spacing) and five accent presets under `themes/`
- six style packs under `packs/` — workbench, tactile, editorial, raw, contrast, terminal
- components across primitives, typography, layout, forms, feedback, overlays, navigation,
  data display (including charts) and marketing sections
- Pinia stores and composables for theme, motion and hotkeys
- a small Mermaid parser and renderer, no extra dependency

## Links

- [Getting started](https://perfect-design.raczylo.com/guides/getting-started)
- [Customisation contract](https://perfect-design.raczylo.com/guides/customisation)
- [Components](https://perfect-design.raczylo.com/components/)
- [Repository](https://github.com/lukaszraczylo/perfect-design)
