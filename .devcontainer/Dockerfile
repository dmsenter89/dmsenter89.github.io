# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.245.2/containers/go/.devcontainer/base.Dockerfile

# [Choice] Go version (use -bullseye variants on local arm64/Apple Silicon): 1, 1.19, 1.18, 1-bullseye, 1.19-bullseye, 1.18-bullseye, 1-buster, 1.19-buster, 1.18-buster
FROM mcr.microsoft.com/devcontainers/go:0-1-bullseye

# Keep this in sync with HUGO_VERSION in .github/workflows/hugo.yml
ARG HUGO_VERSION=0.148.2
RUN wget -qcO /opt/hugo_release.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb

# [Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
      && dpkg -i /opt/hugo_release.deb
#     && apt-get -y install --no-install-recommends <your-package-list-here>

EXPOSE 1313

# [Optional] Uncomment the next lines to use go get to install anything else you need
USER vscode
# RUN go get -x <your-dependency-or-tool>

# Install lmt tool for markdown linting
RUN curl -L -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \
      https://api.github.com/repos/driusan/lmt/tarball/62fe18f | tar -xz -C ~ \
      && cd ~/driusan-lmt-62fe18f \
      && go mod init github.com/driusan/lmt \
      && go mod tidy \
      && go install

# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1
