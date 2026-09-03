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

- `_partials/extend_head.html` — Loads KaTeX on single pages that contain math (detection is automatic; override per page with `math: true` / `math: false` in front matter); inlines `assets/tables.css` on pages containing a `<table>` (captions, header shading, zebra striping, horizontal-scroll overflow — see below); loads Mermaid.js on pages containing a ` ```mermaid ` fenced block, initialized to match the page's light/dark `data-theme` at load (paired with the render hook below); and inlines `assets/tabs.css` for the language-switcher code tabs (see below).
- `_partials/extend_footer.html` — Inlines `assets/tabs.js`, which wires up the language-switcher code tabs' click behavior.
- `_partials/extend_post_content.html` — Renders Academic-style metadata blocks (authors, DOI, abstract, link buttons) for `publication`, `talk`, and `project` pages by reading front matter fields like `authors`, `doi`, `url_pdf`, `url_slides`, `url_video`, `url_code`, etc.
- `_markup/render-codeblock-mermaid.html` — Render hook for ` ```mermaid ` fenced code blocks. Emits `<pre class="mermaid">` instead of letting the default Chroma syntax highlighter handle it — Chroma doesn't know the `mermaid` language and otherwise renders the block as inert fallback-highlighted text, hiding the diagram entirely.
- `_shortcodes/alert.html` — `{{% alert note %}}…{{% /alert %}}` callout (Academic-compatible).
- `_shortcodes/staticref.html` — `{{% staticref "files/x" "newtab" %}}label{{% /staticref %}}` link helper.
- `_shortcodes/toc.html` — `{{< toc >}}` inline table of contents.
- `_shortcodes/fragment.html` — No-op stub for old reveal.js `{{% fragment %}}` shortcodes.
- `_shortcodes/tabs.html` + `_shortcodes/tab.html` — Language-switcher code tabs (e.g. R / Python / SAS blocks for the same example). Usage:

  ```markdown
  {{< tabs >}}
  {{% tab name="R" %}}
  ```r
  retrodesign <- function(A, s, alpha=.05, df=Inf) { ... }
  ```
  {{% /tab %}}
  {{% tab name="Python" %}}
  ```python
  def retrodesign(A, s, alpha=0.05, df=np.inf): ...
  ```
  {{% /tab %}}
  {{< /tabs >}}
  ```

  The outer `tabs` shortcode only wraps other shortcodes (no Markdown of its own), so it uses `{{< >}}`. Each inner `tab` shortcode wraps a fenced code block and needs Markdown processing, so it uses `{{% %}}`. Getting the delimiters backwards is the most common cause of tabs rendering as raw text. Styling/behavior lives in `assets/tabs.css` and `assets/tabs.js`, picked up via Hugo Pipes (`resources.Get`) in `extend_head.html` / `extend_footer.html`.

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

### Converting a notebook export (SAS/Jupyter/Quarto) into a post

