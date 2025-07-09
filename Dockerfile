FROM node:22 as build

WORKDIR /app

COPY . .

RUN git submodule update --progress --init --recursive

RUN npm install --verbose

RUN npm run build

cd dist

node index.js


