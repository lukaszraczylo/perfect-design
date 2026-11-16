import { ref } from 'vue'
import { faPlus, faArrowRight, faDownload } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Button',
  group: 'primitives',
  subgroup: 'Buttons',
  summary: 'Triggers an action or navigation. The single button used everywhere in the system.',
  description:
    'Use `Button` for any clickable action. Variations:\n\n- `variant`: emphasis. `default` is the primary action (at most one per view); `secondary` and `outline` for supporting actions; `soft` is a low-emphasis tinted primary (toolbars, inline "Add" actions, cards); `ghost` for dense toolbars; `link` for inline text actions; `destructive` / `success` for irreversible / confirming actions.\n- `size`: density (`xs` ... `lg`); `icon*` sizes are square for icon-only buttons (ALWAYS set `aria-label`).\n- `rounded`: `default` (rounded-md), `full` (pill, or a circle with `icon*` sizes), `none`.\n- `block`: full-width button for forms, cards and mobile layouts.\n- `iconStart` / `iconEnd` (or the `icon-start` / `icon-end` slots): icon placement around the label; while `loading` the spinner replaces the start icon.\n\nTo make a link look like a button use `as="a"` or `as-child` with a RouterLink.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success' | 'soft'", default: "'default'", description: 'Visual emphasis. `soft` is a tinted low-emphasis primary. Unknown values fall back to default.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'", default: "'md'", description: 'Height/padding. `icon*` sizes are square. Unknown values fall back to md.' },
    { name: 'rounded', type: "'default' | 'full' | 'none'", default: "'default'", description: 'Corner radius: rounded-md, rounded-full (pill / circle for icon sizes) or none. Unknown values fall back to default.' },
    { name: 'block', type: 'boolean', default: 'false', description: 'Adds `w-full` so the button fills its container.' },
    { name: 'iconStart', type: 'IconDefinition', description: 'Icon before the label (decorative, aria-hidden). Replaced by the spinner while `loading`. Ignored with `asChild`.' },
    { name: 'iconEnd', type: 'IconDefinition', description: 'Icon after the label (decorative, aria-hidden). Ignored with `asChild`.' },
    { name: 'as', type: 'string | Component', default: "'button'", description: 'Element to render. Non-button elements get aria-disabled instead of disabled.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type. Defaults to button so it never submits forms by accident.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows a decorative spinner, sets aria-busy, blocks clicks, keeps width. The label stays in the accessible name.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Label and/or icons.' },
    { name: 'icon-start', description: 'Custom content before the label; overrides `iconStart`. Hidden while `loading`.' },
    { name: 'icon-end', description: 'Custom content after the label; overrides `iconEnd`.' },
  ],
  examples: [
    {
      title: 'Variants',
      code: `<div class="flex flex-wrap gap-2">
  <Button>Default</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="link">Link</Button>
  <Button variant="destructive">Delete</Button>
  <Button variant="success">Approve</Button>
  <Button variant="soft">Soft</Button>
</div>`,
    },
    {
      title: 'Soft variant',
      description: 'Low-emphasis tinted primary, good next to a `default` button or inside cards and toolbars.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Button variant="soft">Add item</Button>
  <Button variant="soft" size="sm" :icon-start="faPlus">Add another item</Button>
  <Button variant="soft" disabled>Disabled</Button>
</div>`,
      state: () => ({ faPlus }),
    },
    {
      title: 'Sizes and icons',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Button size="xs">XS</Button>
  <Button size="sm">SM</Button>
  <Button>MD</Button>
  <Button size="lg">LG</Button>
  <Button size="icon" aria-label="Add"><Icon :icon="faPlus" /></Button>
</div>`,
      state: () => ({ faPlus }),
    },
    {
      title: 'Rounded (pill)',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Button rounded="default">Default</Button>
  <Button rounded="full">Pill</Button>
  <Button rounded="full" variant="outline">Pill outline</Button>
  <Button rounded="none" variant="secondary">Square</Button>
  <Button rounded="full" size="icon" aria-label="Add"><Icon :icon="faPlus" /></Button>
</div>`,
      state: () => ({ faPlus }),
    },
    {
      title: 'Block (full width)',
      code: `<div class="flex w-full max-w-64 flex-col gap-2">
  <Button block>Continue</Button>
  <Button block variant="outline">Cancel</Button>
</div>`,
    },
    {
      title: 'Icon placement',
      description: 'Pass an icon definition with `iconStart` / `iconEnd`, or use the `icon-start` / `icon-end` slots for custom content.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Button :icon-start="faPlus">New item</Button>
  <Button variant="outline" :icon-end="faArrowRight">Next</Button>
  <Button variant="secondary" :icon-start="faDownload" :icon-end="faArrowRight">Both</Button>
  <Button variant="soft">
    <template #icon-start><Icon :icon="faPlus" size="sm" /></template>
    Slot icon
  </Button>
</div>`,
      state: () => ({ faPlus, faArrowRight, faDownload }),
    },
    {
      title: 'Loading',
      script: `const saving = ref(false)\nfunction save() { saving.value = true; setTimeout(() => (saving.value = false), 1500) }`,
      code: `<Button :loading="saving" :icon-start="faPlus" @click="save">Save changes</Button>`,
      state: () => {
        const saving = ref(false)
        return { faPlus, saving, save: () => { saving.value = true; setTimeout(() => (saving.value = false), 1500) } }
      },
    },
  ],
  a11y: ['Native <button> semantics; Space/Enter activate.', 'Icon-only buttons need aria-label.', 'Icons from `iconStart` / `iconEnd` are decorative (aria-hidden); the label carries the meaning.', 'loading sets aria-busy and shows an indeterminate progressbar named "Loading" (so the accessible name becomes "Loading Save"); non-button elements use aria-disabled.', 'Target size: `xs` and `icon-xs` are 24px, `sm` 32px, `md` 36px, `lg` 44px; on coarse pointers `sm`, `md` and the icon sizes grow to 40px or 44px.', 'Focus uses the shared ring (`focus-visible:ring-3`) plus a transparent outline, so it is visible in forced-colors mode. Labels are `whitespace-nowrap`: keep them short or wrap the button group (`flex-wrap`) so it reflows at 320px.'],
  related: ['IconButton', 'Link'],
  requires: [
    'Throws a ContractError when a Button with `size` `icon`, `icon-xs`, `icon-sm` or `icon-lg` has no accessible name (no visible text, `aria-label` or `aria-labelledby`). Use IconButton for icon-only actions.',
  ],
  llmNotes: ['One `default` variant button per view; use `soft` for secondary tinted actions.',
    'Use `rounded="full"` for pills and circular icon buttons; use `block` instead of `class="w-full"`.',
    'Use `iconStart` / `iconEnd` for icons next to a label instead of putting an <Icon> in the default slot; icon-only buttons still need `aria-label`.', 'Never nest interactive elements inside a Button.', 'Use `as-child` with RouterLink for navigation, not onClick + router.push.'],
  replaces: ['shadcn-vue Button', 'hand-rolled Button markup in app code'],
}
export default doc
