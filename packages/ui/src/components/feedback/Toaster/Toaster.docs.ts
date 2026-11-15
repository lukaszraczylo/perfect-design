import { ref } from 'vue'
import { useToastStore } from '../../../stores/toast'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Toaster',
  group: 'feedback',
  subgroup: 'Toasts',
  summary: 'Fixed-position, screen-reader-announced stack that renders the global toast store.',
  description:
    'Mount `<Toaster />` ONCE near the app root (requires Pinia). Choose one of six position presets: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` (default; also exported as `TOASTER_POSITIONS`). Top positions render the newest toast nearest the top edge, bottom positions nearest the bottom. Use `showProgress` for visible countdown bars and `hideIcons` for text-only toasts. Push from anywhere with `useToastStore()`: `push({ title, description, variant, duration, action, key })` or the shortcuts `success/error/warning/info(title, description?)`. At most 5 toasts are visible; a `key` replaces an existing toast instead of stacking. Duration 0 or Infinity makes a toast sticky. With `pauseOnHover` the stack stays visible while hovered or focused (the store timers keep running, so a toast that expired meanwhile lingers until about one second after the pointer leaves).',
  status: 'stable',
  props: [
    { name: 'position', type: "'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'", default: "'bottom-right'", description: 'Screen corner/edge. Newest toast is nearest the anchored edge. Unknown values fall back to `bottom-right`.' },
    { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Keep toasts visible while the pointer is over or focus is inside the stack.' },
    { name: 'showProgress', type: 'boolean', default: 'false', description: 'Show a countdown bar on every toast with a finite duration. It freezes while the stack is hovered or focused and is hidden under reduced motion.' },
    { name: 'hideIcons', type: 'boolean', default: 'false', description: 'Render toasts without their leading status icon.' },
    { name: 'layout', type: "'default' | 'compact' | 'inline'", default: "'default'", description: 'Card layout of every toast: `compact` is dense, `inline` puts the action at the end of the row. Unknown values fall back to `default`. Non-default values add `data-layout` to the region.' },
    { name: 'appearance', type: "'default' | 'soft' | 'solid'", default: "'default'", description: 'Surface of every toast: popover with a tone border, tinted, or filled with the tone colour. Unknown values fall back to `default`. Non-default values add `data-appearance` to the region.' },
    { name: 'label', type: 'string', default: "'Notifications'", description: 'Accessible name of the region.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Push toasts from the store',
      script: `import { ref } from 'vue'
import { useToastStore } from '@perfect-design/ui'\nconst toasts = useToastStore()`,
      code: `<div class="flex flex-wrap gap-2">
  <Button variant="outline" @click="toasts.success('Saved', 'Everything is up to date')">Success</Button>
  <Button variant="outline" @click="toasts.error('Request failed')">Error</Button>
  <Button variant="outline" @click="toasts.push({ title: 'Archived', action: { label: 'Undo', onClick: () => {} } })">With action</Button>
</div>
<Toaster label="Notifications, basic demo" />`,
      state: () => ({ toasts: useToastStore() }),
    },
    {
      title: 'Position and sticky toast',
      script: `const toasts = useToastStore()`,
      code: `<Button variant="outline" @click="toasts.push({ title: 'Needs your attention', variant: 'warning', duration: 0, key: 'attention' })">Show sticky warning</Button>
<Toaster label="Notifications, top centre demo" position="top-center" />`,
      state: () => ({ toasts: useToastStore() }),
    },
    {
      title: 'Six position presets',
      description: 'Pick any of top-left, top-center, top-right, bottom-left, bottom-center, bottom-right. Only mount one Toaster in a real app; this demo switches the position of a single one.',
      script: `import { ref } from 'vue'\nconst position = ref('bottom-right')\nconst positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']`,
      code: `<div class="flex flex-wrap gap-2">
  <Button v-for="p in positions" :key="p" size="sm" :variant="position === p ? 'default' : 'outline'" @click="position = p; toasts.push({ title: p, description: 'Toast position', duration: 3000, key: 'pos-demo' })">{{ p }}</Button>
</div>
<Toaster label="Notifications, position demo" :position="position" />`,
      state: () => ({
        toasts: useToastStore(),
        position: ref('bottom-right'),
        positions: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      }),
    },
    {
      title: 'Compact and solid toasts',
      description: '`layout` and `appearance` apply to every toast in the stack.',
      script: `const toasts = useToastStore()`,
      code: `<div class="flex flex-wrap gap-2">
  <Button variant="outline" @click="toasts.push({ title: 'Copied', variant: 'success', duration: 4000, key: 'copied' })">Compact toast</Button>
  <Button variant="outline" @click="toasts.push({ title: 'Archived', duration: 6000, key: 'archived', action: { label: 'Undo', onClick: () => {} } })">Toast with action</Button>
</div>
<Toaster label="Notifications, compact demo" layout="compact" appearance="solid" position="top-right" />`,
      state: () => ({ toasts: useToastStore() }),
    },
    {
      title: 'Progress bars',
      description: '`showProgress` drains a bar over each toast duration; hovering the stack freezes it.',
      script: `const toasts = useToastStore()`,
      code: `<Button variant="outline" @click="toasts.push({ title: 'Report exported', description: 'Closing in 6 seconds', variant: 'success', duration: 6000 })">Show toast with countdown</Button>
<Toaster label="Notifications, countdown demo" show-progress />`,
      state: () => ({ toasts: useToastStore() }),
    },
    {
      title: 'Without icons',
      description: '`hideIcons` renders compact, text-only toasts.',
      script: `const toasts = useToastStore()`,
      code: `<Button variant="outline" @click="toasts.push({ title: 'Copied to clipboard', duration: 3000 })">Show text-only toast</Button>
<Toaster label="Notifications, text-only demo" hide-icons position="top-right" />`,
      state: () => ({ toasts: useToastStore() }),
    },
  ],
  a11y: [
    'The stack is one labelled region (`label`, default "Notifications"). Give every Toaster on a page its own label.',
    'New toasts are announced once through two persistent hidden live regions inside it: polite for default, success and info, assertive (role="alert") for warning and danger. Only the visible text is read, plus "Actions available" when a toast has an action.',
    'Toasts never take focus when they appear. Dismiss buttons and actions are real buttons in the tab order.',
    'Hover or focus inside the stack keeps toasts on screen (WCAG 2.2.1). Escape on a focused toast dismisses it. Dismissing a focused toast moves focus to the next toast, or back to where it was.',
    'Entry animation and the countdown bar are disabled under prefers-reduced-motion. The stack is full width up to `max-w-sm`, so it fits 320px.',
  ],
  related: ['ToastItem', 'Alert', 'Banner'],
  requires: [
    'Throws a ContractError when a `Toaster` has a blank `label` (the toast store already throws for a blank toast title).',
  ],
  llmNotes: [
    'Mount <Toaster /> exactly once and install Pinia.',
    'Never create toasts by rendering ToastItem; call useToastStore().',
    'Use `key` to dedupe repeating messages (e.g. connection errors).',
    'Choose `position` from the six presets (top|bottom x left|center|right); default is bottom-right.',
    'Enable `showProgress` only when users benefit from seeing the remaining time; it respects reduced motion.',
    'Toast titles must be non-empty; the store throws otherwise.',
  ],
  replaces: ['hand-rolled Toaster markup in app code'],
}
export default doc
