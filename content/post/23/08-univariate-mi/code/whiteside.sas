data whiteside;
	label Insul="Insulation" Temp="Temperature (°C)" Gas="Gas Consumption (cu ft)";
	input Insul $ Temp Gas @@;
    
    if (temp eq 5.0) then R=0;
	else R=1;

datalines;
Before -0.8 7.2 After -0.7 4.8
Before -0.7 6.9 After 0.8 4.6
Before 0.4 6.4 After 1.0 4.7
Before 2.5 6.0 After 1.4 4.0
Before 2.9 5.8 After 1.5 4.2
Before 3.2 5.8 After 1.6 4.2
Before 3.6 5.6 After 2.3 4.1
Before 3.9 4.7 After 2.5 4.0
Before 4.2 5.8 After 2.5 3.5
Before 4.3 5.2 After 3.1 3.2
Before 5.4 4.9 After 3.9 3.9
Before 6.0 4.9 After 4.0 3.5
Before 6.0 4.3 After 4.0 3.7
Before 6.0 4.4 After 4.2 3.5
Before 6.2 4.5 After 4.3 3.5
Before 6.3 4.6 After 4.6 3.7
Before 6.9 3.7 After 4.7 3.5
Before 7.0 3.9 After 4.9 3.4
Before 7.4 4.2 After 4.9 3.7
Before 7.5 4.0 After 4.9 4.0
Before 7.5 3.9 After 5.0 3.6
Before 7.6 3.5 After 5.3 3.7
Before 8.0 4.0 After 6.2 2.8
Before 8.5 3.6 After 7.1 3.0
Before 9.1 3.1 After 7.2 2.8
Before 10.2 2.6 After 7.5 2.6
After 8.0 2.7 After 8.7 2.8
After 8.8 1.3 After 9.7 1.5
; run;

data whiteside_miss;
    set whiteside;
    if R=0 then Gas = .;
run;