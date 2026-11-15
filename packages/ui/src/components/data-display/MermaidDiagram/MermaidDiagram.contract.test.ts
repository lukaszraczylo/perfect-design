import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { ContractError, configureStrictMode } from '../../../lib/contract'
import MermaidDiagram from './MermaidDiagram.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
function capture(props: Record<string, unknown>) {
  const errors: Error[] = []
  const Host = defineComponent({
    setup() {
      onErrorCaptured((e) => {
        errors.push(e as Error)
        return false
      })
      return () => h(MermaidDiagram, props as never)
    },
  })
  const w = mount(Host)
  return { w, errors }
}

describe('MermaidDiagram contract: source is required', () => {
  beforeEach(() => configureStrictMode('throw'))
  afterEach(() => configureStrictMode('off'))

  it.each([[''], ['   '], ['\n\t\n']])('throws a ContractError when source is blank (%j)', async (source) => {
    const { errors, w } = capture({ source })
    await settle()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toBeInstanceOf(ContractError)
    expect(errors[0]!.message).toContain('MermaidDiagram')
    expect(errors[0]!.message).toContain('requires a non-empty `source`')
    expect(errors[0]!.message).toContain('Pass the Mermaid text')
    // never blank: the inline message is still drawn
    expect(w.find('[data-slot="mermaid-diagram-error"]').exists()).toBe(true)
  })
  it('throws when source is missing or not a string', async () => {
    for (const props of [{}, { source: undefined }, { source: 42 }]) {
      const { errors } = capture(props)
      await settle()
      expect(errors[0]).toBeInstanceOf(ContractError)
    }
  })
  it('throws again when the source becomes blank later', async () => {
    const errors: Error[] = []
    const Host = defineComponent({
      props: { source: { type: String, default: '' } },
      setup(props) {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(MermaidDiagram, { source: props.source })
      },
    })
    const w = mount(Host, { props: { source: 'flowchart TD\n A --> B' } })
    await settle()
    expect(errors).toHaveLength(0)
    await w.setProps({ source: '' })
    await settle()
    expect(errors[0]).toBeInstanceOf(ContractError)
  })
  it('does not throw for any non-blank source: valid, broken or unsupported', async () => {
    for (const source of ['flowchart TD\n A --> B', 'flowchart TD\n A[', 'gitGraph\n commit', '%% only a comment']) {
      const { errors } = capture({ source })
      await settle()
      expect(errors, source).toHaveLength(0)
    }
  })
  it('a syntax error in the source is shown inline and is not a contract violation', async () => {
    const { errors, w } = capture({ source: 'flowchart TD\n A -> B' })
    await settle()
    expect(errors).toHaveLength(0)
    expect(w.find('[role="alert"]').exists()).toBe(true)
  })
  it('does not throw for the documented usage', async () => {
    const { errors } = capture({ source: 'flowchart TD\n A[Start] --> B[End]', title: 'Plan', fit: 'scroll', showSource: true })
    await settle()
    expect(errors).toHaveLength(0)
  })
})

describe('MermaidDiagram contract: strict modes', () => {
  afterEach(() => configureStrictMode('off'))
  it('warn logs with console.error and does not throw', async () => {
    configureStrictMode('warn')
    const original = console.error
    const logged: string[] = []
    console.error = (m: string) => void logged.push(String(m))
    try {
      const { errors } = capture({ source: '' })
      await settle()
      expect(errors).toHaveLength(0)
      expect(logged.some((l) => l.includes('MermaidDiagram') && l.includes('source'))).toBe(true)
    } finally {
      console.error = original
    }
  })
  it('off is silent', async () => {
    configureStrictMode('off')
    const { errors } = capture({ source: '' })
    await settle()
    expect(errors).toHaveLength(0)
  })
})
