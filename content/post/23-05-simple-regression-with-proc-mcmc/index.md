---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Simple Regression With PROC MCMC"
subtitle: ""
summary: ""
authors: []
tags: ['bayesian', 'mcmc', 'regression', 'sas']
categories: []
date: 2023-05-02
#lastmod: 2023-05-26
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

In this post I'll show how to fit simple linear and logistic regression models using the [MCMC](https://support.sas.com/rnd/app/stat/procedures/mcmc.html) procedure in SAS. Note that the point of this post is to show how the mathematical model is translated into PROC MCMC syntax and not to discuss the method itself. I will include links to relevant sections in Johnson, Ott, and Dogucu (2022) if you'd like to read more about Bayesian modeling.


## The MCMC Statement

The basic [syntax](https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.4/statug/statug_mcmc_syntax.htm) for MCMC is as follows:

```nohighlight
proc mcmc <options>;
    parms parameter <=> number </options>;
    prior parameter ~ distribution;
    programming statements;
    model varaiable ~ distribution </options>; 
```

This covers the basic components of most Bayesian models - the model itself (`model`), the parameters that need to be fit (`parms`), and their prior distribution (`prior`). Note that PROC MCMC requires you to always specify your priors, unlike some Bayesian modeling software that will default to some diffuse priors when they are omitted from the problem statement.

The most common options you'll use in the MCMC statement will be

