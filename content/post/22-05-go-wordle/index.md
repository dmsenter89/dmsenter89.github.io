---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Wordle in Golang"
subtitle: ""
summary: "Learning the basics of Go with a Wordle app."
authors: []
tags: ["go", "wordle"]
categories: []
date: 2022-05-05T16:30:00-04:00
lastmod: 2022-05-05T16:30:00-04:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

links:
  - icon_pack: fab
    icon: github
    url: 'https://github.com/dmsenter89/go-wordle'

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

Lately I've been playing around with [Go](https://go.dev/). I've read about Go for a few years 
and have been using some software written in Go (this website is built with [Hugo](https://gohugo.io/)),
but never tried it before. So what better way to give Go a shake
than to write some code. Since Wordle has been popular, I thought I'd write a very simple
Wordle implementation in Go; you can check it out on [GitHub](https://github.com/dmsenter89/go-wordle). 
It's been a good way for me to get familiar with some of the 
basisc of Go, such as variables and their types, functions, etc. So far I've been enjoying it.

The Go website has a very nicely written [documentation](https://go.dev/doc/) and 
[package page](https://pkg.go.dev/). The [Go Playground](https://go.dev/play/)
let's you test out Go in your browser without needing to install anything. I've also found
Bodner's "[Learning Go](https://www.oreilly.com/library/view/learning-go/9781492077206/)" to be helpful.

Go is a compiled language with a pretty picky compiler. It won't let you compile code 
with unnecessary imports and variable declarations, which help keeps your code clean. 
Cross-compilation is [built-in](https://freshman.tech/snippets/go/cross-compile-go-programs/). 
While Go is not a common language in scientific computing, the [gonum](https://www.gonum.org/) package
has implemented a number of important functions and seems to be well developed. I look forward
to learning more about Go in the future.
 
