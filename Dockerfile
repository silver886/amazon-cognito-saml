###########################################################################
# Build development base image
###########################################################################
FROM node:14-alpine AS dev-base

COPY . /var/workdir

WORKDIR /var/workdir

RUN apk add --no-cache --virtual .network-fetch \
    curl

RUN curl -f https://get.pnpm.io/v6.js | node - add --global pnpm@6

RUN apk del .network-fetch

RUN pnpm install --frozen-lockfile

###########################################################################
# Build linter image
###########################################################################
FROM dev-base AS dev-linter

WORKDIR /var/workdir
RUN pnpm lint

###########################################################################
# Build unit test image
###########################################################################
FROM dev-base AS dev-test

WORKDIR /var/workdir
RUN pnpm test

###########################################################################
# Build bundle image
###########################################################################
FROM dev-base

WORKDIR /var/workdir
RUN pnpm bundle
