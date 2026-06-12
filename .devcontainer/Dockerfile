# Hugo + Go image for building this site.
# Go is required because the PaperMod theme is pulled in as a Hugo Module.
# Keep HUGO_VERSION in sync with .github/workflows/hugo.yml.
FROM mcr.microsoft.com/devcontainers/go:1-bookworm

ARG HUGO_VERSION=0.163.0
RUN wget -qO /tmp/hugo.deb \
      https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
    && dpkg -i /tmp/hugo.deb \
    && rm /tmp/hugo.deb

EXPOSE 1313
