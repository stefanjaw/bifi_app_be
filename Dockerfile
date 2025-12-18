# use node 22
FROM node:22 AS build

# install dependencies
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

# create app directory
WORKDIR /app

# copy everthing
COPY . .

# clone submodule
RUN git submodule update --progress --init --recursive
RUN git -C ./bifi_app_be checkout nodev22

# install dependencies
RUN npm --prefix ./bifi_app_be install

# install puppeteer dependencies
RUN npx --prefix ./bifi_app_be puppeteer browsers install chrome

# build app
RUN npm --prefix ./bifi_app_be run build

# run app
CMD ["node", "bifi_app_be/dist/index.js"]
