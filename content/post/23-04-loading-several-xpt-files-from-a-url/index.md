---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Loading Several XPT Files From a URL"
subtitle: ""
summary: ""
authors: []
tags: ['import', 'macro', 'nhanes', 'sas', 'xpt']
categories: []
date: 2023-04-24
lastmod: 2023-04-24
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
    url: 'nhanes_load.sas'

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

The SAS Transport File Format (XPORT) is an open file format maintained by SAS for exchanging datasets. Its use is mandated by the FDA for data set submission for new drug or device applications and the CDC uses this format to distribute public data. For details regrading this format, see [this Library of Congress page](https://www.loc.gov/preservation/digital/formats/fdd/fdd000464.shtml). This post will explore how to read several of these files into a SAS session with the URL filename statement using the National Health and Nutrition Examination Survey, or [NHANES](https://www.cdc.gov/nchs/nhanes/index.htm), as an example.

## Loading a Single XPT File
By far the easiest way to read an XPT file is to use the `XPT2LOC` autocall macro if it is available on your SAS installation. As an example, this snippet would load the demographics table from the 2017-2018 NHANES data set into the work library:

```sas
filename demo "/data/Nhanes/2017-2018/DEMO_J.XPT";
%XPT2LOC(filespec=demo, libref=work);
```

This macro correctly resolves the name of the data set, and it would be available as `work.demo_j` now.[^1] See the [documentation](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/movefile/p1tp8gighlgeifn173i6kzw2w3bu.htm) for more details on this macro.

If we cannot or do not want to use this macro, we'll have to assign a LIBREF to the XPT file. This might seem weird at first, because you typically will only find a single data set in an XPT file. But if you consider that the file standard allows for multiple data sets to reside in the same XPT file, it makes sense. Using the LIBREF, we can achieve the same result as above using this snippet:

```sas
filename xpt url "https://wwwn.cdc.gov/Nchs/Nhanes/2017-2018/DEMO_J.XPT";
libname xpt xport;

proc copy in=xpt out=work; run;
```

## Loading Multiple XPT Files with a Macro

This is all fine if you only need to load one or two files that way, but becomes tedious (and repetitive) if you have to load many data sets this way. Ignoring the restricted data sets for a minute, NHANES contains many data sets spread across five domains:

| Domain             | # of Data Sets |
|--------------------|---------------:|
| Demographics Data  |              1 |
| Dietary Data       |             14 |
| Examination Data   |             14 |
| Laboratory Data    |             51 |
| Questionnaire Data |             44 |
| **TOTAL**          |            124 |

Even if you only need a subset of this, you'll find yourself wanting to shortcut having to type out all the repetitive information. This is where a macro call comes in handy.

A great trick for this is to use a codebook like data set that you can iterate over. Here is a minimal example using four data sets from NHANES:

```sas "codebook"
/* create a location to hold saved data */
libname nhanes '~/data/NHANES';

data nhanes.datasets;
    length df $10. dfname $100.;
    input df $ dfname $;
    infile datalines dsd;
datalines;
DEMO_J,Demographic Variables and Sample Weights
BPX_J,Blood Pressure
BMX_J,Body Measures
OHXDEN_J,Oral Health - Dentition
;
run;
```

You can either create this data set yourself or use a webscraping tool to make it for you. Wrapping the autocall macro or the PROC COPY into a macro is straightforward:

```sas "macro"
%macro load_data(name=);
  /* allow bad SSL; this is due to an issue with cdc.gov */
  options set=SSLREQCERT="allow";

  /* set up for import */
  filename xpt url "https://wwwn.cdc.gov/Nchs/Nhanes/2017-2018/&name..XPT";
  libname xpt xport;

  proc copy in=xpt out=nhanes; run;

  /* make sure to clear libname & filename for next macro call */
  filename xpt; libname xpt;
%mend;
```

The only question now is how to trigger this macro for each data set listed in `nhanes.datasets`. That's where the [CALL EXECUTE](https://go.documentation.sas.com/doc/en/pgmsascdc/v_031/lefunctionsref/p1blnvlvciwgs9n0zcilud6d6ei9.htm) routine comes in. It allows us to invoke a macro for each line in the source data set while giving us access to the variables in the source data. Since this is executed as part of a data step, you can use more fine grained control by having if/else conditions, where clauses, etc. In our example, we'd use this data step:

```sas "iteration"
data _NULL_;
    set nhanes.datasets;
    call execute('%load_data(name='||df||');');
run;
```

After running our script, the folder specified by `libname nhanes` will contain both our "codebook" of data sets, as well as all of the data sets listed in the file.

<!-- 
```sas nhanes_load.sas
/*
 * This code was generated for the blog post "Loading Several XPT Files From a URL"
 * available at dmsenter89.github.io/post/23-04-loading-several-xpt-files-from-a-url/
 *
 * Author: Michael Senter, PhD
 */

options dlcreatedir;

<<<codebook>>>

<<<macro>>>

<<<iteration>>>
```

-->

[^1]: Note that using this macro requires you to first download the file for processing. You can do this easily with a [TEMP filename](https://documentation.sas.com/doc/en/pgmsascdc/v_037/lestmtsglobal/p05r9vhhqbhfzun1qo9mw64s4700.htm) statement.