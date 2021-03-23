---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Using Git with SAS Studio"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2021-01-11T14:42:50-05:00
lastmod: 2021-01-11T14:42:50-05:00
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

Git is a widely used version control system that allows users to track their software 
development in both public and private repositories. It is also increasingly used to store
data in text formats, see for example the [New York Times COVID-19 data set](https://github.com/nytimes/covid-19-data).
This post will briefly demonstrate how to clone and pull updates from a GitHub repository
using the git functions that are built into SAS Studio. 

Git functionality has been built into SAS Studio for a little while, so there are actually
two slightly different iterations of the git functions. The examples in this post will use the versions
compatible with SAS Studio 3.8, which is the current version available at SAS OnDemand for Academics. 
All git functions use the same prefix. In older versions such as SAS Studio 3.8 the prefix is `gitfn_`,
which is followed by a git command such as "clone" or "pull". In SAS Studio 5, the prefix has been 
simplified to just `git_`. Most git functions have the same name between the  
two versions, so that the only difference is the prefix. A complete table of the old and new
versions of the git functions is available [in the documentation](https://go.documentation.sas.com/?cdcId=pgmsascdc&cdcVersion=9.4_3.5&docsetId=lefunctionsref&docsetTarget=n1mlc3f9w9zh9fn13qswiq6hrta0.htm&locale=en#p0evl64wd2dljrn1l43t739qtwba).

We use the git functions by calling them in an otherwise empty DATA step. In other words, we use the 
format

```SAS
data _null_;
    /* use your git functions here */
run;
```

## Cloning a Repo

To clone a repo from github we use `gitfn_clone`. It takes two arguments -
the URL of the repository of interest and the path to an *empty* folder. You can 
have SAS create the folder for you by using `OPTIONS DLCREATEDIR`. The basic 
syntax for the clone is as follows:

```SAS
data _null_;
    rc = gitfn_clone (
     "&repoURL.",    /* URL to repo */
     "&targetDIR."); /* folder to put repo in */
    put rc=;         /* equals 0 if successful */
run;
```   

It doesn't matter if the URL you use ends in ".git" or not. In other words, the
following two macros would both work the same:

```SAS
%LET repoURL=https://github.com/nytimes/covid-19-data;
/* works the same as */
%LET repoURL=https://github.com/nytimes/covid-19-data.git;
```

You can also use password based authentication to pull in private repositories:

```SAS
data _null_;
    rc = gitfn_clone (
     "&repoURL.",   
     "&targetDIR.",
     "&githubUSER.",   /* your GitHub username */
     "&githubPASSW."); /* your GitHub password */
    put rc=;         /* equals 0 if successful */
run;
```

**NOTE:** GitHub is *deprecating* [password-based authentication](https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/); you will need to switch to OAuth authentication or SSH keys
if you are not already using them. To access a repository using an SSH key, use the following:

```SAS
data _null_;                             
 rc = gitfn_clone(
  "&repoURL.",
  "&targetDIR.",
  "&sshUSER.",
  "&sshPASSW.",
  "&sshPUBkey.",
  "&sshPRIVkey.");
 put rc=;
run;
```


## Pull-ing in Updates

It is just as easy to pull in updates to a local repository by using
`gitfn_pull("&repoDIR.")`. This also works with SSH keys for private
repositories:

```SAS
data _null_;
 rc = gitfn_pull(
  "&repoDIR.",
  "&sshUSER.",
  "&sshPASSW.",
  "&sshPUBkey.",
  "&sshPRIVkey.");
run;
```  

## Other Functions

SAS also offers other built-in functions, such as `_diff`, `_status`, `_push`,
`_commit`, and others. For a complete list, see the SAS documentation [here](https://go.documentation.sas.com/?cdcId=pgmsascdc&cdcVersion=9.4_3.5&docsetId=lefunctionsref&docsetTarget=n1mlc3f9w9zh9fn13qswiq6hrta0.htm&locale=en).
