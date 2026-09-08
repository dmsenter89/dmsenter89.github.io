---
title: Exploring an Autoregression for Insulin Dosage
date: 2026-09-03
draft: false
tags:
  - statistics
  - time-series
  - sas
---

My dog Sudo has diabetes. In humans, that is quite manageable. Constant monitoring of blood sugar levels and insulin dosage is required, but many tools exist to help with this and -- importantly -- are covered by medical insurance. The situation with dogs tends to be more challenging. Fewer tools are available and many people don't have medical insurance for their dogs. According to our local vet, this unfortunately leads to many dogs being euthanized instead of cared for. Care for the dogs themselves is challenging. The process for establishing Sudo's dose was as follows: for about two weeks, he wore a continuous glucose monitor (CGM) and we recorded his blood sugar levels. We then used that data to determine his insulin dosage. We settled on one specific dog food that he would get the same amount twice a day, every day so that his carb intake stays stable. We administer insulin twice a day with his food. The vet used that data to generate a dosing table. Most people apparently just use a fixed dose twice daily, because some dogs are not particularly fond of blood sugar sticks and CGM is expensive. Sudo has been doing well with the blood sugar pricks, so we have generally been able to use adjustment doses as recommended.

We have noticed lately that his blood sugar has been running high. Ideally, it should roughly stay in the range of 70-150 mg/dL. Once it starts dropping much lower than this, he needs immediate sugar because hypoglycemia can be fatal. If he strays far above this level, he is at risk for long-term complications due to damage from hyperglycemia. For the past months we've noticed he hasn't been responding to his insulin as well as he used to. We've started adjusting his dose slightly based on his blood sugar readings, but we are concerned that this is not a sustainable approach. We've been collecting data to share with his vet in coming up with a new strategy, but this is also a good excuse to learn about the basics of autoregression.

## The Model Basics

So how does blood sugar work for purposes of our model? Let's start with a simple DAG. Sudo gets Vetsulin doses and food twice a day, approximately 12 hours apart, and we take a blood sugar reading at the same time we administer each dose. It's easiest to think of this as a forward-looking process: his blood sugar *now*, together with the insulin dose given *now* and the food eaten *now*, causes his blood sugar at the *next* reading, 12 hours later. The current dose itself is chosen from a sliding-scale table based on the current reading, so blood sugar now also causes the current dose. His current blood sugar and the time of day (AM vs. PM) affect his activity level, which in turn affects the next reading. Activity is hard to fully monitor, so I'll consider it an unmeasured variable for purposes of our model. Food is fixed -- same food, same amount, every time -- so it doesn't vary and will fall out of the estimating equation, but it's worth keeping in the DAG for completeness.

Putting it together, we have the following DAG:

```mermaid
flowchart LR
    classDef unmeasured stroke-dasharray: 5 5,stroke-width:2px,fill:#fafafa;

    BG_now --> Insulin_now --> BG_next
    BG_now --> BG_next
    Food_now --> BG_next
    AM_now --> BG_next
    AM_now --> Activity_now
    BG_now --> Activity_now --> BG_next

    class Activity_now unmeasured
```

A quick call to PROC CAUSALGRAPH lets us know if the causal effect of insulin on blood sugar is identifiable from this DAG.

```sas
proc causalgraph;
  ods select AdjustList;
  model 'Sudo'
    BG_now --> Insulin_now --> BG_next,
    BG_now --> BG_next,
    Food_now --> BG_next,
    AM_now --> BG_next,
    AM_now --> Activity_now,
    BG_now --> Activity_now --> BG_next;
  unmeasured Activity_now;
  identify Insulin_now --> BG_next;
run;
```

<div class="table-wrap">
<table>
<caption>Covariate Adjustment Sets for Sudo — Causal Effect of Insulin_now on BG_next</caption>
<thead>
<tr><th>Set</th><th>Size</th><th>Minimal</th><th>AM_now</th><th>BG_now</th><th>Food_now</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>1</td><td>Yes</td><td></td><td>✓</td><td></td></tr>
<tr><td>2</td><td>2</td><td>No</td><td>✓</td><td>✓</td><td></td></tr>
<tr><td>3</td><td>2</td><td>No</td><td></td><td>✓</td><td>✓</td></tr>
<tr><td>4</td><td>3</td><td>No</td><td>✓</td><td>✓</td><td>✓</td></tr>
</tbody>
</table>
</div>

