title1 "Exploring an Autoregression for Insulin Dosage";
title2 "The Model Basics";
ods noproctitle;
ods html style=HtmlBlue;
proc causalgraph;
  ods select AdjustList;
  model 'Sudo'
    BG_now --> Insulin_now --> BG_next,
    BG_now --> BG_next,
    Food_now --> BG_next,
    AM_now --> BG_next,
    AM_now --> Activity_now,
    BG_now --> Activity_now --> BG_next;
  unmeasured Activity_now;
  identify Insulin_now --> BG_next;
run;

title2 "Finding Reasonable Priors";
/* Set plot dimensions */
ods graphics / width=8in height=5in;

/* 1. DATA GENERATION */
data sim_data;
    call streaminit(123);

    array starts[5] _temporary_ (100, 125, 150, 300, 350);
    d_ref = 22.0;
    n_steps = 10;
    n_draws = 50;

    do i = 1 to dim(starts);
        start_bg = starts[i];
        length start_group $10;
        start_group = ifc(start_bg <= 150, "in-range", "elevated");

        do draw = 1 to n_draws;
            path_id = (i - 1) * n_draws + draw;

            mu_eq_raw = rand('NORMAL', 110, 30);
            mu_eq = max(mu_eq_raw, 1);
            gamma = rand('BETA', 8, 3);
            beta = -rand('GAMMA', 4, 0.01);
            /* Generate variance (sigma2), then convert to standard deviation (sigma) */
            ig_shape = 6;
            ig_scale = 0.9;
            sigma2 = ig_scale / rand('GAMMA', ig_shape);
            sigma = sqrt(sigma2);

            alpha = log(mu_eq) * (1 - gamma) - beta * d_ref;

            /* Time 0 Initialization */
            time = 0;
            day = time / 2; /* Convert 12-hour steps to days for the X-axis */
            bg = start_bg;
            log_bg = log(bg);

            if start_bg <= 150 then bg_inrange = bg;
            else bg_elevated = bg;

            if path_id = 1 then do; target_lo = 70; target_hi = 150; end;
            else do; target_lo = .; target_hi = .; end;

            output;

            /* Step forward in time */
            do time = 1 to n_steps;
                day = time / 2; /* Update days */

                mu = alpha + gamma * log_bg + beta * d_ref;
                log_bg = mu + rand('NORMAL', 0, sigma);
                bg = exp(log_bg);

                bg_inrange = .; bg_elevated = .;
                if start_bg <= 150 then bg_inrange = bg;
                else bg_elevated = bg;

                output;
            end;
        end;
    end;

    drop i draw mu_eq_raw mu_eq gamma beta sigma sigma2 alpha mu log_bg start_bg;
run;

/* 2. VISUALIZATION */
title "Simulated Blood Glucose Trajectories";
proc sgplot data=sim_data noautolegend;

    /* DECLARE CUSTOM LEGEND ITEMS: Bypasses the 150-group legend limit */
    legenditem type=fill name="leg_target" /
               fillattrs=(color=seagreen) label="target range (70-150)";
    legenditem type=line name="leg_inrange" /
               lineattrs=(color="#2a78d6" pattern=solid thickness=2) label="in-range start";
    legenditem type=line name="leg_elev" /
               lineattrs=(color="#d67a2a" pattern=solid thickness=2) label="elevated start";

    /* Target range background band */
    band x=day lower=target_lo upper=target_hi /
        fillattrs=(color=seagreen) transparency=0.88;

    /* In-range trajectories */
    series x=day y=bg_inrange /
        group=path_id
        lineattrs=(color="#2a78d6" pattern=solid thickness=1)
        transparency=0.88;

    /* Elevated trajectories */
    series x=day y=bg_elevated /
        group=path_id
        lineattrs=(color="#d67a2a" pattern=solid thickness=1)
        transparency=0.88;

    /* Axis formatting */
    xaxis label="Days" values=(0 to 5 by 1);

    /* ADDED MAX=600 to cap the Y-Axis */
    yaxis label="Blood Glucose (mg/dL)" values=(0 to 600 by 100) max=600;

    /* Use the custom legend items declared above */
    keylegend "leg_target" "leg_inrange" "leg_elev" /
        location=inside position=topright across=1 noborder valueattrs=(size=9);
run;
title;

proc sql noprint;
    create table target_summary as
    select start_group, day, sum(70<=bg<=150)/count(*) as pct_in_target
    from sim_data
    group by start_group, day
    order by start_group, day;
quit;

proc sgplot data=target_summary;
    series x=day y=pct_in_target / group=start_group markers
           lineattrs=(thickness=2) markerattrs=(symbol=circlefilled size=8);
    yaxis label="% in target range (70-150)" values=(0 to 1 by 0.2) valuesformat=percent8.0;
    xaxis label="Day";
    keylegend / location=inside position=topright;
run;

title2 "Fitting The Data";
data sudo_glucose;
    length DOSEWIN $2;
    input DATE : MMDDYY10. DOSEWIN $ GLUCOSE DOSE;
    period_index = _N_;
    label
        DATE    = "Observation Date"
        DOSEWIN = "Dosing Window (AM/PM)"
        GLUCOSE = "Blood Glucose (mg/dL)"
        DOSE    = "Vetsulin Dose (Units)";

    format DATE MMDDYY10.;

    datalines;
