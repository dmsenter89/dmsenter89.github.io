---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "The Data Don't Speak for Themselves"
subtitle: ""
summary: ""
authors: []
tags: ["clinical-trials", "opinion"]
categories: []
date: 2024-11-25T14:02:54-05:00
lastmod: 2024-11-25T14:02:54-05:00
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

Ever heard someone say they were "letting the data speak for itself?" I
often encounter this phrase on the internet by someone claiming
not to be interpreting the data, but merely relaying facts. I don't
believe that's actually true in the sense that it's typically meant.

Here's a good minimal example I've used in a math modeling class before.
I got this table from slides in an epidemiology course where it was
presented in the context of racial disparities in health care. It shows rates
of infant mortality for two time points in two different racial groups
in the US. Here's a reproduction of the table:

| Year | White (Non-Hispanic) | Black (Non-Hispanic) |
|:----:|:--------------------:|:--------------------:|
| 1950 |         26.8         |         43.9         |
| 1998 |           6          |         13.8         |

This represents the number of infants who died per 1,000 live births, so lower is better. The first thing to note and credit is
that the numbers have been plummeting in both columns, a testament to
our improvements in infant care.

Now, if all I'm trying to do is to say that there is a disparity because
the numbers don't match, that's true. But it also trivial and
uninteresting. I'm usually much more interested in patterns and trends.
Given that we have two different time points, it is reasonable to ask a
question like "are the disparities getting better or worse?" As it turns out, and
we did this exercise in class, the question happens to be a bit vague, so it's \
easy to come up with different answers both in direction and
magnitude of the disparity. I'll group a couple of examples each by
outcome.

Say I want to see the data as saying the racial disparity is getting
bigger, i.e. the gaps are widening in some sense. To measure the
disparity, the US Office of Minority Health uses the ratio of the
non-Hispanic Black to the non-Hispanic White rates. That would give us
$\frac{43.9}{26.8} \approx 1.63$ for 1950 versus of
$\frac{13.8}{6} = 2.3$ for 1998. This would tell a story of the gap
widening. This would imply the gap has grown by about 40%.

Alternatively, we could construct the relative percentage difference
between the Black and White rates, which would give
$\frac{43.9 - 26.8}{26.8} \approx 0.64$ for 1950 vs
$\frac{13.8 - 6}{6} = 1.3$ for 1998. This also tells a story of
disparities growing, but it appears even more alarming than using the
previous method -- the 1998 difference is about twice that of 1950!

If I want to take the opposite route and see the disparities as
improving, I could compare the rates of improvement in the infant mortality rates.
I have two data points for each racial category, so I can fit a line to each and
compare the slopes. That would give us
$\frac{6 - 26.8}{1998 - 1950} \approx - 0.43$ for Whites and
$\frac{13.8 - 43.9}{1998 - 1950} \approx - 0.63$ for Blacks. If I choose
this metric, improvements have been substantial. The rates have gone down
for Blacks about 50% faster than for Whites.

We could also work with the number of deaths more directly. In 1950, there were
$43.9 - 26.8 = 17.1$ excess infant deaths per 1,000 live births amongst
Blacks compared to Whites, while in 1998 there were only
$13.8 - 6 = 7.8$ excess deaths per 1,000 live births. This metric could
also be framed as a success -- thanks to improvements in disparities, we
have nearly 10 fewer Black infant deaths per 1,000 live births than we
would have had the disparities of the 1950s persisted.

