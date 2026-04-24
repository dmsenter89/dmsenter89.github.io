---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Explore C Code With GNU Tools"
subtitle: ""
summary: ""
authors: []
tags: ["c"]
categories: []
date: 2023-07-24
lastmod: 2023-07-24
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

This post will introduce three GNU tools to help you explore your C code: ctags, cscope, and cflow.
The first two can help you navigate your code as you work on it and can be used directly within Vim.
Cflow on the other hand produces control charts that help you get to know the control flow in a project,
which is particularly helpful if you are new to the codebase. 

## ctags

In short, ctags is a program that can generate a file listing C symbols in a way that can be used by 
Vim (ctags) or by Emacs (etags). Various versions exist. See [this wiki page](https://en.wikipedia.org/wiki/Ctags)
for some links. A current maintained version of universal ctags can be found on [GitHub](https://github.com/universal-ctags/ctags).
Universal ctags expands on the original ctags by including support for additional languages.

The first step to using a ctags file is to generate one for your source code. Just run `ctags` followed by the
location of your source files. If you have multipled directories, you can list them sequentially like this:

```sh
$ ctags h/* src/*
```

This will generate a "tags" file in the current folder. If you open Vim from the same folder, the tags file 
is automatically loaded. What is particularly useful about the tag file is that saved keywords are addressed by
patterns, not line numbers. This way, minor edits don't require ctags to be re-run. 

### Basic Usage

To find the definition of a C symbol in your source code, put your cursors on the symbol and press `<Ctrl-]>` to
jump to that symbol's definition. To get back to where you were, press `<Ctrl-t>`. If the symbol has multiple
definitions and you jumped to the wrong one, try using the `:tselect` command to bring up a list of all matches.

| Command | Effect | 
|---------|--------|
| `<Ctrl-]>` | Jump to definition of the keyword under the cursor. |
| `:ta[g] {ident}` | Jump to the definition of `{ident}`. | 
| `<Ctrl-t>` | Jump back up the tag stack. |
| `:tags` | Show content of tag stack. |
| `:po[p]` | Jump to older entry in tag stack. |
| `:ta[g]` | Jump to newer entry in tag stack. |
| `:ts[elect] [ident]` | List tags that match `[ident]`. |
| `:sts[elect]` | Same as above, but splits window for tag. |

For details, see `:help tags` in Vim.

## cscope

The cscope program has more advanced features compared to ctags. In addition to finding symbol definitions,
it can gather more advanced information than ctags. Specifically, it can tell you

- where a symbol is used in the code,
- where the symbol was defined,
- where a variable got its value from,
- what other functions call this function,
- what functions are called by a specific function,
- and more.

Similar to ctags, a database file is created by the csope program. You can run it like this:

```sh
$ cscope -b h/* src/*
```

This will generate a `cscope.out` file that can be used with Vim. To make the cscope database
available, you need to add it during your Vim session by using `:cs[cope] add {file|dir}`. 
By adding the following to your `.vimrc` you can automate this:

```vim
if has("cscope")
    " add any database in current directory
    if filereadable("cscope.out")
        cs add cscope.out
        " else add database pointed to by environment
    elseif $CSCOPE_DB != ""
        cs add $CSCOPE_DB
    endif
endif
```

### Basic Usage

The basic command used is `:cs find {querynum|querytype} {name}`, with the following main query types:

| querynum | querytype | Effect                                            |
|:--------:|:---------:|---------------------------------------------------|
| 0        | `s`       | Find this C symbol                                |
| 1        | `g`       | Find this definition                              |
| 2        | `d`       | Find functions called by this function            |
| 3        | `c`       | Find functions calling this function              |
| 4        | `t`       | Find this text string                             |
| 6        | `e`       | Find this egrep pattern                           |
| 7        | `f`       | Find this file                                    |
| 8        | `i`       | Find files #including this file                   |
| 9        | `a`       | Find places where this symbol is assigned a value |

For details, see `:help cscope` in Vim. For some suggested options and keymappings that make
using cscope more convenient, see `:help cscope-suggestions`. You can also use the `querynum`
to perform a single search using the cscope cli interface, e.g.: `cscope -L{querynum} {name} [-d]`
where `[-d]` suppresses updating the cscope database.


## cflow

GNU [cflow](https://www.gnu.org/software/cflow/) is a tool that creates charts showing control
flow within your program. It has a _lot_ of options and settings, so you'll definitely want to
check out its [documentation](https://www.gnu.org/software/cflow/manual/).

The most basic usage is `cflow {file[s]}` which creates an indented listing of function calls
starting from `main()`. Two important command line options are `--main` which allows you to
set a different starting function, and `--target` which allows you to set a target function
below which you don't want to investigate. If you want to include functions that aren't directly
reachable from `main()` or `--main` in your chart, use the `--all` flag.

A particularly nifty feature is that cflow can generate valid dot files using 
`cflow -f dot {file[s]}`. These can be piped to graphviz to produce visual charts of your
function calls, e.g.:

```sh
$ cflow -f dot example.c | dot -Tpng -o flow-example.png
```

