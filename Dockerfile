# =========================
# 1️⃣ BUILD STAGE
# =========================
FROM node:22-slim AS build

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git \
    && rm -rf /var/lib/apt/lists/*

# install dependencies
COPY bifi_app_be/package*.json ./bifi_app_be/
RUN npm --prefix ./bifi_app_be install

# copy the rest
COPY . .

# update submodule
RUN git submodule update --progress --init --recursive
RUN git -C ./bifi_app_be checkout nodev22

# build
RUN npm --prefix ./bifi_app_be run build

# =========================
# 1️⃣ RUNTIME STAGE
# =========================
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# install packages for puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*


# install dependencies as production
COPY bifi_app_be/package*.json ./
RUN npm install --omit=dev

# copy only neccesary for build
COPY --from=build /app/bifi_app_be/dist ./dist

# expose port
EXPOSE 8081

# run app
CMD ["node", "dist/index.js"]