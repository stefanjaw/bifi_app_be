# =========================
# 1️⃣ BUILD STAGE
# =========================
FROM node:22-slim AS build

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# copy files
COPY bifi_app_be/package*.json ./bifi_app_be/

# update submodule
RUN git submodule update --progress --init --recursive
RUN git -C ./bifi_app_be checkout nodev22

# install dependencies
RUN npm --prefix ./bifi_app_be install

# copy files
COPY . .

# build
RUN npm --prefix ./bifi_app_be run build

# =========================
# 1️⃣ RUNTIME STAGE
# =========================
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# install packages for puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*


# install dependencies as production
COPY --from=build /app/bifi_app_be/package*.json ./
RUN npm ci --omit=dev

# copy only neccesary for build
COPY --from=build /app/bifi_app_be/dist ./dist

# expose port
EXPOSE 8081

# Puppeteer setup: Skip Chromium download and use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

# run app
CMD ["node", "dist/index.js"]