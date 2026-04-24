---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "SAS Markdown for Reproducibility"
subtitle: ""
summary: ""
authors: []
tags: ["knitr","reproducibility", "rstudio", "sasmarkdown", "sas"]
categories: []
date: 2022-11-11T15:00:00Z
lastmod: 2022-11-11T15:00:00Z
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

One of the coolest packages for R is [knitr](https://yihui.org/knitr/). Essentially, it allows you to combine explanatory writing, such as a paper or blog post, directly with your analysis code in a Markdown document. When the target document
is compiled ('knitted'), the R code in the document is run and the results inserted into the final document. The target document could
be an HTML or a PDF file, for example. This is great for many reasons. You have a regular report you want to run, but the data updates?
Just re-knit and your entire report is updated. No more separate running of the code followed by copying the results into whatever 
software you use to build the report itself. This makes it not just less cumbersome, but less error prone. It also improves reproducibility.
Somebody wants to see your work, perhaps because they are unsure of your results or they want to extend your work? You can share the 
markdown file and the other party can see exactly what code was used to generate what part of your report or paper. 

While knitr is certainly not the first package that allows for this workflow, and also not the only one, I have found it to be the most consistent and easy to use.[^1] Luckily, knitr supports [a variety](https://yihui.org/knitr/demo/engines/) of [languages](https://bookdown.org/yihui/rmarkdown/language-engines.html), including [SAS](https://bookdown.org/yihui/rmarkdown-cookbook/eng-sas.html). And you can even mix and match multiple languages in [one document](https://github.com/yihui/knitr-examples/blob/master/106-polyglot.Rmd).[^2] 

You might think that this sounds similar to Jupyter notebooks. While that is true, and there is a [Jupyter kernel for SAS](https://github.com/sassoftware/sas_kernel) as well, knitr has some advantages over Jupyter for report-generation. Without additional tools, you have the option to execute but not display the code that generates your results, making a cleaner report. You can also elect to only show part of the code, with manual setup code running behind the scenes without being printed to the report itself. Additionally, the entire document is executed linearly. That means that if you update a code chunk towards the beginning of your document, it affects the code chunks following it, while in Jupyter you easily get in the habit of executing the chunks independently which can lead to inconsistencies if you don't pay attention to the cell numbers.[^3]

In this post, I'll demonstrate the basics of setting up a reproducible report using the SAS engine in knitr.

## Install 
Perhaps the easiest way to get started for beginners is to use RStudio and Anaconda. With that you can create a sample R Markdown document (`File -> New File -> R Markdown`). Press the `knit` button. If any packages required by knitr are missing, RStudio will install them for you. This way you can be sure that all the R parts are set up correctly. Additionally, I recommend installing the [SASmarkdown](https://github.com/Hemken/SASmarkdown) package with

```r
# from CRAN:
install.packages("SASmarkdown")
# from GitHub: 
devtools::install_github("Hemken/SASmarkdown")
```

Once install is complete, load the package (`library(SASmarkdown)`) and check the output. If you see a message that SAS was found, you are good to go. If not, you will either need to add SAS to your PATH or simply provide the path to SAS as an option in your document (see below).

## A Basic Markdown File

The important thing is to load the SASMarkdown package in your document. I recommend making a setup chunk at the very top of your document and setting include to FALSE. 
That way the setup chunk is executed, but not printed to your final document.

````
```{r setup, include=FALSE}
library(SASmarkdown)
# if SAS is not in your path, define it manually:
saspath <- "C:/Program Files/SASHome/SASFoundation/9.4/sas.exe"
knitr::opts_chunk$set(engine="sashtml", engine.path=saspath)
```
````

With that, we're ready to run a basic SAS chunk using just the SAS option. This produces the typewriter-style output that is familiar from Enterprise Guide for example:

````sas
```{sas example1}
proc print data=sashelp.class; run;
```
````

If we want to take advantage of the modern HTML output that is standard in SAS Studio, we use the `sashtml` engine instead:

````sas
```{sashtml example2}
/* if you want, you can set an ODS style for HTML output: */
ods html style=journal;
proc print data=sashelp.class; run;
```
````

If you want graphical output, for example from SGPLOT, you'll need to use the `sashtml` engine. To get the default blue look from SAS Studio, use the HTMLBLUE style:

````sas
```{sashtml example3}
ods html style=HTMLBLUE;
proc sgplot data=sashelp.cars;
  scatter x=EngineSize y=MPG_CITY;
run;
```
````

## Some Additional Comments
The first thing that is important to note is that each chunk is processed _separately_. That means each chunk should be written so as to be capable of being executed independent of the others. It is possible to get around this using the `collectcode=TRUE` chunk option. This chunk will then subsequently be executed prior to the code from a following chunk. So for example:

````sas
```{sashtml save1, collectcode=TRUE}
data sample;
  set sashelp.class;
run;
```
  And now use it again:
```{sashtml save2}
proc means data=sample; run;
```
```` 

This is particularly useful for libnames and setting the preferred ODS style, so you don't have to keep doing it again in each cell.

The other thing to note is that knitr for SAS works best with HTML output. It can use SAS styles and produce output looking like what
you would expect running in SAS Studio. If you want PDF output, you can get nicer output using [LaTeX Tagsets for ODS](https://support.sas.com/rnd/base/ods/odsmarkup/latex.html) and the [StatRep System](https://support.sas.com/rnd/app/papers/statrep.html).

[^1]: knitr itself was based on Sweave, but uses Markdown instead of LaTeX code. Other languages have similar packages, for
example [pweave](https://mpastell.com/pweave/) for Python or [Weave](https://docs.juliahub.com/Weave/9EzOc/0.9.4/) for Julia.

[^2]: The chunks from different languages do not have access to each other's data. To move data between the different engines,
more setup work is needed.

[^3]: If you code in Julia, there is an interesting new reactive notebook called [Pluto](https://github.com/fonsp/Pluto.jl) that
promises to always keep your cells in sync, while being geared towards a Jupyter-style workflow.
