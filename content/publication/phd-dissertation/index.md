---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Immersed Boundary Simulations and Tools for Studying Insect Flight and Other Applications"
authors: ["D. Michael Senter"]
date: 2021-05-15T11:27:55-04:00
#doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: 2022-08-11T10:45:00-04:00

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ["7"]

# Publication name and optional abbreviated publication name.
publication: "ProQuest Dissertations and Theses"
publication_short: "ProQuest"


# Summary. An optional shortened abstract.
summary: ""

tags: []
categories: []
featured: false

# Custom links (optional).
#   Uncomment and edit lines below to show custom links.
# links:
# - name: Follow
#   url: https://twitter.com
#   icon_pack: fab
#   icon: twitter

url_pdf:
url_code:
url_dataset:
url_poster:
url_project:
url_slides:
url_source:
url_video:

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects: ["meshmerizeme", "clap-and-fling", "metachronal-paddling"]

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
slides: ""
---

All organisms must deal with fluid transport and interaction, whether it be internal, such as lungs moving air for the extraction of oxygen, or external, such as the expansion and contraction of a jellyfish bell for locomotion. Most organisms are highly deformable and their elastic deformations can be used to move fluid, move through fluid, and resist fluid forces. A particularly effective numerical method for biological fluid-structure interaction simulations is the immersed boundary (IB) method. An important feature of this method is that the fluid is discretized separately from the boundary interface, meaning that the two meshes do not need to conform with each other. This thesis covers the development of a new software tool for the semi-automated creation of finite difference meshes of complex 2D geometries for use with immersed boundary solvers IB2d and IBAMR, alongside two examples of locomotion - the flight of tiny insects and the metachronal paddling of brine shrimp.

As mentioned, an advantage of the IB method is that complex geometries, e.g., internal or external morphology, can easily be handled without the need to generate matching grids for both the fluid and the structure. Consequently, the difficulty of modeling the structure lies often in discretizing the boundary of the complex geometry (morphology). Both commercial and open source mesh generators for finite element methods have long been established; however, the traditional immersed boundary method is based on a finite difference discretization of the structure. In chapter 2, I present a software library called MeshmerizeMe for obtaining finite difference discretizations of boundaries for direct use in the 2D immersed boundary method. This library provides tools for extracting such boundaries as discrete mesh points from digital images. Several examples of how the method can be applied are given to demonstrate the effectiveness of the software, including passing flow through the veins of insect wings, within lymphatic capillaries, and around starfish using open-source immersed boundary software.

As an example of insect flight, I present a 3D model of clap and fling. Of the smallest insects filmed in flight, most if not all clap their wings together at the end of the upstroke and fling them apart at the beginning of the downstroke. This motion increases the strength of the leading edge vortices generated during the downstroke and augments the lift. At the Reynolds numbers ($Re$) relevant to flight in these insects (roughly $4<Re<40$), the drag produced during the fling is substantial, although this can be reduced through the presence of wing bristles, chordwise wing flexibility, and more complex wingbeat kinematics. It is not clear how flexibility in the spanwise direction of the wings can alter the lift and drag generated. In chapter 3, a hybrid version of the immersed boundary method with finite elements is used to simulate a 3D idealized clap and fling motion across a range of wing flexibilities. I find that spanwise flexibility, in addition to three-dimensional spanwise flow, can reduce the drag forces produced during the fling while maintaining lift, especially at lower $Re$. While the drag required to fling 2D wings apart may be more than an order of magnitude higher than the force required to translate the wings, this effect is significantly reduced in 3D. Similar to previous studies, dimensionless drag increases dramatically for Re<20, and only moderate increases in lift are observed. Both lift and drag decrease with increasing wing flexibility, but below some threshold, lift decreases much faster. This study highlights the importance of flexibility in both the chordwise and spanwise directions for low Re insect flight. The results also suggest that there is a large aerodynamic cost if insect wings are too flexible.

My second application of locomotion pertains to a 2D model of swimming, specifically the method known as metachronal paddling. This method is used by a variety of organisms to propel themselves through a fluid. This mode of swimming is characterized by an array of appendages that beat out of phase, such as the swimmerets used by long-tailed crustaceans like crayfish and lobster. This form of locomotion is typically observed over a range of Reynolds numbers greater than 1 where the flow is dominated by inertia. The majority of experimental, modeling, and numerical work on metachronal paddling has been conducted on the higher Reynolds number regime (order 100). In this chapter, a simplified numerical model of one of the smaller metachronal swimmers, the brine shrimp, is constructed. Brine shrimp are particularly interesting since they swim at Reynolds numbers on the order of 10 and sprout additional paddling appendages as they grow. The immersed boundary method is used to numerically solve the fluid-structure interaction problem of multiple rigid paddles undergoing cycles of power and return strokes with a constant phase difference and spacing that are based on brine shrimp parameters. Using a phase difference of 8%, the volumetric flux and efficiency per paddle as a function of the Reynolds number and the spacing between legs is quantified. I find that the time to reach periodic steady state for adult brine shrimp is large (approx. 150 stroke cycles) and decreases with decreasing Reynolds number. Both efficiency and average flux increase with Reynolds number. In terms of leg spacing, the average flux decreases with increased spacing while the efficiency is maximized for intermediate leg spacing.