- `data=` the name of the input data set.
- `outpost=` the name of the output data set for posterior samples of parameters.
- `nbi=` the number of burn-in iterations.
- `nmc=` the number of MCMC iterations, excluding the burn-in iterations.
- `seed=` specify a random seed for the the simulation.
- `thin=` specify the thinning rate; see [here](https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.4/statug/statug_introbayes_sect016.htm#statug.introbayes.bayesburnin) for more details.

The names and function calls for the included distributions are described in the documentation on the [MODEL statement](https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.4/statug/statug_mcmc_syntax09.htm#statug_mcmc002612). Their density definitions are documented [here](https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.4/statug/statug_mcmc_details17.htm).

## A Simple Linear Model

A basic linear model looks something like this:

\begin{aligned}
y_i &\sim \mathrm{Normal}(\mu_i, \sigma) \\\\
\mu_i &= \beta_0 + \beta_1 x_i
\end{aligned}

which will need to be combined with priors for $\beta_0$, $\beta_1$, and $\sigma$. Assume we have a data set `work.mydata` that contains two variables: our predictor `x` and our measured variable `y`. Assume we use the above model together with the following priors:

\begin{aligned}
\beta_0 &\sim \mathrm{Normal}(0, 10) \\\\
\beta_1 &\sim \mathrm{Normal}(0, 10) \\\\
\sigma &\sim \mathrm{Uniform}(0,50).
\end{aligned}

Translating this into PROC MCMC is straightforward. Even though we can specify the statements in any order, it is common to define the model "upside down" so that each line contains only variables that have already been defined. This is for convenience, so you don't forget to specify something before hitting "run."

```sas
proc mcmc data=mydata
      outpost=posterior /* posterior sim */
      nmc=2000; /* # of data points in posterior */
    /* define the parameters. Optionally give an initial value */
    parms beta0 0 beta1 1;
    parms sigma; /* no initial value - mcmc finds its own */
    
    * define your priors;
    prior beta: ~ normal(mean=0, sd=10);
    prior sigma ~ uniform(0, 50);
    
    * define the mean and the model;
    mu = beta0 + beta1*x;
    model y ~ normal(mu, sd=sigma);
run;
```

For more info on simple regression, check out [chapters 9-11](https://www.bayesrulesbook.com/chapter-9.html) in Bayes Rules!

## A Simple Logistic Model

A basic logistic model will look as follows:

\begin{aligned}
y_i &\sim \mathrm{Binomial}(n_i, p_i) \\\\
\mathrm{logit}(p_i) &= \beta_0 + \beta_1 x_i
\end{aligned}

combined with appropriate priors for $\beta_0$, $\beta_1$. Here $y_i$ is a positive integer response, $n_i$ is a count, and $x_i$ is still our predictor. In many medical studies we are interested in the special case where $y_i \in \\{0,1\\}$ so that the model becomes

\begin{aligned}
y_i &\sim \mathrm{Bern}(p_i) \\\\
\mathrm{logit}(p_i) &= \beta_0 + \beta_1 x_i.
\end{aligned}

Let's assume a diffuse prior like this:

\begin{aligned}
\beta_0 &\sim \mathrm{Normal}(0, 100) \\\\
\beta_1 &\sim \mathrm{Normal}(0, 100).
\end{aligned}

Then we can translate to PROC MCMC as follows:

```sas
proc mcmc data=mydata
      outpost=posterior /* posterior sim */
      nmc=2000; /* # of data points in posterior */
    parms (beta0 beta1) 0;
    prior beta: ~ normal(0, sd=100);

    /* now define the logistic part: */
    p = logistic(beta0 + beta1*x);
    model y ~ bern(p);
run;
```

Often we are not so much directly interested in the $\beta$ coefficients, but in the odds $e^{\beta_0}$ and the multiplicative change in odds $e^{\beta_1}$. While these values can be calculated and analyzed from the `outpost` data set, we can use the `nodata` block (delimited by `beginnodata` and `endnodata` statements) to directly calculate these values in our simulation. The amended procedure reads like this:

```sas
proc mcmc data=mydata
      outpost=posterior
      nmc=2000
      monitor=(odds modds);
    parms (beta0 beta1) 0;
    prior beta: ~ normal(0, sd=100);

    beginnodata;
      odds = exp(beta0);
      modds = exp(beta1);
    endnodata;

    p = logistic(beta0 + beta1*x);
    model y ~ bern(p);
run;
```

See [chapter 13](https://www.bayesrulesbook.com/chapter-13.html) in Bayes Rules! for more info on logistic regression models.

## Adding a Random-Effect

Random-effects, also known as hierarchical modeling, looks at group structures in the data seta nd models group-specific effects. In a clinical setting, this might be the study site.

As a simple example, assume we have a data set `ht` containing the height (`h`) and sex (`s`) of a population sample. Assume we are interested in modeling the distribution of height in our data set. We know that on average males are taller than females (mean 167 cm vs 156 cm based on NHANES 2006). We could build a model similar to this:

\begin{aligned}
h_i &\sim \mathrm{Normal}(\mu_i, \sigma) \\\\
\mu_i &= \alpha_{\mathrm{sex[i]}} \\\\
\alpha_j &\sim \mathrm{Normal}(160, 20) \quad \text{for } j=1,2 \\\\
\sigma &\sim \mathrm{Uniform}(0,50).
\end{aligned}

In SAS, the random effect is specified with the [random](https://go.documentation.sas.com/doc/en/pgmsascdc/9.4_3.4/statug/statug_mcmc_gettingstarted03.htm) statement. We specify the categories with the `subject` keyword in the random statement. SAS will then automatically create the necessary number of parameters for the random effect. Our model translates to the following MCMC call:

```sas
proc mcmc data=ht
      outpost=posterior
      nmc=2000;
    parms sigma 5 sigmaA 6;
    prior sigma: ~ uniform(0,50);

    random alpha ~ normal(160, sd=sigmaA) subject=s monitor=(alpha);
    mu = alpha;
    model h ~ normal(mu, sd=sigma);
run;
```

Assuming $s\in\\{1,2\\}$ this will cause SAS to create two alpha variables for the two levels of `s`: `alpha_1` and `alpha_2`. Had `s` been a character variable, say with values m and f, then SAS would have created `alpha_m` and `alpha_f` instead.

For more information on this, check out [unit IV](https://www.bayesrulesbook.com/chapter-15.html) of Bayes Rules!


## Reference

Johnson, A. A., Ott, M. Q., and Dogucu, M. (2022), _Bayes Rules!: An Introduction to Applied Bayesian Modeling_, Boca Raton, FL: CRC Press, DOI: [10.1201/9780429288340](https://doi.org/10.1201/9780429288340). Available online at [www.bayesrulesbook.com](https://www.bayesrulesbook.com/).