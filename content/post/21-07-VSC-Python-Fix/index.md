---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Making VS Code and Python Play Nice on Windows"
subtitle: ""
summary: ""
authors: []
tags: ["python", "vscode", "windows"] 
categories: []
lastmod: 2021-07-21T08:49:52-04:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

One of the editors I use regularly is VS Code. I work a lot with Python, but when installing Anaconda 
using default settings on a Windows machine already having VSC installed there's a good chance you'll run into
an issue. When attempting to run Python code straight from VSC you may get an error. This should be fixed
on some newer versions of Anaconda, but I've needed to do something about it often enough I feel it's
useful to save the solution [janh](https://stackoverflow.com/users/1072989/janh) posted on 
[StackExchange](https://stackoverflow.com/questions/54828713/working-with-anaconda-in-visual-studio-code).

Specifically, the issue can be fixed by manually changing VSC's default shell from PowerShell to CMD.
Just open the command palette (CTRL+SHIFT+P), search "Terminal: Select Default Profile" and switch to
"Command Prompt". Everything should work as expected from now on!
