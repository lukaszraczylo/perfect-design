<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { faBell, faCheck, faGear, faHouse, faMagnifyingGlass, faTriangleExclamation, faUser } from '@fortawesome/free-solid-svg-icons'
import { AppHeader, Badge, Button, Card, CardContent, CardHeader, CardTitle, CodeThemePicker, CodeViewer, CornerPicker, Field, FontPicker, Icon, Input, PalettePicker, StyleScope, SurfacePicker, THEME_ACCENTS, THEME_STYLES, useThemeStore } from '@ui/index'
import type { ThemeMode, ThemeStyle } from '@ui/index'
import DocSection from '@/components/DocSection.vue'
import PageShell from '@/components/PageShell.vue'
import CodeSnippet from '@/components/CodeSnippet.vue'
import { ANIMATIONS, COLOR_GROUPS, RADII, SHADOWS, SPACING, TYPE_SCALE } from '@/lib/tokens'
import { FOUNDATION_TOPICS } from '@/router'

const route = useRoute()
const topic = computed(() => String(route.params.topic))
const meta = computed(() => FOUNDATION_TOPICS.find((t) => t.id === topic.value))
const theme = useThemeStore()
// The first render must match the prerendered HTML, so visitor-specific theme state shows after mount.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const shownMode = computed(() => (mounted.value ? theme.mode : 'system'))
const shownAccent = computed(() => (mounted.value ? theme.accent : 'default'))
const shownStyle = computed(() => (mounted.value ? theme.style : 'quiet'))
const shownResolved = computed(() => (mounted.value ? theme.resolved : 'light'))

const computedColors = ref<Record<string, string>>({})
function readColors() {
  const cs = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  for (const g of COLOR_GROUPS) for (const t of g.tokens) out[t.name] = cs.getPropertyValue(`--${t.name}`).trim()
  computedColors.value = out
}
onMounted(readColors)
watch([() => theme.resolved, () => theme.accent, topic], async () => { await nextTick(); readColors() })

const icons = [
  { icon: faHouse, name: 'faHouse' }, { icon: faUser, name: 'faUser' }, { icon: faGear, name: 'faGear' }, { icon: faBell, name: 'faBell' },
  { icon: faMagnifyingGlass, name: 'faMagnifyingGlass' }, { icon: faCheck, name: 'faCheck' }, { icon: faTriangleExclamation, name: 'faTriangleExclamation' },
]
const PACKS: { id: ThemeStyle; title: string; brief: string }[] = [
  { id: 'quiet', title: 'Quiet', brief: 'The core look. Most products.' },
  { id: 'workbench', title: 'Workbench', brief: 'Dense, hairlines, tabular figures. Tools used all day.' },
  { id: 'tactile', title: 'Tactile', brief: 'Raised surfaces, buttons that sink when pressed. Touch-first products.' },
  { id: 'editorial', title: 'Editorial', brief: 'Serif headings, square corners, wide measure. Reading-first sites.' },
  { id: 'raw', title: 'Raw', brief: 'Ink borders, hard offset shadows, no softening. Blunt, poster-like tools.' },
  { id: 'contrast', title: 'Contrast', brief: 'Text at 7:1, thick focus outline. Low vision, glare, public services.' },
  { id: 'terminal', title: 'Terminal', brief: 'Monospace and dense. Developer tools.' },
]
const STYLE_SNIPPET = `@import "@perfect-design/ui/packs.css";   /* or packs/workbench.css for one pack */
/* whole app: */
useThemeStore().setStyle('workbench')
/* one region: */
<StyleScope look="workbench">...</StyleScope>`
const shownPalette = computed(() => (mounted.value ? theme.palette : 'default'))
const shownCodeTheme = computed(() => (mounted.value ? theme.codeTheme : 'default'))
const PREVIEW_JSON = `{
  "name": "order-sync",
  "retries": 3,
  "regions": ["north", "south"],
  "dryRun": false
}`
const PALETTE_SNIPPET = `@import "@perfect-design/ui/palettes.css";
useThemeStore().setPalette('graphite')`
const CODE_THEME_SNIPPET = `@import "@perfect-design/ui/code-themes.css";
useThemeStore().setCodeTheme('midnight')`
const CORNER_SNIPPET = `@import "@perfect-design/ui/corners.css";
useThemeStore().setCorner('squircle')
<section data-corner="squircle">...</section>   /* one region */`
const SURFACE_SNIPPET = `@import "@perfect-design/ui/surfaces.css";
useThemeStore().setSurface('glass')
<section data-surface="glass">...</section>     /* one region */
[data-surface="glass"] { --glass-alpha: 0.9; --glass-blur: 12px; }`
const CORNER_REGIONS = [
  { id: 'round', title: 'Round' },
  { id: 'squircle', title: 'Squircle' },
] as const
const SURFACE_REGIONS = [
  { id: 'solid', title: 'Solid' },
  { id: 'glass', title: 'Glass' },
] as const
const SPECIMEN_TOKENS = ['primary', 'success', 'warning', 'info', 'destructive', 'foreground'] as const
const modes: ThemeMode[] = ['light', 'dark', 'system']
const replay = ref(0)
const ICON_SNIPPET = `import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@perfect-design/ui'

<Icon :icon="faCheck" size="lg" />            <!-- decorative: aria-hidden -->
<Icon :icon="faCheck" label="Saved" />        <!-- meaningful: role=img + aria-label -->`
const ACCENT_SNIPPET = `@import "@perfect-design/ui/themes/emerald.css";
/* then, at runtime: */
useThemeStore().setAccent('emerald')`

