---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Setup an Arbitrary WSL2 Distro"
subtitle: "Creating a Custom Setup with Docker and Root filesystem Images"
summary: ""
authors: []
tags: ["archlinux", "fedora", "linux", "windows", "wsl"]
categories: []
date: 2022-11-14T22:34:25-05:00
lastmod: 2022-11-14T22:34:25-05:00
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

[Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/) (WSL) is an important part of my daily work flow. Unfortunately, the main distro supplied by Windows
is Ubuntu, which - for a variety of reasons - is not exactly my favorite distro. Luckily, WSL2 allows you to import an arbitrary Linux distro
to use instead. I got the idea from [an article \(Dev.to\)](https://dev.to/bowmanjd/install-fedora-on-windows-subsystem-for-linux-wsl-4b26)
by Jonathan Bowman explaining how to get Fedora up and running in WSL2. This article summarizes the
key points of Bowman's post and includes information for my long time daily driver, [Arch Linux](https://archlinux.org/).

The short of it is that you can import a root filesystem tarball into WSL2 from Windows terminal
using the following command:

```cmd
wsl --import <distro-name> <distro-target-location> <path-to-tarball>
```

Once imported, you can launch into your distro using `wsl -d <distro-name>`. The only question is 
how to get the root filesystem for this import step.

There are two options we can go with: using a pre-fabricated root filesystem (rootfs), or creating our own
using Docker. 

## Using an Existing Root Filesystem

Some distros publish these. For Arch Linux, you can find them on [GitLab](https://gitlab.archlinux.org/archlinux/archlinux-docker/-/releases).
Two main images are available: base and base-devel. The latter has the base-devel [package group](https://archlinux.org/groups/x86_64/base-devel/) pre-installed.

For Fedora, you can head over to [GitHub](https://github.com/fedora-cloud/docker-brew-fedora/tree/37/x86_64)
to get a copy of the rootfs. Note that for Fedora, the rootfs is merely part of the repo and not a separate release
page. You'll be able to pick your base version of Fedora by switching branches in the repository.

These rootfs images are usually compressed. Before you can use them with WSL2, the tarball needs to be extracted.
The Arch Linux rootfs can be extracted with zstd and the Fedora rootfs can be extracted using 7z.

## Making your Own Root Filesystem

Docker allows you to export a container to a root filesystem tarball:

```sh
docker export -o <rootfs-name>.tar <container-or-image-name>
```
The neat thing here is that you can use either an image or a container name.

Arch Linux images are available from [DockerHub](https://hub.docker.com/_/archlinux). Available 
tags include the above mentioned base and base-devel. Fedora is also available on [DockerHub](https://hub.docker.com/_/fedora)
and its tags include version numbers (e.g., 37 or 36).

## Additional Setup
Once you have imported the distro you only have a barebones system available. Likely only the root user is 
available, which is not ideal. You'll want to install the packages you want to use and set up your own 
user in addition to root. If you are building your own rootfs using Docker, you can build everything
interactively in your container by running `docker run -it <image-name>:<tag>` to drop into a
shell and do all your setup there. Alternatively, you can create a Dockerfile with the basic setup
and build an image from that.

### Arch Linux
Pacman won't work out-of-the-box because it doesn't ship with keys. You'll need to run `pacman-keys --init`
first. Install your favorite software using pacman, e.g.

```sh
pacman -Syu exa htop vim
```

User management and other common setup tasks are covered in the Arch Wiki's [General Recommendations](https://wiki.archlinux.org/title/General_recommendations#System_administration).
Key tasks include [adding a new user](https://wiki.archlinux.org/title/Users_and_groups#User_management):

```sh
useradd -m -G wheel $username
```

### Fedora
Make sure to run `dnf upgrade` to get the latest version of your packages. 
You may need to install either the `util-linux` or `util-linux-core` packages in order to get
the mount command working (used by WSL to mount the Windows filesystem). To be 
able to add a non-root user with a password you'll need to make sure that `passwd` is installed.

To add a non-root user in Fedora, use 

```sh
useradd -G wheel $username 
passwd $username  # in interactive mode, you'll type in your password here
```

### General Case

In order to actually start the WSL instance as your non-root user, you'll need
to edit `/etc/wsl.conf` inside of your distro. If the user section doesn't exist 
yet, you can just run 

```sh
echo -e "\n[user]\ndefault = ${username}\n" >> /etc/wsl.conf
```

Those are the basics to get you up and running. Not everything will necessarily 
work smoothly out-of-the box as you may be missing some packages that you're not
aware of until you need them, but overall I've had a positive experience with this
setup.
