import { tokenizeGo } from './go'
import { tokenizeJson } from './json'
import { tokenizePlain } from './plain'
import { tokenizeShell } from './shell'
import { tokenizeToml } from './toml'
import { CODE_LANGUAGES, type CodeLanguage, type TokenLines } from './types'
import { tokenizeYaml } from './yaml'

export { CODE_LANGUAGES, TOKEN_TYPES, splitLines } from './types'
export type { CodeLanguage, Token, TokenLines, TokenType } from './types'
export { tokenizeGo, tokenizeJson, tokenizePlain, tokenizeShell, tokenizeToml, tokenizeYaml }

const TOKENIZERS: Record<CodeLanguage, (source: string) => TokenLines> = {
  json: tokenizeJson,
  yaml: tokenizeYaml,
  go: tokenizeGo,
  toml: tokenizeToml,
  shell: tokenizeShell,
  plain: tokenizePlain,
}

/** Narrow any input to a supported language; unknown values fall back to `plain`. */
export function normalizeLanguage(language: unknown): CodeLanguage {
  return (CODE_LANGUAGES as readonly unknown[]).includes(language) ? (language as CodeLanguage) : 'plain'
}

/** Tokenize `source` per line for `language`. Unknown languages render as plain text. */
export function tokenize(source: string, language: unknown): TokenLines {
  return TOKENIZERS[normalizeLanguage(language)](source)
}
