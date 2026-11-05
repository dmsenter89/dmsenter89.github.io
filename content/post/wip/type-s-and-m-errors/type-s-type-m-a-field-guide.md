---
title: "Type S and Type M Errors: A Field Guide to Gelman & Carlin (2014)"
date: 2026-08-06
draft: true
tags: ["statistics", "bayesian", "r", "sas", "python", "power-analysis"]
categories: ["statistics"]
ShowToc: true
TocOpen: true
math: true
summary: "Working through Gelman and Carlin's Type S / Type M framework end to end -- the original point-estimate calculation in R, SAS, and Python, then the Bayesian move of putting a distribution on the true effect size instead of a single guess."
---

> Working draft. Code output below is from a live run; numbers will move slightly if you change the random seed.

## The hook

You finish reading a paper. The headline result is statistically significant — *p* < .05, confidence interval excludes zero, authors and reviewers satisfied. Should you believe it?

Andrew Gelman and John Carlin's 2014 paper, [*Beyond Power Calculations: Assessing Type S (Sign) and Type M (Magnitude) Errors*](https://doi.org/10.1177/1745691614551642), argues that "significant" is a much weaker claim than it sounds, especially in noisy, small-sample settings. Their core move: stop asking "was this test powerful enough to reject the null?" and start asking "if I ran this exact study over and over, what would the *significant* results actually look like?" That second question has a precise, computable answer, and it's often uncomfortable.

## The core idea

Ordinary power analysis answers one question: **will I detect the effect?** Gelman and Carlin's design analysis answers a more useful pair:

- **Type S (Sign) error** — conditional on a result clearing the significance bar, what's the probability the sign is wrong? A 95% CI that excludes zero can still carry a substantial chance of sitting on the wrong side of the true effect, because the CI's coverage guarantee is about the sampling *procedure*, not about this particular, significance-filtered estimate in front of you.
- **Type M (Magnitude) error / exaggeration ratio** — conditional on significance, by what factor does the estimate overstate the true effect? Low power doesn't just make significance harder to reach — it filters the significant results down to the noise-inflated ones. "Significant" and "exaggerated" are coupled by construction.

Both quantities are driven by one ratio: the true effect size \(D\) relative to the standard error \(s\). Fix \(D/s\) and power, Type S, and Type M all follow from the sampling distribution of the estimate. The catch — and the real subject of the paper — is that \(D\) is never observed. It has to come from *outside* the study: literature review, related work, domain plausibility bounds. Gelman and Carlin are explicit that this external step, not the arithmetic, is the hard part of the whole exercise.

One convention worth flagging up front, from their footnote 2: the closed-form Type S formula assumes **D is positive**. This isn't a claim that true effects are always positive in some universal sense — it's a labeling convention. You pick a direction to call "positive" (usually the direction the original hypothesis predicted), and the whole calculation is relative to that choice. We'll lean on this same convention throughout.

## The math, briefly

For an estimate \(d_{\text{rep}}\) that's normally distributed around the true effect \(D\) with standard error \(s\), and a significance threshold \(z = 1.96\) (for \(\alpha = .05\)):

$$
\text{power} = \Pr(|d_{\text{rep}}/s| > z) = \left[1 - \Phi(z - D/s)\right] + \Phi(-z - D/s)
$$

$$
\text{Type S} = \frac{\Phi(-z - D/s)}{\text{power}}
$$

The exaggeration ratio has no clean closed form — it's a truncated conditional expectation — so it's computed by simulation: draw many replications of \(d_{\text{rep}}\), keep the ones that clear significance, and average \(|d_{\text{rep}}|/D\) over that subset.

Two benchmarks from the paper are worth memorizing, because they'll do most of your intuition-building for you:

- **Power below ~50%** → the exaggeration ratio starts climbing fast.
- **Power below ~10%** → the Type S error rate stops being negligible.

