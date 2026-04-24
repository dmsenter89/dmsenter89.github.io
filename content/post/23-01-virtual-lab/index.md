---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Setting up a Virtual Lab Computer"
subtitle: ""
summary: ""
authors: []
tags: ["containers", "linux", "networking", "virtual-lab"]
categories: []
date: 2023-01-06T19:00:00Z
lastmod: 2023-01-06T19:00:00Z
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

Dealing with computer resources in a modern lab can be tricky. Even if all participating researchers have laptops, a central location for storage or to host licensed software is desirable. While a physical computer can be setup for such a use, that is not always the most desirable solution. We want multiple people to have concurrent access to our resources while providing safe, sandboxed environments. Sometimes lab members want/need root access to learn certain tasks, but we don't want them to accidentally take down our carefully configured systems. This leads us to the idea of containerization which can provide various failsafes. In this post, we will be setting up the [LXD (ArchWiki)](https://wiki.archlinux.org/title/LXD) environment as a virtual lab computer. This solution gives an entire working system, including systemd, similar to but more lightweight than VirtualBox.

Setting up a successful virtual computer is very similar to setting up a regular Linux machine, with some minor LXD overhead. Note that only the individual administering the containers will need to deal with that LXD overhead. From the point of view of the end user, it'll look the same as if they were interacting with a "regular" computer.  This post deals with the setup from the point of view of the admin. The lab members should be setup as users inside the container and can then SSH into the container or use VNC if a GUI is needed, similar to how they interact with a regular remote computer.

{{< toc >}}

## Install and Setup of LXD
LXD can be installed from a snap with `sudo snap install lxd`, but that requires you to have snap running. On Arch, LXD is available in the repos with `pacman -S lxd`. To get a RPM install in Fedora, you'll need to use an additional COPR repository like this:

```sh
dnf copr enable ganto/lxc4
dnf install lxd
```

Once installed, you'll need to either enable the `lxd.socket` or `lxd.service` (if you want instances to be able to autostart). You'll want to modify the subuid and subgid files so you can run unpriviliged containers (recommended), e.g.:

```sh
# for root user and systemd:
usermod -v 1000000-1000999999 -w 1000000-1000999999 root 
```

