FROM node:22 AS build

WORKDIR /app

COPY . .

RUN git submodule update --progress --init --recursive

RUN npm install --verbose

RUN npm run build

CMD ["node", "dist/index.js"]


