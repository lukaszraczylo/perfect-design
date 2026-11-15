import type { ComponentDoc } from '../../../docs-types'

/** Display-only `<script setup>` line for a string constant (escapes backticks, backslashes and `${`). */
const show = (name: string, text: string) => `const ${name} = \`${text.replace(/[`\\]|\$\{/g, (m) => `\\${m}`)}\``

const handler = `package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"
)

// Item is the JSON shape returned by the sample endpoint.
type Item struct {
	ID      int       \`json:"id"\`
	Name    string    \`json:"name"\`
	Created time.Time \`json:"created"\`
}

func itemsHandler(logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items := []Item{{ID: 1, Name: "first", Created: time.Unix(0, 0).UTC()}}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(items); err != nil {
			logger.Error("encode failed", "err", err)
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		path := r.URL.Path
		go func() {
			logger.Info("served", "path", path, "count", len(items))
		}()
	}
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	mux := http.NewServeMux()
	mux.HandleFunc("GET /items", itemsHandler(logger))
	srv := &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	logger.Info("listening", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		logger.Error("server stopped", "err", err)
		os.Exit(1)
	}
}`

const operators = `//go:build linux && amd64

package sample

import "sync"

const (
	KB = 1 << (10 * (iota + 1))
	MB
	GB
)

const mask uint8 = 0xF0 &^ 0b0011_0000

//nolint:gocritic // sample directive
func fanIn(inputs ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup
	for _, in := range inputs {
		wg.Add(1)
		go func(c <-chan int) {
			defer wg.Done()
			for v := range c {
				out <- v
			}
		}(in)
	}
	go func() { wg.Wait(); close(out) }()
	return out
}

func classify(r rune) string {
	switch {
	case r >= '0' && r <= '9':
		return "digit"
	case r == '\\n':
		return "newline"
	}
	return \`other\`
}`

const snippet = `for i := range 3 {
	fmt.Printf("worker %d\\n", i)
}`

const value = {
  name: 'sample-web',
  replicas: 2,
  ratio: 0.5,
  enabled: true,
  tags: ['web', 'sample'],
  limits: { cpu: '500m', memory: '128Mi' },
  notes: 'First line\nSecond line',
  owner: null,
}

