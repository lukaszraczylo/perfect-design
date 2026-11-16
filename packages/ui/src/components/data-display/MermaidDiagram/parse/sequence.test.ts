import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import type { SequenceAst, SeqMessage } from './sequence'

function ok(src: string): SequenceAst {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(`${r.errors[0]!.line}:${r.errors[0]!.column} ${r.errors[0]!.message}`)
  expect(r.ast.type).toBe('sequence')
  return r.ast as SequenceAst
}

function bad(src: string): { line: number; column: number; message: string; code: string } {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected an error')
  return r.errors[0]!
}

const msgs = (ast: SequenceAst): SeqMessage[] => ast.events.filter((e): e is SeqMessage => e.kind === 'message')

describe('sequence parse: participants', () => {
  it('reads participants, actors and aliases', () => {
    const ast = ok(`sequenceDiagram
  participant A
  participant B as Bob Jones
  actor C
  actor D as "Dana, QA"
  A->>B: hi`)
    expect(ast.participants).toEqual([
      { id: 'A', label: 'A', actor: false, line: 2 },
      { id: 'B', label: 'Bob Jones', actor: false, line: 3 },
      { id: 'C', label: 'C', actor: true, line: 4 },
      { id: 'D', label: '"Dana, QA"', actor: true, line: 5 },
    ])
  })

  it('creates implicit participants in order of first appearance', () => {
    const ast = ok('sequenceDiagram\nZed->>Amy: 1\nAmy->>Bo: 2\nNote over Cy: x')
    expect(ast.participants.map((p) => p.id)).toEqual(['Zed', 'Amy', 'Bo', 'Cy'])
    expect(ast.participants.every((p) => !p.actor)).toBe(true)
  })

  it('accepts a quoted id with an alias, names with spaces and the config suffix', () => {
    const ast = ok(`sequenceDiagram
participant "Order service" as O
participant Alice Smith
participant DB@{ "type": "database" }
create participant Late as Late one
create actor Who
O->>DB: x`)
    expect(ast.participants.map((p) => [p.id, p.label, p.actor])).toEqual([
      ['Order service', 'O', false],
      ['Alice Smith', 'Alice Smith', false],
      ['DB', 'DB', false],
      ['Late', 'Late one', false],
      ['Who', 'Who', true],
      ['O', 'O', false],
    ])
  })

  it('merges duplicate declarations: later alias and kind win, position stays', () => {
    const ast = ok('sequenceDiagram\nparticipant A\nparticipant B\nactor A as First\nparticipant A')
    expect(ast.participants.map((p) => [p.id, p.label, p.actor])).toEqual([
      ['A', 'First', false],
      ['B', 'B', false],
    ])
  })

  it('keeps hostile ids such as __proto__ as plain data', () => {
    const ast = ok('sequenceDiagram\n__proto__->>constructor: toString')
    expect(ast.participants.map((p) => p.id)).toEqual(['__proto__', 'constructor'])
  })

  it('keeps hostile alias and message text as plain strings', () => {
    const ast = ok(`sequenceDiagram
participant A as <script>alert(1)</script>
A->>B: "><img src=x onerror=alert(1)>
B-->>A: javascript:alert(1)`)
    expect(ast.participants[0]!.label).toBe('<script>alert(1)</script>')
    expect(msgs(ast)[0]!.text).toBe('"><img src=x onerror=alert(1)>')
    expect(msgs(ast)[1]!.text).toBe('javascript:alert(1)')
  })
})

