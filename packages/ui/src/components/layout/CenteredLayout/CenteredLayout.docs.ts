import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'CenteredLayout',
  group: 'layout',
  subgroup: 'Page structure',
  summary: 'Full-height page that centres a narrow column, for sign-in, empty and error pages.',
  description:
    'Use `CenteredLayout` for pages with a single focused task: login, sign-up, password reset, 404, onboarding. Fills the dynamic viewport height (`min-h-dvh`) and centres an inner column of `width` sm … 4xl. Slots: `logo`, `header` (title/subtitle), default content, `footer` (links), `illustration`. Layouts: `default` (plain centred column, for empty/error/onboarding pages), `card` (the column becomes a bordered card on a muted page, the classic auth card), `split` (form on one side and an `illustration` panel on the other from `lg`, hidden on mobile; `illustrationPosition` picks the side). Use `width="xl"`/`"2xl"`/`"4xl"` for wide pages such as multi-step onboarding. Not for dashboards (use AppShell).',
  status: 'stable',
  props: [
    { name: 'width', type: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'", default: "'md'", description: 'Inner column max width (max-w-sm … max-w-4xl). Unknown values fall back to md.' },
    { name: 'layout', type: "'default' | 'card' | 'split'", default: "'default'", description: '`card` wraps the column in a card surface on a muted page; `split` adds an illustration panel (needs the `illustration` slot, otherwise it renders like default). Unknown values fall back to default. Sets `data-layout` when not default.' },
    { name: 'illustrationPosition', type: "'start' | 'end'", default: "'end'", description: 'Split layout: side of the illustration panel from `lg` up (start = left in LTR). Unknown values fall back to end.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element, e.g. `main`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'logo', description: 'Centred brand mark above the header.' },
    { name: 'header', description: 'Centred title/subtitle block.' },
    { name: 'default', description: 'Main content (form, empty-state, message).' },
    { name: 'footer', description: 'Muted, centred footer text/links.' },
    { name: 'illustration', description: 'Split layout only: decorative or marketing panel next to the form; hidden below `lg`. Mark purely decorative content aria-hidden.' },
  ],
  examples: [
    {
      title: 'Sign-in page',
      code: `<div class="h-96 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Sign-in page demo">
  <CenteredLayout width="sm" class="min-h-full">
    <template #logo><Badge>Sample logo</Badge></template>
    <template #header><h4 class="text-xl font-semibold">Sample sign-in</h4><p class="text-sm text-muted-foreground">Sample subtitle.</p></template>
    <VStack :gap="3">
      <Input type="email" placeholder="Email" aria-label="Email" />
      <Button>Continue</Button>
    </VStack>
    <template #footer>Sample footer text.</template>
  </CenteredLayout>
</div>`,
    },
    {
      title: 'Auth card',
      description: '`layout="card"` puts the column on a card over a muted page.',
      code: `<div class="h-96 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Auth card demo">
  <CenteredLayout layout="card" width="sm" class="min-h-full">
    <template #header><h4 class="text-xl font-semibold">Sample sign-up</h4><p class="text-sm text-muted-foreground">Sample subtitle.</p></template>
    <VStack :gap="3">
      <Input type="email" placeholder="Email" aria-label="Email" />
      <Button>Create sample account</Button>
    </VStack>
    <template #footer>Sample footer text.</template>
  </CenteredLayout>
</div>`,
    },
    {
      title: 'Side illustration',
      description: '`layout="split"` shows the illustration panel from `lg`; `illustration-position="start"` moves it to the left.',
      code: `<div class="h-96 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Split layout demo">
  <CenteredLayout layout="split" width="sm" class="min-h-full">
    <template #header><h4 class="text-xl font-semibold">Sample split page</h4></template>
    <VStack :gap="3">
      <Input type="email" placeholder="Email" aria-label="Email" />
      <Button>Sign in</Button>
    </VStack>
    <template #illustration><div aria-hidden="true" class="p-8 text-center text-lg font-medium">Sample illustration</div></template>
  </CenteredLayout>
</div>`,
    },
    {
      title: 'Wide page',
      description: '`width` up to `4xl` for onboarding or pricing-style pages.',
      code: `<div class="h-64 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Wide page demo">
  <CenteredLayout width="4xl" class="min-h-full">
    <template #header><h4 class="text-xl font-semibold">Sample wide page</h4></template>
    <Grid :cols="1" :md="3" :gap="3">
      <div v-for="n in 3" :key="n" class="rounded-md border p-4 text-sm">Sample card {{ n }}</div>
    </Grid>
  </CenteredLayout>
</div>`,
    },
    {
      title: 'Wide empty page',
      code: `<div class="h-64 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Empty page demo">
  <CenteredLayout width="lg" class="min-h-full">
    <template #header><h4 class="text-xl font-semibold">Sample empty page</h4></template>
    <Button variant="outline">Create a sample item</Button>
  </CenteredLayout>
</div>`,
    },
  ],
  a11y: [
    'On a real page use `as="main"` so the page has a main landmark. The live examples keep the default `div` because the docs page already has a `main` (a page must not have two).',
    'Put the page heading (h1) in the `header` slot; in examples, use the heading level that follows the surrounding section so the outline does not skip levels.',
    'The illustration panel is hidden below `lg` (`display: none`), so it is removed from the accessibility tree there; never put essential content in it.',
    'Responsive: the column is `w-full` with a `max-w-*` cap and the page pads 16px (24px from `sm`), so it reflows at 320px without horizontal scroll. `min-h-dvh` follows the mobile browser UI.',
  ],
  related: ['AppShell', 'Container', 'Stack'],
  requires: [
    'Throws a ContractError when `layout="split"` is used without an `illustration` slot.',
  ],
  llmNotes: [
    'Use layout="card" for sign-in/sign-up forms and layout="split" + #illustration for branded auth pages; plain default for empty/error pages.',
    'The illustration slot only renders with layout="split" and is hidden below lg, so never put essential content in it.',
    'Use for auth and empty pages; it already provides min-h-dvh, padding and background.',
    'Put the form/content in the default slot; logo/header/footer are optional wrappers.',
  ],
  replaces: ['hand-rolled CenteredLayout markup in app code'],
}
export default doc
