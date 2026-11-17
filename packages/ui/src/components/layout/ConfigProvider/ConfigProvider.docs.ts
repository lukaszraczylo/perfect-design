import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Neutral textless sample scene (docs only). */
const sampleImage = (n: number) => {
  const [bg, mid, fg] = [['#e4e4e7', '#d4d4d8', '#a1a1aa'], ['#e7e5e4', '#d6d3d1', '#a8a29e'], ['#e4e4e7', '#cfcfd4', '#8b8b94']][n % 3]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice"><rect width="640" height="480" fill="${bg}"/><circle cx="460" cy="140" r="58" fill="${mid}"/><path d="M0 400 170 200 300 340 410 240 640 440V480H0z" fill="${mid}"/><path d="M0 480 220 310 380 480z" fill="${fg}"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const doc: ComponentDoc = {
  name: 'ConfigProvider',
  group: 'layout',
  subgroup: 'Configuration',
  summary: 'Sets text direction, locale, time zone, motion override, default size and density, and translated built-in strings for everything inside it.',
  description:
    'Wrap an app or a region once instead of passing `locale`, `size` or translated labels to every component. `dir` and `locale` are set as `dir` and `lang` on the wrapper and passed to the headless primitives (menus, tabs, sliders), which read them even in portalled content. `labels` translates the strings a component ships with, keyed `<component>.<string>`: `pagination.nav|first|previous|next|last|page|summary`, `datePicker.placeholder|clear|required|dialog`, `confirmDialog.confirm|cancel|defaultTitle|error`, `fileDropzone.prompt|dragging|remove|added|addedMany|removed|typeNotAllowed|tooLarge|onlyOne|atMost|accepts|upTo|maxFiles`, `multiSelect.more|clearSelection|selectAll|clear|options`, `colorPicker.swatches|input|invalid`, `passwordInput.show|revealWarning`, `textarea.count|limit`, `combobox.clearSelection|toggleOptions|empty`, `modelPicker.clearSelection|toggleOptions|empty`. Pagination, DatePicker, ConfirmDialog, FileDropzone, MultiSelect, ColorPicker, PasswordInput, Textarea, Combobox and ModelPicker read them today. Placeholders such as `{count}`, `{name}`, `{size}`, `{max}` and `{types}` are replaced where a label uses them. Precedence per value is the component prop, then the nearest provider, then the English default, so a component with no provider behaves exactly as before. Providers nest: an inner provider overrides an outer one per key and `labels` merge per key. Invalid values (an unknown `dir`, a bad locale or time zone, a label that is not a non-blank string) are ignored, and labels are always rendered as text, never as HTML. Read the merged result in your own components with `useConfig()` (a computed with `dir`, `locale`, `timeZone`, `reducedMotion`, `size`, `density`, `labels`) and give them the same translation hook with `useConfigLabels(prefix, defaults)`. `reducedMotion` is an app-level override for code that asks; CSS `motion-reduce:` rules still follow the operating system. `dir` and `lang` are attributes of the wrapper, so portalled content (dialogs, popovers) does not inherit them from the DOM: use the same `dir` on `<html>` for those, or rely on the primitives that read it from the provider. `blurMedia` is the privacy switch: it blurs avatars and photos in the subtree, and each component\'s own `blurred` prop wins. Use `asChild` to render no extra element, or `class="contents"` to keep layout unchanged.',
  status: 'stable',
  props: [
    { name: 'dir', type: "'ltr' | 'rtl' | 'auto'", description: 'Text direction of the subtree. Unset keeps the surrounding direction; unknown values are ignored.' },
    { name: 'locale', type: 'string', description: 'BCP 47 tag such as `de-DE`, set as `lang`. DatePicker uses it as its default `locale`. Invalid tags are ignored.' },
    { name: 'timeZone', type: 'string', description: 'IANA time zone such as `Europe/Berlin`, for components that read `useConfig().timeZone`. Invalid names are ignored.' },
    { name: 'reducedMotion', type: "'user' | 'reduce' | 'no-preference'", default: "'user'", description: '`user` follows the operating system. The other two are exposed as `data-reduced-motion` and `useConfig().reducedMotion`; CSS media queries are not changed.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", description: 'Default size for Pagination and DatePicker when they have no `size` of their own. Sizes a component does not support fall back to its default. Set as `data-size`.' },
    { name: 'density', type: "'default' | 'compact' | 'comfortable'", description: 'Default density hint for components that read `useConfig().density`. Set as `data-density`.' },
    { name: 'labels', type: 'Record<string, string>', description: 'Translations of built-in strings keyed `<component>.<string>`. Merged per key with outer providers. Non-string, blank and unknown-key entries are ignored.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render no wrapper: attributes go onto the single child element.' },
    { name: 'blurMedia', type: 'boolean', description: 'Privacy blur for every avatar and photo in the subtree (Avatar, AvatarGroup, TeamGrid, ImageGrid, Lightbox, MediaFrame, BeforeAfter, and the images of BlogCard, Blockquote, Testimonial and ChatMessage). A component\'s own `blurred` prop wins, true or false. Unset keeps the surrounding value, then false. Exposed as `useConfig().blurMedia`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  slots: [{ name: 'default', description: 'Content that receives the configuration.' }],
  examples: [
    {
      title: 'Translate built-in strings',
      description: 'One provider translates every Pagination below it. A `labels` prop on a single component still wins.',
      script: `const page = ref(3)\nconst labels = { 'pagination.nav': 'Seitennavigation', 'pagination.first': 'Erste Seite', 'pagination.previous': 'Vorherige Seite', 'pagination.next': 'Nächste Seite', 'pagination.last': 'Letzte Seite', 'pagination.page': 'Seite', 'pagination.summary': 'Seite {page} von {total}' }`,
      code: `<ConfigProvider locale="de-DE" :labels="labels">
  <Pagination v-model:page="page" :total="120" :page-size="10" />
</ConfigProvider>`,
      state: () => ({
        page: ref(3),
        labels: {
          'pagination.nav': 'Seitennavigation',
          'pagination.first': 'Erste Seite',
          'pagination.previous': 'Vorherige Seite',
          'pagination.next': 'Nächste Seite',
          'pagination.last': 'Letzte Seite',
          'pagination.page': 'Seite',
          'pagination.summary': 'Seite {page} von {total}',
        },
      }),
    },
    {
      title: 'Locale for dates',
      description: 'DatePicker formats its value and calendar in the provider locale and takes its built-in strings from `datePicker.*`.',
      script: `const date = ref(new Date(2025, 2, 14))\nconst labels = { 'datePicker.clear': 'Datum entfernen', 'datePicker.dialog': 'Datum wählen', 'datePicker.placeholder': 'Datum wählen' }`,
      code: `<ConfigProvider locale="de-DE" :labels="labels">
  <div class="min-h-96 max-w-xs">
    <DatePicker v-model="date" clearable aria-label="Fälligkeitsdatum" />
  </div>
</ConfigProvider>`,
      state: () => ({
        date: ref(new Date(2025, 2, 14)),
        labels: { 'datePicker.clear': 'Datum entfernen', 'datePicker.dialog': 'Datum wählen', 'datePicker.placeholder': 'Datum wählen' },
      }),
    },
    {
      title: 'Translated confirmation',
      description: 'The button labels, the fallback title and the generic error message come from `confirmDialog.*`. A `confirm-label` prop on the dialog wins.',
      script: `const open = ref(false)\nconst labels = { 'confirmDialog.confirm': 'Löschen', 'confirmDialog.cancel': 'Abbrechen' }\nfunction remove() { /* delete it */ }`,
      code: `<ConfigProvider :labels="labels">
  <Button variant="destructive" @click="open = true">Projekt löschen</Button>
  <ConfirmDialog v-model:open="open" title="Projekt löschen?" description="Das Projekt und seine Daten werden entfernt." destructive @confirm="remove" />
</ConfigProvider>`,
      state: () => ({ open: ref(false), labels: { 'confirmDialog.confirm': 'Löschen', 'confirmDialog.cancel': 'Abbrechen' }, remove: () => {} }),
    },
    {
      title: 'Right-to-left region',
      description: 'The wrapper gets `dir` and `lang`; arrows and logical spacing follow the direction, and the headless primitives read it too.',
      script: `const page = ref(2)\nconst labels = { 'pagination.nav': 'ترقيم الصفحات', 'pagination.summary': 'صفحة {page} من {total}', 'pagination.page': 'صفحة' }`,
      code: `<ConfigProvider dir="rtl" locale="ar" :labels="labels" class="rounded-lg border p-4">
  <Pagination v-model:page="page" :total="60" :page-size="10" />
</ConfigProvider>`,
      state: () => ({ page: ref(2), labels: { 'pagination.nav': 'ترقيم الصفحات', 'pagination.summary': 'صفحة {page} من {total}', 'pagination.page': 'صفحة' } }),
    },
    {
      title: 'Nested providers',
      description: 'The inner provider changes `size` and one label; everything else comes from the outer one. The outer provider is unchanged.',
      script: `const outer = { 'pagination.nav': 'Seiten, außen', 'pagination.next': 'Weiter', 'pagination.previous': 'Zurück' }\nconst inner = { 'pagination.nav': 'Seiten, innen', 'pagination.next': 'Vor' }`,
      code: `<ConfigProvider size="lg" :labels="outer" class="space-y-3">
  <Pagination :total="40" :page-size="10" variant="compact" />
  <ConfigProvider size="sm" :labels="inner">
    <Pagination :total="40" :page-size="10" variant="compact" />
  </ConfigProvider>
</ConfigProvider>`,
      state: () => ({ outer: { 'pagination.nav': 'Seiten, außen', 'pagination.next': 'Weiter', 'pagination.previous': 'Zurück' }, inner: { 'pagination.nav': 'Seiten, innen', 'pagination.next': 'Vor' } }),
    },
    {
      title: 'Default size hint',
      description: 'Pagination and DatePicker use the provider `size` when they have none. A component with its own `size` keeps it.',
      code: `<ConfigProvider size="sm" class="space-y-3">
  <Pagination :total="50" :page-size="10" variant="compact" :labels="{ nav: 'Pages, provider size' }" />
  <Pagination :total="50" :page-size="10" variant="compact" size="lg" :labels="{ nav: 'Pages, own size' }" />
</ConfigProvider>`,
    },
    {
      title: 'No wrapper element',
      description: 'With `asChild` the attributes land on your own element, so the layout is untouched.',
      code: `<ConfigProvider as-child dir="ltr" locale="en-GB" reduced-motion="reduce">
  <section aria-label="Sample region" class="rounded-lg border p-4">
    <p class="text-sm">Language, direction and the motion override are set on this section.</p>
  </section>
</ConfigProvider>`,
    },
    {
      title: 'Blur media in a region',
      description: 'One switch blurs every avatar and photo below it, for screen sharing or a demo. The second avatar sets `blurred` false and stays sharp. Use it for privacy, not decoration.',
      script: `const blur = ref(false)`,
      code: `<ConfigProvider :blur-media="blur" class="space-y-4 rounded-lg border p-4">
  <Switch v-model="blur" label="Blur people and photos" />
  <AvatarGroup aria-label="Meeting participants">
    <Avatar name="Author One" />
    <Avatar name="Author Two" :blurred="false" />
    <Avatar name="Author Five" />
  </AvatarGroup>
  <ImageGrid :images="images" :columns="3" :lightbox="false" />
</ConfigProvider>`,
      state: () => ({ blur: ref(false), images: [0, 1, 2].map((n) => ({ src: sampleImage(n), alt: `Sample image ${n + 1}` })) }),
    },
  ],
  a11y: [
    '`blurMedia` is visual only: alt text, names and roles are unchanged and nothing is removed from the accessibility tree. The affected elements get `data-blurred`.',
    'Renders a plain element with no role or name; it does not change the accessibility tree except through `dir` and `lang`.',
    '`lang` lets screen readers pick the right voice and lets the browser hyphenate correctly; set `locale` on the part of the page that is in another language.',
    'Translated labels replace the accessible names of the navigation landmark, the page and arrow buttons, the clear button and the dialog. A blank label is ignored, so a name never disappears.',
    '`dir="rtl"` mirrors logical spacing and the arrow icons of Pagination; `dir="auto"` lets the browser decide from the content.',
    '`reducedMotion` does not change the operating-system preference: CSS rules that honour `prefers-reduced-motion` keep doing so.',
  ],
  related: ['StyleScope', 'Pagination', 'DatePicker', 'ConfirmDialog'],
  llmNotes: [
    '`blurMedia` is for privacy (screen sharing, demos, sensitive uploads), not decoration. A component prop `blurred` still wins.',
    'Put one ConfigProvider near the root for `dir`, `locale` and `labels`; nest another only where a region differs.',
    'Label keys are `<component>.<string>`: pagination.*, datePicker.*, confirmDialog.*. Unknown keys are harmless and ignored by the components.',
    'A prop on the component still beats the provider: use the prop for one-off text, the provider for the whole app.',
    'Never pass HTML in labels: they are plain text. Blank and non-string values are ignored.',
    'Read the config in your own component with `useConfig()` (a computed ref) and `useConfigLabels(prefix, defaults)`; it works without a provider and returns your defaults.',
    'Use `asChild` or `class="contents"` when the wrapper div would disturb a flex or grid layout.',
  ],
  replaces: ['per-component `locale`, `size` and label props repeated across an app', 'hand-rolled i18n context for built-in strings'],
}
export default doc
