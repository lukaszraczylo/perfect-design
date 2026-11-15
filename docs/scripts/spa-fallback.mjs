// Static hosts (GitHub Pages, Cloudflare Pages) serve 404.html for unknown paths. prerender.mjs already writes the empty
// app shell there; this only covers builds where prerendering was skipped (no Chrome available).
import { copyFileSync, existsSync } from 'node:fs'
if (!existsSync('dist/404.html') && existsSync('dist/index.html')) copyFileSync('dist/index.html', 'dist/404.html')