With this done, run `lxd init` to go through a configuration guide for your new setup. If this is your first time using LXD, you will likely be fine just using the default settings, except maybe the size of the storage pool - but you can always attach other storage to your containers later, so if you will run tasks producing a lot of data you might want to consider just mounting a dedicated filesystem later. If you have multiple computers available in your lab, you might want to consider turning on [clustering (documentation)](https://linuxcontainers.org/lxd/docs/latest/explanation/clustering/).


For more details, see the [ArchWiki](https://wiki.archlinux.org/title/LXD#Setup) or the [Official Getting Started Guide](https://linuxcontainers.org/lxd/getting-started-cli/#initial-configuration).

## Container Setup
### Getting the Image

The first step in setting up a container is picking a suitable image to start from. Similar to Docker, many distributions are available to chose from. There are also arm and amd64 images available, so you can pick what works with your platform. To list available images on the image server, use the syntax `lxc image list images:<keyword>`.

```sh
# ArchLinux images:
lxc image list images:archlinux amd64 
# Fedora images, using key/value pairs:
lxc image list images:fedora arch=amd64 type=container
```

To create a new image without starting it, use `lxc init <image> <container-name>`. To both initialize and start a new container, use `lxc init <image> <container-name>`. For example:

```sh
# create a base image called myarch without starting:
lxc init images:archlinux myarch
# you can also specify version and arch, e.g. Fedora 36 / 64bit:
lxc init images:fedora/36/amd64 myfedora
# create and launch an image:
lxc init images:rockylinux/9 myrocky
```

Note that you can have a large number of concurrent containers in use, which may but need not share the same base image. This can be useful for larger teams, where you can setup systems for particular tasks or projects. For example, you could have a main machine for your graduate students, a separate one for people moving in and out of the lab like REU students, and a third container for a class that you're teaching to use.

### Basic Container Management

```sh
# Starting, stopping etc. is intuitive
lxc start   <container> # starts container
lxc stop    <container> [--force] # stops the container
lxc restart <container> [--force] # restart
lxc pause   <container> # send SIGSTOP to all container processes

# what containers do I have?
lxc list 
lxc info myarch # get detailed info about this container
lxc copy <name1> <name2> # make a copy of an existing container
lxc delete <container> [--force]

# edit container configuration
lxc config edit <container> # launches config in VISUAL editor
lxc config set <container> <key> <value>  # change a single config item
lxc config device add <container> <dev> <type> <key>=<value>
lxc config show [--expanded] <container>
```

In addition to these commmands, you can also snapshot your containers. This creates a restorable copy of your container in case something bad happens - like someone typing `rm -rf *` into the wrong root shell. By default, snapshots are named in a numbered pattern snapX where X is an integer.

```sh
lxc snapshot <container> <snap> # create new snapshot
lxc restore  <container> <snap> # restore container to snapshot
lxc copy <container>/<snap> <new-container> # new container from snapshot
lxc delete <container>/<snap>   # delete the snapshot
lxc info <container>            # lists available snapshots, plus other info
lxc move <container>/<snap> <container>/<new-snap> # rename snapshot
```

### Setting up the Container
You can enter your container immediately with a root shell with `lxc shell <container>` and proceed with your regular setup, such as updating and installing packages, setting up new users, etc. To make this process more repeatedly, you can also just move a setup script from the host to the container first, and then execute that script inside the container. That way you can have a record of what you did when you first set up the container.

```sh
# drop into root shell
lxc shell <container>
# execute arbitrary command in container
lxc exec <container> -- <program> [<options>]

# move a file from host to container
lxc file push /host/file <container>/path/on/container 
# move a file from container to host
lxc file pull <container>/path/to/file /path/on/host
# edit a file inside container
lxc file edit <container>/etc/passwd 
```

See my earlier blog post for a list of [some CLI tools]({{< relref "/post/22-12-some-cli-tools" >}}) I like to install on new systems.


## Networking
### Giving the Container Access to the Internet
The first step in container networking is to make sure your container can access the network. This may require your firewall to let traffic through on the default bridge. On an ArchLinux host, use 

```sh
ufw route allow in on lxdbr0
ufw allow in on lxdbr0
```
while on a Fedora host you might use 

```sh
firewall-cmd --zone=trusted --change-interface=lxdbr0 --permanent
```

### Network Forwarding
At this point your container is available from the host on wich the LXD service is running. But the whole point of the exercise is to make the container accessible from the lab members' various devices. I'll present two options here for setting this up, depending on whether you need access from outside of your local network or not. Either way, make sure SSH is [set up](https://wiki.archlinux.org/title/OpenSSH) inside your container and you can SSH into the container from the host shell. Both methods rely on using the network forward feature built into LXD. See the [documentation](https://linuxcontainers.org/lxd/docs/master/howto/network_forwards/) for details.

For network forwarding to work we need to know two things about our container: what device our container is using to connect to the internet; on a default setup, this will be lxdbr0 but check with `lxc network list` to be sure. The second item we need is the IP address of our container, which can be displayed with `lxc list <container>`.

The next item we need is an IP address to forward from. We can either get an IP address dedicated to the container, or hijack some ports from our host for re-routing.

To add a second IP to your existing network device, use the `ip a` command to find the device name (on your host) of the network device connected to your network. If you use wifi, this might be something like wlp4s0 or similar. Then pick an IP not otherwise assigned by the router and assign it to this device - in addition to the existing IP - using the following command:
```sh
ip -4 a add dev <device-name> <free-ip>/24
```
Note that this will only persist until the host reboots. You can then create a network forward on the container's device (e.g., lxdbr0) with the newly assigned IP as the listening address. Using this command will let the container handle all incoming traffic to the new IP:

```sh
lxc network forward create lxdbr0 <listening_address>
```

You can then edit the target address with

```sh
lxc network forward edit lxdbr0 <listening_address>
```

and specify the container's IP as the `target_address`.


The alternative method is to use the host's IP as the listening address and then just forward particular ports to the container, e.g. port 22 for SSH or 590x for VNC servers. This way you skip creating the second IP above, and just start by creating and editing a network forward with the the host IP as listening address. The edit can then list the ports you want forwarded. Here's an example of a valid file:

```
description: Sample Forward
config: {}
ports:
- description: ssh
  protocol: tcp
  listen_port: "10022"  # any unused host port
  target_port: "22"    
  target_address: <container-ip>
- description: VNC servers
  protocol: tcp
  listen_port:  105901-105904 # any unused host port
  target_port:  5901-5904   
  target_address: <container-ip>
listen_address: <host-ip>
```

Aside from these forwards, you may consider setting up a [postfix](https://wiki.archlinux.org/title/Postfix) server and associated forward so you can use the mail command to programmatically send emails to users. One great use case for this is the sending of log files after completion of long running jobs. This keeps your users from needing to manually log in and check the status of their jobs. If you have used HPC services at your campus, you may have experienced the utility of this first hand.

Network forwarding options are explained in more detail in the [documentation](https://linuxcontainers.org/lxd/docs/master/howto/network_forwards/#), which also contains a link to a short YouTube video demonstring these commands in a shell session.

## Getting a GUI Running
First, think about whether the tools you use require a GUI. A lot of research work can be done entirely within the command line or by using servers with particular software. So instead of installing a regular RStudio instance, you could install RStudio Server. Jupyter is already designed around the client/server model, as are RDBMS systems. If your team doesn't feel comfortable with ViM and prefers VS Code, use the [remote extension](https://code.visualstudio.com/docs/remote/ssh) to use a VS Code server that can be opened up from your teams' local computers using SSH. 

If you only need a GUI to use one GUI app at a time, say Mathematica/Matlab, then the simplest option will be to use X-forwarding via SSH. Make sure that `X11Forwarding yes` is set in your sshd_config file and restart the sshd service to turn it on. You'll also need to install `xorg-xauth` on an ArchLinux container. From then on, connecting via  SSH with the `-X` flag should work as desired.

If you need an entire desktop environment available, you can set up [VNC](https://wiki.archlinux.org/title/TigerVNC) or [NoMachine](https://wiki.archlinux.org/title/NoMachine) the same way you would for a regular system. I have seen a lot of comments arguing for NoMachine being more performant, but the default TigerVNC on Arch/Fedora has worked sufficiently well for most of my needs.