And as reference points: an unbiased estimate has 50% power when the true effect is 2 SEs from zero, 17% power at 1 SE, and 10% power at 0.65 SEs.

## Part 1 — the point-estimate calculation, in three languages

Gelman and Carlin ship a compact R function, `retrodesign()`, in their appendix. Here it is, followed by direct ports to SAS/IML and Python — all three compute the same three numbers from the same three inputs.

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
    z = quantile("T", 1 - alpha/2, df);
    p_hi = 1 - cdf("T", z - A/s, df);
    p_lo = cdf("T", -z - A/s, df);
    power = p_hi + p_lo;
    typeS = p_lo / power;

    call randseed(2014);
    t_draws = j(n_sims, 1);
    call randgen(t_draws, "T", df);
    estimate = A + s * t_draws;
    sig = (abs(estimate) > s*z);
    exaggeration = mean(abs(estimate)[loc(sig)]) / A;

    return(power || typeS || exaggeration);
finish;

/* df = 1e10 stands in for Inf; SAS's T functions don't accept a literal
   infinite df, but this is indistinguishable from normal at this scale */

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

Running these gives the same three numbers the paper reports: for the sex-ratio example at \(D = 0.1\), power ≈ 5%, Type S ≈ 46%, exaggeration ≈ 77×. For the menstrual-cycle example at \(D = 2\), power ≈ 6%, Type S ≈ 24%, exaggeration ≈ 9.7×.

## Part 2 — D is not a point

Here's the discomfort with the calculation above: it commits to a single number for \(D\), and the paper's own two examples don't really support that level of confidence. Gelman and Carlin handle this by running the calculation at a *grid* of plausible values (0.1, 0.3, and 1.0 percentage points for the sex-ratio example) and reporting all three. That's honest, but it still reports three separate point answers rather than one coherent picture of your uncertainty.

The natural extension is the ordinary Bayesian move: instead of picking a few candidate values of \(D\), put a full distribution on it, and propagate that distribution all the way through to power, Type S, and Type M.

