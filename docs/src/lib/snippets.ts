/** Code samples shown in the guides. Kept in a .ts file so the SFC dependency scanner never parses `import` lines inside strings. */
// Built from parts so the SFC compiler / dependency scanner never sees a literal script tag inside a string.
const OPEN = '<'
export const SNIPPETS = {
  // GitHub is the primary channel: each tag publishes a GitHub Release with the packed tarball attached.
  install: `pnpm add https://github.com/lukaszraczylo/perfect-design/releases/download/v0.1.3/perfect-design-ui-0.1.3.tgz
pnpm add pinia tailwindcss vue                  # peers the tarball does not bundle
pnpm add @fortawesome/free-solid-svg-icons      # optional: icon data you pass to <Icon>; no FontAwesome runtime needed`,
  installNpm: `pnpm add @perfect-design/ui                     # same build, from the npm registry (a mirror, when published)`,
  css: `/* src/style.css */
@import "tailwindcss";
@import "@perfect-design/ui/theme.css";
@import "@perfect-design/ui/themes/emerald.css"; /* optional accents */
@source "../node_modules/@perfect-design/ui/src";  /* so Tailwind scans component classes */`,
  main: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useThemeStore } from '@perfect-design/ui'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
useThemeStore().init()   // applies dark class + accent, persists choice
app.mount('#app')`,
  use: `${OPEN}script setup lang="ts">
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Field } from '@perfect-design/ui'
${OPEN}/script>

${OPEN}template>
  <Card>
    <CardHeader><CardTitle>Sign in</CardTitle></CardHeader>
    <CardContent class="space-y-4">
      <Field label="Email"><Input type="email" /></Field>
      <Button class="w-full">Continue</Button>
    </CardContent>
  </Card>
</template>`,
  override: `<!-- 1. class always wins (tailwind-merge) -->
<Button class="rounded-full bg-emerald-600 hover:bg-emerald-600/90">Pill</Button>

<!-- 2. reuse variants on any element -->
<a :class="buttonVariants({ variant: 'outline', size: 'sm' })" href="/docs">Docs</a>

<!-- 3. swap the element -->
<Button as-child><RouterLink to="/pricing">Pricing</RouterLink></Button>

<!-- 4. target parts from CSS -->
.my-app [data-slot="card-header"] { padding-block: 0.5rem }`,
  test: `import { mount } from '@vue/test-utils'
import { Button } from '@perfect-design/ui'

it('blocks clicks while loading', async () => {
  const w = mount(Button, { props: { loading: true } })
  await w.trigger('click')
  expect(w.emitted('click')).toBeUndefined()
})`,
  llmPrompt: `You are building UI with @perfect-design/ui (Vue 3, Tailwind 4, TypeScript).
Read /llms.txt first. Rules: import from '@perfect-design/ui'; use semantic tokens (bg-background, text-foreground,
bg-primary, border-border …) and never raw colours; one variant="default" Button per view; wrap form controls in <Field>;
override styling only with the class prop; icons are FontAwesome IconDefinitions passed to <Icon :icon="faX" />.`,
}

export const CONTRACT_SNIPPETS = {
  missing: `<Dialog v-model:open="open">
  <DialogContent>
    <p>No title here.</p>   <!-- ContractError: DialogContent requires a DialogTitle -->
  </DialogContent>
</Dialog>`,
  fixed: `<Dialog v-model:open="open">
  <DialogContent>
    <VisuallyHidden as-child><DialogTitle>Edit profile</DialogTitle></VisuallyHidden>
    <p>Visible content.</p>
  </DialogContent>
</Dialog>`,
  mode: `import { configureStrictMode } from '@perfect-design/ui'

configureStrictMode('throw') // default: throw a ContractError
configureStrictMode('warn')  // console.error the message, do not throw
configureStrictMode('off')   // do nothing (unit tests that mount partial trees)`,
  handler: `import { ContractError } from '@perfect-design/ui'

app.config.errorHandler = (err, instance, info) => {
  if (err instanceof ContractError) report(err.component, err.rule, err.message)
  else throw err
}`,
  test: `import { beforeEach, afterEach } from 'vitest'
import { configureStrictMode } from '@perfect-design/ui'

// In your own component tests: assert that mistakes are caught.
beforeEach(() => configureStrictMode('throw'))
afterEach(() => configureStrictMode('off'))`,
}
