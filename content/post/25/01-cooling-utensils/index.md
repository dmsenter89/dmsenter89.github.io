---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Cooling Utensils"
subtitle: ""
summary: "A fun physics problem people keep getting wrong, despite knowing all the relevant physics."
authors: []
tags: []
categories: []
date: 2025-01-17
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---

## Background

I have come across an interesting question in a kashrut course that I'm taking.
What I find particularly interesting is the fact that since then, I have shared
the question with many people and barring a solitary exception, the result has
always been the same. The intuitively answer is given, which is incorrect,
_despite_ the person knowing all the relevant physics facts that would lead to
the correct answer. But for some reason, it's not put together. I myself first
answered the question incorrectly, and when it was pointed out to me had to
think about the relevant facts before I was able to really get it. Since I have
already shared this with several people and found it interesting, I thought I'd
write it up here.

The question we had talked about was this: hot food is taken off the stove and
moved into utensils. I put some on a plate and some in a bowl. Which one cools
off to an edible temperature faster, the food on the plate or in the bowl?


## Building Intuition

To make this problem tractable, let's add a few details and make some
assumptions. Let's start with the food. Imagine something that's liquid-y enough
to be able to assume the shape of the container, but thick enough it can hold
its shape on the plate for long enough to solve our problem. Think something
like thick mashed potatos, but with the "spherical cow"-style assumption of it
being homogenous so we don't have to deal with pockets of different densities in
the food. Let's label our scenarios:

1. **Scenario I:** I put the food inside a hemispherical bowl whose internal
   diameter is $r$, so my food takes on a half-sphere shape.
2. **Scenario II:** I turn it upside down onto a plate so that I still have a
   half-sphere of hot food cooling down, just on a flat surface now.

For temperature purposes, imagine the cooked food being very hot -- 70C (158 F)
-- and edible temperature being about 50C (122 F). Air is at a "room
temperature" of 20C (68 F). Image both utensils -- the plate and bowl -- are
made from the same homogenous material with thickness $d$.

The main thing we worry about with cooling is surface area. We know the rate
that heat leaves our system is the surface intergral of the heat flux over the
objects area, i.e.

$$ \dot{Q} = \oint_A q \\,dA.$$

So to make cooling quicker, we either need to manipulate the surface area or
change the heat flux, which depends on the temperature gradient and the
materials involved.

For our purposes, we have two interfaces to deal with: the circular interface
that touches the air in scenario I or the plate in scenario II, and the round
surface that either touches the inside of the bowl in scenario I and the air in
scenario II. By construction of the example those are nice values:
$A_\text{circ} = \pi r^2$ and $A_\text{hemi}= 2 \pi r^2$. With that in hand:

$$\begin{aligned} \dot{Q}\_{I} &= q_b\\, 2 \pi r^2 + q_a \\,\pi r^2 \\\\
\dot{Q}\_{II} &= q_{b}\\, \pi r^2 + q_a \\, 2 \pi r^2 \end{aligned}$$

where $q_b$ is the heat flux at the utensil interface and $q_a$ the heat flux at
the air interface. Since I'm mainly interested in which is faster, I can write
this as a fraction:

$$\frac{\dot{Q}\_{I}}{\dot{Q}\_{II}} = \frac{2 q_b + q_a}{q_b + 2 q_a} $$

Virtually every one I have talked to about this assumes that the plate cools
faster, which for our purposes means the above fraction is less than 1, which is
fulfilled when $q_a < q_b < 0$ (remember that heat is leaving the system, so the
fluxes are negative).

And there is our first snag: most everyone knows that air, like gases in
general, are terrible conductors compared to solid materials, particularly
ceramics and the like that are often used for utensils. As it turns out $|q_b|
\gg |q_a|$ so we could frankly neglect the air interface when thinking about the
cooling time and simply declare the bowl in scenario I the winner without
further work.

### Go Newton

If we really wanted to, we could try to go further and solve something more
precise. [Newton's law of
cooling](https://en.wikipedia.org/wiki/Newton%27s_law_of_cooling), familiar to
all calculus students, let's me calculate the rate of heat loss using only
temperature as

$$ \dot{Q} = - h A \left(T(t) - T_\text{env}\right).$$

With $\dot{Q} = m c \frac{dT}{dt}$ where $m$ is the mass and $c$ is the specific
heat capacity, this gives me an ODE in temperature only as

$$\frac{dT}{dt} = - {\frac{h A}{m c}} \left(T(t) - T_\text{env}\right)$$

which has the solution

$$T(t) = T_\text{env} + \left(T_0 - T_\text{env}\right)\\,\mathrm{exp}(-K t)$$

where $K=hA/mc$. We're only interested in the comparison of  $K_I$ and $K_{II}$,
so it mostly focuses on finding $h$. The heat transfer coefficient of air for
relevant scenarios can be looked up. The question is how to treat the utensil.
It's interesting to know that we can deal with heat transfer through walls by by
an inverse additive relation like this:

$$ \frac{1}{h_\text{b}} = \frac{1}{h_{a}} + \frac{d}{k_b} + \frac{1}{h_f}$$

In this case, $h_a$ is the coefficient for air, $k_b$ is a coefficient for the
utensil material, and $h_f$ the relevant coefficient for the food. Recall that
$d$ is the thickness of the utensil.

While this is fine for a back-of-the-envelope calculation, technically it
doesn't apply. If the [Biot number](https://en.wikipedia.org/wiki/Biot_number)

$$\mathrm{Bi} = h L / k, $$

is less than about 0.1 it is fine to ignore thermal processes inside of bodies
and make the isothermal assumption inherent in the formulation of Newton's law
of cooling.

As per [the literature](https://elibrary.asabe.org/abstract.asp?aid=44130) the
thermal conductivity of mashed potatoes near our target temperatures is
approximately $k =0.58 \mathrm{W} \mathrm{m}^{-1} \mathrm{K}^{-1}$. For our
purposes, the characteristic length can be taken to be the hemisphere volume
over area:

$$L = V/A = \left(\frac 23 \pi r^3 \right) \left( 3 \pi r^2 \right)^{-1} = \frac
2 9 r. $$

The value $h$ should be averaged over the surfaces and I don't feel like doing
that. Let's see how far we got with this:

$$\begin{aligned} \mathrm{Bi} &< 0.1 \\\\ \frac{100}{261} h\\,r &< \frac {1}{10}
\\\\ \Rightarrow h &< 261 / (1000 r) \end{aligned}$$

An Ikea bowl is about 5-6 in in length, so let's use $r=0.07 \mathrm{m}$. With
that we get the Biot number we want when $h<3.7$. Since [even for
air](https://help.solidworks.com/2015/english/SolidWorks/cworks/c_convection_heat_coefficient.htm)
we have $\mathcal{O}\left(h_\text{air}\right)= 10$ this looks like it won't
really hold. Oh well. Being more precise than this is getting to be overkill and
I already spent too much time on this problem.

Long story short: if you want your food to cool faster, maximize surface area
but also maximize surface area in contact with the utensil, not with air.
