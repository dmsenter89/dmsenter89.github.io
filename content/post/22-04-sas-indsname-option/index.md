---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "The INDSNAME Option in SAS"
subtitle: ""
summary: ""
authors: []
tags: ["data-step", "merging", "sas"]
categories: []
date: 2022-04-20T11:42:02-04:00
lastmod: 2022-04-20T11:42:02-04:00
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

I frequently find myself needing to concatenate data sets but also wanting to be able to distinguish
which row came from which data set originally. Introductory SAS courses tend to teach the `in` keyword,
for a workflow similar to this:

```SAS
data Concat1;
set data1(in = ds0)  
    data2(in = ds1);
if ds0 then source = "data1";
else if ds1 then source = "data2";
run;
```

With more than two input data sets, this can get unwieldy and repetitive. In an old [blog post](https://blogs.sas.com/content/iml/2015/08/03/indsname-option.html)
on Rick Wicklin's DO LOOP, a better method is introduced - the `indsname` option. Using this method, the above code looks much nicer:

```SAS
data Concat2;
set data1-data2 indsname = source;  /* the INDSNAME= option is on the SET statement */
libref = scan(source,1,'.');        /* extract the libref */
dsname = scan(source,2,'.');        /* extract the data set name */
run;
```

As long as your input data sets are reasonably named, you'll now have access to all the information needed.

