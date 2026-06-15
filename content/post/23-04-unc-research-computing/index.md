---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "UNC Research Computing"
subtitle: "Tips and Links"
summary: "Collection of some advice and resources for working with UNC research computing services."
authors: []
tags: []
categories: []
date: 2021-04-10T10:26:00-04:00
lastmod: 2021-07-26T12:15:00-04:00
featured: false
draft: true

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

Throughout my graduate career I have worked with the various compute clusters 
offered by UNC research computing. Some of the clusters that were online when 
I started are no longer in use while others are came online in my last few years.
There are a variety of links, resources, and commands that are useful so I decided
to put together a few of the ones I used in order to potentially help some others
get started with the clusters I have worked with the most.

*Note:* I might update this post later, but keep in mind that UNC frequently 
updates its offerings, so my notes my not be up-to-date anymore a year or two 
from now.

{{< toc >}} 

## The Compute Offerings

I have used two main clusters: [dogwood](https://its.unc.edu/research-computing/dogwood-cluster/) and [longleaf](https://its.unc.edu/research-computing/longleaf-cluster/). 

In addition to these two compute clusters, UNC also offers a "[Virtual Lab](https://virtuallab.unc.edu/vpn/index.html)." A lot of students don't seem to be aware of the Virtual Lab, but it's actually quite useful. With Virtual Lab, students can use GUI apps from campus remotely. Amongst others, this includes SPSS, Mathematica, Matlab, RStudio, and SAS.

## Connecting with the Clusters

Both dogwood and longleaf are accessible via SSH. If you're on campus, you can just
open up your SSH client and connect with 

```bash
# connecting with dogwood
ssh onyen@dogwood.unc.edu

# connecting with longleaf
ssh onyen@longleaf.unc.edu
```

If you are off-campus, you will need to VPN in first. Both clusters support X11-forwarding (use `ssh -X`), but I haven't found this particularly useful
in my own work.

In additon to accessing them via SSH, dogwood can be accessed via a [dashboard](https://ondemand.rc.unc.edu/). Like the SSH connection, you need to be connected via
VPN before being able to access the dashboard.

## Getting Ready for your Jobs
While you can write code on the clusters, it is much more convenient to write 
your code locally and then upload the code to the cluster. There are a few
ways you can do this. You can use SFTP to move files using a GUI like FileZilla
and pointing it to ```sftp://dogwood.unc.edu/``` or ```sftp://longleaf.unc.edu/```
or if you're on Windows and using MobaXTerm it default connects with FTP when you
SSH in. On the commandline, you could use ```scp``` or ```rsync```.

My preferred way is to take advantage of the fact that both clusters have 
an internet connection and `git` pre-installed. So tend to just make a private
repo for my code, develop locally and then use `git clone` and `git pull` to make
my changes available on the clusters. This gives you version control, which can be
very helpful if something suddenly goes wrong with your code, 

Before being  able to run your jobs, you need to load the appropriate module on
the cluster. To list the software that can be loaded, run the command

```bash
module avail
```

Software is listed as ```name/version```. If the version is omitted, the version followed by "(D)" is loaded. To load a module you use the ```module add``` command, for example

```bash
module add matlab/2021a
```

Jobs that produce a lot of data should run on a scratch space. The location of the
scratch space depends on your ONYEN. For dogwood, the path is 
```bash
 /21dayscratch/scr/j/d/jdoe # assuming your ONYEN is JDOE 
```


For longleaf the scratch space is called "pine" and is mounted under 
```bash
/pine/scr/j/d/jdoe # assuming your ONYEN is JDOE
```

## Using SLURM
Both clusters use SLURM for job submission. You can submit your jobs to the 
queue either from the command line or via a submission script. I recommend 
using the submission script because then you have a long-term record of the
exact settings used for your simulations, which aids in reproducibility.

A basic SLURM script is a bash-script that uses special comment lines 
`#SBATCH` followed by a flag and a setting, loads the module you want to work with
(can be omitted if you already loaded it manually), followed by the actual command
to run your code. Defaults exist for most settings. A sample Matlab submission script
on longleaf could look like this:

```bash
#!/bin/bash

#SBATCH -p general
module add matlab/2021a
matlab -nodesktop -r main
```
Assuming this script is called "myjob.sh", it would be submitted using `sbatch myjob.sh`.


### Parameter Sweeps with ARRAY

One of the most useful SLURM features I have discovered is the ability to use a
single script to start multiple, related jobs. This is particularly useful when
doing parameter sweeps where only a single parameter is meant to be altered for
each set of simulations.