---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "A semi-automated finite difference mesh creation method for use with immersed boundary software IB2d and IBAMR"
authors: ["D. Michael Senter", "Dylan Ray Douglas", "W. Christopher Strickland", "Steven G. Thomas", "Anne M Talkington", "Laura Miller"]
date: 2020-08-03T11:27:55-04:00
doi: "10.1088/1748-3190/ababb0"

# Schedule page publish date (NOT publication's date).
publishDate: 2020-08-05T11:27:55-04:00

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ["2"]

# Publication name and optional abbreviated publication name.
publication: "*Bioinspiration & Biomimetics*"
publication_short: ""

abstract: "Numerous fluid-structure interaction problems in biology have been investigated using the immersed boundary method. The advantage of this method is that complex geometries, e.g., internal or external morphology, can easily be handled without the need to generate matching grids for both the fluid and the structure. Consequently, the difficulty of modeling the structure lies often in discretizing the boundary of the complex geometry (morphology). Both commercial and open source mesh generators for finite element methods have long been established; however, the traditional immersed boundary method is based on a finite difference discretization of the structure. Here we present a software library for obtaining finite difference discretizations of boundaries for direct use in the 2D immersed boundary method. This library provides tools for extracting such boundaries as discrete mesh points from digital images. We give several examples of how the method can be applied that include passing flow through the veins of insect wings, within lymphatic capillaries, and around starfish using open-source immersed boundary software."

# Summary. An optional shortened abstract.
summary: ""

tags: []
categories: []
featured: true

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
projects: ["meshmerizeme"]

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
slides: ""
---
