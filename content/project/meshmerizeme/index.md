---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "MeshmerizeMe"
subtitle: "Creating IB Geometries using Computer Vision"
summary: "Automatic mesh generation from 2D images for use with immersed boundary solvers."
authors: []
tags: []
categories: []
date: 2017-09-20T11:35:06-04:00

# Optional external URL for project (replaces project detail page).
external_link: ""

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Custom links (optional).
#   Uncomment and edit lines below to show custom links.
# links:
# - name: Follow
#   url: https://twitter.com
#   icon_pack: fab
#   icon: twitter

url_code: ""
url_pdf: ""
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: ""
---


[IB2d](https://github.com/nickabattista/IB2d) and
[IBAMR](https://github.com/IBAMR/IBAMR) are two software packages implementing
the immersed boundary method (see below). These packages model fluid-structure
interaction problems based on user given parameters and geometry. The manual
creation of the initial geometry mesh can be difficult and time consuming,
especially for the complex shapes encountered in biological applications.
Oftentimes we have images of the geometry we wish to explore.
I am developing software to help automate the creation of such CFD meshes for
2D simulations with a file-format suitable for use with IB2d and IBAMR from
images. An initial prototype version is available on
[Github](https://github.com/dmsenter89/MeshmerizeMe). A paper
exploring the use of MeshmerizeMe in conjuction with IB2d for simulations is
in preparation.

## Usage

MeshmerizeMe needs two input files per experimental geometry: an SVG image file
with the geometry of interest and an input2d file with the experiment parameters.
When selecting an SVG for use with MeshmerizeMe it will automatically look for
the input2d file in the same folder. It will then parse the paths, transform
them into the correct coordinate system and appropriately sample the paths based
on the size of the Cartesian grid set in the input2d file. The geometry will be
exported as a vertex file. This file is readable by both IB2d and IBAMR.

SVGs were chosen as the image source as the are an open, text-based format
making them very accesible to work with. They are standardized for web use and
many tools exist for creating and manipulating SVG images. They can be created
from source images such as photographs or scans by means of edge detection tools
and by manually tracing the outline of a shape of interest
Consider optimizing the SVG prior to processing to save time.

As the current version of MeshmerizeMe only handles a subset of SVG, tools that
optimize the SVG files created by your editor are very useful. Examples of such
software include  [SVGO](https://github.com/svg/svgo), which also offers a
webapp  called [SVGOMG](https://jakearchibald.github.io/svgomg/).
Another software is [svgcleaner](https://github.com/RazrFalcon/svgcleaner).

## IBM Background

One aspect of computational fluid dynamics is the investigation of
fluid-structure interactions. One method developed for the study of such
interactions is the immersed boundary method (IBM) developed by Peskin[^1].
It is well known that fluids can be studied from both a Eulerian and a
Lagrangian view. The IBM combines these - the domain of the problem is resolved
as a Cartesian grid on which Eulerian equations are solved for fluid velocity
and pressure. In the case of Newtonian fluids the incompressible Navier-Stokes
equations comprising of

$$ \rho  \left( \frac{\partial \mathbf{u}}{\partial t} + \mathbf{u} \cdot \nabla \mathbf{u} \right)  = - \nabla \mathbf{p} + \mu \nabla^2 \mathbf{u} + \mathbf{f}$$

and

$$\nabla \cdot \mathbf{u} = 0$$

need to be solved.

The immersed structures are modeled as fibers in the form of parametric
curves $X(s,t)$, where $s$ is a parameter and $t$ is time. The fiber experiences
force distributions $F(s,t)$, and we can derive the force the fiber exerts on
the fluid from the momentum equation. For the fibers we then solve

$$\mathbf{f} = \int_\Gamma \mathbf{F}(s,t)\,\delta\left(\mathbf{x}-\mathbf{X}(s,t)\right)\,ds$$

and

$$\frac{\partial \mathbf{X}}{\partial t} = \int_\Omega \mathbf{u}(\mathbf{x},t)\, \delta \left( \mathbf{x}-\mathbf{X}(s,t)\right)\,d\mathbf{x}.$$

Here, $\Gamma$ is the immersed structure and $\Omega$ is the fluid domain.

The immersed structures are discretized not on a Cartesian grid but on a
separate Lagrangian grid on the fiber itself. Of import to CFD software users
is that the initial discretization of the immersed structure has to be
supplied by the user. While this is not too difficult for simple geometries,
the often complex structures encountered in mathematical biology can present
a significant time investment. This is the part where MeshmerizeMe comes in
handy.

[^1]: Charles S Peskin. 2002. "The immersed boundary method." *Acta numerica* 11:479-517.
