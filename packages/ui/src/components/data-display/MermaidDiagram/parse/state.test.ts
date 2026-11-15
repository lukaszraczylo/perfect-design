import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import type { StateAst, StateDef } from './state'

const ok = (src: string): StateAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.ast as StateAst
}
const bad = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected a parse error')
  expect(r.errors).toHaveLength(1)
  return r.errors[0]!
}
const st = (ast: StateAst, id: string): StateDef => {
  const s = ast.states.find((x) => x.id === id)
  if (!s) throw new Error(`no state ${id}`)
  return s
}
const ids = (ast: StateAst) => ast.states.map((s) => s.id)

describe('state parse: good', () => {
  it('reads a minimal diagram with start and end', () => {
    const ast = ok('stateDiagram-v2\n[*] --> Idle\nIdle --> [*]')
    expect(ast.type).toBe('state')
    expect(ast.direction).toBe('TB')
    expect(ids(ast)).toEqual(['start:', 'Idle', 'end:'])
    expect(ast.transitions.map((t) => [t.from, t.to])).toEqual([['start:', 'Idle'], ['Idle', 'end:']])
    expect(st(ast, 'start:').kind).toBe('start')
    expect(st(ast, 'end:').kind).toBe('end')
  })

  it('accepts the version 1 keyword', () => {
    expect(ok('stateDiagram\nA --> B').keyword).toBe('stateDiagram')
    expect(ok('stateDiagram-v2\nA --> B').keyword).toBe('stateDiagram-v2')
  })

  it('reads transition labels, including colons inside the label', () => {
    const ast = ok('stateDiagram-v2\nA --> B : go now\nB --> C: time: 5s\nC --> D :\nD-->A')
    expect(ast.transitions.map((t) => t.label)).toEqual(['go now', 'time: 5s', undefined, undefined])
    expect(ast.transitions[3]).toMatchObject({ from: 'D', to: 'A' })
  })

  it('reads long names with `state "text" as id`', () => {
    const ast = ok('stateDiagram-v2\nstate "Waiting for the next order" as wait\nwait --> done')
    expect(st(ast, 'wait').title).toBe('Waiting for the next order')
    expect(st(ast, 'done').title).toBe('done')
  })

  it('collects several description lines', () => {
    const ast = ok('stateDiagram-v2\nIdle : first line\nIdle : second line\nIdle:third\nIdle --> Busy')
    expect(st(ast, 'Idle').descriptions).toEqual(['first line', 'second line', 'third'])
  })

  it('reads a bare state and a state with a class', () => {
    const ast = ok('stateDiagram-v2\nLonely\nOther:::hot')
    expect(ids(ast)).toEqual(['Lonely', 'Other'])
    expect(st(ast, 'Other').classes).toEqual(['hot'])
  })

  it('scopes [*] per composite state and nests to any depth', () => {
    const ast = ok(`stateDiagram-v2
[*] --> Outer
state Outer {
  [*] --> Mid
  state Mid {
    [*] --> Inner
    Inner --> [*]
  }
  Mid --> [*]
}
Outer --> [*]`)
    expect(ids(ast)).toEqual(['start:', 'Outer', 'start:Outer', 'Mid', 'start:Mid', 'Inner', 'end:Mid', 'end:Outer', 'end:'])
    expect(st(ast, 'Outer').kind).toBe('composite')
    expect(st(ast, 'Mid')).toMatchObject({ kind: 'composite', parent: 'Outer' })
    expect(st(ast, 'Inner').parent).toBe('Mid')
    expect(st(ast, 'start:Mid').parent).toBe('Mid')
    expect(st(ast, 'end:').parent).toBeUndefined()
  })

  it('gives each concurrent region its own start marker', () => {
    const ast = ok(`stateDiagram-v2
state Active {
  [*] --> A
  --
  [*] --> B
  --
  [*] --> C
}`)
    expect(ids(ast)).toEqual(['Active', 'start:Active', 'A', 'start:Active|2', 'B', 'start:Active|3', 'C'])
    expect(ast.transitions).toHaveLength(3)
    expect(st(ast, 'B').parent).toBe('Active')
  })

  it('reads a composite with a long title and an inline empty body', () => {
    const ast = ok('stateDiagram-v2\nstate "Order handling" as Orders {\n}\nstate Empty {}\nstate "Title" as T2 { }')
    expect(st(ast, 'Orders')).toMatchObject({ kind: 'composite', title: 'Order handling' })
    expect(st(ast, 'Empty').kind).toBe('composite')
    expect(st(ast, 'T2').kind).toBe('composite')
  })

  it('upgrades a state that was used before it was declared as a composite', () => {
    const ast = ok('stateDiagram-v2\nStart --> P\nstate P {\n  X --> Y\n}\nP --> End')
    expect(st(ast, 'P')).toMatchObject({ kind: 'composite', parent: undefined })
    expect(ast.states.filter((s) => s.id === 'P')).toHaveLength(1)
  })

  it('reopens a composite state', () => {
    const ast = ok('stateDiagram-v2\nstate P {\n  A --> B\n}\nstate P {\n  B --> C\n}')
    expect(ast.states.filter((s) => s.kind === 'composite')).toHaveLength(1)
    expect(st(ast, 'C').parent).toBe('P')
  })

  it('reads choice, fork and join', () => {
    const ast = ok('stateDiagram-v2\nstate c <<choice>>\nstate f <<fork>>\nstate "Joined" as j <<join>>\nstate X <<CHOICE>>\nA --> c\nc --> f')
    expect(st(ast, 'c').kind).toBe('choice')
    expect(st(ast, 'f').kind).toBe('fork')
    expect(st(ast, 'j')).toMatchObject({ kind: 'join', title: 'Joined' })
    expect(st(ast, 'X').kind).toBe('choice')
  })

  it('applies a type to a state that was already used', () => {
    const ast = ok('stateDiagram-v2\nA --> gate\nstate gate <<choice>>')
    expect(st(ast, 'gate').kind).toBe('choice')
  })

  it('reads single-line and multi-line notes', () => {
    const ast = ok(`stateDiagram-v2
Idle --> Busy
note left of Idle : waiting
note right of Busy
  line one
  line two
end note
note left of Busy: tight`)
    expect(ast.notes).toEqual([
      { index: 0, side: 'left', target: 'Idle', lines: ['waiting'], line: 3 },
      { index: 1, side: 'right', target: 'Busy', lines: ['line one', 'line two'], line: 4 },
      { index: 2, side: 'left', target: 'Busy', lines: ['tight'], line: 8 },
    ])
  })

  it('creates the state a note points to', () => {
    const ast = ok('stateDiagram-v2\nnote right of Ghost : boo')
    expect(ids(ast)).toEqual(['Ghost'])
  })

  it('reads classDef, class and :::', () => {
    const ast = ok(`stateDiagram-v2
classDef bad fill:#f00,stroke:#900,stroke-width:3px
classDef a,b stroke-dasharray:4
class One,Two bad
Three:::a --> One`)
    expect(ast.classDefs.bad).toEqual({ fill: '#f00', stroke: '#900', 'stroke-width': '3px' })
    expect(ast.classDefs.a).toEqual({ 'stroke-dasharray': '4' })
    expect(ast.classDefs.b).toEqual({ 'stroke-dasharray': '4' })
    expect(st(ast, 'One').classes).toEqual(['bad'])
    expect(st(ast, 'Three').classes).toEqual(['a'])
  })

  it('reads direction at the top and inside a composite', () => {
    const ast = ok('stateDiagram-v2\ndirection LR\nstate P {\n  direction TD\n  A --> B\n}\nP --> C')
    expect(ast.direction).toBe('LR')
    expect(st(ast, 'P').direction).toBe('TB')
    expect(ok('stateDiagram-v2\ndirection bt\nA --> B').direction).toBe('BT')
    expect(ok('stateDiagram-v2\ndirection RL\nA --> B').direction).toBe('RL')
  })

  it('ignores hide and scale lines', () => {
    const ast = ok('stateDiagram-v2\nhide empty description\nscale 350 width\nA --> B')
    expect(ids(ast)).toEqual(['A', 'B'])
  })

  it('keeps front matter title and strips comments', () => {
    const ast = ok('---\ntitle: Kestrel Freight pickup\n---\nstateDiagram-v2\n%% a comment\nA --> B\n')
    expect(ast.meta.title).toBe('Kestrel Freight pickup')
    expect(ast.transitions).toHaveLength(1)
  })

  it('treats words like class or note as state names when used as such', () => {
    const ast = ok('stateDiagram-v2\nclass --> note\nstate : text\ndirection : x')
    expect(ids(ast)).toEqual(['class', 'note', 'state', 'direction'])
    expect(st(ast, 'state').descriptions).toEqual(['text'])
  })

  it('accepts a transition from a composite and into it', () => {
    const ast = ok('stateDiagram-v2\nstate P {\n  A --> B\n}\nX --> P\nP --> Y')
    expect(ast.transitions.map((t) => [t.from, t.to])).toEqual([['A', 'B'], ['X', 'P'], ['P', 'Y']])
  })
})

