---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Sharing SSH Keys With a Devcontainer"
subtitle: ""
summary: ""
authors: []
tags: []
categories: []
date: 2023-04-04
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

VS Code devcontainers are a great resource for creating reusable containers to share between developers on the same project. When properly setup, it automatically passes your SSH credentials to the container. When this is not set up, the git push/pull functionality in VS Code won't work (you will still be able to make commits in the devcontainer and then push/pull from the CLI you launched Code with).

The way to do this is to use an SSH agent to forward your credentials. On most systems these aren't started automatically, so for convenience you will probably want to add the start up to your `.bash_profile` or `.bashrc`. 

I have found the following useful; it includes a short check to make sure you aren't running multiple ssh-agents in one session:

```bash
SSH_ENV="$HOME/.ssh/agent-environment"

function start_agent {
    echo "Initialising new SSH agent..."
    /usr/bin/ssh-agent | sed 's/^echo/#echo/' > "${SSH_ENV}"
    echo succeeded
    chmod 600 "${SSH_ENV}"
    . "${SSH_ENV}" > /dev/null
    /usr/bin/ssh-add;
}

# Source SSH settings, if applicable
if [ -f "${SSH_ENV}" ]; then
    . "${SSH_ENV}" > /dev/null
    ps -ef | grep ${SSH_AGENT_PID} | grep ssh-agent$ > /dev/null || {
        start_agent;
    }
else
    start_agent;
fi
```

You can verify that your keys are working by running `ssh-add -l` from the VS Code terminal. This should print your host SSH key.

See also the [official documentation](https://code.visualstudio.com/remote/advancedcontainers/sharing-git-credentials).
