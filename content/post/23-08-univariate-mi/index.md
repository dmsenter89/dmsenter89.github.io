---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Univariate Missing Data with PROC MI"
subtitle: ""
summary: ""
authors: []
tags: ["bayesian", "missing-data", "r", "sas"]
categories: []
date: 2023-08-13
lastmod: 2023-08-13
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

In Chapter 3 of van Buuren's _Flexible Imputation of Missing Data_ a variety of methods for imputing univariate missing data are presented. This post will summarize these techniques and show how to implement them in SAS.

{{<toc>}}

## Preliminaries
Van Buuren demonstrates various techniques using data set 88 from Hand et al (1994). This data set is availabe from R's MASS library as `data("whiteside")`. The original data set can be downloaded from the [publisher's website](https://www.routledge.com/A-Handbook-of-Small-Data-Sets/Hand-Daly-McConway-Lunn-Ostrowski/p/book/9780367449667). The name of the relevant data file is INSULATE.DAT. If you want to follow along using SAS, you can use [this data step](./code/whiteside.sas). It matches the way the data appears in R except that I have added a variable `R` indicating the observation that van Buuren deletes for demonstration purposes.

For purposes of this post, we assume one or more predictors $x$ are completely observed, while some variable of interest $y$ is only partially observed. Methods for dealing with this type of problem are available using the [monotone](http://documentation.sas.com/doc/en/statug/15.2/statug_mi_syntax09.htm) keyword in PROC MI. A data set has a monotone missing pattern if it consists of variables $Y_1$, $Y_2$, $\ldots$, $Y_p$ such that if $Y_j$ is missing for one individual, all subsequent variables $Y_k$ for $j < k \leq p$ are also missing. Schematically, the data set will look like this:   

$$R = \begin{bmatrix} 1 & 1 & 1 \\\ 1 & 1 & 0 \\\ 1 & 0 & 0 \end{bmatrix}$$

where 1 indicates an observed value and 0 a missing value. The monotone statement in SAS can impute missing values by completing the columns in turn using univariate methods. See the [SAS documentation](http://documentation.sas.com/doc/en/statug/15.2/statug_mi_details06.htm) for specifics.


## Imputing under a Normal Linear Model

For completion, I will mention all of the main linear model methods van Buuren mentions in his text, even though the first two are not implemented in PROC MI.

### Regression Imputation
Van Buuren also refers to this as the "prediction" method. In essence, the complete cases are used to create a linear model. This linear model is then used to fill in the missing values:

$$ \dot{y} = \hat\beta_0 + X_\text{mis}\\,\hat\beta_1$$

where $\hat\beta_i$ are least squares estimates. 

This method has a variety of drawbacks. For one, it artificially strengthens the relationships between variables as they appear in the linear model by increasing correlations. Variability in the data is reduced. See section [1.3.4](https://stefvanbuuren.name/fimd/sec-simplesolutions.html#sec:regimp) in van Buuren for details.

The mice package implements this method as `norm.predict`. PROC MI does not implement this method; to use this technique in SAS, you could use the regression PROCs or IML.


### Stochastic Regression Imputation
This method proceeds as above, except that Gaussian noise is added to the imputed value:
$$ \dot{y} = \hat\beta_0 + X_\text{mis}\\,\hat\beta_1 + \dot\epsilon$$
where $\dot\epsilon \sim N(0, \hat\sigma^2)$. An advantage of this method over plain regression is that it can preserve correlation between variables. 

The mice package implements this method as `norm.nob`. It is not available in PROC MI but can be implemented with IML.

### Bayesian/Bootstrap Multiple Imputation
Van Buuren also refrers to this as "predict + noise + parameters uncertainty." This technique is based on a Bayesian linear regression using draws from the posterior as parameters:
$$\dot y = \dot\beta_0 + X_\text{mis}\\, \dot\beta_1 + \dot\epsilon$$
where $\dot\epsilon\sim N(0,\dot\sigma^2)$ and $\dot\beta_i$, $\dot\sigma$ are random draws from the posterior distribution.  

This the default method in PROC MI for continuous data. Both SAS and mice use an algorithm based on Rubin (1987, pp. 166-167). See the [SAS documentation](http://documentation.sas.com/doc/en/statug/15.2/statug_mi_details07.htm) and [Algorithm 3.1](https://stefvanbuuren.name/fimd/sec-linearnormal.html#def:norm) in van Buuren for details. The mice package implements this method as `norm`. Here is an example of how the Bayesian regression can be used in PROC MI:

```sas
proc mi data=whiteside_miss out=regimp nimpute=5;
	var temp gas;
	monotone regression(gas);
run;
```

The regression keyword may be abbreviated as `reg`. A fully worked example is available in the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_examples03.htm), with the associated code available on [GitHub](https://github.com/sassoftware/doc-supplement-statug/blob/main/Examples/m-n/miex3.sas).

The mice package also implements a variant of this method using bootstrapping instead of a Bayesian model. This method is available as `norm.boot`.

### What if my data are non-normal?
In case the data are non-normal, one could proceed to a non-regression technique like [predictive mean matching](#predictive-mean-matching). Alternatively, one could adjust the regression methods to utizilise a generalized linear model instead. That technique is implemented in the [ImputeRobust](https://github.com/dsalfran/ImputeRobust) package for R. See section [3.3](https://stefvanbuuren.name/fimd/sec-nonnormal.html) in van Buuren for details.


## Predictive Mean Matching
Similar to [Bayesian regression](#bayesianbootstrap-multiple-imputation) above, a predicted value is calculated for each missing observation. Instead of adding noise to this prediction, however, a set of $k$ observations whose predicted values are close to the predicted missing value are sought. The missing value is then replaced by a random draw from this set of candidate donors. In mice, this method is available as `pmm`. In PROC MI, you can use the `regpredmeanmatch` keyword:

```sas
proc mi data=whiteside_miss out=regimp nimpute=5;
	var temp gas;
	monotone regpredmeanmatch(gas);
run;
```

The keyword `regpredmeanmatch` may be abbreviated as `regpmm`.

The predictive mean matching method is robust to transformations of the target variable. It may be used with both continuous and discrete data and will always generate realistic data in the sense that all generated data has been observed. Since this does not require an explicit model to describe the distribution of missing values, it is more resilient to model misspecification. 

See the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_details08.htm) and [section 3.4](https://stefvanbuuren.name/fimd/sec-pmm.html) in van Buuren for details.

## Classification and Regression Trees
An idea borrowed from the machine learning community and implemented in some R packages. In essence, the idea is similar to utiziling linear regression models except that a regression tree is utilized instead. See [section 3.5](https://stefvanbuuren.name/fimd/sec-cart.html) in van Buuren.


## The Propensity Score Method
With this method, propensity scores are generated for each observation estimating the probability of it being missing. The observations are then grouped by their propensity scores and an approximate Bayesian bootstrap imputation is carried out for each group. See [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_details18.htm) for details. 

A fully worked example is available in the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_examples02.htm), with the associated code available on [GitHub](https://github.com/sassoftware/doc-supplement-statug/blob/main/Examples/m-n/miex2.sas):

```sas
proc mi data=Fish1 out=outex2;
   monotone propensity;
   var Length1 Length2 Length3;
run;
```

This method is not implemented in the mice package.

## Categorical and Count Data
### The Logistic and Logit Models
Logit based regression models can be used both for nominal and ordinal data. The imputed value is generated from a Bayesian logistic regression model. The mice package implements this method as `logreg`. PROC MI uses the `logistic` keyword. An example of its usage is given in the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_examples04.htm), with the associated code available on [GitHub](https://github.com/sassoftware/doc-supplement-statug/blob/main/Examples/m-n/miex4.sas). Here's the example code:

```sas
proc mi data=Fish2 out=outex4;
   class Species;
   monotone reg(Width/ details)
            logistic(Species = Length Width Length*Width/ details);
   var Length Width Species;
run;
```

This imputes the width variable using the [Bayesian linear regression](#bayesianbootstrap-multiple-imputation) while imputing the categorical species variable using the logistig regression method. 

See the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_details13.htm) for details. 

### The Discriminant Function Method
This method is the default for categorical data in PROC MI. See the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_details09.htm) for details.

A fully worked example is available in the [SAS documentation](https://documentation.sas.com/doc/en/statug/15.2/statug_mi_examples05.htm), with the associated code available on [GitHub](https://github.com/sassoftware/doc-supplement-statug/blob/main/Examples/m-n/miex5.sas). Here is the MI call:

```sas
proc mi data=Fish2 out=outex5;
   class Species;
   monotone discrim(Species = Length Width/ details);
   var Length Width Species;
run;
```

The mice package does not implement this method.


## References
Hand, D. J., F. Daly, A. D. Lunn, K. J. McConway, and Ostrowski,  E. (1994), _A Handbook of Small Data Sets_, London: Chapman &amp; Hall.

Rubin, D. B. (1987), _Multiple Imputation for Nonresponse in Surveys_, New York: John Wiley &amp; Sons.

van Buuren, S. (2018), _Flexible Imputation of Missing Data_, Chapman and Hall/CRC interdisciplinary statistics series, Boca Raton: CRC Press, Taylor and Francis Group. Available at https://stefvanbuuren.name/fimd/.

