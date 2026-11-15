import { faHouse } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Breadcrumb',
  group: 'navigation',
  subgroup: 'Wayfinding',
  summary: 'Shows the path to the current page. Items-array API or compound parts, with middle-item truncation.',
  description:
    'Pass `items` (the last item is the current page) for the common case, or compose `BreadcrumbList` / `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbSeparator` / `BreadcrumbPage` / `BreadcrumbEllipsis` for full control. `maxItems` collapses middle items behind an ellipsis button that expands on click. For client-side routing pass `link-as` a RouterLink (it receives `to`) or use `BreadcrumbLink as-child` in compound mode. Do not use for step flows (`Stepper`) or in-page sections (`TableOfContents`).',
  status: 'stable',
  parts: [
    { name: 'BreadcrumbList', description: '`<ol>` wrapper for items and separators.' },
    { name: 'BreadcrumbItem', description: '`<li>` wrapper for one link, page or ellipsis.' },
    {
      name: 'BreadcrumbLink',
      description: 'Link to an ancestor.',
      props: [
        { name: 'href', type: 'string', description: 'URL.' },
        { name: 'to', type: 'string | object', description: 'Router target, forwarded when `as` is a component.' },
        { name: 'as', type: 'string | Component', default: "'a'", description: 'Element or component.' },
        { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child.' },
      ],
    },
    { name: 'BreadcrumbSeparator', description: 'Decorative `<li role="presentation" aria-hidden>`; shows the glyph chosen with `separator` on `Breadcrumb` (chevron by default), accepts a slot.' },
    { name: 'BreadcrumbPage', description: 'Current page: `aria-current="page"`, not a link.' },
    { name: 'BreadcrumbEllipsis', description: 'Button standing in for hidden items.', props: [{ name: 'label', type: 'string', default: "'Show hidden items'", description: 'Accessible name.' }] },
  ],
  props: [
    { name: 'items', type: 'BreadcrumbItemData[]', description: 'Items `{ label, href?, to?, icon? }`. Last item renders as the current page. Malformed entries are skipped.' },
    { name: 'maxItems', type: 'number', default: '0', description: 'Collapse middle items when there are more than this many (first item + ellipsis + last maxItems-1). 0 disables; 1 is raised to 2.' },
    { name: 'linkAs', type: 'string | Component', description: 'Component/element for links, e.g. RouterLink (receives `to`).' },
    { name: 'label', type: 'string', default: "'Breadcrumb'", description: 'aria-label of the nav landmark.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and gap of the trail. Unknown values fall back to `md`.' },
    { name: 'separator', type: "'chevron' | 'slash' | 'dot'", default: "'chevron'", description: 'Glyph between entries. Compound `BreadcrumbSeparator` parts follow it too. The `separator` slot replaces it. Unknown values fall back to `chevron`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the nav.' },
  ],
  slots: [
    { name: 'default', description: 'Compound parts, used when `items` is empty.' },
    { name: 'separator', description: 'Replaces the chevron between items.' },
    { name: 'link', description: 'Custom link rendering per non-current item.', props: '{ item: BreadcrumbItemData, index: number }' },
  ],
  emits: [],
  examples: [
    {
      title: 'Items API',
      code: `<div @click.prevent>
  <Breadcrumb label="Items breadcrumb" :items="[
    { label: 'Home', href: '/', icon: faHouse },
    { label: 'Components', href: '/components' },
    { label: 'Breadcrumb' },
  ]" />
</div>`,
      state: () => ({ faHouse }),
    },
    {
      title: 'Truncated trail',
      code: `<div @click.prevent>
  <Breadcrumb label="Truncated breadcrumb" :max-items="4" :items="[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: 'Navigation', href: '/components/navigation' },
    { label: 'Level four', href: '/components/navigation' },
    { label: 'Level five', href: '/components/navigation' },
    { label: 'Breadcrumb' },
  ]" />
</div>`,
    },
    {
      title: 'Separators',
      description: 'Gallery of the three separators.',
      code: `<div class="grid gap-3" @click.prevent>
  <Breadcrumb v-for="kind in ['chevron', 'slash', 'dot']" :key="kind" :label="'Separator ' + kind" :separator="kind" :items="[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: kind },
  ]" />
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg`.',
      code: `<div class="grid gap-3" @click.prevent>
  <Breadcrumb v-for="size in ['sm', 'md', 'lg']" :key="size" :label="'Size ' + size" :size="size" separator="slash" :items="[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: 'Size ' + size },
  ]" />
</div>`,
    },
    {
      title: 'Compound parts',
      code: `<div @click.prevent>
  <Breadcrumb label="Compound breadcrumb">
    <BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbLink href="/components">Components</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</div>`,
    },
  ],
  a11y: [
    '`<nav aria-label="Breadcrumb">` containing an ordered list. Pass a distinct `label` when a page holds more than one trail.',
    '`size` and `separator` only change the look: the separators stay `aria-hidden` for every glyph, so a slash or dot is never read out, and the current page is still marked with aria-current.',
    'Current page has aria-current="page"; separators are aria-hidden and flip in RTL.',
    'The ellipsis is a real button whose label states how many items are hidden; it is 24px (40px on coarse pointers). Links show an underline on hover and sit on a wrapping list, so long trails reflow at 320px.',
  ],
  related: ['NavLink', 'Stepper', 'TableOfContents'],
  requires: [
    'Throws a ContractError when `label` is blank, because it names the nav landmark.',
    'Throws a ContractError when no `BreadcrumbPage` (the current page) is rendered; in `items` mode the last item is the current page, so an empty `items` throws too.',
    'Throws a ContractError when a `BreadcrumbLink` has no `href` or `to` (unless `as-child` or a non-anchor `as` is used).',
    'Throws a ContractError when a `BreadcrumbLink` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'The last entry of `items` is the current page and is not a link.',
    'For RouterLink use `link-as`, never onClick + router.push.',
    'Use `max-items` (not CSS) to handle long trails.',
  ],
  replaces: ['shadcn-vue Breadcrumb', 'hand-rolled Breadcrumb markup in app code'],
}
export default doc
