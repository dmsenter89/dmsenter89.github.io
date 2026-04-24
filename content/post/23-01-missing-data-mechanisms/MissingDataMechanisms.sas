/*************************************************************************/
/*     MISSING DATA MECHANISMS - Example Code                            */
/*                                                                       */
/* This file contains accompanying code for my blog post on MDM          */   
/* available at dmsenter89.github.io/post/23-01-missing-data-mechanisms/ */
/*                                                                       */
/* Author: Michael Senter, PhD                                           */
/*************************************************************************/

data full;
    CALL streaminit( 451 ); 
    
    LABEL
        Type = 'Missing Data Mechanism'
        S = 'Amount of Studying'
        H = 'Homework Score'
        Hm = 'Observed Homework Score'
    ;

    DO i=1 to 100;
        TYPE = 'FULL';
        S = RAND('NORM');
        H = RAND('BINO', LOGISTIC(S), 10);
        Hm = H;
        output;
        
        /* Example 1) MCAR */
        TYPE = 'MCAR';
        if RAND('BERN', 0.5) then Hm = .;
            else Hm = H;
        output;
        
        /* Example 2) MAR */
        TYPE = 'MAR';
        if S>0 then Hm = .;
            else Hm = H;
        output;
        
        /* Example 3) MNAR */
        TYPE = 'MNAR';
        if H<5 then Hm = .;
            else Hm = H;
        output;
    
    END;
    
    drop i;
run;

/* We juse a format and SQL statemen to get our data logically sorted  */
proc format;
	value $tfmt 'FULL' = 1 'MCAR' = 2 'MAR' = 3 'MNAR' = 4;
run;

proc sql;
	create table ordered as 
	select * from full
	order by put(type, $tfmt.); /* sorts by formatted value */
run;

/* save boxplot to userdir */
ods listing gpath="&USERDIR./";
ods graphics / imagename="mdm_boxplot" imagefmt=png;
proc sgplot data=ordered;
	vbox Hm / group=type;
run;