import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last (tailwind-merge) so it wins over internal classes.' }

const doc: ComponentDoc = {
  name: 'NavigationMenu',
  group: 'navigation',
  subgroup: 'Menus',
  summary: 'Site navigation bar with hover/click mega-menu panels, an optional shared viewport and an optional indicator.',
  description:
    'Compose `NavigationMenu` > `NavigationMenuList` > `NavigationMenuItem` and give each item either a `NavigationMenuTrigger` + `NavigationMenuContent` pair (a panel with links) or a bare `NavigationMenuLink` (`variant="trigger"`) for a top-level link. By default panels render in one shared `NavigationMenuViewport` that animates its size between panels (mega menu); set `viewport=false` to position each panel under its own trigger. Add `NavigationMenuIndicator` inside the list for an arrow that follows the active trigger. Use it for a site or app header with grouped links. Use `Menubar` / `DropdownMenu` for ACTIONS, `Tabs` for in-page panels and `SidebarNav` for persistent side navigation. Built on reka-ui `NavigationMenu*`.',
  props: [
    { name: 'asChild', type: 'boolean', description: 'Render the single slot child instead of a wrapper element.' },
    { name: 'modelValue', type: 'string', description: 'Value of the open item (v-model). Empty string = closed.' },
    { name: 'defaultValue', type: 'string', description: 'Item opened initially when uncontrolled.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout and arrow-key axis. Vertical stacks the list and opens panels to the side.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and text size of triggers and top-level (`variant="trigger"`) links: 32px, 36px or 44px. Rows inside panels keep their own spacing. Unknown values fall back to `md`.' },
    { name: 'viewport', type: 'boolean', default: 'true', description: 'Render the shared animated viewport. `false` positions each content under its trigger.' },
    { name: 'delayDuration', type: 'number', default: '200', description: 'Hover delay in ms before a panel opens.' },
    { name: 'skipDelayDuration', type: 'number', default: '300', description: 'Window in ms after closing during which hovering another trigger opens instantly.' },
    { name: 'disableClickTrigger', type: 'boolean', default: 'false', description: 'Triggers only open on hover.' },
    { name: 'disableHoverTrigger', type: 'boolean', default: 'false', description: 'Triggers only open on click.' },
    { name: 'disablePointerLeaveClose', type: 'boolean', default: 'false', description: 'Keep the panel open when the pointer leaves.' },
    { name: 'unmountOnHide', type: 'boolean', default: 'true', description: 'Unmount closed panels. `false` keeps them mounted (hidden).' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction.' },
    { name: 'as', type: 'string | Component', default: "'nav'", description: 'Root element.' },
    classProp,
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'The open item changed ("" when closed).' }],
  slots: [{ name: 'default', description: 'NavigationMenuList (and optionally a custom NavigationMenuViewport when `viewport=false`).', props: '{ modelValue: string }' }],
  parts: [
    { name: 'NavigationMenuList', description: 'The `ul` holding the items. Place `NavigationMenuIndicator` inside it.', props: [classProp] },
    {
      name: 'NavigationMenuItem',
      description: 'An `li`. Give items with panels a unique `value`.',
      props: [{ name: 'value', type: 'string', description: 'Item identity used by v-model. Auto-generated when omitted.' }, classProp],
    },
    {
      name: 'NavigationMenuTrigger',
      description: 'Button that opens its sibling NavigationMenuContent (aria-expanded, aria-controls). Shows a rotating chevron.',
      props: [
        { name: 'variant', type: "'default' | 'ghost' | 'outline'", default: "'default'", description: 'Visual style.' },
        { name: 'hideChevron', type: 'boolean', default: 'false', description: 'Hide the trailing chevron.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the trigger.' },
        classProp,
      ],
    },
    {
      name: 'NavigationMenuContent',
      description: 'The panel. Rendered into the viewport (or in place when `viewport=false`). Emits dismissal events.',
      props: [{ name: 'forceMount', type: 'boolean', default: 'false', description: 'Keep mounted while closed (animation libraries).' }, classProp],
    },
    {
      name: 'NavigationMenuLink',
      description: 'Link; renders `a`. Selecting it closes the menu (unless `select` is default-prevented). Use `as-child` with router links.',
      props: [
        { name: 'active', type: 'boolean', default: 'false', description: 'Current page: sets aria-current="page" and data-active.' },
        { name: 'variant', type: "'content' | 'card' | 'plain' | 'trigger'", default: "'content'", description: '`content`/`card`/`plain` for rows in a panel; `trigger` for a top-level link that looks like a trigger.' },
        { name: 'triggerVariant', type: "'default' | 'ghost' | 'outline'", default: "'default'", description: 'Look of `variant="trigger"` links.' },
        { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child element instead of `a`.' },
        classProp,
      ],
    },
    {
      name: 'NavigationMenuViewport',
      description: 'Shared animated surface for panels. Rendered automatically; only add it yourself when `viewport=false` and you want a custom one. `class` styles the viewport surface.',
      props: [{ name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Alignment CSS variables.' }, classProp],
    },
    { name: 'NavigationMenuIndicator', description: 'Arrow that slides under the active trigger. Decorative (aria-hidden).', props: [classProp] },
  ],
  examples: [
    {
      title: 'Mega menu',
      description: 'Panels share one animated viewport. Hover or click a trigger.',
      code: `<div @click.prevent>
  <NavigationMenu aria-label="Main">
    <NavigationMenuList>
      <NavigationMenuItem value="components">
        <NavigationMenuTrigger>Components</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-full gap-1 md:w-96 md:grid-cols-2">
            <li><NavigationMenuLink href="/components/data-display" variant="card"><span class="font-medium">Data display</span><span class="text-xs text-muted-foreground">Tables and charts</span></NavigationMenuLink></li>
            <li><NavigationMenuLink href="/components/forms" variant="card"><span class="font-medium">Forms</span><span class="text-xs text-muted-foreground">Inputs and pickers</span></NavigationMenuLink></li>
            <li><NavigationMenuLink href="/components/feedback" variant="card"><span class="font-medium">Feedback</span><span class="text-xs text-muted-foreground">Alerts and toasts</span></NavigationMenuLink></li>
            <li><NavigationMenuLink href="/components/navigation" variant="card" active><span class="font-medium">Navigation</span><span class="text-xs text-muted-foreground">Tabs, menus and paging</span></NavigationMenuLink></li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="guides">
        <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-56 gap-1">
            <li><NavigationMenuLink href="/guides/getting-started">Getting started</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/guides/customisation">Customisation</NavigationMenuLink></li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink href="/guides/llm" variant="trigger">LLM usage</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Without viewport and with indicator',
      description: '`viewport=false` places each panel under its trigger; the indicator follows the active trigger.',
      code: `<div @click.prevent>
  <NavigationMenu :viewport="false" aria-label="Compact">
    <NavigationMenuList>
      <NavigationMenuItem value="guides">
        <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-48 gap-1">
            <li><NavigationMenuLink href="/guides/getting-started">Getting started</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/guides/customisation">Customisation</NavigationMenuLink></li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="api">
        <NavigationMenuTrigger>API</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="grid w-48 gap-1">
            <li><NavigationMenuLink href="/guides/testing">Testing</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/guides/llm">LLM usage</NavigationMenuLink></li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuIndicator />
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Controlled (v-model)',
      script: `const open = ref('')`,
      state: () => ({ open: ref('') }),
      code: `<div class="flex flex-col gap-3" @click.prevent>
  <NavigationMenu v-model="open" aria-label="Controlled">
    <NavigationMenuList>
      <NavigationMenuItem value="one">
        <NavigationMenuTrigger>One</NavigationMenuTrigger>
        <NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">First panel</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="two">
        <NavigationMenuTrigger>Two</NavigationMenuTrigger>
        <NavigationMenuContent><NavigationMenuLink href="/guides/getting-started" class="w-40">Second panel</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
  <span class="text-sm text-muted-foreground">open = "{{ open }}"</span>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg` (panel-less links keep the same height as the triggers).',
      code: `<div class="flex flex-col items-start gap-3" @click.prevent>
  <NavigationMenu v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size" :viewport="false" :aria-label="'Size ' + size">
    <NavigationMenuList>
      <NavigationMenuItem :value="'panel-' + size"><NavigationMenuTrigger>Panel {{ size }}</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">Components</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink href="/guides/getting-started" variant="trigger">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Variant: trigger default',
      description: 'Subtle background that tints when open or active.',
      code: `<div @click.prevent>
  <NavigationMenu :viewport="false" aria-label="Default variant">
    <NavigationMenuList>
      <NavigationMenuItem value="a"><NavigationMenuTrigger variant="default">Default</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">Panel</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink href="/guides/getting-started" variant="trigger">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Variant: trigger ghost',
      description: 'Muted text, no background; good on busy headers.',
      code: `<div @click.prevent>
  <NavigationMenu :viewport="false" aria-label="Ghost variant">
    <NavigationMenuList>
      <NavigationMenuItem value="a"><NavigationMenuTrigger variant="ghost">Ghost</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">Panel</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink href="/guides/getting-started" variant="trigger" trigger-variant="ghost">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Variant: trigger outline',
      description: 'Bordered buttons.',
      code: `<div @click.prevent>
  <NavigationMenu :viewport="false" aria-label="Outline variant">
    <NavigationMenuList>
      <NavigationMenuItem value="a"><NavigationMenuTrigger variant="outline">Outline</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">Panel</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink href="/guides/getting-started" variant="trigger" trigger-variant="outline">Link</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
    {
      title: 'Vertical orientation',
      description: 'Stacked list, panels open to the side, ArrowRight enters a panel.',
      code: `<div @click.prevent>
  <NavigationMenu orientation="vertical" aria-label="Vertical" class="w-48">
    <NavigationMenuList class="w-full">
      <NavigationMenuItem value="a"><NavigationMenuTrigger class="w-full justify-between">Account</NavigationMenuTrigger><NavigationMenuContent><NavigationMenuLink href="/components" class="w-40">Profile</NavigationMenuLink></NavigationMenuContent></NavigationMenuItem>
      <NavigationMenuItem><NavigationMenuLink href="/guides/llm" variant="trigger" class="w-full justify-start">Help</NavigationMenuLink></NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</div>`,
    },
  ],
  a11y: [
    'Root is a `nav`: give it an aria-label when the page has several navigation landmarks.',
    'Trigger: aria-expanded and aria-controls; content is labelled by its trigger. Do not override the trigger `id` (reka wires aria-labelledby to its own id).',
    'Keyboard: Tab/Shift+Tab move through triggers and links; Enter/Space toggle a panel; Escape closes and returns focus to the trigger; ArrowLeft/Right (ArrowUp/Down when vertical) move between triggers; ArrowDown (ArrowRight when vertical) from an open trigger enters its panel; Home/End jump.',
    'The current page link has aria-current="page" via `active`. The indicator is aria-hidden.',
    '`size` only changes height, padding and text size (24px of text plus padding at `sm`, 44px at `lg`); roles, names and keyboard behaviour are the same for every size.',
    'Hover opening is a convenience; everything is also reachable by click and keyboard. Hit areas grow on coarse pointers. Animations are disabled under prefers-reduced-motion.',
    'The list wraps instead of overflowing at 320px, panels span the full width below `md`, and the viewport anchors to the start edge so it mirrors in RTL.',
  ],
  related: ['Menubar', 'DropdownMenu', 'Tabs', 'SidebarNav', 'AppHeader', 'Breadcrumb'],
  requires: [
    'Throws a ContractError when a `NavigationMenuItem` is not inside a `NavigationMenuList`.',
    'Throws a ContractError when a `NavigationMenuItem` has a `NavigationMenuTrigger` without a `NavigationMenuContent`, or the reverse.',
    'Throws a ContractError when an item with a trigger and content has no `value`, or two items share a `value`.',
    'Throws a ContractError when a `NavigationMenuTrigger` or a `NavigationMenuLink` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Always nest NavigationMenuList > NavigationMenuItem; give every item with a Trigger/Content pair a unique `value`.',
    'Top-level links without a panel are NavigationMenuLink variant="trigger" inside an Item, not a Trigger.',
    'Use `as-child` on NavigationMenuLink to wrap router links; set `active` on the current route.',
    'Panel rows use NavigationMenuLink (variant content | card | plain) so selecting one closes the menu.',
    'Use viewport=false for small menus; keep the default viewport for wide mega-menus.',
    'Do not set `id` on NavigationMenuTrigger. Add aria-label to the root.',
    'Use v-model (string value, "" = closed) to open panels programmatically.',
    'Reuse `navigationMenuTriggerStyle({ variant })` for plain anchors that must look like triggers.',
  ],
  replaces: ['shadcn-vue NavigationMenu'],
}
export default doc
