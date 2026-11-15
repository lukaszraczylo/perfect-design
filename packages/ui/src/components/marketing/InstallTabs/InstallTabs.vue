<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { faCheck, faCopy } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import { insetFocus } from '../shared/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import {
  INSTALL_TABS_SIZES,
  INSTALL_TABS_VARIANTS,
  installTabsCopyVariants,
  installTabsHeaderVariants,
  installTabsListVariants,
  installTabsPanelVariants,
  installTabsTabVariants,
  installTabsVariants,
  type InstallTabsSize,
  type InstallTabsVariant,
} from './variants'

export interface InstallTab {
  /** Tab text, e.g. "pnpm". */
  label: string
  /** Snippet shown and copied. */
  code: string
  /** Optional language hint exposed as data-language on the <code> element. */
  language?: string
}

export interface InstallTabsProps extends BaseProps {
  tabs?: InstallTab[]
  /** Look: `default` (bordered card), `minimal` (no frame, underlined tabs) or `contained` (tray with pill tabs). Unknown values fall back to `default`. */
  variant?: InstallTabsVariant
  /** Text and padding scale: `sm`, `md` or `lg`. Unknown values fall back to `md`. */
  size?: InstallTabsSize
  /** v-model: index of the selected tab. Uncontrolled when omitted. Out-of-range values are clamped. */
  modelValue?: number
  copyLabel?: string
  copiedLabel?: string
  /** Announced (and shown on the button) when the clipboard write fails. */
  copyErrorLabel?: string
  /** Accessible name of the tablist. */
  label?: string
  /** Milliseconds the "Copied" / "Copy failed" state stays visible. */
  resetAfter?: number
}

const props = withDefaults(defineProps<InstallTabsProps>(), {
  tabs: () => [],
  variant: 'default',
  size: 'md',
  modelValue: undefined,
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  copyErrorLabel: 'Copy failed',
  label: 'Install commands',
  resetAfter: 2000,
})
const emit = defineEmits<{ 'update:modelValue': [index: number]; copy: [text: string]; 'copy-error': [error: unknown] }>()

const uid = useId()
const inner = ref(0)
const copied = ref(false)
const failed = ref(false)
const tabEls = ref<HTMLButtonElement[]>([])
let timer: ReturnType<typeof setTimeout> | undefined

const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
// Reports the first incomplete tab once, not once per tab.
onMounted(async () => {
  await nextTick()
  if (props.tabs.length === 0) {
    violation('InstallTabs', 'requires-tabs', 'requires at least one tab in `tabs`, each with a `label` and `code`. Without one it renders an empty tab list.')
    return
  }
  const i = props.tabs.findIndex((t) => !t || blank(t.label) || blank(t.code))
  if (i !== -1) {
    const what = !props.tabs[i] || blank(props.tabs[i].label) ? 'label' : 'code'
    violation('InstallTabs', 'requires-tab-fields', `requires a non-empty \`${what}\` on every tab (tabs[${i}] has none). The label is the tab text and the code is what the copy button copies.`)
  }
  requireText('InstallTabs', 'label', props.label, 'It is the accessible name of the tab list.')
})

const count = computed(() => props.tabs.length)
const active = computed(() => {
  const n = Math.trunc(props.modelValue ?? inner.value)
  return Number.isFinite(n) ? Math.min(Math.max(0, n), Math.max(0, count.value - 1)) : 0
})
const current = computed(() => props.tabs[active.value])
const tabId = (i: number) => `${uid}-tab-${i}`
const panelId = (i: number) => `${uid}-panel-${i}`

