import { faPlus } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

/** Offline sample scene for the example (flat panels, no text); `%23` is an encoded `#` so the data URI stays valid. */
const sampleScene = () =>
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360' preserveAspectRatio='xMidYMid slice'><rect width='640' height='360' fill='%23e4e4e7'/><circle cx='470' cy='110' r='42' fill='%23d4d4d8'/><path d='M0 300 170 150 300 260 410 180 640 330V360H0z' fill='%23d4d4d8'/><path d='M0 360 220 230 380 360z' fill='%23a1a1aa'/></svg>"

const doc: ComponentDoc = {
  name: 'PageHeader',
  group: 'layout',
  subgroup: 'Page structure',
  summary: 'Page title block with description, breadcrumb, back link, tabs, actions, centered / compact / hero variants and optional sticky mode.',
  description:
    'Put one `PageHeader` at the top of every page view. The title renders in an `h1` (change with `titleAs`), the description below it, a `breadcrumb` slot above, and `actions` on the right (stacked below on small screens). Set `sticky` to pin it to the top of the scroll container with an opaque background and bottom border. Variants: `default` (heading left, actions right), `centered` (everything centred, e.g. marketing and empty states; `align="center"` centres any variant), `compact` (tighter spacing and a smaller title for dense or nested pages) and `hero` (banner with a flat `background`: `muted`, `primary` or an `image` via `backgroundImage`, plus a `background` slot for custom art). Add a back link with `backHref` (or the `back` slot for a router link) and sub-navigation with the `tabs` slot. For app-wide top bars use the `header` slot of AppShell instead.',
  status: 'stable',
  props: [
    { name: 'title', type: 'string', description: 'Title text. Use the `title` slot for rich content.' },
    { name: 'description', type: 'string', description: 'Supporting text under the title. Use the `description` slot for rich content.' },
    { name: 'titleAs', type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p'", default: "'h1'", description: 'Element for the title. Keep h1 unless the page already has one.' },
    { name: 'variant', type: "'default' | 'centered' | 'compact' | 'hero'", default: "'default'", description: '`centered` centres everything; `compact` = gap-2, pb-2 and a text-lg title; `hero` = rounded bordered banner with larger padding and a text-3xl/4xl title. Unknown values fall back to default. Sets `data-variant` when not default.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: 'Centre the content for any variant (same as `variant="centered"`). Unknown values fall back to start.' },
    { name: 'background', type: "'muted' | 'primary' | 'image'", default: "'muted'", description: 'Hero only. `muted` = flat muted surface; `primary` = solid primary with primary-foreground text; `image` = `backgroundImage` under an overlay (falls back to muted without an image). Defaults to `image` when only `backgroundImage` is set. The former `gradient` value was removed and falls back to `muted`. Ignored by other variants.' },
    { name: 'backgroundImage', type: 'string', description: 'Hero only: image URL drawn behind the content (an `img` with empty alt, `object-cover`, under a bg-background/70 overlay so text stays readable).' },
    { name: 'backHref', type: 'string', description: 'Renders a back link (chevron + label) above the breadcrumb pointing here. Empty values render nothing; the `back` slot wins.' },
    { name: 'backLabel', type: 'string', default: "'Back'", description: 'Text of the back link.' },
    { name: 'sticky', type: 'boolean', default: 'false', description: 'sticky top-0 with z-sticky, an opaque bg-background, border-b and padding.' },
    { name: 'tabsLabel', type: 'string', default: "'Tabs'", description: 'Accessible name of the `tabs` row while it overflows and scrolls: then it is a focusable `region` with this name.' },
    { name: 'as', type: 'string | Component', default: "'header'", description: 'Root element.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'title', description: 'Overrides the `title` prop.' },
    { name: 'description', description: 'Overrides the `description` prop.' },
    { name: 'breadcrumb', description: 'Rendered above the title (e.g. a Breadcrumb).' },
    { name: 'actions', description: 'Right-aligned buttons (centred in centered mode); wraps under the heading below the sm breakpoint.' },
    { name: 'back', description: 'Custom back link (e.g. a RouterLink). Replaces the `backHref` link.' },
    { name: 'tabs', description: 'Sub-navigation (e.g. TabsList) rendered under the heading; scrolls horizontally when it overflows.' },
    { name: 'background', description: 'Hero only: custom background art, absolutely positioned behind the content (decorative; mark aria-hidden).' },
  ],
  examples: [
    {
      title: 'Title and description',
      code: `<PageHeader title-as="h4" title="Sample title" description="Sample description under the title." />`,
    },
    {
      title: 'With actions and breadcrumb',
      code: `<PageHeader title-as="h4" title="Sample list" description="Sample description">
  <template #breadcrumb><span>Section / Sample list</span></template>
  <template #actions>
    <Button variant="outline">Export</Button>
    <Button><Icon :icon="faPlus" /> New item</Button>
  </template>
</PageHeader>`,
      state: () => ({ faPlus }),
    },
    {
      title: 'Centered',
      description: '`variant="centered"` for empty states and single-purpose pages.',
      code: `<PageHeader variant="centered" title-as="h4" title="Sample title" description="Sample description centred under the title.">
  <template #actions><Button>Primary action</Button><Button variant="outline">Secondary action</Button></template>
</PageHeader>`,
    },
    {
      title: 'With tabs',
      description: 'Sub-navigation under the heading through the `tabs` slot. Wrap the page in `Tabs` so every trigger has its panel.',
      code: `<Tabs default-value="overview">
  <PageHeader title-as="h4" title="Sample project" description="Sample description">
    <template #actions><Button variant="outline">Share</Button></template>
    <template #tabs>
      <TabsList aria-label="Project sections">
        <TabsTrigger value="overview">First tab</TabsTrigger>
        <TabsTrigger value="activity">Second tab</TabsTrigger>
        <TabsTrigger value="settings">Third tab</TabsTrigger>
      </TabsList>
    </template>
  </PageHeader>
  <TabsContent value="overview" class="p-4 text-sm">First panel</TabsContent>
  <TabsContent value="activity" class="p-4 text-sm">Second panel</TabsContent>
  <TabsContent value="settings" class="p-4 text-sm">Third panel</TabsContent>
</Tabs>`,
    },
    {
      title: 'With back link',
      description: '`backHref` renders a link; use the `back` slot for a RouterLink.',
      code: `<div class="flex flex-col gap-6">
  <PageHeader back-href="/components/layout" back-label="All layout components" title-as="h4" title="Sample project" description="Sample description" />
  <PageHeader title-as="h4" title="Custom back">
    <template #back><a href="/components" class="text-sm text-muted-foreground underline">Back to the component list</a></template>
  </PageHeader>
</div>`,
    },
    {
      title: 'Compact',
      description: 'Tighter spacing and a smaller title for dense or nested pages.',
      code: `<PageHeader variant="compact" title="Sample members" description="Sample description" title-as="h4">
  <template #actions><Button size="sm">Add member</Button></template>
</PageHeader>`,
    },
    {
      title: 'Hero banner',
      description: '`variant="hero"` draws a banner on a flat muted surface.',
      code: `<PageHeader variant="hero" align="center" title-as="h4" title="Sample hero title" description="Sample description in the hero banner.">
  <template #actions><Button>Open the component list</Button></template>
</PageHeader>`,
    },
    {
      title: 'Hero with image or primary background',
      description: '`background-image` places an image under a readable overlay; `background="primary"` uses the solid primary token. The image is a generated sample scene.',
      script: 'const scene = sampleScene()',
      code: `<div class="flex flex-col gap-6">
  <PageHeader variant="hero" :background-image="scene" title-as="h4" title="Image banner" description="Text stays readable over the overlay." />
  <PageHeader variant="hero" background="primary" title-as="h4" title="Primary banner" description="Solid primary colour." />
</div>`,
      state: () => ({ scene: sampleScene() }),
    },
    {
      title: 'Sticky',
      code: `<div class="h-40 overflow-auto rounded-md border" tabindex="0" role="region" aria-label="Sticky header demo">
  <PageHeader sticky title-as="h4" title="Sticky header" description="Stays at the top while scrolling." />
  <div class="h-96 p-4 text-sm text-muted-foreground">Scroll this box</div>
</div>`,
    },
  ],
  a11y: ['Title is an h1 by default: one per page.', 'Root is a <header>; breadcrumb should be its own labelled <nav>.', 'Sticky mode keeps the header in the tab order position; it does not trap focus. The background is opaque so scrolled content never shows through the title.',
    'The `tabs` row is a focusable, labelled region (`tabsLabel`) only while it overflows horizontally, so it is never an empty Tab stop.',
    'Responsive: actions wrap under the heading below `sm`; the title uses `text-balance` and the heading block has `min-w-0`, so long titles wrap at 320px instead of overflowing.', 'The back link is a real <a> with visible focus ring; the chevron is aria-hidden. Hero background images have an empty alt and are aria-hidden: do not put information in them.', 'Give the tabs slot content its own accessible name (e.g. `aria-label` on TabsList).'],
  related: ['AppShell', 'Section', 'Button'],
  llmNotes: [
    'Use variant="hero" once per landing page; use compact for sub-pages and dense dashboards.',
    'Use backHref for simple links and the #back slot for router links; use the #tabs slot for page sub-navigation (Tabs/TabsList).',
    'Hero backgrounds are flat tokens: `muted`, `primary` or an image. There are no gradients.',
    'background and backgroundImage only apply to variant="hero"; backgroundImage is decorative (empty alt).',
    'Use exactly one PageHeader (with the h1) per page; set titleAs="h2" (or the next level down) for nested ones so the outline never skips a level.',
    'Put primary page actions in the `actions` slot; at most one `default` Button.',
    'The sticky mode sticks to the nearest scroll container.',
  ],
  replaces: ['hand-rolled PageHeader markup in app code'],
}
export default doc