const doc: ComponentDoc = {
  name: 'GoViewer',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Read-only Go viewer: show Go source with highlighting and folds, or render a JS value as a Go composite literal.',
  description:
    'Use `GoViewer` to display Go code that people read and copy: handlers, type definitions, examples in docs, or a JS value as a ready-to-paste `map[string]any{...}` literal. Pass `source` for Go text (it wins) or `value` for a JS value rendered by the built-in `goLiteral`. It is a `CodeViewer` with the Go tokenizer, so every `CodeViewer` prop works except `language`.\n\n' +
    'Highlighted: keywords, predeclared types (`string`, `int64`, `error`, `any`, `byte`, `rune`...), builtins when called (`make`, `len`, `append`, `panic`...), constants (`nil`, `true`, `false`, `iota`), interpreted and raw strings (also across lines), runes, `//` and `/* */` comments including `//go:build` and `//nolint` directives, every number form (hex, octal, binary, underscores, floats, hex floats, imaginary), operators (`:=`, `<-`, `...`, `&^` and the compound forms), function names (after `func` and before `(`), type names (after `type` and in `type (...)` blocks), the package name and import paths, and struct tags in backticks. Folding covers functions, `type` and `struct` and `interface` blocks, `import (...)`, `const (...)` and `var (...)`, `switch` and `select` blocks, composite literals and multi-line comments.\n\n' +
    'Rendering a `value`: objects and Maps become `map[string]any{...}`, arrays and Sets `[]any{...}`, `null` and `undefined` `nil`, strings are quoted with Go escapes (multi-line text without backticks becomes a raw literal), dates become their ISO 8601 string, bigint becomes `int64(n)`, `NaN` and infinities become `math.NaN()` and `math.Inf(...)`. Output follows gofmt style: tabs, trailing commas and aligned map values. Numbers are written naturally (`42` is an `int`, `3.5` a `float64` once stored in `any`); `numbers="float64"` writes `float64(42)` the way `encoding/json` decodes. `package="name"` wraps the literal in `package name`, an `import "math"` when needed and `var data = ...`. Circular values show a `// Cannot render ...` comment line in the component; calling `goLiteral` directly throws a `TypeError` that names the path.\n\n' +
    'This is a viewer, not an editor, and it does not parse Go: highlighting is line oriented and does not validate. Use `CodeViewer` for other languages and `JsonViewer` to explore a live value as a tree.',
  status: 'stable',
  props: [
    { name: 'source', type: 'string', description: 'Go source text. Takes precedence over `value`, including when it is an empty string.' },
    { name: 'value', type: 'unknown', description: 'Any JS value, rendered as a Go composite literal. Replace it (do not mutate) to update the view. Ignored when `source` is a string. With neither prop the view shows `nil`.' },
    { name: 'package', type: 'string', description: 'With `value`: wrap the literal in `package <name>` and `var data = ...`. Invalid identifiers fall back to `main`. No effect with `source`.' },
    { name: 'numbers', type: "'natural' | 'float64'", default: "'natural'", description: 'With `value`: `natural` writes `42` and `3.5`; `float64` writes `float64(42)` for every number.' },
    { name: 'filename', type: 'string', description: 'Header title and accessible name of the code region. Set `filename` or `label`: one of them is required.' },
    { name: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show a non-selectable, `aria-hidden` line-number gutter.' },
    { name: 'foldable', type: 'boolean', default: 'true', description: 'Show fold toggles for functions, types, import and const groups, switch blocks and comments.' },
    { name: 'defaultFoldDepth', type: 'number', description: 'Regions nested this deep (0 = outermost) or deeper start folded. Unset starts expanded.' },
    { name: 'highlightLines', type: 'number[] | string', description: 'Displayed line numbers to mark: `[2, 5]` or `"3-5,9"`. Invalid parts are ignored; ranges are clamped.' },
    { name: 'startLine', type: 'number', default: '1', description: 'Number shown for the first line, for excerpts.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of scrolling sideways.' },
    { name: 'maxHeight', type: 'string', description: 'CSS length such as `24rem`; the code scrolls vertically beyond it.' },
    { name: 'copy', type: 'boolean', default: 'true', description: 'Show the copy button. It copies the full text, including folded lines.' },
    { name: 'variant', type: "'bordered' | 'plain' | 'flush'", default: "'bordered'", description: 'Framed card surface, no frame (`plain`) or full-bleed with top and bottom rules (`flush`). Unknown values fall back to `bordered`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px or 16px. Rows keep a 24px minimum so fold toggles stay 24px targets. Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', description: 'Accessible name of the code region. Required unless `filename` is set.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'copy', payload: '[text: string]', description: 'The Go text was copied to the clipboard.' },
    { name: 'fold', payload: '[event: { start: number; end: number; collapsed: boolean }]', description: 'A region was folded or unfolded, with displayed line numbers.' },
  ],
  examples: [
    {
      title: 'HTTP handler',
      description: 'Imports, a struct with tags, a handler that starts a goroutine and `main`. Each block has a fold toggle; one line is highlighted.',
      script: show('handler', handler),
      code: `<GoViewer :source="handler" filename="main.go" highlight-lines="29" />`,
      state: () => ({ handler }),
    },
    {
      title: 'Folded by default',
      description: 'Regions nested one level or deeper start folded, so the file opens as an outline of declarations.',
      script: show('handler', handler),
      code: `<GoViewer :source="handler" filename="main.go" label="main.go, folded outline" :default-fold-depth="1" max-height="20rem" />`,
      state: () => ({ handler }),
    },
    {
      title: 'Directives, constants, channels and operators',
      description: 'A `//go:build` line and a `//nolint` directive are comments; `iota`, `&^`, `<-`, `...`, binary and hex literals, runes and a raw string each get their own token.',
      script: show('operators', operators),
      code: `<GoViewer :source="operators" filename="fan.go" />`,
      state: () => ({ operators }),
    },
    {
      title: 'A snippet without a package clause',
      description: 'Source does not have to be a whole file. `start-line` numbers an excerpt, and folding is off for a short fragment.',
      script: show('snippet', snippet),
      code: `<GoViewer :source="snippet" :start-line="42" :foldable="false" label="Loop excerpt" />`,
      state: () => ({ snippet }),
    },
    {
      title: 'A JS value as a Go literal',
      description: 'Objects become `map[string]any{...}`, arrays `[]any{...}`, `null` becomes `nil`, values are aligned like gofmt output and the multi-line string becomes a raw literal.',
      script: `const value = ${JSON.stringify(value, null, 2)}`,
      code: `<GoViewer :value="value" filename="value.go" />`,
      state: () => ({ value }),
    },
    {
      title: 'Literal wrapped in a package, numbers as float64',
      description: '`package` adds the package clause and `var data = ...`; `numbers="float64"` writes numbers the way `encoding/json` decodes them. `wrap` and `variant="plain"` keep it compact.',
      script: `const value = ${JSON.stringify({ retries: 3, timeout: 2.5 }, null, 2)}`,
      code: `<GoViewer :value="value" package="config" numbers="float64" variant="plain" wrap label="Config literal" />`,
      state: () => ({ value: { retries: 3, timeout: 2.5 } }),
    },
    {
      title: 'Variants and sizes',
      description: 'Gallery: `variant` bordered, plain and flush, then `size` sm, md and lg (sample data).',
      script: `const line = 'x := 1'`,
      code: `<div class="flex flex-col gap-4">
  <GoViewer :source="line" variant="bordered" label="Bordered variant" />
  <GoViewer :source="line" variant="plain" label="Plain variant" />
  <GoViewer :source="line" variant="flush" label="Flush variant" />
  <GoViewer :source="line" size="sm" label="Small size" />
  <GoViewer :source="line" size="md" label="Medium size" />
  <GoViewer :source="line" size="lg" label="Large size" />
</div>`,
      state: () => ({ line: 'x := 1' }),
    },
  ],
  a11y: [
    'The Go code is a scroll region: `role="region"`, `tabindex="0"`, labelled by `label`, else `filename`, else "Go source". Tab reaches it; arrow keys, Home, End, Page Up and Page Down scroll it. At 320px width only the region scrolls, never the page.',
    'Fold toggles are `<button>` elements with `aria-expanded`, `aria-controls` and names like "Fold lines 12 to 20". Tab to focus, Enter or Space to toggle. A folded region shows a "… N lines" button that unfolds it and returns focus to the toggle.',
    'Line numbers are `aria-hidden` and `user-select: none`, so selection and copy give clean Go code. Copy has a constant name ("Copy code") and a `role="status"` region announces the result.',
    'Highlighted lines have a start-edge bar and hidden "Highlighted line" text as well as a tint. Targets are at least 24px (44px on coarse pointers); borders keep controls visible in forced-colors mode; nothing animates. Tabs render 4 columns wide.',
  ],
  related: ['JsonViewer', 'CodeBlock', 'CodeViewer', 'YamlViewer'],
  requires: [
    'Throws a ContractError when neither `filename` nor `label` is set.',
    'Throws a ContractError when neither `source` (a string, empty is fine) nor `value` is passed. `value` may be any value, including `null`.',
  ],
  llmNotes: [
    'Use GoViewer for read-only Go display, not an editor. It does not parse or compile Go.',
    'Pass Go text in `source` exactly as written (tabs included); pass `value` to show a JS value as a `map[string]any{...}` literal. `source` wins when both are set.',
    'Use `package="name"` only with `value`; it adds `import "math"` automatically when NaN or an infinity appears.',
    'Set `filename` (or `label`) so the scroll region has a distinct accessible name.',
    'Use `default-fold-depth` to open long files as an outline of declarations; use `start-line` for excerpts.',
    'Circular values render a `// Cannot render ...` comment instead of throwing; `goLiteral` itself throws a TypeError.',
  ],
  replaces: [],
}

export default doc
