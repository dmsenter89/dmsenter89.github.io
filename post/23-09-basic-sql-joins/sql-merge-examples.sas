data A;
	infile datalines dsd;
	input MRN Weight Chol_Status $10.;
datalines;
23356,140,
74592,,Desirable
79602,139,High
; run;

data B;
	infile datalines dsd;
	input MRN Weight Chol_Status $10.;
datalines;
64836,129,High
79602,139,High
2466,127,Borderline
; run;

proc sql;
	title 'Only in A';
    create table res1 as
        select A.* from
        A left join B 
        on A.MRN=B.MRN
        where B.MRN is NULL;
	
	title 'Only in B';
    create table res2 as
        select B.* from
        A right join B
        on A.MRN=B.MRN
        where A.MRN is NULL;
	
	title 'In Both';
    create table res3 as
        select A.* from 
        A inner join B
        on A.MRN=B.MRN;
	title;
quit;