Notebook HTML exports (SAS Studio's ODS HTML5, Jupyter, Quarto, etc.) are built as self-contained standalone documents — the opposite of what a page bundle needs, since the site already has its own theme. A raw export pasted into `index.md` needs real surgery, not just a paste. Check whether the exporter has already avoided these problems before doing it by hand:

- **Strip any embedded `<style>` block entirely.** Notebook tools often emit an unscoped stylesheet at the top of the export (SAS ODS's dark-navy theme, Jupyter's `.output_area` rules). Markdown/HTML content has no CSS scoping without Shadow DOM, so an unscoped `<style>` tag bleeds into every page on the site, not just this post — this is what causes a stray background box behind graphs/tables.
- **Convert embedded graphics to plain `<img>` tags, not inline `<svg>` + wrapper divs.** SAS ODS graphics in particular ship each plot as an inline `<svg>` inside a `<div class="sas-output">` sizing box plus a `<script type="text/ecmascript">` tooltip block. Extract each `<svg>...</svg>` to its own file in the post's bundle root (verify it has no external CSS class dependency — ODS SVGs are usually self-contained via inline `style=` attributes), drop any dangling `onload=` attribute, and reference it with a plain `<img src="fig-name.svg" alt="...">`. That's what makes it behave like every other image on the site: fits the column, no overflow.
- **Never put extracted files in a directory whose name ends in `_files` or `_cache`** (e.g. Quarto's `index_files/` convention) — see the `ignoreFiles` note below. Bundle root is safe and matches every other post.
- **Flatten notebook-generated tables to a real `<table>`.** Drop per-cell classes (SAS's `data`/`header`/`rowheader`, Jupyter's Pandas `dataframe`) and any multi-row/`colspan` headers — collapse to one header row. `assets/tables.css` (loaded automatically on any page with a `<table>`) already handles captions, header shading, zebra striping, and overflow scrolling, so hand-written inline table styles are almost never needed. Give it a `<caption>` if the source had a title bar, and wrap it in `<div class="table-wrap">…</div>` so it gets the overflow handling.
- **Delete tooltip/interactivity `<script>` blocks and `onload` handlers.** They reference JS functions that only exist inside the notebook tool's own runtime; dropping them is safe (an `<img>` never executes embedded SVG script) and removes dead weight.
- **Mermaid diagrams** need no special content-side handling — just confirm the exporter emits a plain ` ```mermaid ` fenced block, not one wrapped in extra HTML. Rendering is automatic (see `render-codeblock-mermaid.html` above).

If you maintain the exporter script rather than cleaning up its output by hand: doing the `<svg>`-to-standalone-file-plus-`<img>` extraction and table flattening in the exporter itself eliminates most of the manual work above.

### Configuration notes

- `hugo.toml` sets `ignoreFiles` to exclude `.ipynb`, `.Rmd`, `.Rmarkdown`, and paths ending in `_files`/`_cache`. **This is a path-suffix match, not a filename match** — it silently excludes an entire directory tree if its path ends that way (e.g. Quarto's `index_files/` figure-output convention, or `.ipynb_checkpoints/`). The build succeeds and the page can reference an image inside such a directory with zero warning, yet the file never lands in `public/`. Keep post assets (images, SVGs, data files) directly in the bundle root instead.
- Taxonomy URLs use singular forms (`/tag/`, `/category/`) to match old Academic site links.
- Search is client-side via Fuse.js, powered by the JSON output format enabled in `[outputs]`.

### Siddur (`/siddur/`)

A personal, unlinked (`noindex, nofollow`, not in `[[menu.main]]`) daily
siddur at `/siddur/`, mobile-first — the point is jumping straight to one
short prayer, not browsing. Fully separate chrome from the rest of the
site: `layouts/siddur/{baseof,list,single}.html` don't extend PaperMod at
all (no header/footer/breadcrumbs), styled by `assets/siddur.{css,js}`.
Content is JSON-driven (Hebrew/transliteration/translation per item) in
`data/siddur/`, rendered by `content/siddur/**/*.md` files that carry only
front matter (`title`, `weight`) — Parts are Hugo sections
(`content/siddur/daily/`), Chapters are flat `.md` files inside them, named
only (no numbering) and ordered by `weight`.

Adding or editing chapter content is a two-repo-area workflow: edit the
JSON in `data/siddur/`, then run it through the transliteration/Divine Name
toolkit in `siddur-build/`. **Read `siddur-build/README.md` before touching
any siddur content** — it covers the JSON schema, the `generate.mjs`
workflow, the Divine Name normalization convention (and why it's vocalized
`יְיָ` rather than the more common `י״י`), gender-variant inline labels, and
how shared content (e.g. the Shema, reused across chapters) works via
`type: "include"` items.

### Deployment

Pushing to `master` (or `main`) triggers `.github/workflows/hugo.yml`, which builds with Hugo and publishes to GitHub Pages via `actions/deploy-pages`. No manual deployment step is needed. The repository's Pages source must be set to **GitHub Actions** in Settings → Pages.