The good news -- yes, it is identifiable! And quite simply, too. The minimal adjustment set for `Insulin_now` consists of just `BG_now`. Index the sequence of 12-hour readings by $i = 0, \dots, n-1$. At each reading we observe blood sugar $y_i$ and administer dose $d_i$ concurrently, per the sliding-scale table. The DAG says $y_{i+1}$ -- the *next* reading -- depends on $y_i$ and $d_i$ from *now*. This is a simple autoregressive model of order 1, or AR(1), just written so that everything on the right-hand side is contemporaneous and the model looks one step forward:

$$
\begin{align}
  y_{i+1} &\sim N(\mu_{i+1}, \sigma)\\\
  \mu_{i+1} &= \alpha + \beta d_i + \gamma y_i
\end{align}
$$

where $y_{i+1}$ is the blood sugar reading at the next time point, $d_i$ is the insulin dose given now, and $y_i$ is the blood sugar reading now. The parameters $\alpha$, $\beta$, and $\gamma$ represent the intercept, the effect of the insulin dose, and the effect of the current blood sugar reading, respectively. The parameter $\sigma$ represents the standard deviation of the blood sugar readings.

## Finding Reasonable Priors

Blood glucose is strictly positive, and insulin's effect plausibly behaves multiplicatively rather than additively. In other words, a given dose should produce a roughly consistent *percentage* change in blood sugar, not a fixed mg/dL drop regardless of level. Modeling $\log(y)$ instead of $y$ handles both facts at once: it enforces positivity by construction (a linear-Normal model has support on all of $\mathbb{R}$, so no amount of prior-tightening fully rules out negative glucose), and it makes $\beta$ a roughly-multiplicative dose effect. So we'll write the model as:

$$
\begin{align}
  \log(y_{i+1}) &\sim N(\mu_{i+1}, \sigma)\\\
  \mu_{i+1} &= \alpha + \beta d_i + \gamma \log(y_i)
\end{align}
$$

Putting priors directly on  $\alpha$, $\beta$, and $\gamma$ can be tricky because they're not very interpretable on their own. Instead, I'll reason about the blood sugar equilibrium $\mu_{eq}$ given a constant maintenance dose $d_{ref}$, and derive $\alpha$ from that: $\alpha = \log(\mu_{eq})(1-\gamma) - \beta \, d_{ref}$.

From here, some folks advocate for generic "uninformative" priors. But that's not a good idea here. Magnitudes for the parameters are constrained and not all are equally likely. For our model, for example, we require $\gamma < 1$ in order to get an equilibrium value. A prior that doesn't lead to an equilibrium is not really sensible.

So now that we know we don't want uniform priors or really wide normals, let's construct some reasonable priors. I like running simulations to generate a decent idea of what is sensible. Here are the priors I've come up with and why:

- $\mu_{eq} \sim N(110, 30)$. This is centered on the vet's stated healthy target range (70-150 mg/dL).
- $\gamma \sim \text{Beta}(8, 3)$. The mean around 0.73 is chosen to reflect Vetsulin's published duration of action (roughly 14-24 hours), which implies meaningful carryover across a 12-hour gap.
- $\beta \sim -\text{Gamma}(4, 0.01)$. Insulin reliably lowers blood sugar, but with modest magnitude, since I don't have any hard data to pin this with yet. Flip the sign on the Gamma to make it look right.
- $\sigma^2 \sim \text{iGamma}(6,0.9)$. This is a hard one to set. We don't have strong outside information here, so this is mostly a placeholder: wide enough to allow for real day-to-day variation, tight enough that the implied dynamics don't look absurd.