describe('sequence parse: messages', () => {
  it('maps every arrow to line style and head', () => {
    const ast = ok(`sequenceDiagram
A->>B: a
A-->>B: b
A->B: c
A-->B: d
A-xB: e
A--xB: f
A-)B: g
A--)B: h
A<<->>B: i
A<<-->>B: j`)
    expect(msgs(ast).map((m) => [m.line, m.head, m.both])).toEqual([
      ['solid', 'arrow', false],
      ['dashed', 'arrow', false],
      ['solid', 'none', false],
      ['dashed', 'none', false],
      ['solid', 'cross', false],
      ['dashed', 'cross', false],
      ['solid', 'open', false],
      ['dashed', 'open', false],
      ['solid', 'arrow', true],
      ['dashed', 'arrow', true],
    ])
  })

  it('reads spaces around arrows, empty text, missing colon and colons inside the text', () => {
    const ast = ok('sequenceDiagram\nAlice ->> Bob : Hello: world\nAlice->>Bob:\nAlice->>Bob')
    expect(msgs(ast).map((m) => [m.from, m.to, m.text])).toEqual([
      ['Alice', 'Bob', 'Hello: world'],
      ['Alice', 'Bob', ''],
      ['Alice', 'Bob', ''],
    ])
  })

  it('does not split a name such as a-xray at its dash', () => {
    const ast = ok('sequenceDiagram\na-xray->>b-ox: ping')
    expect(msgs(ast)[0]).toMatchObject({ from: 'a-xray', to: 'b-ox', head: 'arrow' })
  })

  it('reads the activation shorthand', () => {
    const ast = ok('sequenceDiagram\nA->>+B: hi\nB-->>-A: ok')
    expect(msgs(ast).map((m) => [m.activate, m.deactivate])).toEqual([
      [true, false],
      [false, true],
    ])
  })

  it('reads activate and deactivate lines', () => {
    const ast = ok('sequenceDiagram\nA->>B: hi\nactivate B\ndeactivate B')
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'activate', 'deactivate'])
  })

  it('allows a trailing semicolon and a self message', () => {
    const ast = ok('sequenceDiagram;\nA->>A: think;\nend_user->>A: x;')
    expect(msgs(ast)[0]).toMatchObject({ from: 'A', to: 'A', text: 'think' })
    expect(ast.participants.map((p) => p.id)).toEqual(['A', 'end_user'])
  })

  it('does not treat names that start with a keyword as that keyword', () => {
    const ast = ok('sequenceDiagram\nloop->>alt: x\nalt->>else-one: y')
    expect(msgs(ast)).toHaveLength(2)
  })

  it('numbers messages with autonumber, start and step, and stops at off', () => {
    const ast = ok(`sequenceDiagram
A->>B: 0
autonumber
A->>B: 1
A->>B: 2
autonumber 10 5
A->>B: 3
A->>B: 4
autonumber off
A->>B: 5
autonumber 7
A->>B: 6`)
    expect(msgs(ast).map((m) => m.num)).toEqual([undefined, 1, 2, 10, 15, undefined, 7])
  })
})

describe('sequence parse: notes', () => {
  it('reads left, right and over notes', () => {
    const ast = ok(`sequenceDiagram
participant A
participant B
Note left of A: one
Note right of B: two
Note over A,B: three
note over A : four
Note over B,B: five`)
    expect(ast.events.map((e) => (e.kind === 'note' ? [e.side, e.ids, e.text] : null))).toEqual([
      ['left', ['A'], 'one'],
      ['right', ['B'], 'two'],
      ['over', ['A', 'B'], 'three'],
      ['over', ['A'], 'four'],
      ['over', ['B'], 'five'],
    ])
  })
})

describe('sequence parse: blocks', () => {
  it('reads nested blocks with their branches', () => {
    const ast = ok(`sequenceDiagram
loop Every minute
  alt ok
    A->>B: x
  else bad
    B->>A: y
  end
end
par one
  A->>B: 1
and two
  A->>B: 2
end
critical db
  A->>B: 1
option timeout
  A->>B: 2
end
opt maybe
end
break stop
end
alt
else
end`)
    expect(ast.events.map((e) => (e.kind === 'block' ? `${e.block}:${e.text}` : e.kind === 'branch' ? `${e.branch}:${e.text}` : e.kind === 'end' ? 'end' : '-'))).toEqual([
      'loop:Every minute', 'alt:ok', '-', 'else:bad', '-', 'end', 'end',
      'par:one', '-', 'and:two', '-', 'end',
      'critical:db', '-', 'option:timeout', '-', 'end',
      'opt:maybe', 'end', 'break:stop', 'end', 'alt:', 'else:', 'end',
    ])
  })

  it('accepts and ignores box, rect, link, links and destroy', () => {
    const ast = ok(`sequenceDiagram
box Aqua Group
  participant A
  participant B
end
rect rgb(1, 2, 3)
  A->>B: x
end
link A: Dashboard @ https://example.test/dash
links A: {"Dashboard": "https://example.test/dash"}
destroy B
alt x
  rect rgb(0,0,0)
    A->>B: y
  end
else z
  A->>B: w
end`)
    expect(ast.participants.map((p) => p.id)).toEqual(['A', 'B'])
    expect(ast.events.filter((e) => e.kind === 'end')).toHaveLength(1)
  })
})