const lead: Record<string, string> = {
  colors: 'Semantic, oklch-based tokens. Components never use raw colours. They use these names, so dark mode and accent presets work everywhere.',
  typography: 'A compact, UI-first scale: 14px default text for dense apps and a 16px `text-md` for prose.',
  spacing: 'Tailwind’s 4px grid for spacing and a single `--radius` that derives every corner radius.',
  elevation: 'Five shadow levels whose colour follows the theme, so dark mode deepens shadows automatically.',
  motion: 'Short, snappy transitions with one easing curve; every animation collapses under prefers-reduced-motion.',
  iconography: 'Any FontAwesome-shaped icon data, rendered as inline SVG by the `Icon` component. No FontAwesome runtime is needed.',
  themes: 'Light, dark and system modes, seven accent presets (indigo, violet and lime are brand exceptions), five palettes and ten code themes, controlled by `useThemeStore`.',
  styles: 'Seven deliberate looks, each answering a brief: density, corners, depth and type change through tokens, so every component follows without new markup.',
  accessibility: 'Accessibility rules baked into the components and the contract each one follows.',
}
</script>

<template>
  <PageShell v-if="meta" :title="meta.title" :lead="lead[topic]" :key="topic">
    <template v-if="topic === 'colors'">
      <DocSection v-for="g in COLOR_GROUPS" :key="g.title" :title="g.title">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="t in g.tokens" :key="t.name" class="overflow-hidden rounded-lg border" data-testid="swatch">
            <div class="grid h-16 place-items-center text-sm font-medium" :style="{ background: `var(--${t.name})`, color: t.on ? `var(--${t.on})` : undefined }">{{ t.on ? 'Aa' : '' }}</div>
            <div class="space-y-0.5 p-3">
              <div class="font-mono text-sm">--{{ t.name }}</div>
              <div class="text-xs text-muted-foreground">{{ t.usage }}</div>
              <div class="truncate font-mono text-2xs text-muted-foreground">{{ computedColors[t.name] }}</div>
              <div class="font-mono text-2xs text-muted-foreground">bg-{{ t.name }} · text-{{ t.name }}</div>
            </div>
          </div>
        </div>
      </DocSection>
      <DocSection title="Rules">
        <ul class="list-disc space-y-1 pl-5 text-sm">
          <li>Pair every surface with its `-foreground` token for guaranteed contrast.</li>
          <li>Use opacity modifiers (<code>bg-primary/10</code>) for tints instead of new colours.</li>
          <li>Status colours carry meaning only together with text or an icon, never colour alone.</li>
        </ul>
      </DocSection>
    </template>

    <template v-else-if="topic === 'typography'">
      <DocSection title="Switch the font family" description="Applies to this whole site: the family sets data-font on the document element and is remembered in the browser. Every family is a platform font stack, so nothing downloads.">
        <FontPicker class="mb-4" />
        <div class="rounded-lg border p-4">
          <div class="text-2xl font-semibold">The quick brown fox jumps over the lazy dog</div>
          <p class="mt-2 text-md">Typography carries most of an interface. Numbers like 0123456789 and long words like internationalisation should still sit cleanly.</p>
        </div>
        <pre tabindex="0" role="region" aria-label="Font families import" class="mt-4 overflow-x-auto rounded-lg border bg-muted p-4 text-sm"><code>@import "@perfect-design/ui/fonts.css";
