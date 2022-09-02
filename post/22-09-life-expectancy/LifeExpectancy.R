## -----------------------------------------------------------------------------
##
## Script name: LifeExpectancy.R
##
## Purpose of script:
##    This script reads in a long form of the Social Security Administration's
##    mortality table (2019) and generates a large number of simulations to give
##    a feel for the 
##
## Author: Dr. Michael Senter
##
## Date Created: 2022-09-01
##
## Copyright (c) Michael Senter, 2022
##
## -----------------------------------------------------------------------------

## Loading libraries -----------------------------------------------------------
library(ggplot2)
library(scales)
library(extraDistr)
library(plyr)
library(dplyr)

## Reading in the source data --------------------------------------------------
mortality <- read.csv("SSAMortalityTable2019.csv")
mortality$Sex <- as.factor(mortality$Sex)

## Survival plot ---------------------------------------------------------------
survivalPlot <- ggplot(mortality, aes(x=Age, y=NumOfLives, group=Sex, color=Sex)) + 
                geom_line() + 
                scale_y_continuous(labels = comma) + labs(y = 'Number of Lives') +
                geom_vline(xintercept=67, linetype='dashed', alpha=0.4) +
                annotate('text', x=65,y=25000, label='Typical Retirement Age',
                         angle=90, size=2.5, alpha=0.7)
ggsave("survivalPlot.png", plot=survivalPlot)

## Create Random Sample for Age at Death----------------------------------------
sample_death <- function(sex, age=0, numWalks=10000) {
  # get vector of probabilities of death given sex and age
  p <- mortality[which(mortality$Age>=age & mortality$Sex==sex),'p']
  random_walk <- replicate(numWalks, rbern(length(p), prob=p))
  idx <- data.frame(which(random_walk==1, arr.ind = TRUE))
  # now select the age of death, need to subtract 1 for death in year tested
  age_at_death <- distinct(idx, col, .keep_all = TRUE)$row - 1 + age
  return(age_at_death)
}

set.seed(1243)
sample_n <- 10000
df <- data.frame(
  age = factor(rep(c(0,25,40,60,80), each=2*sample_n)),
  sex = factor(rep(c("Male", "Female"), each=sample_n)),
  ageAtDeath = c(sample_death("Male", 0, sample_n),
                 sample_death("Female", 0, sample_n),
                 sample_death("Male", 25, sample_n),
                 sample_death("Female", 25, sample_n),
                 sample_death("Male", 40, sample_n),
                 sample_death("Female", 40, sample_n),
                 sample_death("Male", 60, sample_n),
                 sample_death("Female", 60, sample_n),
                 sample_death("Male", 80, sample_n),
                 sample_death("Female", 80, sample_n))
)

## Plot Sample Distribution ----------------------------------------------------
simPlot <- ggplot(df,aes(age,ageAtDeath)) + 
          geom_boxplot(aes(fill=sex), outlier.shape = NA) +
          labs(x='Age Now', y='Age at Death', fill="Sex") +
          ylim(30,120)
ggsave('Sample_Overview.png', plot=simPlot)


## Show Summary statistics for sample by age and sex ---------------------------
sample_summary <- ddply(df, ~age+sex, summarise, 
                Mean=round(mean(ageAtDeath),1), 
                SD=round(sd(ageAtDeath),1), 
                Min=min(ageAtDeath), 
                Q1=quantile(ageAtDeath, 0.25),
                Median=median(ageAtDeath),
                Q3=quantile(ageAtDeath,0.75), 
                Max=max(ageAtDeath))
print("Sample summary by Age and Sex:")
print(sample_summary)

## Distribution for a middle aged worker ---------------------------------------
distributionPlot <- ggplot(df[which(df$age==40),], aes(x=ageAtDeath, color=sex)) +
                    geom_density() +
                    scale_x_continuous(labels=seq(30,120,10), breaks=seq(30,120,10)) +
                    labs(x = "Age at Death", y = 'Density', color="Sex")
ggsave("distributionPlot.png", plot=distributionPlot)

## Percentiles for age 40 ------------------------------------------------------
percentilesAge40 <- ddply(df[which(df$age==40), ], 
                          ~age+sex, summarize,
                          P50=median(ageAtDeath),
                          P60=quantile(ageAtDeath,0.6), 
                          P70=quantile(ageAtDeath,0.7), 
                          P80=quantile(ageAtDeath,0.8), 
                          P90=quantile(ageAtDeath, 0.9),
                          P95=quantile(ageAtDeath,0.95))
print(percentilesAge40)
print(sprintf("Males who live 30 years past retirement: %.2f%%",
              100*(1-ecdf(df[which(df$age==40 & df$sex=='Male'),
                             "ageAtDeath"])(97))))
print(sprintf("Males who live 30 years past retirement: %.2f%%",
              100*(1-ecdf(df[which(df$age==40 & df$sex=='Female'),
                             "ageAtDeath"])(97))))