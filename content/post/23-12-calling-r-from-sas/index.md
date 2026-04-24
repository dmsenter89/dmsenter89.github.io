---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Calling R From SAS"
subtitle: ""
summary: ""
authors: []
tags: ["iml", "r", "sas"]
categories: []
date: 2023-12-22
lastmod: 2023-12-22
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

The statistics literature is filled with example code and sample data in R. Sometimes I
find myself wanting to work through some provided sample data and compare the output from
R with SAS code. In this post, I'll show how to connect R and SAS so that you can load and
execute R code straight from within SAS.

## Setup

In order to use this feature, you will want to have both R and SAS/IML installed on the
same computer. Make sure both SAS and R are in your path. In order to call R code from
SAS, you will need to start SAS with the `rlang` option. You can call SAS from the command
line with the `-rlang` option or you can add the option in your "sasv9.cfg" file.

Once SAS is started, you can verify that the setup worked by running

```sas
proc options option=rlang;
run;
```
The log will list `RLANG` if the option was specified. If you forgot to add the option
prior to startup, you'll see `NORLANG` in the log instead.

## Usage

R code can be called from within IML via a submit statement. The basic structure
is this:

```sas
proc iml;
  submit / R;
    /* R code her */
  endsubmit;
quit;
```

With this we can run R code from within SAS. But the real power comes from our
ability to move data between R and SAS. The following functions are available:

- `ExportDatasetToR("libname.dsname", RDataFrame);`
- `ExportMatrixToR(IMLMatrix, RMatrix);`
- `ImportDataSetFromR(r-expr, "libname.dsname")`
- `ImportMatrixFromR(r-expr, IMLMatrix)`

Parameters can be passed to R as well, similar to how parameters can be passed
from IML to SAS PROCs.

For more details, see the SAS/IML manual.