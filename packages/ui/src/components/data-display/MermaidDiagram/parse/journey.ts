/**
 * `journey` parser.
 *
 * Supported: `title`, `section Name`, tasks `Task name : score : Actor1, Actor2` where the score is a whole number
 * from 1 to 5 and the actors are optional. Tasks before the first section go to an unnamed section. Actors are
 * de-duplicated in order of first appearance. Colons cannot appear inside the task name or actor names.
 */
import { fail, type DiagramMeta } from '../../_diagram/types'
import type { PreparedSource } from '../../_diagram/source'

export interface JourneySection {
  /** Empty for the implicit section of tasks written before any `section`. */
  name: string
  line: number
}

export interface JourneyTask {
  name: string
  score: 1 | 2 | 3 | 4 | 5
  actors: string[]
  /** Index into `JourneyAst.sections`. */
  section: number
  line: number
}

export interface JourneyAst {
  type: 'journey'
  sections: JourneySection[]
  tasks: JourneyTask[]
  /** All actors in order of first appearance. */
  actors: string[]
  meta: DiagramMeta
}

export function parseJourney(p: PreparedSource): JourneyAst {
  const meta: DiagramMeta = { ...p.meta }
  const ast: JourneyAst = { type: 'journey', sections: [], tasks: [], actors: [], meta }
  const seen = new Set<string>()
  let section = -1
  for (const l of p.lines) {
    const kw = /^(title|section)(?:\s+(.*))?$/.exec(l.text)
    if (kw) {
      const value = (kw[2] ?? '').trim()
      if (kw[1] === 'title') {
        if (value) meta.title = value
      } else {
        if (!value) fail(l.no, l.col + l.text.length, 'A section needs a name, for example "section Discover".')
        ast.sections.push({ name: value, line: l.no })
        section = ast.sections.length - 1
      }
      continue
    }
    const c1 = l.text.indexOf(':')
    if (c1 < 0) fail(l.no, l.col + l.text.length, `"${l.text}" is not a task. Write the task name, a colon and a score from 1 to 5, for example "${l.text}: 4: Customer".`)
    const name = l.text.slice(0, c1).trim()
    if (!name) fail(l.no, l.col, 'A task needs a name before the first colon, for example "Order: 4: Customer".')
    const c2 = l.text.indexOf(':', c1 + 1)
    const scoreRaw = l.text.slice(c1 + 1, c2 < 0 ? undefined : c2)
    const scoreText = scoreRaw.trim()
    const scoreCol = l.col + c1 + 1 + (scoreRaw.length - scoreRaw.trimStart().length)
    if (scoreText === '') fail(l.no, l.col + c1 + 1, `Task "${name}" has no score. Write a whole number from 1 (worst) to 5 (best) after the colon, for example "${name}: 4".`)
    if (!/^\d+$/.test(scoreText) || Number(scoreText) < 1 || Number(scoreText) > 5) {
      fail(l.no, scoreCol, `"${scoreText}" is not a valid score. Use a whole number from 1 (worst) to 5 (best).`)
    }
    const score = Number(scoreText) as JourneyTask['score']
    const actors: string[] = []
    if (c2 >= 0) {
      const c3 = l.text.indexOf(':', c2 + 1)
      if (c3 >= 0) fail(l.no, l.col + c3, 'Too many colons. A task is "Name: score: Actor, Actor"; remove this colon.')
      let start = c2 + 1
      for (let i = c2 + 1; i <= l.text.length; i++) {
        if (i === l.text.length || l.text[i] === ',') {
          const raw = l.text.slice(start, i)
          const a = raw.trim()
          if (a) {
            if (!actors.includes(a)) actors.push(a)
            if (!seen.has(a)) {
              seen.add(a)
              ast.actors.push(a)
            }
          } else if (l.text.slice(c2 + 1).trim() !== '' ) fail(l.no, l.col + start, 'This actor name is empty. Remove the extra comma or write a name.')
          start = i + 1
        }
      }
    }
    if (section < 0) {
      ast.sections.push({ name: '', line: l.no })
      section = ast.sections.length - 1
    }
    ast.tasks.push({ name, score, actors, section, line: l.no })
  }
  return ast
}
