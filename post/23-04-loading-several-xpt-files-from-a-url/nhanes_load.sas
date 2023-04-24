/*
 * This code was generated for the blog post "Loading Several XPT Files From a URL"
 * available at dmsenter89.github.io/post/23-04-loading-several-xpt-files-from-a-url/
 *
 * Author: Michael Senter, PhD
 */

options dlcreatedir;

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

data _NULL_;
    set nhanes.datasets;
    call execute('%load_data(name='||df||');');
run;
