import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Tabs',
  group: 'navigation',
  subgroup: 'Tabs & disclosure',
  summary: 'Switch between related panels of content without leaving the page. Compound component built on reka-ui.',
  description:
    'Compose `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`. The `variant` (`line` underline, `pill` muted track, `segmented` bordered track with a solid active segment, or `enclosed` boxed tabs), `size`, `fullWidth` and `orientation` are set once on `Tabs`. Control with `v-model` or leave uncontrolled with `defaultValue`. Every `TabsTrigger` `value` must match exactly one `TabsContent` `value`. Use `Tabs` for peer views of the same object; use `Stepper` for a sequence and `NavLink`/`SidebarNav` for page navigation (tabs do not change the URL).',
  status: 'stable',
  parts: [
    { name: 'TabsList', description: 'The `role="tablist"` row (or column when vertical). Give it an `aria-label`.', props: [{ name: 'loop', type: 'boolean', default: 'true', description: 'Arrow keys wrap from last to first.' }, { name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    {
      name: 'TabsTrigger',
      description: 'A tab button. Styled by the variant set on `Tabs`.',
      props: [
        { name: 'value', type: 'string | number', required: true, description: 'Identifier shared with the matching TabsContent.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents activation and skips it in keyboard navigation.' },
        { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child instead of a button.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'TabsContent',
      description: 'Panel shown when its tab is active (`role="tabpanel"`, labelled by the trigger).',
      props: [
        { name: 'value', type: 'string | number', required: true, description: 'Matches a TabsTrigger value.' },
        { name: 'forceMount', type: 'boolean', default: 'false', description: 'Keep mounted while inactive (hidden) to preserve state.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
  ],
  props: [
    { name: 'modelValue', type: 'string | number', description: 'Controlled active tab (v-model).' },
    { name: 'defaultValue', type: 'string | number', description: 'Initial active tab when uncontrolled.' },
    { name: 'variant', type: "'line' | 'pill' | 'segmented' | 'enclosed'", default: "'line'", description: 'Visual style. `line` underlines the active tab, `pill` raises it on a muted track, `segmented` fills it on a bordered track, `enclosed` boxes every tab. Unknown values fall back to `line`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and padding of the triggers. Unknown values fall back to `md`.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch a horizontal list across the container so the triggers share the width. Has no effect on vertical tabs.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout and arrow-key axis.' },
    { name: 'activationMode', type: "'automatic' | 'manual'", default: "'automatic'", description: 'Activate on focus or only on Enter/Space/click.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Root element.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single child as the root.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [{ name: 'default', description: 'TabsList and TabsContent parts.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string | number]', description: 'Active tab changed.' }],
  examples: [
    {
      title: 'Basic (line)',
      code: `<Tabs default-value="account" class="w-full max-w-md">
  <TabsList aria-label="Settings sections">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="billing" disabled>Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Manage your profile and preferences.</TabsContent>
  <TabsContent value="security">Password and two-factor settings.</TabsContent>
  <TabsContent value="billing">Billing is unavailable.</TabsContent>
</Tabs>`,
    },
    {
      title: 'Pill variant with v-model',
      script: `const tab = ref('overview')`,
      code: `<div class="space-y-3">
  <Tabs v-model="tab" variant="pill" class="w-full max-w-md">
    <TabsList aria-label="Report views">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="activity">Activity</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">Totals for the selected period.</TabsContent>
    <TabsContent value="activity">Latest events.</TabsContent>
  </Tabs>
  <p class="text-sm text-muted-foreground">Active: {{ tab }}</p>
</div>`,
      state: () => ({ tab: ref('overview') }),
    },
    {
      title: 'Variants',
      description: 'Gallery of the four variants side by side.',
      code: `<div class="grid w-full max-w-md gap-6">
  <Tabs default-value="a" variant="line">
    <TabsList aria-label="Line variant"><TabsTrigger value="a">Line</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger></TabsList>
    <TabsContent value="a">Underlined active tab.</TabsContent><TabsContent value="b">Second panel.</TabsContent>
  </Tabs>
  <Tabs default-value="a" variant="pill">
    <TabsList aria-label="Pill variant"><TabsTrigger value="a">Pill</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger></TabsList>
    <TabsContent value="a">Raised active tab on a muted track.</TabsContent><TabsContent value="b">Second panel.</TabsContent>
  </Tabs>
  <Tabs default-value="a" variant="segmented">
    <TabsList aria-label="Segmented variant"><TabsTrigger value="a">Segmented</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger></TabsList>
    <TabsContent value="a">Solid active segment in a bordered track.</TabsContent><TabsContent value="b">Second panel.</TabsContent>
  </Tabs>
  <Tabs default-value="a" variant="enclosed">
    <TabsList aria-label="Enclosed variant"><TabsTrigger value="a">Enclosed</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger></TabsList>
    <TabsContent value="a">Boxed tabs; the active one matches the panel.</TabsContent><TabsContent value="b">Second panel.</TabsContent>
  </Tabs>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'The same pill tabs at `sm`, `md` and `lg`.',
      code: `<div class="grid gap-4">
  <Tabs v-for="size in ['sm', 'md', 'lg']" :key="size" default-value="a" variant="pill" :size="size">
    <TabsList :aria-label="'Size ' + size"><TabsTrigger value="a">Size {{ size }}</TabsTrigger><TabsTrigger value="b">Second</TabsTrigger></TabsList>
    <TabsContent value="a" class="sr-only">First panel.</TabsContent><TabsContent value="b" class="sr-only">Second panel.</TabsContent>
  </Tabs>
</div>`,
    },
    {
      title: 'Full width segmented',
      code: `<Tabs default-value="day" variant="segmented" full-width class="w-full max-w-md">
  <TabsList aria-label="Range">
    <TabsTrigger value="day">Day</TabsTrigger>
    <TabsTrigger value="week">Week</TabsTrigger>
    <TabsTrigger value="month">Month</TabsTrigger>
  </TabsList>
  <TabsContent value="day">Today.</TabsContent>
  <TabsContent value="week">This week.</TabsContent>
  <TabsContent value="month">This month.</TabsContent>
</Tabs>`,
    },
    {
      title: 'Vertical enclosed',
      code: `<Tabs default-value="general" orientation="vertical" variant="enclosed" class="w-full max-w-lg">
  <TabsList aria-label="Enclosed preferences">
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="general" class="px-4">General preferences.</TabsContent>
  <TabsContent value="notifications" class="px-4">Notification channels.</TabsContent>
</Tabs>`,
    },
    {
      title: 'Vertical',
      code: `<Tabs default-value="general" orientation="vertical" class="w-full max-w-lg">
  <TabsList aria-label="Preferences">
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="general" class="px-4">General preferences.</TabsContent>
  <TabsContent value="notifications" class="px-4">Notification channels.</TabsContent>
</Tabs>`,
    },
  ],
  a11y: [
    'Roles tablist / tab / tabpanel with aria-selected and aria-controls wired by reka-ui.',
    'Arrow keys move between tabs (Left/Right, or Up/Down when vertical), Home/End jump; disabled tabs are skipped.',
    'Give TabsList an aria-label when the purpose is not obvious from context.',
    'Only the active tab is a tab stop; Tab then moves into the panel, which is focusable. `activationMode="manual"` activates on Enter/Space instead of on arrow focus.',
    'The list scrolls horizontally inside its own container when the tabs do not fit (320px, 200% zoom), so the page never scrolls sideways. Triggers do not shrink or wrap.',
    'The active tab is marked by a border, a filled surface or a solid fill plus `data-state` (never colour alone); in forced-colors mode it is also underlined. Triggers are at least 24px high even at `sm`, 32px at `md` and 44px on coarse pointers.',
    '`fullWidth` only changes the layout: roles, names and keyboard behaviour are identical for every variant, size and orientation.',
    'Vertical tabs use logical borders (`border-e`), so they mirror in RTL. Colour transitions run only under `motion-safe`.',
  ],
  related: ['Accordion', 'Stepper', 'NavLink'],
  requires: [
    'Throws a ContractError when `TabsList` has no accessible name (`aria-label` or `aria-labelledby`).',
    'Throws a ContractError when a `TabsTrigger` value has no `TabsContent` with the same value, when a `TabsContent` value has no `TabsTrigger`, or when a value is used twice.',
    'Throws a ContractError when `Tabs` holds no `TabsTrigger`, or a trigger or content has a blank `value`.',
    'Throws a ContractError when a `TabsTrigger` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Every TabsTrigger value needs a TabsContent with the same value.',
    'Set variant/orientation on Tabs, never on TabsList or TabsTrigger.',
    'Give TabsList an aria-label.',
    'Do not use Tabs for page routing; use NavLink so the URL changes.',
  ],
  replaces: ['shadcn-vue Tabs', 'hand-rolled Tabs markup in app code'],
}
export default doc