describe('state parse: errors', () => {
  it('reports an unterminated composite at its opening line', () => {
    expect(bad('stateDiagram-v2\nstate P {\n  A --> B')).toMatchObject({
      code: 'syntax', line: 2, column: 1, message: 'The composite state "P" opened here is never closed. Add a "}" line after its states.',
    })
    expect(bad('stateDiagram-v2\n  state A {\n    state B {\n    }')).toMatchObject({ line: 2, column: 3 })
  })

  it('reports a stray closing brace', () => {
    expect(bad('stateDiagram-v2\nA --> B\n  }')).toMatchObject({
      line: 3, column: 3, message: 'Unexpected "}": no composite state is open. Remove it, or open one with "state Name {".',
    })
  })

  it('reports an unknown state type', () => {
    expect(bad('stateDiagram-v2\nstate X <<mystery>>')).toMatchObject({
      line: 2, column: 9, message: 'Unknown state type "<<mystery>>". Use <<choice>>, <<fork>> or <<join>>.',
    })
    expect(bad('stateDiagram-v2\nstate X <<choice')).toMatchObject({ line: 2, column: 9, message: 'This "<<" is never closed. Write <<choice>>, <<fork>> or <<join>>.' })
  })

  it('reports a transition without a target', () => {
    expect(bad('stateDiagram-v2\nA -->')).toMatchObject({
      line: 2, column: 6, message: 'This transition has no target state. Write the state after the arrow, for example "A --> B" or "A --> [*]".',
    })
    expect(bad('stateDiagram-v2\nA --> : label')).toMatchObject({ line: 2, column: 6 })
  })

  it('reports a transition without a source', () => {
    expect(bad('stateDiagram-v2\n  --> B')).toMatchObject({
      line: 2, column: 3, message: 'This transition has no source state. Write the state before the arrow, for example "A --> B" or "[*] --> A".',
    })
  })

  it('reports an unknown arrow', () => {
    expect(bad('stateDiagram-v2\nA -> B')).toMatchObject({
      line: 2, column: 3, message: 'Unknown transition arrow "->". State diagrams use "-->", for example "A --> B".',
    })
    expect(bad('stateDiagram-v2\nA ==> B').message).toContain('Unknown transition arrow "==>"')
  })

  it('reports text after a target and chained transitions', () => {
    expect(bad('stateDiagram-v2\nA --> B C')).toMatchObject({
      line: 2, column: 9, message: 'Unexpected "C". Add a label with ":", for example "A --> B : label".',
    })
    expect(bad('stateDiagram-v2\nA --> B --> C')).toMatchObject({
      line: 2, column: 9, message: 'Chained transitions are not supported. Write each transition on its own line.',
    })
  })

  it('reports text after a lone state', () => {
    expect(bad('stateDiagram-v2\nA B')).toMatchObject({
      line: 2, column: 3, message: 'Unexpected "B". Write "A --> Other" for a transition, or "A : text" for a description.',
    })
  })

  it('reports a state without a name', () => {
    const msg = '"state" needs a name. Write "state Name", "state Name {" or state "Long text" as Name.'
    expect(bad('stateDiagram-v2\nstate')).toMatchObject({ line: 2, column: 6, message: msg })
    expect(bad('stateDiagram-v2\nstate {')).toMatchObject({ line: 2, column: 7, message: msg })
  })

  it('reports quoted-name mistakes', () => {
    expect(bad('stateDiagram-v2\nstate "Long text')).toMatchObject({ line: 2, column: 7, message: 'This quoted state name is never closed. End it with a closing quote.' })
    expect(bad('stateDiagram-v2\nstate "Long text" id')).toMatchObject({ line: 2, column: 19, message: 'A quoted state name needs an id: state "Long text" as Name.' })
    expect(bad('stateDiagram-v2\nstate "Long text" as')).toMatchObject({ line: 2, column: 21, message: 'Expected an id after "as", for example state "Long text" as Name.' })
  })

  it('reports notes that are wrong or never closed', () => {
    expect(bad('stateDiagram-v2\nA --> B\nnote right of B\n  never ends')).toMatchObject({
      line: 3, column: 1, message: 'This note is never closed. Add an "end note" line after the note text.',
    })
    expect(bad('stateDiagram-v2\nnote right of B\nend note')).toMatchObject({ line: 2, column: 1, message: 'This note has no text. Write the text between the "note" line and "end note".' })
    expect(bad('stateDiagram-v2\nnote above A : x').message).toContain('A note needs a side and a state.')
    expect(bad('stateDiagram-v2\nnote left A : x')).toMatchObject({ line: 2, column: 11, message: 'Expected "of" after "left". Write "note left of State : text" or "note right of State : text".' })
    expect(bad('stateDiagram-v2\nnote left of : x').message).toContain('The note names no state.')
    expect(bad('stateDiagram-v2\nnote left of A :')).toMatchObject({ line: 2, column: 17, message: 'This note has no text after ":". Write the note text there.' })
    expect(bad('stateDiagram-v2\nnote left of A B : x').message).toContain('Unexpected "B : x"')
    expect(bad('stateDiagram-v2\nend note')).toMatchObject({ line: 2, column: 1, message: 'Unexpected "end note": no note is open. Start one with "note left of State".' })
  })

  it('reports a bad direction', () => {
    expect(bad('stateDiagram-v2\ndirection UP')).toMatchObject({ line: 2, column: 11, message: 'Unknown direction "UP". Use TB, BT, LR or RL.' })
    expect(bad('stateDiagram-v2\ndirection')).toMatchObject({ line: 2, message: 'direction needs a value: TB, BT, LR or RL.' })
  })

  it('reports a divider outside a composite and a lone brace', () => {
    expect(bad('stateDiagram-v2\nA --> B\n--').message).toContain('The "--" divider separates concurrent regions')
    expect(bad('stateDiagram-v2\nstate A\n{')).toMatchObject({ line: 3, column: 1, message: 'Unexpected "{". Open a composite state on the "state" line: "state Name {".' })
  })

  it('reports misuse of [*]', () => {
    expect(bad('stateDiagram-v2\n[*] : text')).toMatchObject({ line: 2, column: 1, message: '"[*]" is the start or end marker and cannot have a description.' })
  })

  it('reports a composite that contains itself, a typed state with a body and deep nesting', () => {
    expect(bad('stateDiagram-v2\nstate A {\n  state A {\n  }\n}')).toMatchObject({ line: 3, message: 'The composite state "A" is already open here, a state cannot contain itself.' })
    expect(bad('stateDiagram-v2\nstate c <<choice>>\nstate c {\n}')).toMatchObject({ line: 3, message: '"c" is a <<choice>> state and cannot contain other states.' })
    expect(bad('stateDiagram-v2\nstate P {\n}\nstate P <<fork>>')).toMatchObject({ line: 4, message: '"P" is a composite state and cannot be a <<fork>>.' })
    const deep = Array.from({ length: 41 }, (_, i) => `state S${i} {`).join('\n')
    expect(bad(`stateDiagram-v2\n${deep}`)).toMatchObject({ line: 42, message: 'Composite states are nested more than 40 levels deep. Flatten the diagram.' })
    const fine = Array.from({ length: 40 }, (_, i) => `state S${i} {`).join('\n') + '\nX --> Y\n' + '}\n'.repeat(40)
    expect(ok(`stateDiagram-v2\n${fine}`).states.filter((s) => s.kind === 'composite')).toHaveLength(40)
  })

  it('reports bad class syntax', () => {
    expect(bad('stateDiagram-v2\nA --> B\nclassDef')).toMatchObject({ line: 3, column: 1, message: 'classDef needs a name and styles: "classDef name stroke-width:2px".' })
    expect(bad('stateDiagram-v2\nclass A')).toMatchObject({ line: 2, column: 1, message: 'class needs state ids and a class name: "class s1,s2 name".' })
    expect(bad('stateDiagram-v2\nA:::')).toMatchObject({ line: 2, column: 5, message: 'Expected a class name after ":::".' })
    expect(bad('stateDiagram-v2\nstate A:::')).toMatchObject({ line: 2, column: 11, message: 'Expected a class name after ":::".' })
  })

  it('reports text after the header and a trailing garbage after a declaration', () => {
    expect(bad('stateDiagram-v2 direction LR\nA --> B')).toMatchObject({ line: 1, column: 17, message: 'Put "direction LR" on its own line below stateDiagram-v2.' })
    expect(bad('stateDiagram-v2\nstate A junk')).toMatchObject({ line: 2, column: 9, message: 'Unexpected "junk". A state declaration ends after its name, <<type>> or "{".' })
  })

  it('reports an empty source as an empty-diagram error', () => {
    const r = parseMermaid('%% only a comment\n')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]!.code).toBe('empty')
  })

  it('reports an unclosed front matter and directive from the shared preparation', () => {
    expect(bad('---\ntitle: x\nstateDiagram-v2\nA --> B').message).toContain('front matter')
  })
})

