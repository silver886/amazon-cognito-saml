###########################################################################
# Build development base image
###########################################################################
FROM node:18-alpine AS base

COPY . /var/workdir
COPY .npmrc /usr/local/etc/npmrc

WORKDIR /var/workdir

ENV PNPM_VERSION=7.28.0
ENV PNPM_HOME=/usr/local/bin
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$(mktemp)" SHELL="$(which sh)" sh -s --

RUN pnpm install --frozen-lockfile

###########################################################################
# Build linter image
###########################################################################
FROM dev-base AS dev-linter

RUN pnpm lint

###########################################################################
# Build unit test image
###########################################################################
FROM dev-base AS dev-test

RUN pnpm test

###########################################################################
# Build bundle image
###########################################################################
FROM dev-base

RUN pnpm bundle
