---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sampling Regression Lines"
subtitle: ""
summary: ""
authors: []
tags: ["bayesian", "regression", "sampling", "sas"]
categories: []
date: 2023-05-08
#lastmod: 2023-04-19T
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

links:
  - icon_pack: fas
    icon: file-code
    url: 'sample-regression.sas'

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

[Last week]({{< relref "/post/23-05-simple-regression-with-proc-mcmc" >}}) we saw how to generate posterior samples using PROC MCMC for simple linear and logistic regression models. This week, I want to show how to sample regression lines from the data set returned by MCMC by plotting several sample regression linse on top of a scatter plot of the source data.

## Writing the Macro
Since the majority of the steps are identical irrespective of what data set we use, and because we might want to use this iteretively during model building, I decided to write this up as a macro. To some degree this is required since I will be using a macro do-loop, which is only valid when embedded inside of a macro.

This macro will assume we have fitted a simple linear model of the form 

\begin{aligned}
y_i &\sim \mathrm{Normal}(\mu_i, \sigma) \\\\
\mu_i &= \beta_0 + \beta_1 x_i
\end{aligned}

### Step 1: Get an SRS Sample
The first step is the simplest - selecting a subset of the posterior samples. This is easily achieved by calling [PROC SURVEYSELECT](https://support.sas.com/rnd/app/stat/procedures/surveyselect.html).

```sas "srs"
proc surveyselect data=&posterior. method=srs n=&n.
                  out=SRS;
run;
```

### Step 2: Make a Macro List of Parameters
Next we need to generate a list of intercepts and slopes. I find it easiest to read those in PROC SQL using the `into` operation. Additionally, we'll also collect the $x$- and $y$-ranges of our data. This will be used to make sure our plot is centered on the scatter-plot values of our source data set.

```sas "parameter-list"
proc sql noprint;
  select beta0, beta1 
  into :intercepts separated by ' ',
       :slopes  separated by ' '
  from SRS;

  select min(x), max(x),
         min(y), max(y)
  into :minx, :maxx,
       :miny, :maxy
  from &ds.;
quit;
```

### Step 3: Macro-Loop to Add Lines to a Scatter Plot
Now all the parts have been assembled and you can call PROC SGPLOT. We use the [scatter](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/grstatproc/p1lcbd3lhs3t3bn1jk6d8sjt2yqx.htm) statement to create a scatter plot of the source data. Then we use a do-loop to iteratively paste different [lineparm](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/grstatproc/n1h6n82pw2uqo6n10avwmph63r7o.htm) statements corresponding to our different samples into the SGPLOT statement. Lastly, use the [xaxis](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/grstatproc/n0n6uml63c6h8dn16phbd1arm9g9.htm) and [yaxis](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/grstatproc/n0n6uml63c6h8dn16phbd1arm9g9.htm) statements to focus the graph on the scatter plot data, and not forcing the x-intercepts of the different fitted lines into

```sas "lineparm"
proc sgplot data=&ds. noautolegend;
  scatter x=x y=y;
  %do i = 1 %to &n.;
    lineparm x=0 y=%scan(&intercepts, &i, ' ') 
         slope=%scan(&slopes, &i, ' ') / transparency=0.7;
  %end;

  xaxis min=&minx. max=&maxx.;
  yaxis min=&miny. max=&maxy.;
run;
```
## Calling the Macro

And that's it. Assuming we declared the macro as follows

```sas "macro-first-line"
%macro sample_regression(ds=, posterior=, n=);
```

we can now call it.

As a particular example, let's run PROC MCMC's getting started example 1 straight from [GitHub](https://github.com/sassoftware/doc-supplement-statug/blob/main/Examples/m-n/mcmcgs1.sas):

```sas "mcmc-gs1"
filename url gs1 'https://raw.githubusercontent.com/sassoftware/doc-supplement-statug/main/Examples/m-n/mcmcgs1.sas';
%include gs1;
```

In this example, we predict weight based on height in the `sashelp.class` data set. The posterior samples are available as `work.classout`. We'll want to rename the height and weight variables to $x$ and $y$ in order to work with the chosen macro names. This is easily accomplished by using the `rename` statement in the macro call itself. We'll call it with $n=15$. 

```sas "macro-call"
%sample_regression(ds=sashelp.class(rename=(Height=x Weight=y)),
                  posterior=work.classout,
                  n=15);
```

This will produce the following output:

{{< figure src="class-regression-sample.png" >}}

With slight modifications you can also use this macro to help you refine your priors. By using the

```sas
model general(0);
```
statement in PROC MCMC in lieu of a regular model you will get estimates of the prior parameters. See the [documentation](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/statug/statug_mcmc_examples01.htm) for examples.

<!-- 
```sas sample-regression.sas
/*
 * This code was generated for the blog post "Sampling Regression Lines"
 * available at dmsenter89.github.io/post/23-05-sample-regression-lines/
 *
 * Author: Michael Senter, PhD
 */

<<<macro-first-line>>>
<<<srs>>>

<<<parameter-list>>>

<<<lineparm>>>
%mend sample_regression;

<<<mcmc-gs1>>>

<<<macro-call>>>
```
-->

