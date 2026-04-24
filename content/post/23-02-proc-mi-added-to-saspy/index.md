---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "PROC MI Added to SASPy"
subtitle: ""
summary: ""
authors: []
tags: ["missing-data", "python", "sas", "saspy"]
categories: ["missing-data"]
date: 2023-02-06T14:45:00-05:00
lastmod: 2023-02-06T14:45:00-05:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# link to produced script
links:
  - icon_pack: fab
    icon: python
    url: 'saspy_mi.py'

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---
I'm excited to announce that the new [SAPy v4.6.0](https://github.com/sassoftware/saspy/releases/tag/v4.6.0) release includes a pull request of mine that adds [PROC MI](https://go.documentation.sas.com/doc/en/statug/15.2/statug_mi_toc.htm) to the SAS/STAT procedures directly exposed in SASPy. This procedure allows you to analyze missing data patterns and create imputations for missing data.

## Syntax
PROC MI is accessed via the `mi` function that has been added to the `SASstat` class. Like other procedures, the SAS statements in MI are called as keyword arguments to the function whose name matches the SAS [syntax](https://go.documentation.sas.com/doc/en/statug/15.2/statug_mi_syntax.htm):[^1]

```sas
PROC MI options;
  BY variables;
  CLASS variables;
  EM <options>;
  FCS <options>;
  FREQ variable;
  MCMC <options>;
  MNAR options;
  MONOTONE <options>;
  TRANSFORM transform (variables</ options>) <…transform (variables</ options>)>;
  VAR variables;
```

Here is the corresponding function signature in Python:

```python
def mi(self, data: ('SASdata', str) = None,
        by: (str, list) = None,
        cls: (str, list) = None,
        em: str = None,
        fcs: str = None,
        freq: str = None,
        mcmc: str = None,
        mnar: str = None,
        monotone: str = None,
        transform: str = None,
        var: str = None,
        procopts: str = None,
        stmtpassthrough: str = None,
        **kwargs: dict) -> 'SASresults':
```

Statements  like `EM` or `MCMC`, which can stand alone in SAS, are called with an empty string argument in Python.

## Basic Example

<!-- 
```python saspy_mi.py
#!/usr/bin/env python3
#
# Example: how to access PROC MI with SASPy. To accompany
#   dmsenter89.github.io/post/23-02-proc-mi-added-to-saspy
# 
# Author: Michael Senter, PhD

import saspy


# starting the SAS Session
<<<session>>>

<<<procmi>>>

<<<sasdata>>>


# ending the SAS session 
sas.endsas()
```
-->


To use the new MI functionality, make sure you have updated to the newest SASPy release. In addition to starting  a SAS Session as per usual, you will also want to enable access to the SAS/STAT procedures:

```python "session"
sas = saspy.SASsession()  # loads a session using your default profile
stat = sas.sasstat()      # gives access to SAS/STAT procedures 
```

Once these session objects are loaded, you can start using the mi function with `stat.mi`. The simplest possible call is to invoke MI with a built-in data set and all defaults as `stat.mi(data='sashelp.heart')`. For best results, store the output in a SASResults object. From there you can access the SAS log associated with the function call (`LOG`) as well as all ODS Output using the ODS [table names](https://go.documentation.sas.com/doc/en/statug/15.2/statug_mi_details82.htm) in all caps. The default uses the EM method with 25 imputations.

A more realistic use might look something like this:

```python "procmi"
ods = stat.mi(data='sashelp.heart', em="outem=outem",
              var="Cholesterol Height Smoking Weight",
              procopts="simple nimpute=20 out=imp")
```

This is equivalent to running 

```sas
proc mi data=sashelp.heart simple nimpute=20 out=imp;
    em outem=outem;
    var Cholesterol Height Smoking Weight;
run;
```

in SAS. This call uses the EM procedure to impute values for the cholesterol, height, smoking, and weight variables. The `simple` option displays univariate statistics and correlations. The `outem` option saves a data set containing the computed MLE to `work.outem`. The imputed data sets are saved to `work.imp`, which contains the additional variable `_IMPUTATION_` with the imputation number. This can be used as a `by` variable in other procedures, and the results can later be pooled using PROC MIANALYZE.

The resulting `ods` object for our example exposes the following ODS outputs to your Python instance, in addition to the log:

```
['CORR', 'EMESTIMATES', 'EMINITESTIMATES', 'EMPOSTESTIMATES', 'MISSPATTERN', 'MODELINFO', 'PARAMETERESTIMATES', 'UNIVARIATE', 'VARIANCEINFO']
```

See the SAS documentation for details. To use the imputed data with Python tools, create a SAS data object. We'll also print the first few entries so we can see what it looks like:

```python "sasdata"
imputed = sas.sasdata(table="imp", libref="work")
imputed.head()
```

[^1]: One exception is the SAS `class` statement, which is implemented as `cls` due to `class` being a reserved keyword in Python.
