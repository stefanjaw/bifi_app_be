# =========================
# 1️⃣ BUILD STAGE
# =========================
FROM node:22-slim AS build

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# copy files
COPY . .

# update submodule
RUN git submodule update --progress --init --recursive
RUN git -C ./bifi_app_be checkout nodev22

# install dependencies
RUN npm --prefix ./bifi_app_be install

# build
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm --prefix ./bifi_app_be run build

# =========================
# 1️⃣ RUNTIME STAGE
# =========================
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# install fonts + certs for PDF rendering (chromium comes via @sparticuz/chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*


# install dependencies as production
COPY --from=build /app/bifi_app_be/package*.json ./
RUN npm ci --omit=dev

# copy only neccesary for build
COPY --from=build /app/bifi_app_be/dist ./dist

# expose port
EXPOSE 8081

# Puppeteer setup: Skip built-in Chromium download (@sparticuz/chromium provides its own)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# run app
CMD ["node", "dist/index.js"]