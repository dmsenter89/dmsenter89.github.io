---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Reproducibility by Sharing Code"
subtitle: ""
summary: "Whenever I speak with students, I emphasize the need to share as much code and data as is feasible to enable reproduciblity. The fact that a large amount of research is not reproducible is a big issue that has gotten a lot of traction in the past two decades since Ioannidis published his influental paper."
authors: []
tags: ["reproducibility"]
categories: []
date: 2023-09-12
lastmod: 2023-09-12
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

Whenever I speak with students, I emphasize the need to share as much code and
data as is feasible to enable reproduciblity. The fact that a large amount of
research is not reproducible is a big issue that has gotten a lot of traction in
the past two decades since Ioannidis published his influental paper. Given these
issues, it is important to try to minimize other sources of variation in the
process that could lead to reproducibility problems, such as choices in how to
conduct statistical tests or how data is prepared. The many variations of the
basic research problem is something Gelman has termed the 
[garden of forking paths](http://www.stat.columbia.edu/~gelman/research/unpublished/forking.pdf).

This week I came across a paper by Ostropolets et al (2023) that really
exemplifies this. The short version is this: ask 54 researchers across 9 teams
to reproduce the cohort used in awell-documented paper in their field from the
same source data set and compare the outcomes to both the original paper and a
&ldquo;master implementation&rdquo; that was recreated with one of the original authors of
the reference paper. All researchers had access to the same tools and data set.

The result? Substantial variations in the final data set that was selected. Only
four out of ten inclusion criteria fully aligned with the reference
implementation. Note that this is just a cohort selection problem; they did not
attempt to reproduce other steps from the paper.

This goes to show how important it is to share source code in order to achieve
reproduciblity. If cohort selection had been done programmatically and the
source code shared, we would have greater assurances that future teams trying to
work with this data would be able to reproduce these findings and build on them.
As the paper puts it:

> In this regard, if we truly aspire to reproducible science, we should not hope
> that good documentation is sufficient and tolerate optional sharing of code,
> but rather make code sharing a hard requirement that can be complemented by
> free text descriptions.

See citation below for the paper's DOI. Gelman shared a PDF of this paper
on 
[his blog](https://statmodeling.stat.columbia.edu/2023/09/06/forking-paths-in-medical-research-a-study-with-9-research-teams/).

In a similar vein, he [shared](https://statmodeling.stat.columbia.edu/2023/09/10/the-authors-of-research-papers-have-no-obligation-to-share-their-data-and-code-and-i-have-no-obligation-to-believe-anything-they-write/)
a paper by Menkveld et al. (2022) in which several teams attempt to reproduce
hypothesis tests based on the same data set, again leading to substantial
variations.

A solution to this issue is regular sharing of both data and code, as much as is
feasible. In medical research in particular there are questions of
confidentiality that we need to be concerned with, but this shouldn&rsquo;t stop us
from making de-identified data available either via a supplement or having them
saved and ready should a third-party request them. This of course requires some
coordination amongst the study authors. Too often I have seen researchers not be
organized enough to be able to recover the original data set or steps in
creating an analysis they themselves did when this was needed some years after
the original study. My advice for this is to keep all information to a
particular paper in one folder as you work on it, preferably together with the
paper draft themselves so it will be obvious to future-you what paper those source
files go with. When the study is done, just archive that folder and keep a cold
copy on an external drive as well as on a storage server. This is often provided
by the university free of charge. If multiple studies use the same data set,
you'll end up with multiple copies of that data using this method, but in my
opinion that's not a problem - storage is cheap these days, particularly cold
storage. And if there are concerns about data privacy with your university's
storage, you can always encrpyt the archive prior to uploaded. GPG is your
friend here.

## References

Ioannidis, J. P. A. (2005), "Why Most Published Research Findings Are False,"
_PLOS Medicine_, 2(8):e123, DOI: [10.1371/journal.pmed.0020124](https://doi.org/10.1371/journal.pmed.0020124).

Menkveld, A. J. et al (2022), "Non-standard errors", available online at [https://wrap.warwick.ac.uk/176566/1/WRAP-non-standard-errors-Kozhan-2023.pd](https://wrap.warwick.ac.uk/176566/1/WRAP-non-standard-errors-Kozhan-2023.pdf).

Ostropolets, A. et al. (2023), "Reproducible variability: assessing investigator discordance across 9 research teams attempting to reproduce the same observational study," _Journal of the American Medical Informatics Association_, Oxford University Press (OUP), 30, 859–868. DOI: 
[10.1093/jamia/ocad009](https://doi.org/10.1093/jamia/ocad009).