describe('state parse: edge cases', () => {
  it('accepts a header with no body', () => {
    const ast = ok('stateDiagram-v2')
    expect(ast.states).toEqual([])
    expect(ast.transitions).toEqual([])
  })

  it('accepts a header with only comments below it', () => {
    expect(ok('stateDiagram-v2\n%% nothing here\n\n   \n').states).toEqual([])
  })

  it('handles CRLF and a byte order mark', () => {
    const ast = ok('﻿stateDiagram-v2\r\n[*] --> A\r\nA --> B : x\r\nnote left of A\r\n  hi\r\nend note\r\n')
    expect(ast.transitions).toHaveLength(2)
    expect(ast.notes[0]!.lines).toEqual(['hi'])
  })

  it('keeps unicode, quotes and long labels as text', () => {
    const long = 'x'.repeat(5000)
    const ast = ok(`stateDiagram-v2\nstate "Zażółć gęślą jaźń" as pl\npl --> 状態 : 日本語のラベル\n状態 --> pl : "quoted" and 'single'\npl : ${long}`)
    expect(st(ast, 'pl').title).toBe('Zażółć gęślą jaźń')
    expect(ast.transitions.map((t) => t.label)).toEqual(['日本語のラベル', '"quoted" and \'single\''])
    expect(st(ast, 'pl').descriptions[0]).toHaveLength(5000)
  })

  it('merges duplicate declarations into one state', () => {
    const ast = ok('stateDiagram-v2\nstate "First" as A\nstate "Second" as A\nA --> A\nA --> A')
    expect(ids(ast)).toEqual(['A'])
    expect(st(ast, 'A').title).toBe('Second')
    expect(ast.transitions).toHaveLength(2)
  })

  it('keeps hostile text as plain text', () => {
    const ast = ok(`stateDiagram-v2
<script>alert(1)</script> --> B : <img src=x onerror=alert(1)>
state "><img onerror=alert(1)>" as X
X : javascript:alert(1)`)
    const labels = [ast.transitions[0]!.label, st(ast, 'X').title, st(ast, 'X').descriptions[0]]
    expect(labels).toEqual(['<img src=x onerror=alert(1)>', '><img onerror=alert(1)>', 'javascript:alert(1)'])
  })

  it('parses 1000 lines quickly', () => {
    const lines = ['stateDiagram-v2']
    for (let i = 0; i < 330; i++) lines.push(`S${i} --> S${i + 1} : step ${i}`, `S${i} : description ${i}`, `note left of S${i} : n${i}`)
    lines.push('state P {', '  [*] --> Q', '}')
    const t0 = performance.now()
    const ast = ok(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(200)
    expect(ast.transitions).toHaveLength(331)
    expect(ast.notes).toHaveLength(330)
  })

  it('never throws on arbitrary garbage', () => {
    const junk = ['}', '{', '--', '-->', '[*]', '<<', '>>', 'state', 'note', '"', '`', ':::', ':', 'A --> ', 'class', 'end note', '[*] --> [*]', '\t', '~']
    for (let i = 0; i < 200; i++) {
      const src = ['stateDiagram-v2', ...Array.from({ length: 5 }, (_, k) => junk[(i * 7 + k * 11) % junk.length]! + ' ' + junk[(i * 3 + k) % junk.length]!)].join('\n')
      expect(() => parseMermaid(src)).not.toThrow()
    }
  })
})

describe('state parse: concurrent regions', () => {
  it('numbers the regions and counts them on the composite', () => {
    const ast = ok('stateDiagram-v2\nstate Active {\n  [*] --> A\n  --\n  [*] --> B\n  B --> C\n  --\n  D\n}')
    expect(st(ast, 'Active').regions).toBe(3)
    expect(['A', 'start:Active'].map((id) => st(ast, id).region)).toEqual([1, 1])
    expect(['B', 'C', 'start:Active|2'].map((id) => st(ast, id).region)).toEqual([2, 2, 2])
    expect(st(ast, 'D')).toMatchObject({ region: 3, parent: 'Active' })
  })

  it('leaves regions unset on a composite without dividers and on top level states', () => {
    const ast = ok('stateDiagram-v2\nTop\nstate P {\n  A\n}')
    expect(st(ast, 'P').regions).toBeUndefined()
    expect(st(ast, 'Top').region).toBeUndefined()
    expect(st(ast, 'A').region).toBe(1)
  })

  it('keeps an empty region and counts a trailing divider', () => {
    expect(st(ok('stateDiagram-v2\nstate P {\n  A\n  --\n}'), 'P').regions).toBe(2)
    expect(st(ok('stateDiagram-v2\nstate P {\n  --\n  --\n}'), 'P').regions).toBe(3)
  })

  it('keeps regions per composite when concurrency is nested in an ordinary composite', () => {
    const ast = ok('stateDiagram-v2\nstate Outer {\n  X\n  state Inner {\n    A\n    --\n    B\n  }\n  Y\n}')
    expect(st(ast, 'Outer').regions).toBeUndefined()
    expect(st(ast, 'Inner')).toMatchObject({ regions: 2, parent: 'Outer', region: 1 })
    expect(st(ast, 'B')).toMatchObject({ parent: 'Inner', region: 2 })
    expect(st(ast, 'Y')).toMatchObject({ parent: 'Outer', region: 1 })
  })

  it('puts a composite declared in a later region into that region', () => {
    const ast = ok('stateDiagram-v2\nstate P {\n  A\n  --\n  state Q {\n    B\n  }\n}')
    expect(st(ast, 'Q')).toMatchObject({ parent: 'P', region: 2 })
  })

  it('keeps the larger region count when a composite is opened twice', () => {
    const ast = ok('stateDiagram-v2\nstate P {\n  A\n  --\n  B\n  --\n  C\n}\nstate P {\n  D\n}')
    expect(st(ast, 'P').regions).toBe(3)
  })

  it('reports a divider outside a composite with line and column', () => {
    expect(bad('stateDiagram-v2\nA --> B\n  --')).toMatchObject({ line: 3, column: 3, message: expect.stringContaining('The "--" divider separates concurrent regions') })
    expect(bad('stateDiagram-v2\nstate P {\n  A\n}\n--')).toMatchObject({ line: 5, column: 1 })
  })

  it('does not take three or more dashes for a divider', () => {
    expect(bad('stateDiagram-v2\nstate P {\n  A\n  ---\n  B\n}')).toMatchObject({ line: 4, column: 3, message: '"---" is not a divider. Concurrent regions are separated by exactly "--".' })
    expect(bad('stateDiagram-v2\n-----')).toMatchObject({ line: 2, column: 1 })
  })
})