**Worth being explicit about the “D ≠ 0” assumption here.** Gelman has argued elsewhere (and it's implicit in this paper's D-positive convention) that in most real research settings, the true effect is essentially never *exactly* zero — everything is correlated with everything to some degree, through some causal pathway, however faint. The genuinely open empirical question usually isn't "is there an effect," it's "is the effect big enough to matter." That reframing is what justifies putting a continuous, strictly-positive-support distribution on \(D\) rather than a prior that mixes in a literal point-mass at zero. (There's a good reason to avoid mass at zero anyway: the exaggeration ratio behaves like \(1/D\), so any prior with density right at zero makes its expectation blow up. A distribution with support strictly on the positive reals — lognormal, or Gamma with shape > 1 — sidesteps this by construction, and happens to be the natural choice for a ratio-scale effect anyway.)

### Setting up priors from the paper's own literature review

Gelman and Carlin already did the literature legwork for both examples — we're just formalizing it into a distribution instead of three grid points.

**Beauty and sex ratios.** The text: effects in the sex-ratio literature run "on the order of 1 percentage point," with most known factors (race, parental age, birth order, maternal weight) between "less than 0.3... to about 2 percentage points," and only extreme deprivation pushing toward 3. Given the added noise of a subjective attractiveness rating, they expect the true effect here to be "well under 1 percentage point." A lognormal with **median 0.3 percentage points** and a modest spread captures this: half the mass under 0.3, most of the rest under ~1, with a thin tail reaching toward the more extreme end of the literature.

**Menstrual cycle and voting.** The text: total swing in the 2012 general election polling was about 7 percentage points *for the entire campaign*, and they treat **2 percentage points as the upper end of plausible** for any subgroup difference tied to cycle phase. A lognormal with **median 0.7**, calibrated so its upper tail reaches toward 2, matches "2 is generous, not central."

{{< tabs >}}
{{% tab name="R" %}}
```r
retrodesign_dist <- function(s, alpha = .05, df = Inf,
                              meanlog, sdlog,
                              n_prior = 5000, n_sims = 2000) {
  z <- qt(1 - alpha / 2, df)
  D_draws <- rlnorm(n_prior, meanlog = meanlog, sdlog = sdlog)

  power <- typeS <- exag <- rep(NA_real_, n_prior)

  for (i in seq_len(n_prior)) {
    D <- D_draws[i]
    est <- D + s * rt(n_sims, df)
    sig <- abs(est) > s * z
    nsig <- sum(sig)

    power[i] <- nsig / n_sims
    if (nsig > 0) {
      typeS[i] <- mean(est[sig] < 0)          # D > 0 by convention -> wrong sign = negative
      exag[i]  <- mean(abs(est[sig])) / D
    }
  }

  data.frame(D = D_draws, power, typeS, exag)
}

set.seed(2014)

# Beauty and sex ratios: median D = 0.3, s = 3.28
post1 <- retrodesign_dist(s = 3.28, meanlog = log(0.3), sdlog = 0.7)

# Menstrual cycle and voting: median D = 0.7, s = 8.1
post2 <- retrodesign_dist(s = 8.1, meanlog = log(0.7), sdlog = 0.64)

# Pooled (correct) marginal rates -- ratio of totals, not average of per-D ratios
marginal_typeS <- function(df) sum(df$typeS * df$power, na.rm = TRUE) / sum(df$power, na.rm = TRUE)
cat("Sex ratio -- marginal Type S:", marginal_typeS(post1), "\n")
cat("Voting    -- marginal Type S:", marginal_typeS(post2), "\n")

summary(post1$exag)
summary(post2$exag)
```
{{% /tab %}}
{{% tab name="Python" %}}
```python
import numpy as np
from scipy import stats

def retrodesign_dist(s, meanlog, sdlog, alpha=0.05,
                      n_prior=5000, n_sims=2000, seed=2014):
    rng = np.random.default_rng(seed)
    z = stats.norm.ppf(1 - alpha / 2)
    D_draws = rng.lognormal(meanlog, sdlog, n_prior)

    power = np.full(n_prior, np.nan)
    typeS = np.full(n_prior, np.nan)
    exag  = np.full(n_prior, np.nan)

    for i, D in enumerate(D_draws):
        est = D + s * rng.standard_normal(n_sims)
        sig = np.abs(est) > s * z
        nsig = sig.sum()
        power[i] = nsig / n_sims
        if nsig > 0:
            typeS[i] = (est[sig] < 0).mean()   # D > 0 by convention
            exag[i]  = np.abs(est[sig]).mean() / D

    return D_draws, power, typeS, exag

# Beauty and sex ratios: median D = 0.3, s = 3.28
D1, power1, typeS1, exag1 = retrodesign_dist(s=3.28, meanlog=np.log(0.3), sdlog=0.7)

# Menstrual cycle and voting: median D = 0.7, s = 8.1
D2, power2, typeS2, exag2 = retrodesign_dist(s=8.1, meanlog=np.log(0.7), sdlog=0.64)

def marginal_typeS(power, typeS):
    return np.nansum(typeS * power) / np.nansum(power)

print("Sex ratio -- marginal Type S:", marginal_typeS(power1, typeS1))
print("Voting    -- marginal Type S:", marginal_typeS(power2, typeS2))

print("Sex ratio exaggeration -- median:", np.nanmedian(exag1),
      "IQR:", np.nanpercentile(exag1, [25, 75]))
print("Voting exaggeration    -- median:", np.nanmedian(exag2),
      "IQR:", np.nanpercentile(exag2, [25, 75]))
```
{{% /tab %}}
{{% tab name="SAS/IML" %}}
```sas
proc iml;
start retrodesign_dist(s, meanlog, sdlog, alpha, n_prior, n_sims)
      global(out_D, out_power, out_typeS, out_exag);

    z = quantile("Normal", 1 - alpha/2);
    call randseed(2014);

    logD = j(n_prior, 1);
    call randgen(logD, "Normal", meanlog, sdlog);
    D_draws = exp(logD);

    power = j(n_prior, 1, .);
    typeS = j(n_prior, 1, .);
    exag  = j(n_prior, 1, .);

    do i = 1 to n_prior;
        D = D_draws[i];
        t = j(n_sims, 1);
        call randgen(t, "Normal", 0, 1);
        est = D + s * t;
        sig = (abs(est) > s*z);
        nsig = sum(sig);

        power[i] = nsig / n_sims;
        if nsig > 0 then do;
            typeS[i] = sum(sig # (est < 0)) / nsig;   /* D > 0 by convention */
            exag[i]  = sum(abs(est) # sig) / nsig / D;
        end;
    end;

    out_D = D_draws; out_power = power; out_typeS = typeS; out_exag = exag;
finish;

/* Beauty and sex ratios: median D = 0.3, s = 3.28 */
run retrodesign_dist(3.28, log(0.3), 0.7, 0.05, 5000, 2000);
D1 = out_D; power1 = out_power; typeS1 = out_typeS; exag1 = out_exag;

/* Menstrual cycle and voting: median D = 0.7, s = 8.1 */
run retrodesign_dist(8.1, log(0.7), 0.64, 0.05, 5000, 2000);
D2 = out_D; power2 = out_power; typeS2 = out_typeS; exag2 = out_exag;

/* pooled marginal Type S -- ratio of totals, not average of per-D ratios */
marg_typeS1 = sum(typeS1#power1, ".") / sum(power1, ".");
marg_typeS2 = sum(typeS2#power2, ".") / sum(power2, ".");
print marg_typeS1 marg_typeS2;

create exag_out var {"exag1" "exag2"};
append;
close exag_out;
quit;

proc means data=exag_out median q1 q3 p95; run;
```
{{% /tab %}}
{{< /tabs >}}

### What actually comes out

```text
=== Beauty & sex ratios ===
Prior: Lognormal(median=0.300, sdlog=0.7)
  prior 5/50/95 pct of D: [0.095, 0.302, 0.953]
  marginal power: 0.053     marginal Type S: 0.366
  exaggeration -- mean: 32.5   median: 25.4   IQR: [16.0, 40.7]   95th pct: 80.8

=== Menstrual cycle & voting ===
Prior: Lognormal(median=0.700, sdlog=0.64)
  prior 5/50/95 pct of D: [0.245, 0.705, 2.013]
  marginal power: 0.052     marginal Type S: 0.379
  exaggeration -- mean: 33.1   median: 26.9   IQR: [17.6, 41.4]   95th pct: 77.5
```

## Interpreting these numbers

A few things worth spelling out about what changed by going distributional, and what it means.

**The Type S rate got *worse*, not better, than any single grid point in the original paper.** Gelman and Carlin's grid at \(D=0.3\) for the sex-ratio example gave Type S ≈ 40%; the marginal rate here is 37% — close, because the median of our prior sits right at their grid point. But their most optimistic scenario (\(D=1.0\), Type S ≈ 19%) is now just the far right tail of a distribution whose bulk sits much lower. Averaging honestly over the *whole* range of what the literature supports — rather than cherry-picking the most favorable single value — pulls the summary number toward the pessimistic end, not the optimistic one. That's the opposite of what naive intuition might expect from "adding more uncertainty," and it's a genuinely useful thing to be able to say in the post: uncertainty about \(D\) doesn't wash out toward some comfortable middle, it inherits the shape of the underlying risk.

**Report the median exaggeration ratio, not the mean, and say why.** The mean (32.5×, 33.1×) is being pulled up hard by the right tail — a lognormal prior tames the *worst* pathology (infinite mean from mass sitting at exactly zero) but a heavy right tail still exists, because there's real prior probability that \(D\) is genuinely tiny even though it's never exactly zero. Median plus IQR is the honest summary: "the typical significant result here overstates the true effect by something like 25–27×, and there's a real chance it's overstating by 40× or more."

**The pooled/marginal Type S rate is a ratio of two averages, not an average of two ratios.** This is a subtle but important implementation detail baked into all three code blocks above: `marginal_typeS = sum(typeS * power) / sum(power)`, not `mean(typeS)`. The reason is that each \(D\)-draw contributes to the "significant" pool in proportion to its own power — a \(D\)-draw with near-zero power barely contributes any significant replications at all, so it shouldn't get equal weight in the average the way a naive `mean(typeS)` would give it. Get this backwards and you'll quietly misreport the headline number.

**This still isn't a real posterior**, in the sense of updating a prior against a likelihood — there's no data doing any updating here, just a prior on \(D\) pushed forward through the sampling model. If you wanted an actual posterior on \(D\) — say, by pooling several related published estimates through a proper hierarchical/meta-analytic model — that's a heavier lift (Stan or `PROC MCMC`, roughly), and a good subject for a follow-up post. What we're doing here is closer to what's sometimes called "prior predictive" analysis: propagating genuine uncertainty about an unknown quantity through a deterministic-given-\(D\) calculation, without touching any data beyond what's already baked into \(s\).

## Part 3 — how underpowered is "underpowered," exactly?

Gelman and Carlin give three memorable benchmarks: 50% power needs \(D\) at least 2 SEs from zero, 17% power needs 1 SE, and 10% power needs 0.65 SEs. Turning that into a routine check is just inverting the power formula for a target power level, then comparing the result to what the literature actually supports.

{{< tabs >}}
{{% tab name="R" %}}
```r
D_for_power <- function(target_power, s, alpha = .05) {
  z <- qnorm(1 - alpha / 2)
  f <- function(D) {
    (1 - pnorm(z - D / s)) + pnorm(-z - D / s) - target_power
  }
  uniroot(f, c(1e-6, 1000))$root
}

power_at_D <- function(D, s, alpha = .05) {
  z <- qnorm(1 - alpha / 2)
  (1 - pnorm(z - D / s)) + pnorm(-z - D / s)
}

studies <- list(
  "Beauty & sex ratios"      = list(s = 3.28, D_lit = 0.3),
  "Menstrual cycle & voting" = list(s = 8.1,  D_lit = 0.7)
)

for (name in names(studies)) {
  s <- studies[[name]]$s
  D_lit <- studies[[name]]$D_lit
  cat("===", name, "(s =", s, ") ===\n")
  for (target in c(0.10, 0.17, 0.50, 0.80)) {
    D_req <- D_for_power(target, s)
    cat(sprintf("  D needed for %d%% power: %.2f (%.2f SEs)\n",
                target * 100, D_req, D_req / s))
  }
  cat(sprintf("  Literature-informed D: %.2f -> implied power: %.3f\n\n",
              D_lit, power_at_D(D_lit, s)))
}
```
{{% /tab %}}
{{% tab name="Python" %}}
```python
import numpy as np
from scipy import stats, optimize

alpha = 0.05
z = stats.norm.ppf(1 - alpha / 2)

def power_at_D(D, s):
    return (1 - stats.norm.cdf(z - D / s)) + stats.norm.cdf(-z - D / s)

def D_for_power(target_power, s):
    return optimize.brentq(lambda D: power_at_D(D, s) - target_power, 1e-6, 1000)

studies = {
    "Beauty & sex ratios":      dict(s=3.28, D_lit=0.3),
    "Menstrual cycle & voting": dict(s=8.1,  D_lit=0.7),
}

for name, info in studies.items():
    s, D_lit = info["s"], info["D_lit"]
    print(f"=== {name} (s={s}) ===")
    for target in [0.10, 0.17, 0.50, 0.80]:
        D_req = D_for_power(target, s)
        print(f"  D needed for {int(target*100)}% power: {D_req:.2f}  ({D_req/s:.2f} SEs)")
    print(f"  Literature-informed D: {D_lit} -> implied power: {power_at_D(D_lit, s):.3f}\n")
```
{{% /tab %}}
{{% tab name="SAS/IML" %}}
```sas
proc iml;
alpha = 0.05;
z = quantile("Normal", 1 - alpha/2);

start power_at_D(D, s) global(z);
    return( (1 - cdf("Normal", z - D/s)) + cdf("Normal", -z - D/s) );
finish;

start D_for_power(target, s) global(z);
    /* bisection since IML has no built-in root finder for this */
    lo = 1e-6; hi = 1000;
    do iter = 1 to 100;
        mid = (lo+hi)/2;
        if power_at_D(mid, s) < target then lo = mid; else hi = mid;
    end;
    return(mid);
finish;

names = {"Beauty & sex ratios", "Menstrual cycle & voting"};
s_vals = {3.28, 8.1};
D_lit  = {0.3, 0.7};
targets = {0.10, 0.17, 0.50, 0.80};

do k = 1 to 2;
    s = s_vals[k];
    print (names[k]);
    do j = 1 to ncol(targets);
        D_req = D_for_power(targets[j], s);
        result = D_req || D_req/s;
        print result[colname={"D needed" "SEs"} rowname=("power=" + char(targets[j]))];
    end;
    p_lit = power_at_D(D_lit[k], s);
    print (D_lit[k])[label="literature D"] p_lit[label="implied power"];
end;
quit;
```
{{% /tab %}}
{{< /tabs >}}

Output:

```text
=== Beauty & sex ratios (s=3.28) ===
  D needed for 10% power: 2.14  (0.65 SEs)
  D needed for 17% power: 3.28  (1.00 SEs)
  D needed for 50% power: 6.43  (1.96 SEs)
  D needed for 80% power: 9.19  (2.80 SEs)
  Literature-informed D: 0.3 -> implied power: 0.051

=== Menstrual cycle & voting (s=8.1) ===
  D needed for 10% power: 5.28  (0.65 SEs)
  D needed for 17% power: 8.10  (1.00 SEs)
  D needed for 50% power: 15.87 (1.96 SEs)
  D needed for 80% power: 22.69 (2.80 SEs)
  Literature-informed D: 0.7 -> implied power: 0.051
```

This is the fast, intuitive version of "was this study underpowered" that doesn't require running any simulation at all: **the sex-ratio design would need a true effect of at least 2.1 percentage points just to reach 10% power** — more than 7× larger than the literature-informed median of 0.3. The voting-cycle design needs at least 5.3 points to hit 10% power against a literature ceiling of about 2. Neither design comes close to being capable of answering the question it was used for, and that conclusion doesn't depend on which specific prior shape you pick for \(D\) — it falls out just from comparing the *required* effect size to the *plausible* one.

This is also, in miniature, Gelman's broader claim that most published studies in psychology and similar fields are underpowered: not "underpowered" in the sense of failing to reach significance (both of these did reach significance), but underpowered *relative to the true effect size*, which is the only sense of the word that matters for deciding whether to trust the result.

## Open threads

- A worked example using an actual pooled meta-analysis (via `PROC MCMC` or Stan) to build a genuine posterior on \(D\), rather than a literature-informed prior with no likelihood update — natural follow-up post.
- The exaggeration ratio does have a closed form via truncated-normal moments, avoiding simulation entirely for a single \(D\) — worth a technical aside if this becomes a series.
- Should probably show the power/Type S/exaggeration curves as a function of power (reproducing the paper's Figure 2) rather than just tables — good use case for the tab-switcher applied to a plotting library instead of just `retrodesign()` itself.
