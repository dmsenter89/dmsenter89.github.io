---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Takeaways from 'On the uses and abuses of regression models'"
subtitle: ""
summary: ""
authors: []
tags: ["education","modeling","preprint","regression","takeaways"]
categories: []
date: 2024-03-19
lastmod: 2024-03-19
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRig
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

This weekend I found an interesting new preprint by Carlin and Moreno-Betancur
on arxiv titled ["On the Uses and Abuses of Regression
Models"](https://arxiv.org/abs/2309.06668) so I had to check it out.

The article focuses on medical literature, where regressions -- even in my
experience -- often seem done almost automatically and then interpreted
depending on the the _desired_ question as opposed to with respect to model
construction. ["Garbage can"
regressions](https://doi.org/10.1080/07388940500339167) to find "important risk
factors" abound, as do repeat fittings  of simple models in an attempt to
describe a joint distribution. One of my favorite examples to show in class of
the issues with the latter is a 2008 paper by [Wang et al.](
https://doi.org/10.1038/oby.2008.351) that to date has been cited more than
1,000 times. The topic of the paper is an analysis of NHANES data with the aim
of predicting the prevalence of obesity in the US. They desire to describe how
different subgroups of Americans, that is the different genders and ethnicities,
fare. Instead of fitting a joint model, they fit multiple linear models. This
leads to fun results in their Table 2, where _all_ Americans of _all_ races and
ethnicities will be obese by 2048, yet _all men_ won't be obese until 2051.
Mexican-American men fare the best, as they escape being part of _all Americans_
somehow and won't reach 100% prevalence until 2126.

Carlin and Moreno-Betancur describe these and other issues they encountered in
the literature. One I find notable is what they call the "true model myth."
Essentially, the idea that that the "best" fitted model represents the data
generating process, ergo the coefficients are easily interpreted in a causal
manner so we can derive practice recommendations from these models without much
discussion. That is of course not accurate.

Overall, Carlin proposes a simple classification scheme for the different
purposes of a regression analysis:

1. "descriptive:" characterise the distribution of a feature or health outcome
   in a population,
2. "predictive:" produce a model or algorithm for predicting future values given
   certain predictors,
3. "causal:" investigate the extent to which a health outcome in some population
   would be different if a particular intervention were made.

Since they understand the problem with the misuse and misinterpration of
regression to (at least partially) be due to a certain vagueness with respect to
the purpose for which the regression is fit, they propose a teaching framework
centered around these types of research questions. This is in opposition of the
more "traditional" focues on the "maths" of the problem. In other words, focus
more on using standard tools to answer specific questions, than learning how to
do simple problems "by hand" and then hoping that eventually people will figure
out the hard parts of applying the theory to real life on their own.

Overall, I think the paper is a worthwhile read. It reminds me of two other
books I like that take a model-centric approach to teaching regression methos --
McElreath's ["Statistical
Rethinking"](https://www.routledge.com/Statistical-Rethinking-A-Bayesian-Course-with-Examples-in-R-and-STAN/McElreath/p/book/9780367139919)
and ["Regression and Other
Stories"](https://avehtari.github.io/ROS-Examples/index.html) by Gelman, Hill,
and Vehtari. Gelman also posted about this preprint on [his
blog](https://statmodeling.stat.columbia.edu/2024/03/17/on-the-uses-and-abuses-of-regression-models-a-call-for-reform-of-statistical-practice-and-teaching-wed-appreciate-your-comments/).
Check out the discussion section there for other good insights and some
additional reading material on this topic.