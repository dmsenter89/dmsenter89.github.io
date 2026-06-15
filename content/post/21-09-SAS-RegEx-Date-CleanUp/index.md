---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Cleaning up a Date String with RegEx in SAS"
subtitle: ""
summary: ""
authors: []
tags: ["data-cleaning", "data-step", "regex", "sas"]
categories: [data-cleaning]
date: 2021-09-29T13:41:36-04:00
lastmod: 2021-09-29T13:41:36-04:00
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

Sometimes we have to deal with manually entered data, which means there is a good chance that the data needs to be cleaned for consistency due to the
inevitable errors that creep in when typing in data, not to speak of any inconsistencies between individuals entering data. 

In my particular case, I was recently dealing with a data set that included
manually calculated ages that had been entered as a complete string 
of the number of years, months, and days of an individual. Such a string
is not particularly useful for analysis and I wanted to have the age as
a numeric variable instead. Regular expressions can help out a lot in this
type of situation. In this post, we will look at a few representative examples
of the type of entries I've encountered and how to read them using RegEx in SAS.


## Let's Look at the Data

{{< figure src="RAW_DS.PNG" caption="What we're starting from.">}}

If we look at our sample data, we notice a few things. The data is consistently
ordered from largest to smallest, in the order of year, month, and day. 
For some lines, only the year variable is available. In all cases, the string 
starts with two digits. 

Separation of the time units is inconsistent; occasionally they are separated 
by commas, sometimes by hyphens, and in some cases by spaces alone. The terms
indicating the units are spelled and capitalized inconsistently as well. There
are some abbreviations and occasionally the plural 's' in days is wrapped in 
parentheses.

If you want to follow along, you can create the sample data with the 
following code: 

```sas
data raw;
    infile datalines delimiter = ',' MISSOVER DSD;
    attrib
        ID     informat=best32. format=1.
        STR_AGE informat=$500.   format=$500. label='Age String'
        VAR1   informat=best32. format=1.;
    input ID STR_AGE $ VAR1;

    datalines;
    1,"62 Years, 5 Months, 8 Days",1
    2,43 Yrs. -2 Months -4 Day(s), 2
    3,33 years * months 24 days, 1
    4,58,1
    5,"47 Yrs. -11 Months -27 Day(s)",2
    ;
run;
```

## The RegEx Patterns

We will use a total of three regex patterns, one for each of the time units:
year, month, day.  SAS uses Pearl regex and the function `prxparse` to define
the regex patterns that are supposed to be searched for. 

For the year variable, we need to match the first two digits in our string. 
Therefore, the correct call is `prxparse('/^(\d{2}).*/')`. Note that the
`(` and `)` delimit the capture group.

The month and day regex patterns are very similar. For the months, we want to
lazy-match the until we hit between one or two digits followed by 
an 'm' and some number of other characters. We use the `i` flag since
we cannot guarantee capitalization: `prxparse('/.*?(\d{1,2}).M.*/i')`.
The day pattern is nearly identical: `prxparse('/.*?(\d{1,2}).D\D*$/i')`.

We can extract our matches using the `prxposn` function. We use the
`prxmatch` function to check if we actually have a match:

```sas  
/* match into strings */
if prxmatch(year_rxid, STR_AGE)  then year_dig_str = prxposn(year_rxid,1,STR_AGE);
if prxmatch(month_rxid, STR_AGE) then month_dig_str = prxposn(month_rxid,1,STR_AGE);
if prxmatch(day_rxid, STR_AGE)   then day_dig_str = prxposn(day_rxid,1, STR_AGE);
```

The extracted strings can then be converted to numeric variables using 
the `input` function. 

The last step is the calculation of the age from the three components. 
Since not all three time units are specified for every row, we cannot use
the standard arithmetic of `years + months + days`, because the missing
values would propagate. We need to use the `sum` function instead.

Putting it all together, we get the correct output:

{{< figure src="FIXED_DS.PNG" caption="The Result">}}

## Complete Code

```sas
data fixed;
    set raw;
    
   /* define the regex patterns */
   year_rxid  = prxparse('/^(\d{2}).*/');
   month_rxid = prxparse('/.*?(\d{1,2}).M.*/i');
   day_rxid   = prxparse('/.*?(\d{1,2}).D\D*$/i');   /* match 2 digits followed by D and non-digit chars  */
  
   /* make sure we have enough space to store the extraction */
   length year_dig_str month_dig_str day_dig_str $4;
   
   /* match into strings */
   /* match into strings */
   if prxmatch(year_rxid, STR_AGE)  then year_dig_str = prxposn(year_rxid,1,STR_AGE);
   if prxmatch(month_rxid, STR_AGE) then month_dig_str = prxposn(month_rxid,1,STR_AGE);
   if prxmatch(day_rxid, STR_AGE)   then day_dig_str = prxposn(day_rxid,1, STR_AGE);
   
   /* use input to convert str -> numeric */
   years  = input(year_dig_str, ? 12.);
   months = input(month_dig_str, ? 12.);
   days   = input(day_dig_str, ? 12.);
   
   /* Use SUM function when calculating age
    to avoid missing values propagating  */
   age = sum(years,months/12,days/365.25);
   
   /* get rid of temporary variables */ 
   drop month_rxid month_dig_str year_rxid year_dig_str day_rxid day_dig_str;
   run;
   
proc print data=fixed; run;
```

