# justfile — shortcuts for working on this site, so you don't need to
# remember any `node`/`npm`/`hugo` commands by hand.
#
# What is `just`? A tiny command runner. If it's not installed:
#   macOS:   brew install just
#   other:   see https://github.com/casey/just#installation
#
# How to use it: from the repo root, run `just` on its own to see this
# list again, or `just <recipe-name>` to run one, e.g. `just dev`.
#
# You'll also need Node.js installed for the siddur recipes below (the
# `setup`/`update*` ones) — https://nodejs.org, or `brew install node`.
# The Hugo recipes (`dev`/`build`/`update-theme`) need Hugo (extended) and
# Go, per the main CLAUDE.md.

# Show this list of recipes (same as running `just` with no arguments)
default:
    @just --list --unsorted

# ─── Siddur content: one-time / occasional setup ───────────────────────

# Restores the siddur toolkit's Node dependencies. You only strictly need
# to run this once, before the very first `just update` — but it's always
# safe to re-run.
# Install/restore the siddur toolkit's Node dependencies (safe to re-run)
setup:
    cd siddur-build && npm install

# ─── Siddur content: everyday editing ───────────────────────────────────
#
# The rule from siddur-build/README.md: data/siddur/**/*.json is the
# source of truth. Hand-edit the "hebrew" field of a rubric or text item
# directly in its JSON file, then run `just update` on that same file.
# It rewrites the file in place:
#   - normalizes every Divine Name occurrence to the site's house style
#   - regenerates "translit" for every type:"text" item
# It never touches "translation" — that field is always hand-authored.

# Leave the path off to regenerate every chapter file at once — handy after
# a batch of edits when you don't want to list them all out individually.
# (This skips data/siddur/appendix/*.json on purpose: those tables have
# their own generators below, not this per-chapter one.)
# Regenerate transliteration + Divine Name normalization for one chapter file, or every chapter file if you omit the path
update file="":
    #!/usr/bin/env bash
    set -euo pipefail
    cd siddur-build
    if [ -z "{{ file }}" ]; then
        find "{{ justfile_directory() }}/data/siddur" -name '*.json' -not -path '*/appendix/*' | sort | while IFS= read -r f; do
            node generate.mjs "$f"
        done
    else
        node generate.mjs "{{ justfile_directory() }}/{{ file }}"
    fi

# The Appendix > Transliteration page is generated straight from
# siddur-build/schema.mjs, so it can never drift from actual behavior on
# its own — but you do need to re-run this by hand after changing that file.
# Regenerate the Appendix > Transliteration reference table
update-transliteration-table:
    cd siddur-build && node generate-transliteration-table.mjs

# Regenerate the Appendix > Seder ha-Mishmarah table from its source file
update-seder-hamishmarah:
    cd siddur-build && node generate-seder-hamishmarah.mjs

# ─── Hugo site ───────────────────────────────────────────────────────────

# Start a local preview server (includes drafts) at http://localhost:1313
dev:
    hugo server -D

# This is the same command CI runs; pushing to master/main builds and
# deploys automatically, so you don't normally need to run this yourself —
# it's here mainly for double-checking a change builds cleanly before you push.
# Production build into ./public
build:
    hugo --gc --minify

# Pull in the latest release of the PaperMod theme (a Hugo Module)
update-theme:
    hugo mod get -u github.com/adityatelange/hugo-PaperMod
    hugo mod tidy
