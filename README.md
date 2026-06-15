# dmsenter89.github.io

Source for [Michael's Site](https://dmsenter89.github.io/) — a personal blog built
with [Hugo](https://gohugo.io/) and the
[PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

This repository holds the **source** for the site. The rendered HTML is built and
published to GitHub Pages automatically by a GitHub Actions workflow — there is no
longer a separate output repository or `public/` submodule.

## Structure

```
content/        Markdown content (post/, publication/, talk/, project/, about, …)
layouts/        Local overrides: KaTeX head, academic metadata, custom shortcodes
static/         Files served as-is (img/, files/)
hugo.toml       Site configuration
go.mod          Theme is vendored via Hugo Modules (PaperMod)
.github/workflows/hugo.yml   Build + deploy to GitHub Pages
```

## Local development

The theme is pulled in as a [Hugo Module](https://gohugo.io/hugo-modules/), so you
need both Hugo (extended) and Go installed. A devcontainer is provided under
`.devcontainer/` with everything preconfigured.

```bash
# Live preview at http://localhost:1313 (including drafts)
hugo server -D

# Production build into ./public
hugo --gc --minify
```

To update the theme:

```bash
hugo mod get -u github.com/adityatelange/hugo-PaperMod
hugo mod tidy
```

## Writing content

Posts live in `content/post/` as [page bundles](https://gohugo.io/content-management/page-bundles/)
(a folder with `index.md` plus any images/data files).

- **Math** is rendered with [KaTeX](https://katex.org/) and is auto-detected per page.
  Use `$…$` for inline and `$$…$$` for display math. If a page uses literal dollar
  signs (e.g. prices) and no math, set `math: false` in its front matter.
- A handful of Academic-era shortcodes are reimplemented locally in
  `layouts/_shortcodes/` (`toc`, `alert`, `staticref`, `fragment`).

## Deployment

Pushing to the default branch triggers `.github/workflows/hugo.yml`, which builds the
site with Hugo and publishes it via the GitHub Pages
[`deploy-pages`](https://github.com/actions/deploy-pages) action. Make sure the
repository's **Settings → Pages → Build and deployment → Source** is set to
**GitHub Actions**.

## License

Site content © D. Michael Senter. The PaperMod theme is distributed under the MIT
license.
