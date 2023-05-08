/*
 * This code was generated for the blog post "Sampling Regression Lines"
 * available at dmsenter89.github.io/post/23-05-sample-regression-lines/
 *
 * Author: Michael Senter, PhD
 */

%macro sample_regression(ds=, posterior=, n=);
proc surveyselect data=&posterior. method=srs n=&n.
                  out=SRS;
run;

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

proc sgplot data=&ds. noautolegend;
  scatter x=x y=y;
  %do i = 1 %to &n.;
    lineparm x=0 y=%scan(&intercepts, &i, ' ') 
         slope=%scan(&slopes, &i, ' ') / transparency=0.7;
  %end;

  xaxis min=&minx. max=&maxx.;
  yaxis min=&miny. max=&maxy.;
run;
%mend sample_regression;

filename url gs1 'https://raw.githubusercontent.com/sassoftware/doc-supplement-statug/main/Examples/m-n/mcmcgs1.sas';
%include gs1;

%sample_regression(ds=sashelp.class(rename=(Height=x Weight=y)),
                  posterior=work.classout,
                  n=15);
