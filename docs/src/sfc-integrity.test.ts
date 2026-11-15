import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from 'vue/compiler-sfc'

const SRC = join(process.cwd(), 'src')

/** An SFC whose script block embeds a literal script tag in a string. */
const BROKEN =
  '<script setup lang="ts">\n' +
  "const sample = `<script setup lang=\"ts\">\nimport App from './App.vue'\n</script>`\n" +
  '</script>\n<template><div /></template>'

/**
 * The SFC parser ends a script block at the first `</script>` it sees, including one
 * inside a string. The rest of the sample then leaks into the module as real code, so
 * the dependency scanner tries to resolve imports that only existed in an example.
 * Code samples belong in snippets.ts, or with the tag split (`'<' + '/script>'`).
 */
function problems(file: string, source: string): string[] {
  const { descriptor, errors } = parse(source, { filename: file })
  const found = errors.map((e) => String((e as Error).message ?? e))
  for (const [block, text] of [
    ['script', descriptor.script?.content],
    ['script setup', descriptor.scriptSetup?.content],
  ] as const) {
    if (text && /<\/script/i.test(text)) found.push(`${block} block contains a literal </script> tag`)
  }
  return found
}

function sfcFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith('.vue'))
    .map((f) => join(dir, f))
}

describe('docs SFC integrity', () => {
  it('detects a script tag embedded in a script block', () => {
    expect(problems('Broken.vue', BROKEN).length).toBeGreaterThan(0)
  })

  it('every .vue file parses with intact script blocks', () => {
    const failures = sfcFiles(SRC)
      .map((file) => ({ file: relative(SRC, file), found: problems(file, readFileSync(file, 'utf8')) }))
      .filter((r) => r.found.length)
    expect(failures).toEqual([])
  })
})