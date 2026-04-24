---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Dec22 SAS ODA Update - Impact on SASPy Users"
subtitle: ""
summary: ""
authors: []
tags: ["oda", "saspy"]
categories: []
date: 2023-01-09T15:20:00Z
lastmod: 2023-01-09T15:20:00Z
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

During December 2022, SAS ODA received substantial updates - see the [upgrade page](https://support.sas.com/ondemand/upgrade2022.html) for details. It's really nice to see that ODA is now using SAS 9.4M7. If you are a SASPy user, you may now bump into an error while logging in with your existing configuration. The specific error I encountered was "An exception was thrown during the encryption key exchange." Nothing is wrong with your password, however. Due to changes with the AES encryption, SASPy will now need access to 3 encrpytion JARs in its classpath. See [this note](https://sassoftware.github.io/saspy/configuration.html#attn-as-of-saspy-version-3-3-3-the-classpath-is-no-longer-required-in-your-configuration-file) in the official SASPy docs. Download the required JAR files [here](https://support.sas.com/downloads/package.htm?pid=2494) (requires login) and add them to your SASPy package's path here:

```
path/to/python/site-packages/saspy/java/iomclient/
```

Make sure your JAR files are set to executable and you'll be good to go again.
