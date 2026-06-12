# Planning Stage

1.  Probability and Statistics are hard.

    1.  Examples of counterintuitive nature of stats.

    2.  The limits of point estimates.

    3.  Don't focus on $p$-values or go "star-gazing."

    4.  In real life, the "null hypothesis" is often trivially true for
        larger data sets.

2.  Set up a project folder

    1.  All relevant information in one place. At the end of your
        project, this should include:

        1.  Project Proposal;

        2.  (Lab) notebook, if applicable;

        3.  Data Abstraction Protocol;

        4.  Codebook;

        5.  List of important citations for project;

        6.  Database or CSV files with *raw* data;

        7.  Analysis Scripts.

    2.  Have a backup plan for the data, but beware of accidentally
        backing up PHI to non-secure servers.

3.  Use scientific knowledge to guide variable and model selection.

    1.  No causes in - no causes out.

    2.  Don't collect everything under the sun and do a garbage-can
        regression.

    3.  Draw a DAG. Get help from your research mentor.

    4.  Of the main items on DAG, what can you realistically collect
        during project time span?

    5.  Create as narrow a hypothesis as you can. Avoid vague and
        scientifically uninteresting hypotheses like $\mu_H \neq \mu_0$.

4.  Write a codebook.

    1.  Should be machine readable. No word documents, this is not a
        novel.

    2.  Name variables intelligently.

    3.  Keep variable names consistent and predictable.

    4.  Distinguish control and experiment by an index variable, not by
        renaming all variables.

    5.  Don't use variable values that can lead to mistakes and will
        likely need to be recoded later. E.g., use integer dummy/index
        variable instead of string for group membership.

# Data Collection Stage

1.  Have a data collection/abstraction protocol. Follow it religiously.

    1.  If you have to change something, annotate when and what you
        changed. If you amend protocal, go back and redo previously
        collected data with new protocol - retain notes of changes made.

2.  Store your data in an appropriate format.

    1.  Avoid Excel. Prefer CSV for spreadsheets/tables.

    2.  If possible, utilize REDCap. Talk to your mentor about this.

# Data Validation & Preparation

1.  Load all data into your statistical analysis software of choice and
    perform data validation.

    1.  Are values formatted as expected?

    2.  Are any values missing? Why? Collection error -
        recoverable/non-recoverable?

2.  Handling Missing Data

    1.  Most software defaults to complete case analysis.

        1.  Typically not ideal.

        2.  If you're not careful, you will have different subsets being
            compared to each other without you noticing. This makes your
            results uninterpretable.

    2.  Some Strategies for handling missing data.

    3.  Make sure you mention how you handled missing data.

3.  Handle formatting issues and missing data, creating a *copy* of the
    raw data.

    1.  Don't do this "by hand."

    2.  Document what you do.

    3.  Whatever you do, never overwrite the raw, original data.
