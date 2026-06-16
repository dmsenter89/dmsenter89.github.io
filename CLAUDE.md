# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal blog at `https://dmsenter89.github.io/` built with Hugo (extended) and the PaperMod theme. The theme is pulled in as a Hugo Module (not a git submodule), so both Hugo extended and Go must be present. The `public/` directory is produced by CI and should not be committed.

## Commands

```bash
# Live dev server with drafts at http://localhost:1313
hugo server -D

# Production build into ./public
hugo --gc --minify

# Update the PaperMod theme
hugo mod get -u github.com/adityatelange/hugo-PaperMod
hugo mod tidy
```

Hugo version pinned in CI: **0.163.0 extended** (see `.github/workflows/hugo.yml`). Go 1.24+ is required for Hugo Modules.

The devcontainer also installs `lmt` (`go install github.com/driusan/lmt@latest`), a literate-markdown tool used to tangle code blocks out of a small number of posts.

## Architecture

### Content sections

| Section | Path | Notes |
|---|---|---|
| Posts | `content/post/` | Page bundles; recent posts grouped by year under `content/post/24/`, `content/post/25/`, etc. |
| Publications | `content/publication/` | Metadata-heavy front matter; body is optional |
| Talks | `content/talk/` | Similar to publications |
| Projects | `content/project/` | Similar to publications |
| Static pages | `content/` root | `about.md`, `search.md`, `archives.md`, `privacy.md`, `terms.md` |

All posts/talks/publications/projects use **page bundles** (a folder named for the slug containing `index.md` plus any images or data files).

### Custom layouts (`layouts/`)

- `_partials/extend_head.html` — Loads KaTeX on single pages that contain math. Detection is automatic (regex over raw content for `$$`, `\(`, `\[`, or `$…$`); override per page with `math: true` / `math: false` in front matter.
- `_partials/extend_post_content.html` — Renders Academic-style metadata blocks (authors, DOI, abstract, link buttons) for `publication`, `talk`, and `project` pages by reading front matter fields like `authors`, `doi`, `url_pdf`, `url_slides`, `url_video`, `url_code`, etc.
- `_shortcodes/alert.html` — `{{% alert note %}}…{{% /alert %}}` callout (Academic-compatible).
- `_shortcodes/staticref.html` — `{{% staticref "files/x" "newtab" %}}label{{% /staticref %}}` link helper.
- `_shortcodes/toc.html` — `{{< toc >}}` inline table of contents.
- `_shortcodes/fragment.html` — No-op stub for old reveal.js `{{% fragment %}}` shortcodes.

### Front matter conventions

Posts use YAML front matter. Common fields:

```yaml
title: "Post Title"
date: 2025-01-15
tags: ["sas", "missing-data"]
summary: "One-line summary shown in listings."
draft: false
math: false   # omit to let KaTeX auto-detect; set false to suppress on pages with bare $ signs
```

Publication/talk/project pages additionally support: `authors`, `publication`, `doi`, `abstract`, `url_pdf`, `url_code`, `url_slides`, `url_video`, `url_dataset`, `url_poster`, `url_source`, `event`, `event_url`, `location`.

### Configuration notes

- `hugo.toml` sets `ignoreFiles` to exclude `.ipynb`, `.Rmd`, `.Rmarkdown`, and related cache/output dirs — these source files can live alongside posts without being rendered.
- Taxonomy URLs use singular forms (`/tag/`, `/category/`) to match old Academic site links.
- Search is client-side via Fuse.js, powered by the JSON output format enabled in `[outputs]`.

### Deployment

Pushing to `master` (or `main`) triggers `.github/workflows/hugo.yml`, which builds with Hugo and publishes to GitHub Pages via `actions/deploy-pages`. No manual deployment step is needed. The repository's Pages source must be set to **GitHub Actions** in Settings → Pages.