Anybody wanting to opine on the matter could calculate any of these
measures and claim they are fairly representing the data as they see
them. All of these choices reflect what in statistics would be called an
*estimand* -- a particular, mathematically defined answer to a
question that we seek to infer from the data using an estimator. Each
estimand is related to the scientific question being asked, but makes it
more precise. One issue that arises is that because the scientific
question of interest is by necessity a bit vague, at least when offered
initially, there are multiple valid routes to go about answering it.
This leads to what Gelman termed the ["Garden of Forking
Paths"](http://www.stat.columbia.edu/~gelman/research/unpublished/p_hacking.pdf)
and the different possible answers we can get to our question from a
data set.

Another issue to consider is proper conditioning on factors playing a
role in the outcome of interest. A relatable illustration of this is the
famous ["80 cents on the
dollar"](https://www.pewresearch.org/social-trends/2023/03/01/the-enduring-grip-of-the-gender-pay-gap/)
line about the US gender pay gap. This is an overall measure of group
differences often raised in a political context. While this represents true
observable group differences in wages, it is often used to imply wage
discrimination. Because that's a more interesting question from a policy perspective.
But wage discrimination is usually thought of as two
individuals with the same background characteristics, say qualifications
and personality traits indicative of productivity, and differing in only
one aspect of interest, say race, gender, or sexual orientation, having
meaningfully different wages. So to be able to infer discrimination, we
have to also collect and analyze the necessary covariates that can
reflect differences in qualifications and ability. Wages have high
variability and different industries have very different pay-bands which
are often stratified to some degree by educational achievement. And we
know there are large gender gaps in fields of study. Here's an
interesting link to an overview of this issue by
[Bankrate.](https://www.bankrate.com/loans/student-loans/top-paying-college-majors-gender-gap/)
Out of the six majors listed with a median salary of \$100,000 or more,
only one was even close to even in enrollment by gender. Without taking
differences such as these (and others) into account, the noted group difference
in and of itself is not particularly enlightening.

Back to our example on infant mortality. Since this is a medical issue,
we can look at whether there are established [risk
factors](https://www.cdc.gov/maternal-infant-health/infant-mortality/index.html)
for it whose distribution might differ between groups. Here is a list of
the top 5 risk factors identified by the CDC:

1.  birth defects,
2.  preterm birth and low birth weight,
3.  sudden infant death syndrome,
4.  unintentional injuries, and
5.  maternal pregnancy complications.

Since each of these factors are believed to affect the infant mortality
rate, it would be appropriate to include them in an analysis. After all, it's
not a given that they do not differ by racial groups and variation in
risk factors may explain some of the variation in the observed
difference in infant mortality rates. For example: Blacks have about
[twice the rate of low birth weight
infants](https://www.marchofdimes.org/peristats/data?reg=99&top=4&stop=45&lev=1&slev=1&obj=1)
compared to Whites. Among pregnancy complications, [preeclampsia is more
common among Blacks](https://doi.org/10.1001/jama.2017.3439) than
Whites. For other risk factors, like gestational diabetes, the [rates
are
similar.](https://onlinelibrary.wiley.com/doi/10.1111/j.1365-3016.2010.01140.x)
Including these risk factors in an analysis could increase or decrease
the observed disparity, but would simultaneously provide a richer
picture and ultimately a better answer to our scientific question. This is particularly
true if we're asking this question from a public health perspective to guide
funding allocations in an effort to alleviate disparaties.

So all this to say that I don't believe the data speak for themselves.
Analysts use data to tell a story. And I don't mean that maliciously. You can
sincerely tell different stories with the same data. Since there are many ways of
reasoning with and analyzing data, openness is key. And part of that
openness is clarity on the estimands we choose, and what they imply
about the specific question we're asking. This becomes especially
important when the stakes are high, such as in regulatory review of
clinical trials or when policy decisions are at stake. We're currently
seeing a move to more transparency here, see for example [here for the
E9(R1)
Addendum](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/e9r1-statistical-principles-clinical-trials-addendum-estimands-and-sensitivity-analysis-clinical)
on estimands and sensitivity analysis in clinical trials. There's also a
relatively recent [book by Mallinckrodt et
al](https://www.routledge.com/Estimands-Estimators-and-Sensitivity-Analysis-in-Clinical-Trials/Mallinckrodt-Molenberghs-Lipkovich-Ratitch/p/book/9781032242620?srsltid=AfmBOor0NBn9COUmntJla4NGNZKI2pSg-7OeMi4R0Qlb4vMd76iYhYDh)
offering relevant examples from the clinical setting on picking and
justifying appropriate estimands.

This also shows that it pays to take a second look at published data,
something I've recently become more interested in. See [this
post](https://www.sensible-med.com/p/the-value-of-reanalysis-of-a-clinical)
by John Mandrola and the topic of reanalyzing clinical trial data and
their perhaps surprising finding: in their admittedly small sample, 35%
of the reanalysis of *existing, published trial data* lead to different
interpretations than the originally published article.