The real test of whether these priors are sensible is whether they produce sane qualitative behavior. If we hold the dose fixed at Sudo's maintenance dose and simulate forward, readings that start in his target range should mostly stay there, and an elevated reading should decay back down over a few days rather than staying stuck or resolving in a single implausible step.

<img src="fig-simulated-trajectories.svg" alt="Simulated blood glucose trajectories under the prior: in-range starts hug the target band, elevated starts decay back toward it." />

Elevated readings appear to decay downwards and in-range start seems roughly to stay there. Nothing sticks out in particular. Let's check for convergence of the two readings, which we would expect in an autoregression model such as ours.

<img src="fig-target-range-convergence.svg" alt="Percentage of simulated trajectories within the target range (70-150 mg/dL), by day since start, for in-range vs. elevated starting points." />

That's the behavior we're looking for and that's good enough for a start. The two groups converge. The rate of those staying in-range is modest, but that's fine for this purpose. The main goal is to rule out _unreasonable_ guesses and remove support from them so that the data can meaningfully move our priors to sensible values.

## Fitting The Data

Alright, now that we have a model and priors available, let's fit the data. I now have about two weeks' worth of blood sugar and insulin dose recordings for Sudo, which is enough to start narrowing things down. (The full SAS script behind this post, including the code that produced every figure, is available as [`sudo.sas`](sudo.sas) if you'd like to follow along or run it yourself.) The data is read in via `datalines`, which has the following columns:

```sas
data sudo_glucose;
    length DOSEWIN $2;
    input DATE : MMDDYY10. DOSEWIN $ GLUCOSE DOSE;
    period_index = _N_;
    label
        DATE    = "Observation Date"
        DOSEWIN = "Dosing Window (AM/PM)"
        GLUCOSE = "Blood Glucose (mg/dL)"
        DOSE    = "Vetsulin Dose (Units)";

    format DATE MMDDYY10.;

    datalines;
08/24/2026 AM 371  0.0
08/24/2026 PM 500 30.0
08/25/2026 AM 416 28.0
08/25/2026 PM 310 26.0
08/26/2026 AM 280 27.0
08/26/2026 PM 170 23.0
08/27/2026 AM 298 25.0
08/27/2026 PM 264 26.0
08/28/2026 AM 128 22.0
08/28/2026 PM 164 23.0
08/29/2026 AM  95 22.0
08/29/2026 PM 231 24.0
08/30/2026 AM 143 23.0
08/30/2026 PM 116 22.5
08/31/2026 AM 192 23.0
08/31/2026 PM 298 24.0
09/01/2026 AM 119 23.0
09/01/2026 PM 329 25.0
09/02/2026 AM  98 23.0
09/02/2026 PM 115 23.0
09/03/2026 AM 202 24.0
09/03/2026 PM 248 25.0
09/04/2026 AM 106 23.0
09/04/2026 PM 307 25.0
09/05/2026 AM 240 25.0
09/05/2026 PM 118 23.0
09/06/2026 AM 300 25.0
09/06/2026 PM 329 25.0
09/07/2026 AM 331 25.0
09/07/2026 PM 327 25.5
09/08/2026 AM 260 25.0
;
run;
```

The full series runs 31 observations deep, which is long enough that printing the whole thing isn't very informative -- here are the first five so you can see the shape of it:

<div class="table-wrap">
<table>
<caption>Sudo Glucose Data (first 5 of 31 observations)</caption>
<thead>
<tr><th>Observation Date</th><th>Dosing Window (AM/PM)</th><th>Blood Glucose (mg/dL)</th><th>Vetsulin Dose (Units)</th></tr>
</thead>
<tbody>
<tr><td>08/24/2026</td><td>AM</td><td>371</td><td>0.0</td></tr>
<tr><td>08/24/2026</td><td>PM</td><td>500</td><td>30.0</td></tr>
<tr><td>08/25/2026</td><td>AM</td><td>416</td><td>28.0</td></tr>
<tr><td>08/25/2026</td><td>PM</td><td>310</td><td>26.0</td></tr>
<tr><td>08/26/2026</td><td>AM</td><td>280</td><td>27.0</td></tr>
</tbody>
</table>
</div>

Let' look at a scatter plot of this. I used `ods graphics / imagemap=on` to turn on hover tooltips for the plot below, so if your browser supports it you can hover over any point for its exact date, reading, and dose:

<object type="image/svg+xml" data="fig-glucose-timeline.svg" width="768" height="480" style="max-width:100%;height:auto">
Blood glucose readings over time, colored by AM/PM dosing window, with the 70-150 mg/dL target range shaded. Hover over a point to see its exact date, reading, and dose.
</object>

The trend is hard to miss. Readings have been drifting upward and spending more time above the target band than they used to, which is exactly the pattern that got us worried enough to want a better answer rather than maintaining the old equilibrium dose.

We'll need to use SQL with a self-join to generate the analysis data set from here. We'll need an extra column for the following row's glucose reading and we can drop the dosing window since we don't need it.

```sas
proc sql;
    create table sudo_analysis as
    select
        now.period_index,
        now.DATE,
        now.DOSEWIN,
        now.GLUCOSE as BG_now    label="Blood Glucose Now (mg/dL)",
        now.DOSE    as DOSE_now  label="Vetsulin Dose Now (Units)",
        nxt.GLUCOSE as BG_next   label="Blood Glucose Next Reading (mg/dL)"
    from sudo_glucose as now
    left join sudo_glucose as nxt
        on nxt.period_index = now.period_index + 1
    order by now.period_index;
quit;
```

This gives us the analysis data set, again showing just the first five of 31 rows:

<div class="table-wrap">
<table>
<caption>Sudo Analysis Data (first 5 of 31 observations)</caption>
<thead>
<tr><th>Observation Date</th><th>Blood Glucose Now (mg/dL)</th><th>Vetsulin Dose Now (Units)</th><th>Blood Glucose Next Reading (mg/dL)</th></tr>
</thead>
<tbody>
<tr><td>08/24/2026</td><td>371</td><td>0.0</td><td>500</td></tr>
<tr><td>08/24/2026</td><td>500</td><td>30.0</td><td>416</td></tr>
<tr><td>08/25/2026</td><td>416</td><td>28.0</td><td>310</td></tr>
<tr><td>08/25/2026</td><td>310</td><td>26.0</td><td>280</td></tr>
<tr><td>08/26/2026</td><td>280</td><td>27.0</td><td>170</td></tr>
</tbody>
</table>
</div>

With analysis data in tow, we can now specify the model in MCMC and fit it to the data. The MCMC code is fairly straight forward. One thing that is cool is that we can directly use our draws to calculate the implied target dose $d_{110}$ for a target blood glucose of 110 mg/dL inside the MCMC code with the `beginnodata` and `endnodata` blocks. By adding this value to the `monitor` option we get its distribution added to the `post` data set.

```sas
proc mcmc data=sudo_analysis(where=(not missing(BG_next)))
          outpost=post nbi=2000 nmc=10000 seed=42 monitor=(mu_eq beta sigma2 d_110);
    ods exclude Parameters Nobs;

    parms mu_eq 110 gamma 0.7 sigma2 0.4;
    parms beta_mag 0.04; /* Track the positive magnitude */

    prior mu_eq    ~ normal(110, sd=30);
    prior gamma    ~ beta(8, 3);
    prior beta_mag ~ gamma(4, scale=0.01); /* Strictly positive prior */
    prior sigma2   ~ igamma(shape=6, scale=0.9);

    d_ref     = 22;
    logBGnow  = log(BG_now);
    logBGnext = log(BG_next);

    /* Flip the sign so beta is strictly negative */
    beta = -beta_mag;

    alpha = log(mu_eq) * (1 - gamma) - beta * d_ref;
    mu    = alpha + gamma * logBGnow + beta * DOSE_now;

    model logBGnext ~ normal(mu, var=sigma2);

    beginnodata;
        d_110 = d_ref + (1-gamma)/beta * log(110/mu_eq);
    endnodata;
run;
```

<div class="table-wrap">
<table>
<caption>Posterior Summaries and Intervals</caption>
<thead>
<tr><th>Parameter</th><th>N</th><th>Mean</th><th>Standard Deviation</th><th>95% HPD Lower</th><th>95% HPD Upper</th></tr>
</thead>
<tbody>
<tr><td>mu_eq</td><td>10000</td><td>151.6</td><td>27.4230</td><td>98.0568</td><td>205.3</td></tr>
<tr><td>beta</td><td>10000</td><td>-0.0285</td><td>0.0114</td><td>-0.0504</td><td>-0.00866</td></tr>
<tr><td>sigma2</td><td>10000</td><td>0.2389</td><td>0.0582</td><td>0.1372</td><td>0.3545</td></tr>
<tr><td>d_110</td><td>10000</td><td>27.0785</td><td>5.3421</td><td>19.9314</td><td>37.8552</td></tr>
</tbody>
</table>
</div>
<div class="table-wrap">
<table>
<caption>Effective Sample Sizes</caption>
<thead>
<tr><th>Parameter</th><th>ESS</th><th>Autocorrelation Time</th><th>Efficiency</th></tr>
</thead>
<tbody>
<tr><td>mu_eq</td><td>1007.0</td><td>9.9303</td><td>0.1007</td></tr>
<tr><td>beta</td><td>1796.5</td><td>5.5664</td><td>0.1796</td></tr>
<tr><td>sigma2</td><td>5294.4</td><td>1.8888</td><td>0.5294</td></tr>
<tr><td>d_110</td><td>1440.1</td><td>6.9439</td><td>0.1440</td></tr>
</tbody>
</table>
</div>

<object type="image/svg+xml" data="fig-diagnostics-mu_eq.svg" width="768" height="480" style="max-width:100%;height:auto">
MCMC diagnostic plots (trace, autocorrelation, density) for mu_eq.
</object>

<object type="image/svg+xml" data="fig-diagnostics-beta.svg" width="768" height="480" style="max-width:100%;height:auto">
MCMC diagnostic plots (trace, autocorrelation, density) for beta.
</object>

<object type="image/svg+xml" data="fig-diagnostics-sigma2.svg" width="768" height="480" style="max-width:100%;height:auto">
MCMC diagnostic plots (trace, autocorrelation, density) for sigma2.
</object>

<object type="image/svg+xml" data="fig-diagnostics-d110.svg" width="768" height="480" style="max-width:100%;height:auto">
MCMC diagnostic plots (trace, autocorrelation, density) for d_110.
</object>

Overall we see pretty good mixing. We still only have a modest number of data points -- 30 usable pairs now, up from 16 -- so we're looking for pointers in this data, not publishable results.

```sql
select
    mean(mu_eq > 110) as prob_mu_eq_above_110 label="P(μ_eq > 110)",
    mean(mu_eq > 150) as prob_mu_eq_above_150 label="P(μ_eq > 150)"
    from post;
```

<div class="table-wrap">
<table>
<thead>
<tr><th>P(μ_eq > 110)</th><th>P(μ_eq > 150)</th></tr>
</thead>
<tbody>
<tr><td>0.9263</td><td>0.5487</td></tr>
</tbody>
</table>
</div>

We now have strong reason to believe the equilibrium mean sits above 110 mg/dL, and it's more likely than not to be above 150 mg/dL as well. Our model still has uncertainty, as the next visualization shows, and there's now a substantial chance of an out-of-range reading even if we dose with the model suggested equilibrium dose.


<object type="image/svg+xml" data="fig-expected-variation-d110.svg" width="768" height="480" style="max-width:100%;height:auto">
Posterior predictive distribution of the next blood glucose reading when dosing at d_110, with 90% interval and out-of-range probabilities.
</object>

Overall, this is good intuition building. It's pointing clearly in a direction my wife and I already suspected from watching Sudo day to day: his current dose is probably running below what he actually needs. Again, this is a very simple model, mostly for purposes of learning a bit about setting up an autoregression. We'll rely on the vet's experience to actually set a target dose.

Next steps from a modeling perspective would be to keep collecting readings to sharpen the uncertainty windows further, and, with enough data points, build a hierarchical model with the dose window effect.
