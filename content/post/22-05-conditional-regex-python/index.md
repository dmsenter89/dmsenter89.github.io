---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Conditional RegEx Matching with Python"
subtitle: ""
summary: "When the endpoint of your match depends on an earlier term, try conditional regex matching in Python."
authors: []
tags: ["datalines", "python", "regex"]
categories: []
date: 2022-05-19T21:45:46-04:00
lastmod: 2022-05-19T21:45:46-04:00
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

Recently I've needed to capture the entries of a datalines statement in SAS for editing. Generally,
this is a straight forward problem if I only need to do it with one file or all of the files that 
I am using are formatted identically. But then I started thinking about the more general case. SAS 
doesn't care about the case of my keywords, so I need a case insensitive match. I need to account for
possible extra whitespace. So far so good. But what if I have two different keywords that can start
my data section, and the end of the data section is indicated with different characters depending on
the chosen keyword? Could I still use a single regular expression?

SAS does in fact allow a number of different keywords to enter data in a data step. 
In my experience, the most common are the [datalines](https://documentation.sas.com/doc/en/pgmsascdc/v_027/lestmtsref/p0114gachtut3nn1and4ap8ke9nf.htm)
and [datalines4](https://documentation.sas.com/doc/en/pgmsascdc/v_027/lestmtsref/p1mm9b070wj962n16q0v1d9uku5q.htm)
statements. The main difference between them is how the end of the data is indicated. For datalines,
a single semicolon is used, while datalines4 uses a sequence of four semicolons, thereby allowing
the use of semicolons in the data itself. There are some aliases for these commands that can be used:
cards/lines and cards4/lines4 with matching behavior. A simple data step with these statements
could look like this:

```SAS
data person;
  input name $ sex $ age;
  datalines; /* or `cards` or `lines` */
Alfred M 14
Alice F 13
;

data person4;
  input name $ sex $ age;
  datalines4; /* or `cards4` or `lines4` */
Alfred M 14
Alice F 13
;;;;
```

We could write two separate RegEx expressions, one for the datalines/cards/lines statement and 
a second one for the datalines4/cards4/lines4 statement. But, if the RegEx engine we are using allows
conditionals, e.g. the Python RegEx engine, then we can write a single statement that can capture
both types of statements. The basic format of the conditonal capture is ```(?(D)A|B)```, which can be read as "if capture
group D is set, then match A, otherwise match B." For more details, see [here](https://www.regular-expressions.info/conditional.html).

Using this technique, we can capture both types of statements in one go. 
The short form of the solution I found is this 
regular expression: ```r"(?:(?:(?:data)?lines)|cards)(4)?\s*;(.*?)(?(1);{4}|;)"```
with two flags set: case insensitive and dot-all. If we utilize Python's verbose flag, 
we can format this a bit nicer as well:

```Python
re.compile(
  r"""(?:(?:    # mark groups as non-capture groups
      (?:data)? # maybe match `data`, but don't capture
       lines)   # matches `lines`
      |cards)   # alternatively, matches `cards`
      (4)?      # a `4` may be present
      \s*;      # there might be whitespace before the ;
      (.*?)     # lazy-match data content
      (?(1)     # check if capture group 1 is set, if so
      ;{4}      # match `;;;;`
      |;)       # otherwise, match a single ;
  """, flags=re.DOTALL | re.X | re.I)
```

A great website to help you build up a regular expression is [regex101.com](https://regex101.com/).
It allows you to copy a sample text and regular expression. It then explains your expression and lists
the capture groups by number, which can be convenient. It also allows you to try out different RegEx engines.
Try setting it to Python with the flags we mentioned, and see how it works!
