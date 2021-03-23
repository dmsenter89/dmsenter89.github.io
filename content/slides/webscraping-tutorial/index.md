---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Webscraping Tutorial"
summary: ""
authors: []
tags: []
categories: []
date: 2020-07-30T12:30:00-04:00
slides:
  # Choose a theme from https://github.com/hakimel/reveal.js#theming
  theme: black
  # Choose a code highlighting style (if highlighting enabled in `params.toml`)
  #   Light style: github. Dark style: dracula (default).
  highlight_style: dracula
---

# Basics of Web Scraping with Python

Michael Senter


--- 

## Goals for Today

- {{% fragment %}}  Understand what tools and methods are available. {{% /fragment %}}
- {{% fragment %}} Be able to create a new project using Python and Jupyter.{{% /fragment %}}
- {{% fragment %}}Be able to edit existing code snippets to gather data. {{% /fragment %}}

---

## Python

- easy to learn, reads like "pseudocode"
- widely used in a variety of fields
- many books, websites, etc. to help you learn

```python
print("Hello, world!")
```

---

## Data Sources

--- 

## CSV/Excel Downloads

---

## COVID Related Data

--- 

## Johns Hopkins Dashboard


The Johns Hopkins data is published on [GitHub](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data) and is updated regularly. 


---
## Using SAS


```sas
filename outfile "~/import-data-nyt.sas";

/* download official SAS script to above filename */
proc http url="https://raw.githubusercontent.com/sassoftware/covid-19-sas/master/Data/import-data-nyt.sas" 
  method="get" out=outfile;
run;

/* run the downloaded script */
%include "~/import-data-nyt.sas";
/* state and county level data are now in memory */
```