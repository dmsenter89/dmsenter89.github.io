---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Automatic Suspend in Fedora 38"
subtitle: "And why I'm going back to Arch Linux"
summary: ""
authors: []
tags: ["arch-linux", "fedora", "gnome", "linux"]
categories: []
date: 2023-12-18
lastmod: 2023-12-18
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

For a while now I've recycled an old iMac running Fedora Workstation as a simple homeserver. It's been working well in the past, but just now with the EOL of Fedora 37 did I get around to updating from Fedora 36 to Fedora 38.  

Unfortuantely for my use case, there is an unannounced change in Gnome's powersettings when moving to Fedora 38 from 37. See the [fedora forum](https://discussion.fedoraproject.org/t/gnome-suspends-after-15-minutes-of-user-inactivity-even-on-ac-power/79801) for a description of the issue and a suggested fix. Unforunately, for me at least, the suggested fix doesn't work and my system would still suspend, even with it disabled via the suggested commands. I had to use gsettings directly from my user account in addition to the the linked fix to get it to work and persist. 

Only a couple of weeks after getting this fixed, that workstation suffered a hard drive failure that caused it to become unbootable. I have sinced scrapped that workstation and bought a [Beelink](https://www.bee-link.com/) mini-pc for about $200. I'm running Arch Linux on it. 

I had previously used Arch extensively as my daily driver and for various other machines, and never had problems with. My recent Fedora experience really drove me back to committing to Arch. Does Arch take longer to install and set up than Fedora? Sure. But it's well documented and you actually understand the system you have and what packages are on it. It's actually a transparent system, unlike the convenience-packaged distros with all their preinstalled stuff. You see so many people online worried about Arch not being "stable," but in over ten years with different desktops and laptops running on Arch I haven't had any major issues. Truth be told, I've had fewer issues with Arch than in the past five years with Ubuntu and Fedora systems. 

A particular example of something nice about Arch Linux: I have a ten year old workstation running on Arch that hadn't booted in 4 years. The only difficulty in getting it up and running again was updating the archlinux-keyring for pacman. That didn't take long and was well-documented. Since then, it's humming along great with more up-to-date software than recent Ubuntu releases. Updating Fedora from 36 to 38 on the other hand was much more of a hassle. I had multiple reboots, hunting for what default packages changed, what changed without being documented, etc. My older Arch system got up and running in no time after scanning through the Arch Linux news for any required manual interventions that popped up in the past few years. Arch for the win.

