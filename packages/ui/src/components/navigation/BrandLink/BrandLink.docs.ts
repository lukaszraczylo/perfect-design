import { defineComponent, h } from 'vue'
import { faLightbulb } from '../../../lib/icons'
import type { ComponentDoc } from '../../../docs-types'

/** Stands in for vue-router's RouterLink so the live example mounts without a router. */
const RouterLinkStub = defineComponent({
  props: { to: { type: String, required: true } },
  setup: (p, { slots }) => () => h('a', { href: p.to }, slots.default?.()),
})

const doc: ComponentDoc = {
  name: 'BrandLink',
  group: 'navigation',
  subgroup: 'Links',
  summary: 'Home link that shows a logo and the product name, for the header and footer brand slots.',
  description:
    'Renders an `<a href="/">` with a decorative logo and the product name. Put it in the `brand` slot of `AppHeader` and `SiteFooter`, or the `logo` slot of `SiteHeader`. Pass `icon` for a library icon, or fill the `logo` slot with an `<img>` or SVG. The name is required and is the only accessible name: the logo is hidden from assistive technology. The name sits in `<bdi>`, so a Latin brand keeps its order on a right-to-left page. For client-side routing pass `as` a RouterLink and `to`; the logo and name stay. `as-child` renders your single child instead and drops the logo and name, so prefer `as` here. Use `NavLink` for the other links in a navigation list.',
  status: 'stable',
  props: [
    { name: 'name', type: 'string', required: true, description: 'Product name. It is the accessible name of the link; a blank value throws a ContractError.' },
    { name: 'icon', type: 'IconDefinition', description: 'Logo icon, decorative and `text-primary`. The `logo` slot replaces it.' },
    { name: 'href', type: 'string', default: "'/'", description: 'Target when rendered as an anchor. Ignored when `as` is a component: pass `to` there.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Logo and name size: `sm` is a 20px logo with base text, `md` 24px with large text, `lg` 32px with extra large text. Unknown values fall back to `md`.' },
    { name: 'as', type: 'string | Component', default: "'a'", description: 'Element or component to render. Pass a RouterLink plus `to` for client-side routing.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child instead of an anchor. The child supplies its own content, so the logo and name are not rendered.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [{ name: 'logo', description: 'Replaces the `icon`: an `<img>` or SVG. It fills a square of the `size` and is hidden from assistive technology, so give an `<img>` an empty `alt`.' }],
  examples: [
    {
      title: 'Icon and name',
      code: `<div @click.prevent>
  <BrandLink name="Kestrel Freight" :icon="faLightbulb" />
</div>`,
      state: () => ({ faLightbulb }),
    },
    {
      title: 'In an AppHeader brand slot',
      code: `<div @click.prevent>
  <AppHeader nav-label="Sample main" class="rounded-lg border">
    <template #brand><BrandLink name="Orchard Mill" :icon="faLightbulb" /></template>
    <template #nav>
      <NavLink href="/components" variant="pill" active>Components</NavLink>
      <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
    </template>
    <template #mobile>
      <div class="flex flex-col gap-1">
        <NavLink href="/components" variant="pill" active>Components</NavLink>
        <NavLink href="/guides/getting-started" variant="pill">Guides</NavLink>
      </div>
    </template>
  </AppHeader>
</div>`,
      state: () => ({ faLightbulb }),
    },
    {
      title: 'Router link',
      description: 'Pass `as` a RouterLink and `to`. The logo and name stay inside the link. The live demo uses a stand-in for RouterLink.',
      script: `import { RouterLink } from 'vue-router'`,
      code: `<div @click.prevent>
  <BrandLink :as="RouterLink" to="/" name="Brightwater Co" :icon="faLightbulb" />
</div>`,
      state: () => ({ faLightbulb, RouterLink: RouterLinkStub }),
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap items-center gap-6" @click.prevent>
  <BrandLink v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size" :name="'Halden Optics ' + size" :icon="faLightbulb" />
</div>`,
      state: () => ({ faLightbulb }),
    },
    {
      title: 'Logo slot',
      description: 'An inline SVG replaces the icon. Use an `<img alt="">` the same way.',
      code: `<div @click.prevent>
  <BrandLink name="Quarry Row">
    <template #logo>
      <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="18" rx="1" /><rect x="13" y="9" width="8" height="12" rx="1" /></svg>
    </template>
  </BrandLink>
</div>`,
    },
  ],
  a11y: [
    'A plain link: Tab focuses it and Enter follows it. The accessible name is the visible product name, with no `aria-label` that could differ from it (WCAG 2.5.3).',
    'The logo is `aria-hidden`. A logo that carries meaning beyond the name does not belong in the `logo` slot.',
    'Focus is shown with the shared focus ring. The target is at least 24px high and 44px on coarse pointers.',
    'The name is wrapped in `<bdi>` and the layout uses logical properties, so the link mirrors in right-to-left and a Latin name stays intact.',
    'A long name truncates inside the link instead of overflowing, so the page reflows at 320px.',
  ],
  related: ['AppHeader', 'SiteHeader', 'SiteFooter', 'NavLink'],
  requires: ['Throws a ContractError when `name` is empty or blank.'],
  llmNotes: [
    'Use BrandLink for the logo and name home link in AppHeader `brand`, SiteHeader `logo` and SiteFooter `brand`; do not hand-roll an anchor.',
    'Always pass `name`; never add `aria-label`, the name is the label.',
    'For vue-router use `:as="RouterLink" to="/"`, not `as-child`: `as-child` drops the logo and name.',
    'Icons are FontAwesome IconDefinition objects. Use the `logo` slot for an image or SVG.',
  ],
  replaces: ['hand-rolled brand link markup in app code'],
}
export default doc
