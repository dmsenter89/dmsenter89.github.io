---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Cross Compiling With Go"
subtitle: ""
summary: "When using compiled languages like C/C++, Go, Rust, etc. a separate binary needs to be created for every OS and architecture the software is meant to run on. Cross-compilation can be daunting at first. In Go, it is built-in and straightforward to use."
authors: []
tags: ["cross-compiling", "go"]
categories: []
date: 2022-08-11T09:15:00-04:00
lastmod: 2022-08-11T09:15:00-04:00
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

A big difference between using compiled languages like C/C++ compared to scripting languages
like Javascript or Python is that prior to execution, compiled languages require an explicit 
compilation step where the human readable code is translated to machine code for execution, 
the so-called "binary" of the code. Typically, a separate binary needs to be compiled for 
each target operating system and architecture. Compiling for your own machine is not a problem.
The difficulty lies in creating binaries for machines that you don't normally use, so you might 
not have an extra Mac lying around just to compile your program on for other Mac users.
Compiling programs for an operating system or architecture other than the one you are working
with is called cross-compiling. This would allow a Linux developer to create binaries for 
Windows and Mac computers, for example. 

For most languages, this requires installing additional development tools and increases the 
complexity of the compilation workflow. I have found Go to be a pleasant exception to this,
because cross-compilation is built into the standard Go tools. There is no need to learn 
any additional build-tools. All you need to learn about are some system variables that you
need to set when compiling. 

Go build tools know which system you are building for by checking the GOOS and GOARCH environment 
variables. If they are unset, the tools fall back to GOHOSTOS and GOHOSTARCH. In other words, 
to change the target OS/architecture for your build, all you have to do is set the GOOS and GOARCH
variables during the build. So say you want to build a simple program hello.go for a Windows 
computer with the same architecture as your development machine. All you have to do is write

```bash
GOOS=windows go build hello.go
```

instead of just `go build hello.go` and you're good to go. This would produce a `hello.exe` 
binary you could copy to a Windows machine to run. 

To check what combinations of GOOS and GOARCH are valid, run `go tool dist list`. To see 
which environment variables Go is currently seeing, run `go env`.