08/24/2026 AM 371  0.0
08/24/2026 PM 500 30.0
08/25/2026 AM 416 28.0
08/25/2026 PM 310 26.0
08/26/2026 AM 280 27.0
08/26/2026 PM 170 23.0
08/27/2026 AM 298 25.0
08/27/2026 PM 264 26.0
08/28/2026 AM 128 22.0
08/28/2026 PM 164 23.0
08/29/2026 AM  95 22.0
08/29/2026 PM 231 24.0
08/30/2026 AM 143 23.0
08/30/2026 PM 116 22.5
08/31/2026 AM 192 23.0
08/31/2026 PM 298 24.0
09/01/2026 AM 119 23.0
;
run;

proc print data=sudo_glucose label noobs;
    var DATE DOSEWIN GLUCOSE DOSE;
    title "Sudo Glucose Data";
run;

proc sql;
    create table sudo_analysis as
    select
        now.period_index,
        now.DATE,
        now.DOSEWIN,
        now.GLUCOSE as BG_now    label="Blood Glucose Now (mg/dL)",
        now.DOSE    as DOSE_now  label="Vetsulin Dose Now (Units)",
        nxt.GLUCOSE as BG_next   label="Blood Glucose Next Reading (mg/dL)"
    from sudo_glucose as now
    left join sudo_glucose as nxt
        on nxt.period_index = now.period_index + 1
    order by now.period_index;
quit;

proc print data=sudo_analysis label noobs;
    var DATE BG_now DOSE_now BG_next;
run;

proc mcmc data=sudo_analysis(where=(not missing(BG_next)))
          outpost=post nbi=2000 nmc=10000 seed=42 monitor=(mu_eq beta sigma2 d_110);
    ods exclude Parameters Nobs;

    parms mu_eq 110 gamma 0.7 sigma2 0.4;
    parms beta_mag 0.04; /* Track the positive magnitude */

    prior mu_eq    ~ normal(110, sd=30);
    prior gamma    ~ beta(8, 3);
    prior beta_mag ~ gamma(4, scale=0.01); /* Strictly positive prior */
    prior sigma2   ~ igamma(shape=6, scale=0.9);

    d_ref     = 22;
    logBGnow  = log(BG_now);
    logBGnext = log(BG_next);

    /* Flip the sign so beta is strictly negative */
    beta = -beta_mag;

    alpha = log(mu_eq) * (1 - gamma) - beta * d_ref;
    mu    = alpha + gamma * logBGnow + beta * DOSE_now;

    model logBGnext ~ normal(mu, var=sigma2);

    beginnodata;
        d_110 = d_ref + (1-gamma)/beta * log(110/mu_eq);
    endnodata;
run;

proc sql;
select
    mean(mu_eq > 110) as prob_mu_eq_above_110 label="P(μ_eq > 110)",
    mean(mu_eq > 150) as prob_mu_eq_above_150 label="P(μ_eq > 150)"
    from post;
quit;

data post_pred_110;
    set post;
    call streaminit(42);
    log_bg_next = log(110) + rand('NORMAL', 0, sqrt(sigma2));
    bg_next = exp(log_bg_next);
    high_flag = (bg_next > 150);
    low_flag  = (bg_next < 70);
run;

proc means data=post_pred_110 noprint;
    var bg_next high_flag low_flag;
    output out=pi_bounds
        p5(bg_next)=lo90 p95(bg_next)=hi90 median(bg_next)=med_bg
        mean(bg_next)=mean_bg std(bg_next)=sd_bg
        mean(high_flag)=pct_high mean(low_flag)=pct_low;
run;

data _null_;
    set pi_bounds;
    call symputx('lo90', put(lo90, 4.0));
    call symputx('hi90', put(hi90, 4.0));
    call symputx('med_bg', put(med_bg, 4.0));
    call symputx('lo1sd', put(mean_bg - sd_bg, 4.0));
    call symputx('hi1sd', put(mean_bg + sd_bg, 4.0));
    call symputx('pct_high', put(pct_high*100, 4.1));
    call symputx('pct_low', put(pct_low*100, 4.1));
run;

title "Expected Variation at Target Dose (d_110)";
proc sgplot data=post_pred_110 noautolegend;
    histogram bg_next / scale=percent
        fillattrs=(color=lightblue) transparency=0.3;
    density bg_next / type=kernel scale=percent
        lineattrs=(color=steelblue thickness=2);

    refline &lo90 / axis=x lineattrs=(color=gold thickness=2 pattern=dash)
        label="5th pct" labelloc=inside labelattrs=(color=gold);
    refline &hi90 / axis=x lineattrs=(color=gold thickness=2 pattern=dash)
        label="95th pct" labelloc=inside labelattrs=(color=gold);

    inset ("90% Interval" = "&lo90 - &hi90 mg/dL"
           "+/- 1 SD" = "&lo1sd - &hi1sd mg/dL"
           "Median" = "&med_bg mg/dL"
           "P(> 150)" = "&pct_high.%"
           "P(< 70)" = "&pct_low.%") / position=topright border;

    xaxis label="Next Blood Glucose Reading (mg/dL)" max=400
        minor minorcount=1 minorgrid minorgridattrs=(pattern=dot color=gray thickness=1);
    yaxis label="Density (%)";
run;
title;

title;