function select(i: number) {
  const changed = i !== active.value
  inner.value = i
  copied.value = false
  failed.value = false
  clearTimeout(timer)
  if (changed) emit('update:modelValue', i)
}
async function onKeydown(e: KeyboardEvent) {
  const n = count.value
  if (n === 0) return
  // In a right-to-left list the arrows swap: ArrowLeft goes to the next tab visually on the left, which is the next in order.
  const list = (e.currentTarget as HTMLElement | null)?.parentElement
  const rtl = !!list && getComputedStyle(list).direction === 'rtl'
  const next = (active.value + 1) % n
  const prev = (active.value - 1 + n) % n
  const moves: Record<string, number> = {
    ArrowRight: rtl ? prev : next,
    ArrowLeft: rtl ? next : prev,
    Home: 0,
    End: n - 1,
  }
  if (!(e.key in moves)) return
  e.preventDefault()
  const i = moves[e.key]
  select(i)
  await nextTick()
  tabEls.value[i]?.focus()
}

async function copy() {
  const text = current.value?.code
  if (text === undefined) return
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(text)
  } catch (err) {
    emit('copy-error', err)
    report(false)
    return
  }
  emit('copy', text)
  report(true)
}
/** One visible and announced message for both outcomes ("Copied" / "Copy failed"); a single reset timer. */
function report(ok: boolean) {
  copied.value = ok
  failed.value = !ok
  clearTimeout(timer)
  timer = setTimeout(
    () => {
      copied.value = false
      failed.value = false
    },
    Number.isFinite(props.resetAfter) ? Math.max(0, props.resetAfter) : 2000,
  )
}
onBeforeUnmount(() => clearTimeout(timer))
const message = computed(() => (copied.value ? props.copiedLabel : failed.value ? props.copyErrorLabel : ''))

const variant = computed<InstallTabsVariant>(() => (INSTALL_TABS_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<InstallTabsSize>(() => (INSTALL_TABS_SIZES.includes(props.size) ? props.size : 'md'))
const classes = computed(() => cn(installTabsVariants({ variant: variant.value, size: size.value }), props.class))
const headerClass = computed(() => installTabsHeaderVariants({ variant: variant.value }))
const listClass = computed(() => installTabsListVariants({ variant: variant.value }))
const copyClass = computed(() => cn(installTabsCopyVariants({ size: size.value }), focusRing))
const panelClass = computed(() => cn(installTabsPanelVariants({ variant: variant.value, size: size.value }), insetFocus))
const tabClass = (i: number) => cn(installTabsTabVariants({ variant: variant.value, size: size.value, active: i === active.value }), focusRing)
</script>

<template>
  <div data-slot="install-tabs" :data-variant="variant" :data-size="size" :class="classes">
    <div data-slot="install-tabs-header" :class="headerClass">
      <div role="tablist" data-slot="install-tabs-list" :aria-label="label" :class="listClass">
        <button
          v-for="(tab, i) in tabs"
          :id="tabId(i)"
          :key="i"
          :ref="(el) => { if (el) tabEls[i] = el as HTMLButtonElement }"
          type="button"
          role="tab"
          data-slot="install-tabs-tab"
          :aria-selected="i === active ? 'true' : 'false'"
          :tabindex="i === active ? 0 : -1"
          :data-state="i === active ? 'active' : 'inactive'"
          :class="tabClass(i)"
          @click="select(i)"
          @keydown="onKeydown"
        >
          {{ tab.label }}
        </button>
      </div>
      <button
        v-if="current"
        type="button"
        data-slot="install-tabs-copy"
        :class="copyClass"
        @click="copy"
      >
        <Icon :icon="copied ? faCheck : faCopy" size="sm" :class="copied && 'text-success'" />
        <span>{{ message || copyLabel }}</span>
      </button>
    </div>
    <div
      v-if="current"
      :id="panelId(active)"
      role="tabpanel"
      data-slot="install-tabs-panel"
      :aria-labelledby="tabId(active)"
      tabindex="0"
      :class="panelClass"
    >
      <pre class="m-0"><code :data-language="current.language">{{ current.code }}</code></pre>
    </div>
    <span data-slot="install-tabs-status" role="status" aria-live="polite" class="sr-only">{{ message }}</span>
  </div>
</template>