useThemeStore().setFont('serif')
[data-font="serif"] { --font-sans: "Source Serif 4", ui-serif, serif; }</code></pre>
      </DocSection>
      <DocSection title="Font families">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border p-4"><div class="font-sans text-2xl">IBM Plex Sans, interface and prose</div><code class="text-xs text-muted-foreground">font-sans</code></div>
          <div class="rounded-lg border p-4"><div class="font-mono text-2xl">IBM Plex Mono, code and data only</div><code class="text-xs text-muted-foreground">font-mono</code></div>
        </div>
      </DocSection>
      <DocSection title="Type scale">
        <div class="divide-y rounded-lg border">
          <div v-for="t in TYPE_SCALE" :key="t.name" class="flex items-baseline gap-4 px-4 py-3">
            <code class="w-16 shrink-0 text-xs text-muted-foreground">{{ t.cls }}</code>
            <span :class="t.cls" class="truncate">{{ t.sample }}</span>
          </div>
        </div>
      </DocSection>
      <DocSection title="Guidelines">
        <ul class="list-disc space-y-1 pl-5 text-sm"><li>One <code>h1</code> per page; visual size is independent of heading level (use <code>Heading</code> with <code>level</code> + <code>size</code>).</li><li>Line length for prose: 60–75 characters (<code>max-w-prose</code>).</li><li>Use <code>text-balance</code> on headlines and <code>text-pretty</code> on paragraphs.</li></ul>
      </DocSection>
    </template>

    <template v-else-if="topic === 'spacing'">
      <DocSection title="Spacing scale" description="Multiples of 4px. Prefer gap utilities over margins between siblings.">
        <div class="space-y-2"><div v-for="n in SPACING" :key="n" class="flex items-center gap-3"><code class="w-20 shrink-0 whitespace-nowrap text-xs text-muted-foreground">{{ n }} · {{ n * 4 }}px</code><div class="h-4 rounded-sm bg-primary/70" :style="{ width: `${n * 4}px` }" /></div></div>
      </DocSection>
      <DocSection title="Radius" description="Change --radius once to restyle every component.">
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-6"><div v-for="r in RADII" :key="r.name" class="space-y-2 text-center"><div class="mx-auto size-16 border-2 border-primary bg-primary/10" :class="r.cls" /><code class="text-xs text-muted-foreground">{{ r.cls }}</code></div></div>
      </DocSection>
      <DocSection title="Corner shape" description="Applies to this whole site: the shape sets data-corner on the document element and is remembered in the browser. Squircle uses CSS corner-shape for continuous corners and scales every radius up, because a squircle at the same radius looks smaller. Browsers without corner-shape keep plain rounded corners.">
        <CornerPicker class="mb-4" />
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="c in CORNER_REGIONS" :key="c.id" :data-corner="c.id" class="min-w-0 space-y-3 rounded-lg border p-4">
            <h3 class="text-md font-semibold">{{ c.title }}</h3>
            <div class="grid grid-cols-3 gap-3"><div v-for="r in RADII" :key="r.name" class="space-y-2 text-center"><div class="mx-auto size-14 border-2 border-primary bg-primary/10" :class="r.cls" /><code class="text-xs text-muted-foreground">{{ r.cls }}</code></div></div>
            <div class="flex flex-wrap items-center gap-2"><Button size="sm">Approve</Button><Button size="sm" variant="outline">Review</Button><Badge variant="success">Shipped</Badge><span class="size-8 rounded-full border-2 border-primary bg-primary/10" /><code class="text-xs text-muted-foreground">rounded-full stays round</code></div>
            <Input :aria-label="`Search, ${c.title} corners`" placeholder="Search orders" />
          </div>
        </div>
        <CodeSnippet :code="CORNER_SNIPPET" />
      </DocSection>
      <DocSection title="Touch targets"><p class="text-sm">On coarse pointers (touch) interactive controls grow to at least 44px using the <code>pointer-coarse:</code> variant.</p></DocSection>
    </template>

    <template v-else-if="topic === 'elevation'">
      <DocSection title="Shadows">
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-5"><div v-for="s in SHADOWS" :key="s.name" class="space-y-2 text-center"><div class="mx-auto grid h-20 w-full place-items-center rounded-lg border bg-card text-xs" :class="s.cls">{{ s.name }}</div><code class="text-xs text-muted-foreground">{{ s.cls }}</code></div></div>
      </DocSection>
      <DocSection title="Glass surface" description="Applies to this whole site: the surface sets data-surface on the document element and is remembered in the browser. Glass is an opt-in exception to the no-glass rule. It lets layers that float over content (menus, popovers, dialogs, toasts, sticky headers) show the content behind them, blurred. Cards stay opaque. It falls back to solid under reduced transparency, in forced colours and in the contrast style pack.">
        <SurfacePicker class="mb-4" />
        <div class="grid gap-4 lg:grid-cols-2">
          <div v-for="r in SURFACE_REGIONS" :key="r.id" :data-surface="r.id" class="min-w-0">
            <h3 class="mb-2 text-md font-semibold">{{ r.title }}</h3>
            <div tabindex="0" role="region" :aria-label="`${r.title} surface demo, scrollable`" class="h-72 overflow-y-auto rounded-lg border">
              <AppHeader sticky nav-label="Specimen sections">
                <template #brand><span class="text-sm font-semibold">Token specimen</span></template>
                <template #actions><Badge variant="outline">{{ r.title }}</Badge></template>
              </AppHeader>
              <div class="space-y-3 p-4">
                <div v-for="t in SPECIMEN_TOKENS" :key="t" class="grid h-20 place-items-center rounded-md text-sm font-medium" :style="{ background: `var(--${t})`, color: t === 'foreground' ? 'var(--background)' : `var(--${t}-foreground)` }">--{{ t }}</div>
              </div>
            </div>
          </div>
        </div>
        <p class="max-w-prose text-sm text-muted-foreground">Scroll each box: the sticky header sits over the colour swatches. The shipped opacity is the lowest value at which header text keeps 4.5:1 over a pure black or pure white backdrop in every theme, palette and mode. Tune it with --glass-alpha and --glass-blur on the scope.</p>
        <CodeSnippet :code="SURFACE_SNIPPET" />
      </DocSection>
      <DocSection title="Stacking order"><ul class="list-disc space-y-1 pl-5 text-sm"><li><code>--z-sticky</code> 40 · <code>--z-dropdown</code> 50 · <code>--z-overlay</code> 60 · <code>--z-modal</code> 70 · <code>--z-toast</code> 80</li><li>Never use arbitrary z-index values in components.</li></ul></DocSection>
    </template>

    <template v-else-if="topic === 'motion'">
      <DocSection title="Animations" description="Overlay primitives use these via data-[state=open]:animate-ds-*.">
        <div class="mb-3"><Button variant="outline" size="sm" @click="replay++">Replay</Button></div>
        <div :key="replay" class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4"><div v-for="a in ANIMATIONS" :key="a.name" class="overflow-hidden rounded-lg border p-4 text-center"><div class="mx-auto mb-2 grid size-12 place-items-center rounded-md bg-primary/15 text-primary" :class="a.cls" :style="a.name === 'ds-shimmer' ? { backgroundImage: 'linear-gradient(90deg, transparent, var(--primary), transparent)', backgroundSize: '200% 100%' } : undefined"></div><code class="text-xs text-muted-foreground">{{ a.cls }}</code></div></div>
      </DocSection>
      <DocSection title="Principles"><ul class="list-disc space-y-1 pl-5 text-sm"><li>150ms default; 220ms for large surfaces. Easing: <code>--ease-snap</code>.</li><li>Honour <code>prefers-reduced-motion</code>: the base layer already neutralises animation and transitions.</li></ul></DocSection>
    </template>

    <template v-else-if="topic === 'iconography'">
      <DocSection title="Icon component"><div class="flex flex-wrap gap-6"><div v-for="i in icons" :key="i.name" class="flex w-28 flex-col items-center gap-2 rounded-lg border p-4"><Icon :icon="i.icon" size="xl" /><code class="text-2xs text-muted-foreground">{{ i.name }}</code></div></div></DocSection>
      <DocSection title="Usage"><CodeSnippet :code="ICON_SNIPPET" /></DocSection>
      <DocSection title="Sizes"><div class="flex items-end gap-6"><div v-for="s in (['xs','sm','md','lg','xl'] as const)" :key="s" class="flex flex-col items-center gap-1"><Icon :icon="faCheck" :size="s" /><code class="text-xs text-muted-foreground">{{ s }}</code></div></div></DocSection>
    </template>

    <template v-else-if="topic === 'themes'">
      <DocSection title="Colour mode">
        <div class="flex gap-2"><Button v-for="m in modes" :key="m" size="sm" :variant="shownMode === m ? 'default' : 'outline'" class="capitalize" @click="theme.setMode(m)">{{ m }}</Button></div>
        <p class="text-sm text-muted-foreground">Resolved: {{ shownResolved }}</p>
      </DocSection>
      <DocSection title="Accent presets">
        <div class="flex flex-wrap gap-2"><Button v-for="a in THEME_ACCENTS" :key="a" size="sm" :variant="shownAccent === a ? 'default' : 'outline'" class="capitalize" @click="theme.setAccent(a)">{{ a }}</Button></div>
        <CodeSnippet :code="ACCENT_SNIPPET" />
      </DocSection>
      <DocSection title="Palettes" description="Whole-interface colour sets. Applies to this whole site and follows the light and dark toggle.">
        <PalettePicker class="mb-4" />
        <p class="max-w-prose text-sm text-muted-foreground">Palette: {{ shownPalette }}. Palettes adapt the GitHub, Ayu, Winter is Coming, Night Owl and Tokyo Night VS Code themes (all MIT-licensed). They follow the light and dark toggle, and choosing one replaces the accent preset because both set the primary colour.</p>
        <div class="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Order 4821</CardTitle></CardHeader>
            <CardContent class="space-y-4">
              <p class="text-sm text-muted-foreground">Sample text on the card surface. Status, action and field colours follow the palette.</p>
              <div class="flex flex-wrap items-center gap-2"><Button size="sm">Approve</Button><Button size="sm" variant="outline">Review</Button></div>
              <div class="flex flex-wrap items-center gap-2"><Badge variant="success">Shipped</Badge><Badge variant="warning">Delayed</Badge><Badge variant="destructive">Cancelled</Badge></div>
              <Field label="Customer name" hint="Sample field"><Input placeholder="Customer name" /></Field>
            </CardContent>
          </Card>
          <div class="min-w-0"><CodeViewer :source="PREVIEW_JSON" language="json" filename="palette-preview.json" /></div>
        </div>
        <CodeSnippet :code="PALETTE_SNIPPET" />
      </DocSection>
      <DocSection title="Code themes" description="Colours for code viewers and blocks. Follow palette uses the active palette; the others override it.">
        <CodeThemePicker class="mb-4" />
        <p class="text-sm text-muted-foreground">Code theme: {{ shownCodeTheme }}.</p>
        <div class="min-w-0"><CodeViewer :source="PREVIEW_JSON" language="json" filename="code-theme-preview.json" /></div>
        <CodeSnippet :code="CODE_THEME_SNIPPET" />
      </DocSection>
      <DocSection title="Create your own"><CodeSnippet :code="`:root[data-theme='brand'] { --primary: oklch(0.55 0.2 300); --ring: oklch(0.55 0.2 300); }\n:root[data-theme='brand'].dark { --primary: oklch(0.75 0.15 300); --ring: oklch(0.75 0.15 300); }`" /></DocSection>
    </template>

    <template v-else-if="topic === 'styles'">
      <DocSection title="Choose the look" description="Applies to this whole site: the pack sets data-style on the document element and is remembered in the browser.">
        <div role="group" aria-label="Style pack" class="flex flex-wrap gap-2"><Button v-for="p in PACKS" :key="p.id" size="sm" :variant="shownStyle === p.id ? 'default' : 'outline'" :aria-pressed="shownStyle === p.id" @click="theme.setStyle(p.id)">{{ p.title }}</Button></div>
        <CodeSnippet :code="STYLE_SNIPPET" />
      </DocSection>
      <DocSection title="Side by side" description="The same markup inside StyleScope with each pack. Only tokens differ.">
        <div class="grid gap-4 md:grid-cols-2">
          <StyleScope v-for="p in PACKS" :key="p.id" :look="p.id" class="rounded-lg border p-4">
            <h3 class="text-md font-semibold">{{ p.title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground">{{ p.brief }}</p>
            <Card class="mt-3"><CardHeader><CardTitle>Order 4821</CardTitle></CardHeader><CardContent class="space-y-3"><Input :aria-label="`Search, ${p.title} pack`" placeholder="Search orders" /><div class="flex flex-wrap items-center gap-2"><Button size="sm">Approve</Button><Button size="sm" variant="outline">Review</Button><Badge>Pending</Badge></div></CardContent></Card>
          </StyleScope>
        </div>
      </DocSection>
      <DocSection title="What a pack may change"><ul class="list-disc space-y-1 pl-5 text-sm"><li>Tokens only: spacing base, radius, shadows, text sizes, fonts, border and foreground colours.</li><li>A few rules on <code>data-slot</code> hooks for borders and press feedback.</li><li>Never: gradients, blur, glow, glass, hard-coded colours, or motion when the visitor asks for less.</li><li>Dense packs restore normal spacing on touch screens so targets stay 44px, and keep buttons, icon buttons and toggles at 24px or more everywhere.</li></ul></DocSection>
    </template>

    <template v-else-if="topic === 'accessibility'">
      <DocSection title="Built-in guarantees">
        <ul class="list-disc space-y-1 pl-5 text-sm">
          <li>Visible focus ring on every interactive element (<code>focus-visible:ring-3</code>).</li>
          <li>Touch targets ≥ 44px on coarse pointers.</li>
          <li>Roles, labels and keyboard behaviour provided by reka-ui primitives; ARIA state attributes (<code>aria-invalid</code>, <code>aria-busy</code>, <code>aria-current</code>, <code>aria-sort</code>) are set by the components.</li>
          <li>Colour is never the only signal; status components include text or icons.</li>
          <li>Reduced-motion safe animations; no focus traps without escape.</li>
        </ul>
      </DocSection>
      <DocSection title="Your responsibilities">
        <ul class="list-disc space-y-1 pl-5 text-sm"><li>Icon-only buttons need <code>aria-label</code> (or use <code>IconButton</code> which requires one).</li><li>Dialogs need a <code>DialogTitle</code>.</li><li>Form controls need a visible <code>Label</code> or <code>aria-label</code>: use <code>Field</code>.</li><li>Images need meaningful <code>alt</code>.</li></ul>
      </DocSection>
    </template>
  </PageShell>
</template>