describe('sequence parse: title and meta', () => {
  it('reads title lines with and without colon, and keeps the front matter title otherwise', () => {
    expect(ok('sequenceDiagram\ntitle Order flow\nA->>B: x').meta.title).toBe('Order flow')
    expect(ok('sequenceDiagram\ntitle: With colon\nA->>B: x').meta.title).toBe('With colon')
    expect(ok('---\ntitle: From front matter\n---\nsequenceDiagram\nA->>B: x').meta.title).toBe('From front matter')
    expect(ok('---\ntitle: From front matter\n---\nsequenceDiagram\ntitle Line wins\nA->>B: x').meta.title).toBe('Line wins')
  })

  it('carries accessibility lines into meta', () => {
    const ast = ok('sequenceDiagram\naccTitle: Order flow\naccDescr: Two services talk\nA->>B: x')
    expect(ast.meta).toMatchObject({ accTitle: 'Order flow', accDescr: 'Two services talk' })
  })
})

describe('sequence parse: errors', () => {
  it('rejects text after the header', () => {
    expect(bad('sequenceDiagram foo\nA->>B: x')).toMatchObject({ line: 1, column: 17, message: 'Put each statement on its own line below "sequenceDiagram".' })
  })

  it('reports an unterminated block at its opener', () => {
    expect(bad('sequenceDiagram\nA->>B: hi\n  loop Retry\n  B->>A: x')).toMatchObject({
      line: 3,
      column: 3,
      message: 'The "loop" block opened here is never closed. Add an "end" line after its content.',
    })
    expect(bad('sequenceDiagram\nalt a\n loop b\n end')).toMatchObject({ line: 2, column: 1 })
    expect(bad('sequenceDiagram\nbox Team\nA->>B: x')).toMatchObject({ line: 2, column: 1, message: 'The "box" block opened here is never closed. Add an "end" line after its content.' })
  })

  it('reports a stray end and text after end', () => {
    expect(bad('sequenceDiagram\nA->>B: x\nend')).toMatchObject({
      line: 3,
      column: 1,
      message: 'This "end" has no block to close. Remove it, or open a block with loop, alt, opt, par, critical or break.',
    })
    expect(bad('sequenceDiagram\nloop x\n  end now')).toMatchObject({ line: 3, column: 6, message: 'The "end" line closes a block and takes no text. Put the text on its own line.' })
  })

  it('reports branches outside their block', () => {
    expect(bad('sequenceDiagram\nA->>B: x\nelse nope')).toMatchObject({
      line: 3,
      column: 1,
      message: '"else" has no open "alt" block. Start one with "alt condition", or remove this line.',
    })
    expect(bad('sequenceDiagram\nloop x\n  and y\nend')).toMatchObject({
      line: 3,
      column: 3,
      message: '"and" is only valid directly inside "par ... end", but the open block is "loop". Close it with "end" first.',
    })
    expect(bad('sequenceDiagram\nalt x\noption y\nend').message).toContain('"option" is only valid directly inside "critical ... end"')
  })

  it('reports activation problems', () => {
    expect(bad('sequenceDiagram\nA->>B: x\ndeactivate B')).toMatchObject({
      line: 3,
      column: 12,
      message: 'Cannot deactivate "B": it has no open activation. Write "activate B" earlier, or put "+" after the arrow of the message that starts it.',
    })
    expect(bad('sequenceDiagram\nA->>B: x\nactivate Ghost')).toMatchObject({
      line: 3,
      column: 10,
      message: 'Cannot activate "Ghost": no participant has this name yet. Declare it with "participant Ghost" or use it in a message first.',
    })
    expect(bad('sequenceDiagram\nA->>B: x\ndeactivate Ghost').message).toContain('Cannot deactivate "Ghost": no participant')
    expect(bad('sequenceDiagram\nA->>B: x\nactivate').message).toBe('"activate" needs a participant name, for example "activate Bob".')
    expect(bad('sequenceDiagram\nA->>B: x\ndeactivate')).toMatchObject({ line: 3, column: 11 })
    expect(bad('sequenceDiagram\nA->>-B: x')).toMatchObject({
      line: 2,
      column: 5,
      message: 'Cannot deactivate "A" with "-": it has no open activation. Activate it earlier with "+" after an arrow or with "activate A".',
    })
    // one activation, two deactivations
    expect(bad('sequenceDiagram\nA->>+B: x\nB-->>-A: y\ndeactivate B')).toMatchObject({ line: 4 })
  })

  it('reports unknown arrows', () => {
    expect(bad('sequenceDiagram\nA=>B: hi')).toMatchObject({ line: 2, column: 2, message: 'Unknown arrow "=>". Use one of ->>, -->>, ->, -->, -x, --x, -) or --).' })
    expect(bad('sequenceDiagram\n  A-->>>B: hi')).toMatchObject({ line: 2, column: 4, message: 'Unknown arrow "-->>>". Use one of ->>, -->>, ->, -->, -x, --x, -) or --).' })
    expect(bad('sequenceDiagram\nA--->B: hi')).toMatchObject({ line: 2, column: 2, message: expectArrow('--->') })
    expect(bad('sequenceDiagram\nA<->>B: hi')).toMatchObject({ line: 2, column: 2, message: expectArrow('<->>') })
    expect(bad('sequenceDiagram\nA~>B: hi').message).toContain('Unknown arrow "~>"')
  })

  it('reports messages without sender or receiver, and names with angle brackets', () => {
    expect(bad('sequenceDiagram\n->>B: hi')).toMatchObject({ line: 2, column: 1, message: 'This message has no sender before "->>". Write "Alice->>Bob: text".' })
    expect(bad('sequenceDiagram\nA->>: hi')).toMatchObject({ line: 2, column: 5, message: 'This message has no receiver after "->>". Write "Alice->>Bob: text".' })
    expect(bad('sequenceDiagram\nA->> : hi')).toMatchObject({ line: 2, column: 5 })
    expect(bad('sequenceDiagram\nA->>B<i>: hi')).toMatchObject({ line: 2, column: 6, message: 'A participant name cannot contain "<" or ">". Declare it with an alias: "participant A as Display name".' })
    expect(bad('sequenceDiagram\n<b>A->>B: hi')).toMatchObject({ line: 2, column: 1 })
  })

  it('reports unknown statements with the valid forms', () => {
    const e = bad('sequenceDiagram\n  frobnicate the thing')
    expect(e).toMatchObject({ line: 2, column: 3, code: 'syntax' })
    expect(e.message).toBe(
      'Unknown statement "frobnicate". Write a message such as "Alice->>Bob: Hello", or start the line with participant, actor, Note, activate, deactivate, loop, alt, else, opt, par, and, critical, option, break, end, autonumber or title.',
    )
    expect(bad('sequenceDiagram\nx = y').message).toContain('Unknown statement "x"')
  })

  it('reports bad participant declarations', () => {
    expect(bad('sequenceDiagram\nparticipant')).toMatchObject({ line: 2, column: 12, message: '"participant" needs a name, for example "participant Alice" or "participant A as Alice Smith".' })
    expect(bad('sequenceDiagram\n  actor ')).toMatchObject({ line: 2, column: 8 })
    expect(bad('sequenceDiagram\nparticipant A as')).toMatchObject({ line: 2, column: 17, message: 'Write the display text after "as", for example "participant A as Alice".' })
    expect(bad('sequenceDiagram\nparticipant "Open')).toMatchObject({ line: 2, column: 13, message: 'This quoted name is never closed. Add the closing quote.' })
    expect(bad('sequenceDiagram\nparticipant "A" B')).toMatchObject({ line: 2, column: 17 })
    expect(bad('sequenceDiagram\nparticipant "  "')).toMatchObject({ line: 2, column: 13, message: '"participant" needs a name, the quoted name is empty.' })
    expect(bad('sequenceDiagram\ncreate B')).toMatchObject({ line: 2, column: 1, message: 'Write "create participant B" or "create actor B" before the first message to B.' })
    expect(bad('sequenceDiagram\ncreate actor').message).toContain('"actor" needs a name')
  })

  it('reports bad notes', () => {
    const form = 'A note is written as "Note left of A: text", "Note right of A: text" or "Note over A,B: text".'
    expect(bad('sequenceDiagram\nNote above A: x')).toMatchObject({ line: 2, column: 1, message: form })
    expect(bad('sequenceDiagram\nNote')).toMatchObject({ line: 2, column: 1, message: form })
    expect(bad('sequenceDiagram\nNote left of A,B: x')).toMatchObject({ line: 2, column: 14, message: 'A note "left of" takes one participant. Use "Note over A,B: text" to span two.' })
    expect(bad('sequenceDiagram\nNote over A,B,C: x')).toMatchObject({ line: 2, column: 11, message: 'A note spans at most two participants: "Note over A,B: text".' })
    expect(bad('sequenceDiagram\nNote over A,: x')).toMatchObject({ line: 2, column: 11, message: 'Name the participants the note belongs to, for example "Note over A: text".' })
    expect(bad('sequenceDiagram\nNote right of : x').message).toBe('Name the participant the note belongs to, for example "Note right of A: text".')
    expect(bad('sequenceDiagram\nNote over A')).toMatchObject({ line: 2, column: 12, message: 'A note needs text after a colon, for example "Note over A: text".' })
    expect(bad('sequenceDiagram\nNote over A:   ')).toMatchObject({ line: 2, column: 13 })
  })

  it('reports bad autonumber and title', () => {
    const msg = 'autonumber takes numbers: "autonumber", "autonumber 10", "autonumber 10 5" (start and step) or "autonumber off".'
    expect(bad('sequenceDiagram\nautonumber abc')).toMatchObject({ line: 2, column: 12, message: msg })
    expect(bad('sequenceDiagram\nautonumber 1 2 3')).toMatchObject({ message: msg })
    expect(bad('sequenceDiagram\nautonumber -1')).toMatchObject({ message: msg })
    expect(bad('sequenceDiagram\nautonumber off now')).toMatchObject({ message: msg })
    expect(bad('sequenceDiagram\ntitle')).toMatchObject({ line: 2, column: 6, message: 'A title needs text, for example "title Checkout flow".' })
    expect(bad('sequenceDiagram\ntitle:  ')).toMatchObject({ line: 2 })
  })
})

