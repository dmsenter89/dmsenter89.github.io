---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Remote Hosted, Local Jupyter?!"
subtitle: ""
summary: ""
authors: []
tags: ["jupyter", "python", "wasm"]
categories: []
date: 2024-12-23
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

If you visit the [Project Jupyter website](https://jupyter.org/) you'll
encounter a bunch of "try it in your browser" buttons. If you've used Jupyter
for a decade or so like me, you probably have also been ignoring these buttons.
And if you have clicked on them, you might have been lead to a
[mybinder.org](https://mybinder.org/). Don't get me wrong, mybinder is cool. It
creates a docker image that remote-hosts a live environment so that you can
share your interactive notebooks on the web. Cool stuff. But I just found
something better.

Have you ever heard of [WebAssembly](https://webassembly.org/), or wasm as it's
abbreviated? The elevator pitch for WebAssenmbly can be summarized as binary
format for a locally runnin, sandboxed JavaScript VM. The idea being that
computation can essentially be off-loaded from a remote server to the machine
running the browser that's viewing the website. And you can now probably guess
where this is going...

Thanks to wasm, there's now an online [JupyterLab
instance](https://jupyter.org/try-jupyter/lab/) featuring a Python kernel and a
SQLite kernel. The Python kernel is powered by
[Pyodide](https://pyodide.org/en/stable/), a WASM port of CPython. While it's
not 1-1 feature complete, it's quite impressive already. Solve an ODE with
SciPy? Data analytics with Pandas? Visualization with Matplotlib? Fancy plots
with Bokeh? This instance has got you covered. The governing [JupyterLite
project](https://github.com/jupyterlite) is open-source and even includes
instructions on [how to deploy JupyterLite on GitHub
Pages](https://jupyterlite.readthedocs.io/en/latest/quickstart/deploy.html).

What's wild to me is that yes, you can run this on a GitHub pages instance.
Because you don't actually need a backend, only a static site server, since all
computations happen locally. You access your local files when you upload from a
local VM, so even though you're "uploading" you don't actually need to share
your data with the remote server. It's quite impressive. Again, not everything
works 100% yet, but you can get surprisingly far with this setup. You can even
get a taste of it without leaving _this blog_ because you can embed a REPL
provided by JupyterLite's demo instance as an iframe. Feel free to play with the
REPL below and checkout the JupyterLite project. It's really cool.

<iframe
  src="https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1"
  width="100%"
  height="100%"
></iframe>

