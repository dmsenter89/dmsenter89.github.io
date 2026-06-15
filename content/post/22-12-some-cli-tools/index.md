---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Some CLI Tools"
subtitle: ""
summary: "A few convenience CLI tools I find myself installing on new systems regularly."
authors: []
tags: ["cli", "linux"]
categories: []
date: 2022-12-07T15:38:16Z
lastmod: 2023-01-03T10:30:00-05:00
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

There are certain CLI tools that I find myself installing whenever I set up a new system. I'm not talking about the general system setup, like installing vim or Python, but some drop-in replacements for older Linux tools and some cli solutions that I use quite regularly. I thought I would collect them here for convenience. The headers are sorted alphabetically, except that "Other" is last because that seems most sensible.

{{< toc >}}

## "Better" Drop-Ins

The following tools I use as "better" drop-ins for other commands. Instead of `ls`, I typically now use [exa](https://github.com/ogham/exa). Instead of grep, I tend to use [ripgrep](https://github.com/BurntSushi/ripgrep). Instead of `find`, I tend to use [fd](https://github.com/sharkdp/fd). For quick viewing of text-files with syntax highlighting, I like [bat](https://github.com/sharkdp/bat) over `cat`. As a git/diff pager with syntax highlighting I use [delta](https://github.com/dandavison/delta). All of these tools are written in Rust. The old `df` command can be improved with [duf](https://github.com/muesli/duf), a Go implementation with output that's nicer to read (and alternatively, outputs as JSON).

## Data and File Wrangling

#### Calculator

A great CLI calculator implemented in C++ is [Qalculate!](https://qalculate.github.io/index.html). It is mainly intended to be run with a Qt or GTK GUI, but does include a CLI version that can be invoked with `qalc`. A Rusty alternative is [rink](https://github.com/tiffany352/rink-rs). A benefit of rink is that if you are trying to convert incompatible units, it will make a suggestion for a transformation that makes each side compatible, which can help with dimensional analysis. A good Rusty calculator app without units but wide support of operations, including functions, is [kalker](https://github.com/PaddiM8/kalker).


#### CSV and JSON

CSV files are ubiquitous, and being able to manipulate them and get an overview of what is contained without needing to actually load them in Excel/Python/SAS/etc is very useful. I used to really like [csvkit](https://csvkit.readthedocs.io/en/latest/index.html) for that. The main drawback here is speed for large CSV files, due to it being implemented in Python. A must faster program written in Rust is [qsv](https://github.com/jqnatividad/qsv), successor to BurntSushi's [xsv](https://github.com/BurntSushi/xsv). It has more features than csvkit, is faster, and seems more flexible. 

Another cool Python program for interacting with CSV files is [visidata](https://www.visidata.org/). It is a CSV viewer that doubles as a spreadsheet program, allows you to make plots and statistics and just do a ton of different things with your file in-memory.

The C program [jq](https://github.com/stedolan/jq) aims to be the `sed` of working with JSON files. 

#### File Managers

There are *a lot* of file managers to choose from these days. There are lots of popular options like mc, ranger, nnn, but I tend to keep falling back on [vifm](https://github.com/vifm/vifm).

## Development

If you need to benchmark something, try Rusty old [Hyperfine](https://github.com/sharkdp/hyperfine). There is an interesting make alternative called [just](https://github.com/casey/just), which looks promising but I haven't played with it yet.


## Resource Management

#### Disk Space

There are several excellent tools here. One that can be found in most repos I've encountered is [Ncdu](https://dev.yorhel.nl/ncdu), a disk usage analyzer with an ncurses interface written in C. It is reasonably fast and let's you interactively delete folders while you're at it. A parallel implementation of the same idea but written in Go can be found with [gdu](https://github.com/dundee/gdu). For non-interactive use, [dust](https://github.com/bootandy/dust) (du + rust) is available.

#### System Status - General

One of the first tools I usually install is [htop](https://github.com/htop-dev/htop). It is a widely available and fast process viewer written in C. You can use it to kill or renice a process interactively without needing to find its PID. An alternative to this is [glances](https://github.com/nicolargo/glances), "an eye on your system" written in Python. It has a lot more information, including disk usage, sensor temperatures, battery information (on laptops), etc. and can be extended with plugins. It can be used interactively on the CLI, but it also gives the option of running in client/server mode which is nifty.

Similar to glances, [bottom](https://github.com/ClementTsang/bottom) is a Rust program giving general system information including plots, but it does not have quite the same range of information to it as glances does.

#### System Status - Networking

To see what is clogging up your internet pipes, try [nethogs](https://github.com/raboof/nethogs) written in C++. A nice rusty alternative is [bandwhich](https://github.com/imsnif/bandwhich).


## Other

Trying to figure out when it's a good time to speak with a colleague in a different time zone? Install the Python package [undertime](https://gitlab.com/anarcat/undertime).

Don't want to remeber different package manager's syntax? Install [pacapt](https://github.com/icy/pacapt) and use ArchLinux' pacman syntax on your system instead.
