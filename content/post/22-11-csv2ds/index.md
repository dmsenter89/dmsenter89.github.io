---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "CSV2DS"
subtitle: "Converting a CSV File to a SAS Data Step"
summary: "CSV2DS is a new program I wrote in Go to help me create minimum working examples for SAS that can be shared as a single SAS script."
authors: []
tags: ["csv", "data-step", "go", "sas"]
categories: []
date: 2022-11-23T16:43:28Z
lastmod: 2022-11-23T16:43:28Z
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
  url: https://github.com/dmsenter89/csv2ds

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

Creating a minimum working example (MWE) is a relatively frequent task. It is no problem to share an MWE for a feature in SAS because a large number of example data sets are shipped and installed by default. But sometimes you need an MWE because you are having trouble accomplishing a particular task with particular input data. At that point, you will need to share the data or a subset thereof together with your code. In SAS Forums, the preferred way to do this is with a datastep using a datalines/cards statement. Writing these by hand can be tedious since the data source is not typically a datalines statement to begin with. I have previously seen a SAS macro that can be used to generate a datalines statement from a SAS data set, but can't seem to locate it at the moment. The data source I personally encounter the most often in my work is either in CSV or Excel formats. Since the latter can easily be exported to CSV, I decided to write a program that generates a SAS data step given a CSV file.

For the implementation language I chose to use [Go](https://go.dev/). I started learning about Go back in May when I implemented a [simple CLI version of Wordle]({{< relref "/post/22-05-go-wordle" >}}). Since then I have increasingly used Go to write various small tools at work. It has been a very enjoyable language to write in and distribution via GitHub is easy. If you have the Go toolchain installed, you can get the latest copy of csv2ds using 

```sh
go install github.com/dmsenter89/csv2ds@latest
```

The tool is very simple to use. Give it a CSV file or list of CSV files and it will generate a data step for each file using the CSV's base name as the data set name. To ensure compatibility, variable names and the data set name are processed to be compatible with SAS' naming scheme. The tool will attempt to guess if a particular column is numeric or not. If a column is determined to not be numeric, the longest cell will be used to set that variable's length via a length statement to prevent truncation. 

I often work with the [csvkit](https://csvkit.readthedocs.io/en/latest/) suite of command-line tools. It's a wonderful collection of Python programs that can import data into CSV, generate basic column statistics, and use grep and SQL to extract data from a CSV file, amongst other things. This collection is designed to allow you to pipe the output from one as input to the next. Consider [this example](https://csvkit.readthedocs.io/en/latest/tutorial/2_examining_the_data.html#csvsort-order-matters). Csvcut is used to extract only certain columns from the file data.csv. Then csvgrep is used to subset to use only the data pertaining to one particular county. Then the data is sorted by the total_cost variable and displayed. I wanted my tool to be compatible with this suite, so if `-` is passed as the filename, csv2ds will read the contents of STDIN instead. Changing the above csvkit example by replacing csvlook with my tool will generate the corresponding SAS data set: 

```sh
csvcut -c county,item_name,total_cost data.csv | csvgrep -c county -m LANCASTER | csvsort -c total_cost -r | csv2ds -
```

At this point csv2ds is quite simple, but sufficient for my needs. Some minor intervention may be needed to make the data step template work for your data. Informats like DOLLAR are not recognized as numeric and minor edits would need to be made to the produced template.

Checkout my new tool over on [GitHub](https://github.com/dmsenter89/csv2ds).
