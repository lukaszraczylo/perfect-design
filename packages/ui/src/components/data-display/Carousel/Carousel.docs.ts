import type { ComponentDoc } from '../../../docs-types'
import { ref } from 'vue'

const doc: ComponentDoc = {
  name: 'Carousel',
  group: 'data-display',
  subgroup: 'Media',
  summary: 'Scroll-snap carousel with previous / next buttons, dots, keyboard control, optional loop and accessible autoplay.',
  description:
    'Use `Carousel` for a small set of equal-weight slides (image galleries, feature tours, testimonials). It is built on native CSS scroll-snap: touch and trackpad swiping, momentum and snapping come from the browser, the component adds an index (`v-model`), buttons, dots, keyboard keys and autoplay. Compose `CarouselContent` (the scroller) with `CarouselItem` slides, and optionally `CarouselPrevious`, `CarouselNext`, `CarouselDots` and `CarouselCounter`. Slides are `basis-full` by default; override with a class (`basis-1/3`) to show several at once. Autoplay is off by default, pauses while the pointer is over the carousel or focus is inside, shows a pause/play button (WCAG 2.2.2) and is disabled entirely under `prefers-reduced-motion`. `loop` wraps around (rewind), it does not clone slides. Do not use a carousel for critical content or long lists: prefer a grid or `VirtualList`.',
  status: 'stable',
  parts: [
    {
      name: 'CarouselContent',
      description: 'The scroll-snap track: focusable `role="group"` named "Slides", aria-live region. Give it a fixed height for vertical carousels.',
      props: [
        { name: 'label', type: 'string', default: "'Slides'", description: 'Accessible name of the track.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    { name: 'CarouselItem', description: 'One slide: `role="group"`, `aria-roledescription="slide"`, labelled "n of N". Registers itself with the carousel.', props: [{ name: 'class', type: 'string | object | array', description: 'Merged last; use `basis-*` for multi-slide views.' }] },
    {
      name: 'CarouselPrevious',
      description: 'Previous button, positioned over the carousel; disabled at the start unless `loop`.',
      props: [
        { name: 'label', type: 'string', default: "'Previous slide'", description: 'Accessible name.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'CarouselNext',
      description: 'Next button, positioned over the carousel; disabled at the end unless `loop`.',
      props: [
        { name: 'label', type: 'string', default: "'Next slide'", description: 'Accessible name.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'CarouselDots',
      description: 'One button per slide (`aria-current` marks the active one). Each button is a 24px target (44px on touch) around a 10px dot; the active dot is filled, the others are outlined. Scoped `dot` slot: `{ index, active, select }`.',
      props: [
        { name: 'label', type: 'string', default: "'Choose slide'", description: 'Accessible name of the dot group.' },
        { name: 'dotLabel', type: '(position: number, total: number) => string', description: 'Builds each dot name (default "Go to slide n").' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'CarouselPlayPause',
      description: 'Pause / start button for autoplay. `Carousel` renders it automatically while `autoplay` is on; set `pauseButton` to false to place it yourself.',
      props: [
        { name: 'pauseLabel', type: 'string', default: "'Pause automatic slide show'", description: 'Accessible name while running.' },
        { name: 'playLabel', type: 'string', default: "'Start automatic slide show'", description: 'Accessible name while paused.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'CarouselCounter',
      description: 'Visible "2 / 4" position text with tabular figures. Scoped default slot: `{ index, count }`.',
      props: [{ name: 'class', type: 'string | object | array', description: 'Merged last.' }],
    },
  ],
  props: [
    { name: 'modelValue', type: 'number', default: '0', description: 'Active slide index (v-model; also works uncontrolled). Out-of-range, negative and NaN values are clamped.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Scroll axis; invalid values fall back to horizontal.' },
    { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap from last to first and first to last (buttons never disable).' },
    { name: 'autoplay', type: 'boolean', default: 'false', description: 'Advance automatically. Ignored under prefers-reduced-motion; stops on the last slide unless `loop`.' },
    { name: 'interval', type: 'number', default: '5000', description: 'Autoplay delay in ms; non-finite or <= 0 falls back to 5000.' },
    { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Pause autoplay while hovered. Focus inside the carousel always pauses.' },
    { name: 'live', type: "'auto' | 'off' | 'polite' | 'assertive'", default: "'auto'", description: '`aria-live` of the track. `auto` is off while autoplay runs (no chatter) and polite otherwise.' },
    { name: 'label', type: 'string', description: 'Accessible name of the carousel region. Required (or pass `aria-label` / `aria-labelledby`); there is no default, so several carousels on a page can be told apart.' },
    { name: 'pauseButton', type: 'boolean', default: 'true', description: 'Render the built-in pause/play button while `autoplay` is on.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', props: '{ index: number; count: number; goTo: (i: number) => void; next: () => void; prev: () => void }', description: 'Carousel parts and any custom controls.' }],
  emits: [{ name: 'update:modelValue', payload: '[index: number]', description: 'The active slide changed (button, dot, key, swipe or autoplay).' }],
  examples: [
    {
      title: 'Basic carousel',
      code: `<Carousel class="mx-auto max-w-md" label="Highlights">
  <CarouselContent class="rounded-lg border">
    <CarouselItem v-for="n in 4" :key="n">
      <div class="flex h-40 items-center justify-center bg-muted text-xl font-semibold">Slide {{ n }}</div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselDots />
  <CarouselCounter class="pt-2 text-center" />
</Carousel>`,
    },
    {
      title: 'v-model, loop and autoplay',
      description: 'Autoplay pauses on hover and focus, has a pause button and is disabled for users who prefer reduced motion.',
      code: `<div class="mx-auto flex max-w-md flex-col gap-3">
  <Carousel v-model="index" loop autoplay :interval="4000" label="Rotating tips">
    <CarouselContent class="rounded-lg border">
      <CarouselItem v-for="tip in tips" :key="tip">
        <p class="flex h-28 items-center justify-center px-6 text-center text-sm">{{ tip }}</p>
      </CarouselItem>
    </CarouselContent>
    <CarouselDots />
  </Carousel>
  <p class="text-center text-sm text-muted-foreground tabular-nums">Slide {{ index + 1 }} of {{ tips.length }}</p>
</div>`,
      script: `const index = ref(0)
const tips = ['Press the arrow keys to move.', 'Hover to pause the rotation.', 'Home and End jump to the ends.']`,
      state: () => ({ index: ref(0), tips: ['Press the arrow keys to move.', 'Hover to pause the rotation.', 'Home and End jump to the ends.'] }),
    },
    {
      title: 'Several slides per view',
      code: `<Carousel class="mx-auto max-w-lg" label="Cards">
  <CarouselContent class="gap-2">
    <CarouselItem v-for="n in 6" :key="n" class="basis-1/3">
      <div class="flex h-24 items-center justify-center rounded-md border bg-card">{{ n }}</div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
    },
    {
      title: 'Vertical',
      description: 'Give the content a fixed height.',
      code: `<Carousel orientation="vertical" class="mx-auto max-w-xs" label="Vertical slides">
  <CarouselContent class="h-40 rounded-lg border">
    <CarouselItem v-for="n in 3" :key="n">
      <div class="flex h-full items-center justify-center bg-muted">Slide {{ n }}</div>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`,
    },
  ],
  a11y: [
    'Root is `role="region"` with `aria-roledescription="carousel"` and an `aria-label` (set `label`). The track is a focusable `role="group"` named "Slides"; each slide is `role="group"` with `aria-roledescription="slide"` and an "n of N" label.',
    'Keyboard: Tab reaches the track, buttons and dots. On the track ArrowLeft / ArrowRight (ArrowUp / ArrowDown when vertical) move one slide and Home / End jump to the first / last. Arrow keys typed on links, buttons and form fields inside a slide keep their own behaviour. The focused track also scrolls natively and snaps to a slide.',
    'Dots are real buttons: 24px targets (44px on touch), `aria-current="true"` on the active one, and the active dot differs by fill, not only by colour. Previous and next sit at the logical start and end, so they mirror in RTL.',
    'The track is `aria-live="off"` while autoplay runs and `polite` otherwise (`live` overrides), so slide changes are announced only when the user caused them. `CarouselCounter` shows the position with tabular figures.',
    'Autoplay never runs under prefers-reduced-motion (scrolling is then instant instead of smooth), stops while the pointer is over the carousel or focus is inside, and always comes with a pause / start button (WCAG 2.2.2) that is the first control in tab order.',
    'Previous and next disable at the ends unless `loop`.',
  ],
  related: ['VirtualList', 'Tabs', 'Card', 'Timeline'],
  requires: [
    'Throws a ContractError when `Carousel` has no `CarouselContent`, or `CarouselContent` has no `CarouselItem`.',
    'Throws a ContractError when `Carousel` has no `label` (or `aria-label` / `aria-labelledby`); there is no generic default name.',
  ],
  llmNotes: [
    'Always compose Carousel > CarouselContent > CarouselItem; add CarouselPrevious / CarouselNext / CarouselDots as siblings of CarouselContent.',
    'Set `label` so the region has a meaningful accessible name.',
    'Use `basis-1/2`, `basis-1/3` on CarouselItem for multiple slides per view; vertical carousels need a fixed height class on CarouselContent.',
    'Keep autoplay off unless content is non-essential; never rely on it to reveal important information. Autoplay always renders a pause button: do not hide it.',
    'Slides register in DOM order; keep CarouselItem keys stable when reordering.',
  ],
}
export default doc
