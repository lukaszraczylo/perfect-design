"""Rewrite third-party imports in library SOURCE files to the in-house helpers (idempotent)."""

import os
import re
import sys

src = os.path.abspath("packages/ui/src")
RULES = [
    (r"from 'class-variance-authority'", "lib/cva"),
    (r"from '@fortawesome/free-solid-svg-icons'", "lib/icons"),
    (r"from '@fortawesome/fontawesome-svg-core'", "lib/icons-tools"),
    (r"from '@vueuse/core'", "lib/use-helpers"),
]
changed = 0
for d, _, files in os.walk(src):
    for f in files:
        if not f.endswith((".vue", ".ts")):
            continue
        if f.endswith(".docs.ts") or f.endswith(".test.ts"):
            continue
        if "__tests__" in d:
            continue
        p = os.path.join(d, f)
        if p.startswith(os.path.join(src, "lib")):
            continue
        s = open(p).read()
        o = s
        rel = os.path.relpath(os.path.join(src, "lib"), d)
        if not rel.startswith("."):
            rel = "./" + rel
        for pat, target in RULES:
            s = re.sub(pat, "from '%s/%s'" % (rel, target.split("/")[1]), s)
        if s != o:
            open(p, "w").write(s)
            changed += 1
print("files changed:", changed)
