---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Convenience Sampling and Mensa"
subtitle: ""
summary: ""
authors: []
tags: ["clinical-trials", "opinion", "sampling"]
categories: []
date: 2024-12-24T10:33:04-05:00
lastmod: 2024-12-24T10:33:04-05:00
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

Substack's algorithm for figuring out what I like to read is still serving up
some odd stuff, but this time it found a good article. In [The Mensa
Fallacy](https://www.emilkirkegaard.com/p/the-mensa-fallacy) Emil Kirkegaard
takes on [Karpinski et al (2018)](https://doi.org/10.1016/j.intell.2017.09.001)
which claimed that high intelligence is a risk factor for both psychological
and physiological disease. The claim in the paper is to a novel finding, but
Kirkegaard cites a number of studies that would indicate problems with Karpinski's
arguments.

While the language in the post is a bit on the irreverent side, this seems to be
a good example of the general difficulty with convenience studies. The latter
are all over science, and many times used without much thought. You have a
theory about a population $P$ but it's hard to actually sample $p\in P$? Luckily
for you there is a population $Q$ that is easy to sample such that $q\in Q
\Rightarrow q\in P$. That's where I've often seen it end. Maybe there's an acknowledgment
that $p\in P \nRightarrow p\in Q$, but that's obviously not surprising or else
$P=Q$ and there wasn't a problem to begin with.

So what's the problem? We've done random sampling on $Q$ and we have a nice
unbiased estimator $\hat\theta_Q$ for our population. Is my estimator _also_
unbiased for $P$? A priori we have no grounds to think so. A popular
illustration: assume I want to know the average height at my school or
university (population $P$). I have no idea how tall random students are and
it's awkward to ask, but luckily the basketball team (population $Q$) publishes
player stats that include the height of the players. So I go online, put all the
stats in an Excel sheet, calculate the mean, and call it a day. That result
would clearly not be particularly valuable for estimating the average height of
all students at the school/uni. The problem is that a random sample of $Q$ does
not necessarily translate into a random sample of $P$.

Subtle versions of this problem show up in real life research all the time. If
we know something about (relevant) ways in which $Q$ differs from $P$, then we
can make some adjustments to correct for the bias introduced by our sampling
technique. Aside from us sampling from a specific group, the issue can also crop
up when we try to "hijack" an existing RCT for secondary analysis, as for
example discussed in [this post on the Kindergarten
study](https://www.betonit.ai/p/teachers_and_inhtml) that I've been meaning to
comment on for a bit. A related issue that requires care is the use of surrogate
endpoints in clinical trials, where for example an easy and cheap to acquire lab
value functions as a stand-in for the actual issue of interest that may be
difficult, expensive or unpleasant to collect. Without a good understanding of
the relationship between a population defined by certain lab value cutoffs
compared to the endpoint of interest, this may be not interpretable or provide
much weaker evidence than we'd like.