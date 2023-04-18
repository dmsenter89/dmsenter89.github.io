/*
 * This code was generated for the blog post "Are the Rich Paying Their Fair Share?"
 * available at dmsenter89.github.io/post/23-04-are-the-rich-paying-their-fair-share/.
 * 
 * Graphs are output to path &TAXDIR. if defined, otherwise to `~/data`.
 *
 * Author: Michael Senter, PhD
 */

/* Convenience snippet. */
%if %symexist(TAXDIR) ne %then %do; 
	%put Workdir not set. Setting to Home;
	%let TAXDIR=~;
%end;
%put Current working directory is &TAXDIR.;

/* temp file so the import needs only one download */
filename _httpin temp;

proc http method="get" url="https://www.irs.gov/pub/irs-soi/20in41ts.xls" 
		out=_httpin;
run;

/* load the data from excel sheet */
%macro get_table(name=, range=);
proc import datafile=_httpin out=&name. dbms=XLS replace;
    range="&range.";
run;

proc transpose data=&name.(drop=B)
    out=&name.(drop=_LABEL_ rename=(Col1=&name.))
    name=ExcelCol;
    by A;
run;
%mend;

%get_table(name=AGISH, range=TAB1$A134:P153);
%get_table(name=TAXSH, range=TAB1$A155:P174);

/* Join and Reformat the Data */
proc format;
	invalue coln 'C'=0.00001 'D'=0.0001 'E'=0.001 'F'=0.01 'G'=0.02 
                 'H'=0.03 'I'=0.04 'J'=0.05 'K'=0.10 'L'=0.20 
                 'M'=0.25 'N'=0.30 'O'=0.40 'P'=0.50;
run;

proc sql;
    create table IRS as 
    select T.A as Year label="Year"
        , input(T.ExcelCol, coln.) as Percentile 
               format=PERCENT10.3 label="Top Percentile"
        , TAXSH/100 as CumTaxShare 
                format=PERCENT10.3 label="Cumulative Tax Share"
        , AGISH/100 as CumAGIShare 
                format=PERCENT10.3 label="Cumulative AGI Share"
        , calculated CumTaxShare/calculated CumAGIShare as Ratio
                format=8.3
        from TAXSH as T left join AGISH as G
        on T.A = G.A and T.ExcelCol=G.ExcelCol
        order by Year, calculated Percentile;
quit;

/* Visualization */
ods listing gpath="&TAXDIR.";

ods graphics / imagename="PVCTSH" imagefmt=png;
proc sgplot data=IRS;
    where year=2020;
    loess x=Percentile y=CumTaxShare / legendlabel="Actual";
    lineparm x=0 y=0 slope=1 / CLIP 
        legendlabel="Reference"
        lineattrs=(color=gray pattern=dash);
     xaxis ranges=(0.0-0.5) 
     	values=(0.01 0.05 0.1 0.2 0.3 0.4 0.5)
     	tickvalueformat=PERCENT10.;
run;

/* Calculating the TINI Coefficient */
data tini;
	set irs;
	by Year;

    /* setup lag values */
	LagPercentile = lag(Percentile);
	LagTax = lag(CumTaxShare);
	If first.Year then do;
		LagPercentile = 0; LagTax = 0;
		Sum = 0;
	end;

    /* trapezoid rule for area under curve */
	TaxCurve = (Percentile-LagPercentile)*(CumTaxShare + LagTax)/2;
	EqualityCurve = (Percentile**2 - LagPercentile**2)/2;
	
    /* Output TINI once year is processed */
    Diff = (TaxCurve-EqualityCurve);
	Sum + Diff;
	if last.Year then do;
		TINI = Sum / (3/8);
		output;
	end;
	
	Drop Lag: TaxCurve EqualityCurve Diff Sum;
run;

ods graphics / imagename="TINI" imagefmt=png;
proc sgplot data=tini noautolegend;
	loess x=Year y=Tini;
	xaxis values=(2000 2005 2010 2015 2020);
	yaxis ranges=(0.65-.8) values=(0.65 0.7 0.75 0.8);
run;

/* Dot Plot of Ratio */
ods graphics / imagename="RATIO_DOT" imagefmt=png;
proc sgplot data=irs(where=(Percentile<0.1)) noautolegend;
	dot percentile / response=Ratio stat=mean limitstat=stddev numstd=1;
	xaxis label='Ratio of Cumulative Tax Share / Cumulative AGI Share'; 
run;
