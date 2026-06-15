---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Get SSH Keys From Github"
subtitle: ""
summary: ""
authors: []
tags: ["github","ssh"]
categories: []
date: 2024-04-22
lastmod: 2024-04-22
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

Did you know you can get your public SSH keys via GitHub? I recently installed
Ubuntu Server to VM. During the installation process, it asked for my GitHub
username and then populated the authorized_keys file with my public keys. That
was super nifty! My new install never needed to accept password-based logins
and I didn't have to worry about onboarding different machines' keys.
I was curious how it worked and it turns out you can do this directly yourself
via cURL:

```sh
curl https://github.com/${GITUSERNAME}.keys >> ~/.ssh/authorized_keys
```

The same thing works if you have uploaded GPG keys for signing:

```sh
curl https://github.com/${GITUSERNAME}.gpg
```

The GitHub API also exposes this info, but then you'll have to process the
returning JSON if you want to use it for your keys file:

```sh
curl https://api.github.com/users/${GITUSERNAME}/keys
```

Neat!