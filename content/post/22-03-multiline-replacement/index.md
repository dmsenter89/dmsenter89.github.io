---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Multline Bash Variable Replacement"
subtitle: ""
summary: ""
authors: []
tags: ["awk", "bash", "data-step", "sed"]
categories: []
date: 2022-03-16T09:23:12-04:00
lastmod: 2022-03-16T09:23:12-04:00
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

I've recently needed to append several lines of data to a SAS data step that I collected and built
via a shell script. For search-and-replace in bash I typically use sed, but this time I ran into a problem -
sed does not like multiline shell variables. Thanks to Stack, I found a way to accomplish this task using awk instead.

Suppose you have a file called data.sas with the following contents:
```sas
data person;
   infile datalines delimiter=','; 
   input name :$10. dept :$30.;
   datalines4;                      
John,Sales
Mary,Accounting
Theresa,Management
Stewart,HR
;;;;
run;
```
Note that I am using a datalines4 statement so that I get an easy to identify target for the substitution.
I want to insert a multiline shell variable before the `;;;;` to add my data to this data step. Say I have the
following variable:
```sh
NEWDATA=$(cat <<-END
Will,Compliance
Sidney,Management
END
)
```
If I try to use sed (`sed "s/\;\{4\}/$DATA\n;;;;/" data.sas`) I will get an error about an unterminated s command.
Instead of sed, I can use awk with a variable to achieve the same goal:
```sh
awk -v r="$NEWDATA\n;;;;" '{gsub(/;{4}/, r)}1' data.sas
```
The one downside is that awk does not have an in-place option like sed, and if I try to redirect to the same file 
I'm reading from I get an empty file out. So you'll have to rename the original file in your processing script to
achieve a similar effect as with the inplace option in sed.

For additional approaches, see this [StackOverflow Question](https://stackoverflow.com/q/10107459).
