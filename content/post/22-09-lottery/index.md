---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Does it ever make sense to play the Lottery?"
subtitle: "Estimates and the Large Mega-Millions Jackpot"
summary: ""
authors: []
tags: ["analysis", "performance", "probability", "simulation"]
categories: []
date: 2022-09-30T15:40:00-04:00
lastmod: 2022-10-20T13:20:00-04:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

links:
  - icon_pack: fab
    icon: github
    url: https://github.com/dmsenter89/lottery-sims

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

In a first semester probability course, students encounter combinatorics and point estimates such as the mean and median of a data set. A common example is the low odds of winning the lottery. When discussing the topic of point estimates, students are exposed to the idea of a "fair bet" or "fair game" - one in which the expected value of the random variable associated with the game is equal to the cost of participation or zero, depending on if a fixed cost is included in the game or tracked separately. This year, the Mega Millions had a jackpot in excess of one billion dollars. This had me thinking - mathematically, this is likely a fair game. But I still would expect to loose out playing it. In this article, I want to explore this idea further using the Mega Millions lottery as a particular example.

Mega Millions is played by a choosing five numbers from 1 to 70 (the white balls) and one number from 1 to 25 (the golden "Mega Ball"). Five white balls (W) and one golden ball (G) are drawn without replacement twice per week. Prizes are earned by matching the drawn numbers. Payouts generally follow a fixed schedule for everything but the jackpot, at least outside of California where the payouts for all prizes are pari-mutual instead. Below is a table of all possible events as given on the Mega Millions [website](https://www.megamillions.com/How-to-Play.aspx), sorted by increasing odds.

| Event    | Variable |    Value   |      Odds     |
|----------|:--------:|:----------:|:-------------:|
| 5 W + G  |   $x_1$  |   Jackpot  | 1/302,575,350 |
| 5 W      |   $x_2$  | $1,000,000 |  1/12,607,306 |
| 4 W + G  |   $x_3$  |   $10,000  |   1/931,001   |
| 4 W      |   $x_4$  |    $500    |    1/38,792   |
| 3 W + G  |   $x_5$  |    $200    |    1/14,547   |
| 2 W + G  |   $x_6$  |     $10    |     1/693     |
| 3 W      |   $x_7$  |     $10    |     1/606     |
| 1 W + G  |   $x_8$  |     $4     |      1/89     |
| G        |   $x_9$  |     $2     |      1/37     |
| No Match | $x_{10}$ |     $0     |      24/1     |

## The Fair Bet Analysis

A Fair Bet or Fair game is one in which the expected value of the random variable doesn't favor either the player or the house. Given a cost of 2 USD per game,
we can say that Mega Millions is fair when $E[X]=2$, or more specifically when

$$E[X] = \sum_{i=1}^{10} x_i P(X=x_i) = \frac{n}{302\,575\,351}  + \sum_{i=2}^{10} x_i P(X=x_i) = 2$$

I use Maxima to solve for the jackpot representing a fair game and to print a few representative values of the expected value for some jackpot options.

```maxima
/* Define Expectation as dependent on n */
E(n) := n/302575351 + 1000000/12607307 + 10000/931002 +
		500/38793 + 200/14548 +  10/694 + 10/607 + 4/90 + 2/38;
/* solve for fair game */
float(solve(E(n)=2,n));

/* give expected return for different jackpot values */
jackpots : [5e7, 1e8, 2.5e8, 5e8, 7.5e8, 1e9, 2e9];
for i in jackpots do printf(true, "E(~:D) = $~$ ~%", i, E(i))$
```

From this we learn that to have a fair jackpot, we require $n = 531\,123\,698.80$. Even with a fair pet, the expected value is very modest. For example, a 2 billion USD jackpot has $E[X]~=6.85$ - less than 5 USD above the ticket price.

## How long until we Profit?

Most people don't play the lottery to win small amounts like 5 USD. They want to become millionaires. Given that our expected values are so low, let's take a look at how long it will take us to become rich if we take the lottery game route.

### The Geometric Distribution and Our Lottery

Let's start by considering only the events that would result in a win of a million dollars or more. In other words, events $x_1$ and $x_2$. We have

$$P(x_1 \vee x_2) = \frac{315\,182\,658}{3\,814\,660\,340\,689\,757} \approx 8.262\times 10^{-8}. $$

If we are only interested in this outcome, we can treat our outcome as a Bernoulli variable with $p=P(x_1 \vee x_2)$. Then the expected number of games we need to play to win a million dollars or more is distributed like a geometric with $E[G] = 1/p$. For our specific case:

$$ E[G] = \frac 1 p = \frac{3\,814\,660\,340\,689\,757}{315\,182\,658} \approx 12\,103\,014.$$

Recall that two games are played per week. Converting this expected number of games to years, it would take approximately $115\,977$ years for us to win. Even if one drawing were held each day, we would expect to take more than $33\,000$ years to win.

Since the CDF of the geometric distribution is well defined, we can use it to estimate the number of games required for a certain likelihood of having a win of at least a million dollars. To have roughly 50% odds of winning, we need to play about $8\,400\,000$ games of Mega Millions. Note that in this case you would still likely be in the hole since the $1\,000\,000$ USD jackpot is nearly 24 times more likely than the main jackpot and each game costs 2 USD to play.

### Simulating a Lifetime of Playing

At this point you might agree that the lottery is not a good get-rich-quick scheme. That alone doesn't mean that you are all but guaranteed to loose money over a lifetime of playing. So let's run some simulations and see what the distribution of our net worth is after taking everything into account. To make things as fair as possible, we will assume a constant jackpot of 750 million USD.

Let's say you spend 50 years playing the Mega Millions at 2 USD for one ticket at each of the two weekly drawings. That comes out to just about $2\,609$ weeks or $5\,218$ games for a total price of $10\,436$ USD. I simulated $50\,000$ individuals each playing $5\,218$ games for a constant jackpot of $750\,000\,000$ USD - much higher than the [typical jackpot](https://www.megamillions.com/jackpot-history) and advantageous to the players. This will cost them each $10\,436$ USD in ticket costs over the 50 years they play. Yet, despite the simulated lottery being rigged in the players' favor, 99% of my players win less than 600 USD total over this 50 year time period.

|   Statistic   |   Value ($)   |
|---------------|--------------:|
|     Mean      |      -9,169.43|
|      SD       |      20,985.05|
|      Min      |      -9,974.00|
|      25%      |      -9,912.00|
|      50%      |      -9,898.00|
|      75%      |      -9,890.00|
|      99%      |      -9,884.00|
|      Max      |   1,990,204.00|

From these results it is clear that for all but the luckiest few, even just saving the money under a mattress outperforms playing the lottery. You can explore a distribution plot of my simulation with Plotly [here](results.html). Note that this page may take a moment to load due to the many data points. You will need to zoom in on the left-hand side to be able really make anything out.

#### Implementation Note
The number of simulations grows quickly given the $5\,218$ games we are using. Doing $50\,000$ simulations of that many games requires over 260 million random draws. Prototyping in Python often makes sense because of the many features available for analysis and plotting, but this seems like an example where a compiled language might outperform by a considerable amount. I decided to [try this out (GitHub)](https://github.com/dmsenter89/lottery-sims).

All of the programs were written with an emphasis on simplicity over performance so as to avoid biasing the results. Since the different individuals play their games independently, I wrote both a single-threaded C++ version as well as one utilizing OpenMP's parallel for loop. As alternative compiled languages I added implementations in Go and Rust.

For scripting languages I included Python and Julia. In Julia the main loop can trivially be set to run concurrently by prepending `Threads.@threads` to the for loop, so inlcuded that as an option as well. This instructs the Julia interpreter to run this loop with the available threads. By default this is one, but can be set higher using an environment variable or by starting Julia with the `-t` flag and specifying the desired number of threads.

I used [hyperfine (GitHub)](https://github.com/sharkdp/hyperfine) to benchmark the performance of my programs in WSL; see output below for details.

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| C++ (Single Thread) | 4.602 ± 0.087 | 4.514 | 4.828 | 1.88 ± 0.06 |
| C++ (OpenMP) | 2.653 ± 0.170 | 2.506 | 3.092 | 1.08 ± 0.07 |
| Go | 9.362 ± 0.058 | 9.258 | 9.417 | 3.83 ± 0.10 |
| Julia | 28.606 ± 0.372 | 28.198 | 29.520 | 11.69 ± 0.33 |
| Julia (4 Threads) | 19.016 ± 0.274 | 18.673 | 19.511 | 7.77 ± 0.23 |
| Python | 57.727 ± 0.530 |59.783 ± 3.811 | 57.833 | 70.242 | 24.43 ± 1.68 |
| Rust | 2.447 ± 0.062 | 2.391 | 2.579 | 1.00 |

I was surprised by Rust's performance. I only looked up enough Rust to be able to implement this simple example, so I find it surprising that it can keep up with a multi-threaded C++ implementation.

*Updates: This blogpost has been updated with new benchmark values. The original post did not include results in Rust.*
