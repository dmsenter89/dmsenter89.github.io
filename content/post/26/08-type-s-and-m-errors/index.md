---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Calculating Type S and M Errors"
subtitle: ""
summary: "Working through Gelman and Carlin's Type S / Type M framework end to end -- the original point-estimate calculation in R, SAS, and Python, then putting a distribution on the true effect size instead of a single guess."
authors: []
tags: ["statistics", "bayesian", "r", "sas", "python", "power-analysis"]
categories: []
date: 2026-08-07
featured: false
draft: true
math: true

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


{{< tabs >}}
{{% tab name="R (original)" %}}
```r
retrodesign <- function(A, s, alpha = .05, df = Inf, n.sims = 10000) {
  z <- qt(1 - alpha / 2, df)
  p.hi <- 1 - pt(z - A / s, df)
  p.lo <- pt(-z - A / s, df)
  power <- p.hi + p.lo
  typeS <- p.lo / power

  estimate <- A + s * rt(n.sims, df)
  significant <- abs(estimate) > s * z
  exaggeration <- mean(abs(estimate)[significant]) / A

  return(list(power = power, typeS = typeS, exaggeration = exaggeration))
}

# Example: beauty and sex ratios (Kanazawa 2007), D = 0.1 pct points, s = 3.28
retrodesign(0.1, 3.28)

# Example: menstrual cycle and voting (Durante et al. 2013), D = 2 pct points, s = 8.1
retrodesign(2, 8.1)
```
{{% /tab %}}
{{% tab name="Python" %}}
```python
import numpy as np
from scipy import stats

def retrodesign(A, s, alpha=0.05, df=np.inf, n_sims=10000, rng=None):
    rng = rng or np.random.default_rng()
    dist = stats.norm if np.isinf(df) else stats.t(df)

    if np.isinf(df):
        z = stats.norm.ppf(1 - alpha / 2)
        p_hi = 1 - stats.norm.cdf(z - A / s)
        p_lo = stats.norm.cdf(-z - A / s)
        t_draws = rng.standard_normal(n_sims)
    else:
        z = stats.t.ppf(1 - alpha / 2, df)
        p_hi = 1 - stats.t.cdf(z - A / s, df)
        p_lo = stats.t.cdf(-z - A / s, df)
        t_draws = stats.t.rvs(df, size=n_sims, random_state=rng)

    power = p_hi + p_lo
    typeS = p_lo / power

    estimate = A + s * t_draws
    significant = np.abs(estimate) > s * z
    exaggeration = np.abs(estimate[significant]).mean() / A

    return {"power": power, "typeS": typeS, "exaggeration": exaggeration}

rng = np.random.default_rng(2014)

# Beauty and sex ratios
print(retrodesign(0.1, 3.28, rng=rng))

# Menstrual cycle and voting
print(retrodesign(2, 8.1, rng=rng))
```
{{% /tab %}}
{{% tab name="SAS/IML" %}}
```sas
proc iml;
start retrodesign(A, s, alpha, df, n_sims);

    if (df < 1e6) then do;
        z    = quantile("T", 1 - alpha/2, df);
        p_hi = 1 - cdf("T", z - A/s, df);
        p_lo = cdf("T", -z - A/s, df);
        draws = j(n_sims, 1);
        call randgen(draws, "T", df);
    end;
    else do; /* large df -> use normal */
        z    = quantile("Normal", 1 - alpha/2);
        p_hi = 1 - cdf("Normal", z - A/s);
        p_lo = cdf("Normal", -z - A/s);
        draws = j(n_sims, 1);
        call randgen(draws, "Normal");
    end;

    power = p_hi + p_lo;
    typeS = p_lo / power;

    estimate = A + s * draws;
    sig = (abs(estimate) > s*z);
    exaggeration = mean(abs(estimate)[loc(sig)]) / A;

    return(power || typeS || exaggeration);
finish;

call randseed(2014);   /* set once, outside the function */

/* df = 1e10 stands in for Inf; SAS's T functions don't accept a literal
   infinite df, but this is indistinguishable from normal at this scale,
   hence the branch in the IML version of retrodesign. */

/* Beauty and sex ratios */
res1 = retrodesign(0.1, 3.28, 0.05, 1e10, 10000);
print res1[colname={"power" "typeS" "exaggeration"} label="Beauty & sex ratios"];

/* Menstrual cycle and voting */
res2 = retrodesign(2, 8.1, 0.05, 1e10, 10000);
print res2[colname={"power" "typeS" "exaggeration"} label="Menstrual cycle & voting"];
quit;
```
{{% /tab %}}
{{< /tabs >}}



## references

Gelman, A., & Carlin, J. (2014). Beyond Power Calculations: Assessing Type S (Sign) and Type M (Magnitude) Errors: Assessing Type S (Sign) and Type M (Magnitude) Errors. _Perspectives on Psychological Science_, 9(6), 641-651.