describe('sequence parse: edge cases', () => {
  it('parses an empty body and comment-only bodies', () => {
    expect(ok('sequenceDiagram').events).toEqual([])
    const ast = ok('sequenceDiagram\n%% nothing here\n%% still nothing\n')
    expect(ast.participants).toEqual([])
  })

  it('handles CRLF, tabs, blank lines, comments and directives', () => {
    const ast = ok('%%{init: {"theme": "base"}}%%\r\nsequenceDiagram\r\n\r\n\t%% note\r\n\tA->>B: hi\r\n\tB-->>A: yo\r\n')
    expect(msgs(ast).map((m) => m.text)).toEqual(['hi', 'yo'])
  })

  it('keeps unicode, quotes and very long labels intact', () => {
    const long = 'word '.repeat(400).trim()
    const ast = ok(`sequenceDiagram\nparticipant ü as Zoë "Z" Łukasz\nü->>日本語: ${long}\n日本語-->>ü: 😀-free "quoted" 'single' #35; &amp;`)
    expect(ast.participants.map((p) => p.id)).toEqual(['ü', '日本語'])
    expect(msgs(ast)[0]!.text).toBe(long)
    expect(msgs(ast)[1]!.text).toBe(`😀-free "quoted" 'single' #35; &amp;`)
  })

  it('parses 1000 lines quickly', () => {
    const lines = ['sequenceDiagram']
    for (let i = 0; i < 250; i++) lines.push(`A->>B: m${i}`, 'alt x', `B-->>C: r${i}`, 'end')
    const t = performance.now()
    const ast = ok(lines.join('\n'))
    expect(performance.now() - t).toBeLessThan(200)
    expect(msgs(ast)).toHaveLength(500)
  })

  it('fails fast on a hostile deeply nested input without hanging', () => {
    const lines = ['sequenceDiagram', ...Array.from({ length: 1000 }, () => 'loop x')]
    const t = performance.now()
    const e = bad(lines.join('\n'))
    expect(performance.now() - t).toBeLessThan(200)
    expect(e).toMatchObject({ line: 1001, column: 1 })
  })

  it('does not choke on regex-hostile input', () => {
    const t = performance.now()
    const evil = `${'-'.repeat(5000)}x${'<'.repeat(5000)}`
    parseMermaid(`sequenceDiagram\n${evil}`)
    parseMermaid(`sequenceDiagram\nNote over ${' '.repeat(5000)}A`)
    parseMermaid(`sequenceDiagram\nparticipant ${'a as '.repeat(2000)}`)
    expect(performance.now() - t).toBeLessThan(1000)
  })
})

function expectArrow(run: string): string {
  return `Unknown arrow "${run}". Use one of ->>, -->>, ->, -->, -x, --x, -) or --).`
}

describe('sequence parse: linear time', () => {
  it('long whitespace runs in participant and note lines stay fast', () => {
    // Inputs large enough that the old super-linear code took seconds; the linear code takes milliseconds, so the bound survives slow CI.
    const sp = ' '.repeat(160000)
    const t0 = performance.now()
    parseMermaid(`sequenceDiagram\n  participant A${sp}x\n  participant B${sp}`)
    parseMermaid(`sequenceDiagram\n  participant A\n  Note over A${sp}x`)
    parseMermaid(`sequenceDiagram\n  Note over A${sp}`)
    expect(performance.now() - t0).toBeLessThan(2000)
  })
  it('still reads aliases and notes', () => {
    const ast = ok('sequenceDiagram\n  participant B as Bob Jones\n  participant A\n  Note over A,B : hi')
    expect(ast.participants.map((p) => p.label)).toContain('Bob Jones')
  })
})
